#!/usr/bin/env python3
"""Show flyer for Maly Bar y Music in the "Gran Apertura" style: tropical leaves,
neon outline title, the artist's cut-out photo, big pink name, info row and a
neon WhatsApp button.

Usage:
    python3 render_flyer_foto.py --foto fotos/polaco.jpg
    python3 render_flyer_foto.py --foto polaco.png --hora "21 HS" --fecha "VIERNES 16 DE OCTUBRE"

Without --foto it renders a placeholder where the photo goes. Photos with a
background are cut out automatically with rembg (pip install "rembg[cpu]");
a PNG that already has transparency is used as is.

Writes output/flyer-show-{story,feed}.png (1080x1920 and 1080x1350).
Requires: Python 3, Pillow, numpy (+ rembg only for photos with background).
"""
import argparse
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "assets", "fonts")
LOGO = os.path.join(HERE, "..", "maly-outro", "assets", "maly-logo.png")
OUT = os.path.join(HERE, "output")

ANTON = os.path.join(FONTS, "Anton-Regular.ttf")
MONT = os.path.join(FONTS, "Montserrat.ttf")

PINK = (255, 60, 170)
HOT = (255, 120, 210)
CYAN = (60, 215, 255)
WHITE = (245, 240, 250)


def font(path, size, weight=None):
    f = ImageFont.truetype(path, size)
    if weight:
        f.set_variation_by_name(weight)
    return f


# ---------- tropical leaves (procedural monstera) ----------

def monstera(size, rng, base_col):
    """One monstera leaf, tip up, on a transparent square of `size` px."""
    S = 3  # supersample
    W = size * S
    cx, cy = W / 2, W * 0.5
    sc = W / 40
    outline = []
    for i in range(240):
        t = 2 * math.pi * i / 240
        up = max(0.0, math.cos(t))
        x = 14 * math.sin(t) * (1 - 0.35 * up ** 3)  # narrower, slightly pointed tip
        y = -17 * math.cos(t) if up > 0 else -15 * math.cos(t)
        outline.append((cx + x * sc, cy + y * sc))
    shape = Image.new("L", (W, W))
    ImageDraw.Draw(shape).polygon(outline, fill=255)
    cuts = Image.new("L", (W, W))
    dc = ImageDraw.Draw(cuts)
    dc.polygon([(cx, cy + 10 * sc), (cx - 3 * sc, cy + 16 * sc), (cx + 3 * sc, cy + 16 * sc)], fill=255)  # basal notch

    # colour: base tone, lit from the upper left, slightly darker towards the edges
    yy, xx = np.mgrid[0:W, 0:W].astype(np.float32)
    shade = 1.2 - 0.25 * np.clip((xx - cx) / (W * 0.4), -1, 1) - 0.2 * (yy / W)
    rgb = np.asarray(base_col, np.float32)[None, None] * shade[..., None]
    im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)

    rib_top, rib_bot = (cx, cy - 16.5 * sc), (cx, cy + 10 * sc)
    vein_col = tuple(int(min(255, c * 1.3 + 8)) for c in base_col)
    n = 7
    for side in (-1, 1):
        for k in range(n):
            f = (k + 0.3) / (n + 0.2)
            y0 = rib_bot[1] + (rib_top[1] - rib_bot[1]) * f
            ang = math.radians(30 + 25 * f - 20 * (1 - f))
            ln = 18 * sc
            d.line([(cx, y0), (cx + side * math.cos(ang) * ln, y0 - math.sin(ang) * ln)],
                   fill=vein_col, width=max(1, int(0.25 * sc)))
            if k < n - 1:
                # slit: a wedge from the edge inwards, between two veins
                g = (k + 0.8) / (n + 0.2)
                yg = rib_bot[1] + (rib_top[1] - rib_bot[1]) * g
                ang2 = math.radians(30 + 25 * g - 20 * (1 - g))
                start = 15 * sc * rng.uniform(0.35, 0.55)
                p0 = (cx + side * math.cos(ang2) * start, yg - math.sin(ang2) * start)
                far = 20 * sc
                p1 = (cx + side * math.cos(ang2) * far, yg - math.sin(ang2) * far)
                w = sc * rng.uniform(1.0, 1.7)
                nx, ny = -math.sin(ang2) * side, -math.cos(ang2)
                dc.polygon([p0, (p1[0] + nx * w, p1[1] + ny * w), (p1[0] - nx * w, p1[1] - ny * w)], fill=255)
                if rng.random() < 0.6:
                    hx = cx + side * math.cos(ang2) * 15 * sc * 0.2
                    hy = yg - math.sin(ang2) * 15 * sc * 0.2
                    r = sc * rng.uniform(0.4, 0.75)
                    dc.ellipse((hx - r * 1.6, hy - r, hx + r * 1.6, hy + r), fill=255)
    d.line([rib_bot, rib_top], fill=vein_col, width=int(0.45 * sc))
    alpha = np.asarray(shape).astype(np.float32) * (1 - np.asarray(cuts).astype(np.float32) / 255)
    # petiole
    stem = Image.new("L", (W, W))
    ImageDraw.Draw(stem).line([(cx, cy + 10 * sc), (cx + 1.5 * sc, W)], fill=255, width=int(0.8 * sc))
    alpha = np.maximum(alpha, np.asarray(stem).astype(np.float32))
    out = im.convert("RGBA")
    out.putalpha(Image.fromarray(alpha.astype(np.uint8)))
    return out.resize((size, size), Image.LANCZOS)


