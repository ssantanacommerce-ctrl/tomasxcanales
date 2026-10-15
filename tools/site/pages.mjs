/* ==========================================================================
   TOMASXCANALES · páginas interiores
   /work/<slug>/  cada obra     /work/  el archivo     /about/  el artista
   /booking/      reservar      404
   ========================================================================== */

import { esc, attrs, cx, picture, video, still, media, entry, imageURL, ratio, isoDuration, inkWords } from "./html.mjs";
import { head, hud, footer, scripts, personLD, parlorLD, breadcrumbLD, crumbs, abs, townLine, mapsURL } from "./layout.mjs";
import { mark } from "./symbols.mjs";

const k = (w, id) => `${w.slug}/${id}`;
const visible = (w) => w.media.filter((m) => !m.role.includes("unused"));

/* ------------------------------------------------------------ JSON-LD obra */
function artworkLD(site, w) {
  const imgs = visible(w).filter((m) => m.type === "image").map((m) => abs(site, imageURL(k(w, m.id), 1800)));
  const vids = visible(w).filter((m) => m.type === "video").map((m) => {
    const e = entry(k(w, m.id));
    return {
      "@type": "VideoObject",
      name: `${w.title}: ${m.caption ? m.caption.replace(/\.$/, "") : "vídeo"}`,
      description: m.alt,
      thumbnailUrl: abs(site, `${e.base}-poster-${e.poster.widths[e.poster.widths.length - 1]}.jpg`),
      contentUrl: abs(site, `${e.base}.mp4`),
      uploadDate: w.dateAdded,
      duration: isoDuration(e.duration),
      width: e.w,
      height: e.h,
      inLanguage: "es-ES"
    };
  });
  const art = {
    "@type": "VisualArtwork",
    "@id": abs(site, `/work/${w.slug}/#obra`),
    name: w.title,
    description: w.description,
    url: abs(site, `/work/${w.slug}/`),
    artform: "Tatuaje",
    artMedium: "Tinta sobre piel",
    artworkSurface: w.bodyPlacement,
    genre: w.styles,
    creator: { "@id": abs(site, "/#persona") },
    // SEO local: dónde se hizo la obra (solo la localidad, como en el resto de la web)
    locationCreated: {
      "@type": "Place",
      name: site.studio,
      address: { "@type": "PostalAddress", addressRegion: site.region, addressCountry: site.country }
    },
    ...(w.year ? { dateCreated: String(w.year) } : {}),
    creativeWorkStatus: w.status ? "Incomplete" : "Published",
    image: imgs.length ? imgs : vids.map((v) => v.thumbnailUrl),
    inLanguage: "es-ES"
  };
  if (vids.length) art.video = vids;
  return art;
}

