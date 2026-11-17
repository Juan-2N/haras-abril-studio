// Exporta una página HTML estática (mailing, flyer) a PNG de página completa.
// Usa el Playwright instalado en el repo Dev y el Edge del sistema.
//
// Uso (desde remate-videos/):
//   node herramientas/exportar-png.mjs <pagina.html> <salida.png> [ancho=1200]

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire("W:/HARAS ABRIL/Dev/package.json");
const { chromium } = require("playwright");

const [pagina, salida, ancho = "1200"] = process.argv.slice(2);
if (!pagina || !salida) {
  console.error("Uso: node herramientas/exportar-png.mjs <pagina.html> <salida.png> [ancho]");
  process.exit(1);
}

const browser = await chromium.launch({ channel: "msedge" });
try {
  const page = await browser.newPage({ viewport: { width: Number(ancho), height: 800 } });
  await page.goto(pathToFileURL(resolve(pagina)).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // Todas las imágenes cargadas antes de capturar (mismo problema que en los renders)
  const rotas = await page.evaluate(() => [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src));
  if (rotas.length) throw new Error(`Imágenes que no cargaron:\n  ${rotas.join("\n  ")}`);
  mkdirSync(dirname(resolve(salida)), { recursive: true });
  await page.screenshot({ path: salida, fullPage: true });
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`✓ ${salida} (${ancho}×${alto})`);
} finally {
  await browser.close();
}
