/* ==========================================================================
   TOMASXCANALES · lectura del contenido

   Una única puerta de entrada a content/: la usan la tubería de medios
   (tools/media.mjs) y el generador de páginas (tools/generate.mjs), así que
   los dos leen exactamente lo mismo.

   content/
     site.json              identidad, contacto, texto de VIDA, medios del sitio
     legal.json             titular, NIF y domicilio (aviso legal y privacidad)
     exhibition.json        el recorrido de la home, escena a escena
     works/<slug>/
       work.json            una obra: textos, estilo, zona, medios, relacionadas
       originals/           los archivos originales (no se publican nunca)
   ========================================================================== */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = dirname(fileURLToPath(new URL("../../package.json", import.meta.url)));
export const CONTENT = join(ROOT, "content");
export const WORKS_DIR = join(CONTENT, "works");
export const MEDIA_OUT = join(ROOT, "static", "media");
export const MANIFEST = join(CONTENT, ".generated", "media.json");

const ROLES = new Set([
  "hero", "featured", "primary", "detail", "process", "cinematic",
  "atmospheric", "secondary", "mobile", "identity", "artist", "studio",
  "voice", "unused"
]);

async function readJSON(p) {
  const raw = await readFile(p, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON no válido en ${relative(ROOT, p)}: ${err.message}`);
  }
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

/** Valida una obra y devuelve la lista de problemas (vacía si está bien). */
function validateWork(w, dir) {
  const errs = [];
  const where = `works/${dir}/work.json`;
  if (w.slug !== dir) errs.push(`${where}: "slug" (${w.slug}) debe coincidir con el nombre de la carpeta (${dir})`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.slug || "")) errs.push(`${where}: el slug solo admite minúsculas, números y guiones`);
  for (const k of ["title", "description", "bodyPlacement"]) if (!w[k]) errs.push(`${where}: falta "${k}"`);
  if (!Array.isArray(w.styles) || !w.styles.length) errs.push(`${where}: "styles" debe ser una lista con al menos un estilo`);
  if (!Array.isArray(w.media) || !w.media.length) errs.push(`${where}: "media" no puede estar vacío`);
  const ids = new Set();
  for (const m of w.media || []) {
    if (!m.id || !m.type || !m.src) errs.push(`${where}: cada medio necesita id, type y src`);
    if (ids.has(m.id)) errs.push(`${where}: id de medio repetido "${m.id}"`);
    ids.add(m.id);
    if (!["image", "video", "audio"].includes(m.type)) errs.push(`${where}: tipo desconocido "${m.type}" en ${m.id}`);
    if (!m.alt && !(m.role || []).includes("unused")) errs.push(`${where}: el medio "${m.id}" no tiene alt`);
    for (const r of m.role || []) if (!ROLES.has(r)) errs.push(`${where}: rol desconocido "${r}" en ${m.id}`);
  }
  if (w.cover && !ids.has(w.cover)) errs.push(`${where}: "cover" apunta a un medio que no existe (${w.cover})`);
  return errs;
}

/** Letra de control del DNI/NIE: un NIF con la letra equivocada no se publica. */
function validNIF(nif) {
  const m = /^([XYZ]|\d)(\d{7})([A-Z])$/.exec(String(nif || "").toUpperCase());
  if (!m) return false;
  const n = Number(("XYZ".indexOf(m[1]) >= 0 ? "XYZ".indexOf(m[1]) : m[1]) + m[2]);
  return "TRWAGMYFPDXBNJZSQVHLCKE"[n % 23] === m[3];
}

function validateLegal(l) {
  const errs = [];
  for (const k of ["holder", "nif", "address", "postalCode", "locality", "province", "country", "updated"]) {
    if (!l[k]) errs.push(`legal.json: falta "${k}"`);
  }
  if (l.nif && !validNIF(l.nif)) errs.push(`legal.json: el NIF ${l.nif} no es válido (la letra no cuadra)`);
  if (l.postalCode && !/^\d{5}$/.test(l.postalCode)) errs.push(`legal.json: el código postal debe tener 5 cifras`);
  if (l.updated && !/^\d{4}-\d{2}-\d{2}$/.test(l.updated)) errs.push(`legal.json: "updated" va como AAAA-MM-DD`);
  return errs;
}

/** Carga todo el contenido. Lanza un error legible si algo está mal. */
export async function loadContent() {
  const site = await readJSON(join(CONTENT, "site.json"));
  const legal = await readJSON(join(CONTENT, "legal.json"));
  const exhibition = await readJSON(join(CONTENT, "exhibition.json"));

  const dirs = (await readdir(WORKS_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => d.name);

  const works = [];
  const problems = [...validateLegal(legal)];
  for (const dir of dirs) {
    const file = join(WORKS_DIR, dir, "work.json");
    if (!(await exists(file))) { problems.push(`works/${dir}: falta work.json`); continue; }
    const w = await readJSON(file);
    problems.push(...validateWork(w, dir));
    w.dir = join(WORKS_DIR, dir);
    for (const m of w.media || []) {
      m.abs = resolve(w.dir, m.src);
      m.key = `${w.slug}/${m.id}`;
      m.scope = w.slug;
      m.role = m.role || [];
      if (!(await exists(m.abs))) problems.push(`works/${dir}: no existe el original ${m.src}`);
    }
    works.push(w);
  }

  for (const m of site.media.items) {
    m.abs = resolve(CONTENT, m.src);
    m.key = `site/${m.id}`;
    m.scope = "site";
    m.role = m.role || [];
    if (!(await exists(m.abs))) problems.push(`site.json: no existe el original ${m.src}`);
  }

  const published = works.filter((w) => w.published).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const bySlug = new Map(works.map((w) => [w.slug, w]));

  for (const w of published) {
    for (const r of w.related || []) {
      const t = bySlug.get(r);
      if (!t) problems.push(`works/${w.slug}: "related" apunta a una obra que no existe (${r})`);
      else if (!t.published) problems.push(`works/${w.slug}: "related" apunta a una obra no publicada (${r})`);
    }
  }
  for (const s of exhibition.scenes) {
    for (const ref of [s.work, s.next?.work].filter(Boolean)) {
      const t = bySlug.get(ref);
      if (!t) problems.push(`exhibition.json: la escena "${s.name}" apunta a una obra que no existe (${ref})`);
      else if (!t.published) problems.push(`exhibition.json: la escena "${s.name}" usa una obra no publicada (${ref})`);
    }
  }

  if (problems.length) {
    const e = new Error("Contenido con problemas:\n  - " + problems.join("\n  - "));
    e.problems = problems;
    throw e;
  }

  return { site, legal, exhibition, works, published, bySlug };
}

/** Todos los medios que hay que publicar (sin los 'unused' ni obras sin publicar). */
export function publishableMedia({ site, published }) {
  const out = [];
  for (const w of published) for (const m of w.media) if (!m.role.includes("unused")) out.push(m);
  for (const m of site.media.items) if (!m.role.includes("unused")) out.push(m);
  return out;
}

export function mediaBaseName(m) {
  return m.scope === "site" ? `tomasxcanales-${m.id}` : `tomasxcanales-${m.scope}-${m.id}`;
}

export async function loadManifest() {
  try { return JSON.parse(await readFile(MANIFEST, "utf8")); }
  catch { return { items: {} }; }
}
