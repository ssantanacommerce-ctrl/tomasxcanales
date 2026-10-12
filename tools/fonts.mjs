/* ==========================================================================
   TOMASXCANALES · fuentes

       node tools/fonts.mjs

   Descarga una sola vez las versiones variables de Melodrama y Boska desde
   Fontshare (Indian Type Foundry, licencia ITF Free Font License: uso
   comercial y web permitidos) y las deja en static/fonts/ para servirlas desde
   el propio dominio. En producción no hay ninguna petición a terceros.

   DM Mono no pasa por aquí: llega por npm (@fontsource/dm-mono, OFL).
   ========================================================================== */

import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const OUT = join(root, "static", "fonts");

const FAMILIES = [
  { query: "melodrama@1", files: { "normal": "melodrama-variable.woff2" } },
  { query: "boska@1,2",   files: { "normal": "boska-variable.woff2", "italic": "boska-variable-italic.woff2" } }
];

await mkdir(OUT, { recursive: true });

for (const fam of FAMILIES) {
  const css = await (await fetch(`https://api.fontshare.com/v2/css?f[]=${fam.query}&display=swap`)).text();
  const faces = css.split("@font-face").slice(1);
  for (const face of faces) {
    const url = face.match(/url\('([^']+?\.woff2)'\)/)?.[1];
    const style = face.match(/font-style:\s*([a-z]+)/)?.[1] || "normal";
    const name = fam.files[style];
    if (!url || !name) continue;
    const res = await fetch(url.startsWith("//") ? "https:" + url : url);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(join(OUT, name), buf);
    console.log(`  ${name}  ${(buf.length / 1024).toFixed(1)} KB`);
  }
}

await writeFile(join(OUT, "LICENCIAS.txt"),
`Melodrama y Boska: Indian Type Foundry, distribuidas por Fontshare
(https://www.fontshare.com) bajo la ITF Free Font License, que permite el uso
personal y comercial, incluido el uso web autoalojado.

DM Mono: Colophon Foundry, SIL Open Font License 1.1 (via @fontsource/dm-mono).
`);
console.log("Listo: static/fonts/");
