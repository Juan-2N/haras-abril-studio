// Mail en cortes: exporta cada <section> de un diseño HTML a JPG (al doble de resolución)
// y arma el HTML del mail con una tabla de imágenes, cada una con su link (data-href) y su alt (data-alt).
//
// Uso (desde remate-videos/):
//   node herramientas/cortar-mail.mjs <diseno.html> <carpeta-salida> [--base https://.../] [--titulo "Asunto"] [--pre "Preencabezado"] [--urls u1,u2,...]
//
// Sale: <carpeta>/cortes/NN.jpg y <carpeta>/mail.html.
// Sin --base, las imágenes quedan con ruta relativa (cortes/NN.jpg): sirve para revisar en local.
// Para enviar, subir la carpeta cortes/ a un hosting público y volver a correr con --base <url de la carpeta>.

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire("W:/HARAS ABRIL/Dev/package.json");
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const opt = (n, d = "") => { const i = args.indexOf(n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const base = opt("--base");
// --urls: una URL por corte, en orden y separadas por coma (p. ej. las de Mailchimp). Las vacías quedan con ruta relativa.
const urls = opt("--urls").split(",").map((u) => u.trim());
const titulo = opt("--titulo", "Haras Abril");
const pre = opt("--pre");
const [diseno, salida] = args;
if (!diseno || !salida) {
  console.error("Uso: node herramientas/cortar-mail.mjs <diseno.html> <carpeta-salida> [--base url] [--titulo txt] [--pre txt]");
  process.exit(1);
}

const ANCHO = 600;
const dirCortes = join(salida, "cortes");
rmSync(dirCortes, { recursive: true, force: true });
mkdirSync(dirCortes, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const browser = await chromium.launch({ channel: "msedge" });
const filas = [];
let fondo = "#2B2B2B";
try {
  const page = await browser.newPage({ viewport: { width: ANCHO, height: 800 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(resolve(diseno)).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const rotas = await page.evaluate(() => [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src));
  if (rotas.length) throw new Error(`Imágenes que no cargaron:\n  ${rotas.join("\n  ")}`);
  fondo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  const secciones = await page.$$("body > section");
  for (const [i, s] of secciones.entries()) {
    const nombre = `${String(i + 1).padStart(2, "0")}.jpg`;
    const caja = await s.boundingBox();
    // Alto entero en px de 600: evita líneas finas entre cortes
    const alto = Math.round(caja.height);
    await s.screenshot({ path: join(dirCortes, nombre), type: "jpeg", quality: 88, clip: undefined });
    const href = await s.getAttribute("data-href");
    const alt = (await s.getAttribute("data-alt")) || "";
    filas.push({ nombre, alto, href, alt });
    console.log(`  ${nombre}  ${ANCHO}×${alto}${href ? "  → " + href : ""}`);
  }
} finally {
  await browser.close();
}

const src = (n, i) => urls[i] || (base ? base.replace(/\/?$/, "/") : "cortes/") + n;
const celdas = filas.map(({ nombre, alto, href, alt }, i) => {
  const img = `<img src="${src(nombre, i)}" width="${ANCHO}" height="${alto}" alt="${esc(alt)}" style="display:block;width:${ANCHO}px;max-width:100%;height:auto;border:0;outline:none;color:#FEDBA3;font-family:Arial,sans-serif;font-size:14px;" />`;
  return `        <tr><td style="padding:0;line-height:0;font-size:0;">${href ? `<a href="${esc(href)}" target="_blank">${img}</a>` : img}</td></tr>`;
}).join("\n");

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(titulo)}</title>
</head>
<body style="margin:0;padding:0;background:${fondo};">
${pre ? `  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(pre)}</div>\n` : ""}  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${fondo};">
    <tr><td align="center">
      <table role="presentation" width="${ANCHO}" cellpadding="0" cellspacing="0" border="0" style="width:${ANCHO}px;max-width:100%;">
${celdas}
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
writeFileSync(join(salida, "mail.html"), html);
console.log(`✓ ${join(salida, "mail.html")} (${filas.length} cortes)`);
