// Arma las piezas verticales (9:16) de los potrillos: el video ya editado por el usuario, intacto, con las placas
// encima (barra del footer-lote hasta el cierre, ficha y cierre). Datos: lotes.json; tiempos y música: video-lotes.json → "vertical".
//   "vertical": { "origen": "<carpeta>/<archivo>", "ficha": [a, b], "cierre": a, "musica": "x.mp3", "musicaInicio": 45 }
//
// Uso (desde remate-videos/):
//   node herramientas/armar-video-lote-vertical.mjs [NN ...]
// Salida: composiciones/00-00-HA-VideoLote-9x16-NN/ · clip en assets/clips/loteNN-vertical.mp4

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(readFileSync(join(root, "herramientas", "lotes.json"), "utf8"));
const video = JSON.parse(readFileSync(join(root, "herramientas", "video-lotes.json"), "utf8"));
const datosVideo = new Map(video.lotes.map((l) => [l.lote, l]));
const molde = join(root, "composiciones", "00-00-HA-VideoLoteD-16x9-01");
const pedidos = process.argv.slice(2).map((n) => n.padStart(2, "0"));

const duracion = (ruta) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ruta]).toString());
const html = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const palabras = (t) => String(t).trim().split(/\s+/).map((p) => `<span class="mask"><span class="pal">${html(p)}</span></span>`).join(" ");
const SELLO = "brand/logos/PNG/HA_Emblema_Dorado_Negativo.png";

