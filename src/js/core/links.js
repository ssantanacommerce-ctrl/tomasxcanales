/* ==========================================================================
   TOMASXCANALES · enlaces de contacto y analítica
   Los enlaces ya funcionan en el HTML (instagram, mailto). Aquí se les
   añade el evento de analítica. WhatsApp solo se abre desde el formulario
   de reserva, con las respuestas de la persona (booking.js).
   ========================================================================== */

import site, { igUrl, mailUrl } from "./site.js";

/* Solo empuja a dataLayer. No hay ningún ID de medición inventado: hasta
   que se pegue el contenedor de GA4/GTM en el <head>, esto es inocuo. */
export function track(event, payload = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}

export function wireLinks() {
  document.querySelectorAll("[data-ig]").forEach((a) => {
    a.href = igUrl;
    a.target = "_blank";
    a.rel = "noopener";
    a.addEventListener("click", () => track("instagram_click", { page: location.pathname }));
  });

  document.querySelectorAll("[data-mail]").forEach((a) => {
    a.href = mailUrl;
    a.addEventListener("click", () => track("email_click", { page: location.pathname }));
  });

  document.querySelectorAll("[data-track]").forEach((a) => {
    a.addEventListener("click", () => track(a.getAttribute("data-track"), { page: location.pathname }));
  });
}

export { site };
