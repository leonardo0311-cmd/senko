#!/usr/bin/env python3
"""Vectorise the official ALK TRAVEL logo from assets/src/alk-logo-reference.webp.

Outputs
  assets/alk-logo.svg        white logo on transparent background (the artwork)
  tools/logo-paths.json      path data used by alk-travel.html (logo + the plane in the A)

The reference is a white logo on brand blue with soft clouds behind the K, so the
white is separated with a stricter threshold where clouds touch the letters.
The plane is the blue negative space inside the A: it is rebuilt as its own shape
(clipped to the A's outline, cut behind the wings) so it can take off in the opening.
"""
import json, os
import numpy as np
import cv2
import potrace
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "assets", "src", "alk-logo-reference.webp")
X0, Y0, X1, Y1 = 410, 850, 1590, 1275          # logo box in the 2000 px reference
UP = 3                                          # supersampling for smooth curves

im = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
mn = im.min(axis=2)[Y0:Y1, X0:X1]
H, W = mn.shape

# threshold map: half-coverage against pure blue (min channel 69 → 255),
# stricter where the clouds sit behind the K
thr = np.full(mn.shape, 162.0, np.float32)
yy, xx = np.mgrid[0:H, 0:W]
gx, gy = xx + X0, yy + Y0
cloud = (gx >= 1280) & ((gy <= 880) | (gx >= 1440))
thr[cloud] = 228.0

def up(a):
    return cv2.resize(a, (W * UP, H * UP), interpolation=cv2.INTER_CUBIC)

white_hi = up(mn) >= up(thr)


def trace(mask, scale):
    bm = potrace.Bitmap(~mask)                    # potracer traces dark pixels
    path = bm.trace(turdsize=6, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0,
                    opticurve=True, opttolerance=0.25)
    f = lambda p: f"{p.x / scale:.2f} {p.y / scale:.2f}"
    d = []
    for curve in path:
        d.append("M" + f(curve.start_point))
        for seg in curve.segments:
            if seg.is_corner:
                d.append("L" + f(seg.c) + "L" + f(seg.end_point))
            else:
                d.append("C" + f(seg.c1) + " " + f(seg.c2) + " " + f(seg.end_point))
        d.append("Z")
    return "".join(d)

# ---------- the whole logo ----------
logo_d = trace(white_hi, UP)

# ---------- the plane in the A ----------
white = mn >= thr
n, lab, stats, cent = cv2.connectedComponentsWithStats(white.astype(np.uint8), 8)
# pieces of the A: everything white left of the L's stem, in the letter rows
a_mask = np.zeros_like(white)
for i in range(1, n):
    x, y, w, h, area = stats[i]
    if area > 2000 and y + Y0 < 1180 and x + X0 < 800:
        a_mask |= lab == i
# the component that also holds the L: keep only its part left of the L stem
L_STEM = 866 - X0
for i in range(1, n):
    x, y, w, h, area = stats[i]
    if area > 2000 and y + Y0 < 1180 and x + X0 < 800 and x + w + X0 > 900:
        part = (lab == i)
        part[:, L_STEM:] = False
        a_mask = (a_mask & ~(lab == i)) | part
pts = cv2.findNonZero(a_mask.astype(np.uint8))
hull = cv2.convexHull(pts)
hull_mask = np.zeros(white.shape, np.uint8)
cv2.fillConvexPoly(hull_mask, hull, 1)
blue_in_a = (hull_mask > 0) & ~white
TAIL_X = 742 - X0                                # cut the body behind the wings
blue_in_a[:, TAIL_X:] = False
n2, lab2, st2, _ = cv2.connectedComponentsWithStats(blue_in_a.astype(np.uint8), 8)
seed = (1045 - Y0, 615 - X0)                     # a point on the fuselage, between the wings
plane = lab2 == lab2[seed]
# the lower wing touches the gap between the A's legs: cut that 'foot' off along the wing's edge
def foot(h, w, k):
    yy2, xx2 = np.mgrid[0:h, 0:w]
    x_edge = (172.5 + 1.36 * (yy2 / k - 225)) * k
    return (yy2 > 276 * k) & (xx2 < x_edge)
plane &= ~foot(*plane.shape, 1)
# supersample the plane with the same soft edges as the logo
soft = up(mn)
plane_hi = cv2.resize(plane.astype(np.uint8), (W * UP, H * UP), interpolation=cv2.INTER_NEAREST) > 0
plane_hi = cv2.dilate(plane_hi.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & ~white_hi
hull_hi = cv2.resize(hull_mask, (W * UP, H * UP), interpolation=cv2.INTER_NEAREST) > 0
plane_hi &= hull_hi
plane_hi[:, TAIL_X * UP:] = False
plane_hi &= ~foot(*plane_hi.shape, UP)
plane_d = trace(plane_hi, UP)
ys, xs = np.nonzero(plane)
pc = [float(xs.mean()), float(ys.mean())]
# nose direction: from the centroid to the far-left extreme of the body
nose = [float(xs.min()), float(ys[xs == xs.min()].mean())]

wy, wx = np.nonzero(white)
tight = [int(wx.min()) - 2, int(wy.min()) - 2, int(wx.max()) + 3, int(wy.max()) + 3]
out = {
    "viewBox": [0, 0, W, H],
    "tight": tight,
    "logo": logo_d,
    "plane": plane_d,
    "planeCentroid": pc,
    "planeNose": nose,
    "planeBox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
}
json.dump(out, open(os.path.join(HERE, "tools", "logo-paths.json"), "w"))
tw, th = tight[2] - tight[0], tight[3] - tight[1]
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{tight[0]} {tight[1]} {tw} {th}" width="{tw}" height="{th}">'
       f'<path fill="#FFFFFF" fill-rule="evenodd" d="{logo_d}"/></svg>\n')
open(os.path.join(HERE, "assets", "alk-logo.svg"), "w").write(svg)
Image.fromarray((plane * 255).astype(np.uint8)).save("/tmp/claude-0/plane_mask.png")
print("logo box", W, H, "| path chars", len(logo_d), "| plane chars", len(plane_d), "| plane centroid", pc, "nose", nose, "box", out["planeBox"])

# ---------- write the data into alk-travel.html (between the markers) ----------
HTML = os.path.join(HERE, "alk-travel.html")
src = open(HTML, encoding="utf-8").read()
a, b = "/*@logo-data*/", "/*@end-logo-data*/"
if a in src and b in src:
    data = {k: out[k] for k in ("tight", "logo", "plane", "planeCentroid", "planeNose")}
    src = src[: src.index(a) + len(a)] + "const LOGO_DATA = " + json.dumps(data, separators=(",", ":")) + ";" + src[src.index(b):]
    open(HTML, "w", encoding="utf-8").write(src)
    print("logo data written into alk-travel.html")