function pagina(l, cfg, D, pieza, clip) {
  const [f0, f1] = cfg.ficha, c0 = cfg.cierre;
  const nombre = palabras(l.nombre), sangre = html(l.pedigri);
  const sexo = l.sexo.toLowerCase().startsWith("h") ? "Hembra" : "Macho";
  const datosFicha = [sexo, l.pelo || "—", ...(l.registro && l.registro !== "—" ? [`AAFE ${l.registro}`] : []), l.nac || "—"];
  const anchoCaja = +((960 - 14 * (datosFicha.length - 1)) / datosFicha.length).toFixed(2);
  const cajas = datosFicha.map((d) => `<div class="caja">${html(d)}</div>`).join("");
  const loteFila = `<div class="lote"><span>Lote</span><svg class="diag" viewBox="0 0 37.3 64"><line x1="0" y1="64" x2="37.3" y2="0" /></svg><span>${l.lote}</span></div>`;
  const TAPA = 2;
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>${pieza}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <link rel="stylesheet" href="brand/tokens.css" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; overflow: hidden; background: var(--ha-black); }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: var(--ha-black); }
      #v-clip { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; }
      /* Degradado detrás de cada placa: el texto va sobre pasto y cielo claros */
      .velo { position: absolute; left: 0; right: 0; bottom: 0; opacity: 0; background: linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--ha-black) 62%, transparent) 42%, color-mix(in srgb, var(--ha-black) 78%, transparent) 100%); }
      /* Zona segura 9:16: y = 270 a 1580. Los bloques terminan en 1580 */
      .bloque { position: absolute; left: 0; width: 1080px; bottom: 340px; display: flex; flex-direction: column; align-items: center; text-transform: uppercase; color: var(--ha-white); font-family: var(--ha-font-sans); }
      .sombra { text-shadow: 0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent), 0 0 16px color-mix(in srgb, var(--ha-black) 60%, transparent); }
      .nombre { white-space: nowrap; line-height: 1.05; font-weight: var(--ha-t-lot-weight); letter-spacing: var(--ha-t-lot-track); font-size: calc(var(--ha-t-lot-size) * 1.333); }
      .mask { display: inline-block; overflow: hidden; vertical-align: top; }
      .pal { display: inline-block; }
      .linea { width: 620px; height: 6px; margin: 18px 0; background: var(--ha-gold); transform-origin: 0% 50%; clip-path: polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%); }
      .sangre { white-space: nowrap; line-height: 1.25; font-weight: var(--ha-t-data-weight); letter-spacing: var(--ha-t-data-track); font-size: calc(var(--ha-t-data-size) * 1.45); }
      .lote { display: flex; align-items: center; gap: 16px; margin-top: 16px; color: var(--ha-sand); font-weight: var(--ha-t-lot-weight); letter-spacing: var(--ha-t-label-track); font-size: calc(var(--ha-t-label-size) * 1.247); }
      .diag { width: 37.3px; height: 64px; overflow: visible; filter: drop-shadow(0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent)); }
      .diag line { stroke: var(--ha-sand); stroke-width: var(--ha-border); }
      .cajas { display: grid; grid-template-columns: repeat(${datosFicha.length}, ${anchoCaja}px); gap: 14px; }
      .caja { height: 64px; display: flex; align-items: center; justify-content: center; white-space: nowrap; background: var(--ha-panel-dark); border: var(--ha-border) solid var(--ha-line-gold); font-weight: var(--ha-t-data-weight); letter-spacing: var(--ha-t-data-track); font-size: calc(var(--ha-t-data-size) * 1.45); }
      /* Ficha: una fila justo arriba de la barra */
      #b-ficha { bottom: 526px; }
      /* Barra del footer-lote adaptada a 1080: misma proporción de diagonal, con la sangre en una segunda línea */
      .ft-barra { position: absolute; left: 60px; top: 1408px; width: 960px; height: 172px; background: var(--ha-panel-dark); border: var(--ha-border) solid var(--ha-line-gold); }
      .ft-diag { position: absolute; left: 142px; top: 1408px; width: 119px; height: 172px; overflow: visible; }
      .ft-diag line { stroke: var(--ha-gold); stroke-width: var(--ha-border); }
      .ft-txt { position: absolute; white-space: nowrap; line-height: normal; text-transform: uppercase; font-family: var(--ha-font-sans); }
      .ft-num { left: 87.5px; top: 1456px; color: var(--ha-sand); font-weight: var(--ha-t-num-weight); font-size: calc(var(--ha-t-num-size) * 0.944); letter-spacing: var(--ha-t-num-track); }
      .ft-nombre { left: 284px; top: 1424px; color: var(--ha-white); font-weight: var(--ha-t-lot-weight); font-size: calc(var(--ha-t-lot-size) * 0.939); letter-spacing: var(--ha-t-lot-track); }
      .ft-sangre { left: 284px; top: 1502px; color: var(--ha-white); font-weight: var(--ha-t-data-weight); font-size: calc(var(--ha-t-data-size) * 1.607); letter-spacing: var(--ha-t-data-track); }
      .sello-grande { width: 236.7px; height: 236.7px; }
      .evento { margin-top: 16px; white-space: nowrap; font-weight: var(--ha-t-lot-weight); letter-spacing: 0.15em; font-size: calc(var(--ha-t-label-size) * 1.5); }
      .evento span { font-weight: var(--ha-t-year-weight); }
      #b-cierre .lote { margin: 12px 0 18px; }
      /* Sello chico arriba a la izquierda, dentro de la zona segura: a la derecha chocaba con las orejas en los primeros planos */
      #sello { position: absolute; left: 60px; top: 270px; width: 176.4px; height: 176.4px; opacity: 0; transform-origin: 49.95% 51.39%; }
      #fin { position: absolute; inset: 0; background: var(--ha-black); opacity: 0; pointer-events: none; }
    </style>
  </head>
  <body>
    <!-- Video ya editado, sin tocar, con las placas encima. Tapa en el frame 0: la barra del footer completa -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="1080" data-height="1920">
      <video id="v-clip" class="clip" src="${clip}" muted playsinline data-start="0" data-duration="${D}" data-media-start="0" data-track-index="0"></video>

      <div id="velo-cierre" class="velo" style="height: 1260px"></div>

      <div id="b-ficha" class="bloque">
        <div class="cajas">${cajas}</div>
      </div>

      <div id="b-cierre" class="bloque sombra">
        <img class="sello-grande" src="${SELLO}" alt="Haras Abril" />
        <div class="evento">Remate <span>2026</span></div>
        ${loteFila}
        <div class="nombre">${nombre}</div>
        <div class="linea"></div>
        <div class="sangre">${sangre}</div>
      </div>

      <div id="ft" >
        <div class="ft-barra"></div>
        <svg class="ft-diag" viewBox="0 0 119 172"><line x1="0" y1="172" x2="119" y2="0" /></svg>
        <div class="ft-txt ft-num">${l.lote}</div>
        <div class="ft-txt ft-nombre">${nombre}</div>
        <div class="ft-txt ft-sangre">${sangre}</div>
      </div>

      <img id="sello" src="${SELLO}" alt="Haras Abril" />
      <div id="fin"></div>

      <audio id="musica" src="assets/musica/${cfg.musica}" data-start="0" data-media-start="${cfg.musicaInicio}" data-duration="${D}" data-track-index="10" data-volume="0.8"
             data-automation='{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0},{"t":0.6,"v":1},{"t":${+(D - 2.5).toFixed(2)},"v":1},{"t":${+(D - 0.1).toFixed(2)},"v":0}]}]}'></audio>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      const anim = gsap.timeline({ paused: true });
      const F = 1 / 30, D = ${D}, TAPA = ${TAPA};

      // Entrada del cierre: palabras con máscara, línea, y el resto con desenfoque, como en las placas horizontales
      const entra = (id, t) => {
        const b = "#b-" + id;
        anim.fromTo("#velo-" + id, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power1.out" }, t);
        anim.fromTo(b + " .pal", { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "expo.out", stagger: 0.12 }, t + 0.15);
        anim.fromTo(b + " .linea", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out" }, t + 0.3);
        anim.fromTo(b + " .sangre", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }, t + 0.5);
        anim.fromTo(b + " .lote", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }, t + 0.7);
      };

      // Barra del footer: la misma entrada que footer-lote, y sale antes del cierre
      anim.fromTo(".ft-barra", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.out" }, 0.1);
      anim.fromTo(".ft-diag line", { attr: { x2: 0, y2: 172 } }, { attr: { x2: 119, y2: 0 }, duration: 0.4, ease: "power2.out" }, 0.3);
      anim.fromTo(".ft-num", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }, 0.35);
      anim.fromTo(".ft-nombre .pal", { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "expo.out", stagger: 0.12 }, 0.45);
      anim.fromTo(".ft-sangre", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }, 0.75);
      anim.to("#ft", { opacity: 0, duration: 0.3, ease: "power1.in" }, ${c0} - 0.3);

      // Ficha: entra y sale sobre la barra
      anim.fromTo("#b-ficha .caja", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.12 }, ${f0});
      anim.to("#b-ficha", { opacity: 0, duration: 0.35, ease: "power1.in" }, ${f1} - 0.35);

      anim.fromTo("#sello", { opacity: 0, scale: 0.04 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }, 0.2);
      anim.to("#sello", { opacity: 0, duration: 0.3, ease: "power1.in" }, ${c0} - 0.3);
      anim.fromTo("#b-cierre .sello-grande", { opacity: 0, scale: 0.04 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }, ${c0} + 0.05);
      anim.fromTo("#b-cierre .evento", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }, ${c0} + 0.3);
      entra("cierre", ${c0} + 0.25);
      // Salida a negro; el último tramo queda limpio
      anim.fromTo("#fin", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.in" }, D - 0.9);
      anim.to({}, { duration: 0.001 }, D);

      // Tapa en el frame 0 y la animación corrida un frame (regla de IG)
      tl.add(anim.tweenFromTo(TAPA, TAPA, { duration: F, ease: "none" }), 0);
      tl.add(anim.tweenFromTo(0, D - F, { duration: D - F, ease: "none" }), F);
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
}

