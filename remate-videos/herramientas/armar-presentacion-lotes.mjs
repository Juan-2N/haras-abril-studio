// Video de presentación de los 13 lotes: la intro del Remate, del lote 01 al 13 el clip de cabeza con nombre, sangre y
// lote (corte seco) y una placa final (logo, REMATE 2026, frase de cierre, pre-ofertas y remate en vivo).
// Dos versiones: 16x9 (YouTube) y 9x16 (Instagram, con tapa en el frame 0: la placa final completa).
// Los datos y los clips salen de lotes.json y de las piezas por lote ya armadas: no se tipea nada.
//
// Uso (desde remate-videos/):
//   node herramientas/armar-presentacion-lotes.mjs [16x9] [9x16]      (sin argumentos, las dos)
// Salida: composiciones/00-00-HA-PresentacionLotes-<formato>/

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(readFileSync(join(root, "herramientas", "lotes.json"), "utf8"));
const molde = join(root, "composiciones", "00-00-HA-VideoLote-16x9-01");
const formatos = process.argv.slice(2).length ? process.argv.slice(2) : ["16x9", "9x16"];
const INTRO = 4, POR_LOTE = 2.5, CIERRE = 5;
const lotes = base.lotes.map((l) => l.lote).sort();
const C = +(INTRO + lotes.length * POR_LOTE).toFixed(2);
const D = +(C + CIERRE).toFixed(2);
const atributo = (obj) => JSON.stringify(obj).replace(/'/g, "&#39;");
const SELLO = "brand/logos/PNG/HA_Emblema_Dorado_Negativo.png";
const tmp = mkdtempSync(join(tmpdir(), "ha-pres-"));
const ffmpeg = (a) => execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", ...a]);
const X264 = ["-c:v", "libx264", "-crf", "18", "-preset", "medium", "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-movflags", "+faststart"];

// Placa final: texto fijo de la marca (DESIGN.md §7) y fechas del Remate
const CIERRE_HTML = `
        <img class="c-sello" src="${SELLO}" alt="Haras Abril" />
        <div class="c-evento">Remate <span>2026</span></div>
        <div class="c-claim">Tu próxima estrella<br class="corte" /> cada vez más cerca.</div>
        <div class="c-linea"></div>
        <div class="c-dato"><b>Pre-ofertas</b><span>desde el 23 de noviembre · remateharasabril.com</span></div>
        <div class="c-dato"><b>Remate en vivo</b><span>sábado 28 de noviembre · Lezama</span></div>`;

function pieza(formato) {
  const vertical = formato === "9x16";
  const W = vertical ? 1080 : 1920, H = vertical ? 1920 : 1080;
  const nombre = `00-00-HA-PresentacionLotes-${formato}`;
  const dest = join(root, "composiciones", nombre);
  mkdirSync(join(dest, "compositions"), { recursive: true });
  for (const f of ["hyperframes.json", "package.json"]) cpSync(join(molde, f), join(dest, f));
  const rutaMeta = join(dest, "meta.json");
  const creado = existsSync(rutaMeta) ? JSON.parse(readFileSync(rutaMeta, "utf8")).createdAt : new Date().toISOString();
  writeFileSync(rutaMeta, JSON.stringify({ id: nombre, name: nombre, createdAt: creado }, null, 2) + "\n");

  const usados = ["assets/musica/battleborn-symphony.mp3"];
  const dronCierre = vertical ? "assets/clips/ig-dron-pedigri.mp4" : "assets/clips/video-lote-dron-pedigri.mp4";
  const dronRemate = vertical ? "assets/clips/ig-dron-remate.mp4" : "assets/clips/video-lote-dron-remate.mp4";
  if (vertical && !existsSync(join(root, dronCierre))) {
    ffmpeg(["-i", join(root, "assets", "clips", "video-lote-dron-pedigri.mp4"), "-an", "-vf", "crop=608:1080:(iw-608)/2:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p", ...X264, join(root, dronCierre)]);
  }
  usados.push(dronRemate, dronCierre);

  const escenas = [];
  for (const [i, nn] of lotes.entries()) {
    const l = base.lotes.find((x) => x.lote === nn);
    const t = +(INTRO + i * POR_LOTE).toFixed(2);
    if (!vertical) {
      // La placa de cabeza de cada lote (16:9), con su propio id: una sub-composición por lote
      let h = readFileSync(join(root, "composiciones", `00-00-HA-VideoLote-16x9-${nn}`, "compositions", "placa-intro.html"), "utf8");
      if (!h.includes(".pi-foto { display: none; }")) throw new Error(`Lote ${nn}: la placa de cabeza no está armada para clip`);
      h = h.split("placa-intro").join(`placa-intro-${nn}`);
      for (const m of h.matchAll(/\.\.\/(assets\/[^"')]+)/g)) usados.push(m[1]);
      writeFileSync(join(dest, "compositions", `placa-intro-${nn}.html`), h, "utf8");
      const clip = `assets/clips/lote${nn}-cabeza.mp4`;
      usados.push(clip);
      escenas.push(`      <video id="v-cabeza-${nn}" class="clip vid" src="${clip}" muted playsinline data-start="${t}" data-duration="${POR_LOTE}" data-media-start="0" data-track-index="0"></video>
      <div id="intro-${nn}" class="placa" data-composition-id="placa-intro-${nn}" data-composition-src="compositions/placa-intro-${nn}.html"
           data-start="${t}" data-duration="${POR_LOTE}" data-track-index="1" data-width="1920" data-height="1080"
           data-variable-values='${atributo({ lote: nn, nombre: l.nombre, sangre: l.pedigri })}'></div>`);
    } else {
      // Clip de cabeza vertical: el de la versión IG del lote; los potrillos no tienen, se arma acá con el mismo encuadre
      const clip = `assets/clips/lote${nn}-ig-cabeza.mp4`;
      if (!existsSync(join(root, clip))) cabezaVertical(nn, join(root, clip));
      usados.push(clip);
      const largo = l.pedigri.length, tam = (1.45 * Math.min(1, 44 / largo)).toFixed(3);
      const pal = l.nombre.split(/\s+/).map((p) => `<span class="mask"><span class="pal">${p}</span></span>`).join(" ");
      escenas.push(`      <video id="v-cabeza-${nn}" class="clip vid" src="${clip}" muted playsinline data-start="${t}" data-duration="${POR_LOTE}" data-media-start="0" data-track-index="0"></video>
      <div id="esc-${nn}" class="clip capa cabeza" data-start="${t}" data-duration="${POR_LOTE}" data-track-index="1">
        <div class="velo" style="height:640px"></div>
        <div class="col" style="top:1290px"><div class="nombre">${pal}</div><div class="linea"></div><div class="sangre" style="font-size:calc(var(--ha-t-data-size) * ${tam})">${l.pedigri}</div><div class="lote"><span>Lote</span><svg class="diag" viewBox="0 0 37.3 64"><line x1="0" y1="64" x2="37.3" y2="0" /></svg><span>${nn}</span></div></div>
      </div>`);
    }
  }

  // Intro del Remate: la sub-composición de los videos en 16:9; en 9:16, la misma placa armada en la página
  const remate = vertical
    ? `      <video id="v-remate" class="clip vid" src="${dronRemate}" muted playsinline data-start="0" data-duration="${INTRO}" data-media-start="0" data-track-index="0"></video>
      <div id="esc-remate" class="clip capa" data-start="0" data-duration="${INTRO}" data-track-index="1">
        <div class="pleno"></div>
        <img id="r-sello" class="abs" src="${SELLO}" style="left:353px;top:470px;width:374px;height:374px" alt="" />
        <div class="col" style="top:850px"><div class="evento r-t">Remate</div><div class="anio r-t">2026</div><div class="fecha r-t"><i></i><span>28 de noviembre</span><i></i></div></div>
      </div>`
    : `      <video id="v-remate" class="clip vid" src="${dronRemate}" muted playsinline data-start="0" data-duration="${INTRO}" data-media-start="0" data-track-index="0"></video>
      <div id="velo-remate" class="clip pleno" data-start="0" data-duration="${INTRO}" data-track-index="0"></div>
      <div id="remate" class="placa" data-composition-id="placa-remate" data-composition-src="compositions/placa-remate.html"
           data-start="0" data-duration="${INTRO}" data-track-index="1" data-width="1920" data-height="1080"
           data-variable-values='{"evento":"Remate","anio":"2026","fecha_texto":"28 de noviembre"}'></div>`;
  if (!vertical) cpSync(join(molde, "compositions", "placa-remate.html"), join(dest, "compositions", "placa-remate.html"));

  // Escala de la placa final: en 9:16 el ancho manda (todo dentro de la zona segura, y = 270 a 1580)
  const k = 1;
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${nombre}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <link rel="stylesheet" href="brand/tokens.css" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; overflow: hidden; background: var(--ha-black); }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--ha-black); font-family: var(--ha-font-sans); color: var(--ha-white); }
      .placa, .capa, .vid { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
      .vid { object-fit: cover; }
      .abs { position: absolute; }
      .pleno { position: absolute; inset: 0; background: var(--ha-veil-dark); }
      .velo { position: absolute; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--ha-black) 62%, transparent) 42%, color-mix(in srgb, var(--ha-black) 78%, transparent) 100%); }
      .col { position: absolute; left: 0; width: ${W}px; display: flex; flex-direction: column; align-items: center; text-transform: uppercase; }
      .nombre { white-space: nowrap; line-height: 1.05; font-weight: var(--ha-t-lot-weight); letter-spacing: var(--ha-t-lot-track); font-size: calc(var(--ha-t-lot-size) * 1.333); text-shadow: 0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent), 0 0 16px color-mix(in srgb, var(--ha-black) 60%, transparent); }
      .mask { display: inline-block; overflow: hidden; vertical-align: top; }
      .pal { display: inline-block; }
      .linea { width: 620px; height: 6px; margin: 18px 0; background: var(--ha-gold); transform-origin: 0% 50%; clip-path: polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%); }
      .sangre { white-space: nowrap; line-height: 1.25; font-weight: var(--ha-t-data-weight); letter-spacing: var(--ha-t-data-track); text-shadow: 0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent), 0 0 12px color-mix(in srgb, var(--ha-black) 55%, transparent); }
      .lote { display: flex; align-items: center; gap: 16px; margin-top: 16px; color: var(--ha-sand); font-weight: var(--ha-t-num-weight); letter-spacing: var(--ha-t-label-track); font-size: calc(var(--ha-t-label-size) * 1.247); }
      .diag { width: 37.3px; height: 64px; overflow: visible; }
      .diag line { stroke: currentColor; stroke-width: var(--ha-border); }
      .evento { white-space: nowrap; font-weight: var(--ha-t-event-weight); letter-spacing: 0.15em; font-size: calc(var(--ha-t-event-size) * 0.9); line-height: 1.05; }
      .anio { white-space: nowrap; font-weight: var(--ha-t-year-weight); letter-spacing: 0.173em; font-size: calc(var(--ha-t-year-size) * 0.9); line-height: 1.1; }
      .fecha { display: flex; align-items: center; gap: 30px; margin-top: 18px; color: var(--ha-sand); white-space: nowrap; font-weight: var(--ha-t-meta-weight); letter-spacing: 0.27em; font-size: calc(var(--ha-t-label-size) * 1.05); }
      .fecha i { width: 79px; height: var(--ha-border); background: var(--ha-gold); }
      #sello-ch { position: absolute; left: 60px; top: 270px; width: 176.4px; height: 176.4px; z-index: 3; }
      #sello-ch img { width: 176.4px; height: 176.4px; transform-origin: 49.95% 51.39%; }
      /* Placa final */
      #cierre .velo-c { position: absolute; inset: 0; background: color-mix(in srgb, var(--ha-black) 58%, transparent); }
      #cierre .bloque { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
      .c-sello { width: ${Math.round(300 * k)}px; height: ${Math.round(300 * k)}px; transform-origin: 49.95% 51.39%; }
      .c-evento { margin-top: ${Math.round(26 * k)}px; white-space: nowrap; text-transform: uppercase; font-weight: var(--ha-t-event-weight); letter-spacing: 0.15em; font-size: calc(var(--ha-t-event-size) * ${(0.78 * k).toFixed(3)}); line-height: 1.05; }
      .corte { display: ${vertical ? "inline" : "none"}; }
      .c-evento span { font-weight: var(--ha-t-year-weight); }
      .c-claim { margin-top: ${Math.round(22 * k)}px; color: var(--ha-sand); font-family: var(--ha-font-serif); font-style: italic; font-weight: var(--ha-t-claim-weight); font-size: calc(var(--ha-t-claim-size) * ${(1.35 * k).toFixed(3)}); ${vertical ? "max-width: 900px;" : "white-space: nowrap;"} line-height: 1.2; }
      .c-linea { width: ${Math.round(560 * k)}px; height: 6px; margin: ${Math.round(30 * k)}px 0 ${Math.round(26 * k)}px; background: var(--ha-gold); transform-origin: 0% 50%; clip-path: polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%); }
      .c-dato { margin-top: 10px; white-space: nowrap; text-transform: uppercase; font-weight: var(--ha-t-data-weight); letter-spacing: var(--ha-t-data-track); font-size: calc(var(--ha-t-data-size) * ${(vertical ? 1.35 : 1.45).toFixed(3)}); ${vertical ? "display: flex; flex-direction: column; align-items: center; gap: 2px; margin-top: 18px;" : ""} }
      .c-dato b { color: var(--ha-sand); font-weight: var(--ha-t-lot-weight); margin-right: 0.35em; }
      #fin { position: absolute; inset: 0; background: var(--ha-black); opacity: 0; pointer-events: none; z-index: 9; }
    </style>
  </head>
  <body>
    <!-- Presentación de los lotes: REMATE 0 → ${INTRO}, un lote cada ${POR_LOTE} s con corte seco y placa final ${C} → ${D}. Generado por armar-presentacion-lotes.mjs -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
