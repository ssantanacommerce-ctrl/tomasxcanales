/* ==========================================================================
   TOMASXCANALES · tipografía viva

   fit()      ajusta el nombre al ancho de su caja, a la décima de píxel.
              El nombre es una pieza: tiene que ocupar exactamente su muro.
   letters()  parte un texto en letras (con aria-label en el contenedor para
              que un lector de pantalla siga leyendo la palabra entera).
   inkScrub() entinta un texto palabra a palabra con el scroll: del violeta
              del stencil a la tinta. Es el proceso que describe VIDA.
   ========================================================================== */

import { ScrollTrigger } from "./motion.js";

export function fit(el) {
  const box = el.parentElement;
  const range = document.createRange();
  const measure = () => {
    const style = getComputedStyle(box);
    const avail = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const prevTransform = el.style.transform;
    el.style.transform = "none";
    el.style.setProperty("--fit", "100px");
    // el ancho del TEXTO, no de la caja (un bloque mide siempre lo que su contenedor)
    range.selectNodeContents(el);
    const w = range.getBoundingClientRect().width;
    el.style.transform = prevTransform;
    if (!w) return;
    const size = Math.max(24, (avail / w) * 100 * 0.998);
    el.style.setProperty("--fit", `${size.toFixed(2)}px`);
    box.style.setProperty("--fit", `${size.toFixed(2)}px`);
  };
  measure();
  return measure;
}

export function fitAll(selector = "[data-fit], [data-wordmark]") {
  const fns = [...document.querySelectorAll(selector)].map(fit);
  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => { fns.forEach((f) => f()); ScrollTrigger.refresh(); }, 180);
  }, { passive: true });
  return () => fns.forEach((f) => f());
}

/* Cada letra lleva dos capas: .ch (la mueve el scroll) y .ch__i (la anima la
   entrada). Así dos animaciones nunca pelean por la misma propiedad: si
   alguien baja mientras el nombre aún se está formando, no reaparecen letras. */
export function letters(el) {
  if (el.dataset.split) return [...el.querySelectorAll(".ch")];
  const text = el.textContent;
  el.setAttribute("aria-label", text.trim());
  // aria-label no vale en un <span> genérico: el lector lo ignoraría y, con las
  // letras ocultas, el nombre desaparecería del <h1>. Fuera de enlaces y botones
  // el texto partido se presenta como imagen con ese nombre (es un logotipo).
  if (!el.matches("a[href], button")) el.setAttribute("role", "img");
  el.innerHTML = [...text]
    .map((c) => `<span class="ch" aria-hidden="true"><span class="ch__i">${c === " " ? "&nbsp;" : c}</span></span>`)
    .join("");
  el.dataset.split = "1";
  return [...el.querySelectorAll(".ch")];
}

export const inner = (chars) => chars.map((c) => c.firstElementChild);

/** Entinta hasta la palabra que corresponde a `p` (0..1). */
export function inkTo(el, p) {
  const words = el._words || (el._words = [...el.querySelectorAll(".w")]);
  const n = Math.round(Math.min(1, Math.max(0, p)) * words.length);
  for (let i = 0; i < words.length; i++) {
    const on = i < n;
    if (words[i]._on !== on) { words[i]._on = on; words[i].classList.toggle("is-inked", on); }
  }
}

export function inkScrub(el, { start = "top 82%", end = "bottom 52%", trigger } = {}) {
  return ScrollTrigger.create({
    trigger: trigger || el,
    start,
    end,
    scrub: true,
    onUpdate: (self) => inkTo(el, self.progress),
    onRefresh: (self) => inkTo(el, self.progress)
  });
}
