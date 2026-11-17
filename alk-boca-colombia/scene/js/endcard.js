// Background of the offer end card: deep navy, Boca-blue glow, a faint map of
// South America with the golden Buenos Aires -> Colombia route, light streaks
// and drifting bokeh confetti. Full-screen shader (screen space, 1080x1920 units).
import * as THREE from 'three';
import { GLSL_NOISE } from './util.js';

export function buildEndcard(W, H, { tSA, meta }) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const reg = meta.region;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, tSA: { value: tSA }, regB: { value: new THREE.Vector4(reg.lon0, reg.lon1, reg.lat0, reg.lat1) },
      landRange: { value: meta.landRange }, routeP: { value: 0 }, intro: { value: 0 }, priceGlow: { value: 0 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime, landRange, routeP, intro, priceGlow; uniform sampler2D tSA; uniform vec4 regB; varying vec2 vUv;
      // screen (1080x1920, y down) -> lon/lat for the background map
      vec2 toLL(vec2 s){ return vec2(mix(-96.0, -18.0, s.x / 1080.0), mix(16.0, -62.0, s.y / 1920.0)); }
      float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
      vec2 bez(vec2 a, vec2 b, vec2 c, float t){ return mix(mix(a, b, t), mix(b, c, t), t); }
      void main(){
        vec2 s = vec2(vUv.x * 1080.0, (1.0 - vUv.y) * 1920.0);
        vec3 col = vec3(0.0026, 0.0091, 0.0335);
        // radial Boca-blue glow behind the price
        float g = exp(-pow(length((s - vec2(540.0, 860.0)) / vec2(620.0, 520.0)), 2.0));
        col += vec3(0.0, 0.03, 0.19) * g * (0.9 + 0.5 * priceGlow);
        col += vec3(0.0, 0.01, 0.05) * (1.0 - vUv.y);
        // faint map
        vec2 ll = toLL(s);
        vec2 ruv = vec2((ll.x - regB.x) / (regB.y - regB.x), (regB.w - ll.y) / (regB.w - regB.z));
        float inR = step(0.0, ruv.x) * step(ruv.x, 1.0) * step(0.0, ruv.y) * step(ruv.y, 1.0);
        float d = (texture2D(tSA, ruv).r - 0.5) * 2.0 * landRange * inR - (1.0 - inR) * 100.0;
        float aa = fwidth(d) + 0.01;
        float land = smoothstep(-aa, aa, d);
        col += vec3(0.004, 0.018, 0.075) * land * intro;
        col += vec3(0.08, 0.2, 0.55) * exp(-pow(d / (aa * 1.3), 2.0)) * intro * 0.32;
        // golden route Buenos Aires -> Colombia (screen space bezier)
        vec2 A = vec2((-58.38 + 96.0) / 78.0 * 1080.0, (16.0 + 34.6) / 78.0 * 1920.0);
        vec2 C = vec2((-74.3 + 96.0) / 78.0 * 1080.0, (16.0 - 4.35) / 78.0 * 1920.0);
        vec2 B = (A + C) * 0.5 + vec2(260.0, -60.0);
        float best = 1e5, bt = 0.0;
        for (int i = 0; i < 40; i++) { float t0 = float(i) / 40.0; float t1 = float(i + 1) / 40.0;
          float dd = sdSeg(s, bez(A, B, C, t0), bez(A, B, C, t1)); if (dd < best) { best = dd; bt = t0; } }
        float vis = 1.0 - smoothstep(routeP - 0.02, routeP, bt);
        float dash = 0.6 + 0.4 * step(0.5, fract(bt * 30.0 - uTime * 1.2));
        col += vec3(1.0, 0.7, 0.05) * (exp(-best * best / 8.0) * 1.6 * dash + exp(-best / 26.0) * 0.18) * vis * intro;
        for (int k = 0; k < 2; k++) { vec2 P = k == 0 ? A : C; float r = length(s - P);
          col += vec3(1.0, 0.75, 0.1) * (exp(-r * r / 60.0) * 3.0 + exp(-pow((r - mod(uTime * 60.0, 70.0)) / 2.0, 2.0)) * 0.5) * intro * (k == 0 ? 1.0 : step(0.98, routeP)); }
        // diagonal light streaks
        float diag = (s.x * 0.5 - s.y * 0.866);
        for (int k = 0; k < 5; k++) {
          float fk = float(k);
          float lane = fract(diag / 520.0 + fk * 0.21);
          float along = s.x * 0.866 + s.y * 0.5;
          float head = mod(uTime * (420.0 + fk * 90.0) + fk * 700.0, 3200.0) - 600.0;
          float seg = smoothstep(head - 520.0, head, along) * (1.0 - smoothstep(head, head + 8.0, along));
          float ln = exp(-pow((lane - 0.5) * 520.0 / 1.6, 2.0));
          col += (k % 2 == 0 ? vec3(1.0, 0.72, 0.05) : vec3(0.15, 0.35, 1.0)) * ln * seg * 0.55 * intro;
        }
        // bokeh confetti
        for (int k = 0; k < 2; k++) {
          float sc = k == 0 ? 90.0 : 170.0;
          vec2 q = s / sc + vec2(0.0, uTime * (k == 0 ? 0.22 : 0.12));
          vec2 cell = floor(q); vec2 f = fract(q) - 0.5;
          vec2 o = hash22(cell + float(k) * 9.0) - 0.5;
          float on = step(0.72, hash12(cell + 3.0 + float(k)));
          float r = length(f - o * 0.6);
          float b = (1.0 - smoothstep(0.1, 0.16, r)) * on;
          float h = hash12(cell + 11.0);
          vec3 bc = h < 0.45 ? vec3(1.0, 0.72, 0.05) : (h < 0.85 ? vec3(0.1, 0.3, 1.0) : vec3(1.0));
          col += bc * b * (k == 0 ? 0.08 : 0.05) * intro;
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  scene.add(quad);
  return {
    scene, camera, mat,
    update(t, { routeP = 1, intro = 1, priceGlow = 0 } = {}) {
      mat.uniforms.uTime.value = t; mat.uniforms.routeP.value = routeP; mat.uniforms.intro.value = intro; mat.uniforms.priceGlow.value = priceGlow;
    },
  };
}
