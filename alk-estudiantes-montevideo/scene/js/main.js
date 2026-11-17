// Entry point: builds every shot, exposes window.renderFrame(t) for the
// headless renderer (and a simple real-time preview with ?preview=1).
import * as THREE from 'three';
import { Post } from './post.js';
import { buildTimeline } from './timeline.js';

const params = new URLSearchParams(location.search);
const W = +params.get('w') || 1080, H = +params.get('h') || 1920;
const MB = Math.max(1, +params.get('mb') || 1);
const FPS = 30, SHUTTER = 0.5; // 180 degree shutter

document.documentElement.style.setProperty('--W', W + 'px');
document.documentElement.style.setProperty('--H', H + 'px');
document.documentElement.style.setProperty('--s', String(W / 1080));

const canvas = document.getElementById('gl');
canvas.width = W; canvas.height = H;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

// make sure every font face is decoded before the first frame
await Promise.all([
  '900 italic 100px "Barlow Condensed"', '800 italic 100px "Barlow Condensed"', '700 italic 100px "Barlow Condensed"',
  '900 100px "Barlow Condensed"', '800 100px "Barlow Condensed"', '700 100px "Barlow Condensed"', '600 100px "Barlow Condensed"',
  '600 italic 100px "Barlow Condensed"', '500 100px "Barlow Condensed"',
  '300 100px Barlow', '400 100px Barlow', '500 100px Barlow', '600 100px Barlow', '700 100px Barlow', '400 italic 100px Barlow', '300 italic 100px Barlow',
].map((f) => document.fonts.load(f, 'ÁÉÍÓÚÑ¡!.,:0123456789ABC')));
await document.fonts.ready;
const post = new Post(renderer, W, H);
const tl = await buildTimeline(renderer, W, H, document.getElementById('overlay'));



window.renderFrame = (t) => {
  post.beginFrame();
  for (let i = 0; i < MB; i++) {
    const ts = MB > 1 ? t + ((i + 0.5) / MB - 0.5) * SHUTTER / FPS : t;
    post.addSubframe(tl.layerAt(ts), ts, 1 / MB);
  }
  post.endFrame(t, tl.gradeAt(t));
  tl.overlay(t);
  renderer.getContext().finish();
  return true;
};
window.__duration = tl.duration;
window.__ready = true;

if (params.get('preview')) {
  const t0 = performance.now();
  const loop = () => { window.renderFrame(((performance.now() - t0) / 1000) % tl.duration); requestAnimationFrame(loop); };
  loop();
}
