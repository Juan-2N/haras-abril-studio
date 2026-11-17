// Genera el título y la descripción de YouTube de cada lote con video final en salida/:
// entregas/youtube/lote-NN.txt. Los datos salen de lotes.json y video-lotes.json; no se tipean.
// Formato acordado el 08/11/2026: el del Remate 2025, con los datos del lote.
//
// Uso (desde remate-videos/):
//   node herramientas/armar-descripcion-yt.mjs [NN ...]

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(readFileSync(join(root, "herramientas", "lotes.json"), "utf8"));
const video = JSON.parse(readFileSync(join(root, "herramientas", "video-lotes.json"), "utf8"));
const datosVideo = new Map(video.lotes.map((l) => [l.lote, l]));
const pedidos = process.argv.slice(2).map((n) => n.padStart(2, "0"));
const destino = join(root, "entregas", "youtube");
mkdirSync(destino, { recursive: true });

const tieneDato = (v) => v && v !== "—";

let n = 0;
for (const l of base.lotes) {
  if (pedidos.length && !pedidos.includes(l.lote)) continue;
  if (!existsSync(join(root, "salida", `00-00-HA-VideoLote-16x9-${l.lote}.mp4`))) continue;
  const v = datosVideo.get(l.lote);
  const titulo = l.nombre.toUpperCase();
  const ficha = [l.sexo, l.pelo, `Nacimiento: ${l.nac}`];
  if (tieneDato(l.registro)) ficha.push(`AAFE ${l.registro}`);

  const descripcion = [
    `${titulo} 💫 (${l.pedigri})`,
    `LOTE ${l.lote} · REMATE 2026`,
    "",
    ficha.join(" · "),
    `Padre: ${v.arbol[0]} · Madre: ${v.arbol[1]}`,
    `Ficha completa y pedigree: ${v.url}`,
    "",
    "Pre-ofertas: desde el lunes 23 de noviembre a las 10 h hasta el viernes 27 de noviembre a las 20 h, en remateharasabril.com",
    "Remate en vivo: sábado 28 de noviembre, 17:30 h. Haras Abril, Lezama, en el marco del CSI 1*. Presencial y online.",
    "",
    "Consultas: remate@harasabril.com.ar",
    "WP +54 9 11 7302-4522",
    "Más info: linktr.ee/harasabril",
    "",
    "Tu próxima estrella cada vez más cerca.",
    "",
    "#harasabril #simplementelamejorsangre #losmejoresresultados",
  ].join("\n");

  const texto = `TÍTULO\n${titulo}\n\nDESCRIPCIÓN\n${descripcion}\n`;
  writeFileSync(join(destino, `lote-${l.lote}.txt`), texto, "utf8");

  // Carpeta del lote, para tener todo junto al subir (copias: correr de nuevo después de cada render)
  const carpeta = join(root, "salida", "lotes", `${l.lote}_${titulo.replace(/\s+/g, "_")}`);
  mkdirSync(carpeta, { recursive: true });
  cpSync(join(root, "salida", `00-00-HA-VideoLote-16x9-${l.lote}.mp4`), join(carpeta, `00-00-HA-VideoLote-16x9-${l.lote}.mp4`));
  const portada = join(root, "salida", "portadas-yt", `00-00-HA-PortadaYT-Lote${l.lote}-A-Salto.jpg`);
  if (existsSync(portada)) cpSync(portada, join(carpeta, `Portada-YouTube-Lote${l.lote}.jpg`));
  writeFileSync(join(carpeta, "Titulo-y-descripcion.txt"), texto, "utf8");
  console.log(`✓ lote-${l.lote}.txt  ${titulo}`);
  n++;
}
if (!n) console.log("No hay lotes con video final para esos números.");
