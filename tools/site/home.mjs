/* ==========================================================================
   TOMASXCANALES · la home: una exposición en una sola toma

   El recorrido lo decide content/exhibition.json. Cada escena declara un
   `kind` y aquí hay una función por kind que escribe su marcado. El
   movimiento lo pone src/js/home/*: el HTML de cada escena ya se lee
   completo sin JavaScript (y así lo ve Google).

   Kinds:
     intro    el vídeo del tatuador, el nombre y la primera frase de VIDA
     zoom     una obra pequeña en el muro que crece hasta ocupar la vista
     line     una frase de VIDA que se entinta palabra a palabra
     process  del stencil a la piel, paso a paso
     layers   capas a distinta profundidad (parallax)
     ink      una obra se convierte en otra (desplazamiento WebGL)
     film     un vídeo que pasa de marco en el muro a pantalla completa
     gallery  todas las obras publicadas, en travelling
     words    una frase de VIDA a gran tamaño
     artist   el artista, su voz y su estudio
     booking  reservar
   ========================================================================== */

import { esc, attrs, cx, inkWords, picture, video, still, entry, imageURL, ratio } from "./html.mjs";
import { head, hud, footer, scripts, personLD, parlorLD, abs } from "./layout.mjs";
import { ritual, mark } from "./symbols.mjs";

const byId = (w, id) => w.media.find((m) => m.id === id);
const key = (slug, id) => `${slug}/${id}`;
const sentence = (site, id) => site.vida.sentences.find((s) => s.id === id);

function cartela(w, { level = 2, extra = "", quote = true } = {}) {
  const h = `h${level}`;
  const q = quote && w.quote
    ? `<blockquote class="cartela__quote"><p>${esc(w.quote.text)}</p><footer>${esc(w.quote.source)}</footer></blockquote>`
    : "";
  return `<div class="cartela">
      ${w.status ? `<p class="cartela__status">${esc(w.status)}</p>` : ""}
      <${h} class="cartela__title"><a href="/work/${w.slug}/">${esc(w.title)}</a></${h}>
      <dl class="cartela__meta">
        <div><dt>Zona</dt><dd>${esc(w.bodyPlacement)}</dd></div>
        <div><dt>Técnica</dt><dd>${esc(w.styles.join(", "))}</dd></div>
      </dl>
      <p class="cartela__text">${esc(w.description)}</p>
      ${q}${extra}
      <a class="cartela__more" href="/work/${w.slug}/">Ver la obra</a>
    </div>`;
}

const scene = (s, i, inner, o = {}) =>
  `<section${attrs({
    class: cx("scene", `scene--${s.kind}`, o.cls),
    id: o.id,
    "data-kind": s.kind,
    "data-scene": s.name,
    "data-light": o.light || "day",
    "aria-label": o.label,
    "aria-labelledby": o.labelledby
  })}>
${inner}
</section>`;

