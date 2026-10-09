#!/usr/bin/env python3
"""Render the Maly Bar y Music neon outro (end card) for videos.

Usage:
    python3 render_outro.py                       # all formats
    python3 render_outro.py --formats vertical    # only 9:16
    python3 render_outro.py --tagline "@malybar"  # custom text under the logo

Requires: Python 3, Pillow, numpy, ffmpeg on PATH.
"""
import argparse
import os
import subprocess
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "assets", "maly-logo.png")
OUT = os.path.join(HERE, "output")
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"

FPS = 30
DURATION = 6.5
SR = 48000

FORMATS = {
    # name: (width, height, logo size, logo center y, tagline y)
    "vertical": (1080, 1920, 980, 860, 1480),
    "square": (1080, 1080, 820, 470, 960),
    "horizontal": (1920, 1080, 820, 470, 960),
}

CYAN = np.array([90, 230, 255], np.float32)
PINK = np.array([255, 60, 170], np.float32)


# ---------- timing helpers ----------

def ease_out(x):
    x = np.clip(x, 0, 1)
    return 1 - (1 - x) ** 3


def flicker(t, start, pattern, ramp=0.35):
    """Neon tube turning on: a list of (duration, level) steps, then a ramp to 1."""
    if t < start:
        return 0.0
    t -= start
    for dur, level in pattern:
        if t < dur:
            return level
        t -= dur
    return min(1.0, 0.6 + 0.4 * ease_out(t / ramp))


def flicker_events(start, pattern):
    """Times at which a flicker step turns on (for the sound design)."""
    out, t = [], start
    for dur, level in pattern:
        if level > 0.2:
            out.append((t, level))
        t += dur
    out.append((t, 1.0))
    return out


PAT_A = [(0.05, 1.0), (0.10, 0.0), (0.04, 0.8), (0.14, 0.0), (0.08, 0.5), (0.06, 0.1), (0.05, 0.9), (0.05, 0.3)]
PAT_B = [(0.06, 1.0), (0.12, 0.0), (0.03, 0.9), (0.09, 0.0), (0.10, 0.6), (0.05, 0.0), (0.04, 1.0), (0.07, 0.2)]
PAT_T = [(0.05, 1.0), (0.08, 0.0), (0.05, 0.7), (0.10, 0.0)]
START_A, START_B, START_T = 0.4, 1.05, 2.7
OFF_T = 5.6  # outro flicker-off / fade


def outro_level(t):
    if t < OFF_T:
        return 1.0
    x = t - OFF_T
    steps = [(0.07, 0.25), (0.06, 1.0), (0.05, 0.1), (0.08, 0.85)]
    for dur, lvl in steps:
        if x < dur:
            return lvl
        x -= dur
    return max(0.0, 0.85 * (1 - x / 0.55))


# ---------- logo preparation ----------

