#!/usr/bin/env python3
"""Download the latin subset of the Google Fonts used in the reel (SIL OFL)."""
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "fonts")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
FAMILIES = [
    "Barlow+Condensed:ital,wght@0,500;0,600;0,700;0,800;0,900;1,600;1,700;1,800;1,900",
    "Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500",
]
os.makedirs(OUT, exist_ok=True)
css_out = []
for fam in FAMILIES:
    url = "https://fonts.googleapis.com/css2?family=" + fam + "&display=block"
    css = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA})).read().decode()
    for block in re.findall(r"/\* (\S+) \*/\s*(@font-face \{.*?\})", css, re.S):
        subset, face = block
        if subset != "latin":
            continue
        family = re.search(r"font-family: '([^']+)'", face).group(1)
        style = re.search(r"font-style: (\w+)", face).group(1)
        weight = re.search(r"font-weight: (\d+)", face).group(1)
        src = re.search(r"url\((https://[^)]+)\)", face).group(1)
        name = f"{family.replace(' ', '')}-{weight}{'i' if style == 'italic' else ''}.woff2"
        path = os.path.join(OUT, name)
        if not os.path.exists(path):
            urllib.request.urlretrieve(src, path)
        rng = re.search(r"unicode-range: ([^;]+);", face).group(1)
        css_out.append(
            f"@font-face {{ font-family: '{family}'; font-style: {style}; font-weight: {weight}; "
            f"font-display: block; src: url('../assets/fonts/{name}') format('woff2'); unicode-range: {rng}; }}"
        )
with open(os.path.join(HERE, "..", "scene", "fonts.css"), "w") as f:
    f.write("\n".join(css_out) + "\n")
print(len(css_out), "faces")
