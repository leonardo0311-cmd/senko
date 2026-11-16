#!/usr/bin/env python3
"""Subset Inter Display and embed it (base64 WOFF2) into alk-travel.html.

Each @font-face in the HTML ends with a marker comment: /*@font InterDisplay-Black*/
The data URL in front of the marker is replaced, so the script can be re-run safely.
"""
import base64, io, os, re, sys
from fontTools import subset
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(HERE, "alk-travel.html")
FONT_DIR = "/usr/share/fonts/opentype/inter"
TEXT = ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        "ÁÉÍÓÚÜÑáéíóúüñ¿¡.,:;·-–—→←↑°′″+×/()!?'\"&@#%≈ ")

def woff2_b64(name):
    font = TTFont(os.path.join(FONT_DIR, name + ".otf"))
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "tnum", "case", "liga", "calt", "ccmp", "mark", "mkmk"]
    opts.name_IDs = ["*"]
    sub = subset.Subsetter(opts)
    sub.populate(text=TEXT)
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = "woff2"
    font.save(buf)
    return base64.b64encode(buf.getvalue()).decode()

src = open(HTML, encoding="utf-8").read()
pat = re.compile(r'(url\("data:font/woff2;base64,)([^"]*)("\) format\("woff2"\);?\s*\}\s*/\*@font ([\w-]+)\*/)')
def rep(m):
    return m.group(1) + woff2_b64(m.group(4)) + m.group(3)
out, n = pat.subn(rep, src)
open(HTML, "w", encoding="utf-8").write(out)
print(f"embedded {n} font faces, html = {len(out)/1024:.0f} KB")
