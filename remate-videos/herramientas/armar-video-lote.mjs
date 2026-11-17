// Arma (o vuelve a armar) el video de cada lote a partir de la plantilla aprobada, la opción D.
//
// Por cada lote:
// - copia la plantilla a composiciones/00-00-HA-VideoLote-16x9-NN/;
// - le pone los datos del lote: herramientas/lotes.json (nombre, sangre, sexo, pelo, AAFE,
//   nacimiento) y herramientas/video-lotes.json (árbol de pedigrí y arranque de cada clip);
// - apunta clips y fotos al material del lote (convención de nombres abajo). Si falta un
//   archivo, usa el del lote 01 y lo anota en FALTA.txt dentro de la pieza;
// - si existe assets/clips/loteNN-cabeza.mp4, la intro va con ese clip de fondo en lugar de la foto;
// - copia brand/ y el material con sync-brand.mjs;
// - genera el manifiesto entregas/00-00-HA-VideoLote-NN.json (no publica).
//
// Material por lote (en assets/, NN con dos dígitos):
//   clips/loteNN-slow.mp4        escena 1, salto en cámara lenta
//   clips/loteNN-cabeza.mp4      intro (opcional; sin él va la foto)
//   clips/loteNN-trote.mp4       lateral izquierdo
//   clips/loteNN-slow-trote.mp4  lateral derecho
//   clips/loteNN-salto1.mp4      salto 1
//   clips/loteNN-salto2.mp4      salto 2
//   fotos/loteNN-cabeza.jpg      intro
//   fotos/loteNN-pedigri.jpg     panel de la placa de pedigrí
//   fotos/loteNN-cuerpo.jpg      placa body
//   fotos/loteNN-salto.jpg       cierre
// Comunes a todos: clips/video-lote-dron-remate.mp4 y clips/video-lote-dron-pedigri.mp4.
//
// OJO: vuelve a escribir los HTML de la pieza. Lo que se haya cambiado a mano o en el Studio
// dentro de una pieza de lote se pierde: los cambios de diseño van en la plantilla.
//
// Uso (desde remate-videos/):
//   node herramientas/armar-video-lote.mjs [NN ...]     (sin argumentos: los 13)

import { readFileSync, writeFileSync, existsSync, cpSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MOLDE = "00-00-HA-VideoLoteD-16x9-01";
const moldeDir = join(root, "composiciones", MOLDE);
const base = JSON.parse(readFileSync(join(root, "herramientas", "lotes.json"), "utf8"));
const video = JSON.parse(readFileSync(join(root, "herramientas", "video-lotes.json"), "utf8"));
const datosVideo = new Map(video.lotes.map((l) => [l.lote, l]));

// Material de la plantilla → material del lote. `id` es el <video> del index que lo usa.
const CLIPS = [
  { molde: "assets/clips/lote01c-salto-slow.mp4", clave: "slow", id: "v-slow" },
  { molde: "assets/clips/lote01c-slow-trote.mp4", clave: "slow-trote", id: "v-right", inicio: "slowTrote" },
  { molde: "assets/clips/lote01c-trote.mp4", clave: "trote", id: "v-left" },
  { molde: "assets/clips/lote01c-salto1.mp4", clave: "salto1", id: "v-salto1" },
  { molde: "assets/clips/lote01c-salto2.mp4", clave: "salto2", id: "v-salto2" },
];
const COMUNES = [
  ["assets/clips/lote01d-dron-remate.mp4", "assets/clips/video-lote-dron-remate.mp4"],
  ["assets/clips/lote01d-dron-pedigri.mp4", "assets/clips/video-lote-dron-pedigri.mp4"],
];
const FOTOS = [
  { archivo: "placa-intro.html", molde: "assets/fotos/lote01b-cabeza.jpg", clave: "cabeza" },
  { archivo: "placa-blood.html", molde: "assets/fotos/lote01c-cabeza.jpg", clave: "pedigri" },
  { archivo: "placa-body.html", molde: "assets/fotos/lote01b-cuerpo.jpg", clave: "cuerpo" },
  { archivo: "placa-cierre.html", molde: "assets/fotos/lote01b-salto.jpg", clave: "salto" },
];
const FIJOS = ["assets/logos/shine-linea.png", "assets/musica/battleborn-symphony.mp3"];

// Valor de atributo entre comillas simples: el JSON no puede llevar ' sin escapar
const atributo = (obj) => JSON.stringify(obj).replace(/'/g, "&#39;");
const reVars = (id) => new RegExp(`(<div[^>]*\\bid="${id}"[^>]*\\bdata-variable-values=')([^']*)(')`);
const reVideo = (id) => new RegExp(`(<video[^>]*\\bid="${id}"[^>]*\\bdata-media-start=")([^"]*)(")`);

// Cambia un atributo del elemento con ese id (cualquier etiqueta, cualquier orden de atributos)
function setAtributo(s, id, attr, valor) {
  const re = new RegExp(`(<[a-z]+(?=[^>]*\\bid="${id}")[^>]*\\b${attr}=")[^"]*(")`);
  return reemplazar(s, re, (_, a, b) => a + valor + b, `${attr} de #${id}`);
}

const duracionClip = (ruta) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ruta]).toString());

