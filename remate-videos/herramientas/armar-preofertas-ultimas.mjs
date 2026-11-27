// Carrusel de últimas horas de las pre-ofertas (Remate 2026): 4 slides de 8 s con tapa en el frame 0.
// Mismo contenido que el mail del 27/11 (mailing/27-11-HA-PreofertasUltimasHoras) y mismos componentes que el carrusel
// del 23/11 (herramientas/armar-preofertas.mjs):
//   00 clip vertical del lote 13 (Abril Viconthon) + ¡ÚLTIMAS HORAS PARA PRE-OFERTAR! · 01 beneficios (2 % y 3 %, no acumulables)
//   02 recordá (extensión de 30 min por lote) · 03 remate en vivo mañana, 17:30 h, link y contacto
// Los datos están en DATOS, abajo: se cambian ahí y se vuelve a correr.
//
// Dos formatos: 4x5 (feed) y 9x16 (stories). En 9:16 el bloque de los slides 01–03 se corre 285 px (zona segura y = 270–1580).
// Slide 00: el clip es 1080×1920 y arranca en el corte de 2,7 s (potrillo contra la pared, la toma del encabezado del mail;
// sigue con el potrillo y la madre). El primer plano de la cabeza (0–2,7 s) quedó afuera: el texto le tapaba el hocico.
// En 4:5 el clip sube 240 px para dejar la cabeza arriba (con 300 las orejas tocaban el borde) y el texto sobre el cuerpo. La tapa (frame 0) es esa toma con todo el texto.
//
// Uso (desde remate-videos/):  node herramientas/armar-preofertas-ultimas.mjs [4x5] [9x16] [00 01 02 03]   (sin argumentos, todo)
// Salida: composiciones/27-11-HA-PreofertasUltimasHoras-<formato>-NN/

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const molde = join(root, "composiciones", "22-10-HA-ListaRemate-4x5-00");
const W = 1080, D = 8;
const FORMATOS = {
  "4x5": { H: 1350, dy: 0, clipY: -240, pie: 96 },
  "9x16": { H: 1920, dy: 285, clipY: 0, pie: 360 },
};

const DATOS = {
  url: "remateharasabril.com",
  cierre: "VIE 27.11.2026 · 20 h",
  dia: "Mañana · Sábado 28.11.2026",
  hora: "17:30 h",
  lugar: "Haras Abril, Lezama · Presencial y online",
  mail: "remate@harasabril.com.ar",
  wp: "+54 9 11 7302-4522",
  desc1: 2,
  desc2: 3,
  lote: "Lote 13",
  nombre: "Abril Viconthon",
};

const SELLO = "brand/logos/PNG/HA_Emblema_Dorado_Negativo.png";
const FONDO = "assets/fotos/dron-pistas-atardecer.jpg";
const CLIP = "assets/clips/lote13-vertical.mp4";
const DESDE_CLIP = 2.7; // corte cabeza → cuerpo en el clip (detectado con select=gt(scene,0.25)); el siguiente corte, en 5,43
const MUSICA = "assets/musica/battleborn-symphony.mp3";

const fondoComun = `
      <img id="fondo" src="${FONDO}" alt="" />
      <div id="velo"></div>
      <img id="sello-bg" src="${SELLO}" alt="" />`;

const flecha = `<span class="fl">→</span>`;
const reloj = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;

