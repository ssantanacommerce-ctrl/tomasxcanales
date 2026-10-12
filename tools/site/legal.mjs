/* ==========================================================================
   TOMASXCANALES · páginas legales
   /aviso-legal/   art. 10 LSSI-CE: quién está detrás de la web
   /privacidad/    art. 13 RGPD: qué datos se tratan, para qué y derechos
   /cookies/       art. 22.2 LSSI-CE: la web no usa cookies

   Los datos del titular salen de content/legal.json y el contacto de
   content/site.json: aquí no se escribe ningún nombre, NIF ni correo.
   Las tres páginas llevan «noindex»: el NIF y el domicilio son obligatorios
   en el aviso legal, pero no hace falta que aparezcan en Google. Por eso
   tampoco van en el sitemap.

   Esto no sustituye a un asesor: si cambia la forma de trabajar (analítica,
   otro formulario, venta en línea…), hay que revisar estos textos.
   ========================================================================== */

import { esc, imageURL } from "./html.mjs";
import { head, hud, footer, scripts, crumbs } from "./layout.mjs";

export const LEGAL_PAGES = [
  { path: "/aviso-legal/", file: "aviso-legal/index.html", label: "Aviso legal" },
  { path: "/privacidad/", file: "privacidad/index.html", label: "Privacidad" },
  { path: "/cookies/", file: "cookies/index.html", label: "Cookies" }
];

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const longDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
};

const fullAddress = (l) => `${l.address}, ${l.postalCode} ${l.locality} (${l.province}), ${l.country}`;
const mail = (site) => `<a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a>`;

/* Armazón común: cabecera, cuerpo en secciones y enlaces a las otras dos. */
function page(ctx, { path, title, description, heading, intro, sections }) {
  const { site, legal } = ctx;
  const trail = [{ name: "Inicio", path: "/" }, { name: heading, path }];
  return `${head({
    site,
    title: `${title} | ${site.brand}`,
    description,
    path,
    image: imageURL("medusa-zodiaco/plano-cerrado", 1200),
    noindex: true,
    light: "day"
  })}
<body class="page page--legal">
${hud({ room: heading })}
<main id="main" class="legal" data-light="day">
  ${crumbs(trail)}
  <header class="legal__head">
    <h1 class="legal__title">${esc(heading)}</h1>
    <p class="legal__intro">${intro}</p>
  </header>
  <div class="legal__body">
    ${sections.map(([h, body]) => `<section class="legal__section">
      <h2 class="legal__h2">${esc(h)}</h2>
      ${body}
    </section>`).join("\n    ")}
    <p class="legal__updated">Última actualización: ${longDate(legal.updated)}.</p>
  </div>
  <nav class="legal__nav" aria-label="Textos legales">
    ${LEGAL_PAGES.map((p) => `<a href="${p.path}"${p.path === path ? ' aria-current="page"' : ""}>${esc(p.label)}</a>`).join("\n    ")}
  </nav>
</main>
${footer(ctx)}
${scripts("page")}
</body>
</html>
`;
}