/* ------------------------------------------------------------ /work/<slug>/ */
export function renderWork(ctx, w, i) {
  const { site, published, bySlug } = ctx;
  const items = visible(w);
  const coverKey = k(w, w.cover);
  const cover = items.find((m) => m.id === w.cover);
  const rest = items.filter((m) => m.id !== w.cover);
  const prev = published[(i - 1 + published.length) % published.length];
  const next = published[(i + 1) % published.length];
  const related = (w.related || []).map((s) => bySlug.get(s)).filter((r) => r && r.published);
  const ogImage = imageURL(coverKey, 1200);
  const path = `/work/${w.slug}/`;
  const trail = [{ name: "Inicio", path: "/" }, { name: "Obra", path: "/work/" }, { name: w.title, path }];

  const heroMedia = cover.type === "video"
    ? video(coverKey, { cls: "work-hero__media", alt: cover.alt, preload: "metadata" })
    : picture(coverKey, { cls: "work-hero__media", alt: cover.alt, focus: cover.focus, eager: true, sizes: "(min-width: 900px) 46vw, 100vw" });

  const gallery = rest.map((m, n) => {
    const layout = ["wide", "narrow", "offset"][n % 3];
    return `<figure class="${cx("work-media__item", `is-${layout}`, m.type === "video" && "is-video")}" style="aspect-ratio:${ratio(k(w, m.id))}">
        ${m.type === "video"
          ? video(k(w, m.id), { alt: m.alt })
          : picture(k(w, m.id), { alt: m.alt, focus: m.focus, sizes: layout === "wide" ? "(min-width: 900px) 58vw, 100vw" : "(min-width: 900px) 34vw, 100vw" })}
        ${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}
      </figure>`;
  }).join("\n      ");

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      artworkLD(site, w),
      personLD(site),
      breadcrumbLD(site, trail),
      {
        "@type": "WebPage",
        "@id": abs(site, `${path}#pagina`),
        url: abs(site, path),
        name: w.seo?.title || w.title,
        isPartOf: { "@id": abs(site, "/#web") },
        mainEntity: { "@id": abs(site, `${path}#obra`) },
        primaryImageOfPage: abs(site, ogImage),
        inLanguage: "es-ES"
      }
    ]
  };

  return `${head({
    site,
    title: `${w.seo?.title || w.title} | ${site.brand}`,
    description: w.seo?.description || w.description,
    path,
    image: ogImage,
    imageAlt: cover.alt,
    type: "article",
    ld: [ld],
    light: "day",
    preload: cover.type === "image" ? [] : [`<link rel="preload" as="image" href="${imageURL(coverKey, 720)}">`]
  })}
<body class="page page--work">
${hud({ current: "work", room: w.title })}
<main id="main" class="work">
  ${crumbs(trail)}
  <article class="work__article" data-light="day">
    <header class="work-hero">
      <div class="work-hero__text">
        ${w.status ? `<p class="work-hero__status">${esc(w.status)}</p>` : ""}
        <h1 class="work-hero__title" style="--longest:${Math.max(...w.title.split(" ").map((p) => p.length))}">${esc(w.title)}</h1>
        <p class="work-hero__desc">${esc(w.description)}</p>
        <dl class="cartela__meta work-hero__meta">
          <div><dt>Zona</dt><dd>${esc(w.bodyPlacement)}</dd></div>
          <div><dt>Técnica</dt><dd>${esc(w.styles.join(", "))}</dd></div>
          <div><dt>Material</dt><dd>${items.filter((m) => m.type === "image").length} fotografías, ${items.filter((m) => m.type === "video").length} vídeos</dd></div>
        </dl>
      </div>
      <figure class="${cx("work-hero__plate", cover.type === "video" && "is-video")}" style="aspect-ratio:${ratio(coverKey)}">
        ${heroMedia}
      </figure>
    </header>

    ${(w.body && w.body.length) || w.quote ? `<section class="work-body" aria-label="Sobre la obra">
      ${(w.body || []).map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
      ${w.quote ? `<blockquote class="work-body__quote"><p>${esc(w.quote.text)}</p><footer>${esc(w.quote.source)}</footer></blockquote>` : ""}
    </section>` : ""}

    ${rest.length ? `<section class="work-media" aria-label="Fotografías y vídeos">
      ${gallery}
    </section>` : ""}

    <section class="work-cta" aria-labelledby="cta-${w.slug}">
      <p class="work-cta__lead" id="cta-${w.slug}">¿Una idea en esta línea?</p>
      <a class="work-cta__link" href="/booking/" data-track="booking_start">Reservar cita</a>
    </section>
  </article>

  <nav class="work-pager" aria-label="Otras obras">
    <a class="work-pager__prev" href="/work/${prev.slug}/" rel="prev"><span>Anterior</span>${esc(prev.title)}</a>
    <a class="work-pager__all" href="/work/">Archivo</a>
    <a class="work-pager__next" href="/work/${next.slug}/" rel="next"><span>Siguiente</span>${esc(next.title)}</a>
  </nav>

  ${related.length ? `<section class="related" aria-labelledby="rel-${w.slug}">
    <h2 class="related__title" id="rel-${w.slug}">Obras relacionadas</h2>
    <ul class="related__list">
      ${related.map((r) => `<li><a href="/work/${r.slug}/">
        <span class="plate" style="aspect-ratio:${ratio(k(r, r.cover))}">${still(k(r, r.cover), { alt: r.media.find((m) => m.id === r.cover).alt, sizes: "(min-width: 900px) 28vw, 80vw" })}</span>
        <span class="related__name">${esc(r.title)}</span><span class="related__meta">${esc(r.bodyPlacement)}</span></a></li>`).join("\n      ")}
    </ul>
  </section>` : ""}
</main>
${footer(ctx)}
${scripts("page")}
</body>
</html>
`;
}

