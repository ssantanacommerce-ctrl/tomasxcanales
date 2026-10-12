# Contenido: cómo crece la web sin rehacerla

Toda la web se genera a partir de la carpeta `content/`. Las páginas siguen
siendo HTML estático real (cada texto, cada `alt` y cada dato estructurado
está en el marcado, legible sin JavaScript), pero **nadie las escribe a
mano**: las escribe `tools/generate.mjs`.

```
content/
  site.json               identidad, contacto, el texto de VIDA con sus tiempos,
                          y los medios del sitio (símbolos, artista, estudio, voz)
  exhibition.json         el recorrido de la home, escena a escena
  works/
    medusa-zodiaco/
      work.json           la obra: textos, técnica, zona, medios, relacionadas
      originals/          los archivos tal como llegaron (nunca se publican)
    atlas-vitruvio/
    ...
  .generated/media.json   (lo escribe la tubería; no se edita)
```

## Lo que pasa solo

Al añadir o cambiar una obra y ejecutar `npm run build` (o con `npm run dev`
en marcha):

- se generan sus imágenes (AVIF, WebP y JPEG en 4 anchos) y vídeos (WebM,
  MP4, versión móvil, póster) con nombres descriptivos para SEO
- se crea `/work/<slug>/` con su título, descripción, Open Graph, JSON-LD
  (`VisualArtwork` + `VideoObject`), migas de pan y obras relacionadas
- aparece en el **Archivo** de la home, en `/work/` (y en sus filtros, si su
  técnica la comparten al menos dos obras), en el pie y en el `sitemap.xml`
  con sus imágenes y vídeos
- se enlaza con la anterior y la siguiente
- el build la incluye sin tocar `vite.config.js`

Si algo está mal (falta un `alt`, un `related` apunta a una obra que no
existe, un original no está donde dice el JSON…), el generador **se para y
dice qué y dónde**. No se publica nada roto.

---

## Añadir 5 fotos nuevas a una obra que ya existe

1. Copia las fotos a `content/works/<obra>/originals/`, con un nombre claro
   (`plano-general-2.jpg`, `detalle-mano.jpg`).
2. Añade una entrada por foto en `media` de su `work.json`:
   ```json
   {
     "id": "detalle-mano",
     "type": "image",
     "src": "originals/detalle-mano.jpg",
     "role": ["detail"],
     "focus": "50% 40%",
     "alt": "Qué se ve en la foto, descrito con precisión."
   }
   ```
3. `npm run build` y `npm run check`.

## Añadir una obra nueva

1. Crea `content/works/<slug>/` (minúsculas y guiones: `serpiente-antebrazo`).
   **El slug es su URL**: `/work/serpiente-antebrazo/`. Que describa la obra.
2. Copia los originales a `content/works/<slug>/originals/`.
3. Copia el `work.json` de otra obra y cámbialo (esquema abajo).
4. `npm run build` y `npm run check`. Ya está en el Archivo, en `/work/`, en
   el sitemap y en su propia página.
5. ¿Quieres que tenga escena propia en la home? Añádela a
   `content/exhibition.json` (ver «Tipos de escena»).

## Añadir un vídeo

Igual que una foto, con `"type": "video"`. Campos propios:

| Campo | Para qué |
| --- | --- |
| `poster` | Segundo del fotograma que hará de póster (contado desde el inicio del tramo). Elige uno nítido: muchos clips empiezan desenfocados. |
| `trim` | `[inicio, fin]` en segundos: quita negros del principio o del final. |
| `crop` | `{ "w": 720, "h": 880, "x": 0, "y": 0 }`: recorta el cuadro (subtítulos incrustados, bandas negras). |
| `scrub` | `true` genera además una versión para atar el tiempo del vídeo al scroll. Pesa más: úsalo solo en la escena que lo necesite. |
| `caption` | Una línea bajo el vídeo en la página de la obra. |

El audio nunca se publica con el vídeo: todos van en silencio. La voz de VIDA
es un medio aparte (`"type": "audio"`) y solo suena a petición.

---

## Esquema de `work.json`

