/* ==========================================================================
   TOMASXCANALES · las escenas de la exposición

   Cada escena de la home declara data-kind y aquí hay un comportamiento por
   kind. Ninguna obra entra con el mismo gesto que la anterior: si dos
   tatuajes aparecen igual, el recorrido deja de tener ritmo.

   Cada función recibe { desk, mode } desde home.js:
     desk   maquetación de escritorio (901 px o más) o de móvil
     mode   "pin"    escritorio con ratón: GSAP fija la escena (pin)
            "stick"  móvil y tableta: la escena es position: sticky (CSS) y
                     GSAP solo anima lo de dentro. Con el scroll de inercia
                     del dedo, un pin de JS da tirones y descoloca la escena;
                     sticky lo resuelve el navegador y no se mueve nunca.
   En móvil cada escena tiene su propia coreografía: el texto se retira
   ANTES de que la imagen crezca, así que nunca hay una foto encima de texto
   que todavía se ve. Todo se revierte solo al cambiar de tamaño
   (gsap.matchMedia en home.js).
   ========================================================================== */

import { gsap, ScrollTrigger, coarse } from "../core/motion.js";
import { inkTo, inkScrub, letters } from "../core/type.js";
import { safePlay, useScrubSource, useMobileSource } from "../core/media.js";
import { initDisplace } from "./displace.js";

const frames = (root, sel) => [...root.querySelectorAll(sel)];
const hudH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hud-h")) || 60;

/** Recorrido de una escena: `dist` alturas de pantalla de scroll mientras la
    escena está quieta. En "pin" la fija GSAP; en "stick" la sección crece
    (--track, ver home.css) y el escenario es sticky. */
function track(section, stage, mode, dist) {
  if (mode === "pin") {
    return { trigger: section, start: "top top", end: `+=${dist * 100}%`, pin: stage, anticipatePin: 1, scrub: 0.8 };
  }
  gsap.set(section, { "--track": dist });
  return { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6 };
}

/** Fundido entre fotogramas apilados según un progreso 0..1 dividido en tramos.
    El nuevo entra entero POR ENCIMA del anterior y solo después se retira el
    viejo: nunca hay un instante con las dos capas a medias (se vería sucio). */
function crossfade(tl, list, at, dur = 0.08) {
  list.forEach((el, i) => {
    if (i === 0) return;
    tl.to(el, { opacity: 1, duration: dur, ease: "power1.inOut" }, at[i - 1]);
    tl.set(list[i - 1], { opacity: 0 }, at[i - 1] + dur);
  });
}

/** Las imágenes de una escena fijada se piden antes de que la escena llegue:
    si cargaran en diferido en el momento del fundido, se vería el hueco. */
function preload(section, ahead = "150%") {
  const imgs = [...section.querySelectorAll('img[loading="lazy"]')];
  if (!imgs.length) return;
  ScrollTrigger.create({
    trigger: section,
    start: `top bottom+=${ahead}`,
    once: true,
    onEnter: () => imgs.forEach((img) => { img.loading = "eager"; })
  });
}

/* ------------------------------------------------------------------ ZOOM
   La obra cuelga pequeña en el muro, con su cartela. Al bajar crece hasta
   ocupar la vista: estás delante de la lámina. Dentro, el plano se acerca
   (match cut al plano cerrado) y al final el brazo gira: en escritorio el
   tiempo del vídeo va atado al scroll, así que bajar ES rodear la pieza.
   Móvil: la lámina cuelga arriba y la cartela debajo, sin tocarse; la
   cartela se va primero y luego la lámina baja al centro y crece a todo el
   ancho. */
