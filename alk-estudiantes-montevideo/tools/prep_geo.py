#!/usr/bin/env python3
"""Bake the geographic textures used by the 3D map (run once).

Sources (public domain):
  * Natural Earth 1:10m admin-0 countries, Argentina point-of-view edition
    (Islas Malvinas shown as part of Argentina, as Argentine maps do).
  * NASA-derived elevation + night-lights textures shipped in the
    `three-globe` npm package (example/img).

Outputs in ../data:
  sa_sdf.png     RGBA, South America region, signed distance fields:
                 R land/coast, G international borders, B Argentina, A Uruguay
  world_sdf.png  L, whole-world land SDF (for the globe outside the region)
  sa_relief.png  L, elevation for hill-shading
  world_lights.png L, city lights (night)
  geo.json       bounds + encodings, used by the shaders
"""
import json
import os
import subprocess
import tarfile
import urllib.request

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
CACHE = os.path.join(HERE, ".cache")
DATA = os.path.join(ROOT, "data")
os.makedirs(CACHE, exist_ok=True)
os.makedirs(DATA, exist_ok=True)

NE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_arg.geojson"
NE = os.path.join(CACHE, "ne_10m_admin_0_countries_arg.geojson")

# South America region (lon west..east, lat south..north)
LON0, LON1, LAT0, LAT1 = -95.0, -25.0, -60.0, 15.0
REG_W = 4096
DEG_PX = (LON1 - LON0) / REG_W
REG_H = int(round((LAT1 - LAT0) / DEG_PX))
SS = 2  # supersampling for rasterisation
KM_PER_DEG = 111.32

LAND_RANGE = 64.0     # km, +-
BORDER_RANGE = 24.0   # km
COUNTRY_RANGE = 96.0  # km, +-


def fetch():
    if not os.path.exists(NE):
        print("downloading Natural Earth ...")
        urllib.request.urlretrieve(NE_URL, NE)
    img_dir = os.path.join(CACHE, "package", "example", "img")
    if not os.path.exists(img_dir):
        print("downloading three-globe textures ...")
        out = subprocess.check_output(["npm", "pack", "three-globe@2.45.0", "--silent"], cwd=CACHE).decode().strip().splitlines()[-1]
        with tarfile.open(os.path.join(CACHE, out)) as tf:
            tf.extractall(CACHE, filter="data")
    return img_dir


def rings_of(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    return geom["coordinates"]


def rasterize(features, W, H, lon0, lon1, lat0, lat1, outline=0):
    """Binary mask (or outlines if outline>0) of features, equirectangular."""
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)
    sx, sy = W / (lon1 - lon0), H / (lat1 - lat0)
    for f in features:
        for poly in rings_of(f["geometry"]):
            for k, ring in enumerate(poly):
                pts = [((x - lon0) * sx, (lat1 - y) * sy) for x, y in ring]
                if len(pts) < 3:
                    continue
                if outline:
                    d.line(pts + [pts[0]], fill=255, width=outline)
                else:
                    d.polygon(pts, fill=0 if k > 0 else 255)
    return np.asarray(im) > 127


def sdf(mask, px_km):
    """Signed distance in km (positive inside)."""
    inside = distance_transform_edt(mask)
    outside = distance_transform_edt(~mask)
    return (inside - outside) * px_km


