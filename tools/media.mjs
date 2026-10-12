/* ==========================================================================
   TOMASXCANALES · tubería de medios

       npm run media            genera lo que falte o haya cambiado
       npm run media -- --force regenera todo
       npm run media -- --clean además borra derivados huérfanos

   Lee content/ (a través de tools/lib/content.mjs) y escribe en
   static/media/<obra>/ lo que sirve la web. Los originales NUNCA se tocan.

   Imagen (sharp)
     - recorte editorial opcional ("crop": {"bottom": 0.07}) para sacar del
       cuadro lo que no es la obra; la imagen no se retoca
     - anchos 480 / 800 / 1200 / 1800, sin ampliar nunca por encima del
       original: una foto de 1170 px genera 480 / 800 / 1170
     - AVIF + WebP + JPEG de respaldo, y el color medio (fondo mientras carga)

   Vídeo (FFmpeg)
     - "trim": [inicio, fin] y "crop": {w,h,x,y} para quitar negros y
       subtítulos incrustados
     - sin audio, 30 fps como mucho, +faststart
     - MP4 H.264 + WebM VP9 + MP4 de 480 px para móvil
     - póster del fotograma indicado ("poster": segundos desde el inicio del
       tramo) en JPEG; en AVIF/WebP y dos anchos solo si se muestra como
       foto (ver posterSubset)
     - "scrub": true añade una versión con un keyframe cada 5 cuadros, para
       atar el tiempo del vídeo al scroll sin tirones

   Audio (FFmpeg): Opus en WebM + AAC en M4A.

   Es incremental: cada derivado guarda una huella de sus parámetros en
   content/.generated/media.json y solo se rehace si cambian o faltan.
   ========================================================================== */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { mkdir, stat, readdir, rm, writeFile, readFile } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import sharp from "sharp";
import {
  ROOT, MEDIA_OUT, MANIFEST, loadContent, publishableMedia, mediaBaseName, loadManifest
} from "./lib/content.mjs";

const run = promisify(execFile);
const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const CLEAN = args.has("--clean");

const WIDTHS = [480, 800, 1200, 1800];
const PIPELINE_VERSION = 3; // súbelo si cambian los ajustes de codificación

sharp.cache(false);

/* ------------------------------------------------------------ utilidades */
async function exists(p) { try { await stat(p); return true; } catch { return false; } }
const kb = async (p) => { try { return (await stat(p)).size / 1024; } catch { return 0; } };

async function ff(argv) {
  try {
    await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...argv], { maxBuffer: 1 << 26 });
  } catch (err) {
    throw new Error(`ffmpeg falló:\n  ffmpeg ${argv.join(" ")}\n  ${err.stderr || err.message}`);
  }
}

async function probe(file) {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration",
    "-of", "json", file
  ]);
  const j = JSON.parse(stdout);
  const v = j.streams.find((s) => s.codec_type === "video");
  const [n, d] = (v?.r_frame_rate || "30/1").split("/").map(Number);
  return { width: v?.width, height: v?.height, fps: d ? n / d : 30, duration: parseFloat(j.format.duration) };
}

function fingerprint(m, extra = {}) {
  const payload = JSON.stringify({ v: PIPELINE_VERSION, src: m.src, crop: m.crop, trim: m.trim, poster: m.poster, scrub: m.scrub, type: m.type, ...extra });
  return createHash("sha1").update(payload).digest("hex").slice(0, 12);
}

