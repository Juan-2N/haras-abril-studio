// Versión vertical (9:16, Instagram) de los lotes 01 a 11, opción A aprobada el 09/11/2026: pantalla completa, con el
// caballo entero a lo ancho y lo que falta arriba y abajo completado con la misma imagen desenfocada.
// Parte de los originales en 4K (videosreferencias/VideoLote/NN_*/) y toma los tiempos de la pieza 16:9 del mismo lote.
//
// Encuadre por lote en video-lotes.json → "ig":
//   clips ("slow", "trote", "slow-trote", "salto1", "salto2", "cabeza"): { "ancho": fracción del cuadro, "cx": [[t, centro], ...], "top"?: y }
//     cx son puntos [segundo del original, centro del caballo en fracción del cuadro]; entre puntos, el recorte se mueve en línea recta
//   fotos ("cuerpo", "salto"): { "ancho", "cx": centro, "top": y, "pad"?: fracción del alto que se agrega espejada arriba y abajo }
//
// Uso (desde remate-videos/):
//   node herramientas/armar-video-lote-ig.mjs NN [NN ...] [--forzar]
// Salida: composiciones/00-00-HA-VideoLote-9x16-NN/ · material en assets/clips/loteNN-ig-*.mp4 y assets/fotos/loteNN-ig-*.jpg

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(readFileSync(join(root, "herramientas", "lotes.json"), "utf8"));
const video = JSON.parse(readFileSync(join(root, "herramientas", "video-lotes.json"), "utf8"));
const molde = join(root, "composiciones", "00-00-HA-VideoLoteD-16x9-01");
const args = process.argv.slice(2);
const forzar = args.includes("--forzar");
const pedidos = args.filter((a) => !a.startsWith("--")).map((n) => n.padStart(2, "0"));
if (!pedidos.length) { console.error("Indicá al menos un lote"); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), "ha-ig-"));
const FEATHER = 90;

const buscar = (dir, re) => { const f = dir && existsSync(dir) ? readdirSync(dir).find((x) => re.test(x) && /\.(mp4|mov|jpe?g)$/i.test(x)) : null; return f ? join(dir, f) : null; };
const carpeta = (raiz, nn) => { const d = readdirSync(raiz).find((x) => x.startsWith(`${nn}_`) && !/vert/i.test(x)); return d ? join(raiz, d) : null; };
const probe = (f) => execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", f]).toString().trim().split(",").map(Number);
const par = (n) => 2 * Math.round(n / 2);

function mascara(H) {
  const f = join(tmp, `m${H}.png`);
  if (!existsSync(f)) execFileSync("magick", ["-size", `1080x${H}`, "xc:white",
    "(", "-size", `1080x${FEATHER}`, "gradient:black-white", ")", "-geometry", "+0+0", "-composite",
    "(", "-size", `1080x${FEATHER}`, "gradient:white-black", ")", "-geometry", `+0+${H - FEATHER}`, "-composite", f]);
  return f;
}

// Posición izquierda del recorte en función del tiempo: tramos rectos entre los puntos de "cx"
function exprX(cx, ini, sw, wpx) {
  const izq = (c) => Math.max(0, Math.min(sw - wpx, Math.round((c - wpx / sw / 2) * sw)));
  const p = cx.map(([t, c]) => [+(t - ini).toFixed(3), izq(c)]).sort((a, b) => a[0] - b[0]);
  if (p.length === 1) return String(p[0][1]);
  let e = String(p[p.length - 1][1]);
  for (let i = p.length - 2; i >= 0; i--) {
    const [t0, x0] = p[i], [t1, x1] = p[i + 1];
    e = `if(lte(t\\,${t1})\\,${x0}+(${x1 - x0})*max(t-${t0}\\,0)/${(t1 - t0).toFixed(3)}\\,${e})`;
  }
  return e;
}