def down(a, s):
    h, w = a.shape[0] // s * s, a.shape[1] // s * s
    return a[:h, :w].reshape(h // s, s, w // s, s).mean(axis=(1, 3))


def enc_signed(d, rng):
    return np.clip(np.round((0.5 + d / (2 * rng)) * 255), 0, 255).astype(np.uint8)


def main():
    img_dir = fetch()
    feats = [f for f in json.load(open(NE))["features"] if f["properties"]["ADM0_A3"] != "ATA" or True]

    # ---------- regional South America SDFs ----------
    W, H = REG_W * SS, REG_H * SS
    px_km = DEG_PX / SS * KM_PER_DEG
    print("region", REG_W, "x", REG_H, "deg/px", DEG_PX)
    land = rasterize(feats, W, H, LON0, LON1, LAT0, LAT1)
    land_sdf = sdf(land, px_km)
    outl = rasterize(feats, W, H, LON0, LON1, LAT0, LAT1, outline=2)
    border = outl & (np.abs(land_sdf) > 2.5 * px_km) & land
    border_d = distance_transform_edt(~border) * px_km
    arg = rasterize([f for f in feats if f["properties"]["ADM0_A3"] == "ARG"], W, H, LON0, LON1, LAT0, LAT1)
    col = rasterize([f for f in feats if f["properties"]["ADM0_A3"] == "URY"], W, H, LON0, LON1, LAT0, LAT1)
    arg_sdf, col_sdf = sdf(arg, px_km), sdf(col, px_km)

    rgba = np.dstack([
        enc_signed(down(land_sdf, SS), LAND_RANGE),
        np.clip(np.round(down(border_d, SS) / BORDER_RANGE * 255), 0, 255).astype(np.uint8),
        enc_signed(down(arg_sdf, SS), COUNTRY_RANGE),
        enc_signed(down(col_sdf, SS), COUNTRY_RANGE),
    ])
    Image.fromarray(rgba, "RGBA").save(os.path.join(DATA, "sa_sdf.png"), optimize=True)
    del land, land_sdf, outl, border, border_d, arg, col, arg_sdf, col_sdf

    # ---------- small land-distance grid around La Plata / Buenos Aires (CPU side) ----------
    reg_land = rgba[..., 0]
    bx0, bx1, by0, by1 = -58.75, -57.35, -35.35, -34.35
    c0, c1 = int((bx0 - LON0) / DEG_PX), int((bx1 - LON0) / DEG_PX) + 1
    r0, r1 = int((LAT1 - by1) / DEG_PX), int((LAT1 - by0) / DEG_PX) + 1
    Image.fromarray(np.ascontiguousarray(reg_land[r0:r1, c0:c1]), "L").save(os.path.join(DATA, "lp_land.png"))
    ba_box = {"lon0": LON0 + c0 * DEG_PX, "lat1": LAT1 - r0 * DEG_PX, "dpp": DEG_PX, "w": c1 - c0, "h": r1 - r0}

    # ---------- whole world land SDF (coarse) ----------
    GW, GH = 4096, 2048
    g = rasterize(feats, GW, GH, -180, 180, -90, 90)
    gs = sdf(g, 360 / GW * KM_PER_DEG)
    Image.fromarray(enc_signed(gs, LAND_RANGE * 4), "L").save(os.path.join(DATA, "world_sdf.png"), optimize=True)

    # ---------- relief + lights ----------
    topo = Image.open(os.path.join(img_dir, "earth-topology.png")).convert("L")
    tw, th = topo.size
    box = (int((LON0 + 180) / 360 * tw), int((90 - LAT1) / 180 * th), int((LON1 + 180) / 360 * tw), int((90 - LAT0) / 180 * th))
    topo.crop(box).save(os.path.join(DATA, "sa_relief.png"), optimize=True)
    relief_box = [(box[0] / tw) * 360 - 180, 90 - (box[3] / th) * 180, (box[2] / tw) * 360 - 180, 90 - (box[1] / th) * 180]

    night = np.asarray(Image.open(os.path.join(img_dir, "earth-night.jpg")).convert("RGB")).astype(np.float32)
    # the texture has a blue land tint; city lights are the warm part
    lights = np.clip((night[..., 0] - night[..., 2] * 0.62) * 2.2, 0, 255)
    Image.fromarray(lights.astype(np.uint8), "L").save(os.path.join(DATA, "world_lights.png"), optimize=True)

    meta = {
        "region": {"lon0": LON0, "lon1": LON1, "lat0": LAT0, "lat1": LAT1, "w": REG_W, "h": REG_H},
        "relief": {"lon0": relief_box[0], "lat0": relief_box[1], "lon1": relief_box[2], "lat1": relief_box[3]},
        "landRange": LAND_RANGE, "borderRange": BORDER_RANGE, "countryRange": COUNTRY_RANGE,
        "worldLandRange": LAND_RANGE * 4,
        "lpLand": ba_box,
        "places": {
            "buenosAires": {"lon": -58.3816, "lat": -34.6037},
            "laPlata": {"lon": -57.9545, "lat": -34.9214},
            "montevideo": {"lon": -56.1882, "lat": -34.9058},
        },
    }
    json.dump(meta, open(os.path.join(DATA, "geo.json"), "w"), indent=1)
    for f in sorted(os.listdir(DATA)):
        print(f, os.path.getsize(os.path.join(DATA, f)) // 1024, "KB")


if __name__ == "__main__":
    main()
