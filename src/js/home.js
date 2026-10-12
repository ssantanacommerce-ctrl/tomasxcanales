/* ==========================================================================
   TOMASXCANALES · home: umbral + exposición
   ========================================================================== */

import { gsap, ScrollTrigger, motionOK, smoothScroll, fontsReady, markReady, getLenis } from "./core/motion.js";
import { markImages, autoplayVideos } from "./core/media.js";
import { initHud } from "./core/hud.js";
import { wireLinks } from "./core/links.js";
import { fitAll } from "./core/type.js";
import { initVoice } from "./core/voice.js";
import { runLoader } from "./home/loader.js";
import { setupIntro } from "./home/intro.js";
import * as scenes from "./home/scenes.js";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) window.scrollTo(0, 0);

markImages();
wireLinks();
initVoice();

const introSection = document.querySelector(".scene--intro");
const refit = fitAll();

async function start() {
  await fontsReady();
  refit();

  if (motionOK) {
    markReady();
    smoothScroll();
  }

  const intro = introSection ? setupIntro(introSection) : null;

  if (motionOK) {
    const mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 901px)", mob: "(max-width: 900px)" }, (ctx) => {
      document.querySelectorAll("[data-kind]").forEach((section) => {
        const fn = scenes[section.dataset.kind];
        if (fn) fn(section, ctx.conditions);
      });
    });
  }

  // El HUD y la analítica de salas se crean DESPUÉS de los pins: así sus
  // posiciones ya cuentan con el espacio que añade cada escena fijada.
  initHud({ home: true });
  autoplayVideos();

  ScrollTrigger.refresh();

  // Durante los tres segundos del umbral no se puede bajar: nadie debería
  // llegar a la sala a mitad de una escena que aún no ha visto empezar.
  const locked = !location.hash && document.querySelector("[data-loader]");
  if (locked) { getLenis()?.stop(); document.documentElement.classList.add("is-locked"); }
  const entry = await runLoader({ video: intro?.video });
  if (locked) { document.documentElement.classList.remove("is-locked"); getLenis()?.start(); }
  if (intro && motionOK && !entry?.skipped) intro.reveal();
  else if (intro?.video && !motionOK) {
    // sin movimiento el vídeo no arranca solo: queda el póster y el botón de reproducir
  } else if (intro?.video) {
    intro.video.play().catch(() => {});
  }

  if (location.hash) {
    const target = document.querySelector(location.hash);
    const lenis = getLenis();
    if (target) requestAnimationFrame(() => (lenis ? lenis.scrollTo(target, { immediate: true }) : target.scrollIntoView()));
  }
}

start();

// Las imágenes que llegan tarde cambian la altura de algunas escenas: se
// recalculan las posiciones una vez ha cargado todo.
window.addEventListener("load", () => ScrollTrigger.refresh());
