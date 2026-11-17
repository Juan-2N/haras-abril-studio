// Restaura en cada pieza las copias de assets/ y brand/ que no van a git.
//
// HyperFrames no lee fuera de la carpeta de la pieza, así que cada composición
// lleva su copia de fotos, clips, música, fuentes y logos. Esas copias están en
// .gitignore: después de clonar el repo (y de pegar assets/ en remate-videos/),
// este script las vuelve a armar leyendo qué archivos usa cada pieza.
//
// Uso (desde remate-videos/):
//   node herramientas/restaurar-assets.mjs              → todas las piezas
//   node herramientas/restaurar-assets.mjs <pieza> ...  → solo esas (nombre de carpeta)
//   --pisar  → vuelve a copiar aunque el archivo ya exista en la pieza
//
// No toca brand/tokens.css de las piezas: cada una tiene su versión (v1 o v2).

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const pisar = args.includes("--pisar");
const pedidas = args.filter((a) => !a.startsWith("--"));

if (!existsSync(join(root, "assets"))) {
  console.error("No existe remate-videos/assets/. Copiala primero (pendrive / Drive).");
  process.exit(1);
}

// Piezas: carpetas con hyperframes.json en composiciones/ y composiciones/_archivo/
const base = join(root, "composiciones");
const piezas = [];
for (const dir of [base, join(base, "_archivo")]) {
  if (!existsSync(dir)) continue;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (existsSync(join(p, "hyperframes.json"))) piezas.push(p);
  }
}
const elegidas = pedidas.length
  ? piezas.filter((p) => pedidas.some((x) => p.endsWith(x.replace(/[\\/]+$/, "").split(/[\\/]/).pop())))
  : piezas;
if (pedidas.length && !elegidas.length) {
  console.error("No encontré esas piezas en composiciones/.");
  process.exit(1);
}

const SALTEAR = new Set(["assets", "brand", "node_modules", "renders", "snapshots"]);
const REF = /(?:^|[^A-Za-z0-9_])((?:assets|brand)\/[A-Za-z0-9_\-./]+\.[A-Za-z0-9]{2,5})/g;

function textos(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n.startsWith(".") || SALTEAR.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) textos(p, out);
    else if (/\.(html|css|js|mjs|json)$/i.test(n)) out.push(p);
  }
  return out;
}

function copiar(desde, hasta) {
  if (!pisar && existsSync(hasta)) return false;
  mkdirSync(dirname(hasta), { recursive: true });
  cpSync(desde, hasta, { recursive: true, force: pisar });
  return true;
}

let copiados = 0;
const faltan = new Map(); // ref → piezas

for (const pieza of elegidas) {
  const nombre = pieza.slice(base.length + 1);
  let n = 0;

  // 1) Lo mismo que copia sync-brand.mjs (sin tokens.css)
  for (const item of ["fonts", "logos/PNG"]) {
    const desde = join(root, "brand", item);
    if (!existsSync(desde)) continue;
    for (const f of readdirSync(desde)) {
      if (copiar(join(desde, f), join(pieza, "brand", item, f))) n++;
    }
  }

  // 2) Todo assets/… o brand/… que mencionen los HTML/CSS/JS/JSON de la pieza
  const refs = new Set();
  for (const f of textos(pieza)) {
    for (const m of readFileSync(f, "utf8").matchAll(REF)) refs.add(m[1]);
  }
  for (const ref of refs) {
    const destino = join(pieza, ref);
    const fuente = join(root, ref);
    if (existsSync(fuente)) {
      if (copiar(fuente, destino)) n++;
    } else if (!existsSync(destino)) {
      if (!faltan.has(ref)) faltan.set(ref, []);
      faltan.get(ref).push(nombre);
    }
  }

  copiados += n;
  console.log(`${n ? "✔" : "·"} ${nombre}${n ? `  (${n} archivos)` : ""}`);
}

console.log(`\n${copiados} archivos copiados en ${elegidas.length} piezas.`);
if (faltan.size) {
  console.log(`\nReferencias que no están ni en la raíz ni en la pieza (${faltan.size}):`);
  for (const [ref, ps] of faltan) console.log(`  ${ref}  ←  ${ps.slice(0, 3).join(", ")}${ps.length > 3 ? ` y ${ps.length - 3} más` : ""}`);
  console.log("Pueden ser restos de versiones viejas (revisar si la pieza las usa) o material que falta pasar.");
}