/* ---------------------------------------------------------- /aviso-legal/ */
export function renderLegalNotice(ctx) {
  const { site, legal } = ctx;
  return page(ctx, {
    path: "/aviso-legal/",
    title: "Aviso legal",
    description: `Aviso legal de ${site.origin.replace("https://", "")}: datos del titular, condiciones de uso, propiedad intelectual y responsabilidad.`,
    heading: "Aviso legal",
    intro: `En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), estos son los datos de quien está detrás de esta web.`,
    sections: [
      ["Datos del titular", `<dl class="legal__data">
        <div><dt>Titular</dt><dd>${esc(legal.holder)}, que firma su obra como ${esc(site.brand)}</dd></div>
        <div><dt>NIF</dt><dd>${esc(legal.nif)}</dd></div>
        <div><dt>Domicilio</dt><dd>${esc(fullAddress(legal))}</dd></div>
        <div><dt>Correo</dt><dd>${mail(site)}</dd></div>
        <div><dt>Teléfono</dt><dd>${esc(site.contact.whatsappDisplay)} (también WhatsApp)</dd></div>
        <div><dt>Web</dt><dd>${esc(site.origin.replace("https://", ""))}</dd></div>
        <div><dt>Actividad</dt><dd>Tatuaje, en su estudio ${esc(site.studio)} (${esc(site.address.street)}, ${esc(site.address.postalCode)} ${esc(site.address.locality)})</dd></div>
      </dl>`],
      ["Qué es esta web", `<p>Es el portafolio de ${esc(site.brand)}: muestra su obra y permite pedir cita. No se vende nada en línea ni se cobra nada a través de ella. El precio, las sesiones y las condiciones de cada tatuaje se acuerdan directamente con ${esc(site.person.split(" ")[0])} antes de la cita.</p>`],
      ["Condiciones de uso", `<p>El acceso es libre y gratuito y no exige registro. Quien visita la web se compromete a usarla de acuerdo con la ley y con este aviso, y a no dañarla, sobrecargarla ni intentar entrar en partes que no son públicas.</p>`],
      ["Propiedad intelectual", `<p>Los diseños de los tatuajes, las fotografías, los vídeos, los textos, los símbolos y el nombre ${esc(site.brand)} están protegidos por las leyes de propiedad intelectual e industrial. Sus derechos pertenecen al titular o, en su caso, a sus autores. No se pueden copiar, distribuir, transformar ni usar con fines comerciales sin permiso escrito, salvo en los casos que la ley permite. Enlazar a esta web sí está permitido.</p>`],
      ["Personas que aparecen en las fotos", `<p>Las fotografías y los vídeos muestran tatuajes hechos por ${esc(site.person)} en la piel de sus clientes. Si apareces en alguno y quieres que se retire, escribe a ${mail(site)} y se retirará.</p>`],
      ["Responsabilidad", `<p>Se procura que la información sea exacta y esté al día, pero no se garantiza que no contenga errores ni que la web esté siempre disponible. Lo publicado aquí no es una oferta vinculante.</p>
      <p>La web enlaza con WhatsApp e Instagram. Son servicios de terceros, con sus propias condiciones y políticas de privacidad, de cuyo contenido no responde el titular.</p>`],
      ["Ley aplicable", `<p>Este aviso se rige por la ley española. Cualquier conflicto se resolverá ante los juzgados y tribunales que correspondan según la ley; si quien reclama es un consumidor, los de su domicilio.</p>`]
    ]
  });
}

