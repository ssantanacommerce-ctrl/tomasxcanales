# Auditoría de assets: foto por foto, vídeo por vídeo

Revisión del 26/09/2026. Incluye la carpeta nueva (`Downloads/Tomasxcanales`,
15 archivos) y el archivo que ya tenía la web (15 originales). En total, **30
originales**, que ahora viven en `content/` (ver `docs/contenido.md`). Ninguno
se ha modificado: todo lo que sirve la web son derivados en `static/media/`.

Regla de curaduría: **menos obras, mejor presentadas**. Una pieza con mala
fotografía no entra aunque la pieza sea buena; se queda preparada (con su
carpeta y `published: false`) para cuando llegue una foto mejor.

---

## 1. Lectura general

| Hallazgo | Consecuencia |
| --- | --- |
| Todo el trabajo es negro y gris. | La interfaz no pone color. El único acento (violeta) sale del propio proceso: el calco del stencil. |
| Las fotos nuevas vienen de Instagram: 1170 px de ancho, casi todas 4:5. | No pueden ir a sangre a lo ancho en escritorio sin ablandarse. Se presentan como láminas colgadas o a la altura de la vista. |
| Las fotos antiguas son de 3413×5120. | Son las que aguantan el zoom a pantalla completa (Medusa). |
| Todos los vídeos son verticales 9:16… salvo un tramo de VIDA. | El vídeo vertical se presenta en su formato (marco, portal) y crece hasta la altura de la vista. El único plano apaisado (2,34:1, el estudio) se usa como franja de cine. |
| Los nombres de archivo nuevos son los textos que Tomás publicó con cada obra. | Son texto real del artista. Se usan como citas junto a la obra, siempre con su procedencia y cortados donde el nombre de archivo se corta. |
| VIDA es una declaración en su voz, con subtítulos. | Es la columna vertebral del texto de la web. Nada del texto de la web se ha inventado. |

---

## 2. Carpeta nueva: fotografías

| # | Archivo original | Medidas | Qué es | Veredicto | Categoría |
| --- | --- | --- | --- | --- | --- |
| N01 | `• Donde quiera que estén las huellas del Maestro…jpg` | 1170×1463 | Manga egipcia completa, brazo de perfil. Luz lateral suave, fondo de pasillo oscuro con un punto de luz cálida. Jeroglíficos, figura en su trono con el ojo de Horus, pirámides con geometría y Φ, gato esfinge con collar, figura en el desierto, greca en la muñeca. | Buena. Nítida, pieza entera legible. | FEATURED · PRIMARY · MOBILE |
| N02 | `• Obra en proceso… (1).jpg` | 1170×1453 | Atlas cargando el globo, órbitas con fases lunares, Hombre de Vitruvio, columnas de puntos y de 0/1. Piel reciente; a la izquierda, stencil violeta sin tatuar. | Buena, y el stencil visible es un valor: es proceso real. | FEATURED · PRIMARY · PROCESS |
| N03 | `• Obra en proceso… (2).jpg` | 1170×1446 | La misma toma que N02 con un giro mínimo. | Redundante. | **UNUSED** |
| N04 | `• Obra en proceso….jpg` | 1170×1453 | Detalle bajo el Hombre de Vitruvio: `CUE/RPO` sobre ☉ y `ESPI/RITU` sobre ○, y en violeta aún sin tatuar la frase «He caído tantas veces, ya es un arte el levantar», una escalera con puerta y una mariposa. | Muy buena como detalle. Enfoque correcto en la parte central. | DETAIL · PROCESS |
| N05 | `• Todo lo abraza el destino… (1).jpg` | 1170×1462 | Busto femenino de mármol agrietado, primer plano con poca profundidad de campo. | **La mejor foto nueva.** Rostro nítido, fondo difuso limpio. | FEATURED · DETAIL · MOBILE |
| N06 | `• Todo lo abraza el destino… (2).jpg` | 1170×1463 | La misma pieza entera sobre una tela estampada con calaveras. | El estampado compite con la obra y es un cliché del tatuaje. | **UNUSED** |
| N07 | `• Todo lo abraza el destino….jpg` | 1170×1459 | La pieza entera (busto, manos con hexágono, mariposa, geometría). Calaveras en el borde derecho, menos invasivas que en N06. | Aceptable. Solo en la página de la obra. | SECONDARY |
| N08 | `575679020_…_n.jpg` | 1170×1560 | Una persona de espaldas (se asume que es Tomás: viene de su Instagram) ante *La muerte de Sardanápalo* de Delacroix (el marco lleva el nombre), muros rojos, parqué. En color. | Muy buena. Es la galería real dentro de su vida. | ARTIST · ATMOSPHERIC |
| N09 | `575971617_…_n.jpg` | 1170×1560 | La misma persona ante *Las bodas de Caná* de Veronese. En color. | Buena. | ARTIST |
| N10 | `ChatGPT Image 26 sept 2026….png` | 1672×940 | Luna creciente y sol con 16 rayos, marfil sobre negro. | Variante de los símbolos. | IDENTITY (estado radiante del umbral) |
| N11 | `Ha llegado la hora de anticipar….jpg` | 1170×1170 | Hombro: figura sentada en una órbita con fases lunares, chakras, cerebro, ADN. | Subexpuesta, con ruido, sin contraste. La pieza merece otra foto. | **UNUSED** (`chakras-hombro`, sin publicar) |
| N12 | `SIMBOLOS.png` | 1672×940 | Luna creciente y sol (círculo con punto), marfil `#F8EEDF` sobre negro. | La marca canónica. | IDENTITY |

