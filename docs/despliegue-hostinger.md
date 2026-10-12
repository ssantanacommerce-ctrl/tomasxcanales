# Despliegue en Hostinger

**Hostinger no ejecuta Node.** Node solo se usa en tu ordenador para generar
y compilar. Al servidor se sube `dist/`: archivos estáticos.

```
tu ordenador                                   Hostinger
npm install
npm run build   (medios + páginas + Vite) ──► dist/ ──► public_html/
npm run check   (revisión previa)
```

## 1. Compilar

```bash
npm install
npm run build
npm run check
```

> **npm 11 bloquea los scripts de instalación.** Si tras `npm install` Vite no
> arranca (falta el binario de esbuild): `npm install-scripts approve esbuild`
> y vuelve a `npm install`. FFmpeg tiene que estar instalado para generar los
> vídeos (`ffmpeg -version`).

## 2. Qué hay en `dist/`

```
dist/
  index.html · 404.html · .htaccess · robots.txt · sitemap.xml · site.webmanifest
  work/index.html              el archivo
  work/<slug>/index.html × 11  las obras
  about/ · booking/
  media/<obra>/                fotos (AVIF/WebP/JPEG) y vídeos (WebM/MP4/480/pósters)
  media/site/                  artista, estudio, la voz de VIDA
  media/brand/                 iconos
  fonts/                       Melodrama y Boska
  _build/                      CSS y JS con hash + DM Mono
```

Unos **42 MB** en el servidor, que es la suma de todas las variantes. Una
visita descarga una fracción: al entrar, el vídeo del umbral (1,2 MB; 615 KB
en móvil) y lo demás solo al acercarse. Los originales de `content/` **no**
se publican nunca.

## 3. Subir

### Lo normal: `npm run publicar` (GitHub + Hostinger por SSH)

```bash
npm run publicar
```

Compila, revisa y, si todo está bien:

1. guarda los cambios en `main` y la web compilada como un commit nuevo en la
   rama **`produccion`** (registro de cada publicación) y sube las dos a GitHub;
2. sincroniza `public_html` por **SSH**: sube solo los archivos que han
   cambiado (primero CSS, JS y medios; el HTML y el `.htaccess` al final, para
   que no haya un instante con páginas sin estilos), borra los que sobran y
   comprueba con SHA-256 que el servidor queda idéntico a `dist/`.

Acceso SSH (una vez por ordenador):

- hPanel → Avanzado → Acceso SSH: estado **Activo**, y en «Claves SSH» la
  clave pública de `~/.ssh/tomasxcanales_hostinger.pub`.
- `~/.ssh/config` con el alias `tomasxcanales-hostinger` (IP, puerto 65002,
  usuario y la clave). Lo usa `tools/publish.mjs`.
- Prueba: `ssh tomasxcanales-hostinger "ls domains/tomasxcanales.com/public_html"`.

Si falla SSH, el script lo dice y GitHub queda igualmente al día: se puede
publicar a mano (abajo).

### A mano (si GitHub fallara)

**Administrador de archivos** (hPanel → Archivos): vacía `public_html/`,
sube un .zip con el **contenido** de `dist/` (no la carpeta) y descomprímelo
allí. `index.html` tiene que quedar en `public_html/index.html`. Después borra
el .zip del servidor. Permisos: carpetas `755`, archivos `644` (nunca `777`).

Para crear el .zip usa `tar` y no `Compress-Archive` (PowerShell 5.1 puede
escribir rutas con `\` y saltarse el `.htaccess`):

```powershell
$fecha = Get-Date -Format yyyyMMdd-HHmm
tar -a -c -f "$env:USERPROFILE\Desktop\publicacion-tomasxcanales-$fecha.zip" -C dist .
```

**FTP** (FileZilla, datos en hPanel → Cuentas FTP): local
`C:\Users\chavi\Desktop\Tomasxcanales\dist\`, remoto `/public_html/`.

El `.htaccess` va incluido y hace todo esto, sin tocar nada en hPanel:
HTTPS y dominio sin `www` en un solo salto, barra final en las URLs, página
404 propia (también para los 403), bloqueo de archivos ocultos, copias,
comprimidos y fuentes del proyecto, nada de PHP, tipos MIME de AVIF/WebM/M4A,
compresión, caché (bundles con hash: un año; fotos y vídeos: 30 días; HTML:
siempre revalidado) y cabeceras de seguridad, incluida la
**Content-Security-Policy** con el hash del script del `<head>` (la escribe
`tools/csp.mjs` al compilar). Si el Administrador de archivos no muestra
archivos ocultos, actívalo para comprobar que está.

> **Sube siempre el `.htaccess` de cada compilación.** Si cambia el script del
> `<head>`, cambia su hash: un `.htaccess` viejo con HTML nuevo dejaría la web
> sin ese script (sin movimiento), aunque nada se rompe.

## 4. Después de subir

1. **SSL activo** en hPanel → Seguridad **antes** de subir. **No actives
   «Forzar HTTPS»** en hPanel: el `.htaccess` ya lo hace y dos reglas iguales
   pueden encadenar redirecciones.
2. **Un dominio canónico**: el sitio declara `https://tomasxcanales.com` (sin
   `www`). Si es otro, cámbialo en `content/site.json → origin` y vuelve a
   compilar.
3. Comprueba `tudominio.com/esto-no-existe` → la 404 propia.
4. Envía `sitemap.xml` a Google Search Console.
5. Comprobaciones de seguridad: `/.htaccess`, `/.env`, `/package.json`,
   `/src/`, `/node_modules/`, un `.map` y un `.zip` dan 403 o 404; `http://`
   y `www.` llegan a `https://tomasxcanales.com/`; las cabeceras se ven en
   securityheaders.com; `/.well-known/security.txt` responde 200.

## 5. Actualizar

`npm run build && npm run check` y vuelve a subir. Los nombres de `_build/`
cambian en cada compilación: **borra el `_build/` anterior** del servidor
antes de subir el nuevo, o se acumularán archivos muertos.

## 6. Formulario

Un cuestionario de cuatro preguntas. No hay backend: valida en el navegador, limpia lo escrito y abre WhatsApp con el
mensaje ya redactado para Tomás. No se guarda nada. El número sale de
`content/site.json`. Sin JavaScript se muestra un enlace directo a WhatsApp.
Para recibir también las solicitudes por correo haría falta un servicio
externo (Formspree, Basin…) o un `sendmail.php`, y cambiar `src/js/booking.js`.