def jungle(W, H, seed=10):
    rng = np.random.default_rng(seed)
    canvas = Image.new("RGB", (W, H), (6, 14, 9))
    # depth layers: far (small, blurred, dark) -> near (big, sharp, brighter)
    layers = [(26, 0.35, 6.0, 0.55), (20, 0.55, 3.0, 0.75), (12, 0.85, 0.0, 1.0)]
    for count, scale, blur, bright in layers:
        layer = Image.new("RGBA", (W, H))
        for _ in range(count):
            size = int(W * scale * rng.uniform(0.7, 1.15))
            g = rng.uniform(0.6, 1.25)
            base = np.array([rng.uniform(20, 34), rng.uniform(62, 92), rng.uniform(34, 50)]) * g * bright
            leaf = monstera(size, rng, base).rotate(rng.uniform(0, 360), Image.BICUBIC, expand=True)
            x = int(rng.uniform(-0.25, 1.0) * W)
            y = int(rng.uniform(-0.2, 1.0) * H)
            layer.paste(leaf, (x, y), leaf)
        if blur:
            layer = layer.filter(ImageFilter.GaussianBlur(blur))
        canvas.paste(layer, (0, 0), layer)
    arr = np.asarray(canvas).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vig = np.hypot((xx - W / 2) / (W * 0.75), (yy - H * 0.45) / (H * 0.7))
    arr *= np.clip(1.15 - 0.55 * vig ** 2, 0.35, 1.1)[..., None]
    return arr


# ---------- neon & text helpers ----------

def glow_paste(canvas, layer_rgba, radii=(4, 14, 34), strength=(0.9, 0.7, 0.5)):
    """Composite a sharp RGBA layer plus additive blurred copies of it (the glow)."""
    base = np.asarray(canvas).astype(np.float32)
    lay = np.asarray(layer_rgba).astype(np.float32)
    rgb = lay[..., :3] * (lay[..., 3:4] / 255)
    for r, s in zip(radii, strength):
        blurred = np.asarray(Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
                             .filter(ImageFilter.GaussianBlur(r))).astype(np.float32)
        base += blurred * s
    a = lay[..., 3:4] / 255
    base = base * (1 - a) + lay[..., :3] * a
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))


def neon_outline_text(W, H, lines, fnt, color, cx, y0, gap, stroke):
    """Hollow neon letters (outline tube with a pale core) like the GRAN APERTURA title."""
    mask = Image.new("L", (W, H))
    d = ImageDraw.Draw(mask)
    y = y0
    for line in lines:
        w = d.textlength(line, font=fnt)
        d.text((cx - w / 2, y), line, font=fnt, fill=255)
        y += gap
    outer = mask.filter(ImageFilter.MaxFilter(stroke | 1))
    inner = mask.filter(ImageFilter.MinFilter(stroke | 1))
    ring = np.asarray(outer).astype(np.float32) - np.asarray(inner).astype(np.float32)
    ring = np.clip(ring, 0, 255)
    core = np.asarray(Image.fromarray(ring.astype(np.uint8)).filter(ImageFilter.MinFilter(3)))
    layer = np.zeros((H, W, 4), np.float32)
    layer[..., :3] = color
    layer[..., :3] = layer[..., :3] * (1 - core[..., None] / 255 * 0.55) + 255 * core[..., None] / 255 * 0.55
    layer[..., 3] = ring
    return Image.fromarray(layer.astype(np.uint8), "RGBA")


