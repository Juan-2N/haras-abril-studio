# Haras Abril — Videos para redes (Remate / CSI 2026)

Videos de redes hechos con HyperFrames (HTML → MP4) y entregados al cliente en **https://hub.harasabril.com.ar**.
Idioma de todas las piezas: **español**.

## Cómo se trabaja: una sesión por pieza o por ronda de correcciones

**Al abrir una sesión:**
1. Leer el `SESION-*.md` más reciente: tiene el estado y los pendientes de la sesión anterior.
2. Leer `brand/DESIGN.md` si se va a diseñar algo.
3. Confirmar con el usuario qué pieza se trabaja y si es **pieza nueva** o **corrección** de una ya entregada.

**Al cerrar una sesión:** escribir `SESION-AAAA-MM-DD.md` con lo hecho, las decisiones y los pendientes.
Si ya existe uno de ese día, agregar una sección. Las decisiones que valen para todas las piezas se pasan a este archivo o a `brand/DESIGN.md`.

## Git (desde el 17/11/2026)

`Studio/` es el repo privado **https://github.com/Juan-2N/haras-abril-studio** (rama `main`), compartido con Juan. Puesta en marcha en `Studio/README.md`.
- **No van a git:** `assets/`, `videosreferencias/`, `salida/`, `AACHEN2026/`, los cachés de HyperFrames ni las copias de `assets/` y `brand/fonts|logos` dentro de cada pieza (ver `Studio/.gitignore`). El material nuevo de `assets/` se pasa aparte (pendrive o Drive): avisar qué se agregó.
- **Después de clonar o de recibir assets nuevos:** `node herramientas/restaurar-assets.mjs [pieza ...]` vuelve a copiar en cada pieza lo que usa (no pisa nada ni toca su `tokens.css`).
- **Un archivo que exista solo dentro de una pieza no entra a git.** Ponerlo en `assets/` o agregar una excepción al `.gitignore`, como el molde `lote01b/c/d-*` de `00-00-HA-VideoLoteD-16x9-01`.
- **Al cerrar cada sesión:** `git pull` antes de empezar, y commit + push al terminar (junto con el `SESION-*.md`).

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `brand/` | Insumo, **no se modifica** sin pedido explícito del usuario. `tokens.css` (variables), `DESIGN.md` (reglas de diseño: leer antes de cada pieza), `fonts/`, `logos/` y `styleguide/` (handoff original). |
| `plantillas/` | Diseños base (PNG/PDF). Solo lectura. |
| `videosreferencias/` | Lo que manda el usuario para cada pieza: diseño en PNG, fotos y videos originales. |
| `assets/` | Material listo para usar: `fotos/` (reducidas a 1920 px de alto), `clips/` (H.264), `logos/` (recortes derivados del logo) y `musica/`. |
| `composiciones/` | Un proyecto HyperFrames por pieza y formato. |
| `salida/` | MP4 finales. `salida/capturas/` tiene un JPG por video. |
| `entregas/` | Un manifiesto JSON por pieza, para publicar en el hub. |
| `herramientas/` | `sync-brand.mjs` (copia brand/ y assets a una pieza) y `verificar-video.mjs` (control del render). |
| `cronograma/` | Cronograma de publicaciones. |
| `revision/` | Página de revisión vieja (artifact de claude.ai). **Obsoleta:** se reemplazó por el hub. |

## Reglas fijas

- **Usar siempre los tokens** de `brand/tokens.css`. Nada de colores, tipografías ni tamaños sueltos. Si un tamaño no existe, se deriva de un token (`calc(var(--ha-t-lot-size) * 0.8)`). Si el usuario pide un color fuera de la paleta, usar el token más cercano y avisarle.
- **Orden de autoridad:** `brand/DESIGN.md` (estilo v2, 28/10/2026) > styleguide > plantillas. El styleguide y las plantillas siguen siendo la referencia original, pero en tipografía, fondos, separador de sangre y fechas manda la v2. Ante la duda, preguntar.
- No modificar `plantillas/` ni `brand/`.
- **Siempre mostrar el preview y esperar el OK antes de renderizar.**
- **Cada pieza se entrega en 4:5 (feed) y en 9:16 (stories), salvo que se pida otra cosa.** En un carrusel, todos los slides tienen que tener la misma proporción: Instagram recorta todos al formato del primero.
- **Tapa en el frame 0 (desde el 29/10/2026, todo video para IG):** Instagram toma el primer frame como miniatura (carrusel, grilla, reels). El frame 0 tiene que ser **la pieza armada completa**, igual al diseño en PNG. Dura un solo frame (1/30 s) y en el frame 1 arranca la animación normal; la duración no cambia. Patrón en el paso 3 del flujo. Si una pieza no puede tenerla, avisar. Las piezas anteriores no se tocan salvo pedido.

