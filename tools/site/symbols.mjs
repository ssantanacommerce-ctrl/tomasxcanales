/* ==========================================================================
   TOMASXCANALES · los símbolos del artista, en vector

   Medidos sobre content/site/originals/simbolos.png (1672x940), no dibujados
   a ojo: se ajustaron círculos por mínimos cuadrados a los bordes de cada
   forma (ver docs/identidad.md). Todo va en unidades donde el radio exterior
   de la luna vale 100 y su centro es el origen.

     luna    círculo r=100 en (0,0) menos círculo r=96.63 en (26.35,0)
     sol     anillo r=103 (trazo 3.2) + punto r=51.2, centrado en (216.7,0)

   La variante con rayos (simbolos-radiante.png) conserva exactamente la
   misma separación entre luna y sol, así que el paso de una a otra no salta:
   el anillo se contrae (r=54, trazo 8.5), el punto se apaga y salen 16
   rayos: 4 largos, 4 medios y 8 cortos, con las proporciones del original.
   ========================================================================== */

export const SUN_X = 216.7;

/** Creciente: arco exterior grande (0 1 0) y vuelta por el interior (0 0 1). */
export const LUNA_PATH =
  "M25.75 -96.63A100 100 0 1 0 25.75 96.63A96.63 96.63 0 0 1 25.75 -96.63Z";

/** 16 rayos como triángulos finos, con base en r0 y punta en r1. */
export function rays() {
  const out = [];
  for (let i = 0; i < 16; i++) {
    const deg = i * 22.5;
    const kind = i % 4 === 0 ? "long" : i % 2 === 0 ? "mid" : "short";
    const [r0, r1, half] = kind === "long" ? [62, 138, 6] : kind === "mid" ? [62, 125, 5.2] : [61, 95, 4.4];
    const a = ((deg - 90) * Math.PI) / 180; // 0º arriba
    const px = (r, off) => {
      const nx = -Math.sin(a), ny = Math.cos(a); // normal
      return [(Math.cos(a) * r + nx * off).toFixed(2), (Math.sin(a) * r + ny * off).toFixed(2)];
    };
    const [x0, y0] = px(r0, -half), [x1, y1] = px(r0, half), [xt, yt] = px(r1, 0);
    out.push(`<polygon class="ray ray--${kind}" points="${x0},${y0} ${x1},${y1} ${xt},${yt}" style="--i:${i}"/>`);
  }
  return out.join("");
}

/** Marca estática (tal cual SIMBOLOS.png). `title` la hace accesible. */
export function mark({ cls = "mark", title = null } = {}) {
  const t = title ? `<title>${title}</title>` : "";
  return `<svg class="${cls}" viewBox="-104 -108 430 216" ${title ? 'role="img"' : 'aria-hidden="true" focusable="false"'}>${t}` +
    `<path d="${LUNA_PATH}"/>` +
    `<circle cx="${SUN_X}" cy="0" r="103" fill="none" stroke="currentColor" stroke-width="3.2"/>` +
    `<circle cx="${SUN_X}" cy="0" r="51.2"/>` +
    `</svg>`;
}

/** Solo el sol (favicon, pequeños tamaños). */
export function sun({ cls = "sun" } = {}) {
  return `<svg class="${cls}" viewBox="-106 -106 212 212" aria-hidden="true" focusable="false">` +
    `<circle cx="0" cy="0" r="103" fill="none" stroke="currentColor" stroke-width="5"/>` +
    `<circle cx="0" cy="0" r="51.2"/></svg>`;
}

/**
 * La versión animable del cargador. La luna se construye con una máscara
 * cuyo círculo de sombra (id lunaShadow) se desplaza de 0 a 26.35: la luna
 * crece como una fase lunar, de luna nueva a creciente.
 */
export function ritual() {
  return `<svg class="ritual" viewBox="-150 -170 520 340" aria-hidden="true" focusable="false">
  <defs>
    <mask id="luna-mask" maskUnits="userSpaceOnUse" x="-120" y="-120" width="240" height="240">
      <rect x="-120" y="-120" width="240" height="240" fill="#fff"/>
      <circle class="ritual__shadow" cx="26.35" cy="0" r="96.63" fill="#000"/>
    </mask>
  </defs>
  <g class="ritual__luna"><circle cx="0" cy="0" r="100" mask="url(#luna-mask)"/></g>
  <g class="ritual__sol" transform="translate(${SUN_X} 0)">
    <g class="ritual__rays">${rays()}</g>
    <circle class="ritual__ring" cx="0" cy="0" r="103" fill="none" stroke="currentColor" stroke-width="3.2" pathLength="1"/>
    <circle class="ritual__dot" cx="0" cy="0" r="51.2"/>
  </g>
</svg>`;
}
