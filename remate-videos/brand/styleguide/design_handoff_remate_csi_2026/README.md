# Handoff: Haras Abril — Sistema de identidad REMATE 2026 y CSI 1★

## Overview
Presentación de propuesta de diseño (10 slides, 1920×1080, 16:9) que define el sistema visual del evento Haras Abril 2026: **Remate 2026** + **Concurso CSI 1★**. Una marca, tres niveles de uso:

1. **Sello / Emblema** → comunicación institucional (aperturas, perfil de redes, papelería, cartelería).
2. **Logotipo + REMATE 2026** → fondo **blanco**. Momento comercial: lotes, fechas, catálogo.
3. **Logotipo + CSI 1★** → fondo **negro** (`#000000`). Momento deportivo y de espectáculo.

Regla clave de reconocimiento: **blanco = Remate · negro = Concurso**.

> Nota: una versión anterior usaba azul profundo `#0C1C36` para el CSI. Fue **reemplazado por negro `#000000`**. No usar el azul.

## About the Design Files
Los archivos de este paquete son **referencias de diseño creadas en HTML**: muestran el aspecto y el comportamiento buscados, no son código de producción para copiar tal cual. La tarea es **recrear estos diseños en el entorno del proyecto de destino** (Framer, React, plantillas de email, generador de piezas para redes, etc.) con sus patrones y librerías. Si todavía no hay entorno, elegir el framework más adecuado.

Para ver la presentación: abrir `Propuesta Remate CSI 2026.dc.html` en un navegador desde un servidor local (por ejemplo `npx serve .`). Navegación con las flechas ←/→.

## Fidelity
**High-fidelity.** Colores, tipografías, espaciados y copy son finales. Recrear con precisión de píxel.

Excepción: los tres posts CSI en negro (`assets/HA_26_RRSS_08-negro.png`, `08-copy-negro.png`, `11-negro.png`) son **conversiones provisorias** del azul al negro, hechas por software. El cielo de las fotos quedó gris y aparecen tonos magenta en las estrellas del 08-copy. **Reemplazarlos por los exports finales** de `W:\HARAS ABRIL\Diseño\POST\10_OCT`.

## Design Tokens

### Colores (no agregar otros)
| Token | Hex | Uso |
|---|---|---|
| Charcoal | `#2B2B2B` | Fondo base de la presentación / institucional |
| Charcoal elev | `#1F1F1F` | Paneles (detrás del sello, tarjetas) |
| Negro CSI | `#000000` | Fondo del nivel CSI |
| Blanco | `#FFFFFF` | Fondo del nivel Remate; tipografía sobre oscuro |
| Rojo estrella | `#E54235` | **Solo acento**: estrella y botón CTA. Hover `#C8362B`, press `#A82A22` |
| Dorado | `#C6A47E` | Líneas finas, eyebrows, numeración, claim sobre blanco |
| Arena | `#FEDBA3` | Claim serif sobre oscuro |
| Gris | `#717171` | Texto secundario sobre blanco |
| Gris claro | `#B6B6B6` | Texto secundario sobre oscuro |

Líneas: dorado al 55% → `rgba(198,164,126,0.55)`, 1px. Bordes neutros: `rgba(255,255,255,0.22)` (pills) / `0.10` (paneles).

### Tipografía
| Rol | Familia | Peso | Notas |
|---|---|---|---|
| H1 | Nunito Sans | 800 ExtraBold | Sentence case, `letter-spacing:-0.02em`, `line-height:1.04` |
| H2 / eyebrow | Barlow Condensed | 600 SemiBold | MAYÚSCULAS, `letter-spacing:0.18em` |
| H3 | Nunito Sans | 800 | — |
| Body | Barlow | 400 | `line-height:1.5` |
| Descripciones | Barlow Condensed | 400 | — |
| Claim / bajada | EB Garamond Italic | 400–500 | **Solo como acento** (ej. "Tu próxima estrella cada vez más cerca.") |

Google Fonts: `EB+Garamond:ital,wght@1,400;1,500`, `Barlow:wght@400;600`, `Barlow+Condensed:wght@400;600;700`, `Nunito+Sans` (también incluida en el design system).

El logotipo "HARAS ABRIL" **nunca se reescribe con texto**: usar siempre la imagen.

Escala en slides (1920×1080): H1 portada 120px · H1 interior 80–96px · eyebrow 34px · H3 44px · body 32px · descripciones 28–30px · claim 52–60px.

### Espaciado y grilla
- Márgenes de slide: 110px arriba · 120px laterales · 96px abajo.
- Separación entre columnas: 48–96px. Gaps internos: 8 / 12 / 16 / 20 / 24 / 32px.
- Esquinas rectas en superficies. Botón: radio 8px. Pills: 999px.
- **Sin sombras** (salvo el glow rojo sutil al hacer hover en el CTA).
- Respetar el área de resguardo del sello: ~100px alrededor de un sello de 440px (≈23% del diámetro).

## Screens / Slides