/* ----------------------------------------------------------- /privacidad/ */
export function renderPrivacy(ctx) {
  const { site, legal } = ctx;
  const p = legal.providers;
  return page(ctx, {
    path: "/privacidad/",
    title: "Política de privacidad",
    description: `Qué datos se tratan cuando visitas la web de ${site.brand} o le escribes para pedir cita, para qué se usan y cómo ejercer tus derechos.`,
    heading: "Privacidad",
    intro: `Qué datos personales se tratan cuando visitas esta web o escribes para pedir cita, para qué y qué derechos tienes. Conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).`,
    sections: [
      ["Quién trata tus datos", `<dl class="legal__data">
        <div><dt>Responsable</dt><dd>${esc(legal.holder)} (${esc(site.brand)})</dd></div>
        <div><dt>NIF</dt><dd>${esc(legal.nif)}</dd></div>
        <div><dt>Domicilio</dt><dd>${esc(fullAddress(legal))}</dd></div>
        <div><dt>Correo</dt><dd>${mail(site)}</dd></div>
      </dl>`],
      ["Al visitar la web", `<p>No hay registro, ni analítica, ni publicidad, ni cookies (lo explica la página de <a href="/cookies/">cookies</a>). El servidor que aloja la web registra de forma automática datos técnicos de cada visita, como la dirección IP, la fecha y la página pedida, para poder servirla y protegerla frente a ataques. La base es el interés legítimo en mantener la web segura (art. 6.1.f RGPD). Esos registros los guarda el proveedor de alojamiento durante el tiempo limitado que fija para esos fines.</p>`],
      ["El formulario de reserva", `<p>El formulario prepara un mensaje con tu nombre, tu idea, la zona del cuerpo, el tamaño y cuándo te gustaría hacerlo. El mensaje se compone en tu propio navegador: esta web no lo recibe ni lo guarda. Solo sale de tu dispositivo cuando pulsas «Enviar mi proyecto» y se abre WhatsApp, donde decides si lo mandas.</p>
      <p>No pide datos de salud: no los incluyas en el mensaje.</p>`],
      ["Cuando escribes", `<p>Si escribes por WhatsApp, por correo o por Instagram, se tratan los datos que envíes (tu nombre, tu teléfono o tu usuario, el mensaje y las fotos de referencia, que pueden mostrar tu piel) para responderte, valorar el proyecto, darte presupuesto y organizar la cita.</p>
      <p>La base es que tú lo pides: son medidas previas a un posible encargo y, si se hace el tatuaje, la ejecución de ese encargo (art. 6.1.b RGPD).</p>`],
      ["Cuánto tiempo", `<p>Los mensajes se conservan mientras se gestiona tu solicitud. Si el tatuaje no llega a hacerse, se borran cuando dejan de ser necesarios. Si se hace, se conservan lo que exijan las leyes (por ejemplo, las fiscales).</p>`],
      ["Quién más interviene", `<p>Tus datos no se ceden a nadie, salvo obligación legal. Intervienen los servicios que se usan para alojar la web y comunicarse, cada uno con su propia política de privacidad:</p>
      <ul class="legal__list">
        <li>Alojamiento web: ${esc(p.hosting)}, como encargado del tratamiento.</li>
        <li>WhatsApp: ${esc(p.whatsapp)}.</li>
        <li>Instagram: ${esc(p.instagram)}.</li>
        <li>Correo: ${esc(p.email)}.</li>
      </ul>
      <p>Algunos de estos proveedores pueden transferir datos a Estados Unidos, con las garantías que reconoce la Comisión Europea (el Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo).</p>`],
      ["Tus derechos", `<p>Puedes pedir acceso a tus datos, corregirlos, borrarlos, oponerte a su uso, limitarlo o recibirlos en un formato que puedas llevarte. Escribe a ${mail(site)} diciendo qué quieres; si hace falta, se te pedirá que acredites quién eres. La respuesta llegará en el plazo de un mes.</p>
      <p>Si crees que no se han respetado tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).</p>`],
      ["Menores", `<p>Si tienes menos de 14 años, no envíes tus datos: tiene que hacerlo tu madre, tu padre o la persona que te tenga a su cargo (art. 7 LOPDGDD).</p>`],
      ["Fotos publicadas", `<p>Si apareces en alguna fotografía o vídeo de esta web y quieres que se retire, escribe a ${mail(site)} y se retirará.</p>`],
      ["Seguridad", `<p>La web se sirve siempre cifrada (HTTPS), no guarda datos personales y aplica medidas técnicas que impiden insertar código ajeno en sus páginas.</p>`]
    ]
  });
}

/* -------------------------------------------------------------- /cookies/ */
export function renderCookies(ctx) {
  const { site } = ctx;
  return page(ctx, {
    path: "/cookies/",
    title: "Política de cookies",
    description: `La web de ${site.brand} no usa cookies: ni propias ni de terceros, ni de análisis ni de publicidad. Qué guarda el navegador y por qué.`,
    heading: "Cookies",
    intro: `Esta web no usa cookies. Ni propias ni de terceros, ni de análisis ni de publicidad. Por eso no aparece ningún aviso para aceptarlas.`,
    sections: [
      ["Lo único que guarda tu navegador", `<p>Una marca técnica en el almacenamiento de sesión del navegador (sessionStorage), para no repetir la animación de entrada si vuelves a la página de inicio durante la misma visita.</p>
      <dl class="legal__data">
        <div><dt>Nombre</dt><dd>txc:umbral</dd></div>
        <div><dt>Valor</dt><dd>1</dd></div>
        <div><dt>Duración</dt><dd>Se borra sola al cerrar la pestaña</dd></div>
        <div><dt>Quién la usa</dt><dd>Solo esta web. No te identifica y no se envía a ningún servidor</dd></div>
      </dl>
      <p>Es un dato técnico, necesario para mostrar la web tal como está diseñada, de los que no necesitan consentimiento (art. 22.2 LSSI-CE).</p>`],
      ["Enlaces a otros servicios", `<p>Al pulsar en WhatsApp o en Instagram sales de esta web. Esos servicios usan sus propias cookies, según sus políticas.</p>`],
      ["Si esto cambia", `<p>Si algún día se añade analítica u otro servicio que use cookies no técnicas, esta página se actualizará y la web te pedirá permiso antes de instalarlas.</p>`]
    ]
  });
}
