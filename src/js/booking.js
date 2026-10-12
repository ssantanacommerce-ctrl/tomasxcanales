/* ==========================================================================
   TOMASXCANALES · reservar

   Reserva sin servidor. El cuestionario (cuatro preguntas) compone un
   mensaje de WhatsApp en el propio navegador y abre el chat con Tomás. No
   hay backend, no hay base de datos y no se guarda nada: lo que escribe la
   persona solo sale de su dispositivo cuando pulsa enviar, y va directo a
   WhatsApp.

   El número y el nombre salen de content/site.json (core/site.js). Aquí no
   se escribe ningún teléfono.
   ========================================================================== */

import "./page.js";
import { waUrl } from "./core/site.js";
import { track } from "./core/links.js";

const NAME = "Tomás";

const form = document.getElementById("booking-form");

if (form) {
  /* --- Reglas ------------------------------------------------------------
     Cada campo: longitud máxima (también como `maxlength` en el HTML, por si
     alguien lo manipula), mínimo para considerarlo respondido, si admite
     saltos de línea y el mensaje de error. */
  const RULES = {
    nombre: { max: 80, min: 2, multiline: false, error: "Escribe cómo te llamas." },
    idea: {
      max: 1000,
      min: 10,
      multiline: true,
      error: "Cuenta un poco más: qué idea tienes y en qué zona del cuerpo."
    },
    tamano: { max: 120, min: 2, multiline: false, error: "Indica un tamaño aproximado, aunque sea orientativo." },
    cuando: { max: 120, min: 2, multiline: false, error: "Indica cuándo te gustaría hacerlo." }
  };

  const FIELDS = Object.keys(RULES);
  const NUM = { nombre: "01", idea: "02", tamano: "03", cuando: "04" };

  const input = (f) => form.elements.namedItem(f);
  const errorSlot = (f) => form.querySelector(`[data-err="${f}"]`);
  const block = (f) => form.querySelector(`[data-q="${f}"]`);

  const summary = form.querySelector("[data-summary]");
  const done = form.querySelector("[data-done]");
  const doneLink = form.querySelector("[data-done-link]");
  // Dentro del formulario: el HUD también tiene un [data-progress] (el del scroll).
  const progress = form.querySelector("[data-progress]");
  const progressN = form.querySelector("[data-progress-n]");
  const counter = form.querySelector("[data-count]");

  /* --- Saneado -------------------------------------------------------------
     Todo lo que escribe la persona es dato no confiable. Se eliminan
     caracteres de control y marcas de dirección de texto (que permiten
     disfrazar contenido), se normalizan espacios y se recorta al máximo.
     El resultado solo se usa como texto: nunca se inserta como HTML. */
  const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

  const clean = (f) => {
    const { max, multiline } = RULES[f];
    let t = (input(f).value || "").normalize("NFC").replace(/\r\n?/g, "\n").replace(CONTROL, "");
    t = multiline
      ? t.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n")
      : t.replace(/\s+/g, " ");
    return t.trim().slice(0, max);
  };

  const isValid = (f) => clean(f).length >= RULES[f].min;

  const setError = (f, show) => {
    errorSlot(f).textContent = show ? RULES[f].error : "";
    input(f).setAttribute("aria-invalid", show ? "true" : "false");
  };

  const refresh = () => {
    let ok = 0;
    for (const f of FIELDS) {
      const valid = isValid(f);
      block(f).dataset.valid = String(valid);
      if (valid) ok++;
    }
    if (progress) progress.style.transform = `scaleX(${ok / FIELDS.length})`;
    if (progressN) progressN.textContent = String(ok);
  };

  /* --- Textarea que crece con el texto --- */
  const idea = input("idea");
  const grow = () => {
    idea.style.height = "auto";
    idea.style.height = `${idea.scrollHeight}px`;
  };

  /* --- Sugerencias de un toque ---------------------------------------------
     Rellenan el campo, que sigue siendo editable y es la única fuente de
     verdad. Si la persona reescribe el texto, la sugerencia se desmarca. */
  const syncChips = (f) => {
    const v = input(f).value.trim();
    form.querySelectorAll(`[data-fill="${f}"]`).forEach((c) => {
      c.setAttribute("aria-pressed", String(c.dataset.value === v));
    });
  };

  form.querySelectorAll("[data-fill]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const f = chip.dataset.fill;
      input(f).value = chip.dataset.value ?? "";
      syncChips(f);
      setError(f, false);
      refresh();
    });
  });

  form.addEventListener("input", (e) => {
    const target = e.target;
    const f = target.getAttribute("name");
    if (!f || !Object.hasOwn(RULES, f)) return;

    if (f === "idea") {
      grow();
      if (counter) counter.textContent = String(idea.value.length);
    }
    if (f === "tamano" || f === "cuando") syncChips(f);

    // El error desaparece en cuanto la respuesta es válida, no antes.
    if (target.getAttribute("aria-invalid") === "true" && isValid(f)) setError(f, false);
    refresh();
  });

  // Validación al salir del campo, solo si la persona ya escribió algo.
  form.addEventListener(
    "blur",
    (e) => {
      const f = e.target.getAttribute?.("name");
      if (f && Object.hasOwn(RULES, f) && input(f).value.trim() && !isValid(f)) setError(f, true);
    },
    true
  );

  /* --- Mensaje ---------------------------------------------------------------
     Etiquetas en negrita con la sintaxis de WhatsApp (*texto*) para que Tomás
     lea las cuatro respuestas de un vistazo. */
  const buildMessage = () =>
    [
      `Hola ${NAME},`,
      "Quiero reservar cita para un tatuaje.",
      "",
      "*Nombre:*",
      clean("nombre"),
      "",
      "*Idea y zona:*",
      clean("idea"),
      "",
      "*Tamaño aproximado:*",
      clean("tamano"),
      "",
      "*Cuándo me gustaría realizarlo:*",
      clean("cuando"),
      "",
      "Gracias."
    ].join("\n");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const missing = FIELDS.filter((f) => !isValid(f));
    FIELDS.forEach((f) => setError(f, missing.includes(f)));

    if (missing.length) {
      // Resumen con enlaces a cada pregunta pendiente. Se construye con
      // nodos y textContent: ningún dato entra como HTML.
      summary.replaceChildren();
      summary.append(document.createTextNode(missing.length === 1 ? "Te falta responder la pregunta " : "Te faltan las preguntas "));
      missing.forEach((f, k) => {
        const a = document.createElement("a");
        a.href = `#q-${f}`;
        a.textContent = NUM[f];
        a.addEventListener("click", (ev) => {
          ev.preventDefault();
          input(f).focus();
        });
        summary.append(a);
        if (k < missing.length - 1) summary.append(document.createTextNode(k === missing.length - 2 ? " y " : ", "));
      });
      summary.append(document.createTextNode("."));
      summary.hidden = false;
      input(missing[0]).focus();
      return;
    }

    summary.hidden = true;
    track("booking_submit", { channel: "whatsapp" });

    // encodeURIComponent codifica en UTF-8: tildes, eñes y saltos de línea
    // llegan intactos a WhatsApp.
    const url = waUrl(buildMessage());

    doneLink.href = url;
    done.hidden = false;

    // En móvil se navega directamente (abre la app). En escritorio se abre en
    // otra pestaña para no perder la web; si el navegador lo bloquea, queda el
    // enlace de arriba listo para pulsar.
    if (window.matchMedia("(pointer: coarse)").matches) {
      window.location.assign(url);
    } else {
      // Sin 'noopener' en las features: con él window.open devuelve SIEMPRE
      // null y no se podría saber si se bloqueó. Se corta el opener a mano.
      const w = window.open(url, "_blank");
      if (w) w.opener = null;
      else doneLink.focus();
    }
  });

  refresh();
}
