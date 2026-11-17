# Mockup catálogo Remate 2026 · prompt para Magnific Spaces

Imágenes de referencia (en esta carpeta, 300 dpi):

| Archivo | Uso |
|---|---|
| `HA26-Catalogo-exterior.jpg` | Lado exterior abierto (solapa · contratapa · tapa) |
| `HA26-Catalogo-interior.jpg` | Lado interior abierto (lotes 01–12) |
| `HA26-Catalogo-C-tapa.jpg` | Tapa sola, para el folleto cerrado |
| `HA26-Catalogo-B-contratapa.jpg` | Contratapa sola (sponsors) |
| `HA26-Catalogo-A-solapa.jpg` | Solapa sola (lote 13, cómo participar, programa) |

Medidas: abierto 360 × 380 mm; cerrado 121 × 380 mm (muy alto y angosto, proporción ≈ 1:3,1). Tríptico envolvente: la solapa (118 mm) se pliega hacia adentro.

---

## Prompt principal v2 (17/11) · con @refe_mockup

Referencias a cargar en Spaces, con estos nombres:
- `@refe_mockup`: la imagen de referencia de composición del usuario (tríptico abierto parado en zigzag + uno cerrado al lado, fondo gris de estudio).
- `@interior` → `HA26-Catalogo-interior.jpg`
- `@tapa` → `HA26-Catalogo-C-tapa.jpg`

```
Photorealistic premium product mockup of a printed trifold brochure, following the composition, camera angle and lighting of @refe_mockup: one brochure open and standing upright on its bottom edge in a gentle zigzag (three panels, two vertical folds), and a second brochure closed and standing upright to its right.

Artwork: apply @interior exactly onto the three panels of the open brochure, and @tapa exactly onto the front of the closed brochure. The artwork is final and must be reproduced 1:1: do not deform, stretch, crop, redraw, translate or reinterpret any element. Keep every text, number, logo, QR code, photo, color and margin exactly as in the references; only add the natural perspective and the soft light and shadow of the paper folds.

Proportions (do not change): the open brochure is 36 x 38 cm, almost square, each panel about 12 x 38 cm. The closed brochure is very tall and narrow, 12 x 38 cm (ratio about 1:3.1), taller and slimmer than the brochures in @refe_mockup.

Paper: thick matte uncoated paper, 300 gsm, clean sharp edges, subtle paper texture, crisp folds with a soft highlight on each crease. Rich charcoal and black ink with warm gold accents, no gloss, no reflections over the print.

Background: subtle and premium. Seamless studio backdrop in warm dark grey to charcoal, smooth gradient, slightly lighter behind the brochures; floor in the same tone with a soft contact shadow and a very faint reflection. Nothing else in the scene: no props, no text, no patterns. Soft diffused key light from the upper left, gentle fill, quiet luxury mood.

High-end editorial product photography, 70 mm lens, eye level slightly above the floor, sharp focus on both brochures, natural colors, ultra detailed.
```

**Negativo:**

```
deformed artwork, stretched or squashed design, warped text, invented or misspelled text, changed layout, cropped panels, distorted logos, unreadable QR codes, wrong aspect ratio, short wide brochure, extra panels or folds, glossy plastic, glare on the print, props, busy background, bright white background, colored background, harsh shadows, cartoon, illustration, oversaturated colors
```

**Si deforma el arte:** subir la fuerza de la referencia de contenido de `@interior` y `@tapa`, y bajar la de `@refe_mockup` (que solo marque pose, cámara y luz). Si igual cambia el texto, generar la escena con los folletos en blanco y pegar el arte en Photoshop.

---

## Prompt principal v1 (composición con 3 folletos sobre mesa)

```
Photorealistic product mockup of a premium printed trifold brochure (letter fold / roll fold) for a high-end equestrian horse auction. Three copies arranged on a dark walnut wood table:
1) one brochure fully open flat, showing the inside spread with a grid of 12 horse cards (use reference image "interior"),
2) one brochure half open, standing slightly, showing the inner flap and the back panel with sponsor logos (use reference "exterior"),
3) one brochure closed, lying on top, showing the dark charcoal cover with the gold circular seal, the words "REMATE 2026" and a gold button (use reference "tapa").
Closed brochure is very tall and narrow (12 x 38 cm, ratio about 1:3). Open brochure is almost square (36 x 38 cm).
Thick uncoated matte paper, 300 gsm, crisp folds with subtle paper relief at the creases, slight soft shadows under the folds. Deep charcoal and black printing with warm gold accents.
Mood: elegant, quiet luxury, Argentine horse stud farm. Soft warm late-afternoon window light from the left, gentle shadows, shallow depth of field. A leather riding glove and a pair of reading glasses at the edge of the frame, out of focus.
Top-down 3/4 angle, 50 mm lens, editorial photography, ultra detailed, natural colors.
Keep all printed content exactly as in the reference images: do not change, redraw or invent text, logos, photos or layout.
```

**Negative prompt:**

```
distorted text, invented text, misspelled words, warped logos, extra panels, wrong number of folds, glossy plastic look, cartoon, illustration, blurry print, oversaturated colors, cluttered background, hands covering the brochure
```

---

## Variantes (una imagen por toma)

**A · Tapa cerrada, de frente** (referencia: `C-tapa`)

```
Photorealistic close-up of a single closed tall narrow trifold brochure (12 x 38 cm) standing upright, leaning against a dark stone wall on a walnut table. Front cover exactly as the reference: charcoal background, gold circular seal, "HARAS ABRIL" logotype, "REMATE 2026", gold button. Thick matte paper, visible fold edge on the right side. Warm side light, soft shadow, premium editorial product shot, 85 mm lens. Do not alter the printed design.
```

**B · Interior abierto, cenital** (referencia: `interior`)

```
Photorealistic top-down flat lay of an open trifold brochure (36 x 38 cm) lying flat on a light linen surface, showing the inside spread exactly as the reference image: 12 horse cards in two rows, with photos, names, data and QR codes. Two subtle vertical fold creases dividing it into three panels. Matte 300 gsm paper with soft paper texture, even soft daylight, no glare. A brass horseshoe and a sprig of olive leaves at one corner. Do not alter the printed design.
```

**C · En mano, abriéndose** (referencias: `A-solapa` + `B-contratapa`)

```
Photorealistic lifestyle shot of a hand opening a tall trifold brochure, the inner flap half unfolded revealing the event schedule and a horse card, the back panel with sponsor logos visible. Blurred background of a horse stable at golden hour. Matte premium paper, natural fold curvature. Shallow depth of field, 50 mm lens. Keep the printed design exactly as the references.
```

---

### Consejos para Spaces

- Cargar las referencias como **image reference / style reference del contenido**, no como "inspiración": la idea es que no redibuje el texto.
- Si deforma la tipografía o los QR, generar la escena con las caras lisas y aplicar el arte después en Photoshop (Smart Object con perspectiva), o usar la tapa sola (`C-tapa`) que tiene menos texto chico.
- Para la toma B el modelo respeta mejor el arte si se pide **vista cenital pura** (sin perspectiva).
