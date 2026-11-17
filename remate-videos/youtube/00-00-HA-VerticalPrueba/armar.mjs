// Prueba de diseño de la versión vertical (9:16) de los lotes 01 a 11: escribe index.html con una placa estática por
// escena y por opción (A: pantalla completa · B: franja con panel), para exportar con herramientas/exportar-slides.mjs.
// Solo imágenes: acá no se arma ningún video.
//
// Uso (desde remate-videos/):
//   node youtube/00-00-HA-VerticalPrueba/armar.mjs [NN]
//   node herramientas/exportar-slides.mjs youtube/00-00-HA-VerticalPrueba/index.html <carpeta>

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const root = resolve(aqui, "..", "..");
const nn = (process.argv[2] || "03").padStart(2, "0");
const base = JSON.parse(readFileSync(join(root, "herramientas", "lotes.json"), "utf8"));
const video = JSON.parse(readFileSync(join(root, "herramientas", "video-lotes.json"), "utf8"));
const l = base.lotes.find((x) => x.lote === nn);
const v = video.lotes.find((x) => x.lote === nn);
const sexo = l.sexo.toLowerCase().startsWith("h") ? "Hembra" : "Macho";
const ficha = [sexo, l.pelo, `AAFE ${l.registro}`, l.nac];

const F = (x) => `fuentes/${x}.jpg`;
const SELLO = "../../brand/logos/PNG/HA_Emblema_Dorado_Negativo.png";
const sello = (x, y, t) => `<img class="abs" src="${SELLO}" style="left:${x}px;top:${y}px;width:${t}px;height:${t}px" alt="" />`;
const selloCentro = (y, t) => sello((1080 - t) / 2, y, t);
const selloChico = () => sello(60, 270, 176.4);

// Barra de footer-lote adaptada a 1080
const barra = (top) => `
  <div class="abs ft-barra" style="top:${top}px"></div>
  <svg class="abs ft-diag" style="top:${top}px" viewBox="0 0 119 172"><line x1="0" y1="172" x2="119" y2="0" /></svg>
  <div class="abs ft-txt ft-num" style="top:${top + 48}px">${l.lote}</div>
  <div class="abs ft-txt ft-nombre" style="top:${top + 16}px">${l.nombre}</div>
  <div class="abs ft-txt ft-sangre" style="top:${top + 94 + (l.pedigri.length > 33 ? 8 : 0)}px;font-size:calc(var(--ha-t-data-size) * ${(1.607 * Math.min(1, 33 / l.pedigri.length)).toFixed(3)})">${l.pedigri}</div>`;

const nombreBloque = (top, extra = "") => `
  <div class="abs col" style="top:${top}px">
    <div class="nombre">${l.nombre}</div>
    <div class="linea"></div>
    <div class="sangre">${l.pedigri}</div>
    ${extra}
  </div>`;
const loteFila = (clase = "lote") => `<div class="${clase}"><span>Lote</span><svg class="diag" viewBox="0 0 37.3 64"><line x1="0" y1="64" x2="37.3" y2="0" /></svg><span>${l.lote}</span></div>`;
const remateLote = (top, oscuro) => `
  <div class="abs fila-sup ${oscuro ? "taupe" : ""}" style="top:${top}px">
    <span>Remate 2026</span><svg class="diag" viewBox="0 0 37.3 64"><line x1="0" y1="64" x2="37.3" y2="0" /></svg><span>Lote ${l.lote}</span>
  </div>`;
const cajas = (top, cols) => `<div class="abs cajas" style="top:${top}px;grid-template-columns:repeat(${cols}, ${cols === 4 ? 229.5 : 473}px)">${ficha.map((d) => `<div class="caja">${d}</div>`).join("")}</div>`;
const remateTexto = (top) => `
  <div class="abs col" style="top:${top}px">
    <div class="evento">Remate</div>
    <div class="anio">2026</div>
    <div class="fecha"><i></i><span>28 de noviembre</span><i></i></div>
  </div>`;

