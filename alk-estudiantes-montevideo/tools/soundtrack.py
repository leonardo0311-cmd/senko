#!/usr/bin/env python3
"""Synthesise the reel's soundtrack (20 s, 48 kHz stereo): a stadium-style
bombo / redoblante groove, transition whooshes, coach engine, Buquebus horn and
water, crowd roar and impacts synced to the picture. Writes ../output/soundtrack.wav.

Everything is generated from scratch (no samples, no licensed music).
"""
import os
import wave

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 20.0
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "output", "soundtrack.wav")
rng = np.random.default_rng(20261116)
t = np.arange(N) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def env(t0, a, d, length=None):
    """attack / exponential decay envelope starting at t0"""
    e = np.zeros(N)
    i0 = int(t0 * SR)
    L = int((length or (a + d * 6)) * SR)
    k = np.arange(min(L, N - i0)) / SR
    e[i0:i0 + len(k)] = np.minimum(k / max(a, 1e-4), 1.0) * np.exp(-np.maximum(k - a, 0) / d)
    return e


def smooth(x0, x1, a, b):
    u = np.clip((t - a) / (b - a), 0, 1)
    return x0 + (x1 - x0) * u * u * (3 - 2 * u)


L = np.zeros(N)
R = np.zeros(N)


def add(sig, gain=1.0, pan=0.0):
    global L, R
    L += sig * gain * np.sqrt(0.5 * (1 - pan))
    R += sig * gain * np.sqrt(0.5 * (1 + pan))


noise = rng.standard_normal(N)

# ---------------- groove: bombo + redoblante + platillos (126 BPM) ----------------
BPM = 126.0
beat = 60.0 / BPM
start, stop = 0.3, 19.4


def bombo(t0, g=1.0):
    k = np.arange(int(0.6 * SR)) / SR
    f = 52 + 70 * np.exp(-k / 0.035)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k / 0.22)
    s += lp(rng.standard_normal(len(k)), 900) * np.exp(-k / 0.012) * 0.6
    out = np.zeros(N)
    i0 = int(t0 * SR)
    n = min(len(k), N - i0)
    out[i0:i0 + n] = s[:n] * g
    return out


def snare(t0, g=1.0):
    k = np.arange(int(0.3 * SR)) / SR
    s = bp(rng.standard_normal(len(k)), 1500, 7000) * np.exp(-k / 0.07) + np.sin(2 * np.pi * 190 * k) * np.exp(-k / 0.05) * 0.5
    out = np.zeros(N)
    i0 = int(t0 * SR)
    n = min(len(k), N - i0)
    out[i0:i0 + n] = s[:n] * g
    return out


groove = np.zeros(N)
snares = np.zeros(N)
b = start
i = 0
# bombo pattern of the "hinchada": 1 . . 1 | . . 1 . | 1 . . 1 | . 1 . 1  (eighths)
pattern = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1]
while b < stop:
    step = i % 16
    intensity = 1.0 if (b < 1.4 or 12.9 < b < 15.6) else 0.6   # the band is loudest in the stadiums
    if 15.55 < b < 15.95:
        intensity = 0.0                            # breath before the offer
    if pattern[step] and intensity:
        groove += bombo(b, 0.9 * intensity * (1.15 if step % 4 == 0 else 1.0))
    if step % 4 == 2 and intensity:
        snares += snare(b, 0.35 * intensity)
    if i % 2 == 1 and intensity:                   # ghost rolls on the off-beats
        snares += snare(b + beat / 4, 0.08 * intensity)
    b += beat / 2
    i += 1
add(groove, 0.55)
add(snares, 0.42, 0.15)


def crash(t0, g=1.0, d=1.6):
    c = hp(noise, 4000) * env(t0, 0.002, d) + bp(noise, 2500, 6000) * env(t0, 0.002, d * 0.5) * 0.6
    return c * g


for tc, g in [(0.3, 0.5), (4.05, 0.4), (7.95, 0.4), (12.85, 0.55), (15.75, 0.5), (18.2, 0.5)]:
    add(crash(tc, g), 0.5, -0.2)
    add(crash(tc + 0.01, g), 0.5, 0.2)

# ---------------- whooshes on every transition ----------------
def whoosh(tc, dur=0.55, g=1.0, lo=300, hi=6000):
    out = np.zeros(N)
    i0, i1 = int((tc - dur * 0.7) * SR), int((tc + dur * 0.3) * SR)
    seg = noise[i0:i1].copy()
    k = np.linspace(0, 1, len(seg))
    # sweep the band upward with a few filter slices
    acc = np.zeros(len(seg))
    for j in range(6):
        f0 = lo * (hi / lo) ** (j / 6)
        f1 = f0 * 1.7
        w = np.exp(-((k - (0.25 + j * 0.1)) / 0.18) ** 2)
        acc += bp(seg, f0, min(f1, SR / 2 - 100)) * w
    shape = np.sin(np.pi * np.clip(k, 0, 1)) ** 2
    out[i0:i1] = acc * shape * g
    return out


for tc, g in [(1.6, 0.7), (2.6, 0.6), (4.05, 0.9), (5.45, 0.7), (7.92, 0.9), (10.22, 0.8), (12.85, 1.0), (15.7, 1.1)]:
    w = whoosh(tc, g=g)
    add(w, 0.9, -0.6)
    add(np.roll(w, int(0.012 * SR)), 0.9, 0.6)

# rising riser into the price
riser = bp(noise, 800, 9000) * smooth(0, 1, 17.2, 17.75) ** 2 * (t < 17.75)
add(riser, 0.25)

