/* ==========================================================================
   TOMASXCANALES · publicar

       npm run publicar        (compila, revisa y ejecuta este script)

   GitHub es el camino a Hostinger:

     main         el proyecto (lo que se edita)
     produccion   SOLO la web compilada: el contenido de dist/, tal cual va
                  en public_html. Hostinger está conectado a esta rama
                  (hPanel → Avanzado → GIT, con despliegue automático): cada
                  vez que cambia, la descarga en public_html.

   Este script:
     1. guarda en main los cambios que haya sin guardar
     2. crea un commit nuevo en «produccion» con el contenido de dist/
        (siempre encima del anterior: Hostinger hace «git pull»)
     3. sube main y produccion a GitHub
     4. copia dist/ a «../Tomasxcanales Studio - Web» (en el escritorio): la
        web exactamente como queda publicada

   Antes, `npm run build` y `npm run check` tienen que haber terminado bien
   (el script de npm ya los encadena).
   ========================================================================== */

import { execFileSync } from "node:child_process";
import { existsSync, rmSync, cpSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const DIST = join(ROOT, "dist");
const GIT_DIR = join(ROOT, ".git");
const BRANCH = "produccion";
const MIRROR = resolve(ROOT, "..", "Tomasxcanales Studio - Web");

const git = (args, opts = {}) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
const tryGit = (args, opts) => { try { return git(args, opts); } catch { return null; } };
const stamp = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).slice(0, 16);

if (!existsSync(join(DIST, "index.html")) || !existsSync(join(DIST, ".htaccess"))) {
  console.error("No hay una compilación completa en dist/. Usa: npm run publicar");
  process.exit(1);
}

/* 1. main: guarda lo que haya pendiente */
if (git(["status", "--porcelain"])) {
  git(["add", "-A"]);
  git(["commit", "-q", "-m", `Cambios publicados el ${stamp}`]);
  console.log("main: cambios guardados");
}

/* 2. produccion: un commit con el árbol de dist/, encima del anterior.
   Se usa un índice aparte para no tocar el de main. */
tryGit(["fetch", "-q", "origin", `${BRANCH}:${BRANCH}`]);
const parent = tryGit(["rev-parse", "--verify", "-q", `refs/heads/${BRANCH}`]);
const index = join(GIT_DIR, "publish-index");
rmSync(index, { force: true });
const env = { ...process.env, GIT_INDEX_FILE: index };
const inDist = { cwd: DIST, env };
git(["--git-dir", GIT_DIR, "--work-tree", DIST, "add", "-A", "."], inDist);
const tree = git(["--git-dir", GIT_DIR, "--work-tree", DIST, "write-tree"], inDist);
rmSync(index, { force: true });

if (parent && git(["rev-parse", `${parent}^{tree}`]) === tree) {
  console.log(`${BRANCH}: la web publicada ya es esta, no hay nada nuevo`);
} else {
  const commit = git(["commit-tree", tree, ...(parent ? ["-p", parent] : []), "-m", `Publicación ${stamp}`]);
  git(["update-ref", `refs/heads/${BRANCH}`, commit]);
  console.log(`${BRANCH}: nueva publicación ${commit.slice(0, 7)}`);
}

/* 3. GitHub (y, por el webhook, Hostinger) */
git(["push", "-q", "origin", "main", BRANCH]);
console.log("GitHub: main y produccion subidas. Hostinger las despliega en public_html.");

/* 4. Copia en el escritorio */
try {
  rmSync(MIRROR, { recursive: true, force: true });
  cpSync(DIST, MIRROR, { recursive: true });
  console.log(`Copia actualizada: ${MIRROR}`);
} catch (e) {
  console.warn(`No se pudo actualizar ${MIRROR} (¿está abierta en el Explorador?): ${e.message}`);
}