## Flujo de una pieza nueva

1. **Brief.** El usuario deja el diseño (PNG) y el material en `videosreferencias/`. Los datos pueden venir de una Google Sheet (usar el conector de Google Sheets).
   - Antes de armar, aclarar: formatos, cantidad de slides o duración, fecha de publicación, qué foto o clip va de fondo y cómo se anima.
   - Si el diseño viene en una proporción y la pieza va en otra, preguntar antes.
2. **Material.** Pasar las fotos a `assets/fotos/` reducidas a 1920 px de alto:
   `ffmpeg -i entrada.jpg -vf scale=-2:1920 -q:v 3 assets/fotos/nombre.jpg`
   - Los videos DJI vienen en HEVC 4K: convertirlos a H.264 al tamaño final (ver ejemplo abajo).
   - Usar nombres descriptivos, sin espacios.
3. **Proyecto.** Una carpeta por pieza y por formato: `composiciones/<DD-MM-HA-TipoPieza-Formato-NN>/`.
   - **Partir de una pieza parecida:** copiar su `index.html`, `compositions/`, `hyperframes.json`, `meta.json` y `package.json`, y actualizar el `<title>` y el `meta.json`.
   - Si no hay ninguna parecida: `npx hyperframes init composiciones/<nombre> --non-interactive --example=blank`.
   - Después: `node herramientas/sync-brand.mjs composiciones/<nombre> assets/fotos/x.jpg ...`. HyperFrames no lee fuera de la carpeta de la pieza; por eso se copia.
   - Los datos van en `data-variable-values`, sin editar el HTML interno de las sub-composiciones.
   - **Tapa en el frame 0:** la animación se arma en una timeline `anim` y la raíz la reproduce corrida un frame. En el frame 0 muestra `anim` en el segundo `TAPA` (con todo armado, antes de la salida). Probado en una copia de `22-10-HA-ListaRemate-4x5-00`:
     ```js
     const tl = gsap.timeline({ paused: true });
     const F = 1 / 30, TAPA = 3;               // TAPA: segundo de anim con la pieza completa
     const anim = gsap.timeline({ paused: true });
     anim.fromTo("#sello", { opacity: 0 }, { opacity: 1, duration: 1 }, 0.2);   // ...los tweens de siempre, en anim
     tl.add(anim.tweenFromTo(TAPA, TAPA, { duration: F, ease: "none" }), 0);       // frame 0: la tapa
     tl.add(anim.tweenFromTo(0, 8 - F, { duration: 8 - F, ease: "none" }), F);     // frame 1 en adelante: la animación
     window.__timelines["main"] = tl;
     ```
     Con 8 s de duración, la animación pierde el último frame (1/30 s, ya en negro). Si la pieza tiene clips de video, revisar que el frame 0 muestre el clip en el punto que corresponde.
4. **Revisión técnica.** Correr `npx hyperframes check .` (0 errores) y `npx hyperframes snapshot --at 0,0.034,1,3,6`, y revisar las capturas: en 0 tiene que verse la tapa completa y en 0,034 el arranque de la animación.
5. **Preview.** `npx hyperframes preview --background` → pasar la URL (`http://localhost:3002/#project/<nombre>`, un puerto por pieza) → **esperar el OK**.
6. **Render**, siempre con **1 worker y en modo estricto**:
   `npx hyperframes render . -q high --workers 1 --no-best-effort -o ../../salida/<nombre>.mp4 > render.log 2>&1`
7. **Verificación**, con las tres capas:
   - `node herramientas/verificar-video.mjs salida/<nombre>.mp4 --log render.log --hoja <carpeta-temporal>`: revisa los avisos de carga del log, los saltos bruscos entre frames y que la tapa (frame 0) no sea negra, blanca ni plana. En la carpeta de la hoja guarda también `<nombre>-tapa.jpg`: mirarla y confirmar que sea la pieza completa.
   - **Mirar a ojo la hoja de contacto de cada video. Es obligatorio:** un defecto quieto (por ejemplo, un logo estirado durante todo el video) no genera saltos y el script no lo detecta.
   - Si algo falla: corregir, volver a renderizar esa pieza y volver a verificar, hasta 3 vueltas. Si sigue fallando, avisar.
8. **Capturas.** Un JPG con calidad 80 por video, en el segundo 3 (salvo que se pida otro):
   `ffmpeg -ss 3 -i salida/<nombre>.mp4 -frames:v 1 tmp.png && magick tmp.png -quality 80 salida/capturas/<nombre>.jpg`
