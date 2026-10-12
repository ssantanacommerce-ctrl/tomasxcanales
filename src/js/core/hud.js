/* ==========================================================================
   TOMASXCANALES · HUD contextual y menú

   No hay barra fija que compita con la obra. El HUD:
   - cambia de color con la luz de la sala en la que estás (noche / día)
   - dice en qué sala estás (abajo a la izquierda) y cuánto queda (1 px)
   - se aparta al bajar y vuelve al subir
   - en la home no existe hasta que se deja atrás el umbral
   ========================================================================== */

import { gsap, ScrollTrigger, motionOK, getLenis } from "./motion.js";

const html = document.documentElement;

export function initHud({ home = false } = {}) {
  const hud = document.querySelector("[data-hud]");
  if (!hud) return;
  const roomEl = hud.querySelector("[data-room]");
  const bar = hud.querySelector("[data-progress]");

  /* ---- luz: el color del HUD sigue a la sala que ocupa el centro */
  document.querySelectorAll("[data-light]:not(html)").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => { if (self.isActive) html.setAttribute("data-light", el.getAttribute("data-light")); }
    });
  });

  /* ---- sala actual */
  let current = roomEl ? roomEl.textContent : "";
  const setRoom = (name) => {
    if (!roomEl || name === current) return;
    current = name;
    const wrap = roomEl.parentElement;
    wrap.classList.add("is-swapping");
    setTimeout(() => { roomEl.textContent = name; wrap.classList.remove("is-swapping"); }, 260);
  };
  document.querySelectorAll("[data-scene]").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => self.isActive && setRoom(el.getAttribute("data-scene"))
    });
  });

  /* ---- en el pie el rótulo de sala y la línea se retiran: el pie ya es el final */
  const foot = document.querySelector(".footer");
  if (foot) {
    ScrollTrigger.create({
      trigger: foot,
      start: "top 85%",
      onEnter: () => hud.classList.add("is-end"),
      onLeaveBack: () => hud.classList.remove("is-end")
    });
  }

  /* ---- progreso */
  if (bar) {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => bar.style.setProperty("--progress", self.progress.toFixed(4))
    });
  }

  /* ---- aparición en la home y retirada al bajar */
  // la sala siguiente al umbral (no nextElementSibling: el pin envuelve la escena)
  const afterIntro = document.querySelectorAll(".exhibition > .scene, .exhibition > .pin-spacer > .scene")[1];
  if (home && afterIntro && motionOK) {
    // el umbral está fijado: su "bottom" llega antes de tiempo. Se mira la sala siguiente.
    ScrollTrigger.create({
      trigger: afterIntro,
      start: "top 70%",
      onEnter: () => hud.classList.add("is-on"),
      onLeaveBack: () => hud.classList.remove("is-on")
    });
  } else {
    hud.classList.add("is-on");
  }

  if (motionOK) {
    let last = 0;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        const menuOpen = html.getAttribute("data-menu-open") === "true";
        if (!menuOpen && Math.abs(y - last) > 6) {
          hud.classList.toggle("is-away", self.direction > 0 && y > 280);
          last = y;
        }
      }
    });
  }

  initMenu(hud);
}

function initMenu(hud) {
  const btn = hud.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  if (!btn || !menu) return;
  const label = btn.querySelector("[data-menu-label]");
  let open = false;

  const set = (next) => {
    open = next;
    if (open) menu.hidden = false;
    requestAnimationFrame(() => menu.classList.toggle("is-open", open));
    btn.setAttribute("aria-expanded", String(open));
    if (label) label.textContent = open ? "Cerrar" : "Menú";
    html.setAttribute("data-menu-open", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    const lenis = getLenis();
    if (lenis) (open ? lenis.stop() : lenis.start());
    if (open) {
      hud.classList.remove("is-away");
      if (motionOK) gsap.fromTo(menu.querySelectorAll(".menu__link"), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.9, delay: 0.15 });
      menu.querySelector("a")?.focus();
    } else {
      setTimeout(() => { if (!open) menu.hidden = true; }, 800);
    }
  };

  btn.addEventListener("click", () => set(!open));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => set(false)));
  document.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") { set(false); btn.focus(); return; }
    // Con el menú abierto el foco no sale de él: lo de detrás está tapado.
    if (e.key === "Tab") {
      const items = [btn, ...menu.querySelectorAll("a[href]")];
      const i = items.indexOf(document.activeElement);
      e.preventDefault();
      items[e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length].focus();
    }
  });
}
