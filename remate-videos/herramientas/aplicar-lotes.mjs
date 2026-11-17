// Aplica los datos de herramientas/lotes.json a los slides de lista del carrusel.
// Para cada slide deja exactamente las tarjetas del reparto (1 a 4):
// - reescribe el data-variable-values de las que existen;
// - agrega las que faltan, copiando el div y la regla #lote-N del slide 01 del
//   mismo formato (que siempre tiene las 4, con sus tiempos en cascada);
// - quita las que sobran (div + regla CSS).
//
// Uso (desde remate-videos/):
//   node herramientas/aplicar-lotes.mjs [prefijo=22-10-HA-ListaRemate]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prefijo = process.argv[2] || "22-10-HA-ListaRemate";
const datos = JSON.parse(readFileSync(join(root, "herramientas", "lotes.json"), "utf8"));
const porNumero = new Map(datos.lotes.map((l) => [l.lote, l]));

// El div de la tarjeta (el Studio puede agregarle data-hf-id y otros atributos)
const reDiv = (i) => new RegExp(`\\n?[ \\t]*<div[^>]*\\bid="lote-${i}"[^>]*>\\s*</div>`);
const reRegla = (i) => new RegExp(`\\n?[ \\t]*#lote-${i} \\{[^}]*\\}`);

const ruta = (pieza) => join(root, "composiciones", pieza, "index.html");

let errores = 0;
for (const formato of ["9x16", "4x5"]) {
  // Molde: el slide 01 de este formato, con las 4 tarjetas
  const molde = readFileSync(ruta(`${prefijo}-${formato}-01`), "utf8");
  const moldeDiv = (i) => molde.match(reDiv(i))?.[0];
  const moldeRegla = (i) => molde.match(reRegla(i))?.[0];

  for (const [slide, numeros] of Object.entries(datos.carrusel)) {
    if (slide.startsWith("_")) continue;
    const pieza = `${prefijo}-${formato}-${slide}`;
    if (!existsSync(ruta(pieza))) { console.error(`✗ falta ${pieza}`); errores++; continue; }
    let s = readFileSync(ruta(pieza), "utf8");

    for (let i = 1; i <= 4; i++) {
      const lote = porNumero.get(numeros[i - 1]);
      let div = s.match(reDiv(i))?.[0];

      if (!lote) {
        // Sobra: se quita la tarjeta y su posición
        if (div) s = s.replace(div, "");
        s = s.replace(reRegla(i), "");
        continue;
      }

      if (!div) {
        // Falta: se copia del molde, después de la tarjeta anterior
        const nuevoDiv = moldeDiv(i);
        const nuevaRegla = moldeRegla(i);
        const anterior = s.match(reDiv(i - 1))?.[0];
        const reglaAnterior = s.match(reRegla(i - 1))?.[0];
        if (!nuevoDiv || !nuevaRegla || !anterior || !reglaAnterior) {
          console.error(`✗ ${pieza}: no se pudo agregar la tarjeta ${i}`); errores++; continue;
        }
        s = s.replace(anterior, anterior + nuevoDiv);
        if (!reRegla(i).test(s)) s = s.replace(reglaAnterior, reglaAnterior + nuevaRegla);
        div = nuevoDiv;
      }

      const valores = JSON.stringify(lote).replaceAll("'", "&#39;");
      s = s.replace(div, div.replace(/data-variable-values='[^']*'/, `data-variable-values='${valores}'`));
    }
    writeFileSync(ruta(pieza), s, "utf8");
    console.log(`✓ ${pieza}: lotes ${numeros.join(", ")}`);
  }
}

// Copia para las piezas estáticas (PDF, mailing), que no pueden leer JSON por file://
writeFileSync(join(root, "herramientas", "lotes-datos.js"),
  `// Generado por aplicar-lotes.mjs a partir de lotes.json. No editar a mano.\nwindow.LOTES_DATOS = ${JSON.stringify(datos, null, 2)};\n`, "utf8");
console.log("✓ herramientas/lotes-datos.js");

process.exit(errores ? 1 : 0);
