/* ==========================================================================
   TOMASXCANALES · home: umbral + exposición
   ========================================================================== */

import { gsap, ScrollTrigger, motionOK, smoothScroll, fontsReady, markReady, getLenis, PIN_QUERY, STICK_QUERY } from "./core/motion.js";
import { markImages, autoplayVideos } from "./core/media.js";
import { initHud } from "./core/hud.js";
import { wireLinks } from "./core/links.js";
import { fitAll } from "./core/type.js";
import { initVoice } from "./core/voice.js";
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
    // Escritorio con ratón: escenas fijadas con GSAP (pin). Móvil y tableta:
    // las mismas escenas, pegajosas con CSS (stick). Ver motion.js y scenes.js.
    const html = document.documentElement;
    const mm = gsap.matchMedia();
    mm.add({ pin: PIN_QUERY, stick: STICK_QUERY, wide: "(min-width: 901px)" }, (ctx) => {
      const { pin, wide } = ctx.conditions;
      const mode = pin ? "pin" : "stick";
      html.classList.add(mode);
      const undo = [];
      document.querySelectorAll("[data-kind]").forEach((section) => {
        const fn = scenes[section.dataset.kind]; // la intro la lleva intro.js
        const off = fn ? fn(section, { desk: wide, mode }) : null;
        if (typeof off === "function") undo.push(off);
      });
      return () => { undo.forEach((f) => f()); html.classList.remove(mode); };
    });
  }

  // El HUD y la analítica de salas se crean DESPUÉS de las escenas: así sus
  // posiciones ya cuentan con el recorrido que añade cada una.
  initHud({ home: true });
  autoplayVideos();

  ScrollTrigger.refresh();

  // Sin espera: el vídeo arranca y el nombre se forma nada más cargar.
  if (intro?.video && motionOK) intro.video.play().catch(() => {});
  if (intro && motionOK) intro.reveal();

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
