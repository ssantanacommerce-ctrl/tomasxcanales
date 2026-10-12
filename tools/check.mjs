/* ==========================================================================
   TOMASXCANALES · comprobación del build

       npm run check      (después de npm run build)

   Recorre dist/, que es exactamente lo que se publica, y falla si encuentra:
   - una referencia local rota (href, src, srcset, poster, url() de CSS)
   - una página sin <title>, description, canonical, lang u og:image
   - más o menos de un <h1>
   - una <img> sin alt o sin width/height
   - un <video> sin póster, sin aria-label o sin fuentes
   - JSON-LD que no se puede leer
   - texto con codificación rota (mojibake: "Ã³", "Â·")
   - rayas largas (— o –) en el texto visible: la guía de estilo las prohíbe
   - una URL del sitemap que no existe en dist/, o una página que falta en él
   - originales (content/) colados en la salida
   - un .htaccess sin la CSP escrita (falta tools/csp.mjs)
   - archivos que nunca deben publicarse (.map, .zip, .md, .mjs, package.json,
     .env, .git, node_modules) o rutas locales del ordenador (C:\Users\…)
   Este script es Node y no PowerShell a propósito: PowerShell 5.1 lee UTF-8
   sin BOM como ANSI y "rompe" los acentos al comparar.
   ========================================================================== */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname, relative, resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const DIST = join(ROOT, "dist");
const problems = [];
const warn = [];
const fail = (file, msg) => problems.push(`${relative(DIST, file) || file}: ${msg}`);

async function walk(dir) {
  const out = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}
const exists = async (p) => { try { await stat(p); return true; } catch { return false; } };

try { await stat(DIST); } catch { console.error("No existe dist/. Ejecuta antes: npm run build"); process.exit(1); }

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const cssFiles = files.filter((f) => f.endsWith(".css"));
let refs = 0;

function resolveRef(file, ref) {
  if (!ref || /^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(ref)) return null;
  const clean = decodeURIComponent(ref.split("#")[0].split("?")[0]);
  if (!clean) return null;
  let p = clean.startsWith("/") ? join(DIST, clean) : resolve(dirname(file), clean);
  if (clean.endsWith("/")) p = join(p, "index.html");
  return p;
}