| Campo | Obligatorio | Qué es |
| --- | --- | --- |
| `slug` | sí | Igual que el nombre de la carpeta. Es la URL. |
| `published` | sí | `false` la aparta sin borrarla: ni página, ni archivo, ni sitemap. |
| `order` | no | Orden en el archivo (1, 2, 3…). |
| `title` | sí | El nombre de la obra. |
| `status` | no | `"En proceso"` o `null`. Se muestra en violeta. |
| `description` | sí | Una o dos frases: qué se ve. Es también la cartela. |
| `body` | no | Párrafos más largos para su página. |
| `quote` | no | `{ "text", "source" }`: un texto real del artista, con su procedencia. |
| `styles` | sí | Técnicas: `"Realismo"`, `"Línea fina"`, `"Micro-realismo"`, `"Geometría"`… |
| `bodyPlacement` | sí | Zona del cuerpo. |
| `year` | no | Déjalo en `null` si no se sabe. **No se inventa.** |
| `dateAdded` | sí | Fecha en que se publica en la web (no la del tatuaje). Google la pide para los vídeos. |
| `cover` | sí | `id` del medio que hace de portada (archivo, OG, relacionadas). |
| `media` | sí | Lista de fotos y vídeos (ver arriba). |
| `related` | no | Slugs de 2 obras relacionadas. |
| `seo` | no | `{ "title", "description" }` propios para buscadores. |

### Roles de un medio (`role`)

Sirven para documentar la curaduría y para que la web decida qué mostrar:

`hero` · `featured` · `primary` · `detail` · `process` · `cinematic` ·
`atmospheric` · `secondary` · `mobile` · `identity` · `artist` · `studio` ·
`voice` · **`unused`**.

`unused` excluye el archivo de todo (no se generan derivados). Es la forma de
dejar constancia de que se ha visto y se ha descartado, y por qué (`"note"`).

### `focus`

Punto de la foto que tiene que quedar a la vista cuando el marco la recorta
(`"50% 40%"` = centrado, algo por encima de la mitad).

---

## Tipos de escena (`exhibition.json`)

Cada escena declara un `kind`: el gesto con el que la obra entra en la
exposición. **Ninguna obra debería entrar con el mismo gesto que la
anterior.**

| kind | Qué hace | Necesita |
| --- | --- | --- |
| `intro` | El umbral: vídeo, nombre, primera frase de VIDA, amanecer | `work`, `media` (vídeo), `sentence` |
| `zoom` | La obra cuelga pequeña y crece hasta la altura de la vista; plano cerrado; vídeo atado al scroll | `work`, `sequence` (ids) |
| `line` | Una frase de VIDA que se entinta, con un vídeo al lado | `sentence`, `work`, `media` |
| `process` | Del stencil a la piel, paso a paso en un mismo marco | `work`, `sentence`, `sequence` |
| `layers` | Capas a distinta profundidad (parallax) | `work`, `sequence` (2 ids) |
| `ink` | Una obra se convierte en otra (WebGL); mejor con fotos de igual proporción | `work`, `media`, `next: { work, media }` |
| `film` | Un vídeo que pasa de marco a pantalla completa | `work`, `media` |
| `gallery` | Todas las obras publicadas en travelling (automático) | — |
| `words` | Una frase de VIDA a gran tamaño | `sentence` |
| `artist` | El artista, su voz y su estudio | — |
| `booking` | Reservar | — |

`sentence` es el `id` de una frase de `site.json → vida.sentences`
(`ceremonia`, `linea`, `lenguaje`, `gratitud`).

---

## Textos: la regla

Todo lo que dice la web procede de: el vídeo **VIDA**, los **textos que Tomás
publicó** con cada obra (los nombres de archivo de Instagram), los **datos de
contacto** ya existentes, o la **descripción de lo que se ve** en cada foto.
Nada más. Sin años, premios, reseñas, precios, dirección exacta ni biografía
hasta que existan de verdad.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Genera y abre el servidor de desarrollo. Cambiar `content/` recarga solo. |
| `npm run media` | Solo derivados (incremental). `-- --force` los rehace todos; `-- --clean` borra huérfanos. |
| `npm run generate` | Solo páginas, sitemap, robots, manifiesto, iconos. |
| `npm run build` | Todo lo anterior + compilación a `dist/`. |
| `npm run check` | Revisa `dist/` antes de publicar. |
| `npm run fonts` | Vuelve a descargar las fuentes variables (una vez). |
