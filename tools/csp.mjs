/* ==========================================================================
   TOMASXCANALES · Content-Security-Policy con hashes exactos

       npm run build      (último paso, después de vite build)

   El <head> de cada página lleva un <script> en línea de una línea (decide
   si hay movimiento antes de pintar). Una CSP estricta ('self') lo
   bloquearía, y abrirla con 'unsafe-inline' anularía casi toda la
   protección contra inyección: se autoriza por su hash SHA-256 y nada más.

   Estilos: GSAP (ScrollTrigger) y el generador escriben atributos style=""
   (--tone, aspect-ratio, object-position, los pins). Por eso:
     style-src-elem 'self'           hojas de estilo: solo las propias
     style-src-attr 'unsafe-inline'  atributos style="": permitidos
     style-src 'self' 'unsafe-inline'  solo para navegadores antiguos que
                                       no entienden las dos anteriores
   No hay ningún <style> en línea; si apareciera uno, el build se para.

   Este paso:
     1. recorre el HTML de dist/ y calcula el hash de cada <script> ejecutable
        en línea (el JSON-LD no se ejecuta: no lo necesita)
     2. se para si encuentra lo que ningún hash autoriza: manejadores on*="",
        URLs javascript: o bloques <style> en línea
     3. escribe la política en dist/.htaccess (marcador __CSP__). Si falta el
        marcador, se para: así no se puede publicar sin CSP sin darse cuenta.
   ========================================================================== */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const DIST = join(ROOT, "dist");
const EXECUTABLE = new Set(["", "module", "text/javascript", "application/javascript"]);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const sha256 = (text) => `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;
const fail = (msg) => { console.error(`CSP: ${msg} Build detenido.`); process.exit(1); };

const pages = (await walk(DIST)).filter((f) => extname(f) === ".html");
const scriptHashes = new Set();

for (const file of pages) {
  const html = await readFile(file, "utf8");
  const name = relative(DIST, file);

  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(attrs)) continue; // externo: lo cubre 'self'
    const type = (/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1] ?? "").toLowerCase();
    if (!EXECUTABLE.has(type)) continue; // JSON-LD y datos: no se ejecutan
    if (!body.trim()) continue;
    scriptHashes.add(sha256(body));
  }

  if (/<style\b/i.test(html)) fail(`${name}: hay un <style> en línea (style-src-elem solo admite 'self').`);

  // Se buscan dentro de etiquetas, no en el texto, y fuera de <script>.
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  for (const [tag] of markup.matchAll(/<[a-z][^>]*>/gi)) {
    if (/\son[a-z]+\s*=/i.test(tag)) fail(`${name}: manejador en línea en ${tag.slice(0, 80)}…`);
    if (/=\s*["']?\s*javascript:/i.test(tag)) fail(`${name}: URL javascript: en ${tag.slice(0, 80)}…`);
  }
}

if (scriptHashes.size === 0) fail("no se encontró el script en línea del <head>: revisa tools/site/layout.mjs.");

const policy = [
  "default-src 'self'",
  `script-src 'self' ${[...scriptHashes].join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "style-src-elem 'self'",
  "style-src-attr 'unsafe-inline'",
  "img-src 'self'",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
].join("; ");

const htaccessPath = join(DIST, ".htaccess");
const htaccess = await readFile(htaccessPath, "utf8").catch(() => fail("no existe dist/.htaccess."));
const markers = htaccess.split("__CSP__").length - 1;
if (markers !== 1) fail(`dist/.htaccess debe contener el marcador __CSP__ exactamente una vez (tiene ${markers}).`);
await writeFile(htaccessPath, htaccess.replace("__CSP__", policy));

console.log(`CSP: ${scriptHashes.size} hash de script · ${pages.length} páginas · escrita en dist/.htaccess`);
