/* ==========================================================================
   TOMASXCANALES · una obra se convierte en otra (WebGL)

   El busto de mármol se disuelve y la tinta se recompone en la manga
   egipcia. El desplazamiento sigue un ruido de dos octavas: la tinta se
   extiende, no "ondula". Es el único WebGL de la web, y está aquí porque es
   el material de la obra (tinta moviéndose sobre piel), no un efecto pegado.

   Por qué a mano y no Three.js: un quad, dos texturas y un shader. Three.js
   serían ~150 KB para eso; esto son 3 KB.

   La intensidad se quedó en 0.10 después de probar 0.16: con más, a mitad de
   camino el tatuaje se leía derretido. Un efecto que hace que la obra se vea
   peor no se queda.

   Degradación: sin WebGL, sin texturas o con el contexto perdido, el llamador
   recibe null (o se cae a null en caliente) y hace un fundido cruzado.
   ========================================================================== */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uCoverA;
uniform vec2 uCoverB;
uniform float uProgress;
uniform float uIntensity;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float flow(vec2 p) { return noise(p * 3.0) * 0.65 + noise(p * 7.0) * 0.35; }
vec2 cover(vec2 uv, vec2 s) { return (uv - 0.5) * s + 0.5; }

void main() {
  float bell = sin(uProgress * 3.14159265);
  float n = flow(vUv + vec2(uProgress * 0.15, 0.0));
  vec2 dir = vec2(n - 0.5, flow(vUv.yx * 1.3) - 0.5);
  vec2 d = dir * uIntensity * bell;
  vec4 a = texture2D(uA, cover(vUv + d, uCoverA));
  vec4 b = texture2D(uB, cover(vUv - d, uCoverB));
  float edge = smoothstep(uProgress - 0.35, uProgress + 0.35, n * 0.55 + (1.0 - vUv.y) * 0.45);
  float mixer = mix(smoothstep(0.0, 1.0, uProgress), clamp(1.0 - edge, 0.0, 1.0), bell);
  gl_FragColor = mix(a, b, mixer);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}

function loadImage(src) {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => ok(img);
    img.onerror = () => ko(new Error(src));
    img.src = src;
  });
}

function texture(gl, img) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return t;
}

const coverScale = (cw, ch, iw, ih) => {
  const s = Math.max(cw / iw, ch / ih);
  return [cw / (iw * s), ch / (ih * s)];
};

/**
 * @param {HTMLElement} box     contenedor (recibe el <canvas>)
 * @param {HTMLElement[]} frames  los dos marcos con data-displace-src
 * @returns {{ set(p:number):void } | null}
 */
export function initDisplace(box, frames) {
  if (frames.length < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.className = "displace__canvas";
  canvas.setAttribute("aria-hidden", "true");
  let gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", premultipliedAlpha: false });
  } catch { gl = null; }
  if (!gl) return null;

  let progress = 0, ready = false, dead = false, u = null, imgs = null;
  const cssSet = (p) => { frames[1].style.opacity = String(p); };

  const draw = () => {
    if (!ready || dead) return;
    gl.uniform1f(u.progress, progress);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const resize = () => {
    if (!ready) return;
    const r = box.getBoundingClientRect();
    const scale = r.width / (box.offsetWidth || r.width) || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round((r.width / scale) * dpr));
    const h = Math.max(1, Math.round((r.height / scale) * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2fv(u.coverA, coverScale(w, h, imgs[0].naturalWidth, imgs[0].naturalHeight));
    gl.uniform2fv(u.coverB, coverScale(w, h, imgs[1].naturalWidth, imgs[1].naturalHeight));
    draw();
  };

  let started = false;
  const load = () => {
    if (started) return;
    started = true;
    Promise.all(frames.map((f) => loadImage(f.dataset.displaceSrc)))
    .then((loaded) => {
      imgs = loaded;
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture(gl, imgs[0]));
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texture(gl, imgs[1]));
      u = {
        A: gl.getUniformLocation(prog, "uA"), B: gl.getUniformLocation(prog, "uB"),
        coverA: gl.getUniformLocation(prog, "uCoverA"), coverB: gl.getUniformLocation(prog, "uCoverB"),
        progress: gl.getUniformLocation(prog, "uProgress"), intensity: gl.getUniformLocation(prog, "uIntensity")
      };
      gl.uniform1i(u.A, 0);
      gl.uniform1i(u.B, 1);
      gl.uniform1f(u.intensity, 0.1);
      box.appendChild(canvas);
      frames[1].style.opacity = "";
      box.closest("[data-stage]")?.setAttribute("data-displace-mode", "gl");
      ready = true;
      resize();
      new ResizeObserver(resize).observe(box);
    })
    .catch(() => { dead = true; canvas.remove(); box.closest("[data-stage]")?.removeAttribute("data-displace-mode"); cssSet(progress); });
  };

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    dead = true;
    canvas.remove();
    box.closest("[data-stage]")?.removeAttribute("data-displace-mode");
    cssSet(progress);
  });

  return {
    load,
    set(p) {
      if (!started) load();
      progress = p;
      if (ready && !dead) requestAnimationFrame(draw);
      else cssSet(p);
    }
  };
}
