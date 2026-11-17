// End card background: near-black with red light, a faint map of the Río de la
// Plata with BOTH routes (coach by land in red, Buquebus by water in white)
// meeting in Montevideo, light streaks and drifting red/white bokeh.
import * as THREE from 'three';
import { GLSL_NOISE } from './util.js';
import { BUS_ROUTE, SEA_ROUTE, BA, MVD } from './globe.js';

const LON0 = -60.4, LON1 = -54.6, LAT1 = -29.9;
const PX_PER_DEG = 1080 / (LON1 - LON0), PX_PER_DEG_LAT = PX_PER_DEG / Math.cos(34.5 * Math.PI / 180);
const toScreen = ([lon, lat]) => [(lon - LON0) * PX_PER_DEG, (LAT1 - lat) * PX_PER_DEG_LAT];

function polyUniform(list) {
  const pts = list.map(toScreen);
  let acc = 0; const out = [new THREE.Vector3(pts[0][0], pts[0][1], 0)];
  for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); out.push(new THREE.Vector3(pts[i][0], pts[i][1], acc)); }
  out.forEach((v) => { v.z /= acc; });
  return out;
}

export function buildEndcard(W, H, { tSA, meta }) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const reg = meta.region;
  const bus = polyUniform(BUS_ROUTE), sea = polyUniform(SEA_ROUTE);
  const ba = toScreen([BA.lon, BA.lat]), mvd = toScreen([MVD.lon, MVD.lat]);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, tSA: { value: tSA }, regB: { value: new THREE.Vector4(reg.lon0, reg.lon1, reg.lat0, reg.lat1) },
      landRange: { value: meta.landRange }, routeP: { value: 0 }, intro: { value: 0 }, pulse: { value: 0 },
      busP: { value: bus }, seaP: { value: sea }, baS: { value: new THREE.Vector2(...ba) }, mvdS: { value: new THREE.Vector2(...mvd) },
      geo: { value: new THREE.Vector4(LON0, LAT1, PX_PER_DEG, PX_PER_DEG_LAT) },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime, landRange, routeP, intro, pulse; uniform sampler2D tSA; uniform vec4 regB, geo; uniform vec2 baS, mvdS;
      uniform vec3 busP[${bus.length}]; uniform vec3 seaP[${sea.length}];
      varying vec2 vUv;
      float segD(vec2 p, vec2 a, vec2 b, out float h){ vec2 pa = p - a, ba = b - a; h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
      void main(){
        vec2 s = vec2(vUv.x * 1080.0, (1.0 - vUv.y) * 1920.0);
        vec3 col = vec3(0.0042, 0.0038, 0.0045);
        col += vec3(0.20, 0.006, 0.012) * exp(-pow(length((s - vec2(540.0, 760.0)) / vec2(700.0, 620.0)), 2.0)) * (0.8 + 0.6 * pulse);
        col += vec3(0.05, 0.002, 0.004) * smoothstep(1100.0, 1920.0, s.y);
        // faint map of the Río de la Plata
        vec2 ll = vec2(geo.x + s.x / geo.z, geo.y - s.y / geo.w);
        vec2 ruv = vec2((ll.x - regB.x) / (regB.y - regB.x), (regB.w - ll.y) / (regB.w - regB.z));
        float d = (texture2D(tSA, ruv).r - 0.5) * 2.0 * landRange;
        float aa = fwidth(d) + 0.01;
        float land = smoothstep(-aa, aa, d);
        col += vec3(0.012, 0.011, 0.013) * land * intro;
        col += vec3(0.35, 0.33, 0.36) * exp(-pow(d / (aa * 1.3), 2.0)) * intro * 0.22;
        // routes
        float bestB = 1e5, sB = 0.0, bestS = 1e5, sS = 0.0, h;
        for (int i = 0; i < ${bus.length - 1}; i++) { float dd = segD(s, busP[i].xy, busP[i + 1].xy, h); if (dd < bestB) { bestB = dd; sB = mix(busP[i].z, busP[i + 1].z, h); } }
        for (int i = 0; i < ${sea.length - 1}; i++) { float dd = segD(s, seaP[i].xy, seaP[i + 1].xy, h); if (dd < bestS) { bestS = dd; sS = mix(seaP[i].z, seaP[i + 1].z, h); } }
        float vb = 1.0 - smoothstep(routeP - 0.02, routeP, sB), vs = 1.0 - smoothstep(routeP - 0.02, routeP, sS);
        float dash = 0.55 + 0.45 * step(0.45, fract(sS * 26.0 - uTime * 1.2));
        col += vec3(1.0, 0.05, 0.06) * (exp(-bestB * bestB / 7.0) * 1.8 + exp(-bestB / 22.0) * 0.16) * vb * intro;
        col += vec3(0.95, 0.95, 1.0) * (exp(-bestS * bestS / 6.0) * 1.4 * dash + exp(-bestS / 22.0) * 0.1) * vs * intro;
        float rb = length(s - baS), rm = length(s - mvdS);
        col += vec3(1.0) * exp(-rb * rb / 50.0) * 2.0 * intro + vec3(1.0, 0.1, 0.1) * exp(-rm * rm / 70.0) * 3.0 * intro * step(0.97, routeP);
        col += vec3(1.0, 0.1, 0.1) * exp(-pow((rm - mod(uTime * 60.0, 80.0)) / 2.5, 2.0)) * 0.6 * intro * step(0.97, routeP);
        // diagonal light streaks
        float diag = (s.x * 0.5 - s.y * 0.866);
        for (int k = 0; k < 5; k++) {
          float fk = float(k);
          float lane = fract(diag / 520.0 + fk * 0.21);
          float along = s.x * 0.866 + s.y * 0.5;
          float head = mod(uTime * (420.0 + fk * 90.0) + fk * 700.0, 3200.0) - 600.0;
          float seg = smoothstep(head - 520.0, head, along) * (1.0 - smoothstep(head, head + 8.0, along));
          float ln = exp(-pow((lane - 0.5) * 520.0 / 1.6, 2.0));
          col += (k % 2 == 0 ? vec3(1.0, 0.05, 0.06) : vec3(0.9, 0.9, 0.95)) * ln * seg * 0.5 * intro;
        }
        // bokeh papelitos
        for (int k = 0; k < 2; k++) {
          float sc = k == 0 ? 90.0 : 170.0;
          vec2 q = s / sc + vec2(0.0, uTime * (k == 0 ? 0.22 : 0.12));
          vec2 cell = floor(q); vec2 f = fract(q) - 0.5;
          vec2 o = hash22(cell + float(k) * 9.0) - 0.5;
          float on = step(0.72, hash12(cell + 3.0 + float(k)));
          float b = (1.0 - smoothstep(0.1, 0.16, length(f - o * 0.6))) * on;
          vec3 bc = hash12(cell + 11.0) < 0.6 ? vec3(1.0, 0.06, 0.07) : vec3(1.0);
          col += bc * b * (k == 0 ? 0.07 : 0.045) * intro;
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
    update(t, { routeP = 1, intro = 1, pulse = 0 } = {}) {
      mat.uniforms.uTime.value = t; mat.uniforms.routeP.value = routeP; mat.uniforms.intro.value = intro; mat.uniforms.pulse.value = pulse;
    },
  };
}
