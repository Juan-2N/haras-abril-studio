// Recorta, para la portada de YouTube (diseño A), la foto de cada lote a la zona visible a la derecha del panel
// (1160 × 1080), más lo que queda detrás de la franja: assets/fotos/loteNN-portada.jpg, a 16:9. Sale del original en videosreferencias/lotes/NN_NOMBRE/, no de la
// foto del cierre, que ya viene con el encuadre del video.
//
// Encuadre por lote en video-lotes.json → "portada": [x, y, ancho], en fracciones del original; el alto sale de la proporción.
// Usa la foto indicada en "archivos" → "foto-salto" o, si no hay, la que tiene "Salto" en el nombre.
//
// Uso (desde remate-videos/):
//   node herramientas/recortar-portadas.mjs [NN ...]

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const video = JSON.parse(readFileSync(join(root, "herramientas", "video-lotes.json"), "utf8"));
const pedidos = process.argv.slice(2).map((n) => n.padStart(2, "0"));
const base = join(root, "videosreferencias", "lotes");
const PROPORCION = 1160 / 1080;

for (const l of video.lotes) {
  if (!l.portada || (pedidos.length && !pedidos.includes(l.lote))) continue;
  const carpeta = readdirSync(base).find((d) => d.startsWith(`${l.lote}_`));
  if (!carpeta) throw new Error(`Lote ${l.lote}: no encontré su carpeta en videosreferencias/lotes`);
  const dir = join(base, carpeta);
  const archivo = l.archivos?.["foto-salto"] || readdirSync(dir).find((f) => /salto/i.test(f) && /\.jpe?g$/i.test(f));
  if (!archivo || !existsSync(join(dir, archivo))) throw new Error(`Lote ${l.lote}: no encontré la foto de la portada`);
  const src = join(dir, archivo);
  const [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", src + "[0]"]).toString().trim().split(" ").map(Number);
  const [fx, fy, fw] = l.portada;
  const cw = Math.round(fw * w);
  const ch = Math.min(Math.round(cw / PROPORCION), h);
  const y = Math.min(Math.round(fy * h), h - ch);
  // La foto va a todo el cuadro, como en 01 y 02, porque la franja es translúcida: "portada" marca la zona visible
  // y se agrega lo que queda detrás de la franja (a la derecha en los potrillos). Si la foto no alcanza, se espeja su borde
  const ancho = Math.round(cw * 1920 / 1160), extra = ancho - cw;
  let x = Math.min(Math.round(fx * w), w - cw);
  if (!l.cierreDerecha) x -= extra;
  const faltaIzq = Math.max(0, -x), faltaDer = Math.max(0, x + ancho - w);
  const espejos = [
    ...(faltaIzq ? ["(", "-clone", "0", "-crop", `${faltaIzq}x${h}+0+0`, "+repage", "-flop", ")", "+swap", "+append", "+repage"] : []),
    ...(faltaDer ? ["(", "-clone", "0", "-gravity", "east", "-crop", `${faltaDer}x${h}+0+0`, "+repage", "-flop", ")", "-gravity", "northwest", "+append", "+repage"] : []),
  ];
  const dest = join(root, "assets", "fotos", `lote${l.lote}-portada.jpg`);
  execFileSync("magick", [src + "[0]", "-auto-orient", ...espejos, "-gravity", "northwest", "-crop", `${ancho}x${ch}+${Math.max(0, x)}+${y}`, "+repage", "-resize", "2880x1620!", "-quality", "90", "-colorspace", "sRGB", dest]);
  console.log(`✓ lote${l.lote}-portada.jpg ← ${archivo} (${ancho}×${ch})`);
}
