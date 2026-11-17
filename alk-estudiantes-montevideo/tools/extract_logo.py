#!/usr/bin/env python3
"""Extract the white ALK TRAVEL mark from the original artwork as a clean
white-on-transparent PNG (no redesign: the alpha is the original pixels).

The source has the white logo over a flat blue sky (#4565D1) with clouds that
touch the "K". The matte is computed from luma against a locally estimated
background, so cloud pixels never leak into the logo.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "assets", "alk-logo-original.webp")
DST = os.path.join(HERE, "..", "assets", "alk-logo-white.png")

src = sys.argv[1] if len(sys.argv) > 1 else SRC
dst = sys.argv[2] if len(sys.argv) > 2 else DST

rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
Y = rgb @ np.array([0.299, 0.587, 0.114], np.float32)

# 1) pixels that are certainly logo (pure white) + a safety ring around them
core = Y > 236
ring = np.asarray(Image.fromarray((core * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0

# 2) estimate the background luma under the logo by normalised blur of the
#    non-logo pixels (fills the holes with nearby sky / cloud values)
def box_blur(arr, r):
    """Separable box blur (edge-clamped) via cumulative sums."""
    out = arr
    for axis in (0, 1):
        pad = [(0, 0), (0, 0)]
        pad[axis] = (r + 1, r)
        c = np.cumsum(np.pad(out, pad, mode="edge"), axis=axis)
        hi = np.take(c, np.arange(2 * r + 1, c.shape[axis]), axis=axis)
        lo = np.take(c, np.arange(0, c.shape[axis] - 2 * r - 1), axis=axis)
        out = (hi - lo) / (2 * r + 1)
    return out


def nblur(arr, w, r):
    """Normalised blur: average of arr over pixels where w=1 (fills holes)."""
    num, den = arr * w, w
    for _ in range(3):  # 3 box passes ~ gaussian
        num, den = box_blur(num, r), box_blur(den, r)
    return num / np.maximum(den, 1e-4)


w = (~ring).astype(np.float32)
bg = np.where(ring, nblur(Y, w, 8), Y)
bg = np.clip(bg, 60, 200)

alpha = np.clip((Y - bg) / (255.0 - bg), 0, 1)
alpha[~ring] = 0.0
# tiny cleanup of compression noise
alpha = np.where(alpha < 0.03, 0, alpha)
alpha = np.where(alpha > 0.97, 1, alpha)

ys, xs = np.nonzero(alpha > 0.02)
pad = 8
y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, alpha.shape[0])
x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, alpha.shape[1])
a8 = (alpha[y0:y1, x0:x1] * 255 + 0.5).astype(np.uint8)
out = np.zeros(a8.shape + (4,), np.uint8)
out[..., :3] = 255
out[..., 3] = a8
Image.fromarray(out, "RGBA").save(dst, optimize=True)
print("logo", dst, "size", out.shape[1], "x", out.shape[0], "crop", (x0, y0, x1, y1))
