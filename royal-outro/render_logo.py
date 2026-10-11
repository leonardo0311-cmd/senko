#!/usr/bin/env python3
"""Animated reveal of the "R" crown logo, in the style of the Del Sol logo GIF:
the piece is built part by part (ring draws in, the letter rises inside it, the
crown pops on top), holds, then takes itself apart in reverse.

Usage:
    python3 render_logo.py                      # every output
    python3 render_logo.py --only gif           # just the transparent GIF
    python3 render_logo.py --only square,mov    # pick outputs

Outputs (in output/):
    royal-logo-sin-fondo.gif      transparent GIF, loops (like the reference GIF)
    royal-logo-alpha.webm         VP9 with alpha, 1080x1080 (small; web, CapCut, DaVinci)
    royal-logo-alpha.mov          PNG-in-MOV with alpha, 1080x1080 (Premiere/Final Cut; ~80 MB,
                                  not committed to git)
    royal-logo-{square,vertical,horizontal}.mp4  on the original black marble

Requires: Python 3, Pillow, numpy, ffmpeg on PATH.
"""
import argparse
import os
import subprocess

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "assets", "royal-logo.jpg")
OUT = os.path.join(HERE, "output")

FPS = 30
DURATION = 6.4

# geometry of the source logo (447x447 jpg), measured from the image
CX, CY = 223.0, 226.0       # ring center
R_IN, R_OUT = 126.0, 143.0  # ring stroke radii
CROWN_BASE_Y = 100.0        # where the crown sits on the ring

FORMATS = {
    # name: (width, height, logo size)
    "square": (1080, 1080, 1000),
    "vertical": (1080, 1920, 1000),
    "horizontal": (1920, 1080, 1000),
}


# ---------- easing ----------

def clamp01(x):
    return float(min(1.0, max(0.0, x)))


def prog(t, a, b):
    return clamp01((t - a) / (b - a))


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_in(x):
    return x ** 3


def ease_in_out(x):
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out_back(x, s=1.9):
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def smoothstep(e0, e1, x):
    x = np.clip((x - e0) / (e1 - e0), 0, 1)
    return x * x * (3 - 2 * x)


# ---------- split the logo into layers ----------

def inpaint(img, mask, iters=300):
    """Fill masked pixels by diffusion from their surroundings (no OpenCV needed)."""
    out = img.copy()
    known = ~mask
    out[mask] = img[known].mean(0)
    for i in range(iters):
        blurred = np.asarray(Image.fromarray(out.astype(np.uint8)).filter(
            ImageFilter.BoxBlur(3 if i < iters // 2 else 1))).astype(np.float32)
        out[mask] = blurred[mask]
    return out


def load_source():
    img = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
    H, W = img.shape[:2]
    lum = img.max(2)
    rough = Image.fromarray(((lum > 70) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
    bg = inpaint(img, np.asarray(rough) > 0)
    # a wider fill (the strokes have a dark JPEG halo) with marble grain added back,
    # used only as the video background so no ghost of the logo shows through
    wide = np.asarray(rough.filter(ImageFilter.MaxFilter(9))) > 0
    clean = inpaint(img, wide)
    grain = img - np.asarray(Image.fromarray(img.astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(4))).astype(np.float32)
    # borrow grain from logo-free spots: try a few offsets until every pixel is covered
    todo = wide.copy()
    for shift in ((0, 150), (0, -150), (150, 0), (-150, 0), (150, 150), (-150, -150),
                  (150, -150), (-150, 150), (0, 200), (200, 0)):
        src_ok = ~np.roll(wide, shift, axis=(0, 1))
        use = todo & src_ok
        clean[use] += np.roll(grain, shift, axis=(0, 1))[use]
        todo &= ~use

    diff = lum - bg.max(2)
    alpha = smoothstep(18, 70, diff)
    # glitter texture has dark specks: close small holes inside solid strokes
    closed = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8))
                        .filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))) / 255.0
    alpha = np.maximum(alpha, closed * (alpha > 0.15))
    premul = np.clip(img - (1 - alpha[..., None]) * bg, 0, 255)

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.hypot(xx - CX, yy - CY)
    crown = (r > R_OUT - 1) & (yy < CROWN_BASE_Y + 12)
    letter = (r < R_IN) & ~crown
    ring = ~crown & ~letter
    parts = {}
    for name, m in (("ring", ring), ("letter", letter), ("crown", crown)):
        a = alpha * m
        parts[name] = np.dstack([premul * m[..., None], a * 255])
    return parts, clean