# ---------------- coach: diesel idle at the bay, then road rumble at speed ----------------
idle_env = smooth(0, 1, 3.95, 4.2) * (1 - smooth(0, 1, 5.3, 5.5))
f_idle = 38 + 2 * np.sin(2 * np.pi * 0.5 * t)
diesel = (np.sin(2 * np.pi * np.cumsum(f_idle) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f_idle * 2) / SR)) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * f_idle * t / 2)))
add(lp(diesel, 300) * idle_env, 0.25)
road_env = smooth(0, 1, 5.4, 5.6) * (1 - smooth(0, 1, 7.8, 8.05))
road = lp(noise, 220) * 1.8 + bp(noise, 300, 1200) * 0.5
passby = np.exp(-((t - 6.9) / 0.6) ** 2)
add(road * road_env * (0.7 + 0.6 * passby), 0.35, 0.2)
# ---------------- Buquebus: water rush, waterjets, ship horn ----------------
ship_env = smooth(0, 1, 7.85, 8.15) * (1 - smooth(0, 1, 10.1, 10.4))
water = bp(noise, 300, 3500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.35 * t) ** 2) + lp(noise, 120) * 1.2
add(water * ship_env, 0.32, -0.15)
horn_t0 = 8.35
k = np.clip(t - horn_t0, 0, None)
horn_env = np.clip(k / 0.08, 0, 1) * np.exp(-np.maximum(k - 0.9, 0) / 0.25) * (t > horn_t0) * (t < horn_t0 + 2.0)
horn = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(110, 1.0), (220, 0.55), (330, 0.32), (440, 0.18), (165, 0.4)])
add(lp(horn, 1500) * horn_env, 0.2)
# ---------------- stadium crowd ----------------
crowd_env = np.maximum((1 - smooth(0, 1, 1.4, 2.4)) * 0.9, smooth(0, 1, 12.8, 13.6) * (1 - smooth(0, 1, 15.6, 16.6) * 0.85))
crowd_env *= 1 + 0.6 * smooth(0, 1, 14.2, 14.5) * (1 - smooth(0, 1, 14.9, 15.6))   # roar inside the Centenario
lfo = 0.75 + 0.25 * np.sin(2 * np.pi * (BPM / 60) * t + 0.3)           # crowd jumping on the beat
crowd = (bp(noise, 180, 700) * 1.2 + bp(np.roll(noise, 12345), 700, 2600) * 0.8 + bp(np.roll(noise, 777), 2600, 6000) * 0.25) * lfo * crowd_env
add(crowd, 0.45, -0.15)
add(np.roll(crowd, int(0.019 * SR)), 0.45, 0.15)
# whistles
for tw in [0.6, 13.4, 14.1, 14.8, 15.3]:
    k = np.arange(int(0.5 * SR)) / SR
    f = 2600 + 500 * np.sin(np.pi * k / 0.5)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * k / 0.5) ** 2
    out = np.zeros(N)
    i0 = int(tw * SR)
    out[i0:i0 + len(k)] = s[:max(0, min(len(k), N - i0))]
    add(out, 0.03, rng.uniform(-0.8, 0.8))

# ---------------- impacts on the headline slams ----------------
def impact(t0, g=1.0):
    k = np.arange(int(1.2 * SR)) / SR
    f = 42 + 90 * np.exp(-k / 0.05)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k / 0.35)
    s += bp(rng.standard_normal(len(k)), 200, 3000) * np.exp(-k / 0.03) * 0.5
    out = np.zeros(N)
    i0 = int(t0 * SR)
    n = min(len(k), N - i0)
    out[i0:i0 + n] = s[:n] * g
    return out


for ti, g in [(0.33, 0.6), (4.25, 0.6), (8.17, 0.6), (12.03, 0.7), (13.52, 0.6), (15.88, 0.8), (16.35, 0.55), (17.78, 0.75), (18.42, 0.5)]:
    add(impact(ti, g), 0.6)

# sparkle on the logo shine
for ts in [18.45, 19.05]:
    k = np.arange(int(0.9 * SR)) / SR
    s = sum(np.sin(2 * np.pi * f * k) * np.exp(-k / (0.25 + 0.1 * j)) for j, f in enumerate([2093, 2637, 3136, 4186]))
    out = np.zeros(N)
    i0 = int(ts * SR)
    n = min(len(k), N - i0)
    out[i0:i0 + n] = s[:n] * np.sin(np.pi * np.clip(k[:n] / 0.9, 0, 1)) ** 0.5
    add(out, 0.025, 0.3)

# ---------------- reverb, master ----------------
ir_len = int(1.8 * SR)
k = np.arange(ir_len) / SR
ir = rng.standard_normal(ir_len) * np.exp(-k / 0.45)
ir = lp(ir, 5000)
ir /= np.sqrt(np.sum(ir ** 2))
Lw = fftconvolve(L, ir)[:N]
Rw = fftconvolve(R, np.roll(ir, 113))[:N]
L = L + Lw * 0.22
R = R + Rw * 0.22
# fade in/out edges
fade = np.clip(t / 0.02, 0, 1) * np.clip((DUR - t) / 0.35, 0, 1)
L *= fade
R *= fade
mix = np.stack([L, R], axis=1)
mix = hp(mix.T, 28).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * 0.89
os.makedirs(os.path.dirname(OUT), exist_ok=True)
pcm = (mix * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", OUT, f"rms {20 * np.log10(np.sqrt(np.mean(mix ** 2))):.1f} dBFS")