/* -------------------------------------------------------------- /work/ */
/* Filtros del archivo: familias, no etiquetas sueltas. "Geometría sagrada"
   entra en "Geometría"; "Negro y gris" no filtra nada (lo es todo el
   archivo). Un filtro solo aparece cuando al menos dos obras lo comparten:
   según crezca el archivo, aparecerán solos los que tengan sentido. */
const FAMILY = { "Geometría sagrada": "Geometría", "Negro y gris": null };
const families = (w) => [...new Set(w.styles.map((s) => (s in FAMILY ? FAMILY[s] : s)).filter(Boolean))];

export function renderArchive(ctx) {
  const { site, published } = ctx;
  const count = new Map();
  for (const w of published) for (const f of families(w)) count.set(f, (count.get(f) || 0) + 1);
  const styles = [...count.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([f]) => f);
  const trail = [{ name: "Inicio", path: "/" }, { name: "Obra", path: "/work/" }];
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": abs(site, "/work/#pagina"),
        url: abs(site, "/work/"),
        name: `Obra de ${site.brand}`,
        isPartOf: { "@id": abs(site, "/#web") },
        inLanguage: "es-ES",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: published.length,
          itemListElement: published.map((w, n) => ({
            "@type": "ListItem",
            position: n + 1,
            url: abs(site, `/work/${w.slug}/`),
            name: w.title
          }))
        }
      },
      breadcrumbLD(site, trail)
    ]
  };
  const cards = published.map((w, n) => {
    const cover = k(w, w.cover);
    const m = w.media.find((x) => x.id === w.cover);
    return `<li class="archive__item" data-styles="${esc(families(w).join("|"))}" style="--n:${n}">
      <a href="/work/${w.slug}/">
        <span class="plate" style="aspect-ratio:${ratio(cover)}">${still(cover, { alt: m.alt, sizes: "(min-width: 1100px) 30vw, (min-width: 700px) 45vw, 92vw", eager: n < 2 })}</span>
        <span class="archive__title">${esc(w.title)}</span>
        <span class="archive__meta">${esc(w.bodyPlacement)}. ${esc(w.styles.join(", "))}</span>
        ${w.status ? `<span class="archive__status">${esc(w.status)}</span>` : ""}
      </a>
    </li>`;
  }).join("\n    ");

  return `${head({
    site,
    title: `Obra | ${site.brand}, tatuador en ${site.place}`,
    description: `Archivo de ${site.brand}: ${published.length} obras en realismo negro y gris, línea fina y geometría. Cada pieza con sus fotografías, vídeos, zona del cuerpo y técnica.`,
    path: "/work/",
    image: site.share.src,
    imageAlt: site.share.alt,
    ld: [ld],
    light: "day"
  })}
<body class="page page--archive">
${hud({ current: "work", room: "Archivo" })}
<main id="main" class="archive" data-light="day">
  ${crumbs(trail)}
  <header class="archive__head">
    <h1 class="archive__heading">Obra</h1>
    <p class="archive__intro">${published.length} obras tatuadas por Tomás Canales. Todas en negro y gris.</p>
  </header>
  <div class="archive__filters" role="group" aria-label="Filtrar por técnica" data-filters hidden>
    <button type="button" aria-pressed="true" data-filter="*">Todas</button>
    ${styles.map((s) => `<button type="button" aria-pressed="false" data-filter="${esc(s)}">${esc(s)}</button>`).join("\n    ")}
  </div>
  <ol class="archive__grid" data-archive>
    ${cards}
  </ol>
</main>
${footer(ctx)}
${scripts("page")}
</body>
</html>
`;
}

