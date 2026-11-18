"""Original para imprenta del catálogo tríptico 36 x 38 cm.

Uso (desde cualquier carpeta):
    python exportar-imprenta.py --diseno "Nombre" --aprobo "Nombre"

Arma un PDF de 2 páginas (1 exterior, 2 interior):
- CMYK (perfil Coated FOGRA39), 300 dpi, tamaño real;
- demasía de 5 mm por lado (se estira el último píxel del borde);
- solo marcas de corte (sin marcas de pliegue);
- rótulo fuera del área de corte.
TrimBox y BleedBox quedan definidos en el PDF.

Requiere: Chrome, ImageMagick (magick), PyMuPDF (fitz) y Pillow.
"""
import argparse, datetime, os, subprocess, sys, tempfile
import fitz  # PyMuPDF

AQUI = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.abspath(os.path.join(AQUI, "..", "..", ".."))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SRGB = r"C:\Windows\System32\spool\drivers\color\sRGB Color Space Profile.icm"
FOGRA = r"C:\Program Files (x86)\Common Files\Adobe\Color\Profiles\Recommended\CoatedFOGRA39.icc"
FUENTES = os.path.join(AQUI, "..", "..", "brand", "fonts")

MM = 72 / 25.4                 # puntos PDF por mm
DPI = 300
PX_MM = DPI / 25.4             # 11.811 px por mm
ANCHO, ALTO = 360, 380         # corte, mm
DEMASIA = 5                    # mm por lado
MARGEN = 15                    # zona de marcas, mm por lado
ROTULO = 34                    # alto extra abajo para el rótulo, mm

LADOS = [
    ("exterior", "EXTERIOR · solapa (118) | contratapa (121) | tapa (121)"),
    ("interior", "INTERIOR · lotes 01 a 12 · cuerpos 121 | 121 | 118 (dorso de la solapa)"),
]


def sh(*cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"Falló: {' '.join(cmd)}\n{r.stderr}")


def rasterizar(tmp):
    """Captura los dos lados a 300 dpi, sin guías, y devuelve un TIFF CMYK por lado (con demasía)."""
    url = "file:///" + os.path.join(AQUI, "index.html").replace("\\", "/").replace(" ", "%20") + "#imprimir"
    escala = DPI / 96                                  # 1 px CSS = 1/96 in
    alto_css = round(2 * ALTO * 96 / 25.4) + 2
    ancho_css = round(ANCHO * 96 / 25.4) + 1
    png = os.path.join(tmp, "todo.png")
    sh(CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--force-device-scale-factor={escala}",
       f"--window-size={ancho_css},{alto_css}", "--virtual-time-budget=10000", f"--screenshot={png}", url)
    w, h = round(ANCHO * PX_MM), round(ALTO * PX_MM)
    d = round(DEMASIA * PX_MM)
    salida = []
    for i, (nombre, _) in enumerate(LADOS):
        tif = os.path.join(tmp, f"{nombre}.tif")
        sh("magick", png, "-crop", f"{w}x{h}+0+{i * h}", "+repage",
           # demasía: se estira la última fila de píxeles (en espejo se duplicaba texto cercano al borde)
           "-virtual-pixel", "edge", "-set", "option:distort:viewport", f"{w + 2 * d}x{h + 2 * d}-{d}-{d}",
           "-distort", "SRT", "0", "+repage",
           "-profile", SRGB, "-intent", "relative", "-black-point-compensation", "-profile", FOGRA,
           "-density", str(DPI), "-units", "PixelsPerInch", "-compress", "zip", tif)
        salida.append(tif)
    return salida


def marcas(page, x0, y0, x1, y1):
    """Marcas de corte en las 4 esquinas, en color de registro, fuera de la demasía."""
    reg = (1, 1, 1, 1)
    sep, largo = (DEMASIA + 1) * MM, 6 * MM
    for x, sx in ((x0, -1), (x1, 1)):
        for y, sy in ((y0, -1), (y1, 1)):
            page.draw_line((x + sx * sep, y), (x + sx * (sep + largo), y), color=reg, width=0.25)
            page.draw_line((x, y + sy * sep), (x, y + sy * (sep + largo)), color=reg, width=0.25)