const slides = (fmt) => {
  const f = FORMATOS[fmt], y = (v) => v + f.dy;
  return {
  "00": {
    tapa: 2.4, // todo el texto armado (el frame 0 muestra el clip en su primer cuadro)
    html: `
      <video id="clip" class="clip" src="${CLIP}" muted playsinline data-start="0" data-duration="${D}" data-media-start="${DESDE_CLIP}" data-track-index="0"></video>
      <div id="velo-pie"></div>
      <div class="col" style="bottom:${f.pie}px">
        <div class="lote a"><b>${DATOS.lote}</b>${DATOS.nombre}</div>
        <div class="eyebrow a">¡Últimas horas para</div>
        <div class="titulo a">Pre-ofertar!</div>
        <div class="flare"></div>
        <div class="firma a">Remate <span>2026</span></div>
        <div class="pill b">${DATOS.url}${flecha}</div>
        <div class="hasta b"><b>Cierran hoy</b>${DATOS.cierre}</div>
      </div>`,
    anim: `
      anim.fromTo(".a", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.14 }, 0.3);
      anim.fromTo(".flare", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out" }, 0.8);
      anim.fromTo(".b", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.15 }, 1.3);`,
  },
  "01": {
    html: `${fondoComun}
      <div class="col" style="top:${y(96)}px">
        <div class="titulo a">Beneficios</div>
        <div class="sub a">exclusivos</div>
      </div>
      <div class="col" style="top:${y(350)}px">
        <div class="circ c1"><b>${DATOS.desc1}</b><i>%</i></div>
        <div class="txt t1"><div><span>de</span> descuento</div><div><span>solo por pre-ofertar</span></div></div>
      </div>
      <div class="col" style="top:${y(770)}px">
        <div class="circ c2"><b>${DATOS.desc2}</b><i>%</i></div>
        <div class="txt t2"><div><span>de</span> descuento</div><div><span>al ganador de la pre-oferta</span></div></div>
      </div>
      <div class="col" style="top:${y(1186)}px">
        <div class="nota n">Se aplican mañana, sobre el precio de martillo · No son acumulables</div>
      </div>`,
    anim: `
      anim.fromTo("#fondo", { scale: 1.0 }, { scale: 1.06, duration: ${D}, ease: "none" }, 0);
      anim.fromTo(".a", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.14 }, 0.3);
      anim.fromTo(".c1", { opacity: 0, scale: 0.6, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.9, ease: "power3.out" }, 0.8);
      anim.fromTo(".t1", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 1.1);
      anim.fromTo(".c2", { opacity: 0, scale: 0.6, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.9, ease: "power3.out" }, 1.5);
      anim.fromTo(".t2", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 1.8);
      anim.fromTo(".n", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 2.2);`,
  },
  "02": {
    html: `${fondoComun}
      <div class="col" style="top:${y(230)}px">
        <div class="circ grande c1"><b>30</b><i>min</i></div>
        <div class="titulo a" style="margin-top:64px">Recordá</div>
        <div class="flare"></div>
        <div class="frase a">Si entra una oferta en los últimos<br />30 minutos, el cierre de ese lote<br />se extiende 30 minutos más.</div>
        <div class="hasta a" style="margin-top:56px"><b>Cierran hoy</b>${DATOS.cierre}</div>
      </div>`,
    anim: `
      anim.fromTo("#fondo", { scale: 1.0 }, { scale: 1.06, duration: ${D}, ease: "none" }, 0);
      anim.fromTo(".c1", { opacity: 0, scale: 0.6, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.9, ease: "power3.out" }, 0.3);
      anim.fromTo(".a", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.3 }, 0.8);
      anim.fromTo(".flare", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out" }, 1.1);`,
  },
  "03": {
    html: `${fondoComun}
      <div class="col" style="top:${y(160)}px">
        <img id="sello" class="a" src="${SELLO}" alt="Haras Abril" />
        <div class="eyebrow a" style="margin-top:28px">${DATOS.dia}</div>
        <div class="que a">${reloj}<span>Remate en vivo</span></div>
        <div class="hora a">${DATOS.hora}</div>
        <div class="flare"></div>
        <div class="donde f">${DATOS.lugar}</div>
        <div class="pill f">${DATOS.url}${flecha}</div>
        <div class="contacto f"><span>Consultas</span>${DATOS.mail} &nbsp;·&nbsp; WP ${DATOS.wp}</div>
        <div class="claim f">Tu próxima estrella cada vez más cerca.</div>
      </div>`,
    anim: `
      anim.fromTo("#fondo", { scale: 1.0 }, { scale: 1.06, duration: ${D}, ease: "none" }, 0);
      anim.fromTo(".a", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.14 }, 0.2);
      anim.fromTo(".flare", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out" }, 0.9);
      anim.fromTo(".f", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.12 }, 1.1);`,
  },
  };
};