/* ---------------------------------------------------------------- escenas */
const K = {
  intro(s, ctx) {
    const w = ctx.bySlug.get(s.work);
    const k = key(w.slug, s.media);
    const e = entry(k);
    const vida = sentence(ctx.site, s.sentence);
    return scene(s, 0, `
  <div class="intro__stage" data-stage>
    <div class="intro__ambient" aria-hidden="true">
      <img class="intro__ambient-img" src="${e.base}-poster-480.jpg" alt="" width="${e.poster.w}" height="${e.poster.h}" decoding="async">
      <canvas class="intro__ambient-canvas" width="18" height="32" data-ambient></canvas>
    </div>
    <div class="intro__portal" data-portal>
      ${video(k, { cls: "intro__video", preload: "metadata", autoplay: false, alt: byId(w, s.media).alt })}
    </div>
    <div class="intro__veil" aria-hidden="true"></div>
    <h1 class="intro__title" id="inicio">
      <span class="wordmark" data-wordmark>Tomasxcanales</span>
      <span class="intro__what">Tatuaje en ${esc(ctx.site.place)}</span>
    </h1>
    <p class="intro__credit">En el vídeo: <a href="/work/${w.slug}/">${esc(w.title)}</a>, en proceso</p>
    <button class="intro__toggle" type="button" data-video-toggle aria-pressed="false">Pausar vídeo</button>
  </div>
  <blockquote class="intro__words words" data-intro-words>
    <p class="ink-text" data-ink>${inkWords(vida.text)}</p>
    <footer>Tomás Canales</footer>
  </blockquote>`, { id: "umbral", light: "night", labelledby: "inicio" });
  },

  zoom(s, ctx, i) {
    const w = ctx.bySlug.get(s.work);
    const captions = { "plano-general": "La pieza entera", "plano-cerrado": "Más cerca", rotacion: "El brazo gira con el scroll", detalle: "Detalle" };
    const frames = s.sequence.map((id, n) => {
      const m = byId(w, id);
      const k = key(w.slug, id);
      const body = m.type === "video"
        ? video(k, { cls: "frame__media", alt: m.alt, scrub: true, autoplay: false })
        : picture(k, { cls: "frame__pic", alt: m.alt, focus: m.focus, sizes: "(min-width: 900px) 60vw, 100vw" });
      return `<div class="zoom__frame" data-frame="${n}">${body}</div>`;
    }).join("\n        ");
    return scene(s, i, `
  <div class="zoom__stage" data-stage>
    <figure class="zoom__plate" data-plate style="aspect-ratio:${ratio(key(w.slug, s.sequence[0]))}">
      <div class="zoom__frames">
        ${frames}
      </div>
      <figcaption class="zoom__caption" data-caption>${s.sequence.map((id, n) => `<span data-cap="${n}">${esc(captions[id] || "")}</span>`).join("")}</figcaption>
    </figure>
    <div class="zoom__cartela">${cartela(w)}</div>
  </div>`, { id: w.slug, cls: "is-work" });
  },

  line(s, ctx, i) {
    const w = ctx.bySlug.get(s.work);
    const m = byId(w, s.media);
    const vida = sentence(ctx.site, s.sentence);
    return scene(s, i, `
  <div class="line__inner">
    <blockquote class="words words--line">
      <p class="ink-text" data-ink>${inkWords(vida.text)}</p>
      <footer>Tomás Canales</footer>
    </blockquote>
    <figure class="line__clip" style="aspect-ratio:${ratio(key(w.slug, m.id))}">
      ${video(key(w.slug, m.id), { cls: "line__video", alt: m.alt })}
      <figcaption>${esc(m.caption || "")} <a href="/work/${w.slug}/">${esc(w.title)}</a></figcaption>
    </figure>
  </div>`, { label: "Cada línea" });
  },

  process(s, ctx, i) {
    const w = ctx.bySlug.get(s.work);
    const vida = sentence(ctx.site, s.sentence);
    const steps = s.sequence.map((id) => byId(w, id));
    const detailCaption = "Detalle de la caligrafía y el icosaedro.";
    return scene(s, i, `
  <div class="process__stage" data-stage>
    <div class="process__monitor" style="aspect-ratio:${ratio(key(w.slug, steps[0].id))}">
      ${steps.map((m, n) => `<div class="process__frame" data-frame="${n}">${
        m.type === "video"
          ? video(key(w.slug, m.id), { cls: "frame__media", alt: m.alt, autoplay: false })
          : picture(key(w.slug, m.id), { cls: "frame__pic", alt: m.alt, focus: m.focus, sizes: "(min-width: 900px) 42vw, 100vw" })
      }</div>`).join("\n      ")}
    </div>
    <div class="process__text">
      <p class="process__lead ink-text" data-ink>${inkWords(vida.text)}</p>
      <ol class="process__steps">
        ${steps.map((m, n) => `<li data-step="${n}">${esc(m.caption || detailCaption)}</li>`).join("\n        ")}
      </ol>
      ${cartela(w, { level: 2 })}
    </div>
  </div>`, { id: w.slug, cls: "is-work" });
  },

  layers(s, ctx, i) {
    const w = ctx.bySlug.get(s.work);
    const [a, b] = s.sequence.map((id) => byId(w, id));
    return scene(s, i, `
  <div class="layers__stage">
    <p class="layers__word" data-depth="-0.28" aria-hidden="true">${esc(w.title)}</p>
    <figure class="layers__main" data-depth="0.06" style="aspect-ratio:${ratio(key(w.slug, a.id))}">
      ${picture(key(w.slug, a.id), { alt: a.alt, focus: a.focus, sizes: "(min-width: 900px) 40vw, 90vw" })}
    </figure>
    <figure class="layers__detail" data-depth="0.34" style="aspect-ratio:${ratio(key(w.slug, b.id))}">
      ${picture(key(w.slug, b.id), { alt: b.alt, focus: b.focus, sizes: "(min-width: 900px) 24vw, 60vw" })}
      <figcaption>En violeta, lo que todavía es stencil: <em>${esc(w.stencilText || "")}</em></figcaption>
    </figure>
    <div class="layers__cartela">${cartela(w)}</div>
  </div>`, { id: w.slug, cls: "is-work" });
  },

  ink(s, ctx, i) {
    const a = ctx.bySlug.get(s.work);
    const b = ctx.bySlug.get(s.next.work);
    const ma = byId(a, s.media), mb = byId(b, s.next.media);
    const ka = key(a.slug, ma.id), kb = key(b.slug, mb.id);
    return scene(s, i, `
  <div class="ink__stage" data-stage>
    <div class="ink__frame" data-ink-stage style="aspect-ratio:${ratio(ka)}">
      <div class="ink__img" data-ink-frame data-displace-src="${imageURL(ka, 1200)}">${picture(ka, { alt: ma.alt, focus: ma.focus, sizes: "(min-width: 900px) 38vw, 88vw" })}</div>
      <div class="ink__img" data-ink-frame data-displace-src="${imageURL(kb, 1200)}">${picture(kb, { alt: mb.alt, focus: mb.focus, sizes: "(min-width: 900px) 38vw, 88vw" })}</div>
    </div>
    <div class="ink__cartelas">
      <div class="ink__cartela" data-cartela="0">${cartela(a)}</div>
      <div class="ink__cartela" data-cartela="1">${cartela(b)}</div>
    </div>
  </div>`, { id: a.slug, cls: "is-work" });
  },

  film(s, ctx, i) {
    const w = ctx.bySlug.get(s.work);
    const m = byId(w, s.media);
    const k = key(w.slug, m.id);
    const e = entry(k);
    return scene(s, i, `
  <div class="film__stage" data-stage>
    <div class="film__ambient" aria-hidden="true" style="background-image:url(${e.base}-poster-480.jpg)"></div>
    <div class="film__screen" data-screen style="aspect-ratio:${ratio(k)}">
      ${video(k, { cls: "film__video", alt: m.alt, autoplay: false })}
    </div>
    <p class="film__title" aria-hidden="true" data-drift>${esc(w.title)}</p>
    <div class="film__cartela">${cartela(w)}</div>
  </div>`, { id: w.slug, cls: "is-work" });
  },

  gallery(s, ctx, i) {
    const items = ctx.published.map((w) => {
      const cover = key(w.slug, w.cover);
      const m = byId(w, w.cover);
      return `<li class="gallery__item">
        <a class="gallery__link" href="/work/${w.slug}/">
          <span class="plate" style="aspect-ratio:${ratio(cover)}">${still(cover, { alt: m.alt, sizes: "(min-width: 900px) 22vw, 70vw" })}</span>
          <span class="gallery__title">${esc(w.title)}</span>
          <span class="gallery__meta">${esc(w.bodyPlacement)}</span>
        </a>
      </li>`;
    }).join("\n      ");
    return scene(s, i, `
  <div class="gallery__head">
    <h2 class="gallery__heading" id="archivo">Archivo</h2>
    <p class="gallery__count">${ctx.published.length} obras. <a href="/work/">Verlas todas</a></p>
  </div>
  <div class="gallery__viewport" data-viewport>
    <ol class="gallery__track" data-track>
      ${items}
    </ol>
  </div>`, { labelledby: "archivo" });
  },

  words(s, ctx, i) {
    const vida = sentence(ctx.site, s.sentence);
    return scene(s, i, `
  <div class="words-scene__inner">
    <blockquote class="words words--final">
      <p class="ink-text" data-ink>${inkWords(vida.text)}</p>
      <footer>Tomás Canales</footer>
    </blockquote>
    ${mark({ cls: "words-scene__mark" })}
  </div>`, { label: "Para siempre" });
  },

  artist(s, ctx, i) {
    const site = ctx.site;
    const item = (id) => site.media.items.find((m) => m.id === id);
    const del = item("artista-delacroix"), ver = item("artista-veronese"), studio = item("vida-estudio"), voz = entry("site/vida-voz");
    return scene(s, i, `
  <div class="artist__grid">
    <figure class="artist__main" style="aspect-ratio:${ratio("site/artista-delacroix")}">
      ${picture("site/artista-delacroix", { alt: del.alt, focus: del.focus, sizes: "(min-width: 900px) 44vw, 100vw" })}
    </figure>
    <figure class="artist__second" data-depth="0.18" style="aspect-ratio:${ratio("site/artista-veronese")}">
      ${picture("site/artista-veronese", { alt: ver.alt, focus: ver.focus, sizes: "(min-width: 900px) 20vw, 50vw" })}
    </figure>
    <div class="artist__text">
      <h2 class="artist__name" id="artista">Tomás Canales</h2>
      <p class="artist__role">Tatuador. Tatúa en su estudio, ${esc(site.studio)}, en ${esc(site.city)} (${esc(site.address.province)}).</p>
      <div class="voice" data-voice>
        <button class="voice__play" type="button" data-voice-play aria-pressed="false" aria-describedby="voice-note">
          ${mark({ cls: "voice__mark" })}<span data-voice-label>Escuchar a Tomás</span>
        </button>
        <p class="voice__note" id="voice-note">Su voz, ${Math.round(voz.duration)} segundos. El texto completo está en esta página.</p>
        <p class="voice__caption" data-voice-caption aria-live="off"></p>
        <audio preload="none" data-voice-audio>
          <source src="${voz.base}.webm" type="audio/webm">
          <source src="${voz.base}.m4a" type="audio/mp4">
        </audio>
      </div>
      <a class="artist__more" href="/about/">Sobre Tomás y el estudio</a>
    </div>
  </div>
  <figure class="artist__studio" style="aspect-ratio:${ratio("site/vida-estudio")}">
    ${video("site/vida-estudio", { cls: "artist__studio-video", alt: studio.alt })}
    <figcaption>En el estudio.</figcaption>
  </figure>`, { labelledby: "artista" });
  },

  booking(s, ctx, i) {
    const site = ctx.site;
    return scene(s, i, `
  <div class="booking__inner">
    <p class="booking__epigraph">«…hacia la persona que me confía su piel.»</p>
    <h2 class="booking__title" id="reservar"><a href="/booking/" data-track="booking_start">Reservar cita</a></h2>
    <p class="booking__text">Cuéntale la idea, la zona del cuerpo y el tamaño aproximado. El formulario prepara el mensaje y lo envía por WhatsApp.</p>
    <ul class="booking__channels">
      <li><a href="https://wa.me/${site.contact.whatsapp}" data-wa="booking">WhatsApp</a></li>
      <li><a href="https://instagram.com/${site.contact.instagram}" data-ig>Instagram</a></li>
      <li><a href="mailto:${site.contact.email}" data-mail>Correo</a></li>
    </ul>
  </div>`, { labelledby: "reservar" });
  }
};

