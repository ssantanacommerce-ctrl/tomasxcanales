/* ==========================================================================
   TOMASXCANALES · utilidades de marcado para el generador
   Todo el HTML sale de aquí con los atributos que Google necesita para
   indexar imagen y vídeo: width/height reales, srcset/sizes, alt, póster.
   ========================================================================== */

export const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Atributos opcionales: attrs({ a: 1, b: false, c: null }) -> ' a="1"' */
export function attrs(obj = {}) {
  return Object.entries(obj)
    .filter(([, v]) => v !== false && v !== null && v !== undefined)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join("");
}

/** Une clases ignorando las vacías. */
export const cx = (...c) => c.flat().filter(Boolean).join(" ");

/** Texto partido en palabras envueltas, para el efecto de tinta palabra a palabra.
    El texto sigue siendo texto: los <span> no rompen la lectura ni el SEO. */
export function inkWords(text) {
  return String(text)
    .split(/(\s+)/)
    .map((t) => (/^\s+$/.test(t) ? " " : `<span class="w">${esc(t)}</span>`))
    .join("");
}

/* ------------------------------------------------------------------ media */
let MANIFEST = { items: {} };
export function setManifest(m) { MANIFEST = m; }
export function entry(key) {
  const e = MANIFEST.items[key];
  if (!e) throw new Error(`Falta el derivado de "${key}". Ejecuta: npm run media`);
  return e;
}

/** URL absoluta de la versión más cercana a `w` (para OG, JSON-LD, sitemap). */
export function imageURL(key, w = 1200, ext = "jpg") {
  const e = entry(key);
  if (e.kind === "video") {
    const pw = e.poster.widths.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));
    return `${e.base}-poster-${pw}.${ext}`;
  }
  const best = e.widths.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));
  return `${e.base}-${best}.${ext}`;
}

/**
 * <picture> con AVIF, WebP y JPEG.
 * @param {string} key        clave del manifiesto ("obra/id")
 * @param {object} o
 *   alt, sizes, eager (LCP), cls, imgCls, focus (object-position), fit
 */
export function picture(key, o = {}) {
  const e = entry(key);
  if (e.kind !== "image") throw new Error(`${key} no es una imagen`);
  const set = (ext) => e.widths.map((w) => `${e.base}-${w}.${ext} ${w}w`).join(", ");
  const fallbackW = e.widths.find((w) => w >= 800) || e.widths[e.widths.length - 1];
  const sizes = o.sizes || "100vw";
  const style = [o.focus ? `object-position:${o.focus}` : "", `--tone:${e.color}`].filter(Boolean).join(";");
  return `<picture${attrs({ class: o.cls })}>` +
    `<source type="image/avif" srcset="${set("avif")}" sizes="${esc(sizes)}">` +
    `<source type="image/webp" srcset="${set("webp")}" sizes="${esc(sizes)}">` +
    `<img${attrs({
      class: o.imgCls,
      src: `${e.base}-${fallbackW}.jpg`,
      srcset: set("jpg"),
      sizes,
      width: e.w,
      height: e.h,
      alt: o.alt ?? "",
      loading: o.eager ? "eager" : "lazy",
      decoding: o.eager ? "sync" : "async",
      fetchpriority: o.eager ? "high" : null,
      style,
      "data-media": key
    })}>` +
    `</picture>`;
}

/**
 * <video> silencioso con póster real y fuentes WebM + MP4. La versión de
 * 480 px y la de scrub las elige ui/media.js en el cliente.
 */
export function video(key, o = {}) {
  const e = entry(key);
  if (e.kind !== "video") throw new Error(`${key} no es un vídeo`);
  const posterW = e.poster.widths[e.poster.widths.length - 1];
  return `<video${attrs({
    class: o.cls,
    width: e.w,
    height: e.h,
    poster: `${e.base}-poster-${posterW}.jpg`,
    muted: true,
    playsinline: true,
    loop: o.loop !== false,
    preload: o.preload || "none",
    "aria-label": o.alt,
    "data-video": e.base,
    "data-duration": e.duration,
    "data-scrub": e.scrub && o.scrub ? `${e.base}-scrub.mp4` : null,
    "data-autoplay": o.autoplay === false ? null : "",
    "data-media": key,
    style: `--tone:${e.color}`
  })}>` +
    `<source src="${e.base}.webm" type="video/webm">` +
    `<source src="${e.base}.mp4" type="video/mp4">` +
    `</video>`;
}

/** El póster de un vídeo como <picture> (portadas de obras que solo existen en vídeo). */
export function posterPicture(key, o = {}) {
  const e = entry(key);
  const ws = e.poster.widths;
  const set = (ext) => ws.map((w) => `${e.base}-poster-${w}.${ext} ${w}w`).join(", ");
  const sizes = o.sizes || "100vw";
  return `<picture${attrs({ class: o.cls })}>` +
    `<source type="image/avif" srcset="${set("avif")}" sizes="${esc(sizes)}">` +
    `<source type="image/webp" srcset="${set("webp")}" sizes="${esc(sizes)}">` +
    `<img${attrs({
      class: o.imgCls,
      src: `${e.base}-poster-${ws[ws.length - 1]}.jpg`,
      srcset: set("jpg"),
      sizes,
      width: e.poster.w,
      height: e.poster.h,
      alt: o.alt ?? "",
      loading: o.eager ? "eager" : "lazy",
      decoding: "async",
      style: `--tone:${e.color}`,
      "data-media": key
    })}></picture>`;
}

/** Imagen fija de cualquier medio: la foto, o el póster si es un vídeo. */
export function still(key, o = {}) {
  return entry(key).kind === "video" ? posterPicture(key, o) : picture(key, o);
}

/** Medio genérico (imagen o vídeo) según su tipo en el manifiesto. */
export function media(key, o = {}) {
  return entry(key).kind === "video" ? video(key, o) : picture(key, o);
}

/** Proporción real de un medio, para reservar su hueco (CLS 0). */
export function ratio(key) {
  const e = entry(key);
  return e.kind === "video" ? `${e.w} / ${e.h}` : `${e.w} / ${e.h}`;
}

export function jsonld(obj) {
  // "</" dentro de un <script> cerraría la etiqueta antes de tiempo
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/<\//g, "<\\/")}</script>`;
}

/** Duración ISO 8601 para VideoObject: 27.4 -> "PT27S" */
export const isoDuration = (s) => `PT${Math.max(1, Math.round(s))}S`;