for (const l of base.lotes) {
  const v = datosVideo.get(l.lote);
  const cfg = v?.vertical;
  if (!cfg || (pedidos.length && !pedidos.includes(l.lote))) continue;
  const nn = l.lote;
  const pieza = `00-00-HA-VideoLote-9x16-${nn}`;
  const dest = join(root, "composiciones", pieza);
  mkdirSync(dest, { recursive: true });
  for (const f of ["hyperframes.json", "package.json"]) cpSync(join(molde, f), join(dest, f));
  const rutaMeta = join(dest, "meta.json");
  const creado = existsSync(rutaMeta) ? JSON.parse(readFileSync(rutaMeta, "utf8")).createdAt : new Date().toISOString();
  writeFileSync(rutaMeta, JSON.stringify({ id: pieza, name: pieza, createdAt: creado }, null, 2) + "\n");

  // El video del usuario, recodificado solo para los keyframes del render: sin recorte ni cambios de edición
  const src = join(root, "videosreferencias", "lotes", cfg.origen);
  const clip = `assets/clips/lote${nn}-vertical.mp4`;
  const clipAbs = join(root, clip);
  if (!existsSync(clipAbs) || statSync(clipAbs).mtimeMs < statSync(src).mtimeMs) {
    execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", src, "-an", "-vf", "fps=30,format=yuv420p",
      "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-movflags", "+faststart", clipAbs]);
  }
  const D = +(Math.floor(duracion(clipAbs) * 30 + 1e-6) / 30).toFixed(3);
  writeFileSync(join(dest, "index.html"), pagina(l, cfg, D, pieza, clip), "utf8");
  execFileSync(process.execPath, [join(root, "herramientas", "sync-brand.mjs"), `composiciones/${pieza}`, clip, `assets/musica/${cfg.musica}`], { cwd: root, stdio: "pipe" });
  console.log(`✓ ${pieza}  ${l.nombre} · ${D} s`);
}