// Árbol: 3 columnas (2, 4 y 8 celdas). Blanco Bold los que forman la sangre, como en la placa horizontal
function arbol(top, alto) {
  const COLS = [{ n: 2, desde: 0 }, { n: 4, desde: 2 }, { n: 8, desde: 6 }];
  const destacados = new Set([0, 4, 12]);
  const GAP = 4, X0 = 60, ANCHO = (960 - 2 * GAP) / 3;
  return COLS.map((c, ci) => {
    const h = (alto - (c.n - 1) * GAP) / c.n;
    return Array.from({ length: c.n }, (_, i) => {
      const k = c.desde + i;
      return `<div class="abs celda ${destacados.has(k) ? "dest" : ""}" style="left:${X0 + ci * (ANCHO + GAP)}px;top:${top + i * (h + GAP)}px;width:${ANCHO}px;height:${h}px">${v.arbol[k]}</div>`;
    }).join("");
  }).join("");
}

// Opción A: el cuadro se amplía hasta que el caballo entra entero a lo ancho (cx y ancho, en fracción del cuadro) y lo que
// falta arriba y abajo lo completa la misma imagen desenfocada
function fondoA(img, sw, sh, cx, ancho, top) {
  const wpx = ancho * sw, s = 1080 / wpx, SW = sw * s, SH = sh * s;
  const X = Math.max(0, Math.min(SW - 1080, (cx - ancho / 2) * SW));
  const y = top ?? (1920 - SH) / 2;
  return `<div class="desen" style="background-image:url(${F(img)})"></div>
  <div class="abs corte" style="top:${y}px;height:${SH}px;background-image:url(${F(img)});background-size:${SW}px ${SH}px;background-position:${-X}px 0"></div>`;
}
const K4 = [3840, 2160], HD = [1920, 1080];
// Encuadre del caballo en cada toma
const A = {
  slow: fondoA("slow", ...K4, 0.545, 0.46),
  trote: fondoA("trote", ...K4, 0.50, 0.40),
  "trote-slow": fondoA("trote-slow", ...K4, 0.445, 0.40),
  salto1: fondoA("salto1", ...K4, 0.625, 0.41),
  salto2: fondoA("salto2", ...K4, 0.55, 0.39),
  cuerpo: fondoA("cuerpo", ...K4, 0.425, 0.5, 63),
  salto: fondoA("salto", ...K4, 0.49, 0.46, 240),
  cabeza: fondoA("cabeza", ...HD, 0.56, 0.38, 40),
};
const franja = (img, top) => `<div class="abs franja" style="top:${top}px;background-image:url(${F(img)})"></div>`;
const velo = (alto) => `<div class="abs velo" style="height:${alto}px"></div>`;

// Bloque con sello, franja y barra, centrado en el alto del cuadro
const Y_SELLO = 404, Y_FRANJA = 694, Y_BARRA = 1344;

