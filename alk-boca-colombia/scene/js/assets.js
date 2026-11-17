// Asset loading (data textures are loaded raw: no premultiply, no colour conversion).
import * as THREE from 'three';

export async function loadDataTexture(url, { mip = true, repeat = false } = {}) {
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const tex = new THREE.Texture(bmp);
  tex.flipY = false;
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = mip;
  tex.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export async function loadColorTexture(url) {
  const tex = await loadDataTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export async function loadJSON(url) { return (await fetch(url)).json(); }

export function canvasTexture(w, h, draw, { srgb = true, mip = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.generateMipmaps = mip;
  tex.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  tex.anisotropy = 8;
  return tex;
}