/* ------------------------------------------------------------- /about/ */
export function renderAbout(ctx) {
  const { site } = ctx;
  const item = (id) => site.media.items.find((m) => m.id === id);
  const del = item("artista-delacroix"), ver = item("artista-veronese"), studio = item("vida-estudio");
  const voz = entry("site/vida-voz");
  const trail = [{ name: "Inicio", path: "/" }, { name: "Artista", path: "/about/" }];
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": abs(site, "/about/#pagina"),
        url: abs(site, "/about/"),
        name: `${site.person}, tatuador`,
        mainEntity: { "@id": abs(site, "/#persona") },
        isPartOf: { "@id": abs(site, "/#web") },
        inLanguage: "es-ES"
      },
      { ...personLD(site), image: abs(site, imageURL("site/artista-delacroix", 1200)), description: site.vida.sentences[0].text },
      parlorLD(site, imageURL("medusa-zodiaco/plano-cerrado", 1200)),
      breadcrumbLD(site, trail)
    ]
  };

  return `${head({
    site,
    title: `${site.person}, tatuador | ${site.brand}, ${site.place}`,
    description: `${site.person} tatúa en su estudio, ${site.studio}, en ${site.place}. «Considero el tatuaje una ceremonia en la que se inmortalizan sentimientos, recuerdos, intenciones y sueños.»`,
    path: "/about/",
    image: imageURL("site/artista-delacroix", 1200),
    imageAlt: del.alt,
    type: "profile",
    ld: [ld],
    light: "day"
  })}
<body class="page page--about">
${hud({ current: "about", room: site.person })}
<main id="main" class="about" data-light="day">
  ${crumbs(trail)}
  <header class="about__head">
    <h1 class="about__name">${esc(site.person)}</h1>
    <p class="about__role">Tatuador en ${esc(site.studio)}, ${esc(site.place)}.</p>
  </header>

  <div class="about__grid">
    <figure class="about__main" style="aspect-ratio:${ratio("site/artista-delacroix")}">
      ${picture("site/artista-delacroix", { alt: del.alt, focus: del.focus, eager: true, sizes: "(min-width: 900px) 48vw, 100vw" })}
    </figure>
    <section class="about__statement" aria-labelledby="declaracion">
      <h2 class="about__h2" id="declaracion">Con sus palabras</h2>
      <div class="statement" data-voice-text>
        ${site.vida.sentences.map((s) => `<p data-sentence="${s.id}">${s.cues.map((c) => `<span data-cue="${c[0]}:${c[1]}">${esc(c[2])}</span>`).join(" ")}</p>`).join("\n        ")}
      </div>
      <div class="voice" data-voice>
        <button class="voice__play" type="button" data-voice-play aria-pressed="false">
          ${mark({ cls: "voice__mark" })}<span data-voice-label>Escuchar a Tomás</span>
        </button>
        <p class="voice__note">Texto transcrito de su declaración, leída con su voz (${Math.round(voz.duration)} s).</p>
        <audio preload="none" data-voice-audio>
          <source src="${voz.base}.webm" type="audio/webm">
          <source src="${voz.base}.m4a" type="audio/mp4">
        </audio>
      </div>
    </section>
    <figure class="about__second" style="aspect-ratio:${ratio("site/artista-veronese")}">
      ${picture("site/artista-veronese", { alt: ver.alt, focus: ver.focus, sizes: "(min-width: 900px) 30vw, 100vw" })}
    </figure>
  </div>

  <section class="about__studio" aria-labelledby="estudio">
    <h2 class="about__h2" id="estudio">El estudio</h2>
    <figure class="about__studio-film" style="aspect-ratio:${ratio("site/vida-estudio")}">
      ${video("site/vida-estudio", { alt: studio.alt })}
    </figure>
    <p class="about__studio-text">${esc(site.studio)}, en ${esc(townLine(site))}. La dirección y la hora se confirman al cerrar la cita. <a href="${mapsURL(site)}" target="_blank" rel="noopener" data-track="maps_click">Ver en Google Maps</a></p>
  </section>

  <section class="about__work" aria-labelledby="sobre-obra">
    <h2 class="about__h2" id="sobre-obra">La obra</h2>
    <p>Todo el archivo está tatuado en negro y gris: realismo, micro-realismo, línea fina y geometría. <a href="/work/">Ver las ${ctx.published.length} obras</a>.</p>
  </section>

  <section class="work-cta" aria-labelledby="about-cta">
    <p class="work-cta__lead" id="about-cta">¿Tienes una idea?</p>
    <a class="work-cta__link" href="/booking/" data-track="booking_start">Reservar cita</a>
  </section>
</main>
${footer(ctx)}
${scripts("page")}
</body>
</html>
`;
}