export function zoom(section, { desk, mode }) {
  const stage = section.querySelector("[data-stage]");
  const plate = section.querySelector("[data-plate]");
  const list = frames(section, "[data-frame]");
  const caps = frames(section, "[data-cap]");
  const caption = section.querySelector(".zoom__caption");
  const cartela = section.querySelector(".zoom__cartela");
  const video = section.querySelector("video");
  const canScrub = !!(video && video.dataset.scrub && desk && !coarse);
  if (video && !canScrub) { video.loop = true; useMobileSource(video); }
  // la versión de scrub pesa: se pide solo cuando la escena se acerca
  if (canScrub) {
    ScrollTrigger.create({ trigger: section, start: "top bottom+=60%", once: true, onEnter: () => useScrubSource(video) });
  }

  const setCap = (i) => caps.forEach((c, n) => c.classList.toggle("is-on", n === i));
  setCap(0);
  preload(section);

  let duration = 0;
  if (video) video.addEventListener("loadedmetadata", () => { duration = video.duration; }, { once: true });

  let pending = null;
  const seek = (t) => {
    if (!video || !duration) return;
    pending = t;
    requestAnimationFrame(() => {
      if (pending === null) return;
      const target = Math.min(duration - 0.05, Math.max(0, pending * duration));
      if (Math.abs(video.currentTime - target) > 1 / 30) video.currentTime = target;
      pending = null;
    });
  };

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      ...track(section, stage, mode, desk ? 2.8 : 1.9),
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        setCap(p < 0.4 ? 0 : p < 0.56 ? 1 : 2);
        if (canScrub) seek(gsap.utils.mapRange(0.56, 0.97, 0, 1, p));
      },
      onEnter: () => { if (video && !canScrub) safePlay(video); },
      onEnterBack: () => { if (video && !canScrub) safePlay(video); },
      onLeave: () => video && !canScrub && video.pause(),
      onLeaveBack: () => video && !canScrub && video.pause()
    }
  });

  if (desk) {
    gsap.set(plate, { scale: 0.44 });
    tl.to(plate, { scale: 1, duration: 0.34, ease: "power2.inOut" }, 0.02)
      .to(cartela, { opacity: 0, y: 24, duration: 0.14, ease: "power1.in" }, 0.04);
  } else {
    // Lámina pequeña arriba, del ancho que deja libre la cartela de abajo
    const geo = () => {
      const H = stage.clientHeight, base = plate.offsetHeight || 1;
      const room = H - hudH() - 16 - cartela.offsetHeight - 22 - 22;
      const s = Math.max(0.42, Math.min(0.82, room / base));
      return { s, y: hudH() + 16 - (H - base * s) / 2 };
    };
    gsap.set(caption, { opacity: 0 });
    // El centrado va en el propio transform (xPercent/yPercent): si se deja
    // en el `translate` del CSS, GSAP lo absorbe y al animar `y` pierde la
    // mitad vertical (la lámina quedaba encima de la cartela en móviles bajos).
    tl.fromTo(plate,
      { xPercent: -50, yPercent: -50, scale: () => geo().s, y: () => geo().y },
      { xPercent: -50, yPercent: -50, scale: 1, y: 0, duration: 0.3, ease: "power2.inOut" }, 0.1)
      .fromTo(cartela, { opacity: 1, y: 0 }, { opacity: 0, y: 30, duration: 0.09, ease: "power1.in" }, 0)
      .to(caption, { opacity: 1, duration: 0.06 }, 0.38);
  }
  // match cut: el plano cerrado entra un poco más grande y se asienta
  const closeImg = list[1]?.querySelector("img, video");
  if (closeImg) tl.fromTo(closeImg, { scale: 1.1 }, { scale: 1, duration: 0.2, ease: "power2.out" }, 0.4);
  crossfade(tl, list, [0.4, 0.56], 0.06);
  tl.to(plate, { scale: desk ? 0.92 : 0.96, duration: 0.06, ease: "power1.inOut" }, 0.94);
}

/* ------------------------------------------------------------------ LINE
   Una frase de VIDA que se entinta al bajar, junto a la aguja trabajando.
   En móvil el clip va justo debajo de la frase: se mueve poco para no
   subirse encima de ella. */