/* --------------------------------------------------------------- página */
export function renderHome(ctx) {
  const { site, exhibition, published } = ctx;
  const hero = exhibition.scenes.find((s) => s.kind === "intro");
  const heroKey = key(hero.work, hero.media);
  const heroE = entry(heroKey);
  const ogImage = imageURL("medusa-zodiaco/plano-cerrado", 1200);

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": abs(site, "/#web"),
        url: abs(site, "/"),
        name: site.brand,
        inLanguage: "es-ES",
        publisher: { "@id": abs(site, "/#persona") }
      },
      personLD(site),
      parlorLD(site, ogImage),
      {
        "@type": "WebPage",
        "@id": abs(site, "/#pagina"),
        url: abs(site, "/"),
        name: `${site.brand}, tatuador en ${site.place}`,
        isPartOf: { "@id": abs(site, "/#web") },
        about: { "@id": abs(site, "/#persona") },
        primaryImageOfPage: abs(site, ogImage),
        inLanguage: "es-ES"
      }
    ]
  };

  const body = exhibition.scenes.map((s, i) => {
    const fn = K[s.kind];
    if (!fn) throw new Error(`exhibition.json: kind desconocido "${s.kind}"`);
    return fn(s, ctx, i);
  }).join("\n\n");

  return `${head({
    site,
    title: `${site.brand} · Tatuador en ${site.place} | Realismo en negro y gris y línea fina`,
    description: `${site.person} tatúa en ${site.studio}, en ${site.city} (${site.address.province}): realismo en negro y gris, línea fina y geometría. Recorre su obra como una exposición y reserva cita.`,
    path: "/",
    image: site.share.src,
    imageAlt: site.share.alt,
    ld: [ld],
    light: "night",
    preload: [
      `<link rel="preload" as="image" href="${heroE.base}-poster-720.jpg" fetchpriority="high">`
    ]
  })}
<body class="page page--home">
<div class="loader" data-loader aria-hidden="true">
  ${ritual()}
  <p class="loader__name">Tomás Canales</p>
</div>
${hud({ room: "" })}
<main id="main" class="exhibition">
${body}
</main>
${footer(ctx)}
${scripts("home")}
</body>
</html>
`;
}
