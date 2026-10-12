# Tomasxcanales

Web de **Tomás Canales** (Tomasxcanales), tatuador en su estudio,
**Tomasxcanales Studio** (Calle Dos Hermanas 20, 28982 Parla, Madrid).
Una exposición digital: tres segundos de umbral con sus símbolos, el
vídeo de Tomás trabajando, y la obra presentada como en una galería, con el
scroll como hilo narrativo.

Vite + GSAP ScrollTrigger + Lenis. HTML estático real, generado desde
`content/`. Hostinger solo tiene que servir archivos.

## Empezar

```bash
npm install
npm install-scripts approve esbuild   # solo la primera vez (npm 11)
npm run dev
```

Necesita **Node 24** y **FFmpeg** (para los vídeos).

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Genera las páginas y abre el servidor. Cambiar `content/` recarga solo. |
| `npm run build` | Medios + páginas + compilación a `dist/` + CSP en `dist/.htaccess`. |
| `npm run check` | Revisa `dist/` antes de publicar (enlaces, SEO, alt, codificación, CSP, archivos que no deben subirse…). |
| `npm run publicar` | Compila, revisa y publica: sube a GitHub (`main` y `produccion`) y actualiza Hostinger por SSH. Ver [despliegue](docs/despliegue-hostinger.md). |
| `npm run media` | Solo derivados de imagen, vídeo y audio (incremental). |
| `npm run generate` | Solo páginas, sitemap, robots, manifiesto e iconos. |
| `npm run preview` | Sirve `dist/` tal cual. |

`/?nomotion` fuerza la versión sin movimiento; `/?motion` la fuerza con él
aunque el sistema pida reducirlo. Sirven para revisar las dos. Un móvil en
horizontal (alto ≤ 500 px) recibe la versión sin movimiento: las escenas
fijadas no caben.

## Añadir obra

Una carpeta por obra en `content/works/<slug>/` con sus originales y un
`work.json`. La página, el archivo, el sitemap, el JSON-LD y los derivados
salen solos. Guía completa: **[docs/contenido.md](docs/contenido.md)**.

## Estructura

```
content/            LA FUENTE: site.json (identidad, estudio y dirección, contacto, VIDA),
                    legal.json (titular, NIF, domicilio: solo para los textos legales),
                    exhibition.json (el recorrido), works/<slug>/ (obras y originales)
tools/
  media.mjs         derivados (sharp + FFmpeg)
  generate.mjs      páginas, sitemap, robots, manifiesto, iconos
  site/             plantillas: home (escenas), páginas, legales, layout, símbolos
  csp.mjs           Content-Security-Policy con el hash del script del <head>
  check.mjs         revisión de dist/
  fonts.mjs         descarga única de las fuentes
src/css/            base · chrome (umbral, HUD, pie) · home (escenas) · pages
src/js/
  core/             movimiento, medios, HUD, enlaces, tipografía viva
  home/             el umbral, la entrada, las escenas, el WebGL
static/             se copia tal cual: media/ (derivados), fonts/, .htaccess
index.html, work/, about/, booking/, 404.html,
aviso-legal/, privacidad/, cookies/             GENERADOS: no editar a mano
```

Todo lo de Tomasxcanales vive en esta carpeta: la fuente (`content/`), la web
compilada tal como se publica (`dist/`, se regenera con `npm run build`) y,
en `content/marketing/`, las piezas para Google Ads (no se publican en la web).

## Documentación

- [Auditoría de assets](docs/auditoria-assets.md): foto por foto, vídeo por vídeo, VIDA e INTRO a fondo, curaduría.
- [Dirección creativa](docs/direccion-creativa.md): concepto, referencias, paleta, tipografía, símbolos, escenas, movimiento.
- [Contenido](docs/contenido.md): cómo añadir fotos, vídeos y obras.
- [SEO](docs/seo.md)
- [Despliegue en Hostinger](docs/despliegue-hostinger.md)

## Decisiones

- El estudio es **Tomasxcanales Studio**, Calle Dos Hermanas 20,
  28982 Parla (Madrid), con ficha en Google Business Profile (12/10/2026).
  Nombre, dirección y teléfono salen de `content/site.json` y tienen que ser
  idénticos a los de la ficha de Google. La web enlaza a Google Maps (no lo
  incrusta: un mapa incrustado pondría cookies de terceros). El horario no se
  publica: la hora se confirma al cerrar la cita.
- Esta web es independiente: no comparte código, datos, cuentas ni enlaces con
  ninguna otra web.
- Las fotos del museo las hizo Tomás. El museo no es suyo ni es su estudio, y la
  web no lo nombra.
- Textos legales (12/10/2026): aviso legal (LSSI-CE), privacidad (RGPD) y
  cookies, con los datos de `content/legal.json`. Llevan `noindex` y no van en
  el sitemap: el NIF y el domicilio tienen que estar en la web, pero no en
  Google. El formulario muestra la primera capa de información de privacidad.
  No hay cookies ni analítica, así que no hace falta banner. Si se añade
  analítica, otro formulario o venta en línea, hay que revisar los tres textos
  (`tools/site/legal.mjs`).
- `/.well-known/security.txt` (contacto para avisar de fallos de seguridad) se
  regenera en cada build con caducidad a un año: basta con publicar al menos
  una vez al año.

## Pendiente (requiere datos o material que no existe)

- Retrato de Tomás de frente y fotos del estudio.
- Fotografías de Arcángel y Figuras clásicas; foto nueva de Órbita y chakras;
  toma limpia de Corazón y rosa (las dos últimas están apartadas, listas para
  publicarse).
- Formulario de reserva: cuatro preguntas. No tiene backend: compone el mensaje
  y abre WhatsApp. Si se quisiera
  recibir por correo o guardar solicitudes, habría que añadir un servicio o un
  backend en `src/js/booking.js`.
- Analítica: pegar GA4/GTM en el `<head>` (`tools/site/layout.mjs`); los
  eventos ya se envían. Ojo: exige banner de consentimiento y política de
  cookies, y abrir la CSP (`tools/csp.mjs`) a los dominios de Google.
