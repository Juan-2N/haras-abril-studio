# Studio — Haras Abril

Videos y piezas para redes del **Remate** y del **Concurso CSI 2026**, hechos con [HyperFrames](https://hyperframes.dev) (HTML → MP4) y entregados en **https://hub.harasabril.com.ar**.

Todo el trabajo está en `remate-videos/`. Las reglas y el flujo completo están en [`remate-videos/CLAUDE.md`](remate-videos/CLAUDE.md), que Claude Code carga solo al abrir esta carpeta. **Leelo antes de tocar una pieza.**

---

## 1. Qué hay en git y qué no

El proyecto completo pesa ~19 GB. En git va solo el trabajo (~150 MB): código, composiciones, marca, manifiestos y sesiones. El material pesado se pasa aparte.

| Carpeta | ¿En git? | De dónde sale |
| --- | --- | --- |
| `remate-videos/assets/` (fotos, clips, música) | **No** | Pendrive. Es lo único imprescindible para trabajar. |
| `remate-videos/videosreferencias/` (originales: DJI, fotos crudas, PDFs) | No (9,7 GB) | Pedirlo solo si vas a convertir material nuevo o volver a convertir uno viejo. |
| `remate-videos/salida/` (MP4 finales) | No | Se regeneran al renderizar. Las versiones entregadas están en R2 (vía el hub). |
| `remate-videos/AACHEN2026/` | No | Originales; lo que usa la pieza ya está en `assets/`. |
| Copias de `assets/` y de `brand/fonts`, `brand/logos` dentro de cada pieza | No | Se restauran con un script (paso 2). |
| Cachés de HyperFrames (`.hyperframes/`, `.thumbnails/`, `.transcode-cache/`, `renders/`) | No | Se regeneran solas. |

Excepción: la plantilla de los videos por lote (`composiciones/00-00-HA-VideoLoteD-16x9-01/`) tiene en git 11 clips y fotos `lote01b/c/d-*` que no están en `assets/`. Son el molde que usa `armar-video-lote.mjs`: no borrarlos.

---

## 2. Puesta en marcha

**Requisitos:** Node 22+ (acá se usa 24), `ffmpeg`, ImageMagick (`magick`) y Chrome. `npx hyperframes doctor` revisa que esté todo.

Clonar en una ruta corta (hay archivos con rutas largas y Windows corta en 260 caracteres):

```powershell
git config --global core.longpaths true
git clone https://github.com/<owner>/haras-abril-studio.git "W:\HARAS ABRIL\Studio"
```

1. **Pegar `assets/`** del pendrive en `remate-videos\assets\` (tiene que quedar `remate-videos\assets\fotos`, `clips`, `musica`…).
2. **Restaurar las copias de cada pieza:**
   ```powershell
   cd "W:\HARAS ABRIL\Studio\remate-videos"
   node herramientas/restaurar-assets.mjs
   ```
   Copia en cada pieza las fotos, clips, música, fuentes y logos que usa. No pisa nada que ya exista (`--pisar` para forzar) y no toca el `tokens.css` de cada pieza, porque hay piezas con tokens v1 y otras con v2. Se puede correr para una sola: `node herramientas/restaurar-assets.mjs 16-11-HA-InscripcionCSI-9x16-01`.
3. **Probar una pieza:**
   ```powershell
   cd composiciones\16-11-HA-InscripcionCSI-9x16-01
   npx hyperframes check .
   npx hyperframes preview
   ```
4. **Skills de HyperFrames para Claude Code** (si no los tenés): `npx hyperframes skills`.

**Rutas:** el `CLAUDE.md` usa rutas absolutas (`W:\HARAS ABRIL\Studio`, `W:\HARAS ABRIL\Dev\hub`). Si clonás en otro lado, ajustalas o montá la misma unidad.

---

## 3. Cómo se trabaja

El detalle está en `remate-videos/CLAUDE.md`. Lo esencial:

- **Una sesión por pieza o por ronda de correcciones.** Al abrir, leer el `SESION-*.md` más reciente (estado y pendientes). Al cerrar, escribir `SESION-AAAA-MM-DD.md`.
- **Una carpeta por pieza y formato:** `composiciones/DD-MM-HA-TipoPieza-Formato-NN/`. Cada pieza va en 4:5 y 9:16, salvo pedido.
- **Marca:** usar siempre los tokens de `brand/tokens.css`; reglas de diseño en `brand/DESIGN.md`. `brand/` y `plantillas/` no se modifican sin pedido.
- **Preview y OK antes de renderizar.** Render siempre con `--workers 1 --no-best-effort` (con más workers salen imágenes faltantes).
- **Verificación:** `node herramientas/verificar-video.mjs` + mirar a ojo la hoja de contacto.
- **Entrega:** manifiesto en `entregas/` y `pnpm publicar` desde `Dev/hub` (usa el `.env` del hub).
- **Datos de los lotes:** viven en `herramientas/lotes.json` y `herramientas/video-lotes.json`, no se tipean en cada pieza.
- **Videos por lote:** se cambia el diseño en la plantilla `00-00-HA-VideoLoteD-16x9-01` y se regeneran con `node herramientas/armar-video-lote.mjs`. Las piezas de cada lote se pisan al regenerar.

---

## 4. Cosas a tener en cuenta con git

- **El Studio de HyperFrames puede pisar archivos** al guardar tiempos o posiciones. Revisar el `git diff` después de usarlo.
- **Material nuevo:** va a `assets/` (fuera de git) y se copia a la pieza con `sync-brand.mjs` o `restaurar-assets.mjs`. Si agregás algo a `assets/`, avisá para pasarlo, porque el otro no lo va a tener.
- **Archivos que existan solo dentro de una pieza** (como los del molde de lotes) no entran a git por el `.gitignore`. Mejor ponerlos en `assets/`, o agregar una excepción al `.gitignore`.
- **Nada de credenciales en este repo.** Las del hub están en `Dev/hub/.env`, que no se commitea.