1. **Portada** — Grilla `1fr | 608px`. Izquierda (charcoal): logo (300px de ancho) arriba; eyebrow "PROPUESTA DE DISEÑO"; H1 "Sistema de identidad"; "REMATE 2026 Y CSI 1" + estrella roja de 44px; línea dorada de 160px; claim serif en arena. Pie: "27 · 28 · 29 NOVIEMBRE 2026 | DOBLE NUEZ · OCTUBRE 2026". Derecha: `HA_26_RRSS_00` a sangre (object-fit cover).
2. **Concepto** — Eyebrow + grilla de dos columnas (H1 "Una marca, tres niveles de uso" | body). Línea dorada. Tres tarjetas de 300px de alto: sello sobre `#1F1F1F`, logo sobre blanco, logo sobre negro. Cada una con número dorado, H3 y descripción.
3. **Sello** — Grilla 50/50. Izquierda `#1F1F1F`: sello de 440px dentro de un recuadro punteado dorado de 640px ("ÁREA DE RESGUARDO"). Derecha: eyebrow "NIVEL 01 · SELLO / EMBLEMA", H1 "Comunicación institucional", body "Es la firma de autoridad del haras. Resume más de dieciocho años de trayectoria.", pills (Aperturas · Perfil de redes · Papelería · Cartelería), línea dorada, numeral "+18" de 140px + "AÑOS DE TRAYECTORIA".
4. **Remate** — Fondo blanco. Grilla `1fr | 700px`. Logo sobre blanco, eyebrow "NIVEL 02 · LOGOTIPO + REMATE 2026", H1 "Momento comercial y de decisión", tres atributos (Claridad / Sobriedad / Foco) bajo una línea dorada superior, claim serif dorado. Derecha: story `HA_26_RRSS_04` de 936px de alto con borde dorado.
5. **CSI** — Fondo `#000000`. Espejo de la slide 4. Pieza `pieza-csi-negro.png` de 580px con borde dorado; logo negro; "NIVEL 03 · LOGOTIPO + CSI 1★"; H1 "Momento deportivo y de espectáculo"; atributos Internacional / Competitivo / Diferenciado ("Negro = Concurso"); claim "Concurso Internacional de Salto Ecuestre".
6. **Constantes** — H1 "Lo que se mantiene en cada pieza". Cuatro columnas separadas por líneas doradas: Logotipo · Estrella roja · Tipografías ("Nunito Sans, Barlow y EB Garamond") · Línea dorada.
7. **Sistema en acción 1/2** — Dos grupos con encabezado (muestra de color + "REGLA 0X · …"), cada uno con tres stories 9:16 de 16px de gap. Sello: `003`, `01`, `09`. Blanco: `04 copy`, `04`, `10`.
8. **Sistema en acción 2/2** — Negro (Concurso CSI): `08-copy-negro`, `08-negro`, `11-negro`. Evento conjunto (cuenta regresiva): `02`, `05`, `06`.
9. **Por qué funciona** — Grilla 2×2 de bloques numerados: Reconocimiento inmediato (muestras blanco/negro) · Coherencia · Jerarquía clara · Escalabilidad (pills: Posts, Stories, Banners, Mailings, Cartelería).
10. **Próximos pasos** — Grilla `1.2fr | 1fr`. Lista numerada de 4 pasos con líneas doradas + **CTA rojo "VER ASSETS →"** (radio 8px, padding 26×44px, Barlow Condensed 600 34px) que abre https://drive.google.com/drive/folders/1aR_-aEf68NkSFpbkHMsuRb0JzHxP8mBz?usp=drive_link en una pestaña nueva. Derecha `#1F1F1F`: sello de 380px, línea dorada y claim en arena.

## Interactions & Behavior
- Navegación entre slides: teclado ←/→ (lo maneja `deck-stage.js`). El escalado se ajusta a la ventana.
- CTA: hover `#C8362B` + glow rojo sutil; active `#A82A22`. Sin escala.
- Links: dorado; en hover, arena con subrayado rojo de 1px.
- Sin animaciones.

## State Management
Ninguno. Es una presentación estática.

## Assets
| Archivo | Origen |
|---|---|
| `assets/logo-sobre-oscuro.png` | Recorte del logo oficial (design system) |
| `assets/logo-sobre-blanco.png` | Recortado de `HA_26_RRSS_04` → **reemplazar por el vectorial** |
| `assets/logo-negro.png` | Recortado del Artboard CSI en negro → **reemplazar por el vectorial** |
| `assets/emblema-circular.png` | Emblema oficial con recorte circular (sin fondo) |
| `assets/star.svg` | Estrella roja oficial |
| `assets/pieza-csi-negro.png` | Recorte del Artboard CSI en negro |
| `assets/HA_26_RRSS_*-negro.png` | Conversiones provisorias a negro → **reemplazar** |
| `uploads/HA_26_RRSS_*.jpg` | Posts y stories originales (1080×1920) |

## Files
- `Propuesta Remate CSI 2026.dc.html` — presentación completa (estilos inline).
- `deck-stage.js`, `support.js` — runtime para mostrar la presentación.
- `_ds/…/colors_and_type.css` — tokens del design system de Haras Abril.
