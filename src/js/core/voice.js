/* ==========================================================================
   TOMASXCANALES · la voz de Tomás

   El audio de VIDA, a petición (nunca en reproducción automática). Mientras
   suena, el texto sigue a la voz con los tiempos medidos fotograma a
   fotograma sobre los subtítulos originales (content/site.json → vida.cues).

   - En la home: un subtítulo único bajo el botón.
   - En /about/: se ilumina el fragmento que está sonando dentro del texto.
   ========================================================================== */

import site from "./site.js";
import { track } from "./links.js";

const CUES = site.vida.sentences.flatMap((s) => s.cues.map(([a, b, text]) => ({ a, b, text })));

export function initVoice(root = document) {
  root.querySelectorAll("[data-voice]").forEach((box) => {
    const btn = box.querySelector("[data-voice-play]");
    const audio = box.querySelector("[data-voice-audio]");
    const label = box.querySelector("[data-voice-label]");
    const caption = box.querySelector("[data-voice-caption]");
    const text = document.querySelector("[data-voice-text]");
    const spans = text ? [...text.querySelectorAll("[data-cue]")].map((el) => {
      const [a, b] = el.dataset.cue.split(":").map(Number);
      return { el, a, b };
    }) : [];
    if (!btn || !audio) return;

    let raf = 0, lastCue = -1;

    const tick = () => {
      const t = audio.currentTime;
      const i = CUES.findIndex((c) => t >= c.a - 0.05 && t < c.b + 0.35);
      if (i !== lastCue) {
        lastCue = i;
        if (caption) caption.innerHTML = i >= 0 ? `<span>${CUES[i].text}</span>` : "";
        for (const s of spans) s.el.classList.toggle("is-now", t >= s.a - 0.05 && t < s.b + 0.35);
      }
      raf = requestAnimationFrame(tick);
    };

    const setState = (playing) => {
      btn.setAttribute("aria-pressed", String(playing));
      if (label) label.textContent = playing ? "Pausar" : audio.currentTime > 0.5 && !audio.ended ? "Seguir escuchando" : "Escuchar a Tomás";
      if (text) text.classList.toggle("is-playing", playing);
      cancelAnimationFrame(raf);
      if (playing) raf = requestAnimationFrame(tick);
    };

    btn.addEventListener("click", () => {
      if (audio.paused) {
        audio.preload = "auto";
        const p = audio.play();
        if (p && p.catch) p.catch(() => setState(false));
        track("voice_play", { page: location.pathname });
      } else {
        audio.pause();
      }
    });
    audio.addEventListener("play", () => setState(true));
    audio.addEventListener("pause", () => setState(false));
    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      lastCue = -1;
      if (caption) caption.innerHTML = "";
      spans.forEach((s) => s.el.classList.remove("is-now"));
      setState(false);
    });
  });
}