## 3. Carpeta nueva: vídeos

| # | Archivo | Formato | Qué contiene | Veredicto | Categoría |
| --- | --- | --- | --- | --- | --- |
| V01 | `- A veces en distintas situaciones…mp4` | 720×1280 · 29,0 s · 29 fps · AAC | Antebrazo girando: corazón anatómico sostenido por una mano de piedra, rosa en círculo punteado, dodecaedro. | Blando, la pieza ocupa poco cuadro y un estampado de calaveras y dragones ocupa el tercio derecho **en todos los fotogramas** (el brazo se mueve: ningún recorte fijo lo evita). Últimos 2,5 s en negro. | **UNUSED** (`corazon-anatomico-rosa`, sin publicar) |
| V02 | `INTRO.mp4` | 720×1280 · 12,4 s · 30 fps · AAC | David de Miguel Ángel en la pierna. Ver § 5. | Excelente apertura. | HERO · CINEMATIC · PROCESS |
| V03 | `VIDA.mp4` | 720×1280 · 35,4 s · 30 fps · AAC estéreo (voz + música) | La declaración de Tomás. Ver § 4. | Imprescindible como texto y voz; sus imágenes, recortadas. | PROCESS · ARTIST · (voz) |

---

## 4. VIDA, a fondo

**Método.** Sin herramientas de transcripción instaladas, el texto se sacó de
lo que el propio vídeo muestra: los subtítulos incrustados. Se extrajo la
franja de los subtítulos a 5 fotogramas por segundo (`ffmpeg`, recorte
720×130 en y=885) y se leyó fotograma a fotograma; así cada fragmento tiene su
intervalo exacto. El espectrograma del audio confirma voz sobre un fondo
musical continuo (sin silencios), coincidente con los subtítulos.

### Transcripción literal (con tiempos)

| Intervalo | Subtítulo |
| --- | --- |
| 0,2 – 0,8 | Considero el |
| 0,8 – 4,1 | tatuaje una ceremonia en la que se inmortalizan sentimientos |
| 4,8 – 6,8 | recuerdos intenciones y sueños |
| 8,2 – 12,1 | cada línea que realizo es intencionada y refleja respeto |
| 12,6 – 13,3 | paciencia |
| 13,6 – 16,5 | y conciencia hacia la persona que me confía su piel |
| 17,0 – 17,9 | mi proceso creativo |
| 18,0 – 18,5 | se basa |
| 18,6 – 21,9 | en transformar las ideas que recibo en un lenguaje propio |
| 22,4 – 23,7 | simbólico y evolutivo |
| 25,2 – 25,7 | cada símbolo |
| 25,8 – 26,7 | y cada geometría |
| 27,0 – 28,1 | están impregnados |
| 28,2 – 28,9 | de gratitud |
| 29,2 – 29,5 | por la |
| 29,6 – 29,9 | oportunidad |
| 30,0 – 32,9 | de materializar algo que permanecerá para siempre |

