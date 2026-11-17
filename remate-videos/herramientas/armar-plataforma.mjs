// Arma salida/plataforma/NN_NOMBRE/ con el material de cada lote para cargar en la plataforma de remate:
//   LoteNN-Cuerpo.jpg, -Salto.jpg                                             4:3 (2000×1500), con el caballo centrado (tabla ENCUADRE), JPG calidad 85
//   LoteNN-Trote-1.jpg, -Trote-2.jpg (lotes 01 a 11)                          4:3 (2000×1500), capturas de los videos de trote (tabla TROTES)
//   LoteNN-Perfil.jpg, -Perfil-2.jpg, -Extra-N.jpg                           sin recortar, a 2000 px de lado mayor, JPG calidad 85
//   LoteNN-Pedigri.jpg                                                       captura de la placa de pedigrí del video (1920×1080)
//
// Fotos: junta videosreferencias/VideoLote/NN_NOMBRE/ y videosreferencias/lotes/NN_NOMBRE/ (si un archivo está
// en las dos, manda lotes/, igual que en convertir-material-lote.mjs).
// Placa: sale de composiciones/00-00-HA-VideoLote-16x9-NN. Si se corrige el pedigrí, regenerar la pieza antes.
//
// Uso (desde remate-videos/):
//   node herramientas/armar-plataforma.mjs [--solo-fotos | --solo-trotes] [NN ...]     sin números, los 13

import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SEGUNDO_PLACA = 14.8; // la placa va de 11,5 a 16 s y a esta altura ya está armada completa
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const soloFotos = args.includes("--solo-fotos"); // no vuelve a capturar las placas
const soloTrotes = args.includes("--solo-trotes"); // solo las capturas de los trotes
const pedidos = args.filter((a) => !a.startsWith("--"));

// Salto y Cuerpo van a 4:3 (2000×1500) con el caballo centrado a lo ancho.
// centro: punto medio del caballo (de la nariz a la cola), en % del ancho del archivo original.
// Medido sobre los archivos actuales: si se reemplaza una foto, hay que volver a medirla.
// ancho e y (opcionales): encuadre más cerrado cuando el caballo está muy al costado; % del ancho y del alto.
const ENCUADRE = {
  "01-Salto": { centro: 55 },
  "02-Salto": { centro: 52.5, ancho: 80, y: 10 },
  "09-Salto": { centro: 47.4 },
  "03-Salto": { centro: 48.8 }, "04-Salto": { centro: 46.5 }, "05-Salto": { centro: 48.9 },
  "06-Salto": { centro: 48.2 }, "07-Salto": { centro: 46.6 }, "08-Salto": { centro: 40.5 }, "10-Salto": { centro: 45.5 },
  "11-Salto": { centro: 44.9 },
  "01-Cuerpo": { centro: 45.4 }, "02-Cuerpo": { centro: 44.9 }, "03-Cuerpo": { centro: 42.7 }, "04-Cuerpo": { centro: 47.6 },
  "05-Cuerpo": { centro: 44.5 }, "06-Cuerpo": { centro: 48.2 }, "07-Cuerpo": { centro: 49.9 }, "08-Cuerpo": { centro: 47.3 },
  "09-Cuerpo": { centro: 41.7 }, "10-Cuerpo": { centro: 51.2 }, "11-Cuerpo": { centro: 46.6 }, "12-Cuerpo": { centro: 44.6 },
  "13-Cuerpo": { centro: 41.2 },
};

// Capturas de los dos videos de trote (lotes 01 a 11), desde el original 4K: LoteNN-Trote-1 ("Trote 1") y LoteNN-Trote-2 ("Trote Slow").
// [segundo del clip, encuadre]; el centro se mide sobre el cuadro elegido. Mismo tamaño que Salto y Cuerpo.
const TROTES = {
  "01": { "Trote-1": [1.117, { centro: 47 }], "Trote-2": [6.5, { centro: 47.2 }] },
  "02": { "Trote-1": [1.489, { centro: 47.7 }], "Trote-2": [11.528, { centro: 42.3 }] },
  "03": { "Trote-1": [3.536, { centro: 50.1 }], "Trote-2": [4.533, { centro: 43 }] },
  "04": { "Trote-1": [1.7, { centro: 56.4 }], "Trote-2": [4.278, { centro: 48.9 }] },
  "05": { "Trote-1": [3.311, { centro: 45.1 }], "Trote-2": [9.917, { centro: 48.4 }] },
  "06": { "Trote-1": [3.536, { centro: 41.2 }], "Trote-2": [2.994, { centro: 40.7 }] },
  "07": { "Trote-1": [3.722, { centro: 51.5 }], "Trote-2": [5.989, { centro: 46.2 }] },
  "08": { "Trote-1": [2.222, { centro: 51.4 }], "Trote-2": [7.5, { centro: 45.8, ancho: 56, y: 18 }] },
  "09": { "Trote-1": [0.271, { centro: 47.1 }], "Trote-2": [3.344, { centro: 48.6 }] },
  "10": { "Trote-1": [2.112, { centro: 47.1 }], "Trote-2": [13.4, { centro: 48 }] },
  "11": { "Trote-1": [1.862, { centro: 46 }], "Trote-2": [0.433, { centro: 52.8 }] },
};