${remate}

${escenas.join("\n\n")}
${vertical ? `\n      <div id="sello-ch" class="clip" data-start="${INTRO}" data-duration="${+(C - INTRO).toFixed(2)}" data-track-index="4"><img src="${SELLO}" alt="" /></div>\n` : ""}
      <video id="v-cierre" class="clip vid" src="${dronCierre}" muted playsinline data-start="${C}" data-duration="${CIERRE}" data-media-start="0" data-track-index="0"></video>
      ${vertical ? `<div id="cierre" class="capa" style="opacity:0;z-index:5">` : `<div id="cierre" class="clip capa" data-start="${C}" data-duration="${CIERRE}" data-track-index="1">`}
        <div class="velo-c"></div>
        <div class="bloque">${CIERRE_HTML}
        </div>
      </div>

      <div id="fin"></div>
      <audio id="musica" src="assets/musica/battleborn-symphony.mp3" data-start="0" data-duration="${D}" data-track-index="10" data-volume="0.8"
             data-automation='{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0},{"t":0.6,"v":1},{"t":${+(D - 2.5).toFixed(2)},"v":1},{"t":${+(D - 0.1).toFixed(2)},"v":0}]}]}'></audio>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      const anim = gsap.timeline({ paused: true });
      const F = 1 / 30, D = ${D}, C = ${C};
      // Cada texto entra una sola vez: los tweens fijan su estado inicial (oculto) al crearse, sin mostrarlo antes
      const v = {};
      const crece = (sel, t) => anim.fromTo(sel, { opacity: 0, scale: 0.04 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out", ...v }, t);
      const desenfoque = (sel, t, d = 0.5) => anim.fromTo(sel, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: d, ease: "power2.out", ...v }, t);
${vertical ? `
      // Remate
      crece("#r-sello", 0.15);
      anim.fromTo(".r-t", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.15, ...v }, 0.5);
      // Placa de cada lote: nombre por palabras, línea, sangre y lote
      anim.fromTo("#sello-ch img", { opacity: 0, scale: 0.04 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out", ...v }, ${INTRO} + 0.1);
      ${JSON.stringify(lotes)}.forEach((nn, i) => {
        const t = ${INTRO} + i * ${POR_LOTE}, s = "#esc-" + nn;
        anim.fromTo(s + " .pal", { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "expo.out", stagger: 0.12, ...v }, t + 0.1);
        anim.fromTo(s + " .linea", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out", ...v }, t + 0.25);
        desenfoque(s + " .sangre", t + 0.45);
        desenfoque(s + " .lote", t + 0.65, 0.45);
      });` : ""}
      // Placa final
${vertical ? `      anim.set("#esc-remate", { autoAlpha: 0 }, C - 0.02);
      anim.set("#cierre", { opacity: 1 }, C);
` : ""}      crece("#cierre .c-sello", C + 0.15);
      desenfoque("#cierre .c-evento", C + 0.45);
      desenfoque("#cierre .c-claim", C + 0.75, 0.6);
      anim.fromTo("#cierre .c-linea", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out", ...v }, C + 1.0);
      anim.fromTo("#cierre .c-dato", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.15, ...v }, C + 1.25);
      anim.fromTo("#fin", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.in", ...v }, D - 0.7);
      anim.to({}, { duration: 0.001 }, D);
${vertical ? `
      // Tapa en el frame 0 (regla de IG): la placa final completa; desde el frame 1, la animación
      const TAPA = C + 2.5;
      tl.add(anim.tweenFromTo(TAPA, TAPA, { duration: F, ease: "none" }), 0);
      tl.add(anim.tweenFromTo(0, D - F, { duration: D - F, ease: "none" }), F);` : `
      tl.add(anim.tweenFromTo(0, D, { duration: D, ease: "none" }), 0);`}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
  writeFileSync(join(dest, "index.html"), html, "utf8");
  execFileSync(process.execPath, [join(root, "herramientas", "sync-brand.mjs"), `composiciones/${nombre}`, ...new Set(usados)], { cwd: root, stdio: "pipe" });
  console.log(`✓ ${nombre} · ${lotes.length} lotes · ${D} s`);
}

// Clip de cabeza vertical para los lotes sin versión IG (los potrillos): mismo encuadre que los otros, desde el original
function cabezaVertical(nn, dest) {
  const dir = readdirSync(join(root, "videosreferencias", "lotes")).find((d) => d.startsWith(`${nn}_`) && !/vert/i.test(d));
  const carpeta = join(root, "videosreferencias", "lotes", dir);
  const src = join(carpeta, readdirSync(carpeta).find((f) => /cabeza/i.test(f) && /\.(mp4|mov)$/i.test(f)));
  const CX = { "12": 0.42, "13": 0.47 }[nn] ?? 0.5;
  const [sw, sh] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", src]).toString().trim().split(",").map(Number);
  const wpx = 2 * Math.round(0.42 * sw / 2), Hf = 2 * Math.round(sh * 1080 / wpx / 2);
  const x = Math.max(0, Math.min(sw - wpx, Math.round((CX - 0.21) * sw)));
  const cw = 2 * Math.round(sh * 9 / 16 / 2);
  const m = join(tmp, `m${Hf}.png`);
  execFileSync("magick", ["-size", `1080x${Hf}`, "xc:white", "(", "-size", "1080x90", "gradient:black-white", ")", "-geometry", "+0+0", "-composite", "(", "-size", "1080x90", "gradient:white-black", ")", "-geometry", `+0+${Hf - 90}`, "-composite", m]);
  const fc = `[0:v]setpts=2*PTS,split=2[a][b];[a]crop=${cw}:${sh}:(iw-${cw})/2:0,scale=270:480,gblur=sigma=12,scale=1080:1920,format=yuv420p[bg];` +
    `[b]crop=${wpx}:${sh}:${x}:0,scale=1080:${Hf}:flags=lanczos,format=rgba[f0];[1:v]format=gray,scale=1080:${Hf}[mm];[f0][mm]alphamerge[fg];[bg][fg]overlay=0:-60:shortest=1,fps=30,format=yuv420p[v]`;
  ffmpeg(["-t", String(POR_LOTE / 2 + 0.1), "-i", src, "-framerate", "30", "-loop", "1", "-i", m, "-filter_complex", fc, "-map", "[v]", "-an", "-t", String(POR_LOTE + 0.1), ...X264, dest]);
}

for (const f of formatos) pieza(f);