Con puntuación, cuatro frases:

> Considero el tatuaje una ceremonia en la que se inmortalizan sentimientos,
> recuerdos, intenciones y sueños. Cada línea que realizo es intencionada y
> refleja respeto, paciencia y conciencia hacia la persona que me confía su
> piel. Mi proceso creativo se basa en transformar las ideas que recibo en un
> lenguaje propio, simbólico y evolutivo. Cada símbolo y cada geometría están
> impregnados de gratitud por la oportunidad de materializar algo que
> permanecerá para siempre.

Además hay un rótulo: **«TOMÁS CANALES»** en versalitas cursivas espaciadas
(≈ 15,0 – 16,3 s). Es la forma en que él mismo compone su nombre, y es la
forma que usa la web para su nombre de persona (distinta de la marca
TOMASXCANALES).

### Imagen, tramo a tramo

| Tramo | Contenido |
| --- | --- |
| 0,0 – 4,2 | Manos con guante negro retiran el papel del stencil del antebrazo: el diseño de Ánima Spiritus queda calcado en violeta. |
| 4,2 – 5,0 | Preparación: capuchones de tinta, film, depresor. |
| 5,0 – 11,9 | Primeros planos de la aguja sobre el trazo violeta (icosaedro, círculos). Hacia 7 s, un reflejo de color en la máquina. |
| 12,0 – 14,9 | Resultado recién hecho: «Spiritus», icosaedro en un cuadrado, círculos, cola de ballena. |
| 15,0 – 16,5 | El rótulo sobre la columna de los cinco sólidos platónicos. |
| 16,5 – 18,0 | Negro. |
| 18,1 – 32,9 | **El único plano apaisado de todo el archivo** (2,34:1, en letterbox): el estudio. Tomás trabaja junto a un cliente tumbado en la camilla; en primer plano, la mesa con el material; un foco con difusor, una ventana. |
| 32,9 – 35,4 | Negro. |

### Qué comunica, y qué NO

Comunica: el tatuaje como **ceremonia**; lo que se inmortaliza
(sentimientos, recuerdos, intenciones, sueños); el trazo **intencionado**;
**respeto, paciencia y conciencia** hacia quien confía su piel; un proceso
que **transforma ideas ajenas en un lenguaje propio, simbólico y evolutivo**;
**gratitud**; **permanencia**.

No contiene: fechas, años de oficio, lugares, nombre del estudio, premios ni
biografía. Por eso la web no los muestra. El estudio (Tomasxcanales Studio) y
su dirección en Parla (Madrid) son datos del cliente, no de VIDA.

### Dónde se usa VIDA en la web

1. **La estructura de la home**: cada frase es un texto de sala. *Ceremonia*
   en el umbral; *cada línea* junto a la aguja; *lenguaje propio* en la escena
   del proceso; *gratitud / para siempre* antes del artista.
2. **La voz**: solo su voz, sin la música (ver nota). Se escucha a
   petición («Escuchar a Tomás», nunca en automático) y el texto se ilumina en
   sincronía con los tiempos de la tabla. En `/about/`, sobre la declaración
   completa.

   **Voz sin música (12/10/2026):** la música de fondo de VIDA no tiene licencia, así que se publica SOLO la voz de Tomás (`content/site/originals/vida-voz-sin-musica.flac`), separada con Demucs (`htdemucs_ft`, dos pasadas). Comprobado: en los tramos sin voz la música queda a −70 dB y la transcripción con Whisper solo contiene sus palabras. El audio de `vida.mp4` (con música) no se usa nunca.
3. **Las imágenes del proceso**: stencil (0–4,2 s), línea (5–11,9 s) y
   resultado (12–14,9 s), recortados a 720×880 para dejar fuera los
   subtítulos. Son la escena de Ánima Spiritus y su página.
4. **El estudio**: el plano apaisado, recortado a 720×304 (fuera el
   letterbox), en la sala del artista y en `/about/`.
