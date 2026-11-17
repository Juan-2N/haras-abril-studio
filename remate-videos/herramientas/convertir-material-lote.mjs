// Convierte el material original de cada lote (videosreferencias/VideoLote/NN_NOMBRE/ y
// videosreferencias/lotes/NN_NOMBRE/) al formato
// de trabajo y lo deja con el nombre de la plantilla.
//
// CLIPS → assets/clips/loteNN-<clave>.mp4. Se reconocen por el nombre del archivo:
//   "Salto Slow" o "<Nombre> - Slow" → slow        "Trote Slow" → slow-trote
//   "Trote 1"                         → trote       "Salto 1" / "Salto 2" → salto1 / salto2
//   "Cabeza"                          → cabeza (clip de fondo de la intro, opcional)
//   Salida: H.264 1920×1080, 30 fps, un keyframe por segundo, sin audio.
//   Un original de 50/60 fps (cámara lenta sin conformar) se pasa al 50 %: cada cuadro se usa.
//
// FOTOS → assets/fotos/loteNN-<clave>.jpg:
//   "Cabeza" → cabeza (intro)   "Perfil" o "Pedigri" → pedigri   "Cuerpo" → cuerpo   "Salto" → salto (cierre)
//   cabeza, cuerpo y salto se recortan a 16:9 (centrado); pedigri a la proporción del panel (580×859, vertical), con la cabeza
//   arriba (ancla vertical 0,3; se cambia en video-lotes.json → "anclaPedigri").
//   Se reducen a 1920 px de alto.
//
// Si un lote viene con otros nombres, se indica a mano en video-lotes.json:
//   "archivos": { "slow": "Abril Viconthon 2.mp4", "foto-cuerpo": "IMG_1234.jpg", ... }
// Solo convierte lo que falta o lo que cambió (original más nuevo que la copia).
//
// Recorte por lote, para correr el caballo y dejar libre la zona del texto (fracciones del cuadro 16:9):
//   "recorte": { "cabeza": [x, y, ancho], "foto-cuerpo": [...], "foto-salto": [...] }
//
// Uso (desde remate-videos/):
//   node herramientas/convertir-material-lote.mjs [NN ...] [--forzar]

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const origen = join(root, "videosreferencias", "VideoLote");
const video = JSON.parse(readFileSync(join(root, "herramientas", "video-lotes.json"), "utf8"));
const datosVideo = new Map(video.lotes.map((l) => [l.lote, l]));
// --forzar: vuelve a convertir aunque la copia esté al día (por ejemplo, después de cambiar un recorte)
const forzar = process.argv.includes("--forzar");
const pedidos = process.argv.slice(2).filter((a) => !a.startsWith("--")).map((n) => n.padStart(2, "0"));

const claveClip = (n) => {
  if (/trote slow/.test(n)) return "slow-trote";
  if (/salto slow| - slow\.\w+$/.test(n)) return "slow";
  if (/trote 1/.test(n)) return "trote";
  if (/salto 1/.test(n)) return "salto1";
  if (/salto 2/.test(n)) return "salto2";
  if (/cabeza/.test(n)) return "cabeza";
  return null;
};
const claveFoto = (n) => {
  if (/cabeza/.test(n)) return "foto-cabeza";
  if (/perfil|pedigr/.test(n)) return "foto-pedigri";
  if (/cuerpo/.test(n)) return "foto-cuerpo";
  if (/salto/.test(n)) return "foto-salto";
  return null;
};
const clave = (archivo) => {
  const n = archivo.toLowerCase();
  if (/\.(mp4|mov)$/.test(n)) return claveClip(n);
  if (/\.(jpe?g|png|tiff?)$/.test(n)) return claveFoto(n);
  return null;
};

const ffprobe = (ruta, campo) =>
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", `stream=${campo}`, "-of", "csv=p=0", ruta]).toString().trim();

// Recorte por lote (video-lotes.json → "recorte": { "<clave>": [x, y, ancho] }, en fracciones del cuadro,
// manteniendo la proporción): sirve para correr el caballo y dejar libre la zona del texto
function convertirClip(src, dest, rec) {
  const [num, den] = ffprobe(src, "r_frame_rate").split("/").map(Number);
  const fps = num / (den || 1);
  const lento = fps >= 50;
  const recorte = rec ? `crop=iw*${rec[2]}:ih*${rec[2]}:iw*${rec[0]}:ih*${rec[1]},` : "";
  const filtro = (lento ? "setpts=2.0*PTS," : "") + recorte + "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p";
  execFileSync("ffmpeg", [
    "-nostdin", "-v", "error", "-y", "-i", src, "-an", "-vf", filtro,
    "-c:v", "libx264", "-crf", "18", "-preset", "medium",
    "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-movflags", "+faststart", dest,
  ]);
  return lento ? ` (${Math.round(fps)} fps → cámara lenta al 50 %)` : "";
}

