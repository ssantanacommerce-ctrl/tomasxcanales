/* ==========================================================================
   TOMASXCANALES · el umbral en movimiento: el vídeo INTRO

   Lo que tiene que sentir quien entra: que mira a Tomás trabajando y que,
   al bajar, entra en su mundo.

   Al abrirse el diafragma
     - el vídeo arranca desenfocado y algo más cerca, y enfoca (2,2 s)
     - las letras de TOMASXCANALES llegan separadas y se juntan en el nombre

   Al hacer scroll (escena fijada)
     0.00 – 0.50  la cámara empuja hacia la aguja (el marco vertical crece
                  hasta desbordar la pantalla)
     0.00 – 0.40  TOMAS se va por la izquierda, CANALES por la derecha; la X,
                  la juntura del nombre, se queda y crece: es por donde se entra
     0.05 – 0.55  baja la luz: el vídeo se oscurece hasta ser fondo
     0.42 – 0.85  la primera frase de VIDA aparece y se entinta palabra a palabra
     0.82 – 1.00  amanece: el sol abre la luz del muro y empieza la sala

   El resplandor alrededor del vídeo no es un segundo vídeo desenfocado (dos
   descodificaciones y un blur de pantalla completa por fotograma): es un
   lienzo de 18 x 32 px que copia el vídeo doce veces por segundo y que el
   CSS amplía y desenfoca. Cuesta casi nada.
   ========================================================================== */

import { gsap, ScrollTrigger, motionOK } from "../core/motion.js";
import { letters, inner, inkTo } from "../core/type.js";
import { useMobileSource } from "../core/media.js";