/* ----------------------------------------------------------- /booking/ */
const faq = (site) => [
  ["¿Cómo reservo cita?", "Todas las citas se piden con el formulario de esta página: cuatro preguntas sobre tu idea. Al enviarlo se abre WhatsApp con tus respuestas ya escritas y solo tienes que mandarlo."],
  ["¿Qué información hay que mandar?", "La idea contada con tus palabras, la zona del cuerpo, el tamaño aproximado y cuándo te gustaría hacerlo. Las fotos de referencia, mejor enviarlas después por WhatsApp."],
  ["¿Cómo trabaja las ideas que le llegan?", "Con sus palabras: «Mi proceso creativo se basa en transformar las ideas que recibo en un lenguaje propio, simbólico y evolutivo.»"],
  ["¿Hace tatuajes en color?", "Todo el trabajo que aparece en esta web está tatuado en negro y gris. Si buscas color, pregúntalo antes de reservar."],
  ["¿Cuánto cuesta y cuántas sesiones hacen falta?", "Depende del tamaño, de la zona y del nivel de detalle. Con la idea, la zona y el tamaño aproximado se puede valorar el proyecto antes de reservar."],
  ["¿Dónde tatúa?", `En su estudio, ${site.studio}, en ${townLine(site)}. La dirección exacta y la hora se confirman al cerrar la cita.`]
];

export function renderBooking(ctx) {
  const { site } = ctx;
  const trail = [{ name: "Inicio", path: "/" }, { name: "Reservar cita", path: "/booking/" }];
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": abs(site, "/booking/#pagina"),
        url: abs(site, "/booking/"),
        name: `Reservar cita con ${site.brand}`,
        isPartOf: { "@id": abs(site, "/#web") },
        inLanguage: "es-ES"
      },
      {
        "@type": "FAQPage",
        "@id": abs(site, "/booking/#preguntas"),
        mainEntity: faq(site).map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))
      },
      parlorLD(site, imageURL("medusa-zodiaco/plano-cerrado", 1200)),
      breadcrumbLD(site, trail)
    ]
  };
  const first = site.person.split(" ")[0];
  // Respaldo sin JavaScript: el chat, sin mensaje prerredactado.
  const directHref = `https://wa.me/${site.contact.whatsapp}`;
  // Sin rayas largas en el texto visible: lo comprueba tools/check.mjs
  const SIZE_HINTS = ["Pequeño · hasta 10 cm", "Mediano · 10 a 20 cm", "Grande · 20 a 30 cm", "Brazo o espalda completa"];
  const WHEN_HINTS = ["Lo antes posible", "En 1 a 3 meses", "En 3 a 6 meses", "Sin prisa"];
  // La flecha va en SVG: "→" (U+2192) no está en DM Mono ni en Melodrama y caía a
  // la fuente del sistema (Times New Roman en Windows).
  const ARROW = `<svg class="arrow" viewBox="0 0 20 12" width="20" height="12" aria-hidden="true" focusable="false"><path d="M0 6h18.5M13.5 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
  const chips = (name, label, hints) => `<div class="chips" role="group" aria-label="${label}">
            ${hints.map((h) => `<button class="chip" type="button" data-fill="${name}" data-value="${esc(h)}" aria-pressed="false">${esc(h)}</button>`).join("\n            ")}
          </div>`;

  return `${head({
    site,
    title: `Reservar cita | ${site.brand}, tatuador en ${site.place}`,
    description: `Reserva cita con ${site.person} en ${site.studio}, ${site.place}. Cuéntale la idea, la zona del cuerpo y el tamaño: el formulario prepara el mensaje y lo envía por WhatsApp.`,
    path: "/booking/",
    image: site.share.src,
    imageAlt: site.share.alt,
    ld: [ld],
    light: "day"
  })}