function clip(src, dest, cfg, ini, dur, lento = false) {
  const [sw, sh] = probe(src);
  const wpx = par(cfg.ancho * sw);
  const H = par(sh * 1080 / wpx);
  const Y = cfg.top ?? Math.round((1920 - H) / 2);
  const cw = par(sh * 9 / 16);
  const previo = lento ? "setpts=2*PTS," : "";
  const leer = lento ? dur / 2 + 0.05 : dur + 0.1;
  const x = exprX(cfg.cx, lento ? cfg.cx[0][0] : ini, sw, wpx);
  const fc = `[0:v]${previo}split=2[a][b];` +
    `[a]crop=${cw}:${sh}:(iw-${cw})/2:0,scale=270:480,gblur=sigma=12,scale=1080:1920,format=yuv420p[bg];` +
    `[b]crop=w=${wpx}:h=${sh}:x='${x}':y=0,scale=1080:${H}:flags=lanczos,format=rgba[f0];` +
    `[1:v]format=gray,scale=1080:${H}[m];[f0][m]alphamerge[fg];` +
    `[bg][fg]overlay=0:${Y}:shortest=1,fps=30,format=yuv420p[v]`;
  execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-ss", String(ini), "-t", String(leer), "-i", src,
    "-framerate", "30", "-loop", "1", "-i", mascara(H), "-filter_complex", fc, "-map", "[v]", "-an", "-t", String(dur + 0.1),
    "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-movflags", "+faststart", dest]);
}

