# Haras Abril 2026 — Reglas de diseño para video

Fuentes: styleguide en `brand/styleguide/` y plantillas `plantillas/HA_26_RRSS_*`.

> **Estilo v2 (28/10/2026).** En tipografía, fondos, separador de sangre y formato de fecha, este documento **reemplaza** al styleguide y a las plantillas. Referencias de la v2: `videosreferencias/lista/28_10_HA_Listas.png` y `videosreferencias/Lote-D/HA_Video_Lote_2026_D.pdf`. En el resto, el styleguide sigue mandando.

Todos los valores concretos están en `brand/tokens.css`. Este documento explica **cuándo** y **cómo** usarlos.

---

## 1. Una marca, tres niveles

| Nivel | Cuándo | Fondo / panel | Marca |
|---|---|---|---|
| **01 · Sello** | Institucional, aperturas, evento conjunto | Foto a sangre con velo, sin panel | Sello circular (emblema) |
| **02 · Remate 2026** | Momento comercial: lotes, listas, fechas, catálogo, registro | **Carbón** (`--ha-charcoal` / paneles `--ha-panel-dark`) | Sello + `REMATE 2026` |
| **03 · CSI 1★** | Momento deportivo: concurso, pista, resultados | **Negro** `#000` | Logotipo + `CONCURSO CSI 1*` |

**Regla de reconocimiento: carbón = Remate · negro = Concurso.** Ya no hay fondos ni paneles blancos (v2).
Evento conjunto (cuenta regresiva): foto a sangre con velo oscuro, texto blanco, `REMATE & CONCURSO CSI 1*`.

No usar el azul `#0C1C36` (versión anterior, descartada).

## 2. Constantes de cada pieza

1. **Marca**: en las piezas v2 se usa el **sello circular**. Si va el logotipo HARAS ABRIL, siempre la imagen, **nunca reescrito con texto**, en negativo.
2. **Estrella roja** `#E54235`: único acento de color. Va sobre el logotipo o junto a "1*". Nunca como texto, fondo o botón en piezas de redes.
3. **Línea dorada**: separa marca de evento. Sobre foto/negro lleva destello central (`--ha-gold-flare`); sobre blanco, filete dorado.
4. **Tipografías**: Barlow Condensed + EB Garamond (ver §4).

## 3. Color

- Paleta cerrada (ver tokens). No agregar colores.
- **Superficies (v2):** paneles, tarjetas, lower thirds y cajas de datos en `--ha-panel-dark` (ink translúcido) con borde dorado `--ha-line-gold` de 1–2 px, sobre foto a sangre.
- **Única superficie clara:** la franja de meta de la tarjeta de lista, `--ha-strip-light` con texto `--ha-strip-text`.
- Texto principal (nombres, sangre, datos): `--ha-white`.
- Numerales, "LOTE / 01", fechas destacadas y celdas de pedigrí: `--ha-sand` o `--ha-gold`.
- Texto secundario sobre oscuro: `--ha-gray-light`.
- Frases de cierre sobre oscuro: `--ha-sand` o blanco.
- Botones/pills: degradé dorado `--ha-gold-grad`, texto blanco o `--ha-ink`.
- Fotos: se pueden oscurecer con `--ha-veil-dark` o `--ha-veil-bottom` para legibilidad; no tintar de color.

## 4. Tipografía

| Rol | Familia | Estilo | Ejemplo |
|---|---|---|---|
**Regla v2: EB Garamond se usa SOLO en las tres frases de cierre (§7). Todo lo demás va en Barlow Condensed, entre Regular 400 y Bold 700. No se usa Light.**

| Rol | Familia | Estilo | Ejemplo |
|---|---|---|---|
| Título de evento | Barlow Condensed Bold | MAYÚSCULAS, tracking muy abierto (0.28em) | `REMATE` |
| Año / complemento | Barlow Condensed Regular | Mayúsculas o cifras | `2026`, `CONCURSO CSI 1*` |
| Subtítulo | Barlow Condensed Bold | MAYÚSCULAS | `LISTA DE LOTES` |
| Nombre de lote | Barlow Condensed Bold | MAYÚSCULAS, tracking 0.06em, blanco | `ABRIL SALIKA` |
| Numerales | Barlow Condensed Medium | sand/dorado, tracking 0.10em | `01`, `LOTE / 01` |
| Datos / pedigrí | Barlow Condensed Regular | MAYÚSCULAS, separador ` × ` | `ABRIL OFIRE × LARINO × QUALITY TOUCH` |
| Meta | Barlow Condensed Regular | MAYÚSCULAS, separador ` \| ` | `MACHO \| AAFE: 8496 \| 07.10.2024` |
| Fecha | Barlow Condensed Regular | `DD.MM.AAAA`, siempre dos dígitos | `28.11.2026` |
| Botón / eyebrow | Barlow Condensed Medium | MAYÚSCULAS, tracking 0.16em | `VER LOTES →` |
| **Frase de cierre** | **EB Garamond Italic** | Sentence case, una vez por pieza, solo en el cierre | *Tu próxima estrella cada vez más cerca.* |