def scaled_layers(size):
    """Premultiplied RGBA float layers at `size` px, plus helper coordinates."""
    parts, bg = load_source()
    k = size / 447.0
    out = {}
    for name, arr in parts.items():
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
        # resize channel-wise so PIL doesn't un-premultiply anything
        chans = [c.resize((size, size), Image.LANCZOS) for c in im.split()]
        big = np.dstack([np.asarray(c) for c in chans]).astype(np.float32)
        big[..., :3] = np.minimum(big[..., :3], big[..., 3:4])
        out[name] = big
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) / k
    geo = {
        "k": k,
        "r": np.hypot(xx - CX, yy - CY),
        # angle away from "straight down", 0..pi on both sides
        "phi": np.arccos(np.clip((yy - CY) / np.maximum(np.hypot(xx - CX, yy - CY), 1e-3), -1, 1)),
        "diag": (xx * 0.75 + yy * 0.65) / 447.0,
    }
    return out, geo, bg


# ---------- animation ----------

def over(dst, src):
    return src + dst * (1 - src[..., 3:4] / 255.0)


def transform(layer, scale=1.0, dx=0.0, dy=0.0, pivot=(0, 0)):
    """Scale about `pivot` then shift; layer is premultiplied RGBA float."""
    h, w = layer.shape[:2]
    if scale <= 1e-3:
        return np.zeros_like(layer)
    px, py = pivot
    # PIL affine maps output -> input
    a = 1 / scale
    coeffs = (a, 0, px - (px + dx) * a, 0, a, py - (py + dy) * a)
    chans = [Image.fromarray(layer[..., i]).transform((w, h), Image.AFFINE, coeffs, Image.BICUBIC)
             for i in range(4)]
    out = np.dstack([np.asarray(c) for c in chans])
    return np.clip(out, 0, 255)


def glow_dot(size, x, y, radius, color, amount):
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    g = np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * radius ** 2)) * amount
    return g[..., None] * np.asarray(color, np.float32)


GOLD = (255, 205, 110)

# timeline (seconds)
RING_IN = (0.15, 0.85)
LETTER_IN = (0.70, 1.35)
CROWN_IN = (1.25, 1.75)
SHINE = (1.90, 2.70)
CROWN_OUT = (4.70, 5.05)
LETTER_OUT = (4.90, 5.40)
RING_OUT = (5.25, 5.95)


