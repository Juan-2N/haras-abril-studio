// Exporta cada placa (.slide[data-nombre]) de una página HTML estática a un PNG de su tamaño exacto.
// Usa el Playwright instalado en el repo Dev y el Edge del sistema.
//
// Uso (desde remate-videos/):
//   node herramientas/exportar-slides.mjs <pagina.html> <carpeta-salida>
//   → <carpeta-salida>/<data-nombre>.png por cada placa

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire("W:/HARAS ABRIL/Dev/package.json");
const { chromium } = require("playwright");

const [pagina, carpeta] = process.argv.slice(2);
if (!pagina || !carpeta) {
  console.error("Uso: node herramientas/exportar-slides.mjs <pagina.html> <carpeta-salida>");
  process.exit(1);
}

const browser = await chromium.launch({ channel: "msedge" });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(pathToFileURL(resolve(pagina)).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // Todas las imágenes cargadas antes de capturar (mismo problema que en los renders)
  const rotas = await page.evaluate(() => [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src));
  if (rotas.length) throw new Error(`Imágenes que no cargaron:\n  ${rotas.join("\n  ")}`);
  // Ninguna placa puede desbordar su zona de contenido
  const desbordes = await page.evaluate(() => [...document.querySelectorAll(".slide")].flatMap((s) => {
    const z = s.querySelector(".zona");
    return z && z.scrollHeight > z.clientHeight + 1 ? [`${s.dataset.nombre} (${z.scrollHeight - z.clientHeight} px de más)`] : [];
  }));
  if (desbordes.length) throw new Error(`El contenido no entra en:\n  ${desbordes.join("\n  ")}`);

  mkdirSync(resolve(carpeta), { recursive: true });
  const slides = await page.$$(".slide[data-nombre]");
  for (const s of slides) {
    const nombre = await s.getAttribute("data-nombre");
    const destino = join(resolve(carpeta), `${nombre}.png`);
    // Recorte de la página completa: la captura por elemento (s.screenshot) dejaba en negro
    // la parte de una placa que caía fuera de la ventana (pasó el 25/11 con el 9:16 debajo del 4:5).
    const caja = await s.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { x: b.left + window.scrollX, y: b.top + window.scrollY, width: b.width, height: b.height };
    });
    await page.screenshot({ path: destino, fullPage: true, clip: caja });
    console.log(`✓ ${nombre}.png (${caja.width}×${caja.height})`);
  }
} finally {
  await browser.close();
}
