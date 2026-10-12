/* ==========================================================================
   TOMASXCANALES · el umbral: tres segundos con los símbolos del artista

   No es una barra de progreso. Es la entrada a una exposición, hecha solo
   con los dos símbolos de SIMBOLOS.png y la variante con rayos:

   0.0  negro
   0.2  la luna crece como una fase lunar: de luna nueva a creciente
   0.8  el anillo del sol se dibuja; el punto se enciende
   1.3  el nombre, en versalitas cursivas espaciadas (como en VIDA)
   1.8  salen los rayos: el sol radiante
   2.4  el anillo se convierte en diafragma y se abre sobre el vídeo:
        el mundo de Tomás aparece a través del sol

   El vídeo no arranca hasta que el diafragma se abre: el comienzo (Tomás
   inclinado sobre el stencil) es lo primero que se ve, no se pierde detrás
   del cargador.

   - Segunda visita en la misma sesión: versión breve (1,1 s).
   - Con un ancla en la URL (/#reservar): sin umbral.
   - Sin movimiento: los símbolos quietos un instante y fundido.
   ========================================================================== */

import { gsap, motionOK } from "../core/motion.js";

const SUN_X = 216.7;
const KEY = "txc:umbral";

export function runLoader({ video } = {}) {
  const loader = document.querySelector("[data-loader]");
  if (!loader) return Promise.resolve();

  const seen = (() => { try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; } })();
  try { sessionStorage.setItem(KEY, "1"); } catch {}

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
  const shadow = svg.querySelector(".ritual__shadow");
  const sol = svg.querySelector(".ritual__sol");
  const ring = svg.querySelector(".ritual__ring");
  const dot = svg.querySelector(".ritual__dot");
  const rays = [...svg.querySelectorAll(".ray")];
  const name = loader.querySelector(".loader__name");

  if (!motionOK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        loader.style.transition = "opacity .7s ease";
        loader.style.opacity = "0";
        setTimeout(() => { finish(); resolve({}); }, 720);
      }, 900);
    });
  }

  ring.setAttribute("vector-effect", "non-scaling-stroke");

  return new Promise((resolve) => {
    const k = seen ? 0.38 : 1; // compresión del tiempo en una segunda visita
    gsap.set(luna, { opacity: 0 });
    gsap.set(shadow, { attr: { cx: 0 } });
    gsap.set(ring, { rotation: -90, svgOrigin: "0 0", strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(dot, { scale: 0, svgOrigin: "0 0" });
    gsap.set(rays, { scale: 0.2, opacity: 0, svgOrigin: "0 0" });
    gsap.set(sol, { opacity: 1 });
    gsap.set(name, { opacity: 0, letterSpacing: "0.7em" });
    loader.classList.add("is-running");

    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    tl.to(luna, { opacity: 1, duration: 0.45 * k, ease: "power1.out" }, 0.18 * k)
      .to(shadow, { attr: { cx: 26.35 }, duration: 0.95 * k }, 0.2 * k)
      .to(ring, { strokeDashoffset: 0, duration: 0.8 * k }, 0.78 * k)
      .to(dot, { scale: 1, duration: 0.7 * k, ease: "expo.out" }, 1.22 * k)
      .to(name, { opacity: 1, letterSpacing: "0.42em", duration: 1.2 * k, ease: "power3.out" }, 1.3 * k)
      .to(rays, {
        scale: 1, opacity: 1, duration: 0.7 * k, ease: "expo.out",
        stagger: { each: 0.018 * k, from: "start" }
      }, 1.8 * k)
      .to(dot, { scale: 0.72, duration: 0.6 * k, ease: "power2.out" }, 1.85 * k);

    // Espera a que el vídeo pueda arrancar, como mucho 1,6 s más
    const ready = new Promise((ok) => {
      if (!video) return ok();
      if (video.readyState >= 3) return ok();
      const done = () => ok();
      video.addEventListener("canplay", done, { once: true });
      setTimeout(done, (2.4 * k + 1.6) * 1000);
    });

    tl.add(() => {}, 2.4 * k);
    Promise.all([ready, new Promise((ok) => tl.eventCallback("onComplete", ok))]).then(() => openIris());

    function openIris() {
      if (video) {
        try { video.currentTime = 0; } catch {}
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
      }
      const r = sol.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const svgBox = svg.getBoundingClientRect();
      const unit = svgBox.width / 520; // px por unidad del viewBox
      const maxR = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;
      const state = { r: 103 * unit * 0.72 };
      loader.style.setProperty("--ix", `${cx}px`);
      loader.style.setProperty("--iy", `${cy}px`);
      loader.style.setProperty("--iris", `${state.r}px`);
      loader.classList.add("is-iris");

      const iris = gsap.timeline({ onComplete: () => { finish(); resolve({ seen }); } });
      iris.to([luna, name, dot], { opacity: 0, duration: 0.45, ease: "power1.out" }, 0)
        .to(rays, { opacity: 0, scale: 1.6, duration: 0.6, ease: "power2.in" }, 0)
        .to(state, {
          r: maxR,
          duration: seen ? 0.7 : 0.95,
          ease: "power3.inOut",
          onUpdate: () => {
            loader.style.setProperty("--iris", `${state.r.toFixed(1)}px`);
            gsap.set(ring, { scale: state.r / (103 * unit), svgOrigin: "0 0" });
          }
        }, 0.05)
        .to(ring, { opacity: 0, duration: 0.35, ease: "power1.in" }, seen ? 0.45 : 0.65);
    }
  });
}
