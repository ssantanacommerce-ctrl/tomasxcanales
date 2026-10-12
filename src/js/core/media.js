/* ==========================================================================
   TOMASXCANALES · ciclo de vida de imagen y vídeo

   - Imágenes: se marcan al cargar para entrar con un fundido (CSS).
   - Vídeo: nadie descarga metraje que no va a ver. Todo va con
     preload="none"; se carga al acercarse, se reproduce mientras se ve y se
     pausa al salir. En pantallas estrechas se cambia a la versión de 480 px.
   ========================================================================== */

const NARROW = () => window.innerWidth <= 700;

export function markImages(root = document) {
  root.querySelectorAll("img[data-media]").forEach((img) => {
    const done = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth) done();
    else {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    }
  });
}

/** Sustituye las fuentes por la versión móvil. Seguro: aún no se ha pedido nada. */
export function useMobileSource(video) {
  const base = video.dataset.video;
  if (!base || !NARROW() || video.dataset.mobile === "1") return;
  video.dataset.mobile = "1";
  video.innerHTML = `<source src="${base}-480.mp4" type="video/mp4">`;
  video.load();
}

/** Versión con keyframes densos para atar el tiempo al scroll. */
export function useScrubSource(video) {
  const src = video.dataset.scrub;
  if (!src || video.dataset.scrubbing === "1") return false;
  video.dataset.scrubbing = "1";
  video.loop = false;
  video.removeAttribute("loop");
  video.innerHTML = `<source src="${src}" type="video/mp4">`;
  video.preload = "auto";
  video.load();
  return true;
}

export function safePlay(video) {
  if (!video) return;
  video.muted = true;
  video.playsInline = true;
  if (video.preload === "none") video.preload = "auto";
  const p = video.play();
  if (p && p.catch) p.catch(() => {}); // un autoplay rechazado no es un error: queda el póster
}

/** Reproduce al entrar en pantalla, pausa al salir. */
export function autoplayVideos(root = document) {
  const videos = [...root.querySelectorAll("video[data-autoplay]")];
  videos.forEach(useMobileSource);
  if (!("IntersectionObserver" in window)) {
    videos.forEach(safePlay);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) safePlay(e.target);
      else if (!e.target.paused) e.target.pause();
    }
  }, { rootMargin: "240px 0px", threshold: 0.08 });
  videos.forEach((v) => io.observe(v));
}