5. **Microcopy**: el epígrafe de reservar («…hacia la persona que me confía su
   piel»), la respuesta de la FAQ sobre cómo trabaja las ideas, la meta
   descripción de `/about/` y la descripción del `Person` en JSON-LD.

---

## 5. INTRO, a fondo

| Tramo | Contenido |
| --- | --- |
| 0,0 – 2,3 | **Tomás de espaldas**, gorra negra, camiseta blanca, guantes negros, inclinado sobre la pierna con el stencil violeta del David (la estatua entera, con una luna creciente arriba y columnas de texto manuscrito). Primer plano desenfocado de su hombro: profundidad natural. |
| 2,3 – 4,0 | Manos y máquina; el sombreado de las piernas avanza. |
| 4,0 – 5,0 | Plano oscuro e inclinado de las piernas sombreadas. |
| 5,0 – 7,0 | Stencil arriba, sombreado abajo: se ve el paso de idea a piel. |
| 7,0 – 9,8 | Resultado: piernas, tronco de apoyo, pedestal y texto manuscrito. |
| 9,8 – 12,4 | Negro (recortado). |

Uso: el umbral. El vídeo **no arranca hasta que el diafragma del sol se
abre**, así que lo primero que se ve es su comienzo: Tomás trabajando. El
enfoque llega con la entrada (desenfoque → nitidez), el nombre se forma
encima y, al bajar, la cámara empuja hacia la aguja. Recortado a 0–9,8 s;
póster en 0,5 s; versión de 480 px (615 KB) para móvil. También es la
página de la obra **David**, que solo existe en vídeo.

---

## 6. Archivo anterior (15 originales)

| Original | Obra | Medidas | Veredicto | Categoría |
| --- | --- | --- | --- | --- |
| `077befd4` | Medusa, plano cerrado | 3413×5120 | La mejor foto del archivo. | HERO (OG) · FEATURED · DETAIL |
| `a695808c` | Medusa, plano general | 3413×5120 | Muy buena. | PRIMARY (inicio del zoom) |
| `f3d1790a` | Medusa, rotación (vídeo) | 576×1024 · 27,4 s · 150 fps | El giro envuelve la pieza. | CINEMATIC (atado al scroll) |
| `f617074b` | Medusa, detalle (vídeo) | 720×1280 · 17,8 s | Bueno. | DETAIL (página de obra) |
| `24e23663` | Ánima Spiritus, general | 3413×5120 | Buena. | PRIMARY |
| `886d9350` | Ánima Spiritus, medio | 3413×5120 | Buena, redundante en la home. | SECONDARY |
| `a50343f1` | Ánima Spiritus, detalle | 3413×5120 | Excelente macro. | FEATURED · DETAIL |
| `7cfe10d9` | Ánima Spiritus (vídeo) | 720×1280 · 20,6 s | Bueno. | SECONDARY |
| `3b5267a8` | Arcángel y geometría (vídeo) | 720×1280 · 21,0 s | La pieza más fina del archivo; solo en vídeo. | CINEMATIC · FEATURED |
| `2843a008` | Figuras clásicas (vídeo) | 720×1280 · 21,1 s | Bueno; funde a negro al final (recortado a 19 s). | SECONDARY |
| `c08a1e70` | Alas y escudo, medio | 3413×5120 | Buena, con la cinturilla de una marca abajo. | PRIMARY con **recorte editorial** del 7 % inferior |
| `2ab3fe34` | Alas y escudo, general | 3413×5120 | Ídem. | SECONDARY, recorte del 20 % inferior |
| `1455d404` | Hannya | 2874×5120 | Buena. | PRIMARY |
| `6f52bcbd` | Hannya (vídeo) | 720×1280 · 12,3 s | Bueno. | SECONDARY |
| `bc541f72` | Tres de espadas | 2880×5120 | Buena; pieza pequeña. | PRIMARY |

Los recortes quitan del cuadro lo que no es la obra (una marca de ropa). La
imagen no se retoca: ni filtros, ni brillo, ni contraste.

---

## 7. Resultado de la curaduría

**11 obras publicadas, 2 apartadas, 4 archivos sin usar.**

