// Exporta una página HTML estática a PDF, respetando el @page del HTML (tamaño y saltos de página).
// Usa el Playwright instalado en el repo Dev y el Edge del sistema.
//
// Uso (desde remate-videos/):
//   node herramientas/exportar-pdf.mjs <pagina.html> <salida.pdf>

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire("W:/HARAS ABRIL/Dev/package.json");
const { chromium } = require("playwright");

const [pagina, salida] = process.argv.slice(2);
if (!pagina || !salida) {
  console.error("Uso: node herramientas/exportar-pdf.mjs <pagina.html> <salida.pdf>");
  process.exit(1);
}

const browser = await chromium.launch({ channel: "msedge" });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve(pagina)).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // Todas las imágenes cargadas antes de exportar (mismo problema que en los renders)
  const rotas = await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().then(() => null, () => i.src))).then((r) => r.filter(Boolean)));
  if (rotas.length) throw new Error(`Imágenes que no cargaron:\n  ${rotas.join("\n  ")}`);
  // Ninguna página puede desbordar (texto que no entra en la hoja)
  const desbordes = await page.evaluate(() => [...document.querySelectorAll(".pagina")].flatMap((p, i) => {
    const caja = p.getBoundingClientRect();
    const fuera = [...p.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().bottom > caja.bottom + 0.5 || e.scrollHeight > e.clientHeight + 1 && getComputedStyle(e).overflow === "hidden");
    return p.scrollHeight > p.clientHeight + 1 || fuera.length ? [`página ${i + 1} (${p.scrollHeight - p.clientHeight} px de más)`] : [];
  }));
  if (desbordes.length) throw new Error(`El contenido no entra en:\n  ${desbordes.join("\n  ")}`);
  mkdirSync(dirname(resolve(salida)), { recursive: true });
  await page.pdf({ path: salida, preferCSSPageSize: true, printBackground: true });
  const paginas = await page.evaluate(() => document.querySelectorAll(".pagina").length);
  console.log(`✓ ${salida} (${paginas} páginas)`);
} finally {
  await browser.close();
}
