# Cómo replicar Studio para otro cliente

Guía para llevarse la forma de trabajo de `Studio/remate-videos` (Haras Abril) a un cliente nuevo con otro estilo.

**La idea central:** el método no depende de Haras Abril. Lo que cambia por cliente es la **marca** (tokens, DESIGN.md, fuentes, logos), la **voz** (skill de copy) y los **datos**. Las reglas, el flujo, las herramientas y los errores aprendidos se copian tal cual.

---

## 1. Qué se lleva y qué se rehace

| Pieza | Qué hacer | Por qué |
| --- | --- | --- |
| Flujo de trabajo (sesiones, preview → OK → render → verificación → entrega) | **Copiar igual** | Es el método. No depende del cliente. |
| "Errores conocidos" del CLAUDE.md | **Copiar igual** | Son de HyperFrames, no del cliente (workers, `height: auto`, keyframes, `tl.set()` en 0, Studio pisando archivos…). |
| `herramientas/sync-brand.mjs`, `verificar-video.mjs`, `exportar-png.mjs`, `exportar-pdf.mjs` | **Copiar igual** | Son genéricos. Solo revisar rutas y textos con "Haras". |
| Estructura de carpetas | **Copiar vacía** | `brand/ plantillas/ videosreferencias/ assets/ composiciones/ salida/ entregas/ herramientas/ cronograma/`. |
| `brand/tokens.css` | **Rehacer** | Mantener los **nombres de rol** y cambiar el prefijo y los valores (ver §3). |
| `brand/DESIGN.md` | **Rehacer** | Mismo índice, contenido del cliente nuevo. |
| `brand/fonts`, `logos`, `styleguide` | **Rehacer** | Material del cliente. |
| Composiciones | **Opcional: 1 o 2 de base** | Sirven como esqueleto (estructura, variables, timeline). Se cambian los tokens y el diseño. |
| Manifiestos de `entregas/` | **Copiar el formato** | Mismo JSON, otros slugs. |
| Hub de entregas | **Decidir** (ver §5) | Hoy está atado a Haras Abril. |
| Skill de copy (`haras-abril-copywriter`) | **Crear uno nuevo** | Uno por cliente (ver §6). |
| Tabla "Marca y cierres", "Datos y URLs", tipografía | **Rehacer** | Son del cliente. |

---

## 2. Armado paso a paso

1. **Crear la carpeta del cliente**, al lado y no adentro de Haras Abril. Ejemplo:
   ```
   W:\<CLIENTE>\Studio\
   ├── CLAUDE.md               ← índice corto que importa el del proyecto
   └── <proyecto>-videos\
       ├── CLAUDE.md           ← reglas y flujo (plantilla en §7)
       ├── brand\  plantillas\  videosreferencias\  assets\
       ├── composiciones\  salida\capturas\  entregas\
       ├── herramientas\  cronograma\
   ```
   Abrir VS Code en `W:\<CLIENTE>\Studio`, así Claude Code carga el CLAUDE.md de ese cliente y su propia memoria. No mezclar clientes en una misma carpeta raíz.

2. **Copiar las herramientas** (PowerShell):
   ```powershell
   Copy-Item "W:\HARAS ABRIL\Studio\remate-videos\herramientas\*.mjs" "W:\<CLIENTE>\Studio\<proyecto>-videos\herramientas\"
   ```
   Buscar "Haras", "HA" y "remate" en los scripts y adaptar los textos.

3. **Cargar la marca en `brand/`:** styleguide, fuentes `.ttf` y logos en PNG con fondo transparente (positivo y negativo).

4. **Pedirle a Claude que arme `tokens.css` y `DESIGN.md`** a partir del styleguide y de 2 o 3 plantillas de redes del cliente. Que mida las plantillas sobre un lienzo de 1080 px, igual que en Haras. Revisar el resultado y recién ahí congelar `brand/`.

5. **Hacer una pieza piloto** de punta a punta, 4:5 y 9:16, para validar tokens, zonas seguras, render y entrega. Lo que se aprenda va al CLAUDE.md.

6. **Primera sesión:** cerrar con `SESION-AAAA-MM-DD.md` como siempre.

---

## 3. Tokens: cambiar valores, mantener roles

La regla "nada de valores sueltos" funciona porque cada token tiene un **rol**. Copiar la estructura de `tokens.css` y renombrar el prefijo:

```css
/* <CLIENTE> — TOKENS PARA VIDEO. Medidas en px de lienzo 1080 de ancho. */
@font-face { font-family: "<Titular>"; src: url("fonts/<Titular>-Bold.ttf"); font-weight: 700; }
@font-face { font-family: "<Texto>";   src: url("fonts/<Texto>-Regular.ttf"); font-weight: 400; }

:root {
  /* Color: paleta cerrada */
  --xx-bg:        #......;  /* fondo principal */
  --xx-ink:       #......;  /* texto sobre fondo claro */
  --xx-accent:    #......;  /* único acento */
  --xx-veil-dark: linear-gradient(...);  /* velo para legibilidad sobre foto */

  /* Tipografía: familia + escala por rol */
  --xx-font-title: "<Titular>", sans-serif;
  --xx-font-body:  "<Texto>", serif;
  --xx-t-title-size: ...px;
  --xx-t-label-size: ...px;

  /* Layout: márgenes y zonas seguras */
  --xx-safe-top-9x16: 270px;  --xx-safe-bottom-9x16: 340px;
  --xx-safe-y-4x5: 96px;
}
```

