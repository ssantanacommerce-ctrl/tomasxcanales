# Dirección creativa

## 1. El concepto: la ceremonia

La idea no se ha inventado: está en la primera frase de VIDA.

> Considero el tatuaje una ceremonia en la que se inmortalizan sentimientos,
> recuerdos, intenciones y sueños.

La web es esa ceremonia en dos luces:

- **Noche**: el acto. El umbral con los símbolos, Tomás inclinado sobre la
  piel, la aguja. Negro suave, vídeo, silencio.
- **Día**: la obra. Una sala de galería de muro cálido donde las piezas
  cuelgan como láminas, con su cartela.

El paso de una a otra ocurre **una sola vez**, y es un amanecer: la luz se
abre desde el centro, donde estaba el sol del umbral. Es el único cambio de
tema de la página (la guía Taste lo permite una vez, como gesto deliberado).
Los vídeos que dentro de la sala ocupan la vista (Arcángel) no cambian el
tema: es la obra la que llena el cuadro, y al salir vuelve a su marco.

Sobre el cambio respecto a la versión anterior: la «galería negra» se decidió
con el material de entonces. El brief nuevo pide expresamente blanco, marfil
y tonos naturales tras la entrada, y el material nuevo lo sostiene: las fotos
del museo (muros rojos, marcos dorados, parqué) y el mármol de las
esculturas que tatúa. La noche se queda donde tiene sentido: el ritual y el
cine.

## 2. Referencias: qué se ha aprendido, qué no se ha copiado

**oscarakermo.com**: cargador con el sigilo del artista; nombre monumental en
grotesca con las O convertidas en lunas; «Book Experience» como fila
tipográfica; `SCROLL (%)` como único indicador; negro puro.
**andreapellerone.com**: su sigilo (una onda) como cargador y cierre; texto de
declaración que se revela con el scroll; tira de obras; tipografía genérica.

Lo que comparten y se ha tomado **como principio**: el símbolo real del
artista como entrada; su propia declaración como contenido central; la
reserva como tipografía, no como botón.

Lo que **no** se ha hecho, a propósito: letras sustituidas por lunas en el
nombre (es el gesto de Akermo); negro de principio a fin; revelado de texto
por opacidad. Aquí el texto no aparece: **se entinta**, del violeta del
stencil a la tinta, que es el proceso que describe VIDA.

## 3. Taste: lectura del encargo

> Rediseño a fondo del portfolio de un tatuador para clientes con criterio
> visual, en el lenguaje de una galería de arte de lujo con tiempo de cine,
> con Vite estático + GSAP ScrollTrigger + tipografía propia.

Diales: variación 8, movimiento 7 (lento y atado al scroll), densidad 2.

Reglas aplicadas: Fraunces fuera (la serif por defecto de las IA);
un solo acento de color; un solo cambio de tema; ninguna raya larga en el
texto; sin numeración de secciones, sin avisos de «scroll», sin cursor
propio, sin grano animado; una etiqueta por intención («Reservar cita» en
todas partes); controles en píldora y láminas en ángulo recto.

## 4. Paleta

| Token | Valor | Qué es |
| --- | --- | --- |
| `--night` | `#0c0b0a` | La noche del ritual. Nunca `#000`. |
| `--wall` | `#efece6` | El muro de la sala. |
| `--wall-2` / `--marble` | `#e5e1d9` / `#cfc9bf` | Paspartú y mármol (la palabra ATLAS al fondo). |
| `--ink` / `--ink-3` | `#141311` / `#66615a` | Texto y cartelas (4,8:1 sobre el muro). |
| `--bone` | `#f2ece2` | Texto sobre la noche. |
| `--symbol` | `#f8eedf` | El marfil exacto de SIMBOLOS.png. |
| `--stencil` | `#5b53a6` | **El único acento**: el violeta del calco. |

El violeta tiene un solo uso: el estado de *idea antes de ser tinta*. Las
palabras de VIDA empiezan en violeta y se vuelven tinta al bajar; lo que en
Atlas todavía es stencil se nombra en violeta; «En proceso» va en violeta.