| Nivel | Qué | Dónde aparece |
| --- | --- | --- |
| HERO | INTRO (David) · Medusa plano cerrado | Umbral · imagen para compartir |
| FEATURED (escena propia en la home) | Medusa · Ánima Spiritus · Atlas · Rostro de mármol · Manga egipcia · Arcángel | Exposición |
| PRIMARY / SECONDARY | Figuras clásicas · Hannya · Alas y escudo · Tres de espadas | Archivo de la home, `/work/` y su página |
| PROCESS | VIDA (stencil, línea, resultado) · Atlas en proceso · INTRO | Escenas de proceso y páginas |
| ARTIST / ATMOSPHERIC | Delacroix · Veronese · el estudio (VIDA) · la voz | Sala del artista · `/about/` |
| IDENTITY | SIMBOLOS.png · variante radiante | Umbral, HUD, pie, iconos (vectorizados) |
| UNUSED | N03 · N06 · N11 · V01 | Ninguna. Sus obras esperan una foto nueva |

## 8. Auditoría visual final

| Material | ¿Merece estar? |
| --- | --- |
| Medusa, plano cerrado | Sí. La mejor imagen del archivo. |
| Medusa, plano general | Sí. |
| Medusa, rotación | Sí: es la única forma de ver la pieza entera. |
| Medusa, detalle (vídeo) | Sí, en su página. |
| Ánima, general / medio / detalle | Sí; en la home solo el detalle cierra la secuencia del proceso. |
| Ánima, vídeo antiguo | Sí, en su página. |
| VIDA: stencil / línea / resultado | Sí: proceso real de principio a fin. |
| Atlas general y detalle | Sí: obra en proceso con el stencil a la vista. |
| Atlas, toma casi idéntica (N03) | No. Redundante. |
| Rostro de mármol, primer plano (N05) | Sí. La mejor foto nueva. |
| Rostro de mármol, entero (N07) | Sí, solo en su página. |
| Rostro de mármol, sobre calaveras (N06) | No. |
| Manga egipcia | Sí. |
| INTRO / David | Sí. Es la entrada. |
| Arcángel | Sí. |
| Figuras clásicas | Sí, sin escena propia. |
| Hannya (foto y vídeo) | Sí, sin escena propia. |
| Alas y escudo | Sí, recortada. |
| Tres de espadas | Sí. |
| Chakras / hombro (N11) | No, hasta tener otra foto. |
| Corazón y rosa (V01) | No, hasta tener otra toma. |
| Museo: Delacroix, Veronese | Sí. |
| Estudio (VIDA) | Sí, como franja de cine. |

## 9. Derivados (tubería `npm run media`)

Cada imagen: AVIF + WebP + JPEG en 480/800/1200/1800 px (nunca por encima
del original). Cada vídeo: WebM VP9 + MP4 H.264 (720 px) + MP4 de 480 px +
póster en JPEG (en AVIF/WebP y dos anchos solo cuando se muestra como foto:
portada de una obra en vídeo o fondo de escena); el de Medusa, además, una
versión con un keyframe cada 5 cuadros para atarlo al scroll. Audio: Opus +
AAC. Los símbolos (`SIMBOLOS.png` y la variante) no se publican: son la
referencia de medida de los SVG. Medusa/detalle y Hannya/brazo se recortan
(`trim`) antes del negro final (12/10/2026).

Lo que descarga una visita de escritorio al entrar: el vídeo del umbral
(1,2 MB WebM; 615 KB en móvil). Todo lo demás se pide al acercarse.

## 10. Huecos que limitan la web (por prioridad)

1. **Retrato de Tomás de frente** y fotos del estudio: la sala del artista se
   sostiene con fotos de espaldas y el plano de VIDA.
2. **Fotografías** de Arcángel y de Figuras clásicas (Google Imágenes no indexa
   un fotograma de un MP4).
3. **Foto nueva** de Órbita y chakras, y **toma limpia** de Corazón y rosa.
4. **Atlas terminado**, cuando lo esté: `status` pasa a `null`.
5. ~~Confirmar que las fotos del museo son de Tomás.~~ Resuelto el
   12/10/2026: las hizo Tomás. El museo no es suyo ni es su estudio, y la web
   no lo nombra.
