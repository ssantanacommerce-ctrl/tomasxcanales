/* ==========================================================================
   TOMASXCANALES · las escenas de la exposición

   Cada escena de la home declara data-kind y aquí hay un comportamiento por
   kind. Ninguna obra entra con el mismo gesto que la anterior: si dos
   tatuajes aparecen igual, el recorrido deja de tener ritmo.

   Las funciones por kind son la versión de escritorio (escenas fijadas).
   En móvil y tableta todas las escenas que fijan algo pasan por flow(): ver
   motion.js. Todo lo que crean se revierte solo al cambiar de tamaño
   (gsap.matchMedia en home.js).
   ========================================================================== */

import { gsap, ScrollTrigger, coarse } from "../core/motion.js";
import { inkTo, inkScrub, letters } from "../core/type.js";
import { safePlay, useScrubSource, useMobileSource } from "../core/media.js";
import { initDisplace } from "./displace.js";

const frames = (root, sel) => [...root.querySelectorAll(sel)];

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

/* ------------------------------------------------------------------ FLOW
   Móvil y tableta. La escena es un bloque normal (el CSS sin `.pin` la
   maqueta: imagen, y debajo su texto; los fotogramas uno tras otro). Nada
   va atado al scroll fotograma a fotograma salvo el entintado del texto,
   que solo cambia clases: cada pieza aparece una vez, con un fundido corto,
   y los vídeos se reproducen solo mientras se ven. */
const FLOW_REVEAL = [
  ".zoom__plate", ".zoom__cartela",
  ".process__monitor", ".process__text",
  ".ink__img", ".ink__cartela",
  ".film__screen", ".film__cartela",
  ".layers__main", ".layers__detail", ".layers__cartela",
  ".line__clip",
  ".gallery__head",
  ".artist__main", ".artist__second", ".artist__text", ".artist__studio"
].join(", ");

export function flow(section) {
  // los de data-autoplay ya los lleva autoplayVideos() (core/media.js)
  section.querySelectorAll("video:not([data-autoplay])").forEach((v) => {
    v.loop = true;
    useMobileSource(v);
    ScrollTrigger.create({
      trigger: v,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? safePlay(v) : v.pause())
    });
  });
  section.querySelectorAll("[data-ink]").forEach((el) => inkScrub(el, { start: "top 85%", end: "bottom 60%" }));
  section.querySelectorAll(FLOW_REVEAL).forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 28,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true }
    });
  });
}

/* ------------------------------------------------------------------ ZOOM
   La obra cuelga pequeña en el muro, con su cartela. Al bajar crece hasta
   ocupar la altura de la vista: estás delante de la lámina. Dentro, el
   plano se acerca (match cut al plano cerrado) y al final el brazo gira: el
   tiempo del vídeo va atado al scroll, así que bajar ES rodear la pieza. */
export function zoom(section, { desk }) {
  const stage = section.querySelector("[data-stage]");
  const plate = section.querySelector("[data-plate]");
  const list = frames(section, "[data-frame]");
  const caps = frames(section, "[data-cap]");
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

  const small = desk ? 0.44 : 0.62;
  gsap.set(plate, { scale: small });
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
      trigger: section,
      start: "top top",
      end: desk ? "+=280%" : "+=220%",
      pin: stage,
      scrub: 0.8,
      anticipatePin: 1,
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

  tl.to(plate, { scale: 1, duration: 0.34, ease: "power2.inOut" }, 0.02)
    .to(cartela, { opacity: 0, y: 24, duration: 0.14, ease: "power1.in" }, 0.04);
  // match cut: el plano cerrado entra un poco más grande y se asienta
  const closeImg = list[1]?.querySelector("img, video");
  if (closeImg) tl.fromTo(closeImg, { scale: 1.1 }, { scale: 1, duration: 0.2, ease: "power2.out" }, 0.4);
  crossfade(tl, list, [0.4, 0.56], 0.06);
  tl.to(plate, { scale: desk ? 0.92 : 0.96, duration: 0.06, ease: "power1.inOut" }, 0.94);
}

/* ------------------------------------------------------------------ LINE
   Una frase de VIDA que se entinta al bajar, junto a la aguja trabajando. */