const css = (fmt) => {
  const { H, dy, clipY } = FORMATOS[fmt];
  return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--ha-charcoal); }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--ha-charcoal); font-family: var(--ha-font-sans); color: var(--ha-white); }
      /* Fondo común */
      #fondo { position: absolute; inset: 0; width: ${W}px; height: ${H}px; object-fit: cover; }
      #velo { position: absolute; inset: 0; background: var(--ha-ink); opacity: 0.86; }
      #sello-bg { position: absolute; left: -420px; top: ${-160 + dy}px; width: 1040px; height: 1040px; opacity: 0.06; }
      /* Slide 00: clip vertical a sangre (1080×1920, tamaño fijo) y velo abajo para el texto */
      #clip { position: absolute; left: 0; top: ${clipY}px; width: ${W}px; height: 1920px; object-fit: cover; }
      #velo-pie { position: absolute; left: 0; right: 0; bottom: 0; height: ${fmt === "9x16" ? 1200 : 820}px;
        background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--ha-black) 55%, transparent) 30%, color-mix(in srgb, var(--ha-black) 82%, transparent) 100%); }
      .lote { margin-bottom: var(--ha-s-3); white-space: nowrap; text-transform: uppercase; line-height: 1; font-weight: var(--ha-t-lot-weight); letter-spacing: var(--ha-t-num-track); text-indent: var(--ha-t-num-track); font-size: calc(var(--ha-t-label-size) * 1.0); }
      .lote b { color: var(--ha-sand); font-weight: var(--ha-t-num-weight); margin-right: 0.6em; }
      .hasta { margin-top: 22px; white-space: nowrap; font-weight: var(--ha-t-data-weight); letter-spacing: var(--ha-t-data-track); font-size: calc(var(--ha-t-data-size) * 1.3); }
      .hasta b { color: var(--ha-sand); font-weight: var(--ha-t-lot-weight); text-transform: uppercase; margin-right: 0.4em; }
      /* Columna centrada */
      .col { position: absolute; left: 0; width: ${W}px; display: flex; flex-direction: column; align-items: center; text-align: center; }
      .eyebrow { color: var(--ha-sand); text-transform: uppercase; font-weight: var(--ha-t-label-weight); letter-spacing: var(--ha-t-label-track); text-indent: var(--ha-t-label-track); font-size: calc(var(--ha-t-label-size) * 1.3); line-height: 1.1; }
      .titulo { white-space: nowrap; text-transform: uppercase; font-weight: var(--ha-t-event-weight); letter-spacing: 0.1em; text-indent: 0.1em; font-size: var(--ha-t-event-size); line-height: 1.02; }
      .sub { white-space: nowrap; text-transform: uppercase; color: var(--ha-sand); font-weight: var(--ha-t-year-weight); letter-spacing: 0.22em; text-indent: 0.22em; font-size: calc(var(--ha-t-year-size) * 0.86); line-height: 1.05; }
      .firma { white-space: nowrap; text-transform: uppercase; font-weight: var(--ha-t-event-weight); letter-spacing: var(--ha-t-label-track); text-indent: var(--ha-t-label-track); font-size: calc(var(--ha-t-label-size) * 1.3); line-height: 1.1; }
      .firma span { font-weight: var(--ha-t-year-weight); }
      .flare { width: var(--ha-flare-w); height: var(--ha-flare-h); margin: var(--ha-s-3) 0; background: var(--ha-gold-flare); }
      .pill { margin-top: var(--ha-s-4); height: var(--ha-btn-h); padding: 0 var(--ha-btn-pad-x); border-radius: var(--ha-btn-radius); background: var(--ha-gold-grad); display: flex; align-items: center; gap: var(--ha-s-2); color: var(--ha-ink); font-weight: var(--ha-t-lot-weight); letter-spacing: 0.06em; font-size: calc(var(--ha-t-label-size) * 1.1); line-height: 1; }
      /* Círculos de los beneficios */
      .circ { position: relative; width: 250px; height: 250px; border-radius: 50%; border: var(--ha-border) solid var(--ha-gold); background: var(--ha-panel-dark); display: flex; align-items: center; justify-content: center; gap: 6px; }
      .circ b { font-weight: var(--ha-t-event-weight); font-size: calc(var(--ha-t-count-size) * 1.15); line-height: 1; margin-top: -10px; }
      .circ i { font-style: normal; color: var(--ha-sand); font-weight: var(--ha-t-num-weight); font-size: var(--ha-t-num-size); line-height: 1; margin-top: 28px; }
      .circ.grande { width: 320px; height: 320px; flex-direction: column; gap: 0; }
      .circ.grande b { margin-top: 0; }
      .circ.grande i { margin-top: 0; text-transform: uppercase; letter-spacing: var(--ha-t-label-track); text-indent: var(--ha-t-label-track); font-size: calc(var(--ha-t-label-size) * 1.2); }
      .txt { margin-top: var(--ha-s-4); text-transform: uppercase; font-weight: var(--ha-t-lot-weight); letter-spacing: var(--ha-t-data-track); font-size: calc(var(--ha-t-label-size) * 1.3); line-height: 1.2; }
      .txt span { font-weight: var(--ha-t-data-weight); }
      .txt div + div { color: var(--ha-gray-light); }
      .nota { font-weight: var(--ha-t-data-weight); letter-spacing: 0.02em; font-size: calc(var(--ha-t-data-size) * 1.15); color: var(--ha-gray-light); }
      .frase { font-weight: var(--ha-t-label-weight); font-size: calc(var(--ha-t-lot-size) * 0.82); line-height: 1.3; }
      /* Remate en vivo: la caja del flyer del sábado (reloj + REMATE + hora grande en sand), suelta sobre el fondo */
      #sello { width: 230px; height: 230px; }
      .que { margin-top: 20px; display: flex; align-items: center; gap: var(--ha-s-2); white-space: nowrap; text-transform: uppercase; line-height: 1;
        font-weight: var(--ha-t-event-weight); font-size: calc(var(--ha-t-lot-size) * 0.95); letter-spacing: var(--ha-t-event-track); }
      .que span { margin-right: calc(var(--ha-t-event-track) * -1); }
      .que svg { width: 1em; height: 1em; fill: none; stroke: var(--ha-sand); stroke-width: 1.8; stroke-linecap: round; }
      .hora { margin-top: 8px; white-space: nowrap; text-transform: uppercase; line-height: 1; color: var(--ha-sand);
        font-weight: var(--ha-t-count-weight); font-size: calc(var(--ha-t-count-size) * 1.2); letter-spacing: var(--ha-t-count-track); text-indent: var(--ha-t-count-track); }
      .donde { font-weight: var(--ha-t-data-weight); letter-spacing: 0.04em; font-size: calc(var(--ha-t-data-size) * 1.4); line-height: 1.3; }
      .contacto { margin-top: var(--ha-s-4); font-weight: var(--ha-t-data-weight); letter-spacing: 0.04em; font-size: calc(var(--ha-t-data-size) * 1.15); color: var(--ha-gray-light); }
      .contacto span { color: var(--ha-sand); text-transform: uppercase; font-weight: var(--ha-t-num-weight); letter-spacing: var(--ha-t-label-track); margin-right: 0.8em; }
      .claim { margin-top: var(--ha-s-4); color: var(--ha-sand); font-family: var(--ha-font-serif); font-style: italic; font-weight: var(--ha-t-claim-weight); font-size: var(--ha-t-claim-size); line-height: 1.2; }
      .fl { font-weight: var(--ha-t-data-weight); }
      #fin { position: absolute; inset: 0; background: var(--ha-black); opacity: 0; pointer-events: none; }`;
};

