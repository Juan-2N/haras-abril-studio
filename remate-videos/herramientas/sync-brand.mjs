// Copia brand/ (tokens, fuentes, logos) y los assets indicados dentro de una pieza.
// HyperFrames no lee archivos fuera de la carpeta de la pieza, así que cada
// composición lleva su copia. La fuente de verdad sigue siendo brand/ en la raíz:
// nunca editar la copia; editar brand/ y volver a correr este script.
//
// Uso (desde remate-videos/):
//   node herramientas/sync-brand.mjs composiciones/<pieza> [assets/clips/x.mp4 ...]

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [piece, ...assets] = process.argv.slice(2);
if (!piece) {
  console.error("Uso: node herramientas/sync-brand.mjs composiciones/<pieza> [assets/...]");
  process.exit(1);
}
const dest = resolve(root, piece);
if (!existsSync(join(dest, "hyperframes.json"))) {
  console.error(`No es una pieza HyperFrames: ${dest}`);
  process.exit(1);
}

const brandItems = ["tokens.css", "fonts", "logos/PNG"];
for (const item of brandItems) {
  const from = join(root, "brand", item);
  if (!existsSync(from)) continue;
  cpSync(from, join(dest, "brand", item), { recursive: true });
  console.log(`brand/${item} → ${piece}/brand/${item}`);
}

for (const asset of assets) {
  const from = resolve(root, asset);
  if (!existsSync(from)) {
    console.error(`No existe: ${asset}`);
    process.exitCode = 1;
    continue;
  }
  const to = join(dest, asset); // conserva la ruta: assets/clips/x.mp4
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`${asset} → ${piece}/${asset}`);
}