export function setupIntro(section) {
  const stage = section.querySelector("[data-stage]");
  const portal = section.querySelector("[data-portal]");
  const video = portal.querySelector("video");
  const wordmark = section.querySelector("[data-wordmark]");
  const words = section.querySelector("[data-intro-words]");
  const inkEl = words?.querySelector("[data-ink]");
  const toggle = section.querySelector("[data-video-toggle]");
  const canvas = section.querySelector("[data-ambient]");
  const what = section.querySelector(".intro__what");
  const credit = section.querySelector(".intro__credit");

  /* En móvil, la versión de 480 px (615 KB en vez de 1,2 MB). El HTML lo
     declara con preload="metadata": no se descarga el vídeo grande antes de
     que aquí se decida cuál toca. */
  useMobileSource(video);
  video.preload = "auto";

  /* ------------------------------------------------ pausa (WCAG 2.2.2) */
  let userPaused = false;
  const syncToggle = () => {
    if (!toggle) return;
    const paused = video.paused;
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.textContent = paused ? "Reproducir vídeo" : "Pausar vídeo";
  };
  toggle?.addEventListener("click", () => {
    if (video.paused) { userPaused = false; video.play().catch(() => {}); }
    else { userPaused = true; video.pause(); }
  });
  video.addEventListener("play", syncToggle);
  video.addEventListener("pause", syncToggle);
  syncToggle();

  /* ------------------------------------------------ resplandor ambiente */
  if (canvas && motionOK) {
    const ctx = canvas.getContext("2d", { alpha: false });
    let last = 0;
    const draw = (now) => {
      if (!video.paused && video.readyState >= 2 && now - last > 80) {
        last = now;
        try { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); stage.classList.add("is-live"); } catch {}
      }
    };
    if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
      const loop = (now) => { draw(now); video.requestVideoFrameCallback(loop); };
      video.requestVideoFrameCallback(loop);
    } else {
      gsap.ticker.add(() => draw(performance.now()));
    }
  }

  /* ------------------------------------------------ vídeo fuera de vista */
  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onLeave: () => video.pause(),
    onEnterBack: () => { if (!userPaused) video.play().catch(() => {}); }
  });

  if (!motionOK) return { reveal() {} };

  /* ------------------------------------------------ estado inicial */
  const chars = letters(wordmark);
  const glyphs = inner(chars);
  const xIndex = chars.findIndex((c) => c.textContent.toLowerCase() === "x");
  const aux = [what, credit, toggle].filter(Boolean);
  // la entrada anima capas y propiedades que el scroll no toca (ver letters())
  gsap.set(glyphs, { opacity: 0 });
  gsap.set(video, { scale: 1.1, filter: "blur(10px) brightness(0.55)", transformOrigin: "50% 40%" });
  gsap.set(aux, { clipPath: "inset(0% 0% 100% 0%)" });

  const dawn = document.createElement("div");
  dawn.className = "intro__dawn";
  dawn.setAttribute("aria-hidden", "true");
  section.appendChild(dawn);

  /* ------------------------------------------------ revelado (tras el diafragma) */
  function reveal() {
    const tl = gsap.timeline();
    tl.to(video, { scale: 1, filter: "blur(0px) brightness(1)", duration: 2.4, ease: "power2.out" }, 0)
      // Las letras llegan separadas y se juntan. Antes se animaba letter-spacing
      // (0.34em → -0.012em): recalculaba la maquetación en cada fotograma y daba
      // CLS 0,12 en escritorio. Con letter-spacing la letra i se desplaza i × 0,352em:
      // el mismo movimiento con transform, sin tocar la maquetación.
      .fromTo(glyphs, { x: (i) => i * 0.352 * parseFloat(getComputedStyle(wordmark).fontSize) }, { x: 0, duration: 2.1, ease: "expo.out" }, 0.25)
      .to(glyphs, { opacity: 1, duration: 1.1, ease: "power1.out", stagger: { each: 0.05, from: xIndex >= 0 ? xIndex : "center" } }, 0.25)
      .to(aux, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power3.out", stagger: 0.12 }, 1.4);
    return tl;
  }

  /* ------------------------------------------------ scroll */
  const mm = gsap.matchMedia();
  mm.add({ desk: "(min-width: 901px)", mob: "(max-width: 900px)" }, (c) => {
    const { desk } = c.conditions;
    const pw = portal.getBoundingClientRect().width || 1;
    const push = desk ? Math.max(innerWidth / pw, 1) * 1.18 : 1.55;
    const left = chars.slice(0, xIndex), right = chars.slice(xIndex + 1), X = chars[xIndex];

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: desk ? "+=200%" : "+=160%",
        pin: true,
        scrub: 0.9,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => inkEl && inkTo(inkEl, gsap.utils.mapRange(0.45, 0.8, 0, 1, self.progress))
      }
    });

    tl.to(portal, { scale: push, transformOrigin: "50% 38%", ease: "power1.in", duration: 0.5 }, 0)
      .to(left, { xPercent: (i) => -120 - (left.length - i) * 40, opacity: 0, duration: 0.4, ease: "power2.in" }, 0)
      .to(right, { xPercent: (i) => 120 + i * 40, opacity: 0, duration: 0.4, ease: "power2.in" }, 0)
      .to(X, { scale: desk ? 2.6 : 2, transformOrigin: "50% 60%", opacity: 0, duration: 0.42, ease: "power1.in" }, 0.02)
      .to(aux, { opacity: 0, duration: 0.18 }, 0)
      .to(section.querySelector(".intro__ambient"), { opacity: 0, duration: 0.4 }, 0.05)
      .to(portal, { filter: "brightness(0.26)", duration: 0.5 }, 0.05)
      .set(words, { visibility: "visible" }, 0.4)
      .fromTo(words, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.14 }, 0.42)
      .fromTo(dawn, { "--dawn": "0vmax" }, { "--dawn": "175vmax", duration: 0.18, ease: "power2.in" }, 0.82)
      .to(words, { opacity: 0, duration: 0.08 }, 0.9);

    return () => { gsap.set([portal, ...chars, words, ...aux], { clearProps: "transform,opacity,filter,visibility" }); };
  });

  return { reveal, video };
}
