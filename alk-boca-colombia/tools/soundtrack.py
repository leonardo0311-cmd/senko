#!/usr/bin/env python3
"""Synthesise the reel's soundtrack (19 s, 48 kHz stereo): a stadium-style
bombo / redoblante groove, transition whooshes, jet engines, crowd roar and
impacts synced to the picture. Writes ../output/soundtrack.wav.

Everything is generated from scratch (no samples, no licensed music).
"""
import os
import wave

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 19.0
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
start, stop = 0.35, 18.4


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
    intensity = 0.55 if b < 8.5 else 1.0          # band gets bigger at the stadium
    if 13.45 < b < 13.95:
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


for tc, g in [(0.35, 0.35), (4.3, 0.45), (8.6, 0.5), (10.45, 0.55), (13.75, 0.5), (14.55, 0.65)]:
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


for tc, g in [(2.6, 0.7), (4.27, 1.0), (5.75, 0.7), (6.92, 0.8), (8.65, 1.0), (13.6, 1.1)]:
    w = whoosh(tc, g=g)
    add(w, 0.9, -0.6)
    add(np.roll(w, int(0.012 * SR)), 0.9, 0.6)

# rising riser into the price
riser = bp(noise, 800, 9000) * smooth(0, 1, 13.9, 14.55) ** 2 * (t < 14.55)
add(riser, 0.25)

# ---------------- jet engine (take-off + window pass) ----------------
jet_env = smooth(0, 1, 4.25, 4.45) * (1 - smooth(0, 1, 6.6, 7.0))
rumble = lp(noise, 160) * 2.2
roar = bp(noise, 300, 1800) * 0.8
whine_f = 2900 + 260 * smooth(1, -1, 4.6, 5.6)          # doppler as the camera swings past
whine = np.sin(2 * np.pi * np.cumsum(whine_f) / SR) * 0.06 + np.sin(2 * np.pi * np.cumsum(whine_f * 1.5) / SR) * 0.03
jet = (rumble + roar + whine) * jet_env
jet *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * t)
add(jet, 0.55, 0.25)
# cabin party glimpse during the window pass (muffled chant)
cabin = lp(bp(noise, 250, 1400), 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * (BPM / 60) * t) ** 2) * smooth(0, 1, 5.7, 5.9) * (1 - smooth(0, 1, 6.7, 6.95))
add(cabin, 0.35)

# ---------------- stadium crowd ----------------
crowd_env = smooth(0, 1, 8.55, 9.6) * (1 - smooth(0, 1, 13.45, 14.6) * 0.85)
crowd_env *= 1 + 0.6 * smooth(0, 1, 10.3, 10.6) * (1 - smooth(0, 1, 11.2, 12.2))   # roar when the bowl opens
lfo = 0.75 + 0.25 * np.sin(2 * np.pi * (BPM / 60) * t + 0.3)           # crowd jumping on the beat
crowd = (bp(noise, 180, 700) * 1.2 + bp(np.roll(noise, 12345), 700, 2600) * 0.8 + bp(np.roll(noise, 777), 2600, 6000) * 0.25) * lfo * crowd_env
add(crowd, 0.45, -0.15)
add(np.roll(crowd, int(0.019 * SR)), 0.45, 0.15)
# whistles
for tw in [9.9, 10.8, 11.6, 12.4, 13.1]:
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


for ti, g in [(0.36, 0.6), (7.47, 0.55), (10.47, 0.8), (10.67, 0.6), (13.78, 0.7), (14.58, 1.0), (15.52, 0.45)]:
    add(impact(ti, g), 0.6)

# sparkle on the logo shine
for ts in [16.05, 17.9]:
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
