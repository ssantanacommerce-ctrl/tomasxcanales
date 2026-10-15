/* ==========================================================================
   TOMASXCANALES · armazón común de todas las páginas
   <head> con metadatos únicos, HUD contextual, menú y pie.
   ========================================================================== */

import { esc, jsonld, attrs } from "./html.mjs";
import { mark } from "./symbols.mjs";

export const GENERATED = "<!-- Generado por tools/generate.mjs a partir de content/. No lo edites a mano: edita content/ o tools/site/ y vuelve a generar. -->";

const NAV = [
  { href: "/work/", label: "Obra", key: "work" },
  { href: "/about/", label: "Artista", key: "about" }
];

/** URL absoluta a partir de una ruta del sitio. */
export const abs = (site, path) => site.origin.replace(/\/$/, "") + path;

/* Dónde está el estudio, tal como se muestra: solo la localidad. La calle no
   aparece en la web (decisión del cliente, 15/10/2026); el código postal
   solo va en los datos estructurados. El domicilio del titular está únicamente
   en el aviso legal, porque lo exige el art. 10 de la LSSI. */
export const townLine = (site) => `${site.address.locality} (${site.address.province})`;
/* Enlace (no mapa incrustado: un iframe de Google Maps pondría cookies de
   terceros y obligaría a abrir la CSP). Con el CID de la ficha verificada
   (content/site.json → google.cid) abre la ficha de Google Business
   Profile; sin él, busca el estudio por nombre y localidad. */
export const mapsURL = (site) =>
  site.google?.cid
    ? `https://maps.google.com/?cid=${site.google.cid}`
    : "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(`${site.studio}, ${site.address.locality}`);

/* El script en línea decide si hay movimiento antes de pintar: no lo hay con
   «reducir movimiento» ni en un móvil en horizontal (alto ≤ 500 px), donde las
   escenas fijadas no caben. ?motion y ?nomotion lo fuerzan. También marca
   `again` si la visita llega desde otra página de la web (el umbral de la
   home dura menos), sin guardar nada en el navegador. Su hash SHA-256 lo
   calcula tools/csp.mjs en cada build: se puede cambiar sin tocar la CSP. */
export function head({ site, title, description, path, image, imageAlt, type = "website", noindex = false, ld = [], preload = [], light = "day" }) {
  const url = abs(site, path);
  const img = image ? abs(site, image) : null;
  const theme = light === "night" ? "#0c0b0a" : "#efece6";
  return `<!doctype html>
${GENERATED}
<html lang="${site.lang}" class="no-js" data-light="${light}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-video-preview:-1, max-snippet:-1"}">
<meta name="theme-color" content="${theme}">
<meta name="author" content="${esc(site.person)}">

<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(site.brand)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
${img ? `<meta property="og:image" content="${img}">
<meta property="og:image:alt" content="${esc(imageAlt || title)}">${image === site.share?.src ? `
<meta property="og:image:width" content="${site.share.width}">
<meta property="og:image:height" content="${site.share.height}">` : ""}` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${img ? `<meta name="twitter:image" content="${img}">` : ""}

<link rel="icon" href="/media/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/media/brand/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/media/brand/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">

<link rel="preload" href="/fonts/melodrama-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/boska-variable-italic.woff2" as="font" type="font/woff2" crossorigin>
${preload.join("\n")}
<link rel="stylesheet" href="/src/css/site.css">
<script>(function(d){d.className=d.className.replace("no-js","js");try{if(document.referrer.indexOf(location.origin+"/")===0)d.classList.add("again")}catch(e){}try{var q=location.search;if(/[?&]nomotion\\b/.test(q))return;if((!matchMedia("(prefers-reduced-motion: reduce)").matches&&!matchMedia("(orientation: landscape) and (max-height: 500px)").matches)||/[?&]motion\\b/.test(q))d.classList.add("motion")}catch(e){}})(document.documentElement);</script>
${ld.map(jsonld).join("\n")}
</head>`;
}

export function hud({ current = null, room = "" } = {}) {
  const link = (n) => `<a class="hud__link" href="${n.href}"${current === n.key ? ' aria-current="page"' : ""}>${n.label}</a>`;
  return `<a class="skip" href="#main">Saltar al contenido</a>
<header class="hud" data-hud>
  <a class="hud__brand" href="/" aria-label="Tomasxcanales, inicio">
    ${mark({ cls: "hud__mark" })}
    <span class="hud__name">Tomasxcanales</span>
  </a>
  <nav class="hud__nav" aria-label="Principal">
    ${NAV.map(link).join("\n    ")}
    <a class="hud__cta" href="/booking/"${current === "booking" ? ' aria-current="page"' : ""} data-track="booking_start">Reservar cita</a>
  </nav>
  <button class="hud__menu" type="button" data-menu-toggle aria-expanded="false" aria-controls="menu"><span data-menu-label>Menú</span></button>
  <p class="hud__room" aria-hidden="true"><span data-room>${esc(room)}</span></p>
  <span class="hud__progress" aria-hidden="true"><i data-progress></i></span>
</header>
<nav class="menu" id="menu" data-menu aria-label="Menú" hidden>
  <ul class="menu__list">
    <li><a class="menu__link" href="/">Inicio</a></li>
    <li><a class="menu__link" href="/work/">Obra</a></li>
    <li><a class="menu__link" href="/about/">Artista</a></li>
    <li><a class="menu__link" href="/booking/">Reservar cita</a></li>
  </ul>
  <p class="menu__foot">
    <a href="#" data-ig>Instagram</a>
    <a href="#" data-mail>Correo</a>
  </p>
</nav>`;
}