- Firma: `REMATE 2026` → REMATE en Bold + 2026 en Regular. Con el concurso: `REMATE & CONCURSO CSI 1*`.
- Separador de sangre: ` × ` con espacios. Separador de meta: ` | `.
- Fechas: `DD.MM.AAAA` con puntos y dos dígitos (`07.10.2024`).

## 5. Composición

- **Eje central**: todo centrado horizontalmente. Las piezas son simétricas.
- **Márgenes laterales**: 108 px (tarjetas y paneles). Nada de texto a menos de 96 px del borde.
- **Zonas seguras 9:16**: contenido clave entre y = 270 y y = 1580 (arriba la barra de IG, abajo la caja de respuesta).
- **Paneles**: rectángulo carbón translúcido (Remate, `--ha-panel-dark`) o negro (CSI), sobre foto a sangre, con borde dorado fino. Esquinas rectas. Sin sombras.
- **Orden dentro del panel**: estrella → logotipo → línea dorada → título de evento → claim → botón.
- **Diagrama de estrella**: líneas finas (1 px, blanco 28%) que nacen de un punto superior y se abren en forma de estrella de 4 puntas detrás del contenido. Es textura, nunca protagonista.
- **Fotos**: a sangre, sujeto (caballo) visible fuera del panel. El panel nunca tapa la cabeza del caballo.
- **Tarjeta de lote** (lista, v2): `--ha-panel-dark` con borde dorado. Número sand/dorado arriba a la izquierda, junto a una diagonal dorada. Nombre en Barlow Bold blanco, centrado. Sangre en Barlow Regular blanco debajo. Abajo, **franja clara** `--ha-strip-light` con la meta en `--ha-strip-text`. Máximo 4 por vista.
- **Encabezado de lista**: `REMATE` (Bold, tracking abierto) a la izquierda, sello al centro y fecha `28.11.2026` (Regular) a la derecha.
- **Lower third** (video de lote): barra `--ha-panel-dark` con borde dorado fino. A la izquierda `01 / NOMBRE` (número sand + diagonal + nombre Bold blanco); a la derecha la sangre en Regular.
- **Presentación de lote**: sello, nombre Bold blanco, línea dorada con destello y sangre Regular. Debajo `LOTE / 01` en sand.
- **Cajas de datos**: grilla 2×2 de cajas `--ha-panel-dark` con borde dorado (sexo, pelo, AAFE, fecha), texto blanco Regular centrado.
- **Pedigrí**: grilla de celdas `--ha-panel-dark` con borde dorado, texto sand Regular; ancestros destacados en blanco Bold.
- **Paginador**: puntos negros con borde dorado; el activo, dorado metálico.
- **Botón**: pill dorada de 76 px de alto, texto Barlow Condensed en mayúsculas + flecha `→` o ícono a la izquierda.
- **Sello**: respetar área de resguardo de ~23% de su diámetro alrededor.

## 6. Movimiento (video)

Tono: sobrio, premium, sin rebotes ni efectos llamativos.

- **Entradas**: fundido + desplazamiento corto (24–40 px) hacia arriba, `--ha-ease-out`, 0.6–0.9 s. Elementos de una lista en cascada (`--ha-stagger` 0.12 s).
- **Línea dorada**: se dibuja desde el centro hacia los lados (scaleX 0 → 1).
- **Estrella**: aparece con escala 0.6 → 1 y leve giro; es el primer o último gesto, nunca rebota.
- **Tracking**: los títulos espaciados pueden entrar con el tracking algo cerrado y abrirse hasta su valor.
- **Fondo**: foto con zoom lento (Ken Burns 1.00 → 1.06) durante toda la pieza; clip de video si existe.
- **Salidas**: fundido suave (0.5–0.7 s, `--ha-ease-in`), en orden inverso o todo junto. Último medio segundo limpio.
- Nada de giros 3D, glitch, rebotes ni transiciones de barrido de color.

## 7. Copy fijo

Estas tres bajadas son **el único texto en EB Garamond** (itálica).

| Instancia | Firma | Bajada |
|---|---|---|
| Institucional | HARAS ABRIL | La mejor sangre. Los mejores resultados. |
| Concurso | HARAS ABRIL · CONCURSO CSI 1* 2026 | El evento de salto ecuestre del año |
| Remate | HARAS ABRIL · REMATE 2026 | Tu próxima estrella cada vez más cerca. |

Fechas: Pre-ofertas lun 23/11 · CSI 1★ vie 27/11 · Remate sáb 28/11 · Gran Premio dom 29/11 (2026), Lezama.
URLs: harasabril.com.ar · remateharasabril.com

## 8. Pendientes

- Formato **4:5 (feed)**: no hay plantillas todavía; se adapta desde 9:16 recentrando el panel (zonas seguras 96 px).
- Fondos limpios (sin textos) de cada plantilla para poder animar los elementos por separado.
- Logos vectoriales (SVG) para reemplazar los PNG.