export function line(section) {
  const ink = section.querySelector("[data-ink]");
  if (ink) inkScrub(ink, { start: "top 78%", end: "bottom 48%" });
  const clip = section.querySelector(".line__clip");
  if (clip) {
    gsap.fromTo(clip, { yPercent: 12 }, {
      yPercent: -12, ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
    });
  }
}

/* --------------------------------------------------------------- PROCESS
   Del stencil a la piel. Cuatro pasos reales del vídeo VIDA y la foto final,
   uno tras otro en el mismo marco, mientras la frase se entinta. */
export function process(section, { desk }) {
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
      trigger: section,
      start: "top top",
      end: desk ? "+=300%" : "+=260%",
      pin: stage,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        activate(p < cuts[0] ? 0 : p < cuts[1] ? 1 : p < cuts[2] ? 2 : 3);
        if (ink) inkTo(ink, gsap.utils.mapRange(0.02, 0.9, 0, 1, p));
      },
      onToggle: (self) => { if (!self.isActive) videos.forEach((v) => v && v.pause()); else active = -1; }
    }
  });
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
    const amp = desk ? 1 : 0.5;
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
export function ink(section, { desk }) {
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
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: desk ? "+=240%" : "+=180%",
      pin: stage,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
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
   cruza. Al salir, vuelve a su marco y se enciende la luz. */
export function film(section, { desk }) {
  const stage = section.querySelector("[data-stage]");
  const screen = section.querySelector("[data-screen]");
  const ambient = section.querySelector(".film__ambient");
  const title = section.querySelector(".film__title");
  const cartela = section.querySelector(".film__cartela");
  const video = screen.querySelector("video");
  if (video) { video.removeAttribute("data-autoplay"); useMobileSource(video); }

  const grow = () => {
    const h = screen.getBoundingClientRect().height / (gsap.getProperty(screen, "scale") || 1);
    return Math.max(1, (innerHeight * 0.98) / h);
  };

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: desk ? "+=240%" : "+=200%",
      pin: stage,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: (self) => { if (!video) return; if (self.isActive) safePlay(video); else video.pause(); },
      onUpdate: (self) => stage.classList.toggle("is-dark", self.progress > 0.22 && self.progress < 0.86)
    }
  });
  tl.to(cartela, { opacity: 0, y: 20, duration: 0.1, ease: "power1.in" }, 0.02)
    .to(screen, { scale: grow, duration: 0.3, ease: "power2.inOut" }, 0.04)
    .to(ambient, { opacity: 1, duration: 0.26 }, 0.06)
    .fromTo(title, { x: () => innerWidth, opacity: 0 }, { x: () => -title.scrollWidth, opacity: 1, duration: 0.62 }, 0.24)
    .to(title, { opacity: 0, duration: 0.06 }, 0.8)
    .to(screen, { scale: 1, duration: 0.14, ease: "power2.inOut" }, 0.84)
    .to(ambient, { opacity: 0, duration: 0.12 }, 0.86)
    .to(cartela, { opacity: 1, y: 0, duration: 0.08, ease: "power1.out" }, 0.92);
}

/* --------------------------------------------------------------- GALLERY
   El archivo entero en un travelling, como recorrer una pared de la sala.
   Cada lámina gira un poco hacia ti cuando pasa por el centro (CSS 3D). En
   móvil no se secuestra el scroll: es un carrusel nativo con snap. */
export function gallery(section, { desk }) {
  if (!desk) return;
  const viewport = section.querySelector("[data-viewport]");
  const track = section.querySelector("[data-track]");
  const items = frames(section, ".gallery__item");
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  // Lejos del centro se apaga solo la foto: con la ficha entera al 75 %, el
  // texto pequeño (zona del cuerpo) bajaba a 3,2:1 de contraste (AA pide 4,5).
  const tilt = items.map((el) => ({ el, set: gsap.quickSetter(el, "css"), dim: gsap.quickSetter(el.querySelector(".plate") || el, "opacity") }));

  const update = () => {
    const mid = innerWidth / 2;
    for (const t of tilt) {
      const r = t.el.getBoundingClientRect();
      const d = (r.left + r.width / 2 - mid) / mid; // -1 .. 1
      const c = gsap.utils.clamp(-1, 1, d);
      t.set({ rotationY: -c * 16, z: -Math.abs(c) * 90 });
      t.dim(1 - Math.abs(c) * 0.25);
    }
  };

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
    gsap.fromTo(el, { yPercent: d * 50 }, {
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
