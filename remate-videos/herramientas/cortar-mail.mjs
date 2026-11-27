// Mail en cortes: exporta cada <section> de un diseño HTML a JPG (al doble de resolución)
// y arma el HTML del mail con una tabla de imágenes, cada una con su link (data-href) y su alt (data-alt).
//
// Uso (desde remate-videos/):
//   node herramientas/cortar-mail.mjs <diseno.html> <carpeta-salida> [--prefijo emkt-xxx] [--base https://.../] [--titulo "Asunto"] [--pre "Preencabezado"] [--urls u1,u2,...]
//
// Sale: <carpeta>/cortes/NN.jpg y <carpeta>/mail.html.
// Con --prefijo (desde el 27/11, para todo mail nuevo): <carpeta>/<prefijo>-NN.jpg y <carpeta>/<prefijo>.html, todo en la misma carpeta.
//   Los nombres no se repiten entre mails (en Mailchimp, 01.jpg de un mail pisaba al de otro) y el HTML
//   funciona igual desde la carpeta o desde el ZIP del hub, que guarda los archivos sin subcarpetas.
// Sin --base, las imágenes quedan con ruta relativa (cortes/NN.jpg o <prefijo>-NN.jpg): sirve para revisar en local.
// Para enviar, subir los cortes a un hosting público y volver a correr con --base <url de la carpeta> o --urls.

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs";
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
const prefijo = opt("--prefijo");
const [diseno, salida] = args;
if (!diseno || !salida) {
  console.error("Uso: node herramientas/cortar-mail.mjs <diseno.html> <carpeta-salida> [--prefijo emkt-xxx] [--base url] [--titulo txt] [--pre txt] [--urls u1,u2,...]");
  process.exit(1);
}
if (prefijo && !/^[a-z0-9-]+$/.test(prefijo)) {
  console.error(`Prefijo inválido "${prefijo}": solo minúsculas, números y guiones.`);
  process.exit(1);
}

const ANCHO = 600;
const dirCortes = prefijo ? salida : join(salida, "cortes");
const nombreCorte = (i) => `${prefijo ? prefijo + "-" : ""}${String(i + 1).padStart(2, "0")}.jpg`;
const nombreHtml = prefijo ? `${prefijo}.html` : "mail.html";
if (prefijo) {
  // Solo se borran los cortes viejos de este prefijo: la carpeta tiene también el .txt y la vista completa
  mkdirSync(salida, { recursive: true });
  const viejo = new RegExp(`^${prefijo}-\\d+\\.jpg$`);
  for (const f of readdirSync(salida)) if (viejo.test(f)) rmSync(join(salida, f));
} else {
  rmSync(dirCortes, { recursive: true, force: true });
  mkdirSync(dirCortes, { recursive: true });
}

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
    const nombre = nombreCorte(i);
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

const src = (n, i) => urls[i] || (base ? base.replace(/\/?$/, "/") : prefijo ? "" : "cortes/") + n;
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
writeFileSync(join(salida, nombreHtml), html);
console.log(`✓ ${join(salida, nombreHtml)} (${filas.length} cortes)`);