def load_layers(size):
    img = Image.open(LOGO).convert("RGB").resize((size, size), Image.LANCZOS)
    a = np.asarray(img).astype(np.float32)
    a = np.clip((a - 6) * (255 / 249), 0, 255)  # crush the near-black floor for clean additive blending
    pad = size // 5  # room for the glow so it never gets cut at the image edge
    a = np.pad(a, ((pad, pad), (pad, pad), (0, 0)))

    # Split into "cool" (cyan/purple: palms, leaves, subtitle) and "pink" (flamingo, ring, name)
    hsv = np.asarray(Image.fromarray(a.astype(np.uint8)).convert("HSV")).astype(np.float32)
    hue = hsv[..., 0] * 360 / 255
    sat = hsv[..., 1] / 255
    pinkness = np.clip(1 - np.abs(((hue - 330 + 180) % 360) - 180) / 40, 0, 1)
    w_pink = pinkness * sat + 0.5 * (1 - sat)
    w_pink = np.asarray(Image.fromarray((w_pink * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255

    def glow(arr, r):
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        return np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype(np.float32)

    r1, r2 = size * 0.012, size * 0.05
    layers = {}
    for name, w in (("cool", 1 - w_pink), ("pink", w_pink)):
        base = a * w[..., None]
        layers[name] = (base, glow(base, r1), glow(base, r2))
    lum = a.max(axis=2) / 255
    return layers, lum, a.shape[0]


def text_layers(text, height):
    font = ImageFont.truetype(FONT, height)
    spaced = " ".join(text)  # wide letter-spacing
    bbox = font.getbbox(spaced)
    pad = int(height * 1.2)
    w, h = bbox[2] - bbox[0] + pad * 2, bbox[3] - bbox[1] + pad * 2
    im = Image.new("L", (w, h))
    ImageDraw.Draw(im).text((pad - bbox[0], pad - bbox[1]), spaced, font=font, fill=255)
    core = np.asarray(im).astype(np.float32) / 255
    g1 = np.asarray(im.filter(ImageFilter.GaussianBlur(height * 0.12))).astype(np.float32) / 255
    g2 = np.asarray(im.filter(ImageFilter.GaussianBlur(height * 0.45))).astype(np.float32) / 255
    return core, g1, g2


# ---------- particles ----------

def make_particles(n, W, H, seed=7):
    rng = np.random.default_rng(seed)
    return dict(
        x=rng.uniform(0, W, n), y=rng.uniform(0, H, n),
        vy=rng.uniform(25, 90, n), sway=rng.uniform(5, 25, n),
        ph=rng.uniform(0, 2 * np.pi, n), r=rng.uniform(1.5, 4.0, n),
        col=rng.integers(0, 2, n), tw=rng.uniform(1.5, 4.0, n),
    )


def draw_particles(p, t, W, H, amount):
    layer = Image.new("RGB", (W, H))
    if amount <= 0:
        return np.zeros((H, W, 3), np.float32)
    d = ImageDraw.Draw(layer)
    for i in range(len(p["x"])):
        y = (p["y"][i] - p["vy"][i] * t) % H
        x = p["x"][i] + p["sway"][i] * np.sin(t * 1.3 + p["ph"][i])
        a = amount * (0.5 + 0.5 * np.sin(t * p["tw"][i] + p["ph"][i])) ** 2
        c = (CYAN if p["col"][i] else PINK) * a
        r = p["r"][i]
        d.ellipse([x - r, y - r, x + r, y + r], fill=tuple(int(v) for v in c))
    core = np.asarray(layer).astype(np.float32)
    glow = np.asarray(layer.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
    return core + glow * 2.5


# ---------- frame compositing ----------

def add_at(canvas, arr, cx, cy):
    h, w = arr.shape[:2]
    H, W = canvas.shape[:2]
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    sx0, sy0 = max(0, -x0), max(0, -y0)
    dx0, dy0 = max(0, x0), max(0, y0)
    dx1, dy1 = min(W, x0 + w), min(H, y0 + h)
    if dx1 <= dx0 or dy1 <= dy0:
        return
    region = arr[sy0:sy0 + (dy1 - dy0), sx0:sx0 + (dx1 - dx0)]
    if region.ndim == 2:
        region = region[..., None]
    canvas[dy0:dy1, dx0:dx1] += region


def render(fmt, tagline, with_audio=True):
    W, H, size, cy, ty = FORMATS[fmt]
    cx = W / 2
    layers, lum, full = load_layers(size)
    tcore, tg1, tg2 = text_layers(tagline, int(size * 0.058)) if tagline else (None, None, None)
    parts = make_particles(70 if fmt == "vertical" else 55, W, H)

    # background: deep purple radial haze
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rad = np.sqrt(((xx - cx) / (W * 0.75)) ** 2 + ((yy - cy) / (H * 0.6)) ** 2)
    haze = np.clip(1 - rad, 0, 1)[..., None] ** 2 * np.array([38, 6, 48], np.float32)

    # diagonal shine mask coordinates in logo space
    ly, lx = np.mgrid[0:full, 0:full].astype(np.float32) / full
    diag = lx * 0.8 + ly * 0.6

    os.makedirs(OUT, exist_ok=True)
    silent = os.path.join(OUT, f".tmp_{fmt}.mp4")
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", silent],
        stdin=subprocess.PIPE)

    n = int(DURATION * FPS)
    for f in range(n):
        t = f / FPS
        off = outro_level(t)
        la = flicker(t, START_A, PAT_A) * off
        lb = flicker(t, START_B, PAT_B) * off
        lt = flicker(t, START_T, PAT_T, ramp=0.3) * off if tagline else 0
        breathe = 1 + 0.12 * np.sin(max(0, t - 2.0) * 2.6)
        # one bright "pop" when the pink tubes reach full power
        pop = 0.9 * np.exp(-((t - (START_B + sum(d for d, _ in PAT_B) + 0.1)) / 0.18) ** 2)

        logo = np.zeros((full, full, 3), np.float32)
        for name, lvl in (("cool", la), ("pink", lb)):
            base, g1, g2 = layers[name]
            if lvl > 0:
                logo += base * lvl + g1 * lvl * (0.5 + 0.6 * pop) * breathe + g2 * lvl * (0.8 + 1.4 * pop) * breathe

        # light sweep across the tubes
        if 2.35 < t < 3.35:
            pos = (t - 2.35) / 1.0 * 2.0 - 0.3
            band = np.exp(-((diag - pos) / 0.035) ** 2)
            logo += (band * lum * 255 * 0.7 * off)[..., None]

        scale = 0.93 + 0.07 * ease_out((t - START_A) / 2.4)
        s = max(2, int(full * scale))
        logo_img = Image.fromarray(np.clip(logo, 0, 255).astype(np.uint8)).resize((s, s), Image.BILINEAR)
        # glow can exceed 255 before clipping; keep a soft overflow halo
        canvas = haze * (0.35 + 0.65 * max(la, lb)) * off
        canvas = canvas + np.zeros((H, W, 3), np.float32)
        add_at(canvas, np.asarray(logo_img).astype(np.float32), cx, cy)

        if tagline and lt > 0:
            col = CYAN
            txt = (tcore[..., None] * np.array([235, 252, 255], np.float32) * 0.9
                   + tg1[..., None] * col * 1.6 + tg2[..., None] * col * 1.4) * lt * breathe
            add_at(canvas, txt, cx, ty)

        canvas += draw_particles(parts, t, W, H, 0.9 * min(1, max(0, (t - 1.2) / 1.0)) * off)

        ff.stdin.write(np.clip(canvas, 0, 255).astype(np.uint8).tobytes())
    ff.stdin.close()
    ff.wait()

    final = os.path.join(OUT, f"maly-outro-{fmt}.mp4")
    if with_audio:
        wav = os.path.join(OUT, ".tmp_audio.wav")
        make_audio(wav, bool(tagline))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", wav,
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
                        "-movflags", "+faststart", final], check=True)
        os.remove(wav)
        os.remove(silent)
    else:
        os.replace(silent, final)
    print("wrote", final)


# ---------- sound: neon buzz + sparks ----------

def make_audio(path, has_tagline):
    rng = np.random.default_rng(3)
    n = int(DURATION * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)

    # level envelope for the hum follows the tubes
    env = np.array([max(flicker(x, START_A, PAT_A), flicker(x, START_B, PAT_B)) * outro_level(x)
                    for x in t[::160]])
    env = np.interp(np.arange(n), np.arange(0, n, 160), env)
    hum = sum(np.sin(2 * np.pi * 120 * k * t) / k ** 1.4 for k in range(1, 9))
    out += 0.07 * hum * env

    def spark(at, amp):
        i = int(at * SR)
        L = int(0.05 * SR)
        if i >= n:
            return
        L = min(L, n - i)
        noise = rng.standard_normal(L)
        noise = np.diff(np.concatenate([[0], noise]))  # brighter, crackly
        out[i:i + L] += amp * noise * np.exp(-np.arange(L) / (0.008 * SR))

    events = flicker_events(START_A, PAT_A) + flicker_events(START_B, PAT_B)
    if has_tagline:
        events += flicker_events(START_T, PAT_T)
    for at, lvl in events:
        spark(at, 0.25 * lvl)

    # soft shimmer for the light sweep
    i0, i1 = int(2.35 * SR), int(3.35 * SR)
    seg = np.arange(i1 - i0) / SR
    sweep = np.sin(2 * np.pi * (1800 * seg + 900 * seg ** 2)) * np.sin(np.pi * seg / 1.0) ** 2
    out[i0:i1] += 0.04 * sweep

    # click-off at the end
    for at in (OFF_T, OFF_T + 0.13):
        spark(at, 0.2)

    fade = np.clip((DURATION - t) / 0.4, 0, 1)
    out = np.tanh(out * 1.5) * 0.8 * fade
    pcm = (out * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--formats", nargs="+", default=list(FORMATS), choices=list(FORMATS))
    ap.add_argument("--tagline", default="¡TE ESPERAMOS!", help='text under the logo ("" to hide)')
    ap.add_argument("--no-audio", action="store_true")
    args = ap.parse_args()
    for fmt in args.formats:
        render(fmt, args.tagline, not args.no_audio)
