/* ==========================================================================
   TOMASXCANALES · generador de páginas

       npm run generate     (también lo lanzan dev y build)

   content/ + tools/site/*  ->  index.html, work/**, about/, booking/, 404.html
                                static/sitemap.xml, static/robots.txt,
                                static/site.webmanifest, static/media/brand/*

   Las páginas siguen siendo HTML estático real: todo el texto, los alt y los
   datos estructurados están en el marcado. Vite solo empaqueta CSS/JS.
   Solo escribe un archivo si su contenido ha cambiado, para no provocar
   recargas inútiles en desarrollo.
   ========================================================================== */

import { mkdir, readFile, writeFile, readdir, rm, stat } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import sharp from "sharp";
import { ROOT, loadContent, loadManifest } from "./lib/content.mjs";
import { setManifest, entry, imageURL, esc } from "./site/html.mjs";
import { GENERATED } from "./site/layout.mjs";
import { renderHome } from "./site/home.mjs";
import { renderWork, renderArchive, renderAbout, renderBooking, renderNotFound } from "./site/pages.mjs";
import { LEGAL_PAGES, renderLegalNotice, renderPrivacy, renderCookies } from "./site/legal.mjs";
import { LUNA_PATH, SUN_X } from "./site/symbols.mjs";

const t0 = Date.now();
const written = [];

async function put(file, text) {
  const abs = join(ROOT, file);
  let prev = null;
  try { prev = await readFile(abs, "utf8"); } catch {}
  if (prev === text) return;
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, text);
  written.push(file);
}

async function exists(p) { try { await stat(p); return true; } catch { return false; } }

/* ------------------------------------------------------------- contenido */
const ctx = await loadContent();
const manifest = await loadManifest();
setManifest(manifest);
const { site, published } = ctx;

/* --------------------------------------------------------------- páginas */
await put("index.html", renderHome(ctx));
await put("work/index.html", renderArchive(ctx));
for (const [i, w] of published.entries()) await put(`work/${w.slug}/index.html`, renderWork(ctx, w, i));
await put("about/index.html", renderAbout(ctx));
await put("booking/index.html", renderBooking(ctx));
await put("404.html", renderNotFound(ctx));
// Legales: noindex y fuera del sitemap (ver tools/site/legal.mjs)
const [notice, privacy, cookies] = LEGAL_PAGES;
await put(notice.file, renderLegalNotice(ctx));
await put(privacy.file, renderPrivacy(ctx));
await put(cookies.file, renderCookies(ctx));

/* Obras que dejaron de publicarse: se borra su carpeta SOLO si la generó
   este script (lleva la marca GENERATED); nada escrito a mano se toca. */
const keep = new Set(published.map((w) => w.slug));
for (const d of await readdir(join(ROOT, "work"), { withFileTypes: true })) {
  if (!d.isDirectory() || keep.has(d.name)) continue;
  const f = join(ROOT, "work", d.name, "index.html");
  try {
    const html = await readFile(f, "utf8");
    if (html.includes("Generado por tools/generate.mjs")) {
      await rm(join(ROOT, "work", d.name), { recursive: true });
      written.push(`work/${d.name}/ (borrada: ya no está publicada)`);
    }
  } catch {}
}

/* --------------------------------------------------------------- sitemap */
const url = (p) => site.origin.replace(/\/$/, "") + p;
const visible = (w) => w.media.filter((m) => !m.role.includes("unused"));
const today = new Date().toISOString().slice(0, 10);
const newest = published.map((w) => w.dateAdded).sort().pop() || today;

function sitemapEntry(path, lastmod, images = [], videos = []) {
  return `  <url>
    <loc>${url(path)}</loc>
    <lastmod>${lastmod}</lastmod>
${images.map((i) => `    <image:image><image:loc>${url(i)}</image:loc></image:image>`).join("\n")}
${videos.map((v) => `    <video:video>
      <video:thumbnail_loc>${url(v.thumb)}</video:thumbnail_loc>
      <video:title>${esc(v.title)}</video:title>
      <video:description>${esc(v.description)}</video:description>
      <video:content_loc>${url(v.content)}</video:content_loc>
      <video:duration>${Math.max(1, Math.round(v.duration))}</video:duration>
      <video:publication_date>${v.date}T00:00:00+02:00</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>`).join("\n")}
  </url>`.replace(/\n\n/g, "\n");
}

const workEntries = published.map((w) => {
  const imgs = visible(w).filter((m) => m.type === "image").map((m) => imageURL(`${w.slug}/${m.id}`, 1800));
  const vids = visible(w).filter((m) => m.type === "video").map((m) => {
    const e = entry(`${w.slug}/${m.id}`);
    return {
      thumb: `${e.base}-poster-${e.poster.widths.at(-1)}.jpg`,
      content: `${e.base}.mp4`,
      title: `${w.title}${m.caption ? `: ${m.caption.replace(/\.$/, "")}` : ""}`,
      description: m.alt,
      duration: e.duration,
      date: w.dateAdded
    };
  });
  return sitemapEntry(`/work/${w.slug}/`, w.dateAdded, imgs, vids);
});