export function line(section, { desk }) {
  const ink = section.querySelector("[data-ink]");
  if (ink) inkScrub(ink, { start: "top 78%", end: "bottom 48%" });
  const clip = section.querySelector(".line__clip");
  if (clip) {
    const amp = desk ? 12 : 4;
    gsap.fromTo(clip, { yPercent: amp }, {
      yPercent: -amp, ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
    });
  }
}

/* --------------------------------------------------------------- PROCESS
   Del stencil a la piel. Cuatro pasos reales del vídeo VIDA y la foto final,
   uno tras otro en el mismo marco, mientras la frase se entinta. En móvil se
   ve solo el paso que está en el marco (la lista entera no cabe). */
export function process(section, { desk, mode }) {
  const stage = section.querySelector("[data-stage]");
  const list = frames(section, "[data-frame]");
  const steps = frames(section, "[data-step]");
  const ink = section.querySelector("[data-ink]");
  const videos = list.map((f) => f.querySelector("video"));
  videos.forEach((v) => v && useMobileSource(v));
  preload(section);

  let active = -1;
  const activate = (i) => {
    if (i === active) return;
    active = i;
    steps.forEach((s, n) => s.classList.toggle("is-on", n === i));
    videos.forEach((v, n) => { if (!v) return; if (n === i) { v.loop = true; safePlay(v); } else v.pause(); });
  };

  const cuts = [0.26, 0.5, 0.74];
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      ...track(section, stage, mode, desk ? 3 : 2.2),
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        activate(p < cuts[0] ? 0 : p < cuts[1] ? 1 : p < cuts[2] ? 2 : 3);
        if (ink) inkTo(ink, gsap.utils.mapRange(0.02, 0.9, 0, 1, p));
      },
      onToggle: (self) => { if (!self.isActive) videos.forEach((v) => v && v.pause()); else active = -1; }
    }
  });
  steps[0]?.classList.add("is-on"); // el primer paso ya se lee antes de llegar (sin arrancar su vídeo)
  crossfade(tl, list, cuts, 0.05);
  tl.fromTo(section.querySelector(".process__monitor"), { scale: 0.94 }, { scale: 1, duration: 0.3, ease: "power2.out" }, 0);
  tl.to({}, { duration: 0.02 }, 0.98);
}

/* ---------------------------------------------------------------- LAYERS
   Profundidad de verdad: cada capa se mueve a su velocidad. Detrás, el
   nombre de la obra en mármol; en medio, la pieza; delante, el detalle con
   el stencil aún violeta. */
export function layers(section, { desk }) {
  section.querySelectorAll("[data-depth]").forEach((el) => {
    const d = parseFloat(el.dataset.depth) || 0;
    const amp = desk ? 1 : 0.4;
    gsap.fromTo(el, { yPercent: d * 60 * amp }, {
      yPercent: -d * 60 * amp,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
    });
  });
  const word = section.querySelector(".layers__word");
  if (word && desk) {
    gsap.fromTo(word, { xPercent: 4 }, {
      xPercent: -8, ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
    });
  }
  const main = section.querySelector(".layers__main img");
  if (main) {
    gsap.fromTo(main, { scale: 1.12 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "center center", scrub: true }
    });
  }
}

/* ------------------------------------------------------------------- INK
   Una obra se convierte en otra. El busto de mármol se queda quieto un
   momento, y después la tinta se desplaza y compone la manga egipcia: las
   dos fotos tienen la misma proporción, así que la transformación ocurre en
   el mismo marco. WebGL si hay; si no, fundido. */