function foto(src, dest, cfg) {
  const [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", src + "[0]"]).toString().trim().split(" ").map(Number);
  const wpx = Math.round(cfg.ancho * w);
  const x = Math.max(0, Math.min(w - wpx, Math.round((cfg.cx - cfg.ancho / 2) * w)));
  const p = Math.round((cfg.pad || 0) * h);
  const s = 2160 / wpx; // la foto compuesta va al doble de resolución, para el zoom lento
  const H = Math.round((h + 2 * p) * s), Y = Math.round(2 * cfg.top - p * s);
  const fg = join(tmp, "fg.png"), m = join(tmp, "fm.png"), bg = join(tmp, "bg.png");
  const espejos = p ? ["(", "-clone", "0", "-gravity", "north", "-crop", `${wpx}x${p}+0+0`, "+repage", "-flip", ")", "(", "-clone", "0", "-gravity", "south", "-crop", `${wpx}x${p}+0+0`, "+repage", "-flip", ")", "-swap", "0,1", "-gravity", "northwest", "-append", "+repage"] : [];
  execFileSync("magick", [src + "[0]", "-auto-orient", "-crop", `${wpx}x${h}+${x}+0`, "+repage", ...espejos, "-resize", `2160x${H}!`, fg]);
  execFileSync("magick", ["-size", `2160x${H}`, "xc:white", "(", "-size", `2160x${FEATHER * 2}`, "gradient:black-white", ")", "-geometry", "+0+0", "-composite", "(", "-size", `2160x${FEATHER * 2}`, "gradient:white-black", ")", "-geometry", `+0+${H - FEATHER * 2}`, "-composite", m]);
  const cw = Math.round(h * 9 / 16);
  execFileSync("magick", [src + "[0]", "-auto-orient", "-gravity", "center", "-crop", `${cw}x${h}+0+0`, "+repage", "-resize", "270x480!", "-blur", "0x12", "-resize", "2160x3840!", bg]);
  execFileSync("magick", [bg, "(", fg, m, "-alpha", "off", "-compose", "CopyOpacity", "-composite", ")", "-compose", "Over", "-geometry", `+0+${Y}`, "-composite", "-quality", "90", "-colorspace", "sRGB", dest]);
}

const SELLO = "brand/logos/PNG/HA_Emblema_Dorado_Negativo.png";
const palabras = (t) => String(t).trim().split(/\s+/).map((p) => `<span class="mask"><span class="pal">${p}</span></span>`).join(" ");
const DIAG = `<svg class="diag" viewBox="0 0 37.3 64"><line x1="0" y1="64" x2="37.3" y2="0" /></svg>`;

// Tiempos de la pieza 16:9 del lote
function tiempos(nn) {
  const s = readFileSync(join(root, "composiciones", `00-00-HA-VideoLote-16x9-${nn}`, "index.html"), "utf8");
  const de = (id) => {
    const m = s.match(new RegExp(`id="${id}"[^>]*?data-start="([\\d.]+)"[^>]*?data-duration="([\\d.]+)"(?:[^>]*?data-media-start="([\\d.]+)")?`));
    if (!m) throw new Error(`Lote ${nn}: no encontré #${id} en la pieza 16:9`);
    return { ini: +m[1], dur: +m[2], media: +(m[3] ?? 0) };
  };
  return Object.fromEntries(["v-remate", "v-slow", "v-cabeza", "v-left", "v-right", "v-salto1", "v-salto2", "cierre"].map((id) => [id, de(id)]));
}

function pagina(l, v, pieza, T) {
  const nn = l.lote, c = T.cierre.ini, D = 41.55;
  const NOMBRE = palabras(l.nombre);
  const sexo = l.sexo.toLowerCase().startsWith("h") ? "Hembra" : "Macho";
  const datosBody = `${sexo} · ${l.nac}`;
  const largo = l.pedigri.length;
  const COLS = [{ n: 2, desde: 0 }, { n: 4, desde: 2 }, { n: 8, desde: 6 }];
  const destacados = new Set([0, 4, 12]);
  const GAP = 4, X0 = 60, ANCHO = (960 - 2 * GAP) / 3, TOP = 470, ALTO = 900;
  const celdas = COLS.map((col, ci) => {
    const h = (ALTO - (col.n - 1) * GAP) / col.n;
    return Array.from({ length: col.n }, (_, i) => {
      const k = col.desde + i;
      return `<div class="celda ${destacados.has(k) ? "dest" : ""}" style="left:${X0 + ci * (ANCHO + GAP)}px;top:${TOP + i * (h + GAP)}px;width:${ANCHO}px;height:${h}px">${v.arbol[k]}</div>`;
    }).join("");
  }).join("");
  const vid = (id, clave, t) => `<video id="${id}" class="clip vid" src="assets/clips/${clave}.mp4" muted playsinline data-start="${t.ini}" data-duration="${t.dur}" data-media-start="0" data-track-index="0"></video>`;
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
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: var(--ha-black); font-family: var(--ha-font-sans); color: var(--ha-white); }
      .vid, .capa { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
      .vid { object-fit: cover; }
      .abs { position: absolute; }
      .pleno { inset: 0; background: var(--ha-veil-dark); }
      .velo { left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--ha-black) 62%, transparent) 42%, color-mix(in srgb, var(--ha-black) 78%, transparent) 100%); }
      .foto canvas { position: absolute; left: 0; top: 0; }
      .foto img.fuente { position: absolute; width: 1080px; height: 1920px; visibility: hidden; }
      .col { position: absolute; left: 0; width: 1080px; display: flex; flex-direction: column; align-items: center; text-transform: uppercase; }
      .nombre { white-space: nowrap; line-height: 1.05; font-weight: var(--ha-t-lot-weight); letter-spacing: var(--ha-t-lot-track); font-size: calc(var(--ha-t-lot-size) * 1.333); text-shadow: 0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent), 0 0 16px color-mix(in srgb, var(--ha-black) 60%, transparent); }
      .mask { display: inline-block; overflow: hidden; vertical-align: top; }
      .pal { display: inline-block; }
      .linea { width: 620px; height: 6px; margin: 18px 0; background: var(--ha-gold); transform-origin: 0% 50%; clip-path: polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%); }
      .sangre { white-space: nowrap; line-height: 1.25; font-weight: var(--ha-t-data-weight); letter-spacing: var(--ha-t-data-track); font-size: calc(var(--ha-t-data-size) * 1.45); text-shadow: 0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent), 0 0 12px color-mix(in srgb, var(--ha-black) 55%, transparent); }
      .lote { display: flex; align-items: center; gap: 16px; margin-top: 16px; color: var(--ha-sand); font-weight: var(--ha-t-num-weight); letter-spacing: var(--ha-t-label-track); font-size: calc(var(--ha-t-label-size) * 1.247); text-transform: uppercase; }
      .diag { width: 37.3px; height: 64px; overflow: visible; }
      .diag line { stroke: currentColor; stroke-width: var(--ha-border); }
      .fila-sup { position: absolute; left: 0; top: 270px; width: 1080px; display: flex; align-items: center; justify-content: center; gap: 16px; color: var(--ha-taupe); font-weight: var(--ha-t-num-weight); letter-spacing: var(--ha-t-label-track); font-size: calc(var(--ha-t-label-size) * 1.247); text-transform: uppercase; }
      .evento { white-space: nowrap; font-weight: var(--ha-t-event-weight); letter-spacing: 0.15em; font-size: calc(var(--ha-t-event-size) * 0.9); line-height: 1.05; }
      .anio { white-space: nowrap; font-weight: var(--ha-t-year-weight); letter-spacing: 0.173em; font-size: calc(var(--ha-t-year-size) * 0.9); line-height: 1.1; }
      .fecha { display: flex; align-items: center; gap: 30px; margin-top: 18px; color: var(--ha-sand); white-space: nowrap; font-weight: var(--ha-t-meta-weight); letter-spacing: 0.27em; font-size: calc(var(--ha-t-label-size) * 1.05); }
      .fecha i { width: 79px; height: var(--ha-border); background: var(--ha-gold); }
      #esc-pedigri { background: var(--ha-ink); }
      .celda { position: absolute; display: flex; align-items: center; padding-left: 16px; white-space: nowrap; overflow: hidden; text-transform: uppercase; color: var(--ha-sand); background: var(--ha-panel-dark); border: var(--ha-border) solid var(--ha-line-gold); font-weight: var(--ha-t-data-weight); font-size: calc(var(--ha-t-data-size) * 1.15); }
      .celda.dest { color: var(--ha-white); font-weight: var(--ha-t-lot-weight); letter-spacing: 0.045em; }
      .cajas { position: absolute; left: 60px; top: 1324px; display: grid; grid-template-columns: repeat(4, 229.5px); gap: 14px; }
      .caja { height: 64px; display: flex; align-items: center; justify-content: center; white-space: nowrap; text-transform: uppercase; background: var(--ha-panel-dark); border: var(--ha-border) solid var(--ha-line-gold); font-weight: var(--ha-t-data-weight); letter-spacing: var(--ha-t-data-track); font-size: calc(var(--ha-t-data-size) * 1.3); }
      .ft-barra { position: absolute; left: 60px; top: 1408px; width: 960px; height: 172px; background: var(--ha-panel-dark); border: var(--ha-border) solid var(--ha-line-gold); }
      .ft-diag { position: absolute; left: 142px; top: 1408px; width: 119px; height: 172px; overflow: visible; }
      .ft-diag line { stroke: var(--ha-gold); stroke-width: var(--ha-border); }
      .ft-txt { position: absolute; white-space: nowrap; line-height: normal; text-transform: uppercase; }
      .ft-num { left: 87.5px; top: 1456px; color: var(--ha-sand); font-weight: var(--ha-t-num-weight); font-size: calc(var(--ha-t-num-size) * 0.944); letter-spacing: var(--ha-t-num-track); }
      .ft-nombre { left: 284px; top: 1424px; font-weight: var(--ha-t-lot-weight); font-size: calc(var(--ha-t-lot-size) * 0.939); letter-spacing: var(--ha-t-lot-track); }
      .ft-sangre { left: 284px; top: ${largo > 33 ? 1510 : 1502}px; font-weight: var(--ha-t-data-weight); font-size: calc(var(--ha-t-data-size) * ${(1.607 * Math.min(1, 33 / largo)).toFixed(3)}); letter-spacing: var(--ha-t-data-track); }
      /* En Body la segunda línea de la barra lleva sexo y nacimiento en lugar de la sangre */
      .ft-datos { left: 284px; top: ${largo > 33 ? 1510 : 1502}px; font-weight: var(--ha-t-data-weight); font-size: calc(var(--ha-t-data-size) * ${(1.607 * Math.min(1, 33 / largo)).toFixed(3)}); letter-spacing: var(--ha-t-data-track); }
      .ft-sangre, .ft-datos { opacity: 0; }
      #sello-ch { position: absolute; left: 60px; top: 270px; width: 176.4px; height: 176.4px; }
      #sello-ch img { width: 176.4px; height: 176.4px; transform-origin: 49.95% 51.39%; }
      #esc-cierre { opacity: 0; z-index: 8; }
      #ft { z-index: 5; opacity: 0; }
      #fin { position: absolute; inset: 0; background: var(--ha-black); opacity: 0; pointer-events: none; z-index: 9; }
    </style>
  </head>
  <body>
    <!-- Tapa en el frame 0: el cierre completo. Escenas con los mismos tiempos que la pieza 16:9 -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="1080" data-height="1920">
      ${vid("v-remate", "ig-dron-remate", T["v-remate"])}
      ${vid("v-slow", `lote${nn}-ig-slow`, T["v-slow"])}
      ${vid("v-cabeza", `lote${nn}-ig-cabeza`, T["v-cabeza"])}
      ${vid("v-left", `lote${nn}-ig-trote`, T["v-left"])}
      ${vid("v-right", `lote${nn}-ig-slow-trote`, T["v-right"])}
      ${vid("v-salto1", `lote${nn}-ig-salto1`, T["v-salto1"])}
      ${vid("v-salto2", `lote${nn}-ig-salto2`, T["v-salto2"])}

      <div id="esc-remate" class="clip capa" data-start="0" data-duration="4" data-track-index="1">
        <div class="abs pleno"></div>
        <img id="r-sello" class="abs" src="${SELLO}" style="left:353px;top:470px;width:374px;height:374px" alt="" />
        <div class="col" style="top:850px"><div class="evento r-t">Remate</div><div class="anio r-t">2026</div><div class="fecha r-t"><i></i><span>28 de noviembre</span><i></i></div></div>
      </div>

      <div id="esc-pedigri" class="clip capa" data-start="11.5" data-duration="4.5" data-track-index="1">${celdas}</div>

      <div id="esc-body" class="clip capa foto" data-start="16" data-duration="4.5" data-track-index="1">
        <img class="fuente" src="assets/fotos/lote${nn}-ig-cuerpo.jpg" alt="" />
      </div>

      <div id="ft" class="capa" style="pointer-events:none">
        <div class="ft-barra"></div>
        <svg class="ft-diag" viewBox="0 0 119 172"><line x1="0" y1="172" x2="119" y2="0" /></svg>
        <div class="ft-txt ft-num">${nn}</div>
        <div class="ft-txt ft-nombre">${NOMBRE}</div>
        <div class="ft-txt ft-sangre">${l.pedigri}</div>
        <div class="ft-txt ft-datos">${datosBody}</div>
      </div>

      <div id="sello-ch" class="clip" data-start="4" data-duration="${+(c - 4).toFixed(3)}" data-track-index="4"><img src="${SELLO}" alt="" /></div>

      <div id="esc-cierre" class="capa foto">
        <img class="fuente" src="assets/fotos/lote${nn}-ig-salto.jpg" alt="" />
        <div class="abs velo" style="height:760px;z-index:1"></div>
        <div class="fila-sup" style="z-index:2"><span>Remate 2026</span>${DIAG}<span>Lote ${nn}</span></div>
        <img id="c-sello" class="abs" src="${SELLO}" style="left:421.65px;top:350px;width:236.7px;height:236.7px;z-index:2" alt="" />
        <div class="col" style="top:1330px;z-index:2"><div class="nombre">${NOMBRE}</div><div class="linea"></div><div class="sangre">${l.pedigri}</div></div>
      </div>

      <div id="fin"></div>
      <audio id="musica" src="assets/musica/battleborn-symphony.mp3" data-start="0" data-duration="${D}" data-track-index="10" data-volume="0.8"
             data-automation='{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0},{"t":0.6,"v":1},{"t":38.55,"v":1},{"t":41.45,"v":0}]}]}'></audio>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      const anim = gsap.timeline({ paused: true });
      const F = 1 / 30, D = ${D}, C = ${c}, TAPA = C + 2.2;

      // Zoom lento en canvas con coordenadas decimales, como en las placas horizontales
      const zoom = (sel, origen) => {
        const caja = document.querySelector(sel), img = caja.querySelector("img.fuente");
        const cv = document.createElement("canvas");
        cv.width = 1080; cv.height = 1920;
        caja.insertBefore(cv, caja.firstChild);
        const ctx = cv.getContext("2d");
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
        const ox = 1080 * origen[0], oy = 1920 * origen[1], estado = { s: 1 };
        const dibujar = () => { if (img.complete && img.naturalWidth) ctx.drawImage(img, ox - ox * estado.s, oy - oy * estado.s, 1080 * estado.s, 1920 * estado.s); };
        if (!img.complete) img.addEventListener("load", dibujar);
        return { estado, dibujar };
      };
      const entra = (sel, t) => {
        anim.fromTo(sel + " .pal", { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "expo.out", stagger: 0.12 }, t + 0.15);
        anim.fromTo(sel + " .linea", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out" }, t + 0.3);
        anim.fromTo(sel + " .sangre", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }, t + 0.5);
      };
      const crece = (sel, t) => anim.fromTo(sel, { opacity: 0, scale: 0.04 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }, t);
      const barra = (t, linea) => {
        const v = { immediateRender: false };
        anim.fromTo(".ft-barra", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.out", ...v }, t + 0.1);
        anim.fromTo(".ft-diag line", { attr: { x2: 0, y2: 172 } }, { attr: { x2: 119, y2: 0 }, duration: 0.4, ease: "power2.out", ...v }, t + 0.3);
        anim.fromTo(".ft-num", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out", ...v }, t + 0.35);
        anim.fromTo(".ft-nombre .pal", { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "expo.out", stagger: 0.12, ...v }, t + 0.45);
        anim.fromTo(linea, { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out", ...v }, t + 0.75);
      };
      // Deja la barra vacía mientras está oculta: si no, al volver se ve un instante completa y salta a vacía
      const vaciarBarra = (t) => {
        anim.set(".ft-barra", { clipPath: "inset(0% 100% 0% 0%)" }, t);
        anim.set(".ft-diag line", { attr: { x2: 0, y2: 172 } }, t);
        anim.set(".ft-num", { opacity: 0 }, t);
        anim.set(".ft-nombre .pal", { yPercent: 110 }, t);
        anim.set([".ft-sangre", ".ft-datos"], { opacity: 0 }, t);
      };

      // La línea de tiempo se registra de entrada: si se espera a las fotos, el reproductor no la encuentra
      {
        const zb = zoom("#esc-body", [0.5, 0.45]), zc = zoom("#esc-cierre", [0.5, 0.45]);
        zb.dibujar(); zc.dibujar();

        // Remate
        crece("#r-sello", 0.15);
        anim.fromTo(".r-t", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.15 }, 0.5);

        // Sello chico desde el Slow. Barra: del Slow al final del clip de cabeza, en Body (con sexo y nacimiento) y en los trotes
        anim.fromTo("#sello-ch img", { opacity: 0, scale: 0.04 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }, 4.1);
        const TROTES = ${T["v-left"].ini};
        anim.set("#ft", { autoAlpha: 0 }, 0.01);
        vaciarBarra(0.01);
        anim.set("#ft", { autoAlpha: 1 }, 4);
        barra(4, ".ft-sangre");
        anim.set("#ft", { autoAlpha: 0 }, 11.5);
        vaciarBarra(11.5);
        anim.set("#ft", { autoAlpha: 1 }, 16);
        barra(16, ".ft-datos");
        // De Body a los trotes la barra sigue quieta: solo cambia la segunda línea
        anim.to(".ft-datos", { opacity: 0, duration: 0.15, ease: "power1.in", immediateRender: false }, TROTES - 0.15);
        anim.fromTo(".ft-sangre", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "power2.out", immediateRender: false }, TROTES);
        anim.set("#ft", { autoAlpha: 0 }, ${T["v-salto1"].ini});

        // Pedigrí: las celdas entran por columnas
        anim.fromTo("#esc-pedigri .celda", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out", stagger: 0.05 }, 11.7);

        // Body
        anim.fromTo(zb.estado, { s: 1 }, { s: 1.05, duration: 4.5, ease: "none", onUpdate: zb.dibujar }, 16);

        // Cierre
        anim.set("#esc-cierre", { opacity: 1 }, C);
        anim.fromTo(zc.estado, { s: 1 }, { s: 1.05, duration: D - C, ease: "none", onUpdate: zc.dibujar }, C);
        crece("#c-sello", C + 0.15);
        anim.fromTo("#esc-cierre .fila-sup", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }, C + 0.3);
        entra("#esc-cierre", C + 0.25);

        anim.fromTo("#fin", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.in" }, D - 1);
        anim.to({}, { duration: 0.001 }, D);

        // Tapa en el frame 0 y la animación corrida un frame (regla de IG)
        tl.add(anim.tweenFromTo(TAPA, TAPA, { duration: F, ease: "none" }), 0);
        tl.add(anim.tweenFromTo(0, D - F, { duration: D - F, ease: "none" }), F);
        window.__timelines["main"] = tl;
        tl.seek(0);
      }
    </script>
  </body>
</html>
`;
}

// Dron común a todos los lotes
const dron = join(root, "assets", "clips", "ig-dron-remate.mp4");
if (forzar || !existsSync(dron)) {
  execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-t", "4.1", "-i", join(root, "assets", "clips", "video-lote-dron-remate.mp4"), "-an",
    "-vf", "crop=608:1080:(iw-608)/2:0,scale=1080:1920:flags=lanczos,fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-movflags", "+faststart", dron]);
}

for (const nn of pedidos) {
  const l = base.lotes.find((x) => x.lote === nn);
  const v = video.lotes.find((x) => x.lote === nn);
  if (!v?.ig) throw new Error(`Lote ${nn}: falta "ig" en video-lotes.json`);
  const T = tiempos(nn);
  const dirV = carpeta(join(root, "videosreferencias", "VideoLote"), nn), dirL = carpeta(join(root, "videosreferencias", "lotes"), nn);

  const CLIPS = [
    ["slow", /salto slow| - slow\./i, "v-slow"], ["trote", /trote 1/i, "v-left"], ["slow-trote", /trote slow/i, "v-right"],
    ["salto1", /salto 1/i, "v-salto1"], ["salto2", /salto 2/i, "v-salto2"],
  ];
  const hechos = [];
  for (const [clave, re, id] of CLIPS) {
    const dest = join(root, "assets", "clips", `lote${nn}-ig-${clave}.mp4`);
    if (!forzar && existsSync(dest)) continue;
    const src = buscar(dirV, re) || buscar(dirL, re);
    if (!src) throw new Error(`Lote ${nn}: no encontré el original de ${clave}`);
    clip(src, dest, v.ig[clave], T[id].media, T[id].dur);
    hechos.push(clave);
  }
  const destCab = join(root, "assets", "clips", `lote${nn}-ig-cabeza.mp4`);
  if (forzar || !existsSync(destCab)) {
    const src = buscar(dirL, /cabeza/i) || buscar(dirV, /cabeza/i);
    if (!src) throw new Error(`Lote ${nn}: no encontré el clip de cabeza`);
    clip(src, destCab, v.ig.cabeza, 0, T["v-cabeza"].dur, true);
    hechos.push("cabeza");
  }
  const fotoCuerpo = join(root, "assets", "fotos", `lote${nn}-ig-cuerpo.jpg`), fotoSalto = join(root, "assets", "fotos", `lote${nn}-ig-salto.jpg`);
  if (forzar || !existsSync(fotoCuerpo)) { foto(join(root, "assets", "fotos", `lote${nn}-cuerpo.jpg`), fotoCuerpo, v.ig.cuerpo); hechos.push("foto cuerpo"); }
  if (forzar || !existsSync(fotoSalto)) { foto(v.ig.salto.origen === "referencia" ? buscar(dirL, /salto/i) : join(root, "assets", "fotos", `lote${nn}-salto.jpg`), fotoSalto, v.ig.salto); hechos.push("foto salto"); }

  const pieza = `00-00-HA-VideoLote-9x16-${nn}`;
  const dest = join(root, "composiciones", pieza);
  mkdirSync(dest, { recursive: true });
  for (const f of ["hyperframes.json", "package.json"]) cpSync(join(molde, f), join(dest, f));
  const rutaMeta = join(dest, "meta.json");
  const creado = existsSync(rutaMeta) ? JSON.parse(readFileSync(rutaMeta, "utf8")).createdAt : new Date().toISOString();
  writeFileSync(rutaMeta, JSON.stringify({ id: pieza, name: pieza, createdAt: creado }, null, 2) + "\n");
  writeFileSync(join(dest, "index.html"), pagina(l, v, pieza, T), "utf8");
  const material = ["assets/clips/ig-dron-remate.mp4", ...["slow", "cabeza", "trote", "slow-trote", "salto1", "salto2"].map((c) => `assets/clips/lote${nn}-ig-${c}.mp4`),
    `assets/fotos/lote${nn}-ig-cuerpo.jpg`, `assets/fotos/lote${nn}-ig-salto.jpg`, "assets/musica/battleborn-symphony.mp3"];
  execFileSync(process.execPath, [join(root, "herramientas", "sync-brand.mjs"), `composiciones/${pieza}`, ...material], { cwd: root, stdio: "pipe" });
  console.log(`✓ ${pieza}  ${l.nombre}${hechos.length ? " · convertido: " + hechos.join(", ") : ""}`);
}