Modo oscuro del sistema: la identidad no cambia (noche para el ritual, día
para la sala), pero el muro baja un punto (`#dedad2`), como una sala al
atardecer.

## 5. Tipografía

Se probó de verdad antes de decidir: el nombre a tamaño real sobre un
fotograma de INTRO y sobre el muro, en dieciocho familias (Castoro Titling,
Italiana, Anybody, Archivo expandida, Commissioner, Gloock, Hedvig, Newsreader,
Ibarra Real Nova, Mona Sans, Schibsted, Tenor, Geist, Melodrama, Zodiak,
Boska, Noto Serif Display y la Fraunces anterior).

| Uso | Familia | Por qué |
| --- | --- | --- |
| Nombre y titulares | **Melodrama** (variable 300–700) | Didona condensada y contemporánea con carácter propio. Los trazos finos son la aguja de línea fina; los gruesos, el sombreado en negro y gris. El condensado da al nombre de 13 letras una sola línea monumental. |
| La voz de Tomás y el texto | **Boska** (variable, con cursiva) | De la misma fundición. Su cursiva afilada lleva las frases de VIDA; en redonda es texto de lectura. |
| Cartelas, datos, interfaz | **DM Mono** | Tomás usa letra monoespaciada en sus tatuajes (`CUE/RPO`, `ESPI/RITU`, «He caído tantas veces…»). La cartela habla su misma letra. |

Melodrama y Boska: Fontshare (ITF Free Font License, uso comercial y web).
DM Mono: OFL. Todo autoalojado: **cero peticiones a terceros**.

**TOMASXCANALES** (la marca) va en Melodrama, en una línea ajustada al
ancho exacto de su caja. **Tomás Canales** (la persona) va como él lo
compone en VIDA: versalitas cursivas muy espaciadas.

El nombre se trata como pieza: llega con las letras separadas y se junta
(kerning expresivo); al bajar, TOMAS sale por la izquierda y CANALES por la
derecha mientras la X, la juntura, se queda y crece; en el pie sale del
cuadro por abajo, cortado.

## 6. Los símbolos

`SIMBOLOS.png` se **midió**, no se redibujó: se ajustaron círculos por
mínimos cuadrados a los bordes de cada forma. La luna es un círculo menos
otro (r 100 y 96,6, desplazado 26,4); el sol, un anillo (r 103, trazo 3,2) y
un punto (r 51,2). La variante con rayos conserva exactamente la misma
separación, así que el paso de una a otra no salta. Ver
`tools/site/symbols.mjs`.

Dónde aparecen: el umbral, el HUD, el botón de la voz, la frase final, el
pie, la 404 y los iconos. Nunca como decoración genérica: siempre son la
firma.

### El umbral (3 segundos)

La luna crece como una fase lunar (de luna nueva a creciente) → el anillo
del sol se dibuja y el punto se enciende → el nombre de la persona →
salen los rayos → el anillo se convierte en diafragma y se abre sobre el
vídeo. El vídeo arranca en ese instante, así que lo primero que se ve es su
comienzo. Segunda visita en la sesión: 1,1 s. Sin movimiento: los símbolos
quietos un momento. Durante el umbral no se puede hacer scroll.

## 7. La exposición (home)

