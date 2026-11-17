// Baja el árbol de pedigrí (3 generaciones, 14 nombres) de la página de cada lote en el sitio
// y lo guarda en herramientas/video-lotes.json, campo "arbol".
// La URL de cada lote está en ese mismo archivo (columna URL de la Google Sheet).
//
// Orden del árbol, el que usa la placa de pedigrí del video:
//   padre, madre · sus 4 padres (pp, pm, mp, mm) · los 8 de la tercera generación.
// El sitio lista los nodos por profundidad (depth-1/2/3) con su posición vertical (top):
// ordenados por profundidad y por top dan exactamente ese orden.
//
// Control: los índices 0, 4 y 12 (padre, abuelo materno, bisabuelo materno) tienen que
// coincidir con la sangre de lotes.json. Si no coinciden, avisa.
//
// Uso (desde remate-videos/):
//   node herramientas/bajar-pedigri.mjs [NN ...]

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rutaVideo = join(root, "herramientas", "video-lotes.json");
const video = JSON.parse(readFileSync(rutaVideo, "utf8"));
const base = JSON.parse(readFileSync(join(root, "herramientas", "lotes.json"), "utf8"));
const sangreDe = new Map(base.lotes.map((l) => [l.lote, l.pedigri]));

const pedidos = process.argv.slice(2);
const entidades = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
const limpiar = (t) =>
  t
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&(\w+);/g, (m, n) => entidades[n] ?? m)
    .replace(/\s+/g, " ")
    .trim();
const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");

let avisos = 0;
for (const lote of video.lotes) {
  if (pedidos.length && !pedidos.includes(lote.lote)) continue;
  const html = await (await fetch(lote.url)).text();
  const nodos = [...html.matchAll(/<div class="pedigree-node pedigree-node--depth-(\d)" style="top:([\d.]+)px">([^<]*)<\/div>/g)]
    .map((m) => ({ depth: +m[1], top: +m[2], nombre: limpiar(m[3]) }))
    .sort((a, b) => a.depth - b.depth || a.top - b.top);
  if (nodos.length !== 14) {
    console.error(`✗ ${lote.lote}: ${nodos.length} nodos en ${lote.url} (se esperaban 14)`);
    avisos++;
    continue;
  }
  lote.arbol = nodos.map((n) => n.nombre);

  const sangre = (sangreDe.get(lote.lote) || "").split("×").map((s) => s.trim());
  const arbol3 = [0, 4, 12].map((i) => lote.arbol[i]);
  const ok = sangre.length === 3 && sangre.every((s, i) => norm(s) === norm(arbol3[i]));
  if (!ok) {
    console.warn(`! ${lote.lote}: la sangre (${sangre.join(" × ")}) no coincide con el árbol (${arbol3.join(" × ")})`);
    avisos++;
  }
  console.log(`${ok ? "✓" : "!"} ${lote.lote} ${lote.arbol.slice(0, 2).join(" / ")}`);
}

writeFileSync(rutaVideo, JSON.stringify(video, null, 2) + "\n", "utf8");
console.log(`\nvideo-lotes.json actualizado${avisos ? ` · ${avisos} aviso(s)` : ""}`);