export function footer({ site, published }) {
  const featured = published.slice(0, 6);
  return `<footer class="footer" data-light="day">
  <div class="footer__grid">
    <div class="footer__col">
      <p class="footer__head">Obra</p>
      <ul>${featured.map((w) => `<li><a href="/work/${w.slug}/">${esc(w.title)}</a></li>`).join("")}
        <li><a href="/work/">Todo el archivo</a></li></ul>
    </div>
    <div class="footer__col">
      <p class="footer__head">Tomás Canales</p>
      <ul><li><a href="/about/">Artista</a></li><li><a href="/booking/">Reservar cita</a></li><li><a href="/booking/#preguntas">Preguntas</a></li></ul>
    </div>
    <div class="footer__col">
      <p class="footer__head">Contacto</p>
      <ul><li><a href="/booking/" data-track="booking_start">Formulario de reserva</a></li>
        <li><a href="https://instagram.com/${site.contact.instagram}" data-ig>Instagram</a></li>
        <li><a href="mailto:${site.contact.email}" data-mail>${esc(site.contact.email)}</a></li></ul>
    </div>
    <div class="footer__col footer__col--place">
      <p class="footer__head">Estudio</p>
      <address>${esc(site.studio)}<br>${esc(townLine(site))}</address>
      <a class="footer__map" href="${mapsURL(site)}" target="_blank" rel="noopener" data-track="maps_click">Ver en Google Maps</a>
    </div>
  </div>
  <div class="footer__sign" aria-hidden="true">
    <p class="footer__wordmark" data-fit>TOMASXCANALES</p>
  </div>
  <div class="footer__base">
    ${mark({ cls: "footer__mark" })}
    <p>© ${new Date().getFullYear()} ${esc(site.brand)}. Todas las obras de esta web están tatuadas por ${esc(site.person)}.</p>
    <nav class="footer__legal" aria-label="Textos legales">
      <a href="/aviso-legal/">Aviso legal</a>
      <a href="/privacidad/">Privacidad</a>
      <a href="/cookies/">Cookies</a>
    </nav>
  </div>
</footer>`;
}

export function scripts(entry) {
  return `<script type="module" src="/src/js/${entry}.js"></script>`;
}

/* ---------------------------------------------------------- datos estructurados */
export function personLD(site) {
  return {
    "@type": "Person",
    "@id": abs(site, "/#persona"),
    name: site.person,
    alternateName: site.brand,
    jobTitle: site.role,
    url: abs(site, "/about/"),
    sameAs: [`https://instagram.com/${site.contact.instagram}`],
    worksFor: { "@id": abs(site, "/#estudio") },
    knowsAbout: ["Tatuaje", "Realismo en negro y gris", "Línea fina", "Micro-realismo", "Geometría sagrada"]
  };
}

export function parlorLD(site, image) {
  return {
    "@type": "TattooParlor",
    "@id": abs(site, "/#estudio"),
    name: site.studio,
    url: abs(site, "/"),
    image: image ? abs(site, image) : undefined,
    telephone: "+" + site.contact.whatsapp,
    email: site.contact.email,
    address: {
      "@type": "PostalAddress",
      postalCode: site.address.postalCode,
      addressLocality: site.address.locality,
      addressRegion: site.region,
      addressCountry: site.country
    },
    hasMap: mapsURL(site),
    sameAs: [`https://instagram.com/${site.contact.instagram}`, ...(site.google?.cid ? [mapsURL(site)] : [])],
    areaServed: [
      { "@type": "City", name: site.city },
      { "@type": "AdministrativeArea", name: site.region }
    ],
    founder: { "@id": abs(site, "/#persona") },
    employee: { "@id": abs(site, "/#persona") }
  };
}

export function breadcrumbLD(site, items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(site, it.path)
    }))
  };
}

export function crumbs(items) {
  return `<nav class="crumbs" aria-label="Migas de pan"><ol>${items
    .map((it, i) =>
      i === items.length - 1
        ? `<li><span aria-current="page">${esc(it.name)}</span></li>`
        : `<li><a href="${it.path}">${esc(it.name)}</a></li>`
    )
    .join("")}</ol></nav>`;
}

export { attrs };