export function ink(section, { desk, mode }) {
  const stage = section.querySelector("[data-stage]");
  const frameBox = section.querySelector("[data-ink-stage]");
  const imgs = frames(section, "[data-ink-frame]");
  const carts = frames(section, "[data-cartela]");
  preload(section);

  // displace.js marca la escena como "gl" cuando sus texturas están listas;
  // las texturas se piden cuando la escena se acerca, no al cargar la página
  const gl = desk && !coarse ? initDisplace(frameBox, imgs) : null;
  if (gl) ScrollTrigger.create({ trigger: section, start: "top bottom+=80%", once: true, onEnter: () => gl.load() });

  const state = { p: 0 };
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { ...track(section, stage, mode, desk ? 2.4 : 1.7), invalidateOnRefresh: true }
  });
  tl.fromTo(frameBox, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: "power2.out" }, 0)
    .to(state, {
      p: 1, duration: 0.46, ease: "power1.inOut",
      onUpdate: () => {
        if (gl) gl.set(state.p);
        else gsap.set(imgs[1], { opacity: state.p });
      }
    }, 0.3)
    .to(carts[0], { autoAlpha: 0, y: -16, duration: 0.1 }, 0.46)
    .fromTo(carts[1], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.6)
    .to({}, { duration: 0.2 }, 0.8);
}

/* ------------------------------------------------------------------ FILM
   El vídeo cuelga en el muro como una pieza más. Al bajar crece hasta la
   altura de la vista y la sala se apaga a su alrededor (su propio póster,
   desenfocado): pantalla completa sin reescalar el vídeo. El título lo
   cruza. Al salir, vuelve a su marco y se enciende la luz.
   Móvil: la pantalla arriba y la cartela debajo; la cartela se va antes de
   que la pantalla crezca y se centre. El título no cruza (en un móvil iría
   encima del vídeo). */
export function film(section, { desk, mode }) {
  const stage = section.querySelector("[data-stage]");
  const screen = section.querySelector("[data-screen]");
  const ambient = section.querySelector(".film__ambient");
  const title = section.querySelector(".film__title");
  const cartela = section.querySelector(".film__cartela");
  const video = screen.querySelector("video");
  if (video) { video.removeAttribute("data-autoplay"); useMobileSource(video); }

  // Escala y desplazamiento que dejan la pantalla al 98 % del alto, centrada
  const grow = () => Math.max(1, (stage.clientHeight * 0.98) / (screen.offsetHeight || 1));
  const center = () => stage.clientHeight / 2 - (screen.offsetTop + screen.offsetHeight / 2);

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      ...track(section, stage, mode, desk ? 2.4 : 1.8),
      invalidateOnRefresh: true,
      onToggle: (self) => { if (!video) return; if (self.isActive) safePlay(video); else video.pause(); },
      onUpdate: (self) => stage.classList.toggle("is-dark", self.progress > 0.22 && self.progress < 0.86)
    }
  });
  if (desk) {
    tl.to(cartela, { opacity: 0, y: 20, duration: 0.1, ease: "power1.in" }, 0.02)
      .to(screen, { scale: grow, duration: 0.3, ease: "power2.inOut" }, 0.04)
      .to(ambient, { opacity: 1, duration: 0.26 }, 0.06)
      .fromTo(title, { x: () => innerWidth, opacity: 0 }, { x: () => -title.scrollWidth, opacity: 1, duration: 0.62 }, 0.24)
      .to(title, { opacity: 0, duration: 0.06 }, 0.8)
      .to(screen, { scale: 1, duration: 0.14, ease: "power2.inOut" }, 0.84)
      .to(ambient, { opacity: 0, duration: 0.12 }, 0.86)
      .to(cartela, { opacity: 1, y: 0, duration: 0.08, ease: "power1.out" }, 0.92);
  } else {
    tl.fromTo(cartela, { opacity: 1, y: 0 }, { opacity: 0, y: 24, duration: 0.08, ease: "power1.in" }, 0)
      .to(screen, { scale: grow, y: center, duration: 0.28, ease: "power2.inOut" }, 0.09)
      .to(ambient, { opacity: 1, duration: 0.24 }, 0.1)
      .to(screen, { scale: 1, y: 0, duration: 0.14, ease: "power2.inOut" }, 0.82)
      .to(ambient, { opacity: 0, duration: 0.12 }, 0.84)
      .to(cartela, { opacity: 1, y: 0, duration: 0.06, ease: "power1.out" }, 0.94);
  }
}