| # | Escena | Obra | Gesto |
| --- | --- | --- | --- |
| 01 | Umbral | David (INTRO) | Diafragma → enfoque → el nombre se forma → la cámara empuja hacia la aguja → VIDA 1 se entinta → amanecer |
| 02 | Medusa y el zodiaco | Medusa | La lámina cuelga pequeña y crece hasta la altura de la vista; *match cut* al plano cerrado; el brazo gira con el scroll |
| 03 | Cada línea | Ánima (VIDA) | VIDA 2 se entinta junto a la aguja trabajando |
| 04 | Ánima Spiritus | Ánima | Del stencil a la piel: 4 estados en el mismo marco mientras VIDA 3 se entinta |
| 05 | Atlas | Atlas | Capas: ATLAS en mármol al fondo, la pieza, el detalle con el stencil delante |
| 06 | Rostro de mármol → Manga egipcia | dos obras | Quietud; después la tinta se desplaza y una obra se convierte en otra (WebGL) |
| 07 | Arcángel y geometría | Arcángel | El vídeo pasa de marco a pantalla completa; la sala se apaga; el título lo cruza |
| 08 | Archivo | todas | Travelling por el muro; cada lámina gira hacia ti al pasar (CSS 3D) |
| 09 | Para siempre | — | VIDA 4, y los símbolos |
| 10 | Tomás Canales | — | El museo, su voz sincronizada, el estudio en formato cine |
| 11 | Reservar | — | «…hacia la persona que me confía su piel.» y RESERVAR CITA |

Unas 28 pantallas de recorrido en escritorio y 24 en móvil.

## 8. Movimiento

1. **El scroll es la cámara.** Zoom, empuje, desplazamiento, cambio de foco:
   todo atado al progreso (`scrub`), nada que «entre desde la izquierda».
2. **Nunca dos animaciones sobre la misma propiedad.** Cada letra tiene dos
   capas (la entrada anima una, el scroll la otra): bajar mientras el nombre
   se forma no hace reaparecer letras.
3. **Solo `transform`, `opacity`, `filter`, `clip-path` y máscaras.**
4. **Lento.** Nada rebota.
5. Técnicas usadas: `scrub`, `pin`, `timeline`, `gsap.matchMedia` (escritorio
   y móvil se construyen y se revierten solos), `stagger`,
   `ScrollTrigger.refresh()` tras cargar fuentes e imágenes.

### 3D y WebGL: dónde y por qué

- **WebGL**: una sola vez, en la transformación de una obra en otra. Es tinta
  desplazándose, el material de la obra. Intensidad 0,10 (con 0,16 el tatuaje
  se leía derretido). Texturas pedidas al acercarse; si falla, fundido.
- **CSS 3D**: el travelling del archivo (perspectiva real, como pasar ante un
  muro).
- **Sin Three.js ni React Three Fiber**: para un quad y dos texturas serían
  ~150 KB sin mejorar la obra. El criterio del brief («¿esto hace que la obra
  se vea mejor?») los deja fuera.

### El vídeo como obra

Ninguno aparece como «un vídeo en una caja». INTRO es la entrada; la rotación
de Medusa se controla con el scroll; los tramos de VIDA son el proceso; el
Arcángel pasa de marco a sala; el estudio es una franja de cine. Todos en
silencio; la voz de Tomás solo a petición. El vídeo del umbral tiene botón de
pausa (WCAG 2.2.2).

## 9. Navegación

No hay barra. El HUD aparece al dejar el umbral y se aparta al bajar.
Arriba: la marca con los símbolos, **Obra**, **Artista** y **Reservar cita**.
Abajo: el nombre de la sala en la que estás y una línea de 2 px de progreso.
Va en `mix-blend-mode: difference`: tinta sobre el muro y marfil sobre la
noche o una foto oscura, sin cajas.

## 10. Móvil

| | Escritorio | Móvil |
| --- | --- | --- |
| Vídeo del umbral | Portal vertical con resplandor ambiente | A pantalla completa (su formato nativo), versión de 480 px |
| Escenas fijadas | 6 | 5 (el archivo es un carrusel nativo, sin secuestrar el scroll) |
| Transformación de obras | WebGL | Fundido |
| Parallax | Completo | A la mitad |
| Menú | En el HUD | Pantalla completa |

## 11. Accesibilidad

`prefers-reduced-motion`: sin escenas fijadas, sin scrub, sin autoplay; todo
visible (las secuencias se imprimen como rejilla, el archivo se recorre con
desplazamiento nativo). Un `<h1>` por página, migas de pan, foco visible,
enlace de salto, menú con Escape, vídeos con descripción y póster, la voz
siempre con su texto en la página.
