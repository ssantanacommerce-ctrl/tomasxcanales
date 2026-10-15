/* ==========================================================================
   TOMASXCANALES · identidad y contacto
   Sale de content/site.json: la misma fuente que usa el generador de
   páginas. Un teléfono o un correo no se escriben en ningún otro sitio.
   ========================================================================== */

import site from "../../../content/site.json";

const c = site.contact;

/* Solo lo usa el formulario de reserva (booking.js), con las respuestas de la
   persona. No hay enlaces de WhatsApp con mensaje prerredactado: todas las
   citas se piden con el formulario (decisión del cliente, 15/10/2026). */
export const waUrl = (text) => `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(text)}`;
export const igUrl = `https://instagram.com/${c.instagram}`;
export const mailUrl = `mailto:${c.email}`;

export default site;