def rotulo(page, x, y, ancho, n, titulo_lado, a):
    negro = (0, 0, 0, 1)
    gris = (0, 0, 0, 0.6)
    fb = os.path.join(FUENTES, "BarlowCondensed-Bold.ttf")
    fr = os.path.join(FUENTES, "BarlowCondensed-Regular.ttf")
    page.insert_font(fontname="bb", fontfile=fb)
    page.insert_font(fontname="br", fontfile=fr)
    alto = 24 * MM
    page.draw_rect(fitz.Rect(x, y, x + ancho, y + alto), color=negro, width=0.4)
    cols = [x, x + ancho * 0.30, x + ancho * 0.58, x + ancho * 0.80]
    for cx in cols[1:]:
        page.draw_line((cx, y), (cx, y + alto), color=negro, width=0.3)

    def txt(cx, cy, s, f="br", t=7.2, c=negro):
        page.insert_text((cx + 2.2 * MM, cy), s, fontname=f, fontsize=t, color=c)

    l = lambda k: y + (4.6 + k * 4.4) * MM
    txt(cols[0], l(0), "HARAS ABRIL · CATÁLOGO REMATE 2026", "bb", 9.5)
    txt(cols[0], l(1), "Tríptico envolvente · " + f"página {n}/2", "br", 7.5)
    txt(cols[0], l(2), titulo_lado, "bb", 7.2)
    txt(cols[0], l(3), "Archivo: HA26_Catalogo_36x38cm_imprenta.pdf", "br", 6.6, gris)

    txt(cols[1], l(0), "MEDIDAS", "bb", 7.2)
    txt(cols[1], l(1), "Abierto: 360 × 380 mm  ·  cerrado: 121 × 380 mm")
    txt(cols[1], l(2), "Demasía: 5 mm por lado  ·  solo marcas de corte")
    txt(cols[1], l(3), "Frente/dorso: giro lateral (izquierda-derecha)")

    txt(cols[2], l(0), "IMPRESIÓN Y PAPEL", "bb", 7.2)
    txt(cols[2], l(1), "4/4 CMYK · Coated FOGRA39 · 300 dpi")
    txt(cols[2], l(2), f"Papel: ilustración {a.gramaje} g/m²")
    txt(cols[2], l(3), "Terminación: semimate · hendido en pliegues")

    txt(cols[3], l(0), "CONTROL", "bb", 7.2)
    txt(cols[3], l(1), f"Fecha: {a.fecha}  ·  v{a.version}")
    txt(cols[3], l(2), f"Diseñó: {a.diseno or '______________________'}")
    txt(cols[3], l(3), f"Aprobó: {a.aprobo or '______________________'}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--diseno", default="")
    ap.add_argument("--aprobo", default="")
    ap.add_argument("--fecha", default=datetime.date.today().strftime("%d.%m.%Y"))
    ap.add_argument("--version", default="1")
    ap.add_argument("--gramaje", default="250")
    ap.add_argument("-o", "--salida", default=os.path.join(STUDIO, "remate-videos", "salida", "impresos", "HA26_Catalogo_36x38cm_imprenta.pdf"))
    a = ap.parse_args()
    os.makedirs(os.path.dirname(a.salida), exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        tifs = rasterizar(tmp)
        doc = fitz.open()
        W = (ANCHO + 2 * MARGEN) * MM
        H = (ALTO + 2 * MARGEN + ROTULO) * MM
        for n, ((nombre, titulo), tif) in enumerate(zip(LADOS, tifs), 1):
            page = doc.new_page(width=W, height=H)
            corte = fitz.Rect(MARGEN * MM, MARGEN * MM, (MARGEN + ANCHO) * MM, (MARGEN + ALTO) * MM)
            sangre = fitz.Rect(corte.x0 - DEMASIA * MM, corte.y0 - DEMASIA * MM, corte.x1 + DEMASIA * MM, corte.y1 + DEMASIA * MM)
            page.insert_image(sangre, pixmap=fitz.Pixmap(tif))
            page.set_bleedbox(sangre)
            page.set_trimbox(corte)
            marcas(page, corte.x0, corte.y0, corte.x1, corte.y1)
            rotulo(page, corte.x0, corte.y1 + (MARGEN - 2) * MM, corte.width, n, titulo, a)
        doc.set_metadata({"title": "HA26 Catálogo 36x38 cm · original para imprenta", "creator": "Haras Abril Studio"})
        doc.save(a.salida, deflate=True, garbage=3)
    print(a.salida)


if __name__ == "__main__":
    main()
