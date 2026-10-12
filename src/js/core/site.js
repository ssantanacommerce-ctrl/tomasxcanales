/* ==========================================================================
   TOMASXCANALES · identidad y contacto
   Sale de content/site.json: la misma fuente que usa el generador de
   páginas. Un teléfono o un correo no se escriben en ningún otro sitio.
   ========================================================================== */

import site from "../../../content/site.json";

const c = site.contact;

export const waText = {
  default: "Hola Tomás, he visto tu web y me gustaría preguntarte por un tatuaje.",
  booking: "Hola Tomás, quiero reservar cita para un tatuaje.",
  work: (title) => `Hola Tomás, he visto "${title}" en tu web y me gustaría preguntarte por una idea en esa línea.`
};

export const waUrl = (text) => `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(text || waText.default)}`;
export const igUrl = `https://instagram.com/${c.instagram}`;
export const mailUrl = `mailto:${c.email}`;

export default site;