const homeImages = [
  imageURL("medusa-zodiaco/plano-cerrado", 1800),
  imageURL("site/artista-delacroix", 1800),
  ...published.map((w) => imageURL(`${w.slug}/${w.cover}`, 1200))
];

await put("static/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${sitemapEntry("/", newest, [...new Set(homeImages)])}
${sitemapEntry("/work/", newest)}
${workEntries.join("\n")}
${sitemapEntry("/about/", newest, [imageURL("site/artista-delacroix", 1800), imageURL("site/artista-veronese", 1800)])}
${sitemapEntry("/booking/", newest)}
</urlset>
`);

await put("static/robots.txt", `User-agent: *
Allow: /

Sitemap: ${url("/sitemap.xml")}
`);

/* security.txt (RFC 9116): a quién avisar si alguien encuentra un fallo de
   seguridad. «Expires» es obligatorio y no debe pasar de un año: se renueva
   solo en cada compilación. El .htaccess deja pasar /.well-known/. */
const expires = new Date(Date.now() + 360 * 864e5).toISOString().slice(0, 10);
await put("static/.well-known/security.txt", `Contact: mailto:${site.contact.email}
Expires: ${expires}T00:00:00Z
Preferred-Languages: es, en
Canonical: ${url("/.well-known/security.txt")}
`);

await put("static/site.webmanifest", JSON.stringify({
  name: site.brand,
  short_name: site.brand,
  description: `${site.person}, tatuador en ${site.place}. ${site.studio}.`,
  lang: "es",
  start_url: "/",
  display: "standalone",
  background_color: "#0c0b0a",
  theme_color: "#0c0b0a",
  icons: [
    { src: "/media/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/media/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/media/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}, null, 2) + "\n");

/* -------------------------------------------------------- marca: iconos y OG */
const IVORY = "#f8eedf", NIGHT = "#0c0b0a";
const pairSVG = (size, pad, bg) => {
  // la pareja luna + sol, centrada. Caja de los símbolos: x -100..319.8, y -104.6..104.6
  const w = 419.8, h = 209.2;
  const s = (size - pad * 2) / w;
  const tx = size / 2 - (w / 2 - 100) * s, ty = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg ? `<rect width="${size}" height="${size}" rx="${bg.rx}" fill="${NIGHT}"/>` : ""}
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})" fill="${IVORY}">
    <path d="${LUNA_PATH}"/>
    <circle cx="${SUN_X}" cy="0" r="103" fill="none" stroke="${IVORY}" stroke-width="${size <= 64 ? 9 : 5}"/>
    <circle cx="${SUN_X}" cy="0" r="51.2"/>
  </g></svg>`;
};

await put("static/media/brand/favicon.svg", pairSVG(64, 4, { rx: 12 }));
const brandDir = join(ROOT, "static", "media", "brand");
await mkdir(brandDir, { recursive: true });
const png = async (name, svg) => {
  const out = join(brandDir, name);
  if (await exists(out) && !process.argv.includes("--brand")) return;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
  written.push(`static/media/brand/${name}`);
};
await png("favicon-32.png", pairSVG(32, 2, { rx: 6 }));
await png("apple-touch-icon.png", pairSVG(180, 26, { rx: 0 }));
await png("icon-192.png", pairSVG(192, 24, { rx: 0 }));
await png("icon-512.png", pairSVG(512, 64, { rx: 0 }));
await png("icon-maskable-512.png", pairSVG(512, 118, { rx: 0 }));

/* /favicon.ico: muchos navegadores (y Google) lo piden por su cuenta aunque
   haya <link rel="icon">; sin él, cada visita dejaba un 404. Es un ICO con
   el PNG de 32 px dentro (formato válido desde Windows Vista). */
const ico = join(ROOT, "static", "favicon.ico");
if (!(await exists(ico)) || process.argv.includes("--brand")) {
  const pngData = await readFile(join(brandDir, "favicon-32.png"));
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4); // ICO, 1 imagen
  head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); // planos, bits por píxel
  head.writeUInt32LE(pngData.length, 14); head.writeUInt32LE(22, 18); // tamaño y posición del PNG
  await writeFile(ico, Buffer.concat([head, pngData]));
  written.push("static/favicon.ico");
}

/* ---------------------------------------------------------------- resumen */
console.log(`Generado en ${Date.now() - t0} ms · ${published.length} obras publicadas · ${written.length} archivos escritos`);
for (const f of written) console.log("  " + f);