/* --------------------------------------------------------------- GALLERY
   El archivo entero en un travelling, como recorrer una pared de la sala.
   Cada lámina gira un poco hacia ti cuando pasa por el centro (CSS 3D). Con
   pin (escritorio) el scroll vertical mueve la pared; en móvil y tableta la
   pared se desliza con el dedo (carrusel nativo con snap) y el giro sigue a
   ese desplazamiento. */
export function gallery(section, { mode }) {
  const viewport = section.querySelector("[data-viewport]");
  const track = section.querySelector("[data-track]");
  const items = frames(section, ".gallery__item");
  // Lejos del centro se apaga solo la foto: con la ficha entera al 75 %, el
  // texto pequeño (zona del cuerpo) bajaba a 3,2:1 de contraste (AA pide 4,5).
  const tilt = items.map((el) => ({ el, set: gsap.quickSetter(el, "css"), dim: gsap.quickSetter(el.querySelector(".plate") || el, "opacity") }));
  const turn = mode === "pin" ? 16 : 10, depth = mode === "pin" ? 90 : 50;

  const update = () => {
    const mid = innerWidth / 2;
    for (const t of tilt) {
      const r = t.el.getBoundingClientRect();
      const d = (r.left + r.width / 2 - mid) / mid; // -1 .. 1
      const c = gsap.utils.clamp(-1, 1, d);
      t.set({ rotationY: -c * turn, z: -Math.abs(c) * depth });
      t.dim(1 - Math.abs(c) * 0.25);
    }
  };

  if (mode !== "pin") {
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      tilt.forEach((t) => gsap.set([t.el, t.el.querySelector(".plate") || t.el], { clearProps: "transform,opacity" }));
    };
  }

  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  gsap.to(track, {
    x: () => -dist(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${dist()}`,
      pin: true,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: update,
      onRefresh: update
    }
  });
  viewport.style.overflow = "visible";
}

/* ----------------------------------------------------------------- WORDS */
export function words(section) {
  const ink = section.querySelector("[data-ink]");
  if (ink) inkScrub(ink, { start: "top 75%", end: "bottom 55%" });
  const mark = section.querySelector(".words-scene__mark");
  if (mark) {
    gsap.fromTo(mark, { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, ease: "power2.out",
      scrollTrigger: { trigger: mark, start: "top 92%", end: "top 70%", scrub: true }
    });
  }
}

/* ---------------------------------------------------------------- ARTIST */
export function artist(section, { desk }) {
  section.querySelectorAll("[data-depth]").forEach((el) => {
    const d = parseFloat(el.dataset.depth) || 0;
    gsap.fromTo(el, { yPercent: d * 50 * (desk ? 1 : 0.5) }, {
      yPercent: -d * 50 * (desk ? 1 : 0.5), ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
    });
  });
  const main = section.querySelector(".artist__main img");
  if (main) {
    gsap.fromTo(main, { scale: 1.1 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "center center", scrub: true }
    });
  }
  const studio = section.querySelector(".artist__studio");
  if (studio) {
    gsap.fromTo(studio, { clipPath: "inset(0 12% 0 12%)" }, {
      clipPath: "inset(0 0% 0 0%)", ease: "none",
      scrollTrigger: { trigger: studio, start: "top 95%", end: "top 35%", scrub: true }
    });
  }
}

/* --------------------------------------------------------------- BOOKING
   "Reservar cita" se levanta letra a letra, una sola vez: es la llegada. */
export function booking(section) {
  const a = section.querySelector(".booking__title a");
  if (!a) return;
  const chars = letters(a);
  gsap.from(chars, {
    yPercent: 110,
    opacity: 0,
    duration: 1.2,
    ease: "expo.out",
    stagger: 0.035,
    scrollTrigger: { trigger: section, start: "top 70%", once: true }
  });
}
