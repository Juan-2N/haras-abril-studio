// Arma el manifiesto de la página conjunta https://hub.harasabril.com.ar/video-lotes:
// los 13 lotes en una sola pieza. El lote que ya tiene video final y captura en salida/ va con su video;
// el resto, con una placa "Assets pendientes" (JPG en salida/pendientes/), que el visor del hub muestra como imagen.
//
// Uso (desde remate-videos/), cada vez que se termina un lote:
//   node herramientas/armar-video-lotes-hub.mjs
//   cd "W:\HARAS ABRIL\Dev\hub" && pnpm publicar "W:/HARAS ABRIL/Studio/remate-videos/entregas/00-00-HA-VideoLotes.json"

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const datos = JSON.parse(readFileSync(join(root, "herramientas", "lotes.json"), "utf8"));
const salida = join(root, "salida");
const dirPendientes = join(salida, "pendientes");
mkdirSync(dirPendientes, { recursive: true });

// Colores de brand/tokens.css. El fondo es --ha-panel-dark sin su transparencia
const tokens = readFileSync(join(root, "brand", "tokens.css"), "utf8");
const token = (n) => {
  const m = tokens.match(new RegExp(`--${n}:\\s*([^;]+);`));
  if (!m) throw new Error(`No encontré el token --${n}`);
  return m[1].trim();
};
const [r, g, b] = token("ha-panel-dark").match(/\d+/g);
const FONDO = `rgb(${r},${g},${b})`;
const BLANCO = token("ha-white"), DORADO = token("ha-gold"), ARENA = token("ha-sand");
// ImageMagick se come las barras invertidas de Windows en -font
const fuente = (peso) => join(root, "brand", "fonts", `BarlowCondensed-${peso}.ttf`).replace(/\\/g, "/");
const SELLO = join(root, "brand", "logos", "PNG", "HA_Emblema_Dorado_Negativo.png");

function placa(destino, lote, nombre) {
  execFileSync("magick", [
    "-size", "1920x1080", `xc:${FONDO}`,
    "(", SELLO, "-resize", "300x300", ")", "-gravity", "north", "-geometry", "+0+150", "-composite",
    "-font", fuente("Regular"), "-pointsize", "44", "-kerning", "10", "-fill", DORADO, "-annotate", "+0+500", `LOTE ${lote}`,
    "-font", fuente("Bold"), "-pointsize", "104", "-kerning", "6", "-fill", BLANCO, "-annotate", "+0+570", nombre.toUpperCase(),
    "-fill", DORADO, "-draw", "rectangle 660,720 1260,722",
    "-font", fuente("Regular"), "-pointsize", "52", "-kerning", "12", "-fill", ARENA, "-annotate", "+0+770", "ASSETS PENDIENTES",
    "-quality", "85", destino,
  ]);
}

const slides = datos.lotes.map(({ lote, nombre, pedigri }) => {
  const titulo = `Lote ${lote} · ${nombre}`;
  const video = `00-00-HA-VideoLote-16x9-${lote}.mp4`;
  const captura = `capturas/00-00-HA-VideoLote-16x9-${lote}.jpg`;
  if (existsSync(join(salida, video)) && existsSync(join(salida, captura))) {
    const portada = `portadas-yt/00-00-HA-PortadaYT-Lote${lote}-A-Salto.jpg`;
    return { id: lote, titulo, subtitulo: pedigri, video: `00-00-HA-VideoLote-{formato}-${lote}.mp4`,
      captura: existsSync(join(salida, portada)) ? portada : `capturas/00-00-HA-VideoLote-{formato}-${lote}.jpg` };
  }
  placa(join(dirPendientes, `00-00-HA-VideoLote-16x9-${lote}-pendiente.jpg`), lote, nombre);
  const img = `pendientes/00-00-HA-VideoLote-{formato}-${lote}-pendiente.jpg`;
  return { id: lote, titulo, subtitulo: "Assets pendientes", video: img, captura: img };
});

// Verticales (9:16) de los lotes que los tienen, al final de la página
for (const { lote, nombre, pedigri } of datos.lotes) {
  const video = `00-00-HA-VideoLote-9x16-${lote}.mp4`, captura = `capturas/previa/00-00-HA-VideoLote-9x16-${lote}.jpg`;
  if (existsSync(join(salida, video)) && existsSync(join(salida, captura))) {
    slides.push({ id: `${lote}-v`, titulo: `Lote ${lote} · ${nombre} · Vertical`, subtitulo: pedigri, video, captura });
  }
}

// Video de presentación de los 13 lotes, primero en la página: el 16:9 con la portada de la lista de YouTube y el 9:16
// con su tapa (frame 0)
const presentacion = [
  { id: "00", titulo: "Presentación · Los 13 lotes", video: "00-00-HA-PresentacionLotes-16x9.mp4", captura: "portadas-yt/00-00-HA-PortadaYT-ListaRemate2026.jpg" },
  { id: "00-v", titulo: "Presentación · Los 13 lotes · Vertical", video: "00-00-HA-PresentacionLotes-9x16.mp4", captura: "capturas/previa/00-00-HA-PresentacionLotes-9x16.jpg" },
].filter((s) => existsSync(join(salida, s.video)) && existsSync(join(salida, s.captura)))
  .map((s) => ({ ...s, subtitulo: "Remate 2026 · sábado 28 de noviembre" }));
slides.unshift(...presentacion);

const manifiesto = {
  slug: "video-lotes",
  titulo: "Videos por lote · Remate 2026",
  tipo: "video",
  descripcion: "Todos los videos por lote juntos, para revisar · YouTube 16:9 · 42 s",
  base: "../salida",
  formatos: ["16x9"],
  slides,
};
writeFileSync(join(root, "entregas", "00-00-HA-VideoLotes.json"), JSON.stringify(manifiesto, null, 2) + "\n", "utf8");
const listos = slides.filter((s) => s.video.endsWith(".mp4")).length;
console.log(`Manifiesto listo: ${listos} con video, ${slides.length - listos} con "Assets pendientes".`);