const stripTags = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<[^>]+>/g, " ");

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const rel = relative(DIST, file);
  const is404 = rel === "404.html";

  if (!/<html[^>]+lang="es"/.test(html)) fail(file, "falta lang=\"es\"");
  if (!/<title>[^<]{10,}<\/title>/.test(html)) fail(file, "falta <title>");
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) fail(file, "falta meta description (o es muy corta)");
  if (!is404 && !/<link rel="canonical" href="https:\/\/[^"]+"/.test(html)) fail(file, "falta canonical");
  if (!is404 && !/<meta property="og:image" content="https:\/\/[^"]+"/.test(html)) fail(file, "falta og:image");
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fail(file, `tiene ${h1} <h1> (debe tener 1)`);

  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\salt="/.test(tag)) fail(file, `<img> sin alt: ${tag.slice(0, 90)}`);
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) {
      if (!/intro__ambient-img/.test(tag)) fail(file, `<img> sin width/height: ${tag.slice(0, 90)}`);
    }
  }
  for (const m of html.matchAll(/<video\b[^>]*>([\s\S]*?)<\/video>/g)) {
    const tag = m[0];
    if (!/\sposter="/.test(tag)) fail(file, "<video> sin póster");
    if (!/\saria-label="[^"]{15,}"/.test(tag)) fail(file, "<video> sin aria-label descriptivo");
    if (!/<source\b/.test(m[1])) fail(file, "<video> sin <source>");
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { fail(file, `JSON-LD ilegible: ${e.message}`); }
  }

  const text = stripTags(html);
  if (/Ã[\u0080-¿]|Â[· -¿]|â€/.test(html)) fail(file, "texto con la codificación rota (mojibake)");
  const dash = text.match(/.{0,30}[—–].{0,30}/);
  if (dash) fail(file, `raya larga en el texto visible: «${dash[0].trim()}»`);
  if (/content\/(works|site)\/[^"']+\/originals\//.test(html)) fail(file, "referencia a un original de content/");

  const refsIn = [
    ...[...html.matchAll(/\s(?:href|src|poster|data-displace-src)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+/)[0])),
    ...[...html.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/["']/g, ""))
  ];
  for (const ref of refsIn) {
    const p = resolveRef(file, ref);
    if (!p) continue;
    refs++;
    if (!(await exists(p))) fail(file, `referencia rota: ${ref}`);
  }
}

for (const file of cssFiles) {
  const css = await readFile(file, "utf8");
  for (const m of css.matchAll(/url\(([^)]+)\)/g)) {
    const ref = m[1].replace(/["']/g, "");
    const p = resolveRef(file, ref);
    if (!p) continue;
    refs++;
    if (!(await exists(p))) fail(file, `referencia rota en CSS: ${ref}`);
  }
}

/* sitemap <-> páginas */
const sitemap = await readFile(join(DIST, "sitemap.xml"), "utf8").catch(() => "");
if (!sitemap) problems.push("falta sitemap.xml");
const locs = [...sitemap.matchAll(/<loc>https:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
const pageLocs = locs.filter((l) => l.endsWith("/"));
for (const l of locs) {
  const p = l.endsWith("/") ? join(DIST, l, "index.html") : join(DIST, l);
  if (!(await exists(p))) problems.push(`sitemap: ${l} no existe en dist/`);
}
// Las páginas con «noindex» (404, legales) no van en el sitemap; las demás, sí.
for (const f of htmlFiles) {
  const rel = "/" + relative(DIST, f).split(sep).join("/").replace(/index\.html$/, "");
  const noindex = /<meta name="robots" content="noindex/.test(await readFile(f, "utf8"));
  if (noindex && pageLocs.includes(rel)) problems.push(`sitemap: ${rel} tiene noindex y no debe estar en el sitemap`);
  if (!noindex && !pageLocs.includes(rel)) problems.push(`sitemap: falta la página ${rel}`);
}

/* textos legales: existen y cada página enlaza con ellos desde el pie */
for (const p of ["aviso-legal", "privacidad", "cookies"]) {
  if (!(await exists(join(DIST, p, "index.html")))) problems.push(`falta la página legal /${p}/`);
}
for (const f of htmlFiles) {
  if (f.endsWith(`${sep}404.html`)) continue;
  const html = await readFile(f, "utf8");
  for (const p of ["/aviso-legal/", "/privacidad/", "/cookies/"]) {
    if (!html.includes(`href="${p}"`)) fail(f, `falta el enlace a ${p}`);
  }
}
if (!(await exists(join(DIST, ".well-known", "security.txt")))) problems.push("falta .well-known/security.txt");
if (!(await exists(join(DIST, "robots.txt")))) problems.push("falta robots.txt");
if (files.some((f) => f.includes(`${sep}originals${sep}`))) problems.push("hay originales de content/ dentro de dist/");

/* servidor y archivos que nunca deben publicarse */
const htaccess = await readFile(join(DIST, ".htaccess"), "utf8").catch(() => "");
if (!htaccess) problems.push("falta .htaccess");
else if (htaccess.includes("__CSP__") || !/Content-Security-Policy "default-src 'self'/.test(htaccess)) {
  problems.push(".htaccess: la CSP no está escrita (el build debe terminar con node tools/csp.mjs)");
}
for (const f of files) {
  const rel = relative(DIST, f).split(sep).join("/");
  if (/\.(map|zip|md|ts|mjs|cjs|log|bak)$/i.test(rel) || /(^|\/)(package(-lock)?\.json|\.env[^/]*|\.git|node_modules)(\/|$)/i.test(rel)) {
    problems.push(`no debe publicarse: ${rel}`);
  }
  if (/\.(html|css|js|xml|txt|webmanifest|svg)$/.test(f) && /[A-Za-z]:[\\/]{1,2}Users[\\/]/.test(await readFile(f, "utf8"))) {
    problems.push(`ruta local del ordenador en ${rel}`);
  }
}

/* peso */
const size = (await Promise.all(files.map(async (f) => (await stat(f)).size))).reduce((a, b) => a + b, 0);
const js = (await Promise.all(files.filter((f) => f.endsWith(".js")).map(async (f) => (await stat(f)).size))).reduce((a, b) => a + b, 0);

console.log(`\n${htmlFiles.length} páginas · ${refs} referencias locales · ${locs.length} URLs en el sitemap`);
console.log(`dist/: ${(size / 1024 / 1024).toFixed(1)} MB en total · JS ${(js / 1024).toFixed(0)} KB sin comprimir`);
for (const w of warn) console.log("  aviso: " + w);
if (problems.length) {
  console.log(`\n${problems.length} problemas:\n  - ` + problems.join("\n  - "));
  process.exit(1);
}
console.log("\nSin problemas.");
