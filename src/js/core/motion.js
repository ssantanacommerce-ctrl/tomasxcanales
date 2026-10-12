/* ==========================================================================
   TOMASXCANALES · núcleo de movimiento
   GSAP + ScrollTrigger + Lenis registrados una sola vez. La decisión de si
   hay movimiento la toma el <head> (clase `motion` en <html>, que respeta
   prefers-reduced-motion) y aquí solo se lee: una única fuente de verdad.
   ========================================================================== */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

/* En móvil la barra de direcciones dispara `resize` al hacer scroll; sin
   esto, ScrollTrigger recalcularía los pins a mitad de escena. */
ScrollTrigger.config({ ignoreMobileResize: true });
gsap.defaults({ ease: "power3.out", duration: 1.1 });

const html = document.documentElement;
export const motionOK = html.classList.contains("motion");
export const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
export const isDesktop = () => window.matchMedia("(min-width: 901px)").matches;

/* Las escenas fijadas (pin + scrub) son solo para pantalla ancha con ratón.
   En móvil y tableta, el scroll de inercia del sistema y una escena fijada
   no se llevan: al bajar rápido la escena da tirones o se queda trabada, y
   en una pantalla alta la imagen acababa encima del texto. Allí la home es
   un documento normal con apariciones suaves (scenes.flow). La clase `pin`
   en <html> la pone home.js y es la que activa los estilos de las escenas. */
export const PIN_QUERY = "(min-width: 901px) and (hover: hover) and (pointer: fine)";
export const FLOW_QUERY = `not all and ${PIN_QUERY}`;

let lenis = null;

/** Scroll con inercia en escritorio. En táctil se deja el nativo, sin Lenis. */
export function smoothScroll() {
  if (!motionOK || lenis || coarse) return lenis;
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  if (import.meta.env.DEV) window.__lenis = lenis;
  return lenis;
}

export const getLenis = () => lenis;

export function fontsReady() {
  return document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
}

/** Marca el documento como listo: a partir de aquí el CSS aplica los
    estados iniciales de la coreografía (ver base.css, `.ready`). */
export function markReady() {
  html.classList.add("ready");
}

if (import.meta.env.DEV) {
  window.__gsap = gsap;
  window.__ST = ScrollTrigger;
}

export { gsap, ScrollTrigger };
