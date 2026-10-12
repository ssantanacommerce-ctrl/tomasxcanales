import { defineConfig } from "vite";
import { resolve, join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

/* ==========================================================================
   TOMASXCANALES · Vite (multipágina, salida estática)

   Las páginas las escribe tools/generate.mjs a partir de content/: cada
   ruta es un index.html real con su texto, sus metadatos y su JSON-LD.
   Vite empaqueta CSS y JS, y copia static/ tal cual (publicDir).

   Las entradas del build se descubren solas: una obra nueva en content/
   genera work/<slug>/index.html y entra en el build sin tocar este archivo.

   En desarrollo, cualquier cambio en content/*.json o en tools/site/
   regenera las páginas y recarga el navegador.
   ========================================================================== */

const root = __dirname;

function pages() {
  const input = {
    home: resolve(root, "index.html"),
    notFound: resolve(root, "404.html"),
    work: resolve(root, "work/index.html"),
    about: resolve(root, "about/index.html"),
    booking: resolve(root, "booking/index.html"),
    legalNotice: resolve(root, "aviso-legal/index.html"),
    privacy: resolve(root, "privacidad/index.html"),
    cookies: resolve(root, "cookies/index.html")
  };
  const dir = resolve(root, "work");
  if (existsSync(dir)) {
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      const f = join(dir, d.name, "index.html");
      if (d.isDirectory() && existsSync(f)) input[`work-${d.name}`] = f;
    }
  }
  return input;
}

function regenerate() {
  let running = null, again = false;
  const run = (server) => {
    if (running) { again = true; return; }
    running = spawn(process.execPath, ["tools/generate.mjs"], { cwd: root, stdio: "inherit" });
    running.on("exit", (code) => {
      running = null;
      if (code === 0) server.ws.send({ type: "full-reload" });
      if (again) { again = false; run(server); }
    });
  };
  return {
    name: "txc-regenerate",
    apply: "serve",
    configureServer(server) {
      const watched = [resolve(root, "content"), resolve(root, "tools/site"), resolve(root, "tools/generate.mjs")];
      server.watcher.add(watched);
      const hit = (file) =>
        (file.includes(`${join("content")}`) && file.endsWith(".json") && !file.includes(".generated")) ||
        file.includes(join("tools", "site")) ||
        file.endsWith(join("tools", "generate.mjs"));
      server.watcher.on("change", (f) => hit(f) && run(server));
      server.watcher.on("add", (f) => hit(f) && run(server));
    }
  };
}

export default defineConfig({
  root,
  publicDir: "static",
  base: "/",
  // multipágina: una ruta que no existe es un 404, no la home (como en Apache)
  appType: "mpa",
  plugins: [regenerate()],

  build: {
    outDir: "dist",
    assetsDir: "_build",
    emptyOutDir: true,
    target: "es2020",
    cssCodeSplit: true,
    assetsInlineLimit: 2048,
    reportCompressedSize: false,
    rollupOptions: {
      input: pages(),
      output: {
        // GSAP y Lenis en un chunk compartido: se descarga una vez y queda
        // en caché para toda la navegación.
        manualChunks(id) {
          if (id.includes("node_modules") && (id.includes("gsap") || id.includes("lenis"))) return "motion";
          if (id.includes("/src/js/core/") || id.includes("/content/site.json")) return "core";
        }
      }
    }
  },

  server: {
    // PORT lo asigna el entorno cuando 5173 está ocupado
    port: Number(process.env.PORT) || 5173,
    open: false,
    host: true,
    watch: { ignored: ["**/content/**/originals/**", "**/static/media/**"] }
  },

  preview: {
    port: Number(process.env.PORT) || 4173
  }
});
