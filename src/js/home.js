/* ==========================================================================
   TOMASXCANALES · home: umbral + exposición
   ========================================================================== */

import { gsap, ScrollTrigger, motionOK, smoothScroll, fontsReady, markReady, getLenis, PIN_QUERY, STICK_QUERY } from "./core/motion.js";
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

/* El umbral arranca YA: sus símbolos son CSS y se están dibujando desde el
   primer fotograma; aquí solo se espera a que la escena esté montada
   (`ready`) para abrir el diafragma. Mientras dura, no se puede bajar:
   nadie debería llegar a la sala a mitad de una escena que no ha visto
   empezar. */
let setupDone;
const ready = new Promise((r) => (setupDone = r));
const locked = !location.hash && !!document.querySelector("[data-loader]");
if (locked) document.documentElement.classList.add("is-locked");
const entry = runLoader({ video: introSection?.querySelector("video"), ready });

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
  if (locked) getLenis()?.stop();
  setupDone();

  const opened = await entry;
  if (locked) { document.documentElement.classList.remove("is-locked"); getLenis()?.start(); }
  if (intro && motionOK && !opened?.skipped) intro.reveal();
  else if (intro?.video && motionOK) intro.video.play().catch(() => {});

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
