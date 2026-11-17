// Small math / timing helpers shared by every shot.
import * as THREE from 'three';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a, b, t) => a + (b - a) * t;
export const lerp = mix;
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const smootherstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const range = (a, b, x) => clamp((x - a) / (b - a));
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInCubic = (t) => Math.pow(clamp(t), 3);
export const easeInOutCubic = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
export const easeInExpo = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * clamp(t) - 10));
export const easeInOutExpo = (t) => { t = clamp(t); if (t === 0 || t === 1) return t; return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2; };
export const easeOutBack = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + (s + 1) * t * t * t + s * t * t; };
export const easeInOutSine = (t) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
export const easeOutQuint = (t) => 1 - Math.pow(1 - clamp(t), 5);

// deterministic RNG
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// 1D smooth noise (for camera shake etc.)
export function noise1(x) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return mix(hash1(i) * 2 - 1, hash1(i + 1) * 2 - 1, u);
}
export function fbm1(x, oct = 3) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise1(x * f + i * 17.3); f *= 2.03; a *= 0.5; }
  return v;
}

// Keyframed value: keys = [[t, value, ease?], ...]
export function keys(list, t) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) {
    const [t1, v1, e] = list[i];
    const [t0, v0] = list[i - 1];
    if (t <= t1) {
      const u = (e || easeInOutCubic)((t - t0) / (t1 - t0));
      if (typeof v0 === 'number') return mix(v0, v1, u);
      return v0.clone().lerp(v1, u);
    }
  }
  return list[list.length - 1][1];
}

export function lookAtCamera(cam, pos, target, up = new THREE.Vector3(0, 1, 0), roll = 0) {
  cam.position.copy(pos);
  cam.up.copy(up);
  cam.lookAt(target);
  if (roll) cam.rotateZ(roll);
  cam.updateMatrixWorld();
}

export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// shared GLSL snippets
export const GLSL_NOISE = /* glsl */`
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); vec3 u = f*f*(3.0-2.0*f);
  float a = mix(mix(hash13(i), hash13(i+vec3(1,0,0)), u.x), mix(hash13(i+vec3(0,1,0)), hash13(i+vec3(1,1,0)), u.x), u.y);
  float b = mix(mix(hash13(i+vec3(0,0,1)), hash13(i+vec3(1,0,1)), u.x), mix(hash13(i+vec3(0,1,1)), hash13(i+vec3(1,1,1)), u.x), u.y);
  return mix(a, b, u.z); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<5;i++){ v += a*vnoise(p); p = p*2.03 + 17.1; a *= 0.5; } return v; }
float fbm3(vec3 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*vnoise3(p); p = p*2.03 + 17.1; a *= 0.5; } return v; }
`;