def logo_frame(t, layers, geo):
    """Premultiplied RGBA frame of the logo at time t."""
    size = layers["ring"].shape[0]
    k = geo["k"]
    frame = np.zeros((size, size, 4), np.float32)
    add = np.zeros((size, size, 3), np.float32)

    # 1) ring draws itself from the bottom up both sides (like the horizon line)
    p_in = ease_in_out(prog(t, *RING_IN))
    p_out = ease_in_out(prog(t, *RING_OUT))
    reach = p_in * (1 - p_out)
    if reach > 0:
        if reach < 1:
            lim = reach * (np.pi + 0.08)
            m = np.clip((lim - geo["phi"]) / 0.05, 0, 1)[..., None]
            frame = over(frame, layers["ring"] * m)
            # bright tips at the drawing heads
            amt = 1.6 * np.sin(np.pi * reach) ** 0.6
            rr = (R_IN + R_OUT) / 2
            for s in (-1, 1):
                ang = min(lim, np.pi)
                x = (CX + s * rr * np.sin(ang)) * k
                y = (CY + rr * np.cos(ang)) * k
                add += glow_dot(size, x, y, 9 * k, GOLD, amt)
        else:
            frame = over(frame, layers["ring"])

    # 2) the letter rises from inside the ring (like the sun from the horizon)
    l_in = prog(t, *LETTER_IN)
    l_out = ease_in(prog(t, *LETTER_OUT))
    if l_in > 0 and l_out < 1:
        lift = ease_out_back(l_in, 1.3) if l_in < 1 else 1.0
        dy = (1 - lift) * 250 * k + l_out * 250 * k
        letter = transform(layers["letter"], dy=dy)
        clip = np.clip((R_IN + 2 - geo["r"]) * k / 1.5, 0, 1)[..., None]
        letter *= clip * min(1.0, l_in * 3)
        frame = over(frame, letter)

    # 3) the crown pops onto the ring (like the sun rays)
    c_in = prog(t, *CROWN_IN)
    c_out = ease_in(prog(t, *CROWN_OUT))
    if c_in > 0 and c_out < 1:
        sc = (ease_out_back(c_in) if c_in < 1 else 1.0) * (1 - c_out)
        crown = transform(layers["crown"], scale=sc, pivot=(CX * k, (CROWN_BASE_Y + 6) * k))
        frame = over(frame, crown)

    # 4) a diagonal glint across the finished logo
    s = prog(t, *SHINE)
    if 0 < s < 1:
        pos = -0.2 + 1.5 * ease_in_out(s)
        band = np.exp(-((geo["diag"] - pos) / 0.045) ** 2)
        add += (band * frame[..., 3] / 255.0)[..., None] * np.array([255, 240, 200], np.float32) * 0.75

    frame[..., :3] += add
    # glow outside the shape also needs alpha so it shows on transparent output
    frame[..., 3] = np.maximum(frame[..., 3], np.clip(add.max(2), 0, 255))
    frame[..., :3] = np.minimum(frame[..., :3], np.maximum(frame[..., 3:4], 0))
    return np.clip(frame, 0, 255)


# ---------- writers ----------

def frames(size):
    layers, geo, bg = scaled_layers(size)
    n = int(round(DURATION * FPS))
    for f in range(n):
        yield f / FPS, logo_frame(f / FPS, layers, geo)


def marble_background(bg, W, H):
    """Original marble (logo removed), cover-scaled and slightly vignetted."""
    im = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8))
    s = max(W, H) / 447.0 * 1.02
    im = im.resize((int(447 * s), int(447 * s)), Image.BICUBIC)
    x0, y0 = (im.width - W) // 2, (im.height - H) // 2
    arr = np.asarray(im.crop((x0, y0, x0 + W, y0 + H))).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = np.hypot((xx - W / 2) / (W * 0.7), (yy - H / 2) / (H * 0.7))
    return arr * np.clip(1.15 - 0.5 * v ** 2, 0.5, 1.1)[..., None]


def ffmpeg(args, W, H, pix_in="rgb24"):
    return subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", pix_in,
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"] + args, stdin=subprocess.PIPE)


def render_mp4(fmt):
    W, H, size = FORMATS[fmt]
    layers, geo, bg = scaled_layers(size)
    back = marble_background(bg, W, H)
    path = os.path.join(OUT, f"royal-logo-{fmt}.mp4")
    ff = ffmpeg(["-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
                 "-movflags", "+faststart", path], W, H)
    x0, y0 = (W - size) // 2, (H - size) // 2
    n = int(round(DURATION * FPS))
    for f in range(n):
        t = f / FPS
        fade = min(1.0, t / 0.3, max(0.0, (DURATION - t) / 0.35))
        canvas = back * fade
        logo = logo_frame(t, layers, geo)
        reg = canvas[y0:y0 + size, x0:x0 + size]
        canvas[y0:y0 + size, x0:x0 + size] = logo[..., :3] + reg * (1 - logo[..., 3:4] / 255.0)
        ff.stdin.write(np.clip(canvas, 0, 255).astype(np.uint8).tobytes())
    ff.stdin.close()
    ff.wait()
    print("wrote", path)


