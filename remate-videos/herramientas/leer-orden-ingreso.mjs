// Lee el PDF de "Orden de ingreso" que manda el concurso y escribe los datos para la pieza.
// Toma el texto con pdftotext -table (Xpdf, ya instalado) y separa las columnas por los espacios.
//
// Uso (desde remate-videos/):
//   node herramientas/leer-orden-ingreso.mjs <orden.pdf> <carpeta-de-la-pieza> [Día] [DD.MM.AAAA]
// Ejemplo:
//   node herramientas/leer-orden-ingreso.mjs "videosreferencias/orden-ingreso/Orden de ingreso SÁBADO 28-11-26 (Haras Abril).pdf" pdf/26-11-HA-OrdenIngresoSabado
//
// Escribe <carpeta>/datos.js. Si una fila no se entiende, la lista y no escribe nada.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const [pdf, carpeta, diaArg, fechaArg] = process.argv.slice(2);
if (!pdf || !carpeta) {
  console.error("Uso: node herramientas/leer-orden-ingreso.mjs <orden.pdf> <carpeta-de-la-pieza> [Día] [DD.MM.AAAA]");
  process.exit(1);
}

const texto = execFileSync("pdftotext", ["-table", "-enc", "UTF-8", pdf, "-"], { encoding: "utf8" });
const CATS = ["1RA", "2DA", "3MY", "3MN", "AMT"];
const ORDINAL = { 1: "1.ª", 2: "2.ª", 3: "3.ª" };
const NIVEL = { PRIMERA: "1.ª", SEGUNDA: "2.ª", TERCERA: "3.ª" };

const pruebas = new Map();
const problemas = [];
let dia = diaArg, fecha = fechaArg;

for (const [i, pagina] of texto.split("\f").entries()) {
  if (!pagina.trim()) continue;
  const lineas = pagina.split(/\r?\n/);
  const cab = lineas.join("\n");
  const mP = cab.match(/Prueba N\S*\s+(\d+)\s+Alt\.:\s*([\d.]+)/);
  if (!mP) { problemas.push(`página ${i + 1}: sin "Prueba N°"`); continue; }
  const n = Number(mP[1]);
  if (!pruebas.has(n)) {
    const mDef = cab.match(/Definici\S+:\s+(\S+)/);
    const mCat = cab.match(/Categor\S+:\s+(.+?)\s{2,}(\S+)\s+(\d{2})\/(\d{2})\/(\d{4})/);
    const mCamp = cab.replace(/\s+/g, " ").match(/(\d)\S* Prueba Campeonato "(\w)" ([\d./]+) mts\. \(Pbas?\. (\d+) y (\d+)\) - Copa (.+?) N°/);
    if (!mCat) problemas.push(`prueba ${n}: no encontré la categoría y la fecha`);
    if (mCat && !dia) dia = mCat[2][0].toUpperCase() + mCat[2].slice(1).toLowerCase();
    if (mCat && !fecha) fecha = `${mCat[3]}.${mCat[4]}.${mCat[5]}`;
    pruebas.set(n, {
      n,
      altura: mP[2].replace(".", ","),
      def: mDef?.[1] ?? "",
      // "SEGUNDA - TERCERA My/Mn - AMATEUR" → "2.ª - 3.ª Mayor/Menor - Amateur" (como en el anteprograma)
      categoria: (mCat?.[1] ?? "").split(" - ").map((p) => p.replace(/^(PRIMERA|SEGUNDA|TERCERA)/, (m) => NIVEL[m])
        .replace("My/Mn", "Mayor/Menor").replace("AMATEUR", "Amateur")).join(" - "),
      campeonato: mCamp ? {
        orden: ORDINAL[mCamp[1]] ?? `${mCamp[1]}.ª`,
        letra: mCamp[2],
        altura: mCamp[3].replace(/\./g, ",").replace("/", " / "),
        pruebas: `${mCamp[4]} y ${mCamp[5]}`,
        copa: mCamp[6].trim(),
      } : null,
      binomios: [],
    });
  }
  const prueba = pruebas.get(n);

  // Filas: "N  JINETE  CABALLO  CAT  CLUB  CAMP". Una fila con el club en dos renglones viene partida:
  // el renglón de arriba sin número (jinete, caballo, club) y el de abajo con número, categoría, resto del club y camp.
  let partida = null;
  for (const linea of lineas) {
    const m = linea.match(/^(\d+)\s{2,}(.+)$/) ?? linea.match(/^(\d+)\s*$/);
    if (!m) {
      const campos = linea.trim().split(/\s{2,}/);
      if (/^\s{2,}[A-ZÑÜ]/.test(linea) && campos.length === 3 && !/Prueba|Campeonato/.test(linea)) partida = campos;
      continue;
    }
    let campos = (m[2] ?? "").trim().split(/\s{2,}/).filter(Boolean);
    if (partida && campos.length === 3 && CATS.includes(campos[0])) {
      campos = [partida[0], partida[1], campos[0], `${partida[2]} ${campos[1]}`, campos[2]];
    }
    partida = null;
    // Caballo largo pegado a la categoría: "LA CAPRICHOSA BLOOD MOON 2DA" o "...SCHAARBROEK Z2DA"
    if (campos.length === 4) {
      const pegada = campos[1].match(new RegExp(`^(.+?)\\s*(${CATS.join("|")})$`));
      if (pegada) campos = [campos[0], pegada[1], pegada[2], campos[2], campos[3]];
    }
    if (campos.length !== 5 || !CATS.includes(campos[2])) {
      problemas.push(`prueba ${n}, fila ${m[1]}: ${linea.trim()}`);
      continue;
    }
    prueba.binomios.push([Number(m[1]), ...campos]);
  }
}

// Controles: números correlativos desde 1 en cada prueba
for (const p of pruebas.values()) {
  p.binomios.forEach((b, i) => { if (b[0] !== i + 1) problemas.push(`prueba ${p.n}: falta o sobra el número ${i + 1} (vino ${b[0]})`); });
}
if (problemas.length) {
  console.error(`No se escribió nada. Revisar:\n  ${problemas.join("\n  ")}`);
  process.exit(1);
}

const lista = [...pruebas.values()].sort((a, b) => a.n - b.n);
const salida = `// Orden de ingreso del ${dia} ${fecha}. Generado por herramientas/leer-orden-ingreso.mjs desde:
//   ${pdf.replace(/\\/g, "/")}
// Se puede corregir a mano; si llega un PDF nuevo, volver a correr el script (pisa este archivo).
// binomios: [número, jinete, caballo, categoría, club / país, campeonato]

window.ORDEN = ${JSON.stringify({ dia, fecha, pruebas: lista }, null, 2)
  .replace(/\[\n\s+(\d+),\n\s+("[^"]*"),\n\s+("[^"]*"),\n\s+("[^"]*"),\n\s+("[^"]*"),\n\s+("[^"]*")\n\s+\]/g, "[$1, $2, $3, $4, $5, $6]")};
`;
writeFileSync(join(carpeta, "datos.js"), salida);
console.log(`✓ ${join(carpeta, "datos.js")}: ${dia} ${fecha} · ${lista.map((p) => `prueba ${p.n}: ${p.binomios.length}`).join(" · ")}`);
