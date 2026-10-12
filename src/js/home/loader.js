/* ==========================================================================
   TOMASXCANALES · el umbral: los símbolos del artista y el diafragma

   No es una barra de progreso. Es la entrada a una exposición, hecha solo
   con los dos símbolos de SIMBOLOS.png y la variante con rayos:

   0.0  negro
   0.2  la luna crece como una fase lunar: de luna nueva a creciente
   0.8  el anillo del sol se dibuja; el punto se enciende
   1.3  el nombre, en versalitas cursivas espaciadas (como en VIDA)
   1.8  salen los rayos: el sol radiante
   2.4  el anillo se convierte en diafragma y se abre sobre el vídeo:
        el mundo de Tomás aparece a través del sol

   Hasta 2.4 todo es CSS (chrome.css): se ve desde el primer fotograma, sin
   esperar a que lleguen fuentes ni JS. Aquí solo se decide CUÁNDO se abre
   el diafragma: cuando han terminado los símbolos, la escena está montada
   (`ready`, lo resuelve home.js) y el vídeo puede arrancar (como mucho
   1,6 s de espera por el vídeo). Así el comienzo del vídeo (Tomás inclinado
   sobre el stencil) es lo primero que se ve y no se pierde detrás.

   - Desde otra página de la web: versión breve (clase `again`, ver layout).
   - Con un ancla en la URL (/#reservar): sin umbral.
   - Sin movimiento: los símbolos quietos un instante y fundido.
   ========================================================================== */

import { gsap, motionOK } from "../core/motion.js";

const finished = (loader) => {
  if (!loader.getAnimations) return Promise.resolve();
  const anims = loader.getAnimations({ subtree: true }).filter((a) => a.animationName !== "loader-failsafe");
  return Promise.all(anims.map((a) => a.finished.catch(() => {})));
};

const canPlay = (video, max = 1600) => new Promise((ok) => {
  if (!video || video.readyState >= 3) return ok();
  video.addEventListener("canplay", () => ok(), { once: true });
  setTimeout(ok, max);
});

export function runLoader({ video, ready = Promise.resolve() } = {}) {
  const loader = document.querySelector("[data-loader]");
  if (!loader) return Promise.resolve();

  const finish = () => {
    loader.classList.add("is-done");
    loader.style.animation = "none";
    document.documentElement.classList.add("is-entered");
  };

  if (location.hash && location.hash.length > 1) {
    finish();
    return Promise.resolve({ skipped: true });
  }

  const svg = loader.querySelector(".ritual");
  const luna = svg.querySelector(".ritual__luna");
  const sol = svg.querySelector(".ritual__sol");
  const ring = svg.querySelector(".ritual__ring");
  const dot = svg.querySelector(".ritual__dot");
  const rays = [...svg.querySelectorAll(".ray")];
  const name = loader.querySelector(".loader__name");

  if (!motionOK) {
    return ready.then(() => new Promise((resolve) => {
      setTimeout(() => {
        loader.style.transition = "opacity .7s ease";
        loader.style.opacity = "0";
        setTimeout(() => { finish(); resolve({}); }, 720);
      }, 900);
    }));
  }

  const again = document.documentElement.classList.contains("again");

  return Promise.all([finished(loader), ready.then(() => canPlay(video))]).then(() => new Promise((resolve) => {
    if (video) {
      try { video.currentTime = 0; } catch {}
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    }
    const r = sol.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const unit = svg.getBoundingClientRect().width / 520; // px por unidad del viewBox
    const maxR = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;
    const state = { r: 103 * unit * 0.72 };
    loader.style.setProperty("--ix", `${cx}px`);
    loader.style.setProperty("--iy", `${cy}px`);
    loader.style.setProperty("--iris", `${state.r}px`);
    loader.classList.add("is-iris");

    // El anillo crece con el diafragma cambiando su radio (no su escala): el
    // giro de -90º y el centro los sigue poniendo el CSS, y el trazo no engorda.
    const iris = gsap.timeline({ onComplete: () => { finish(); resolve({ again }); } });
    iris.to([luna, name, dot], { opacity: 0, duration: 0.45, ease: "power1.out" }, 0)
      .to(rays, { opacity: 0, duration: 0.6, ease: "power2.in" }, 0)
      .to(state, {
        r: maxR,
        duration: again ? 0.7 : 0.95,
        ease: "power3.inOut",
        onUpdate: () => {
          loader.style.setProperty("--iris", `${state.r.toFixed(1)}px`);
          ring.setAttribute("r", (state.r / unit).toFixed(2));
        }
      }, 0.05)
      .to(ring, { opacity: 0, duration: 0.35, ease: "power1.in" }, again ? 0.45 : 0.65);
  }));
}
