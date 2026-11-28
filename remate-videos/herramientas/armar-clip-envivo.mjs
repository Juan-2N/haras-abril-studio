// Fondo del "Remate en vivo" (28/11): salto slow de Abril Tilcha a tamaño final, con el mismo método que
// armar-video-lote-ig.mjs (recorte que sigue al caballo + la misma imagen desenfocada arriba y abajo).
// Uso (desde remate-videos/): node herramientas/armar-clip-envivo.mjs 4x5 -20  ·  node herramientas/armar-clip-envivo.mjs 9x16 200
// (el segundo número es la y del recorte nítido: con esos valores el caballo queda arriba y el texto abajo)
// La tapa (frame 0) es el cuadro del segundo 4,0: ffmpeg -ss 4.0 -i assets/clips/lote06-slow-envivo-<f>.mp4 -frames:v 1 -q:v 2 assets/fotos/lote06-slow-envivo-<f>-tapa.jpg
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [fmt, Yarg] = process.argv.slice(2);
const OUT_H = fmt === "4x5" ? 1350 : 1920;
const Y = Number(Yarg);
const src = join(root, "videosreferencias/VideoLote/06_ABRIL_TILCHA/Abril Tilcha - Slow.mp4");
const dest = join(root, `assets/clips/lote06-slow-envivo-${fmt}.mp4`);
const par = (n) => 2 * Math.round(n / 2);
const sw = 3840, sh = 2160, FEATHER = 90;
// Encuadre del lote 06 en video-lotes.json → ig.slow
const cfg = { ancho: 0.58, cx: [[1.8, 0.504], [2.361, 0.506], [2.923, 0.504], [3.484, 0.506], [4.046, 0.514], [4.607, 0.512], [5.169, 0.499], [5.73, 0.488]] };
const wpx = par(cfg.ancho * sw);
const H = par(sh * 1080 / wpx);

function exprX(cx) {
  const izq = (c) => Math.max(0, Math.min(sw - wpx, Math.round((c - wpx / sw / 2) * sw)));
  const p = cx.map(([t, c]) => [t, izq(c)]);
  let e = String(p[p.length - 1][1]);
  for (let i = p.length - 2; i >= 0; i--) {
    const [t0, x0] = p[i], [t1, x1] = p[i + 1];
    e = `if(lte(t\\,${t1})\\,${x0}+(${x1 - x0})*max(t-${t0}\\,0)/${(t1 - t0).toFixed(3)}\\,${e})`;
  }
  return e;
}

const mask = join(tmpdir(), `ha-envivo-m${H}.png`);
execFileSync("magick", ["-size", `1080x${H}`, "xc:white",
  "(", "-size", `1080x${FEATHER}`, "gradient:black-white", ")", "-geometry", "+0+0", "-composite",
  "(", "-size", `1080x${FEATHER}`, "gradient:white-black", ")", "-geometry", `+0+${H - FEATHER}`, "-composite", mask]);

const cw = par(sh * 1080 / OUT_H);
const fc = `[0:v]split=2[a][b];` +
  `[a]crop=${cw}:${sh}:(iw-${cw})/2:0,scale=270:${par(270 * OUT_H / 1080)},gblur=sigma=12,scale=1080:${OUT_H},format=yuv420p[bg];` +
  `[b]crop=w=${wpx}:h=${sh}:x='${exprX(cfg.cx)}':y=0,scale=1080:${H}:flags=lanczos,format=rgba[f0];` +
  `[1:v]format=gray,scale=1080:${H}[m];[f0][m]alphamerge[fg];` +
  `[bg][fg]overlay=0:${Y}:shortest=1,fps=30,format=yuv420p[v]`;
execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-y", "-i", src, "-framerate", "30", "-loop", "1", "-i", mask,
  "-filter_complex", fc, "-map", "[v]", "-an", "-t", "7.733",
  "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-movflags", "+faststart", dest]);
console.log(`${dest} · recorte ${wpx}px → 1080×${H} en y=${Y}`);