def text_layer(W, H, items):
    """items: (text, font, fill, (x, y), anchor[, stroke_width, stroke_fill])"""
    im = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(im)
    for it in items:
        text, fnt, fill, pos, anchor = it[:5]
        kw = {}
        if len(it) > 5:
            kw = dict(stroke_width=it[5], stroke_fill=it[6])
        d.text(pos, text, font=fnt, fill=fill, anchor=anchor, **kw)
    return im


def spaced(text, n=1):
    return (" " * n).join(text) if n else text


# ---------- icons ----------

def icon_clock(d, cx, cy, r, col, w):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=col, width=w)
    d.line([(cx, cy), (cx, cy - r * 0.6)], fill=col, width=w)
    d.line([(cx, cy), (cx + r * 0.45, cy + r * 0.2)], fill=col, width=w)


def icon_glasses(d, cx, cy, r, col, w):
    for dx, tilt in ((-0.45, -1), (0.45, 1)):
        x = cx + dx * r
        top = cy - r * 0.9
        d.polygon([(x - r * 0.38 + tilt * 4, top), (x + r * 0.38 + tilt * 4, top), (x, cy + r * 0.05)],
                  outline=col, width=w)
        d.line([(x, cy + r * 0.05), (x, cy + r * 0.75)], fill=col, width=w)
        d.line([(x - r * 0.25, cy + r * 0.8), (x + r * 0.25, cy + r * 0.8)], fill=col, width=w)


def icon_pin(d, cx, cy, r, col, w):
    d.ellipse((cx - r * 0.6, cy - r, cx + r * 0.6, cy + r * 0.2), outline=col, width=w)
    d.line([(cx - r * 0.5, cy - r * 0.15), (cx, cy + r)], fill=col, width=w)
    d.line([(cx + r * 0.5, cy - r * 0.15), (cx, cy + r)], fill=col, width=w)
    d.ellipse((cx - r * 0.18, cy - r * 0.58, cx + r * 0.18, cy - r * 0.22), fill=col)


def icon_whatsapp(d, cx, cy, r):
    green = (37, 211, 102)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=green)
    d.polygon([(cx - r * 0.75, cy + r * 0.45), (cx - r * 0.95, cy + r * 1.0), (cx - r * 0.35, cy + r * 0.8)],
              fill=green)
    w = max(2, int(r * 0.12))
    rr = r * 0.62
    d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=(255, 255, 255), width=w)
    # handset
    d.arc((cx - rr * 0.6, cy - rr * 0.6, cx + rr * 0.6, cy + rr * 0.6), 100, 260, fill=(255, 255, 255),
          width=int(w * 1.6))


# ---------- the person ----------

def load_person(path):
    im = Image.open(path)
    if im.mode == "RGBA" and np.asarray(im)[..., 3].min() < 250:
        return im
    from rembg import new_session, remove  # only needed for photos with a background
    out = remove(im.convert("RGB"), session=new_session("u2net_human_seg"))
    return out


def placeholder_person(w, h):
    im = Image.new("RGBA", (w, h))
    d = ImageDraw.Draw(im)
    head_r = w * 0.16
    d.ellipse((w / 2 - head_r, h * 0.05, w / 2 + head_r, h * 0.05 + head_r * 2.5), fill=(70, 70, 80, 235))
    d.rounded_rectangle((w * 0.08, h * 0.42, w * 0.92, h * 1.2), radius=int(w * 0.25), fill=(70, 70, 80, 235))
    f = font(MONT, int(w * 0.055), "Bold")
    d.text((w / 2, h * 0.68), "FOTO DE\nEL POLACO", font=f, fill=(200, 200, 210, 255), anchor="mm",
           align="center", spacing=10)
    return im


def place_person(canvas, person, box_w, top, bottom):
    """Scale the cut-out to the box (by height, capped by width) and anchor it at the bottom."""
    bbox = person.getbbox()
    person = person.crop(bbox)
    h_target = bottom - top
    s = min(h_target / person.height, box_w / person.width)
    person = person.resize((int(person.width * s), int(person.height * s)), Image.LANCZOS)
    x = (canvas.width - person.width) // 2
    y = bottom - person.height
    # soft shadow behind for separation from the leaves
    shadow = Image.new("RGBA", canvas.size)
    sh = Image.new("RGBA", person.size, (0, 0, 0, 0))
    sh.putalpha(person.getchannel("A").point(lambda v: int(v * 0.7)))
    shadow.paste(sh, (x, y), sh)
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(person, (x, y))
    return canvas.convert("RGB")


