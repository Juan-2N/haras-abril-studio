"""Original para imprenta del catálogo tríptico 36 x 38 cm.

Uso (desde cualquier carpeta):
    python exportar-imprenta.py [--diseno "Martín"] [--aprobo "Román"] [--fecha 18/11/2026] [--version 1]

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


MONTSERRAT = os.path.expanduser(r"~\AppData\Local\Microsoft\Windows\Fonts")
LOGO_DN = os.path.join(AQUI, "rotulo", "doble-nuez.svg")
CUERPOS = {1: "118 | 121 | 121 mm", 2: "121 | 121 | 118 mm"}
NOMBRE_LADO = {1: "Exterior", 2: "Interior"}


def fuente(nombre, respaldo):
    f = os.path.join(MONTSERRAT, nombre)
    return f if os.path.exists(f) else os.path.join(FUENTES, respaldo)


def rotulo(page, x, y, ancho, n, a):
    """Rótulo con el formato de Doble Nuez: logo a la izquierda y celdas de etiqueta + valor."""
    linea = (0, 0, 0, 0.2)
    etiqueta = (0, 0, 0, 0.55)
    valor = (0, 0, 0, 0.9)
    page.insert_font(fontname="mr", fontfile=fuente("Montserrat-Regular.ttf", "BarlowCondensed-Regular.ttf"))
    page.insert_font(fontname="ms", fontfile=fuente("Montserrat-SemiBold.ttf", "BarlowCondensed-Bold.ttf"))
    f_mr = fitz.Font(fontfile=fuente("Montserrat-Regular.ttf", "BarlowCondensed-Regular.ttf"))
    f_ms = fitz.Font(fontfile=fuente("Montserrat-SemiBold.ttf", "BarlowCondensed-Bold.ttf"))

    alto, fila = 26 * MM, 13 * MM
    logo_w = 72 * MM
    col_w = (ancho - logo_w) / 5
    page.draw_rect(fitz.Rect(x, y, x + ancho, y + alto), color=linea, width=0.7)
    page.draw_line((x + logo_w, y + fila), (x + ancho, y + fila), color=linea, width=0.7)
    for k in range(5):
        cx = x + logo_w + k * col_w
        page.draw_line((cx, y), (cx, y + alto), color=linea, width=0.7)

    # Logo Doble Nuez (vectorial) + bajada
    svg = fitz.open(LOGO_DN)
    pdf = fitz.open("pdf", svg.convert_to_pdf())
    lw = 44 * MM
    lh = lw * pdf[0].rect.height / pdf[0].rect.width
    lx, ly = x + (logo_w - lw) / 2, y + 7.2 * MM
    page.show_pdf_page(fitz.Rect(lx, ly, lx + lw, ly + lh), pdf, 0)
    baj = "Smart Design and Development"
    t = 6.2
    page.insert_text((x + (logo_w - f_mr.text_length(baj, t)) / 2, ly + lh + 4.6 * MM), baj, fontname="mr", fontsize=t, color=etiqueta)

    celdas = [
        [("PROYECTO", "Catálogo Remate 2026"), ("CLIENTE", "Haras Abril")],
        [("LADO", f"Pág. {n}/2 · {NOMBRE_LADO[n]}"), ("FECHA", f"{a.fecha} · v{a.version}")],
        [("MEDIDA", "360 × 380 mm (cerrado 121)"), ("PLEGADO", f"Envolvente · {CUERPOS[n]}")],
        [("IMPRESIÓN", "4/4 CMYK · FOGRA39 · 300 dpi"), ("PAPEL", f"Ilustración {a.gramaje} g · semimate")],
        [("DISEÑÓ", a.diseno or "—"), ("APROBÓ", a.aprobo or "—")],
    ]
    for k, col in enumerate(celdas):
        cx = x + logo_w + k * col_w + 3 * MM
        for r, (et, va) in enumerate(col):
            cy = y + r * fila
            page.insert_text((cx, cy + 4.4 * MM), et, fontname="mr", fontsize=5.6, color=etiqueta)
            tv = 9.5
            while f_ms.text_length(va, tv) > col_w - 5 * MM and tv > 6:
                tv -= 0.25
            page.insert_text((cx, cy + 10 * MM), va, fontname="ms", fontsize=tv, color=valor)

    nota = ("Demasía 5 mm por lado · solo marcas de corte · hendido en los pliegues · "
            "frente y dorso con giro lateral · archivo HA26_Catalogo_36x38cm_imprenta.pdf")
    page.insert_text((x, y + alto + 4.2 * MM), nota, fontname="mr", fontsize=5.8, color=etiqueta)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--diseno", default="Martín")
    ap.add_argument("--aprobo", default="Román")
    ap.add_argument("--fecha", default=datetime.date.today().strftime("%d/%m/%Y"))
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
            rotulo(page, corte.x0, corte.y1 + (MARGEN - 2) * MM, corte.width, n, a)
        doc.set_metadata({"title": "HA26 Catálogo 36x38 cm · original para imprenta", "creator": "Haras Abril Studio"})
        doc.save(a.salida, deflate=True, garbage=3)
    print(a.salida)


if __name__ == "__main__":
    main()