def render_mov(size=1080):
    path = os.path.join(OUT, "royal-logo-alpha.mov")
    # PNG-in-MOV keeps the alpha channel and is ~10x smaller than ProRes 4444
    ff = ffmpeg(["-c:v", "png", "-pix_fmt", "rgba", path], size, size, "rgba")
    for t, fr in frames(size):
        a = fr[..., 3:4] / 255.0
        rgb = np.where(a > 0, fr[..., :3] / np.maximum(a, 1e-3), 0)  # straight alpha
        ff.stdin.write(np.clip(np.dstack([rgb, fr[..., 3]]), 0, 255).astype(np.uint8).tobytes())
    ff.stdin.close()
    ff.wait()
    print("wrote", path)


def render_webm(size=1080):
    path = os.path.join(OUT, "royal-logo-alpha.webm")
    ff = ffmpeg(["-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24",
                 "-row-mt", "1", "-auto-alt-ref", "0", path], size, size, "rgba")
    for t, fr in frames(size):
        a = fr[..., 3:4] / 255.0
        rgb = np.where(a > 0, fr[..., :3] / np.maximum(a, 1e-3), 0)
        ff.stdin.write(np.clip(np.dstack([rgb, fr[..., 3]]), 0, 255).astype(np.uint8).tobytes())
    ff.stdin.close()
    ff.wait()
    print("wrote", path)


def render_gif(size=600):
    path = os.path.join(OUT, "royal-logo-sin-fondo.gif")
    imgs, durs = [], []
    step = 2  # 15 fps keeps the file small, same feel as the reference
    for i, (t, fr) in enumerate(frames(size)):
        if i % step:
            continue
        a = fr[..., 3:4] / 255.0
        rgb = np.where(a > 0, fr[..., :3] / np.maximum(a, 1e-3), 0)
        rgba = np.clip(np.dstack([rgb, fr[..., 3]]), 0, 255).astype(np.uint8)
        imgs.append(Image.fromarray(rgba, "RGBA"))
        # GIF delays are in 10 ms units: round the running clock, not each frame
        durs.append(10 * (round(100 * (i + step) / FPS) - round(100 * i / FPS)))
    pal = []
    for im in imgs:
        a = np.asarray(im)[..., 3]
        p = im.convert("RGB").quantize(255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        idx = np.asarray(p).copy()
        idx[a < 128] = 255
        q = Image.fromarray(idx.astype(np.uint8), "P")
        palette = p.getpalette()[:255 * 3] + [0, 0, 0]
        q.putpalette(palette)
        pal.append(q)
    # merge identical consecutive frames ourselves so the hold keeps its full length
    merged, mdurs = [], []
    for q, d in zip(pal, durs):
        if merged and q.tobytes() == merged[-1].tobytes():
            mdurs[-1] += d
        else:
            merged.append(q)
            mdurs.append(d)
    # the GIF loops, so fold the empty tail into the (also empty) first frame;
    # Pillow would otherwise drop it together with its delay
    if len(merged) > 1 and merged[-1].tobytes() == merged[0].tobytes():
        mdurs[0] += mdurs.pop()
        merged.pop()
    pal, durs = merged, mdurs
    pal[0].save(path, save_all=True, append_images=pal[1:], duration=durs, loop=0,
                transparency=255, disposal=2, optimize=False)
    print("wrote", path, f"({os.path.getsize(path) // 1024} KB)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="gif,webm,mov,square,vertical,horizontal")
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    for name in args.only.split(","):
        if name == "gif":
            render_gif()
        elif name == "mov":
            render_mov()
        elif name == "webm":
            render_webm()
        else:
            render_mp4(name)


if __name__ == "__main__":
    main()
