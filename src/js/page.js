/* ==========================================================================
   TOMASXCANALES · páginas interiores (obra, archivo, artista, 404)
   ========================================================================== */

import { gsap, ScrollTrigger, motionOK, smoothScroll, fontsReady, markReady } from "./core/motion.js";
import { markImages, autoplayVideos } from "./core/media.js";
import { initHud } from "./core/hud.js";
import { wireLinks } from "./core/links.js";
import { fitAll } from "./core/type.js";

markImages();
wireLinks();
const refit = fitAll();

/* Filtros del archivo: con JS se muestran; sin JS no hacen falta, porque
   todas las obras ya están en la página. */
function archiveFilters() {
  const bar = document.querySelector("[data-filters]");
  const grid = document.querySelector("[data-archive]");
  if (!bar || !grid) return;
  bar.hidden = false;
  const items = [...grid.children];
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    const f = btn.dataset.filter;
    bar.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    items.forEach((it) => { it.hidden = f !== "*" && !it.dataset.styles.split("|").includes(f); });
    ScrollTrigger.refresh();
  });
}

/* Movimiento discreto en las salas interiores: la obra se asienta al entrar
   y el material de la galería tiene un ligero desfase de profundidad. */
function roomMotion() {
  const hero = document.querySelector(".work-hero__plate, .about__main");
  if (hero) {
    const img = hero.querySelector("img, video");
    gsap.fromTo(hero, { clipPath: "inset(8% 8% 8% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.out", delay: 0.1 });
    if (img) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 2.2, ease: "expo.out", delay: 0.1 });
  }
  const title = document.querySelector(".work-hero__title, .archive__heading, .about__name, .booking-page__title");
  if (title) gsap.from(title, { yPercent: 30, opacity: 0, duration: 1.4, ease: "expo.out" });

  gsap.utils.toArray(".work-media__item, .archive__item, .related__list li, .about__second").forEach((el, i) => {
    gsap.fromTo(el, { y: 60 + (i % 3) * 30 }, {
      y: -(20 + (i % 3) * 20),
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
    });
  });
}

async function start() {
  await fontsReady();
  refit();
  if (motionOK) {
    markReady();
    smoothScroll();
    roomMotion();
  }
  archiveFilters();
  initHud();
  autoplayVideos();
  ScrollTrigger.refresh();
}

start();
window.addEventListener("load", () => ScrollTrigger.refresh());
