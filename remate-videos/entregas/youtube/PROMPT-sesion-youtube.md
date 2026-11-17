# Sesión: subir los videos por lote del Remate 2026 a YouTube

Trabajamos en `W:\HARAS ABRIL\Studio\remate-videos`. Antes de empezar leé `CLAUDE.md` (sección "Video por lote") y `SESION-2026-11-08.md`.

## Objetivo
Subir al canal de Haras Abril (`youtube.com/@harasabril`) los videos por lote del Remate 2026, cada uno con su miniatura, título y descripción, dentro de una lista de reproducción. Después, cargar cada link en la ficha del caballo en el sitio.

## Reglas
- **Nada queda público sin mi confirmación, video por video.** Primero todo en Privado.
- La visibilidad final acordada es **Público**.
- No re-renderices ni regeneres lotes: eso lo hace otra sesión.
- Si algo no coincide con lo que dice este documento, frená y preguntame.

## Qué está listo
Lotes **01 (ABRIL TOP FIRE I)** y **02 (ABRIL TAP BLUE)**. Los lotes 03 a 13 no tienen video final: se suben más adelante.

Cada lote tiene su carpeta en `salida/lotes/NN_NOMBRE/`:
- `00-00-HA-VideoLote-16x9-NN.mp4`: el video
- `Portada-YouTube-LoteNN.jpg`: la miniatura
- `Titulo-y-descripcion.txt`: pegar tal cual

Si un lote se renderiza de nuevo, las carpetas se actualizan con `node herramientas/armar-descripcion-yt.mjs NN`.

## Estado del lote 01 (verificar en Studio)
Yo arrastré el video, pegué la descripción y subí la portada. **Todavía no lo revisó nadie**, así que confirmá cómo quedó:
- La descripción que pegué puede tener el WhatsApp viejo (`3140-9537`). Tiene que decir **`+54 9 11 7302-4522`**: comparala con `Titulo-y-descripcion.txt`.
- Tiene que quedar en **Privado**, con "no es contenido para niños" y dentro de la lista.
- Antes de pasarlo a Público hay que esperar a que actualice el Linktree (`linktr.ee/harasabril`, que figura en la descripción). Yo aviso.

## Lista de reproducción
- **Nombre:** `HARAS ABRIL | REMATE 2026`, con los videos ordenados por número de lote. Modelo: la lista "HARAS ABRIL | REMATE 2025" del canal.
- Mientras todo esté en prueba, creala en **Privado**. Pasa a Pública junto con los videos, con mi confirmación.
- **Descripción de la lista:**

> Remate 2026 💫 HARAS ABRIL
> Conocé los productos que se rematarán el sábado 28 de noviembre en nuestras instalaciones de Lezama, en el marco del CSI 1*. También podrás participar de manera online.
> Tu próxima estrella cada vez más cerca.
> #harasabril #simplementelamejorsangre #losmejoresresultados

## Cómo trabajar en YouTube Studio
- Usá Claude in Chrome. `studio.youtube.com` ya tiene permiso y mi sesión está abierta. Canal: `UC3HMNuA_OPr1Q-kUkVosuSQ`.
- **La extensión solo carga archivos de hasta 10 MB.** Los MP4 pesan unos 90 MB, así que los arrastro yo. La miniatura pesa 200 KB; podés cargarla vos si tu sesión tiene acceso al archivo.
- Abrí una pestaña nueva y no toques las que ya estén abiertas.
- Para cada video: título, descripción, miniatura, lista, "no es contenido para niños", Privado.

## Después de publicar cada video
1. En el `/admin` del sitio → Caballos → el caballo, pegar el link de YouTube en el campo **Video**, con mi confirmación. La ficha se actualiza sola, sin deploy. Solo funcionan links de YouTube.
2. Comprobar que `https://harasabril.com.ar/product/<slug>` muestre la sección Video con la portada y reproduzca. La URL de cada ficha está en `herramientas/video-lotes.json`.
3. Anotar lote, link y fecha en `herramientas/video-lotes.json` (campo `youtube`) y en un `SESION-*.md`.

## Control final por video
- Sin reclamos de derechos en Studio (la música, Battleborn Symphony, está aprobada para YouTube).
- Miniatura correcta y video dentro de la lista.