function pieza(fmt, nn) {
  const { H } = FORMATOS[fmt];
  const s = slides(fmt)[nn];
  const TAPA = s.tapa ?? 3;
  const nombre = `27-11-HA-PreofertasUltimasHoras-${fmt}-${nn}`;
  const dest = join(root, "composiciones", nombre);
  mkdirSync(dest, { recursive: true });
  cpSync(join(molde, "hyperframes.json"), join(dest, "hyperframes.json"));
  const pkg = JSON.parse(readFileSync(join(molde, "package.json"), "utf8"));
  pkg.name = nombre.toLowerCase();
  writeFileSync(join(dest, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  const rutaMeta = join(dest, "meta.json");
  const creado = existsSync(rutaMeta) ? JSON.parse(readFileSync(rutaMeta, "utf8")).createdAt : new Date().toISOString();
  writeFileSync(rutaMeta, JSON.stringify({ id: nombre, name: nombre, createdAt: creado }, null, 2) + "\n");

  // La música sigue de un slide al otro: cada uno toma su tramo de 8 s
  const desde = 4 + Number(nn) * D;
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${nombre}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <link rel="stylesheet" href="brand/tokens.css" />
    <style>${css(fmt)}
    </style>
  </head>
  <body>
    <!-- Últimas horas de las pre-ofertas, slide ${nn}. Generado por herramientas/armar-preofertas-ultimas.mjs: no editar a mano -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">${s.html}
      <div id="fin"></div>
      <audio id="musica" src="${MUSICA}" data-start="0" data-duration="${D}" data-track-index="10" data-volume="0.8" data-media-start="${desde}"
             data-automation='{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0},{"t":0.4,"v":1},{"t":7.2,"v":1},{"t":7.95,"v":0}]}]}'></audio>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      const anim = gsap.timeline({ paused: true });
      const F = 1 / 30, D = ${D}, TAPA = ${TAPA};
${s.anim}
      anim.fromTo("#fin", { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.in" }, D - 0.75);
      anim.to({}, { duration: 0.001 }, D);
      // Tapa en el frame 0: la pieza armada; desde el frame 1, la animación
      tl.add(anim.tweenFromTo(TAPA, TAPA, { duration: F, ease: "none" }), 0);
      tl.add(anim.tweenFromTo(0, D - F, { duration: D - F, ease: "none" }), F);
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
  writeFileSync(join(dest, "index.html"), html, "utf8");
  const usados = [MUSICA, nn === "00" ? CLIP : FONDO];
  execFileSync(process.execPath, [join(root, "herramientas", "sync-brand.mjs"), `composiciones/${nombre}`, ...usados], { cwd: root, stdio: "pipe" });
  console.log(`✓ ${nombre}`);
}

const args = process.argv.slice(2);
const fmts = args.filter((a) => a in FORMATOS), nums = args.filter((a) => !(a in FORMATOS));
for (const fmt of fmts.length ? fmts : Object.keys(FORMATOS))
  for (const nn of nums.length ? nums : ["00", "01", "02", "03"]) pieza(fmt, nn);
