#!/usr/bin/env python3
"""Neon flyer for Maly Bar y Music: El Polaco live show.

Usage:
    python3 render_flyer.py
    python3 render_flyer.py --hora "22:00 HS" --info "Reservas al 11 1234-5678"

Writes output/flyer-polaco-{feed,story}.png (1080x1350 and 1080x1920).
Requires: Python 3, Pillow, numpy.
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "assets", "fonts")
LOGO = os.path.join(HERE, "..", "maly-outro", "assets", "maly-logo.png")
OUT = os.path.join(HERE, "output")

SCRIPT = os.path.join(FONTS, "Pacifico-Regular.ttf")
NEON = os.path.join(FONTS, "Monoton-Regular.ttf")
BEBAS = os.path.join(FONTS, "BebasNeue-Regular.ttf")

PINK = np.array([255, 50, 160], np.float32)
CYAN = np.array([70, 225, 255], np.float32)
VIOLET = np.array([150, 70, 255], np.float32)


# ---------- drawing helpers (float RGB canvas, additive light) ----------

def text_mask(text, font_path, size, spacing=0):
    font = ImageFont.truetype(font_path, size)
    if spacing:
        widths = [font.getlength(c) for c in text]
        w = int(sum(widths) + spacing * (len(text) - 1))
    else:
        w = int(font.getlength(text))
    asc, desc = font.getmetrics()
    pad = int(size * 0.6)
    im = Image.new("L", (w + pad * 2, asc + desc + pad * 2))
    d = ImageDraw.Draw(im)
    if spacing:
        x = pad
        for c, cw in zip(text, widths):
            d.text((x, pad), c, font=font, fill=255)
            x += cw + spacing
    else:
        d.text((pad, pad), text, font=font, fill=255)
    bbox = im.getbbox()
    m = int(size * 0.45)  # room for the halo so it never ends in a hard edge
    big = Image.new("L", (im.width + 2 * m, im.height + 2 * m))
    big.paste(im, (m, m))
    im, bbox = big, (bbox[0] + m, bbox[1] + m, bbox[2] + m, bbox[3] + m)
    return im.crop((bbox[0] - m, bbox[1] - m, bbox[2] + m, bbox[3] + m))


def neon(canvas, mask, cx, cy, color, glow=1.0, core=0.85):
    """Light up `mask` (PIL L) centred at (cx, cy): white-hot core, coloured tube, soft halo."""
    h = mask.height
    m = np.asarray(mask).astype(np.float32) / 255
    inner = np.asarray(mask.filter(ImageFilter.MinFilter(5 if h > 120 else 3))
                       .filter(ImageFilter.GaussianBlur(max(1, h * 0.012)))).astype(np.float32) / 255
    g1 = np.asarray(mask.filter(ImageFilter.GaussianBlur(max(2, h * 0.04)))).astype(np.float32) / 255
    g2 = np.asarray(mask.filter(ImageFilter.GaussianBlur(max(6, h * 0.14)))).astype(np.float32) / 255
    white = np.array([255, 245, 250], np.float32)
    light = (m[..., None] * color * 0.9
             + inner[..., None] * (white * core + color * (1 - core)) * 0.6
             + g1[..., None] * color * 0.9 * glow
             + g2[..., None] * color * 0.8 * glow)
    add_at(canvas, light, cx, cy)


def add_at(canvas, arr, cx, cy):
    h, w = arr.shape[:2]
    H, W = canvas.shape[:2]
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    sx0, sy0 = max(0, -x0), max(0, -y0)
    dx0, dy0 = max(0, x0), max(0, y0)
    dx1, dy1 = min(W, x0 + w), min(H, y0 + h)
    if dx1 > dx0 and dy1 > dy0:
        canvas[dy0:dy1, dx0:dx1] += arr[sy0:sy0 + dy1 - dy0, sx0:sx0 + dx1 - dx0]


def rounded_box(w, h, radius, stroke):
    pad = 90
    im = Image.new("L", (w + pad * 2, h + pad * 2))
    ImageDraw.Draw(im).rounded_rectangle((pad, pad, pad + w, pad + h), radius, outline=255, width=stroke)
    return im


def background(W, H, focus_y):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    base = np.array([10, 4, 22], np.float32) + (yy / H)[..., None] * np.array([18, 2, 26], np.float32)
    haze = np.exp(-(((xx - W / 2) / (W * 0.55)) ** 2 + ((yy - focus_y) / (H * 0.22)) ** 2))
    canvas = base + haze[..., None] * np.array([70, 8, 70], np.float32)
    # perspective neon floor grid at the bottom
    horizon = H * 0.80
    grid = np.zeros((H, W), np.float32)
    below = yy > horizon
    depth = (yy - horizon) / (H - horizon) + 1e-3
    zlines = np.abs(np.sin(np.pi * (1 / depth) * 0.9))
    grid += below * np.exp(-((1 - zlines) / 0.02) ** 2) * depth
    xl = (xx - W / 2) / np.maximum(depth, 0.02) / (W * 0.09)
    grid += below * np.exp(-((xl - np.round(xl)) / (0.05 / np.maximum(depth, 0.1))) ** 2) * depth
    grid = np.asarray(Image.fromarray(np.clip(grid * 255, 0, 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    canvas += grid[..., None] * VIOLET * 0.55
    # sparkles
    rng = np.random.default_rng(16)
    stars = np.zeros((H, W), np.float32)
    for _ in range(90):
        x, y = rng.integers(0, W), rng.integers(0, int(H * 0.78))
        stars[y, x] = rng.uniform(0.4, 1.0)
    stars = np.asarray(Image.fromarray((stars * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
                       .filter(ImageFilter.GaussianBlur(1.3))).astype(np.float32) / 255 * 2.2
    canvas += stars[..., None] * np.array([255, 200, 255], np.float32) * 0.5
    return canvas


def logo(size):
    img = Image.open(LOGO).convert("RGB").resize((size, size), Image.LANCZOS)
    a = np.asarray(img).astype(np.float32)
    a = np.clip((a - 14) * (255 / 241), 0, 255)  # black floor -> additive-blend friendly
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) / size - 0.5
    fade = np.clip((0.5 - np.hypot(xx, yy)) / 0.04, 0, 1)  # round off the square's corners
    return a * fade[..., None]


# ---------- layout ----------

def render(W, H, hora, info, name):
    tall = H / W > 1.5
    s = 1.0
    # vertical rhythm: (logo, kicker, name, en vivo, date box, footer)
    if tall:
        y = dict(logo=330, kicker=640, name=850, vivo=1065, box=1335, foot1=1610, foot2=1678)
        logo_px = 470
    else:
        y = dict(logo=215, kicker=410, name=578, vivo=762, box=990, foot1=1212, foot2=1272)
        logo_px = 300
    c = background(W, H, y["name"])
    cx = W / 2

    add_at(c, logo(logo_px) * 0.95, cx, y["logo"])

    neon(c, text_mask("LLEGA A MALY", BEBAS, int(58 * s), spacing=14), cx, y["kicker"], CYAN, glow=0.7)
    neon(c, text_mask("El Polaco", SCRIPT, 210), cx, y["name"], PINK, glow=1.1)
    neon(c, text_mask("EN VIVO", NEON, 104, spacing=8), cx, y["vivo"], CYAN, glow=0.9, core=0.6)

    # date: neon box with VIERNES | 16 | OCTUBRE
    bw, bh = 820, 230
    neon(c, rounded_box(bw, bh, 44, 7), cx, y["box"], PINK, glow=0.8)
    neon(c, text_mask("16", BEBAS, 230), cx, y["box"] + 6, np.array([255, 235, 120], np.float32), glow=0.8)
    neon(c, text_mask("VIERNES", BEBAS, 78, spacing=6), cx - 255, y["box"] + 4, CYAN, glow=0.6)
    neon(c, text_mask("OCTUBRE", BEBAS, 78, spacing=6), cx + 255, y["box"] + 4, CYAN, glow=0.6)

    line1 = "¡NO TE LO PIERDAS!" + (f"  ·  {hora}" if hora else "")
    neon(c, text_mask(line1, BEBAS, 60, spacing=6), cx, y["foot1"], PINK, glow=0.6)
    neon(c, text_mask(info, BEBAS, 44, spacing=5), cx, y["foot2"], np.array([235, 225, 255], np.float32),
         glow=0.35, core=0.9)

    # thin neon frame around everything
    m = 34
    neon(c, rounded_box(W - 2 * m, H - 2 * m, 38, 4), cx, H / 2, VIOLET, glow=0.6)

    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"flyer-polaco-{name}.png")
    Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).save(path, optimize=True)
    print("wrote", path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hora", default="", help='e.g. "22:00 HS"')
    ap.add_argument("--info", default="RESERVA TU MESA POR MENSAJE DIRECTO",
                    help="bottom line: reservations, address, price...")
    args = ap.parse_args()
    render(1080, 1350, args.hora, args.info, "feed")
    render(1080, 1920, args.hora, args.info, "story")


if __name__ == "__main__":
    main()