9. **Entrega en el hub.** Crear `entregas/<DD-MM-HA-TipoPieza>.json`, tomando como modelo `entregas/22-10-HA-ListaRemate.json`.
   - Va un solo manifiesto por pieza, con los dos formatos. `{formato}` en los nombres se reemplaza por cada uno.
   - Opcional: `"copy"` con el copy sugerido (string o una línea por elemento). Se muestra en la página de la pieza con un botón "Copiar". Escribirlo con el skill `haras-abril-copywriter`.
     Para varias opciones: lista de `{ "titulo", "comentario", "texto": [líneas] }`. Se muestran en 3 columnas (modelo: `entregas/00-00-HA-PautaRemate.json`).
   - Después publicar:
     ```
     cd "W:\HARAS ABRIL\Dev\hub"
     pnpm publicar "W:/HARAS ABRIL/Studio/remate-videos/entregas/<archivo>.json"
     ```
   - El script arma el ZIP, sube todo a R2 y crea la entrega.
   - Pasarle al usuario el link: `https://hub.harasabril.com.ar/<slug>`.
10. **Estado.** Lo cambia **solo el usuario**, en https://hub.harasabril.com.ar/panel, con su usuario admin del sitio. Desde el panel también se puede **eliminar** una pieza: la saca de la base, pero los archivos quedan en R2.

## Flujo de una corrección

1. Leer la nota de la pieza en el hub o lo que pida el usuario, y en el `SESION-*.md` qué se hizo antes.
2. Corregir **solo lo pedido**, mostrar el preview y esperar el OK.
3. Volver a renderizar las piezas afectadas y verificarlas (pasos 6 a 8).
4. Volver a publicar **el mismo manifiesto**: crea la versión siguiente (v2, v3…) con todos los archivos de `salida/`, y la página muestra siempre la última.
   - El estado no cambia solo: avisarle al usuario que lo actualice en el panel.
   - Las versiones anteriores quedan guardadas en R2 y en la base.

## Video por lote (YouTube 16:9, 13 lotes)

- **Plantilla:** `composiciones/00-00-HA-VideoLoteD-16x9-01/` (la opción D aprobada; música Battleborn). Los cambios de diseño se hacen **ahí** y después se regeneran los lotes. Las piezas de cada lote se pisan al regenerar: no editarlas a mano ni en el Studio.
- **Piezas:** `composiciones/00-00-HA-VideoLote-16x9-NN/` → `salida/00-00-HA-VideoLote-16x9-NN.mp4`. Manifiesto: `entregas/00-00-HA-VideoLote-NN.json` (slug `video-lote-NN`).
- **Datos:** `herramientas/lotes.json` (nombre, sangre, sexo, pelo, AAFE, nacimiento) y `herramientas/video-lotes.json`:
  - `url`: la página del lote en el sitio;
  - `arbol`: los 14 nombres del pedigrí, que se bajan con `node herramientas/bajar-pedigri.mjs [NN ...]`;
  - `inicio`: el segundo del clip original donde arranca cada escena.
- **Material por lote** (`NN` con dos dígitos):

  | Uso | Archivo |
  |---|---|
  | Clips | `assets/clips/loteNN-slow.mp4`, `-trote`, `-slow-trote`, `-salto1`, `-salto2` |
  | Clip de la intro (opcional) | `assets/clips/loteNN-cabeza.mp4`. Si existe, reemplaza la foto. |
  | Fotos | `assets/fotos/loteNN-cabeza.jpg` (intro), `-pedigri.jpg`, `-cuerpo.jpg`, `-salto.jpg` (cierre) |
  | Comunes a todos los lotes | `assets/clips/video-lote-dron-remate.mp4` y `video-lote-dron-pedigri.mp4` |

- **Generar:** `node herramientas/armar-video-lote.mjs [NN ...]` (sin argumentos, los 13).
  - Si falta material, usa el del lote 01 y lo anota en `FALTA.txt`, dentro de la pieza.
