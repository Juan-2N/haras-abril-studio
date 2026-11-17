// Verifica videos renderizados: busca frames donde una imagen aparece o
// desaparece de golpe (saltos bruscos entre frames que una animación suave no
// explica) y, si se pasa el log del render, avisos de imágenes que no cargaron.
// Controla la tapa: el frame 0 es la miniatura de Instagram y tiene que ser la
// pieza armada (no negro, blanco ni plano). El corte tapa → animación entre el
// frame 0 y el 1 es intencional y no cuenta como salto.
// También arma una hoja de contacto (4 fps) y guarda la tapa para revisión visual.
//
// Uso (desde remate-videos/):
//   node herramientas/verificar-video.mjs salida/<pieza>.mp4 [--log render.log] [--hoja carpeta/]
// Sale con código 1 si encuentra problemas.

import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : null;
};
const logPath = opt("--log");
const hojaDir = opt("--hoja");
const videos = args;
if (!videos.length) {
  console.error("Uso: node herramientas/verificar-video.mjs <video.mp4> [--log render.log] [--hoja carpeta/]");
  process.exit(1);
}

// Cambio entre frames consecutivos (0-255) de la zona que más cambió: el frame
// se reduce a una grilla de 16 columnas (cada píxel promedia una zona de ~68 px),
// así un elemento chico que aparece o desaparece no se diluye en el promedio.
function diferencias(video) {
  const out = execFileSync("ffmpeg", [
    "-v", "error", "-i", video,
    "-vf", "scale=16:-2:flags=area,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YMAX:file=-",
    "-f", "null", "-",
  ], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return [...out.matchAll(/YMAX=([\d.]+)/g)].map((m) => Number(m[1]));
}

const mediana = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
};

// Un salto es un frame cuya diferencia supera con holgura la de sus vecinos y
// que no deja "cola": una entrada animada (expo.out) cambia mucho en su primer
// frame pero sigue cambiando en el siguiente; una imagen que aparece o
// desaparece de golpe cambia una sola vez.
function saltos(d, fps = 30) {
  const res = [];
  for (let i = 1; i < d.length; i++) {
    const vecinos = d.slice(Math.max(0, i - 4), i).concat(d.slice(i + 1, i + 5));
    const base = mediana(vecinos);
    const sinCola = (d[i + 1] ?? 0) < base * 2 + 1.5;
    if (d[i] > 3 && d[i] > base * 4 + 1.5 && sinCola) res.push({ t: (i + 1) / fps, dif: d[i], base });
  }
  return res;
}

// Brillo del frame 0 (0-255): promedio, mínimo y máximo de luminancia.
function tapa(video) {
  const out = execFileSync("ffmpeg", [
    "-v", "error", "-i", video, "-frames:v", "1",
    "-vf", "signalstats,metadata=print:file=-", "-f", "null", "-",
  ], { encoding: "utf8" });
  const v = (k) => Number(out.match(new RegExp(`signalstats\\.${k}=([\\d.]+)`))?.[1] ?? 0);
  return { avg: v("YAVG"), min: v("YMIN"), max: v("YMAX") };
}

let problemas = 0;

if (logPath) {
  const log = readFileSync(logPath, "utf8");
  const avisos = log.split(/\r?\n/).filter((l) =>
    /did not load|media_load_failed|media_readiness_timeout|Transient browser failure/i.test(l));
  if (avisos.length) {
    problemas++;
    console.log(`✗ ${basename(logPath)}: ${avisos.length} aviso(s) de carga en el render`);
    for (const a of avisos.slice(0, 5)) console.log(`    ${a.trim().slice(0, 200)}`);
  } else {
    console.log(`✓ ${basename(logPath)}: sin avisos de carga`);
  }
}

for (const video of videos) {
  const s = saltos(diferencias(video));
  if (s.length) {
    problemas++;
    console.log(`✗ ${basename(video)}: ${s.length} salto(s) brusco(s)`);
    for (const x of s.slice(0, 10)) console.log(`    t=${x.t.toFixed(2)}s  dif=${x.dif.toFixed(1)}  vecinos=${x.base.toFixed(1)}`);
  } else {
    console.log(`✓ ${basename(video)}: sin saltos bruscos`);
  }
  const t = tapa(video);
  const fallaTapa = t.avg < 20 ? "casi negra" : t.avg > 235 ? "casi blanca" : t.max - t.min < 30 ? "plana" : null;
  if (fallaTapa) {
    problemas++;
    console.log(`✗ ${basename(video)}: tapa (frame 0) ${fallaTapa}  brillo=${t.avg.toFixed(0)} rango=${t.min}-${t.max}`);
  } else {
    console.log(`✓ ${basename(video)}: tapa con contenido  brillo=${t.avg.toFixed(0)}`);
  }
  if (hojaDir) {
    mkdirSync(hojaDir, { recursive: true });
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-frames:v", "1", "-vf", "scale=540:-2",
      join(hojaDir, basename(video, ".mp4") + "-tapa.jpg")]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-vf", "fps=4,scale=270:-2,tile=8x4",
      "-frames:v", "1", join(hojaDir, basename(video, ".mp4") + ".jpg")]);
  }
}

process.exit(problemas ? 1 : 0);
