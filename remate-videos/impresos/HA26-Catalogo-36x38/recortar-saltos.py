"""Recorte de las fotos de salto para las tarjetas del catálogo impreso.

Todas iguales: caballo entero (con cola y patas), centrado en horizontal y ocupando
el mismo ancho de la foto. Parte de los originales de videosreferencias/lotes/
(tienen más aire que los recortes 16:9 de assets/ que usan los videos).

Salida: assets/fotos/loteNN-salto-catalogo.jpg (no pisa las fotos de los videos).
Uso: python recortar-saltos.py [NN ...]
"""
import glob, os, sys
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RV = os.path.abspath(os.path.join(AQUI, "..", ".."))
ORIG = os.path.join(RV, "videosreferencias", "lotes")
SALIDA = os.path.join(RV, "assets", "fotos")

ASPECTO = 60.5 / 49      # caja de la foto de salto en la tarjeta (ancho / alto)
ANCHO_CABALLO = 0.78     # el caballo ocupa el 78 % del ancho de la foto
CENTRO_V = 0.46          # centro vertical del caballo, desde arriba (deja ver la valla abajo)
ANCHO_PX = 1400          # ≈ 590 dpi a 60,5 mm

# Caja del caballo (hocico, cruz, cola y cascos) en fracciones del original: x0, y0, x1, y1.
# Medida a ojo sobre una grilla; para retocar un lote, ajustar acá y volver a correr.
CAJAS = {
    "01": (0.350, 0.218, 0.749, 0.581),
    "02": (0.308, 0.282, 0.744, 0.651),
    "03": (0.275, 0.282, 0.700, 0.666),
    "04": (0.248, 0.249, 0.678, 0.741),
    "05": (0.298, 0.199, 0.684, 0.638),
    "06": (0.298, 0.217, 0.664, 0.616),
    "07": (0.272, 0.285, 0.655, 0.680),
    "08": (0.204, 0.228, 0.601, 0.644),
    "09": (0.285, 0.233, 0.660, 0.627),
    "10": (0.264, 0.238, 0.637, 0.603),
    "11": (0.235, 0.213, 0.662, 0.631),
}


def recortar(n):
    f = glob.glob(os.path.join(ORIG, f"{n}_*", "*alto*.jpg"))
    if not f:
        print(f"{n}: no hay original de salto"); return
    im = Image.open(f[0]).convert("RGB")
    W, H = im.size
    x0, y0, x1, y1 = CAJAS[n]
    cw = (x1 - x0) * W / ANCHO_CABALLO
    ch = cw / ASPECTO
    if ch > H:                                   # no entra en alto: se achica todo
        ch = H; cw = ch * ASPECTO
    cx, cy = (x0 + x1) / 2 * W, (y0 + y1) / 2 * H
    left = min(max(cx - cw / 2, 0), W - cw)
    top = min(max(cy - ch * CENTRO_V, 0), H - ch)
    if abs(left - (cx - cw / 2)) > 1:
        print(f"{n}: AVISO, no se pudo centrar en horizontal (falta imagen a un costado)")
    out = im.crop((round(left), round(top), round(left + cw), round(top + ch)))
    out = out.resize((ANCHO_PX, round(ANCHO_PX / ASPECTO)), Image.LANCZOS)
    dst = os.path.join(SALIDA, f"lote{n}-salto-catalogo.jpg")
    out.save(dst, quality=90)
    print(f"{n}: {os.path.basename(f[0])} -> {os.path.basename(dst)}")


if __name__ == "__main__":
    for n in (sys.argv[1:] or sorted(CAJAS)):
        recortar(n)