- **Cuando llega el material:**
  1. El usuario lo deja en `videosreferencias/VideoLote/NN_NOMBRE/`, con los nombres de Jhonny ("Salto Slow", "Trote 1", "Clip Cabeza"…) y de Vicky ("Cuerpo", "Perfil", "Salto"…).
  2. `node herramientas/convertir-material-lote.mjs NN` lo reconoce por el nombre y lo deja en `assets/`:
     - recorta las fotos a 16:9 (el perfil a 3:4) y las reduce a 1920 px de alto;
     - pasa los clips a H.264 1080p a 30 fps; los de 50/60 fps, en cámara lenta al 50 %;
     - si los nombres no se reconocen, se asignan a mano en `video-lotes.json` → `archivos`.
  3. Ajustar `inicio` en `video-lotes.json` mirando cada clip.
  4. Correr `armar-video-lote.mjs NN`.
  5. Hacer check y snapshot, y revisar que el texto no pise al caballo.
     - Si lo pisa, correr el encuadre con `recorte` en `video-lotes.json` (por ejemplo, `"foto-salto": [0, 0, 0.8]`) y volver a convertir con `--forzar`.
  6. Preview y **esperar el OK**.
  7. Render, verificación y publicación (pasos 6 a 9 del flujo).
- Los saltos se adaptan solos a la duración de los clips. Si son cortos, el cierre arranca antes y dura más; no se congela ningún cuadro.
- **Portada de YouTube:** diseño A (foto de Salto, panel a la izquierda, REMATE 2026, línea del video), aprobado el 08/11. Es un JPG aparte por lote, no va en el frame 0: YouTube no toma la primera imagen como miniatura. Fuente: `youtube/00-00-HA-PortadaYT/index.html`; exportar con `herramientas/exportar-slides.mjs` a `salida/portadas-yt/`.

## Errores conocidos (no repetir)

- **Render en paralelo:** con varios workers, las imágenes no cargan a tiempo y el video sale con imágenes faltantes o rotas. Siempre `--workers 1 --no-best-effort`.
- **`height: auto` en imágenes:** a veces el render las estira. A logos, caballos recortados y sellos darles **ancho y alto fijos**, calculados con la proporción del archivo.
- **El Studio de HyperFrames puede pisar archivos** al guardar tiempos o posiciones, y ya deshizo cambios hechos por código. Después de que el usuario edita en el Studio, volver a leer los archivos antes de tocarlos y revisar que no se haya perdido nada.
- **Las sub-composiciones son copias por pieza.** Un cambio de diseño en las tarjetas hay que replicarlo en todas las piezas que las usan, incluidos los dos formatos.
- **Keyframes de los clips:** si están muy espaciados, el render avisa "sparse keyframes" y puede congelar frames. Todo clip se codifica con un keyframe por segundo: `-g 30 -keyint_min 30 -sc_threshold 0`.
- **Cámara lenta:** no confiar en el `r_frame_rate` del original. Hay videos que dicen 60 fps y son 30 con cada cuadro repetido, y al 50 % se ven a saltos. Sacar los repetidos e interpolar: `mpdecimate,setpts=N/30/TB,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=2.0*PTS,fps=30`. Verificar con la diferencia cuadro a cuadro (`tblend` + `signalstats`) que no queden ceros.
- **`letterSpacing` no se puede animar** (`check` lo rechaza): animar solo opacidad y transformaciones.
- **Corte tapa → animación:** entre el frame 0 y el 1 hay un salto a propósito. `verificar-video.mjs` no lo cuenta como salto brusco.
- **Una `tl.set()` en 0 no aplica en el frame 0.** El estado inicial va en el CSS o con `gsap.set()`.
- **Terminal del usuario:** VS Code puede abrir CMD en lugar de PowerShell. Al darle comandos, indicar cuál es; si la ruta tiene espacios, va entre comillas.
- **Tokens copiados por pieza:** cada pieza tiene su propia copia de `brand/tokens.css`, que se actualiza al correr `sync-brand.mjs`. Las piezas hechas antes del 28/10 todavía tienen los tokens v1. Si se corre `sync-brand` en una de ellas, toma los pesos v2: pasarla entera a v2 (como `22-10-HA-ListaRemate-9x16-01`), no a medias.
- **Deploys:** los pushes desde esta máquina **no** deployan el sitio ni el CRM (Vercel solo deploya desde la cuenta de Juan). El hub sí se deploya solo.

## Hub de entregas (https://hub.harasabril.com.ar)

- **Código:** `W:\HARAS ABRIL\Dev\hub`, una app Next.js en el monorepo `Juan-2N/haras-abril`, con su propio proyecto de Vercel (`haras-abril-hub`). Los detalles técnicos están en `Dev/CLAUDE.md`, sección "Hub".
- **Home:** piezas agrupadas por tipo, con fecha de publicación y estado. **`/<slug>`:** la última entrega. **`/panel`:** estado y nota de cada pieza.
- **Datos y archivos:** la base es la database `hub` del Postgres de Railway, aparte de la del sitio, y los archivos están en R2, bajo `hub/<slug>/v<n>/`.
- **Credenciales:** `Dev/hub/.env` (no se commitea). Nunca mostrarlas ni pedirlas en el chat.
- **Cambios en la app:** probar en local con `pnpm dev` y `pnpm build`, commitear en `master` y pushear. Se deploya en 1 o 2 minutos.

