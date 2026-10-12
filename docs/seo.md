# SEO

Sin promesas de posiciones. Esto es lo que está implementado, por qué, y lo
que falta porque depende de datos que hoy no existen. **Nada se ha inventado
para posicionar**: ni reseñas, ni dirección, ni años, ni precios.

## 1. Técnico

| | |
| --- | --- |
| HTML estático real: texto, `alt` y JSON-LD en el marcado, sin depender de JS | ✅ |
| `lang="es"`, un solo `<h1>` por página, jerarquía sin saltos | ✅ |
| `title`, `description`, `canonical`, Open Graph y Twitter únicos por página | ✅ |
| `robots`: `index, follow, max-image-preview:large, max-video-preview:-1` (404: `noindex`) | ✅ |
| URLs limpias con barra final; las siete antiguas se conservan | ✅ |
| `sitemap.xml` con extensiones de imagen y vídeo, generado | ✅ |
| `robots.txt` con la ruta del sitemap, generado | ✅ |
| Migas de pan visibles + `BreadcrumbList` | ✅ |
| Fuentes autoalojadas: ningún dominio de terceros en la carga | ✅ |
| CLS: todas las imágenes y vídeos con `width`/`height` o `aspect-ratio` reales | ✅ |
| LCP: póster del umbral precargado con `fetchpriority="high"`; en las obras, la foto de portada `eager` | ✅ |
| `npm run check` bloquea el despliegue si algo de lo anterior falla | ✅ |

**El dominio** se declara en un solo sitio: `content/site.json → origin`
(`https://tomasxcanales.com`). Si el definitivo es otro, se cambia ahí y se
compila: canonical, Open Graph, JSON-LD, sitemap y robots salen del mismo
dato.

## 2. Arquitectura e intención

```
/                     marca, descubrimiento de la obra, contacto
/work/                el archivo (CollectionPage + ItemList), con filtros por técnica
/work/<slug>/   × 11  una obra: técnica, zona, fotos, vídeos, relacionadas
/about/               la persona (ProfilePage): su declaración, el estudio
/booking/             conversión (ContactPage) + preguntas (FAQPage)
```

| Búsqueda tipo | Página |
| --- | --- |
| `tomasxcanales`, `tomás canales tatuador` | `/`, `/about/` |
| `tatuador madrid negro y gris`, `realismo negro y gris madrid` | `/`, `/work/` |
| `tatuaje línea fina madrid`, `micro-realismo` | `/work/` (filtros) y las obras de esa técnica |
| `tatuaje medusa brazo`, `tatuaje atlas hombro`, `tatuaje david miguel ángel pierna`, `manga egipcia tatuaje`, `tatuaje escultura mármol` | cada `/work/<slug>/` |
| `reservar cita tatuaje madrid` | `/booking/` |

Enlazado interno: la home descubre las obras (escenas + archivo), cada obra
enlaza con la anterior, la siguiente y dos relacionadas, y el pie enlaza las
seis primeras y el archivo.

## 3. Datos estructurados

| Tipo | Dónde |
| --- | --- |
| `WebSite`, `WebPage` | `/` |
| `Person` (Tomás Canales, `sameAs` Instagram, `worksFor` el estudio) | todas |
| `TattooParlor` (Tomasxcanales Studio, dirección completa en Parla, teléfono, correo, `hasMap`, `areaServed`) | `/`, `/about/`, `/booking/` |
| `VisualArtwork` (`artform` Tatuaje, `artMedium` Tinta sobre piel, `artworkSurface` = zona, `genre` = técnicas, `creativeWorkStatus`) | cada obra |
| `VideoObject` (póster, `contentUrl`, duración real, `uploadDate` = fecha de publicación en la web) | cada vídeo de cada obra |
| `CollectionPage` + `ItemList` | `/work/` |
| `ProfilePage` | `/about/` |
| `ContactPage` + `FAQPage` (idéntica a la FAQ visible) | `/booking/` |
| `BreadcrumbList` | páginas interiores |

**Deliberadamente sin marcar**: `streetAddress`, `geo` y `openingHours`, por
decisión (la web es un portafolio: ver §7); `priceRange`, `AggregateRating`,
`Review` y `dateCreated`, porque no se conocen. Marcar valoraciones inventadas
es motivo de penalización, además de mentir.

## 4. Imagen (el canal más importante para un tatuador)

- Nombres descriptivos: `tomasxcanales-medusa-zodiaco-plano-cerrado-1200.avif`.
- `alt` que describe lo que se ve, no una lista de palabras clave.
- AVIF + WebP + JPEG en `<picture>`, con `srcset` y `sizes` reales.
- `loading="lazy"` en todo salvo la imagen principal de cada página.
- Todas las fotos en el sitemap, con su página.

## 5. Vídeo

- Nombres descriptivos, póster del fotograma más representativo (elegido a
  mano: muchos clips arrancan desenfocados), `aria-label` que describe el
  contenido y texto de contexto junto a cada vídeo.
- `VideoObject` y `video:video` en el sitemap con título, descripción,
  duración y fecha.
- Vídeo solo en las páginas donde es contenido; las obras que solo existen en
  vídeo (David, Arcángel, Figuras clásicas) tienen su página construida
  alrededor del vídeo.

## 6. Local

Ciudad y estudio en títulos, descripciones, pie y `TattooParlor`. NAP
(nombre, teléfono, correo) desde una única fuente: `content/site.json`.

## 7. Qué hacer a continuación (por impacto)

**Decisión (12/10/2026):** el estudio es **Tomasxcanales Studio**, Calle Dos
Hermanas 20, 28982 Parla (Madrid), con ficha en Google Business
Profile. `TattooParlor` lleva la dirección completa (`streetAddress`,
`postalCode`, `addressLocality`), `hasMap` (enlace de búsqueda en Google Maps)
y `sameAs` (Instagram). No lleva `geo` ni `openingHoursSpecification`: no hay
coordenadas ni horario confirmados. **El nombre, la dirección y el teléfono de
la ficha de Google tienen que ser exactamente los de `content/site.json`.**
Cuando la ficha esté verificada, conviene cambiar `hasMap` por su enlace
directo (el «Compartir» de la ficha).

1. **Dominio + Search Console**, y enviar `sitemap.xml`.
2. **Enlace a la web desde la bio de Instagram.**
3. **Fotografiar** Arcángel y Figuras clásicas (Google Imágenes no indexa un
   fotograma de un MP4).
4. **Imagen para compartir 1200×630**: hoy `og:image` es la foto vertical de
   cada obra (WhatsApp e Instagram la recortan). Opcional.
5. Más adelante: versión en inglés (`/en/`, con `hreflang`) y páginas por
   estilo cuando haya 4 o 5 obras por estilo (hoy canibalizarían a las obras).

## 8. Analítica

Los eventos ya se envían a `window.dataLayer` (sin ningún ID inventado; hasta
pegar GA4/GTM en el `<head>` no hacen nada): `whatsapp_click`,
`instagram_click`, `email_click`, `booking_start`, `booking_submit`,
`voice_play`.