# ---------- layout ----------

def render(W, H, args, name):
    tall = H / W > 1.5
    k = 1.0 if tall else 0.78  # vertical scale for the feed format
    L = {
        "logo": (190, 175, 330) if tall else (150, 140, 250),
        "title": (650, 70, 205, 175) if tall else (640, 40, 160, 140),  # cx, y0, size, gap
        "date": 520 if tall else 385,
        "photo": (560, 1700) if tall else (410, 1165),
        "name": 1555 if tall else 1050,
        "info": 1665 if tall else 1145,
        "addr": 1735 if tall else 1200,
        "btn": 1835 if tall else 1280,
    }

    bg = jungle(W, H)
    yy = np.mgrid[0:H, 0:W][0].astype(np.float32) / H
    # darken top (title) and bottom (info) so text reads over the leaves
    top_fade = np.clip(1 - yy / (0.30 if tall else 0.33), 0, 1) ** 1.5 * 0.55
    bot_fade = np.clip((yy - (0.74 if tall else 0.70)) / 0.26, 0, 1) ** 1.2 * 0.85
    bg *= (1 - top_fade - bot_fade)[..., None].clip(0.08, 1)
    canvas = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8))

    # photo
    top, bottom = L["photo"]
    person = load_person(args.foto) if args.foto else placeholder_person(800, 1100)
    canvas = place_person(canvas, person, W * 0.95, top, bottom)

    # bottom gradient over the photo too, so name/info stay readable
    arr = np.asarray(canvas).astype(np.float32)
    g = np.clip((yy - (L["name"] - 60 * k) / H) / ((H - L["name"]) / H), 0, 1)
    arr *= (1 - 0.88 * g ** 0.9)[..., None]
    canvas = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

    # logo top-left (black floor blended away with "lighten")
    lx, ly, ls = L["logo"]
    logo = Image.open(LOGO).convert("RGB").resize((ls, ls), Image.LANCZOS)
    m = Image.new("L", (ls, ls))
    ImageDraw.Draw(m).ellipse((4, 4, ls - 4, ls - 4), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(6))
    region = canvas.crop((lx - ls // 2, ly - ls // 2, lx + ls // 2 + ls % 2, ly + ls // 2 + ls % 2))
    blended = Image.fromarray(np.maximum(np.asarray(region), np.asarray(logo)))
    canvas.paste(blended, (lx - ls // 2, ly - ls // 2), m)

    # neon outline title
    tcx, ty, tsize, tgap = L["title"]
    title = neon_outline_text(W, H, args.titulo.split("|"), font(ANTON, tsize), PINK, tcx, ty, tgap,
                              max(5, tsize // 26))
    canvas = glow_paste(canvas, title, radii=(5, 16, 40), strength=(1.0, 0.8, 0.55))

    # date line (cyan)
    fdate = font(MONT, 46 if tall else 40, "ExtraBold")
    date = text_layer(W, H, [(f"{args.fecha}  |  {args.lugar}", fdate, CYAN + (255,), (W / 2, L["date"]), "mm")])
    canvas = glow_paste(canvas, date, radii=(3, 10), strength=(0.6, 0.35))

    # artist name: big condensed pink with a darker edge and glow
    fname = font(ANTON, 190 if tall else 165)
    nm = args.artista
    while fname.getlength(nm) > W * 0.94:
        fname = font(ANTON, fname.size - 4)
    name_layer = text_layer(W, H, [(nm, fname, HOT + (255,), (W / 2, L["name"]), "mm", 6, (150, 10, 95, 255))])
    # vertical pink gradient inside the letters
    na = np.asarray(name_layer).astype(np.float32)
    ys = np.mgrid[0:H, 0:W][0].astype(np.float32)
    t = np.clip((ys - (L["name"] - fname.size * 0.5)) / fname.size, 0, 1)
    grad = np.array([255, 150, 225], np.float32) * (1 - t[..., None]) + np.array([235, 40, 160], np.float32) * t[..., None]
    inside = (np.abs(na[..., :3] - np.array(HOT)).sum(-1) < 40)[..., None]
    na[..., :3] = np.where(inside, grad, na[..., :3])
    canvas = glow_paste(canvas, Image.fromarray(na.astype(np.uint8), "RGBA"), radii=(6, 22), strength=(0.45, 0.35))

    # info row: clock + opening | glasses + what there is
    lay = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(lay)
    finfo = font(MONT, 31 if tall else 28, "Bold")
    y = L["info"]
    left = f"APERTURA • {args.hora}"
    right = args.extra
    lw, rw = d.textlength(left, font=finfo), d.textlength(right, font=finfo)
    icon = 46
    total = icon + 14 + lw + 60 + icon + 14 + rw
    x = (W - total) / 2
    icon_clock(d, x + icon / 2, y, icon / 2, PINK + (255,), 4)
    x += icon + 14
    d.text((x, y), left, font=finfo, fill=WHITE + (255,), anchor="lm")
    x += lw + 30
    d.line([(x, y - 26), (x, y + 26)], fill=(255, 255, 255, 120), width=2)
    x += 30
    icon_glasses(d, x + icon / 2, y, icon / 2, PINK + (255,), 4)
    x += icon + 14
    d.text((x, y), right, font=finfo, fill=WHITE + (255,), anchor="lm")
    # address
    faddr = font(MONT, 30 if tall else 27, "SemiBold")
    addr = spaced(args.direccion, 0)
    aw = d.textlength(addr, font=faddr)
    ax = (W - aw - 40) / 2
    icon_pin(d, ax + 14, L["addr"], 18, PINK + (255,), 4)
    d.text((ax + 40, L["addr"]), addr, font=faddr, fill=(225, 220, 235, 255), anchor="lm")
    canvas = glow_paste(canvas, lay, radii=(3,), strength=(0.25,))

    # neon WhatsApp pill: gradient border pink -> cyan
    bw, bh = int(W * 0.9), 112 if tall else 100
    bx0, by0 = (W - bw) // 2, L["btn"] - bh // 2
    ring = Image.new("L", (W, H))
    ImageDraw.Draw(ring).rounded_rectangle((bx0, by0, bx0 + bw, by0 + bh), bh // 2, outline=255, width=6)
    fill = Image.new("L", (W, H))
    ImageDraw.Draw(fill).rounded_rectangle((bx0, by0, bx0 + bw, by0 + bh), bh // 2, fill=255)
    xs = np.mgrid[0:H, 0:W][1].astype(np.float32)
    tt = np.clip((xs - bx0) / bw, 0, 1)[..., None]
    col = np.array(PINK, np.float32) * (1 - tt) + np.array(CYAN, np.float32) * tt
    arr = np.asarray(canvas).astype(np.float32)
    fa = np.asarray(fill).astype(np.float32)[..., None] / 255
    arr = arr * (1 - fa * 0.55) + np.array([40, 10, 50], np.float32) * fa * 0.55  # dark glassy inside
    canvas = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    btn = np.zeros((H, W, 4), np.float32)
    btn[..., :3] = col
    btn[..., 3] = np.asarray(ring)
    canvas = glow_paste(canvas, Image.fromarray(btn.astype(np.uint8), "RGBA"), radii=(4, 14, 30),
                        strength=(1.0, 0.8, 0.5))
    lay = Image.new("RGBA", (W, H))
    d = ImageDraw.Draw(lay)
    fbtn = font(MONT, 40 if tall else 36, "ExtraBold")
    label = args.boton
    lw = d.textlength(label, font=fbtn)
    ic = 34 if tall else 30
    x = (W - (lw + ic * 2 + 24)) / 2
    icon_whatsapp(d, x + ic, L["btn"], ic)
    d.text((x + ic * 2 + 24, L["btn"]), label, font=fbtn, fill=(255, 255, 255, 255), anchor="lm")
    canvas = glow_paste(canvas, lay, radii=(4,), strength=(0.3,))

    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"flyer-show-{name}.png")
    canvas.save(path, optimize=True)
    print("wrote", path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--foto", help="photo of the artist (jpg/png); omitted = placeholder")
    ap.add_argument("--artista", default="EL POLACO")
    ap.add_argument("--titulo", default="SHOW|EN VIVO", help='neon title, lines split by "|"')
    ap.add_argument("--fecha", default="VIERNES 16 DE OCTUBRE")
    ap.add_argument("--lugar", default="CANNING")
    ap.add_argument("--hora", default="20 HS")
    ap.add_argument("--extra", default="CENA • SHOW EN VIVO • BAILE")
    ap.add_argument("--direccion", default="JORGE NEWBERY 660 • CANNING")
    ap.add_argument("--boton", default="RESERVÁ TU MESA POR WHATSAPP")
    args = ap.parse_args()
    render(1080, 1920, args, "story")
    render(1080, 1350, args, "feed")


if __name__ == "__main__":
    main()