function capturaTrote(video, segundo, encuadre, salidaFoto, id) {
  const tmp = mkdtempSync(join(tmpdir(), `trote-${id}-`));
  try {
    const png = join(tmp, "cuadro.png");
    // Los originales no declaran la matriz de color: sin in_color_matrix, ffmpeg asumiría BT.601 y cambiaría los colores.
    execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-ss", String(segundo), "-i", video, "-frames:v", "1", "-vf", "scale=in_color_matrix=bt709:in_range=tv,format=rgb24", png]);
    execFileSync("magick", [png, "-crop", recorte4x3(png, encuadre, id), "+repage", "-resize", "2000x1500!", "-quality", "85", "-sampling-factor", "4:2:0", "-interlace", "JPEG", salidaFoto]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function recorte4x3(archivo, { centro, ancho, y = 0 }, id) {
  const [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", archivo]).toString().trim().split(" ").map(Number);
  const cw = ancho ? Math.round((w * ancho) / 100) : Math.round((h * 4) / 3);
  const ch = Math.round((cw * 3) / 4);
  if (cw > w || ch > h) throw new Error(`${id}: el recorte 4:3 no entra en ${w}×${h}`);
  const x = Math.round((w * centro) / 100 - cw / 2);
  if (x < -1 || x + cw > w + 1) throw new Error(`${id}: el recorte se sale de la foto; no se puede centrar sin cerrar el encuadre`);
  return `${cw}x${ch}+${Math.max(0, Math.min(x, w - cw))}+${Math.round((h * y) / 100)}`;
}

const porLote = new Map();
for (const base of ["VideoLote", "lotes"]) {
  const dirBase = join(root, "videosreferencias", base);
  for (const carpeta of readdirSync(dirBase)) {
    const nn = carpeta.match(/^(\d{2})_/)?.[1];
    if (!nn || !statSync(join(dirBase, carpeta)).isDirectory()) continue;
    if (!porLote.has(nn)) porLote.set(nn, { carpeta, fotos: new Map() });
    for (const f of readdirSync(join(dirBase, carpeta))) {
      if (/\.jpe?g$/i.test(f)) porLote.get(nn).fotos.set(f.replace(/\s+\./, "."), join(dirBase, carpeta, f));
    }
  }
}

const tipoDe = (nombre) => {
  const n = nombre.toLowerCase();
  if (/cuerpo/.test(n)) return "Cuerpo";
  if (/perfil 2/.test(n)) return "Perfil-2";
  if (/perfil/.test(n)) return "Perfil";
  if (/salto/.test(n)) return "Salto";
  return null;
};

for (const nn of [...porLote.keys()].sort()) {
  if (pedidos.length && !pedidos.includes(nn)) continue;
  const { carpeta, fotos } = porLote.get(nn);
  const destino = join(root, "salida", "plataforma", carpeta);
  mkdirSync(destino, { recursive: true });

  let extra = 0;
  const hechos = [];
  for (const [nombre, origen] of soloTrotes ? [] : [...fotos].sort(([a], [b]) => a.localeCompare(b))) {
    const tipo = tipoDe(nombre) ?? `Extra-${++extra}`;
    const fuente = origen;
    const salidaFoto = join(destino, `Lote${nn}-${tipo}.jpg`);
    const encuadre = ENCUADRE[`${nn}-${tipo}`];
    const geometria = encuadre ? ["-crop", recorte4x3(fuente, encuadre, `${nn}-${tipo}`), "+repage", "-resize", "2000x1500!"] : ["-resize", "2000x2000>"];
    execFileSync("magick", [fuente, ...geometria, "-quality", "85", "-sampling-factor", "4:2:0", "-interlace", "JPEG", salidaFoto]);
    hechos.push(tipo);
  }

  if (TROTES[nn]) {
    const dirVideos = join(root, "videosreferencias", "VideoLote", carpeta);
    const videos = readdirSync(dirVideos);
    for (const [tipo, [segundo, encuadre]] of Object.entries(TROTES[nn])) {
      const patron = tipo === "Trote-1" ? /trote 1/i : /trote slow/i;
      const video = videos.find((f) => /\.mp4$/i.test(f) && patron.test(f));
      if (!video) throw new Error(`Lote ${nn}: no se encontró el video de ${tipo}`);
      capturaTrote(join(dirVideos, video), segundo, encuadre, join(destino, `Lote${nn}-${tipo}.jpg`), `${nn}-${tipo}`);
      hechos.push(tipo);
    }
  }

  if (soloFotos || soloTrotes) {
    console.log(`✓ ${carpeta}: ${hechos.join(", ")}`);
    continue;
  }

  const pieza = join(root, "composiciones", `00-00-HA-VideoLote-16x9-${nn}`);
  if (!existsSync(pieza)) throw new Error(`No existe la composición ${pieza}`);
  const tmp = mkdtempSync(join(tmpdir(), `plataforma-${nn}-`));
  try {
    execSync(`npx hyperframes snapshot "${pieza}" --at ${SEGUNDO_PLACA} --no-end --keep -o "${tmp}"`, { cwd: pieza, stdio: "pipe" });
    const png = join(tmp, `at-${SEGUNDO_PLACA}s.png`);
    if (!existsSync(png)) throw new Error(`El snapshot del lote ${nn} no generó ${png}`);
    execFileSync("magick", [png, "-quality", "92", join(destino, `Lote${nn}-Pedigri.jpg`)]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`✓ ${carpeta}: ${hechos.join(", ")}, Pedigri`);
}