## Formatos de salida

| Uso | Relación | Resolución | Token en nombre |
| --- | --- | --- | --- |
| Stories / Reels | 9:16 | 1080×1920 | `9x16` |
| Feed / carrusel | 4:5 | 1080×1350 | `4x5` |

- **Zonas seguras:** 9:16 entre y = 270 e y = 1580; 4:5 con 96 px arriba y abajo.
- **Duración:** se define por pieza. Hasta ahora, 8 s.

## Nombres de archivo

`DD-MM-HA-TipoPieza-Formato-NN`. `DD-MM` es la fecha de publicación. `TipoPieza` va en PascalCase. `Formato` es `9x16` o `4x5`. `NN` es el número de slide; en carruseles, `00` es la portada.
Ejemplo: `composiciones/22-10-HA-ListaRemate-4x5-01/` → `salida/22-10-HA-ListaRemate-4x5-01.mp4` → `salida/capturas/22-10-HA-ListaRemate-4x5-01.jpg`.

## Tipografía

Estilo v2 (28/10/2026), detalle en `brand/DESIGN.md`:
- **Barlow Condensed**, entre Regular y Bold, para **todo**: títulos, nombres de lote (Bold), subtítulos (Bold), sangre, meta, años y fechas (Regular).
- **EB Garamond** itálica **solo** para las tres frases de cierre (ver "Marca y cierres").
- **Fondos:** el Remate va en oscuro (carbón / `--ha-panel-dark`) y el Concurso en negro. No hay paneles blancos; la única superficie clara es la franja de meta de la tarjeta de lista.

## Marca y cierres

Los logos y el cierre se deciden por pieza. "HARAS ABRIL" siempre es la imagen del logotipo, nunca texto escrito.

| Instancia | Título | Bajada |
| --- | --- | --- |
| Institucional | HARAS ABRIL | La mejor sangre. Los mejores resultados. |
| Concurso | HARAS ABRIL \| Concurso CSI 1* 2026 | El evento de salto ecuestre del año |
| Remate | HARAS ABRIL \| REMATE 2026 | Tu próxima estrella cada vez más cerca. |

## Datos y URLs

- **Lotes del remate:** Google Sheet https://docs.google.com/spreadsheets/d/1MTOONgVsA0o8sw2HIO5AjopOs1dgxh3n_7eAhgb0Sgc
  - Columnas (28/10): LOTE, NOMBRE, SANGRE, NAC, SEXO, CHIP, Pelo, … **AAFE en la columna L.** Los lotes retirados tienen "-" en LOTE.
  - **Los datos de lotes no se tipean por pieza:** viven en `herramientas/lotes.json` (lotes + reparto del carrusel). `node herramientas/aplicar-lotes.mjs` los aplica a los slides de lista y genera `lotes-datos.js`, que leen el PDF y el mailing (kit `herramientas/lista-v2.css`).
  - En las piezas, la sangre lleva ` × ` (con espacios) y las fechas van `DD.MM.AAAA`, con puntos y dos dígitos (`07.10.2024`).
- **Sitio:** https://harasabril.com.ar/
- **Plataforma de remate:** http://remateharasabril.com/
- **Hub:** https://hub.harasabril.com.ar
- **PDF de la lista, link público fijo:** https://harasabril.com.ar/remate2026_listas.pdf (rewrite en `Dev/next.config.ts` hacia R2 `publico/remate2026_listas.pdf`). Cada vez que se vuelve a exportar el PDF, subirlo: `cd "W:\HARAS ABRIL\Dev\hub" && pnpm subir-fijo "W:/HARAS ABRIL/Studio/remate-videos/salida/pdf/22-10-HA-ListaLotes.pdf" publico/remate2026_listas.pdf`. No hace falta redeploy del sitio.

## Conversión de video DJI (ejemplo de recorte a 9:16)

`ffmpeg -i entrada.mp4 -an -t 8.5 -vf "crop=1215:2160:(iw-1215)/2:0,scale=1080:1920,fps=30,format=yuv420p" -c:v libx264 -crf 18 -g 30 -keyint_min 30 -sc_threshold 0 -movflags +faststart assets/clips/salida.mp4`

## Audio

Biblioteca propia en `assets/musica` (en construcción). Cada pieza indica qué pista usa.
