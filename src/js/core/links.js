/* ==========================================================================
   TOMASXCANALES · enlaces de contacto y analítica
   Los enlaces ya funcionan en el HTML (wa.me, instagram, mailto). Aquí se
   les añade el mensaje prerredactado y el evento de analítica.
   ========================================================================== */

import site, { waText, waUrl, igUrl, mailUrl } from "./site.js";

/* Solo empuja a dataLayer. No hay ningún ID de medición inventado: hasta
   que se pegue el contenedor de GA4/GTM en el <head>, esto es inocuo. */
export function track(event, payload = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}

export function wireLinks() {
  document.querySelectorAll("[data-wa]").forEach((a) => {
    const kind = a.getAttribute("data-wa");
    const text = kind === "booking" ? waText.booking
      : kind && kind.startsWith("work:") ? waText.work(kind.slice(5))
      : waText.default;
    a.href = waUrl(text);
    a.target = "_blank";
    a.rel = "noopener";
    a.addEventListener("click", () => track("whatsapp_click", { context: kind || "default", page: location.pathname }));
  });

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