const placas = [
  ["A", "01-Remate", `<div class="abs cover" style="background-image:url(${F("dron")})"></div><div class="abs inset velo-pleno"></div>${selloCentro(470, 374)}${remateTexto(850)}`],
  ["A", "02-Slow", `${A.slow}${selloChico()}${barra(1408)}`],
  ["A", "03-Intro", `${A.cabeza}${velo(620)}${selloChico()}${nombreBloque(1290, loteFila())}`],
  ["A", "04-Pedigri", `<div class="abs perfil-grande" style="background-image:url(${F("perfil")})"></div><div class="abs funde"></div>${selloChico()}${arbol(860, 720)}`],
  ["A", "05-Body", `${A.cuerpo}${selloChico()}${cajas(1324, 4)}${barra(1408)}`],
  ["A", "06-VLeft", `${A.trote}${selloChico()}${barra(1408)}`],
  ["A", "07-VRight", `${A["trote-slow"]}${selloChico()}${barra(1408)}`],
  ["A", "08-Salto1", `${A.salto1}${selloChico()}`],
  ["A", "09-Salto2", `${A.salto2}${selloChico()}`],
  ["A", "10-Cierre", `${A.salto}${velo(760)}${remateLote(270, true)}${selloCentro(350, 236.7)}${nombreBloque(1330)}`],

  ["B", "01-Remate", `${selloCentro(330, 300)}${franja("dron", 680)}${remateTexto(1296)}`],
  ["B", "02-Slow", `${selloCentro(Y_SELLO, 236.7)}${franja("slow", Y_FRANJA)}${barra(Y_BARRA)}`],
  ["B", "03-Intro", `${selloCentro(Y_SELLO, 236.7)}${franja("cabeza", Y_FRANJA)}${nombreBloque(1330, loteFila())}`],
  ["B", "04-Pedigri", `<div class="abs perfil-chico" style="background-image:url(${F("perfil")})"></div>
     <div class="abs col-der"><img src="${SELLO}" class="sello-col" alt="" /><div class="nombre">${l.nombre}</div><div class="linea corta"></div><div class="sangre chica">${l.pedigri}</div></div>${arbol(760, 820)}`],
  ["B", "05-Body", `${selloCentro(290, 180)}${franja("cuerpo", 500)}${nombreBloque(1130)}${cajas(1422, 2)}`],
  ["B", "06-VLeft", `${selloCentro(Y_SELLO, 236.7)}${franja("trote", Y_FRANJA)}${barra(Y_BARRA)}`],
  ["B", "07-VRight", `${selloCentro(Y_SELLO, 236.7)}${franja("trote-slow", Y_FRANJA)}${barra(Y_BARRA)}`],
  ["B", "08-Salto1", `${selloCentro(511, 236.7)}${franja("salto1", 801)}`],
  ["B", "09-Salto2", `${selloCentro(511, 236.7)}${franja("salto2", 801)}`],
  ["B", "10-Cierre", `${remateLote(330, false)}${selloCentro(412, 236.7)}${franja("salto", 694)}${nombreBloque(1340)}`],
];

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>00-00-HA-VerticalPrueba</title>
  <!-- Prueba de diseño, lote ${nn}. Se genera con armar.mjs: no editar a mano. -->
  <link rel="stylesheet" href="../../brand/tokens.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: var(--ha-charcoal-elev); }
    body { -webkit-font-smoothing: antialiased; font-family: var(--ha-font-sans); color: var(--ha-white); }
    .slide { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: var(--ha-ink); margin-bottom: 40px; }
    .abs { position: absolute; }
    .inset { inset: 0; }
    .cover { inset: 0; background-size: cover; background-position: 50% 50%; }
    .velo-pleno { background: var(--ha-veil-dark); }
    /* Opción A */
    .desen { position: absolute; inset: -80px; background-size: cover; background-position: center; filter: blur(46px); }
    .corte { left: 0; width: 1080px; background-repeat: no-repeat; -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 90px, #000 calc(100% - 90px), transparent 100%); mask-image: linear-gradient(to bottom, transparent 0, #000 90px, #000 calc(100% - 90px), transparent 100%); }
    .velo { left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--ha-black) 62%, transparent) 42%, color-mix(in srgb, var(--ha-black) 78%, transparent) 100%); }
    .perfil-grande { left: 0; top: 0; width: 1080px; height: 880px; background-size: 1080px auto; background-position: 50% -230px; }
    .funde { left: 0; top: 700px; width: 1080px; height: 180px; background: linear-gradient(to bottom, transparent, var(--ha-ink)); }
    /* Opción B */
    .franja { left: 0; width: 1080px; height: 608px; background-size: cover; background-position: center; }
    .perfil-chico { left: 60px; top: 300px; width: 320px; height: 430px; background-size: 320px auto; background-position: 50% 10%; }
    .col-der { left: 410px; top: 300px; width: 610px; height: 430px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-transform: uppercase; }
    .sello-col { width: 170px; height: 170px; margin-bottom: 12px; }
    /* Tipografía y medidas de las placas horizontales */
    .col { left: 0; width: 1080px; display: flex; flex-direction: column; align-items: center; text-transform: uppercase; }
    .nombre { white-space: nowrap; line-height: 1.05; font-weight: var(--ha-t-lot-weight); letter-spacing: var(--ha-t-lot-track); font-size: calc(var(--ha-t-lot-size) * 1.333); text-shadow: 0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent), 0 0 16px color-mix(in srgb, var(--ha-black) 60%, transparent); }
    .linea { width: 620px; height: 6px; margin: 18px 0; background: var(--ha-gold); clip-path: polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%); }
    .linea.corta { width: 480px; margin: 12px 0; }
    .sangre { white-space: nowrap; line-height: 1.25; font-weight: var(--ha-t-data-weight); letter-spacing: var(--ha-t-data-track); font-size: calc(var(--ha-t-data-size) * 1.45); text-shadow: 0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent), 0 0 12px color-mix(in srgb, var(--ha-black) 55%, transparent); }
    .sangre.chica { font-size: calc(var(--ha-t-data-size) * 1.05); }
    .lote, .fila-sup { display: flex; align-items: center; gap: 16px; font-weight: var(--ha-t-num-weight); letter-spacing: var(--ha-t-label-track); font-size: calc(var(--ha-t-label-size) * 1.247); text-transform: uppercase; }
    .lote { margin-top: 16px; color: var(--ha-sand); }
    .fila-sup { left: 0; width: 1080px; justify-content: center; color: var(--ha-sand); }
    .fila-sup.taupe { color: var(--ha-taupe); }
    .diag { width: 37.3px; height: 64px; overflow: visible; }
    .diag line { stroke: currentColor; stroke-width: var(--ha-border); }
    .evento { white-space: nowrap; font-weight: var(--ha-t-event-weight); letter-spacing: 0.15em; font-size: calc(var(--ha-t-event-size) * 0.9); line-height: 1.05; }
    .anio { white-space: nowrap; font-weight: var(--ha-t-year-weight); letter-spacing: 0.173em; font-size: calc(var(--ha-t-year-size) * 0.9); line-height: 1.1; }
    .fecha { display: flex; align-items: center; gap: 30px; margin-top: 18px; color: var(--ha-sand); white-space: nowrap; font-weight: var(--ha-t-meta-weight); letter-spacing: 0.27em; font-size: calc(var(--ha-t-label-size) * 1.05); }
    .fecha i { width: 79px; height: var(--ha-border); background: var(--ha-gold); }
    .cajas { left: 60px; display: grid; gap: 14px; }
    .caja { height: 64px; display: flex; align-items: center; justify-content: center; white-space: nowrap; text-transform: uppercase; background: var(--ha-panel-dark); border: var(--ha-border) solid var(--ha-line-gold); font-weight: var(--ha-t-data-weight); letter-spacing: var(--ha-t-data-track); font-size: calc(var(--ha-t-data-size) * 1.3); }
    .celda { display: flex; align-items: center; padding-left: 16px; white-space: nowrap; overflow: hidden; text-transform: uppercase; color: var(--ha-sand); background: var(--ha-panel-dark); border: var(--ha-border) solid var(--ha-line-gold); font-weight: var(--ha-t-data-weight); font-size: calc(var(--ha-t-data-size) * 1.0); }
    .celda.dest { color: var(--ha-white); font-weight: var(--ha-t-lot-weight); letter-spacing: 0.045em; }
    .ft-barra { left: 60px; width: 960px; height: 172px; background: var(--ha-panel-dark); border: var(--ha-border) solid var(--ha-line-gold); }
    .ft-diag { left: 142px; width: 119px; height: 172px; overflow: visible; }
    .ft-diag line { stroke: var(--ha-gold); stroke-width: var(--ha-border); }
    .ft-txt { white-space: nowrap; line-height: normal; text-transform: uppercase; }
    .ft-num { left: 87.5px; color: var(--ha-sand); font-weight: var(--ha-t-num-weight); font-size: calc(var(--ha-t-num-size) * 0.944); letter-spacing: var(--ha-t-num-track); }
    .ft-nombre { left: 284px; font-weight: var(--ha-t-lot-weight); font-size: calc(var(--ha-t-lot-size) * 0.939); letter-spacing: var(--ha-t-lot-track); }
    .ft-sangre { left: 284px; font-weight: var(--ha-t-data-weight); font-size: calc(var(--ha-t-data-size) * 1.607); letter-spacing: var(--ha-t-data-track); }
  </style>
</head>
<body>
${placas.map(([op, esc, h]) => `<section class="slide" data-nombre="VerticalPrueba-${op}-${esc}">${h}</section>`).join("\n")}
</body>
</html>
`;
writeFileSync(join(aqui, "index.html"), html, "utf8");
console.log(`✓ index.html · lote ${nn} · ${placas.length} placas`);