function reemplazar(s, re, fn, que) {
  if (!re.test(s)) throw new Error(`no encontré ${que}`);
  return s.replace(re, fn);
}

const pedidos = process.argv.slice(2).map((n) => n.padStart(2, "0"));
const lotes = base.lotes.filter((l) => !pedidos.length || pedidos.includes(l.lote));
if (!lotes.length) { console.error("No hay lotes con esos números"); process.exit(1); }

const resumen = [];
for (const l of lotes) {
  const nn = l.lote;
  const v = datosVideo.get(nn);
  if (!v || v.arbol?.length !== 14) throw new Error(`Lote ${nn}: falta el árbol en video-lotes.json (correr bajar-pedigri.mjs)`);
  const pieza = `00-00-HA-VideoLote-16x9-${nn}`;
  const dest = join(root, "composiciones", pieza);
  const faltan = [];

  // Material del lote, o el del 01 si todavía no llegó
  const material = (tipo, clave, ext) => {
    const propio = `assets/${tipo}/lote${nn}-${clave}.${ext}`;
    if (existsSync(join(root, propio))) return propio;
    faltan.push(propio);
    return `assets/${tipo}/lote01-${clave}.${ext}`;
  };

  // 1. Copia de la plantilla
  mkdirSync(dest, { recursive: true });
  for (const f of ["index.html", "hyperframes.json", "package.json"]) cpSync(join(moldeDir, f), join(dest, f));
  cpSync(join(moldeDir, "compositions"), join(dest, "compositions"), { recursive: true });
  const rutaMeta = join(dest, "meta.json");
  const creado = existsSync(rutaMeta) ? JSON.parse(readFileSync(rutaMeta, "utf8")).createdAt : new Date().toISOString();
  writeFileSync(rutaMeta, JSON.stringify({ id: pieza, name: pieza, createdAt: creado }, null, 2) + "\n");

  // 2. Datos
  const sangre = l.pedigri;
  const nombre = l.nombre;
  const inicio = { ...video.inicioPorDefecto, ...(v.inicio || {}) };
  let s = readFileSync(join(dest, "index.html"), "utf8");
  s = s.replace(/<title>[^<]*<\/title>/, `<title>${pieza}</title>`);
  s = reemplazar(s, reVars("intro"), (_, a, __, c) => a + atributo({ lote: nn, nombre, sangre }) + c, "intro");
  s = reemplazar(s, reVars("cierre"), (_, a, __, c) => a + atributo({ lote: nn, nombre, sangre }) + c, "cierre");
  s = reemplazar(s, reVars("blood"), (_, a, __, c) => a + atributo({ pedigri: v.arbol.join("|"), destacados: "0|4|12" }) + c, "blood");
  s = reemplazar(s, reVars("body"), (_, a, __, c) => a + atributo({
    nombre, sangre,
    sexo: l.sexo.toLowerCase().startsWith("h") ? "H" : "M",
    pelo: l.pelo || "—", aafe: l.registro || "—", nac: l.nac || "—",
  }) + c, "body");
  s = reemplazar(s, reVars("footer"), (_, a, b, c) => {
    const actual = JSON.parse(b.replace(/&#39;/g, "'"));
    return a + atributo({ ...actual, lote: nn, nombre, sangre }) + c;
  }, "footer");

  // 3. Clips
  const usados = [...FIJOS];
  const avisos = [];
  const disponible = {};
  for (const [viejo, nuevo] of COMUNES) { s = s.split(viejo).join(nuevo); usados.push(nuevo); }
  for (const c of CLIPS) {
    const nuevo = material("clips", c.clave, "mp4");
    if (!s.includes(c.molde)) throw new Error(`${pieza}: la plantilla no usa ${c.molde}`);
    s = s.split(c.molde).join(nuevo);
    usados.push(nuevo);
    const seg = inicio[c.inicio || c.clave] ?? 0;
    s = reemplazar(s, reVideo(c.id), (_, a, __, z) => a + seg + z, c.id);
    disponible[c.clave] = duracionClip(join(root, nuevo)) - seg;
  }

  // Cada escena tiene que entrar en lo que queda del clip desde su arranque
  for (const [clave, escena] of Object.entries({ slow: 3.93, trote: 2.55, "slow-trote": 6 })) {
    if (disponible[clave] < escena) avisos.push(`${clave}: el clip alcanza para ${disponible[clave].toFixed(2)} s y la escena dura ${escena} s`);
  }
  // Los dos saltos comparten 7,5 s (29,05 → 36,55). Si los clips son más cortos, los saltos duran
  // lo que dan los clips y el cierre arranca antes (y dura más), en lugar de congelar el último cuadro
  const cuadro = (t) => Math.floor(t * 30 + 1e-6) / 30;
  const d1 = cuadro(Math.min(3.4, disponible.salto1));
  const d2 = cuadro(Math.min(7.5 - d1, disponible.salto2));
  const r = (t) => +t.toFixed(3);
  const iniSalto2 = r(29.05 + d1), iniCierre = r(29.05 + d1 + d2);
  s = setAtributo(s, "v-salto1", "data-duration", r(d1));
  s = setAtributo(s, "v-salto2", "data-start", iniSalto2);
  s = setAtributo(s, "v-salto2", "data-duration", r(d2));
  s = setAtributo(s, "sello-clips", "data-duration", r(iniCierre - 20.5));
  s = setAtributo(s, "cierre", "data-start", iniCierre);
  s = setAtributo(s, "cierre", "data-duration", r(41.55 - iniCierre));
  if (iniCierre < 36.55) avisos.push(`saltos de ${r(d1)} + ${r(d2)} s: el cierre arranca en ${iniCierre} s`);

  // 4. Clip de cabeza en la intro, si existe: va debajo de la placa, que pasa a fondo transparente
  const clipCabeza = `assets/clips/lote${nn}-cabeza.mp4`;
  const conClipCabeza = existsSync(join(root, clipCabeza));
  if (conClipCabeza) {
    usados.push(clipCabeza);
    const marca = '      <div id="intro" class="placa"';
    if (!s.includes(marca)) throw new Error(`${pieza}: no encontré la intro`);
    s = s.replace(marca,
      `      <video id="v-cabeza" class="clip clip-video" src="${clipCabeza}" muted playsinline\n` +
      `             data-start="7.93" data-duration="3.57" data-media-start="${inicio.cabeza ?? 0}" data-track-index="0"></video>\n` + marca);
  }
  // 4b. Versión corta (video-lotes.json → "versionCorta": true): sin los dos saltos; el Salto 2 va de fondo en la placa Body
  // y de los trotes queda solo el RIGHT, con el lower third. BODY 16 · RIGHT 20.5 · CIERRE 26.5 → 31.5
  if (v.versionCorta) {
    const FIN = 31.5, CIERRE = 26.5;
    const quitarVideo = (t, id) => reemplazar(t, new RegExp(`\\s*<video id="${id}"[\\s\\S]*?</video>`), () => "", `#${id}`);
    for (const id of ["v-salto1", "v-salto2", "v-left"]) s = quitarVideo(s, id);
    // Fondo de Body: el Salto 2, salvo que el lote tenga su clip "body" (archivos.body e inicio.body)
    const propioBody = `assets/clips/lote${nn}-body.mp4`;
    const clipBody = existsSync(join(root, propioBody)) ? propioBody : `assets/clips/lote${nn}-salto2.mp4`;
    const inicioBody = clipBody === propioBody ? (inicio.body ?? 0) : (inicio.salto2 ?? 0);
    const marcaBody = '      <div id="body" class="placa"';
    if (!s.includes(marcaBody)) throw new Error(`${pieza}: no encontré la placa Body`);
    s = s.replace(marcaBody,
      `      <video id="v-body" class="clip clip-video" src="${clipBody}" muted playsinline\n` +
      `             data-start="16" data-duration="4.5" data-media-start="${inicioBody}" data-track-index="0"></video>\n` + marcaBody);
    usados.push(clipBody);
    s = setAtributo(s, "v-right", "data-start", 20.5);
    s = setAtributo(s, "footer", "data-duration", CIERRE - 4);
    s = setAtributo(s, "sello-clips", "data-duration", +(CIERRE - 20.5).toFixed(2));
    s = setAtributo(s, "cierre", "data-start", CIERRE);
    s = setAtributo(s, "cierre", "data-duration", +(FIN - CIERRE).toFixed(2));
    s = setAtributo(s, "root", "data-duration", FIN);
    s = setAtributo(s, "musica-battleborn", "data-duration", FIN);
    s = reemplazar(s, /\{"t":38\.55,"v":1\},\{"t":41\.45,"v":0\}/, () => `{"t":${+(FIN - 3).toFixed(2)},"v":1},{"t":${+(FIN - 0.1).toFixed(2)},"v":0}`, "el fundido de la música");
    s = reemplazar(s, /(ease: "power1\.in" \}, )40\.55/, (_, a) => `${a}${+(FIN - 1).toFixed(2)}`, "la salida a negro");
  }
  // 4c. Música propia del lote (video-lotes.json → "musica": "archivo.mp3", en assets/musica/)
  if (v.musica) {
    const pista = `assets/musica/${v.musica}`;
    if (!existsSync(join(root, pista))) throw new Error(`${pieza}: no existe ${pista}`);
    usados.push(pista);
    s = reemplazar(s, /src="assets\/musica\/battleborn-symphony\.mp3"/, () => `src="${pista}"`, "la pista de música");
    s = s.replace('id="musica-battleborn"', 'id="musica"');
    // "musicaInicio": segundo de la pista desde el que arranca
    if (v.musicaInicio) s = reemplazar(s, /(<audio id="musica"[^>]*?data-start="0")/, (_, a) => `${a} data-media-start="${v.musicaInicio}"`, "el inicio de la música");
  }
  writeFileSync(join(dest, "index.html"), s, "utf8");

  // 5. Fotos de las placas
  for (const f of FOTOS) {
    const ruta = join(dest, "compositions", f.archivo);
    let h = readFileSync(ruta, "utf8");
    // Con clip de cabeza, la foto de la intro no se ve: si falta, no se anota como faltante
    const antes = faltan.length;
    const nueva = material("fotos", f.clave, "jpg");
    if (f.clave === "cabeza" && conClipCabeza) faltan.length = antes;
    if (!h.includes(`../${f.molde}`)) throw new Error(`${pieza}: ${f.archivo} no usa ${f.molde}`);
    h = h.split(`../${f.molde}`).join(`../${nueva}`);
    usados.push(nueva);
    if (f.archivo === "placa-intro.html" && conClipCabeza) {
      const fondo = "#root { position: absolute; inset: 0; overflow: hidden; background: var(--ha-black); }";
      if (!h.includes(fondo)) throw new Error(`${pieza}: no encontré el fondo de la intro`);
      h = h.replace(fondo, "#root { position: absolute; inset: 0; overflow: hidden; }\n        /* Lote con clip de cabeza: la foto no se muestra, se ve el clip del index */\n        .pi-foto { display: none; }");
    }
    // Sin número de AAFE (los potrillos todavía no lo tienen): la ficha va sin ese dato y el nacimiento queda centrado en la segunda fila
    if (f.archivo === "placa-body.html" && !(l.registro && l.registro !== "—")) {
      h = reemplazar(h, /\s*"AAFE " \+ txt\("aafe"\),/, () => "", "el dato de AAFE");
      h = reemplazar(h, /(el\.style\.top = [^\n]*\n)/, (_, a) => `${a}            if (datos.length === 3 && i === 2) el.style.left = "1292.5px";\n`, "la posición de las cajas");
    }
    if (f.archivo === "placa-body.html" && v.versionCorta) {
      const fondo = "#root { position: absolute; inset: 0; overflow: hidden; background: var(--ha-black); }";
      if (!h.includes(fondo)) throw new Error(`${pieza}: no encontré el fondo de la placa Body`);
      h = h.replace(fondo, "#root { position: absolute; inset: 0; overflow: hidden; }\n        /* Versión corta: la foto no se muestra, se ve el clip de Salto 2 del index */\n        .pc-foto { display: none; }\n        .pc-nombre, .pc-sangre { text-shadow: 0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent), 0 0 14px color-mix(in srgb, var(--ha-black) 60%, transparent); }");
    }
    writeFileSync(ruta, h, "utf8");
  }

  // 5b. Regla de los potrillos (video-lotes.json → "cierreDerecha": true): en el cierre la gráfica va a la
  // derecha (centrada en x = 1480,5, para no rozar al potrillo), "LOTE / NN" en --ha-sand y una sombra suave para
  // que el texto se lea sobre el pasto. Zoom más corto y hacia abajo: el potrillo ocupa casi todo el alto y no se le cortan las patas
  if (v.cierreDerecha) {
    const ruta = join(dest, "compositions", "placa-cierre.html");
    let h = readFileSync(ruta, "utf8");
    // Los potrillos siguen con LOTE ╱ NN debajo de la sangre, no con el REMATE 2026 ╱ LOTE NN arriba del sello
    h = reemplazar(h, /\.pf-lote, \.pf-diag \{ display: none; \}/, () => ".pf-arriba { display: none; }", "la línea de arriba del sello");
    h = reemplazar(h, /(\.pf-bloque \{ position: absolute; left: )-950px/, (_, a) => `${a}54px`, "la posición del bloque del cierre");
    h = reemplazar(h, /(\.pf-lote \{[^}]*?color: )var\(--ha-taupe\)/, (_, a) => `${a}var(--ha-sand)`, "el color de LOTE");
    h = reemplazar(h, /(\.pf-diag line \{ stroke: )var\(--ha-taupe\)(; stroke-width: var\(--ha-border\); \})/,
      (_, a, b) => `${a}var(--ha-sand)${b}\n        .pf-nombre, .pf-sangre, .pf-lote { text-shadow: 0 1px 3px color-mix(in srgb, var(--ha-black) 80%, transparent), 0 0 16px color-mix(in srgb, var(--ha-black) 65%, transparent); }\n        .pf-lote { font-weight: var(--ha-t-lot-weight); text-shadow: 0 0 2px color-mix(in srgb, var(--ha-black) 90%, transparent), 0 1px 6px color-mix(in srgb, var(--ha-black) 85%, transparent), 0 0 22px color-mix(in srgb, var(--ha-black) 75%, transparent); }\n        .pf-diag { filter: drop-shadow(0 0 2px color-mix(in srgb, var(--ha-black) 90%, transparent)) drop-shadow(0 1px 6px color-mix(in srgb, var(--ha-black) 85%, transparent)); }`,
      "el color de la diagonal");
    h = reemplazar(h, /(\{ x: 0, y: -4, w: 1928, h: 1079 \}, )\[0\.6, 0\.4\]/, (_, a) => `${a}[0.6, 0.7]`, "el origen del zoom");
    h = reemplazar(h, /(\{ s: 1 \}, \{ s: )1\.06(, duration: 5)/, (_, a, b) => `${a}1.03${b}`, "el zoom del cierre");
    writeFileSync(ruta, h, "utf8");
  }

  // 6. Brand y material dentro de la pieza
  // En Windows la copia puede fallar si el preview tiene abierto un clip en ese momento: se reintenta
  for (let intento = 1; ; intento++) {
    try {
      execFileSync(process.execPath, [join(root, "herramientas", "sync-brand.mjs"), `composiciones/${pieza}`, ...new Set(usados)], { cwd: root, stdio: "pipe" });
      break;
    } catch (e) {
      if (intento >= 3) throw new Error(`${pieza}: falló la copia de brand/material\n${e.stderr?.toString() || e.message}`);
      execFileSync(process.execPath, ["-e", "setTimeout(() => {}, 2000)"]);
    }
  }

  // 7. Faltantes
  const rutaFalta = join(dest, "FALTA.txt");
  if (faltan.length) {
    writeFileSync(rutaFalta, `Material que todavía no llegó (se usa el del lote 01):\n${faltan.map((f) => "- " + f).join("\n")}\n`, "utf8");
  } else if (existsSync(rutaFalta)) rmSync(rutaFalta);

  // 8. Manifiesto para el hub (se publica a mano cuando el video esté aprobado)
  const manifiesto = {
    slug: `video-lote-${nn}`,
    titulo: `Video Lote ${nn} · ${nombre}`,
    tipo: "video",
    descripcion: `Video del lote para YouTube · 16:9 · ${v.versionCorta ? 32 : 42} s`,
    base: "../salida",
    formatos: (v.vertical || v.ig) ? ["16x9", "9x16"] : ["16x9"],
    slides: [{
      id: nn, titulo: `Lote ${nn}`, subtitulo: `${nombre} · ${sangre}`,
      video: `00-00-HA-VideoLote-{formato}-${nn}.mp4`,
      // La portada de YouTube, si ya está, es la vista previa del video en el hub y va en el ZIP
      // Con vertical, una vista previa por formato en salida/capturas/previa/: la portada de YouTube y un cuadro del vertical
      captura: (v.vertical || v.ig) ? `capturas/previa/00-00-HA-VideoLote-{formato}-${nn}.jpg` : existsSync(join(root, "salida", "portadas-yt", `00-00-HA-PortadaYT-Lote${nn}-A-Salto.jpg`))
        ? `portadas-yt/00-00-HA-PortadaYT-Lote${nn}-A-Salto.jpg` : `capturas/00-00-HA-VideoLote-{formato}-${nn}.jpg`,
    }],
  };
  writeFileSync(join(root, "entregas", `00-00-HA-VideoLote-${nn}.json`), JSON.stringify(manifiesto, null, 2) + "\n", "utf8");

  resumen.push(`${faltan.length ? "…" : "✓"} ${pieza}  ${nombre}${conClipCabeza ? " · intro con clip" : ""}${faltan.length ? ` · faltan ${faltan.length} archivos` : ""}`);
  for (const a of avisos) resumen.push(`    ! ${a}`);
}
console.log(resumen.join("\n"));