<body class="page page--booking">
${hud({ current: "booking", room: "Reservar cita" })}
<main id="main" class="booking-page" data-light="day">
  ${crumbs(trail)}
  <header class="booking-page__head">
    <h1 class="booking-page__title">Reservar cita</h1>
    <p class="booking-page__epigraph">«Cada línea que realizo es intencionada y refleja respeto, paciencia y conciencia hacia la persona que me confía su piel.»</p>
  </header>

  <div class="booking-page__grid">
    <div class="booking-page__form">
      <noscript>
        <div class="nojs">
          <p>Para preparar tu mensaje automáticamente hace falta JavaScript.</p>
          <p>Puedes escribir directamente a ${esc(first)} por WhatsApp y contarle tu idea, la zona, el tamaño y cuándo te gustaría hacerlo:</p>
          <a class="nojs__link" href="${directHref}">Abrir WhatsApp · ${esc(site.contact.whatsappDisplay)}</a>
        </div>
      </noscript>

      <form class="qs" id="booking-form" novalidate aria-describedby="qs-note qs-privacy">
        <div class="qs__progress" aria-hidden="true">
          <span class="qs__track"><span class="qs__fill" data-progress></span></span>
          <span class="qs__tally"><span data-progress-n>0</span> / 4</span>
        </div>

        <ol class="qs__list">
          <li class="q" data-q="nombre">
            <label class="q__head" for="q-nombre">
              <span class="q__n" aria-hidden="true">01</span>
              <span class="q__text">¿Cómo te llamas?</span>
            </label>
            <div class="q__body">
              <input class="q__input" id="q-nombre" name="nombre" type="text" autocomplete="name" autocapitalize="words" enterkeyhint="next" maxlength="80" placeholder="Tu nombre" required aria-describedby="err-nombre">
              <p class="q__err" id="err-nombre" data-err="nombre"></p>
            </div>
          </li>

          <li class="q" data-q="idea">
            <label class="q__head" for="q-idea">
              <span class="q__n" aria-hidden="true">02</span>
              <span class="q__text">¿Qué idea tienes para tu tatuaje y en qué zona del cuerpo quieres realizarlo?</span>
            </label>
            <div class="q__body">
              <textarea class="q__input q__input--area" id="q-idea" name="idea" rows="3" maxlength="1000" required placeholder="Por ejemplo: un símbolo con un significado personal para mí, en el antebrazo interior…" aria-describedby="err-idea hint-idea"></textarea>
              <div class="q__meta">
                <p class="q__hint" id="hint-idea">Cuéntalo con libertad. Las fotos de referencia irán después, por WhatsApp.</p>
                <span class="q__count" aria-hidden="true"><span data-count>0</span>/1000</span>
              </div>
              <p class="q__err" id="err-idea" data-err="idea"></p>
            </div>
          </li>

          <li class="q" data-q="tamano">
            <label class="q__head" for="q-tamano">
              <span class="q__n" aria-hidden="true">03</span>
              <span class="q__text">¿Qué tamaño aproximado tienes en mente?</span>
            </label>
            <div class="q__body">
              ${chips("tamano", "Sugerencias de tamaño", SIZE_HINTS)}
              <input class="q__input" id="q-tamano" name="tamano" type="text" maxlength="120" enterkeyhint="next" required placeholder="O escríbelo: unos 15 cm de alto…" aria-describedby="err-tamano">
              <p class="q__err" id="err-tamano" data-err="tamano"></p>
            </div>
          </li>

          <li class="q" data-q="cuando">
            <label class="q__head" for="q-cuando">
              <span class="q__n" aria-hidden="true">04</span>
              <span class="q__text">¿Cuándo te gustaría realizarlo?</span>
            </label>
            <div class="q__body">
              ${chips("cuando", "Sugerencias de fecha", WHEN_HINTS)}
              <input class="q__input" id="q-cuando" name="cuando" type="text" maxlength="120" enterkeyhint="done" required placeholder="O escríbelo: a partir de junio…" aria-describedby="err-cuando">
              <p class="q__err" id="err-cuando" data-err="cuando"></p>
            </div>
          </li>
        </ol>

        <div class="qs__send">
          <p class="qs__note" id="qs-note">
            <svg class="qs__wa" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.2l-.5-.2Z"/></svg>
            <span>Una vez envíes tu solicitud, se abrirá WhatsApp. Envía allí tus fotos de referencia para que ${esc(first)} pueda hacerse una mejor idea de lo que buscas. Esta web no guarda nada de lo que escribes.</span>
          </p>

          <p class="qs__privacy" id="qs-privacy">
            Responsable: ${esc(ctx.legal.holder)}. Finalidad: responder a tu solicitud de cita. Esta web no recibe tus respuestas: viajan por WhatsApp cuando pulsas enviar. Puedes acceder a tus datos, corregirlos o pedir que se borren escribiendo a ${esc(site.contact.email)}. Más información en <a href="/privacidad/">Privacidad</a>.
          </p>

          <p class="qs__summary" data-summary role="alert" hidden></p>

          <button class="qs__btn" type="submit">
            <span class="qs__btn-label">Enviar mi proyecto</span>
            <span class="qs__btn-sub">Continúa en WhatsApp</span>
            <span class="qs__btn-arrow" aria-hidden="true">${ARROW}</span>
          </button>

          <div class="qs__done" data-done role="status" hidden>
            <p class="qs__done-title">Tu mensaje está listo en WhatsApp.</p>
            <p class="qs__done-text">Recuerda enviar allí tus fotos de referencia. Si no se ha abierto solo, usa este enlace:</p>
            <a class="qs__done-link" data-done-link href="${directHref}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp ${ARROW}</a>
          </div>
        </div>
      </form>
    </div>

    <aside class="booking-page__aside" aria-label="Dónde está el estudio">
      <p class="booking-page__aside-title">Dónde</p>
      <address class="booking-page__address">${esc(site.studio)}<br>${esc(townLine(site))}</address>
      <a class="booking-page__map" href="${mapsURL(site)}" target="_blank" rel="noopener" data-track="maps_click">Ver en Google Maps</a>
    </aside>
  </div>

  <section class="faq" id="preguntas" aria-labelledby="faq-title">
    <h2 class="faq__title" id="faq-title">Preguntas</h2>
    ${faq(site).map(([q, a]) => `<details class="faq__item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n    ")}
  </section>
</main>
${footer(ctx)}
${scripts("booking")}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ 404 */
export function renderNotFound(ctx) {
  const { site } = ctx;
  return `${head({
    site,
    title: `Página no encontrada | ${site.brand}`,
    description: `Esta página no existe. Vuelve a la obra de ${site.brand}, tatuador en ${site.place}.`,
    path: "/404.html",
    noindex: true,
    light: "night"
  })}
<body class="page page--404">
${hud({ room: "" })}
<main id="main" class="notfound" data-light="night">
  ${mark({ cls: "notfound__mark" })}
  <h1 class="notfound__title">Esta página no existe</h1>
  <p class="notfound__text">Puede que la obra haya cambiado de dirección.</p>
  <ul class="notfound__links">
    <li><a href="/">Inicio</a></li>
    <li><a href="/work/">Obra</a></li>
    <li><a href="/booking/">Reservar cita</a></li>
  </ul>
</main>
${scripts("page")}
</body>
</html>
`;
}
