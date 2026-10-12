/* ==========================================================================
   TOMASXCANALES · publicar

       npm run publicar        (compila, revisa y ejecuta este script)

   Un solo comando deja GitHub y Hostinger iguales:

     GitHub   main         el proyecto (lo que se edita)
              produccion   SOLO la web compilada (dist/), como registro de
                           cada publicación
     Hostinger             public_html por SSH: se suben solo los archivos
                           que han cambiado y se borran los que sobran

   Este script:
     1. guarda en main los cambios que haya sin guardar
     2. crea un commit en «produccion» con el contenido de dist/
     3. sube main y produccion a GitHub
     4. sincroniza public_html por SSH y comprueba que queda idéntico a dist/

   El acceso SSH usa el alias «tomasxcanales-hostinger» de ~/.ssh/config
   (servidor, puerto, usuario y la clave ~/.ssh/tomasxcanales_hostinger, que
   está dada de alta en hPanel → Avanzado → Acceso SSH → Claves SSH). En otro
   ordenador hay que crear una clave y darla de alta igual.
   ========================================================================== */

import { execFileSync, spawn } from "node:child_process";
import { existsSync, rmSync, readdirSync, statSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const DIST = join(ROOT, "dist");
const GIT_DIR = join(ROOT, ".git");
const BRANCH = "produccion";
const SSH_HOST = "tomasxcanales-hostinger";
const REMOTE = "domains/tomasxcanales.com/public_html";
// Lo que crea el propio servidor (validación del SSL) no se compara ni se borra.
const SERVER_ONLY = "./.well-known/acme-challenge/";
const TAR = existsSync("C:\\Windows\\System32\\tar.exe") ? "C:\\Windows\\System32\\tar.exe" : "tar";

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
const inDist = { cwd: DIST, env: { ...process.env, GIT_INDEX_FILE: index } };
git(["--git-dir", GIT_DIR, "--work-tree", DIST, "add", "-A", "."], inDist);
const tree = git(["--git-dir", GIT_DIR, "--work-tree", DIST, "write-tree"], inDist);
rmSync(index, { force: true });
if (parent && git(["rev-parse", `${parent}^{tree}`]) === tree) {
  console.log(`${BRANCH}: sin cambios respecto a la última publicación`);
} else {
  const commit = git(["commit-tree", tree, ...(parent ? ["-p", parent] : []), "-m", `Publicación ${stamp}`]);
  git(["update-ref", `refs/heads/${BRANCH}`, commit]);
  console.log(`${BRANCH}: nueva publicación ${commit.slice(0, 7)}`);
}

/* 3. GitHub */
git(["push", "-q", "origin", "main", BRANCH]);
console.log("GitHub: main y produccion subidas");

/* 4. Hostinger por SSH */
const ssh = (command, input) => new Promise((ok, ko) => {
  const p = spawn("ssh", ["-o", "BatchMode=yes", SSH_HOST, command], { stdio: [input ? "pipe" : "ignore", "pipe", "pipe"] });
  let out = "", err = "";
  p.stdout.on("data", (d) => (out += d));
  p.stderr.on("data", (d) => (err += d));
  p.on("error", ko);
  p.on("close", (code) => (code === 0 ? ok(out) : ko(new Error(err.trim() || `ssh terminó con código ${code}`))));
  if (input) { p.stdin.end(input); }
});

const remoteHashes = async () => {
  const out = await ssh(`cd ${REMOTE} && find . -type f ! -path '${SERVER_ONLY}*' -print0 | xargs -0 -r sha256sum`);
  const map = new Map();
  for (const line of out.split("\n")) {
    const m = /^([0-9a-f]{64}) [ *]\.\/(.+)$/.exec(line);
    if (m) map.set(m[2], m[1]);
  }
  return map;
};

const localHashes = () => {
  const map = new Map();
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else map.set(relative(DIST, p).split(sep).join("/"), createHash("sha256").update(readFileSync(p)).digest("hex"));
    }
  })(DIST);
  return map;
};

async function deploy() {
  const local = localHashes();
  const remote = await remoteHashes();
  // El HTML y el .htaccess van al final: cuando una página nueva llega al
  // servidor, su CSS y su JS (con nombres nuevos) ya están allí.
  const late = (f) => (f.endsWith(".html") ? 1 : 0) + (f === ".htaccess" ? 2 : 0);
  const upload = [...local.keys()].filter((f) => remote.get(f) !== local.get(f)).sort((a, b) => late(a) - late(b));
  const remove = [...remote.keys()].filter((f) => !local.has(f));

  if (upload.length) {
    const listDir = join(ROOT, ".deploy");
    mkdirSync(listDir, { recursive: true });
    const list = join(listDir, "subir.txt");
    writeFileSync(list, upload.join("\n") + "\n");
    await new Promise((ok, ko) => {
      const tar = spawn(TAR, ["-c", "-f", "-", "-C", DIST, "-T", list], { stdio: ["ignore", "pipe", "pipe"] });
      const sh = spawn("ssh", ["-o", "BatchMode=yes", SSH_HOST, `cd ${REMOTE} && tar -xf - --no-same-owner`], { stdio: ["pipe", "ignore", "pipe"] });
      let err = "";
      tar.stderr.on("data", (d) => (err += d));
      sh.stderr.on("data", (d) => (err += d));
      tar.stdout.pipe(sh.stdin);
      tar.on("error", ko);
      sh.on("error", ko);
      sh.on("close", (code) => (code === 0 ? ok() : ko(new Error(err.trim() || `la subida terminó con código ${code}`))));
    });
  }
  if (remove.length) {
    await ssh(`cd ${REMOTE} && xargs -0 -r rm -f -- && find . -mindepth 1 -type d -empty -delete`, remove.join("\0"));
  }

  const after = await remoteHashes();
  const same = after.size === local.size && [...local].every(([f, h]) => after.get(f) === h);
  if (!same) throw new Error("public_html no ha quedado igual que dist/");
  console.log(`Hostinger: ${upload.length} archivos subidos, ${remove.length} borrados. public_html idéntico a dist/ (${local.size} archivos)`);
}

try {
  await deploy();
} catch (e) {
  console.error(`Hostinger NO se ha actualizado: ${e.message}`);
  console.error("GitHub sí está al día. Revisa el acceso SSH (docs/despliegue-hostinger.md) y vuelve a lanzar npm run publicar.");
  process.exitCode = 1;
}