Usar un prefijo corto por cliente (`--ha-`, `--xx-`) para que nunca se mezclen tokens de dos marcas en una composición copiada.

## 4. DESIGN.md: mismo índice, otra marca

Mantener las secciones del de Haras, porque son las preguntas que Claude necesita tener resueltas antes de diseñar:

1. **Niveles de la marca:** cuándo se usa cada variante. En Haras: Sello / Remate (blanco) / CSI (negro).
2. **Constantes de cada pieza:** logo como imagen y nunca como texto, acento, separadores.
3. **Color:** paleta cerrada y qué color va sobre qué fondo.
4. **Tipografía:** tabla de rol → familia → estilo → ejemplo.
5. **Layout:** márgenes y zonas seguras por formato.
6. **Movimiento:** tipos de entrada, duraciones y easing. Es lo que le da estilo al video.
7. **Fotos y video:** tratamiento, velos, qué no hacer.
8. **Cierres:** título y bajada por instancia.

Si el cliente tiene **otro estilo** (más moderno, más joven, más gráfico), el cambio se escribe sobre todo en las secciones 1, 6 y 7. El flujo no cambia.

---

## 5. Hub de entregas

Hoy `hub.harasabril.com.ar` sale de `W:\HARAS ABRIL\Dev\hub` (Next.js + Postgres en Railway + R2) y está atado a Haras Abril. Hay dos caminos:

| Opción | Cómo | Cuándo conviene |
| --- | --- | --- |
| **A. Un hub por cliente** | Copiar `Dev/hub` a un repo nuevo, con otra database en Railway, otro prefijo en R2, otro proyecto en Vercel y otro subdominio. Cambiar marca y textos. | Pocos clientes y cada uno quiere su dominio. |
| **B. Un hub multi-cliente** (por ejemplo `hub.doblenuez.com`) | Agregar un campo `cliente` a las piezas, rutas `/<cliente>/<slug>` y R2 en `hub/<cliente>/<slug>/v<n>/`. El manifiesto suma `"cliente": "..."`. | Varios clientes. Un solo deploy y un solo panel. |

Recomendación: **B** si se van a sumar más clientes. Es un cambio en la app, no en el método de Studio. Mientras tanto, se puede empezar sin hub y entregar por Drive, con el mismo manifiesto JSON.

Credenciales: cada hub con su propio `.env`, que no se commitea. Nunca se copian entre clientes.

---

## 6. Skills y memoria

- **Copy:** crear un skill `<cliente>-copywriter` con el skill `skill-creator`, tomando como modelo `haras-abril-copywriter`. Necesita voz, tono, vocabulario propio y prohibido, ejemplos buenos y malos, y formatos (caption, ad, story). En el CLAUDE.md, el paso de copy apunta a ese skill.
- **Skills de HyperFrames** (`~/.claude/skills/hyperframes*`): son globales y no se copian.
- **Memoria de Claude Code:** es por carpeta de proyecto. Abrir el cliente nuevo en su propia carpeta y no queda contaminado con preferencias de Haras.

---

## 7. Plantilla de CLAUDE.md

Copiar el `remate-videos/CLAUDE.md` actual y reemplazar solo estas secciones. El resto (cómo se trabaja, reglas fijas, flujo de pieza nueva y de corrección, errores conocidos, formatos de salida, nombres de archivo) queda igual, cambiando `HA` por la sigla del cliente.

```markdown
# <Cliente> — Videos para redes (<proyecto>)

Videos de redes hechos con HyperFrames (HTML → MP4) y entregados al cliente en **<hub o Drive>**.
Idioma de todas las piezas: **<idioma>**.

## Nombres de archivo
`DD-MM-<SIGLA>-TipoPieza-Formato-NN`

## Tipografía
- **<Titular>:** títulos, etiquetas, datos.
- **<Texto>:** cuerpo, tono editorial.

## Marca y cierres
"<NOMBRE>" siempre es la imagen del logotipo, nunca texto escrito.

| Instancia | Título | Bajada |
| --- | --- | --- |
| Institucional | ... | ... |

## Datos y URLs
- Datos: <Google Sheet / Notion / CSV>
- Sitio: ...

## Copy
Escribir con el skill `<cliente>-copywriter`.

## Audio
Biblioteca en `assets/musica`. Cada pieza indica qué pista usa.
```

---

## 8. Checklist de arranque

- [ ] Carpeta `W:\<CLIENTE>\Studio` con la estructura vacía
- [ ] `CLAUDE.md` raíz + `<proyecto>-videos/CLAUDE.md` adaptado
- [ ] `brand/`: styleguide, fuentes, logos
- [ ] `tokens.css` con prefijo propio + `DESIGN.md`, revisados y congelados
- [ ] Herramientas copiadas y sin textos de Haras
- [ ] Skill `<cliente>-copywriter`
- [ ] Decisión sobre el hub (A, B o Drive)
- [ ] Pieza piloto en 4:5 y 9:16, verificada y entregada
- [ ] `SESION-AAAA-MM-DD.md` de la primera sesión