/* ---------------------------------------------------------------- imagen */
async function processImage(m, outDir, base) {
  const src = sharp(m.abs, { failOn: "none" }).rotate();
  const meta = await src.metadata();
  // orientación ya aplicada: si la foto venía girada, ancho y alto se cruzan
  let W = meta.autoOrient?.width ?? meta.width;
  let H = meta.autoOrient?.height ?? meta.height;

  let region = null;
  if (m.crop) {
    const c = m.crop;
    if (c.w && c.h) region = { left: c.x || 0, top: c.y || 0, width: c.w, height: c.h };
    else {
      const left = Math.round(W * (c.left || 0));
      const top = Math.round(H * (c.top || 0));
      const width = Math.round(W * (1 - (c.left || 0) - (c.right || 0)));
      const height = Math.round(H * (1 - (c.top || 0) - (c.bottom || 0)));
      region = { left, top, width, height };
    }
    W = region.width;
    H = region.height;
  }

  const widths = WIDTHS.filter((w) => w < W);
  if (!widths.length || W - widths[widths.length - 1] > 120) widths.push(Math.min(W, 1800));
  const uniq = [...new Set(widths)].filter((w) => w <= W).sort((a, b) => a - b);

  const pipeline = () => {
    let p = sharp(m.abs, { failOn: "none" }).rotate();
    if (region) p = p.extract(region);
    return p;
  };

  for (const w of uniq) {
    const resized = pipeline().resize({ width: w, withoutEnlargement: true });
    const stem = join(outDir, `${base}-${w}`);
    await Promise.all([
      resized.clone().jpeg({ quality: w <= 800 ? 80 : 78, mozjpeg: true, progressive: true }).toFile(`${stem}.jpg`),
      resized.clone().webp({ quality: 76, effort: 5 }).toFile(`${stem}.webp`),
      resized.clone().avif({ quality: 48, effort: 4, chromaSubsampling: "4:2:0" }).toFile(`${stem}.avif`)
    ]);
  }

  const { data } = await pipeline().resize(1, 1, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const color = "#" + [...data.slice(0, 3)].map((v) => v.toString(16).padStart(2, "0")).join("");
  return { kind: "image", w: W, h: H, widths: uniq, color };
}

/* ------------------------------------------------------------------ vídeo */
const POSTER_FORMATS = ["jpg", "webp", "avif"];

async function processVideo(m, outDir, base, plan) {
  const info = await probe(m.abs);
  const [t0, t1] = m.trim || [0, info.duration];
  const dur = Math.max(0.1, Math.min(t1, info.duration) - t0);
  const fps = Math.min(30, Math.round(info.fps));
  let W = info.width, H = info.height;

  const filters = [];
  if (m.crop) { filters.push(`crop=${m.crop.w}:${m.crop.h}:${m.crop.x || 0}:${m.crop.y || 0}`); W = m.crop.w; H = m.crop.h; }
  const vf = (targetW) => {
    const f = [...filters];
    if (targetW && W > targetW) f.push(`scale=${targetW}:-2:flags=lanczos`);
    f.push("format=yuv420p");
    return f.join(",");
  };
  const outW = Math.min(W, 720);
  const outH = Math.round((H * outW) / W / 2) * 2;
  const seek = ["-ss", t0.toFixed(3), "-t", dur.toFixed(3)];
  const hero = m.role.includes("hero");

  await ff([...seek, "-i", m.abs, "-an", "-r", String(fps), "-vf", vf(720),
    "-c:v", "libx264", "-crf", hero ? "21" : "23", "-preset", "slow", "-profile:v", "high",
    "-movflags", "+faststart", join(outDir, `${base}.mp4`)]);

  await ff([...seek, "-i", m.abs, "-an", "-r", String(fps), "-vf", vf(720),
    "-c:v", "libvpx-vp9", "-crf", hero ? "31" : "33", "-b:v", "0", "-row-mt", "1",
    "-deadline", "good", "-cpu-used", "2", join(outDir, `${base}.webm`)]);

  await ff([...seek, "-i", m.abs, "-an", "-r", String(fps), "-vf", vf(480),
    "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-profile:v", "main",
    "-movflags", "+faststart", join(outDir, `${base}-480.mp4`)]);

  if (m.scrub) {
    await ff([...seek, "-i", m.abs, "-an", "-r", "24", "-vf", vf(540),
      "-c:v", "libx264", "-crf", "27", "-preset", "slow", "-g", "5", "-keyint_min", "5",
      "-sc_threshold", "0", "-profile:v", "high", "-movflags", "+faststart",
      join(outDir, `${base}-scrub.mp4`)]);
  }

  // póster: el fotograma indicado, relativo al inicio del tramo
  const at = Math.min(dur - 0.05, Math.max(0, m.poster ?? 0));
  const { stdout: png } = await run("ffmpeg", [
    "-v", "error", "-ss", (t0 + at).toFixed(3), "-i", m.abs, "-frames:v", "1",
    ...(filters.length ? ["-vf", filters.join(",")] : []),
    "-f", "image2pipe", "-vcodec", "png", "-"
  ], { encoding: "buffer", maxBuffer: 1 << 26 });
  const allWidths = [...new Set([Math.min(480, W), Math.min(W, 720)])];
  const { widths: posterWidths, formats } = posterSubset(allWidths, plan);
  for (const w of posterWidths) {
    const img = sharp(png).resize({ width: w, withoutEnlargement: true });
    const stem = join(outDir, `${base}-poster-${w}`);
    await Promise.all(formats.map((f) =>
      f === "jpg" ? img.clone().jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(`${stem}.jpg`)
        : f === "webp" ? img.clone().webp({ quality: 76 }).toFile(`${stem}.webp`)
          : img.clone().avif({ quality: 50, effort: 4 }).toFile(`${stem}.avif`)));
  }
  const { data } = await sharp(png).resize(1, 1).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const color = "#" + [...data.slice(0, 3)].map((v) => v.toString(16).padStart(2, "0")).join("");

  return {
    kind: "video", w: outW, h: outH, duration: +dur.toFixed(2), fps,
    scrub: !!m.scrub, poster: { widths: posterWidths, allWidths, formats, w: outW, h: outH }, color
  };
}

/* Qué pósters se publican de cada vídeo (lo demás nunca lo pediría nadie):
   - todos: el JPG grande (atributo poster, sitemap y JSON-LD)
   - fondo difuminado de una escena de la home (intro, film): también el
     JPG de 480, que es el que usan esas escenas
   - portada de una obra que solo existe en vídeo: el juego completo
     (AVIF/WebP/JPEG en 480 y 720), porque se muestra como foto con srcset */
function posterSubset(allWidths, plan) {
  return {
    widths: plan.small ? allWidths : [allWidths[allWidths.length - 1]],
    formats: plan.still ? POSTER_FORMATS : ["jpg"]
  };
}

/** El manifiesto anterior con el juego de pósters que pide el plan actual. */
function withPosterPlan(e, plan) {
  if (!e || e.kind !== "video") return e;
  const allWidths = e.poster.allWidths || e.poster.widths;
  return { ...e, poster: { ...e.poster, allWidths, ...posterSubset(allWidths, plan) } };
}

/* ------------------------------------------------------------------ audio */
async function processAudio(m, outDir, base) {
  const info = await probe(m.abs);
  const [t0, t1] = m.trim || [0, info.duration];
  const dur = Math.min(t1, info.duration) - t0;
  const seek = ["-ss", t0.toFixed(3), "-t", dur.toFixed(3)];
  await ff([...seek, "-i", m.abs, "-vn", "-c:a", "libopus", "-b:a", "64k", join(outDir, `${base}.webm`)]);
  await ff([...seek, "-i", m.abs, "-vn", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", join(outDir, `${base}.m4a`)]);
  return { kind: "audio", duration: +dur.toFixed(2) };
}

/* ------------------------------------------------------------ orquestación */
function expectedFiles(entry, base) {
  if (entry.kind === "image") return entry.widths.flatMap((w) => ["jpg", "webp", "avif"].map((e) => `${base}-${w}.${e}`));
  if (entry.kind === "video") return [
    `${base}.mp4`, `${base}.webm`, `${base}-480.mp4`,
    ...(entry.scrub ? [`${base}-scrub.mp4`] : []),
    ...entry.poster.widths.flatMap((w) => (entry.poster.formats || POSTER_FORMATS).map((e) => `${base}-poster-${w}.${e}`))
  ];
  if (entry.kind === "audio") return [`${base}.webm`, `${base}.m4a`];
  return [];
}

const content = await loadContent();
const manifest = await loadManifest();
const next = { generatedAt: new Date().toISOString(), items: {} };
const media = publishableMedia(content);

// vídeos cuyo póster se ve como foto (portadas) o como fondo de escena
const stills = new Set(content.published.map((w) => `${w.slug}/${w.cover}`));
const ambient = new Set(content.exhibition.scenes
  .filter((s) => s.kind === "intro" || s.kind === "film")
  .map((s) => `${s.work}/${s.media}`));
const posterPlan = (m) => ({ still: stills.has(m.key), small: stills.has(m.key) || ambient.has(m.key) });

console.log(`Medios publicables: ${media.length}\n`);
let made = 0, kept = 0;

for (const m of media) {
  const outDir = join(MEDIA_OUT, m.scope);
  await mkdir(outDir, { recursive: true });
  const base = mediaBaseName(m);
  const hash = fingerprint(m);
  const plan = posterPlan(m);
  const prev = withPosterPlan(manifest.items[m.key], plan);

  let fresh = !FORCE && prev && prev.hash === hash;
  if (fresh) {
    for (const f of expectedFiles(prev, base)) if (!(await exists(join(outDir, f)))) { fresh = false; break; }
  }

  let entry;
  if (fresh) {
    entry = prev; kept++;
  } else {
    const t = Date.now();
    process.stdout.write(`  ${m.key.padEnd(44)} `);
    if (m.type === "image") entry = await processImage(m, outDir, base);
    else if (m.type === "video") entry = await processVideo(m, outDir, base, plan);
    else entry = await processAudio(m, outDir, base);
    const size = (await Promise.all(expectedFiles(entry, base).map((f) => kb(join(outDir, f))))).reduce((a, b) => a + b, 0);
    console.log(`${entry.kind.padEnd(6)} ${String(Math.round(size)).padStart(6)} KB  ${((Date.now() - t) / 1000).toFixed(1)} s`);
    made++;
  }
  next.items[m.key] = { ...entry, hash, base: `/media/${m.scope}/${base}`, files: expectedFiles(entry, base) };
}

await mkdir(dirname(MANIFEST), { recursive: true });
await writeFile(MANIFEST, JSON.stringify(next, null, 2));
console.log(`\n${made} generados, ${kept} al día. Manifiesto: ${relative(ROOT, MANIFEST)}`);

/* -------------------------------------------------------------- limpieza */
if (CLEAN) {
  const keep = new Set(Object.values(next.items).flatMap((e) => e.files.map((f) => join(MEDIA_OUT, e.base.split("/")[2], f))));
  let removed = 0;
  for (const dir of await readdir(MEDIA_OUT, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name === "brand") continue;
    for (const f of await readdir(join(MEDIA_OUT, dir.name))) {
      const p = join(MEDIA_OUT, dir.name, f);
      if (!keep.has(p)) { await rm(p); removed++; }
    }
  }
  console.log(`Limpieza: ${removed} derivados huérfanos borrados.`);
}