function convertirFoto(src, dest, c, ancla, rec) {
  const [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", src + "[0]"]).toString().trim().split(" ").map(Number);
  // Recorte a la proporción de destino: 16:9 centrado, o la del panel de pedigrí con ancla vertical
  const prop = c === "pedigri" ? 580 / 859 : 16 / 9; // pedigri: proporción del panel de la placa
  let cw = w, ch = h, x = 0, y = 0;
  if (w / h > prop) { cw = Math.round(h * prop); x = Math.round((w - cw) / 2); }
  else { ch = Math.round(w / prop); y = Math.round((h - ch) * (c === "pedigri" ? ancla : 0.5)); }
  // Recorte por lote dentro de ese cuadro
  if (rec) { x += Math.round(rec[0] * cw); y += Math.round(rec[1] * ch); cw = Math.round(cw * rec[2]); ch = Math.round(ch * rec[2]); }
  // x negativo en el recorte: la foto no alcanza a la izquierda y se extiende espejando su borde (sirve con fondo liso: cielo y pared)
  const extender = x < 0 ? ["(", "+clone", "-crop", `${-x}x${h}+0+0`, "+repage", "-flop", ")", "+swap", "+append", "+repage"] : [];
  if (x < 0) x = 0;
  execFileSync("magick", [src + "[0]", "-auto-orient", ...extender, "-crop", `${cw}x${ch}+${x}+${y}`, "+repage",
    "-resize", "x1920", "-quality", "90", "-colorspace", "sRGB", dest]);
  return ` (${w}×${h} → recorte ${cw}×${ch})`;
}

// Carpetas por lote: NN_NOMBRE dentro de videosreferencias/VideoLote/ (clips de Jhonny) y de
// videosreferencias/lotes/ (fotos de Vicky y material que llega después). Se juntan las dos.
const ORIGENES = [origen, join(root, "videosreferencias", "lotes")].filter((d) => existsSync(d));
const porLote = new Map(); // NN → Map(nombre de archivo → ruta)
for (const base of ORIGENES) {
  for (const carpeta of readdirSync(base)) {
    const nn = carpeta.slice(0, 2);
    const dir = join(base, carpeta);
    if (!/^\d\d$/.test(nn) || !statSync(dir).isDirectory()) continue;
    if (!porLote.has(nn)) porLote.set(nn, new Map());
    for (const f of readdirSync(dir)) if (statSync(join(dir, f)).isFile()) porLote.get(nn).set(f, join(dir, f));
  }
}

const resumen = [];
for (const nn of [...porLote.keys()].sort()) {
  if (pedidos.length && !pedidos.includes(nn)) continue;
  const archivos = porLote.get(nn);
  const datos = datosVideo.get(nn) || {};

  // Clave → archivo original: primero lo indicado a mano, después por el nombre
  const asignados = new Map(Object.entries(datos.archivos || {}));
  const sinUsar = [];
  for (const a of [...archivos.keys()].sort()) {
    if ([...asignados.values()].includes(a)) continue;
    const c = clave(a);
    if (c && !asignados.has(c)) asignados.set(c, a);
    else sinUsar.push(a);
  }

  for (const [c, a] of asignados) {
    const src = archivos.get(a);
    const esFoto = c.startsWith("foto-");
    const nombre = esFoto ? c.slice(5) : c;
    const dest = join(root, "assets", esFoto ? "fotos" : "clips", `lote${nn}-${nombre}.${esFoto ? "jpg" : "mp4"}`);
    if (!src) { resumen.push(`✗ ${nn} ${c}: no existe ${a}`); continue; }
    if (!forzar && existsSync(dest) && statSync(dest).mtimeMs > statSync(src).mtimeMs) { resumen.push(`= ${nn} ${c}`); continue; }
    const rec = datos.recorte?.[c];
    const nota = esFoto ? convertirFoto(src, dest, nombre, datos.anclaPedigri ?? 0.3, rec) : convertirClip(src, dest, rec);
    resumen.push(`✓ ${nn} ${c} ← ${a}${nota}`);
  }
  if (sinUsar.length) resumen.push(`! ${nn} sin asignar: ${sinUsar.join(", ")}`);
}
console.log(resumen.join("\n"));
