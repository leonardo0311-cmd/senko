// Night football stadium in Colombia packed with Boca supporters: blue & yellow
// crowd (tiers form a giant blue-yellow-blue band), flags, flare smoke,
// "papelitos" confetti, floodlights and volumetric beams. Units: metres.
import * as THREE from 'three';
import { GLSL_NOISE, rng, clamp } from './util.js';
import { drawFan } from './fans.js';
import { GLSL_CITYLIGHTS } from './citylights.js';

const ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };
// stand bowl: d in [0,1] from front row to back row
const A0 = 64, B0 = 46, Y0 = 3.5, A1 = 112, B1 = 92, Y1 = 40;
const standPt = (th, d) => {
  const a = A0 + (A1 - A0) * d, b = B0 + (B1 - B0) * d;
  return new THREE.Vector3(Math.cos(th) * a, Y0 + (Y1 - Y0) * Math.pow(d, 1.08), Math.sin(th) * b);
};

function fanAtlas() {
  const cols = 8, rows = 3, cw = 96, ch = 160;
  const c = document.createElement('canvas');
  c.width = cols * cw; c.height = rows * ch;
  const ctx = c.getContext('2d');
  for (let v = 0; v < cols; v++) for (let p = 0; p < rows; p++) {
    ctx.save();
    ctx.beginPath(); ctx.rect(v * cw, p * ch, cw, ch); ctx.clip();
    // variants 0-4 blue jerseys, 5-7 yellow jerseys (same person in the 3 poses)
    const r = rng(1000 + v * 17);
    const rr = () => r();
    const seeded = rng(5000 + v * 31);
    drawFan(ctx, v * cw + cw / 2, p * ch + ch * 0.99, ch * 0.78, seeded, p === 0 ? 0 : (p === 1 ? 1 : 2), { jersey: v < 5 ? 'home' : 'yellow' });
    void rr;
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  return { tex, cols, rows };
}

export function buildStadium(W, H) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.5, 60000);
  const U = { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() }, haze: { value: 1 } };
  const DOTS = /* glsl */`
  // energy-conserving scattered light points (stays smooth at any distance)
  vec3 cityDots(vec2 p, vec2 fw, float dens){
    vec3 acc = vec3(0.0);
    float px = max(fw.x, fw.y);
    for (int k = 0; k < 2; k++) {
      float S = k == 0 ? 11.0 : 29.0;
      vec2 q = p / S + float(k) * 13.7;
      vec2 cell = floor(q), f = fract(q) - 0.5;
      vec2 o = hash22(cell) - 0.5;
      float on = step(1.0 - dens * (k == 0 ? 0.75 : 0.5), hash12(cell + 7.1));
      float s0 = k == 0 ? 0.035 : 0.05;
      float sig2 = s0 * s0 + pow(px / S, 2.0) * 0.35;
      vec2 d = f - o * 0.7;
      float I = (s0 * s0 / sig2) * exp(-dot(d, d) / (2.0 * sig2));
      float h = hash12(cell + 3.3);
      vec3 col = h < 0.6 ? vec3(1.0, 0.55, 0.2) : (h < 0.85 ? vec3(1.0, 0.85, 0.6) : vec3(0.7, 0.85, 1.0));
      acc += col * I * on * (k == 0 ? 2.6 : 4.0);
    }
    // a few winding main roads
    vec2 w = p + vec2(fbm(p * 0.0015) - 0.5, fbm(p * 0.0015 + 5.0) - 0.5) * 900.0;
    float road = lineCov(w.x / 700.0, 140.0, fw.x / 700.0 * 2.0) + lineCov(w.y / 820.0, 160.0, fw.y / 820.0 * 2.0);
    acc += vec3(1.0, 0.62, 0.25) * road * 1.6 * smoothstep(0.1, 0.4, dens);
    return acc * smoothstep(0.02, 0.15, dens);
  }`;
  const HAZE = /* glsl */`uniform float haze; uniform vec3 camPos;
    vec3 inHaze(vec3 c, vec3 w){
      float dist = length(camPos - w);
      // floodlit haze inside / around the bowl, plain night haze outside
      float inside = 1.0 - smoothstep(110.0, 190.0, length(w.xz * vec2(0.9, 1.1)));
      float k = mix(0.00010, 0.0011, inside * smoothstep(-5.0, 30.0, w.y + 10.0)) * haze;
      vec3 hc = mix(vec3(0.02, 0.03, 0.07), vec3(0.11, 0.14, 0.24), inside);
      return mix(c, hc, 1.0 - exp(-dist * k));
    }`;

  // ---------- sky + mountains (the Andes around a Colombian city) ----------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(40000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_NOISE + `varying vec3 vDir; void main(){ vec3 d = normalize(vDir); float h = d.y;
      vec3 c = mix(vec3(0.03, 0.045, 0.1), vec3(0.002, 0.005, 0.02), smoothstep(0.0, 0.5, h));
      c += vec3(0.08, 0.05, 0.03) * exp(-max(h, 0.0) * 18.0);
      vec3 g = d * 300.0; float hs = hash13(floor(g)); c += vec3(0.8, 0.85, 1.0) * step(0.998, hs) * (1.0 - smoothstep(0.0, 0.1, length(fract(g) - 0.5))) * smoothstep(0.1, 0.5, h) * 0.5;
      gl_FragColor = vec4(c, 1.0); }`,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  const mGeo = new THREE.PlaneGeometry(30000, 30000, 220, 220).rotateX(-Math.PI / 2);
  {
    const p = mGeo.attributes.position;
    const nz = (x, z) => Math.sin(x * 0.0007 + 1.3) * Math.cos(z * 0.0006) * 0.5 + Math.sin(x * 0.0021 + z * 0.0013) * 0.25 + Math.sin(x * 0.0051 - z * 0.0043) * 0.12;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const r = Math.hypot(x, z);
      const ring = THREE.MathUtils.smoothstep(r, 2200, 6500);
      const north = 1.0 + 0.5 * Math.max(0, -z / (r + 1));
      const hgt = ring * north * (900 + 650 * nz(x, z)) * (0.75 + 0.25 * Math.sin(Math.atan2(z, x) * 3.0 + 1.0));
      p.setY(i, Math.max(0, hgt) - 2);
    }
    mGeo.computeVertexNormals();
  }
  const groundMat = new THREE.ShaderMaterial({
    uniforms: { ...U },
    vertexShader: `varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + GLSL_CITYLIGHTS + DOTS + HAZE + /* glsl */`uniform float uTime; varying vec3 vW; varying vec3 vN;
      void main(){
        vec2 p = vW.xz + vec2(3100.0, -2700.0);
        float r = length(vW.xz);
        float elev = vW.y;
        float dens = (1.0 - smoothstep(1800.0, 5200.0, r)) * (0.55 + 0.45 * vnoise(vW.xz * 0.0008));
        dens *= 1.0 - smoothstep(60.0, 260.0, elev) * 0.85;
        dens *= smoothstep(150.0, 260.0, r);
        vec2 fw = fwidth(p);
        vec3 c = vec3(0.004, 0.006, 0.012) * (0.6 + 0.4 * dot(normalize(vN), normalize(vec3(-0.3, 0.8, 0.4))));
        c += cityDots(vW.xz, fw, dens);
        // scattered lights on the slopes
        float slope = smoothstep(40.0, 300.0, elev) * (1.0 - smoothstep(700.0, 1100.0, elev));
        c += vec3(1.0, 0.6, 0.25) * step(0.985, hash12(floor(vW.xz / 24.0))) * slope * 1.6 * (1.0 - smoothstep(4.0, 30.0, max(fw.x, fw.y)) * 0.6);
        // mountain rim catching moonlight
        c += vec3(0.03, 0.05, 0.11) * smoothstep(250.0, 1300.0, elev) * (0.5 + 0.8 * max(dot(normalize(vN), normalize(vec3(-0.4, 0.7, 0.6))), 0.0));
        float dist = length(camPos - vW);
        c = mix(c, vec3(0.03, 0.045, 0.1), 1.0 - exp(-dist * 0.00011));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(mGeo, groundMat));

  // ---------- pitch ----------
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(132, 96).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...U },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + HAZE + /* glsl */`varying vec3 vW;
      float ln(float d, float w){ float a = fwidth(d) + 0.02; return 1.0 - smoothstep(w - a, w + a, abs(d)); }
      void main(){
        vec2 p = vW.xz;
        float stripe = step(0.5, fract(p.x / 10.5));
        vec3 g = mix(vec3(0.035, 0.16, 0.05), vec3(0.05, 0.21, 0.065), stripe) * (0.85 + 0.3 * vnoise(p * 0.7));
        float L = 0.0, hw = 0.06;
        vec2 q = abs(p);
        L = max(L, ln(q.x - 52.5, hw) * step(q.y, 34.06));
        L = max(L, ln(q.y - 34.0, hw) * step(q.x, 52.56));
        L = max(L, ln(p.x, hw) * step(q.y, 34.0));
        L = max(L, ln(length(p) - 9.15, hw));
        L = max(L, ln(q.x - 36.0, hw) * step(q.y, 20.16));
        L = max(L, ln(q.y - 20.16, hw) * step(36.0, q.x) * step(q.x, 52.5));
        L = max(L, ln(q.x - 47.0, hw) * step(q.y, 9.16));
        L = max(L, ln(q.y - 9.16, hw) * step(47.0, q.x) * step(q.x, 52.5));
        L = max(L, ln(length(vec2(q.x - 41.5, p.y)) - 9.15, hw) * step(q.x, 36.0));
        vec3 c = mix(g, vec3(0.9), L) * 1.7;
        c *= 0.9 + 0.25 * exp(-length(p) * 0.012);
        gl_FragColor = vec4(inHaze(c, vW), 1.0);
      }`,
  }));
  scene.add(pitch);

  // ---------- stands, roof, facade ----------
  const NT = 256, ND = 40;
  const sPos = [], sIdx = [], sUV = [];
  for (let j = 0; j <= ND; j++) for (let i = 0; i <= NT; i++) {
    const p = standPt((i / NT) * Math.PI * 2, j / ND); sPos.push(p.x, p.y, p.z); sUV.push(i / NT, j / ND);
  }
  for (let j = 0; j < ND; j++) for (let i = 0; i < NT; i++) { const a = j * (NT + 1) + i, b = a + NT + 1; sIdx.push(a, b, a + 1, a + 1, b, b + 1); }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
  sGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sUV, 2));
  sGeo.setIndex(sIdx); sGeo.computeVertexNormals();
  const standMat = new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + HAZE + /* glsl */`uniform float uTime; varying vec3 vW; varying vec2 vUv;
      void main(){
        float d = vUv.y;
        // crowd colour mass under the individual fans (fills the gaps between sprites)
        float yel = smoothstep(0.34, 0.37, d) * (1.0 - smoothstep(0.62, 0.65, d));
        vec3 base = mix(vec3(0.0, 0.03, 0.2), vec3(0.85, 0.6, 0.0), yel) * (0.35 + 0.3 * vnoise(vW.xz * 1.3 + uTime));
        // VIP ring + LED ribbon boards (pure colour patterns, no text)
        float ring = smoothstep(0.495, 0.5, d) * (1.0 - smoothstep(0.525, 0.53, d));
        float led = 0.5 + 0.5 * sin(vUv.x * 120.0 - uTime * 6.0);
        base = mix(base, mix(vec3(0.0, 0.08, 0.9), vec3(1.0, 0.75, 0.0), step(0.5, led)) * 1.6, ring);
        float front = 1.0 - smoothstep(0.0, 0.02, d);
        base = mix(base, mix(vec3(0.0, 0.08, 0.9), vec3(1.0, 0.75, 0.0), step(0.5, fract(vUv.x * 40.0 + uTime * 0.6))) * 1.3, front);
        gl_FragColor = vec4(inHaze(base, vW), 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(sGeo, standMat));

  // roof canopy + facade (an oval ring), with lit blue/yellow fins outside
  const ring = (a0, b0, y0, a1, b1, y1, n = 256) => {
    const pos = [], idx = [], uv = [];
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * Math.PI * 2;
      pos.push(Math.cos(th) * a0, y0, Math.sin(th) * b0, Math.cos(th) * a1, y1, Math.sin(th) * b1);
      uv.push(i / n, 0, i / n, 1);
    }
    for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  const roofMat = new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: HAZE + `varying vec3 vW; varying vec2 vUv; void main(){
      float rib = smoothstep(0.42, 0.5, abs(fract(vUv.x * 96.0) - 0.5));
      vec3 c = mix(vec3(0.02, 0.025, 0.04), vec3(0.05, 0.055, 0.075), rib) * (0.7 + 0.6 * vUv.y);
      c += vec3(0.5, 0.6, 0.9) * (1.0 - smoothstep(0.0, 0.08, vUv.y)) * 0.5;
      gl_FragColor = vec4(inHaze(c, vW), 1.0); }`,
  });
  scene.add(new THREE.Mesh(ring(A1 + 8, B1 + 8, Y1 + 9, A1 - 14, B1 - 14, Y1 + 6), roofMat));
  const facadeMat = new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: HAZE + `uniform float uTime; varying vec3 vW; varying vec2 vUv; void main(){
      float fin = smoothstep(0.3, 0.45, abs(fract(vUv.x * 160.0) - 0.5));
      float band = step(0.38, vUv.y) * step(vUv.y, 0.62);
      vec3 col = mix(vec3(0.0, 0.07, 0.75), vec3(1.0, 0.72, 0.0), band);
      float sweep = 0.75 + 0.25 * sin(vUv.x * 6.283 * 4.0 - uTime * 2.0);
      vec3 c = col * fin * 2.6 * sweep + vec3(0.004, 0.005, 0.01);
      gl_FragColor = vec4(inHaze(c, vW), 1.0); }`,
  });
  scene.add(new THREE.Mesh(ring(A1 + 8, B1 + 8, 0, A1 + 8, B1 + 8, Y1 + 9), facadeMat));

  // ---------- crowd ----------
  const atlas = fanAtlas();
  const rand = rng(31337);
  const inst = [];
  for (let d = 0.012; d < 0.985; d += 0.85 / Math.hypot(A1 - A0, Y1 - Y0)) {
    const a = A0 + (A1 - A0) * d, b = B0 + (B1 - B0) * d;
    const per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    const n = Math.floor(per / 0.58);
    const off = rand();
    for (let i = 0; i < n; i++) {
      const th = ((i + off + (rand() - 0.5) * 0.3) / n) * Math.PI * 2;
      if (Math.abs(((th / (Math.PI * 2)) * 28) % 1 - 0.5) > 0.485) continue; // aisles
      if (Math.abs(d - 0.512) < 0.02) continue;                               // VIP ring
      const p = standPt(th, d);
      const yel = d > 0.355 && d < 0.635;
      const v = yel ? (rand() < 0.82 ? 5 + Math.floor(rand() * 3) : Math.floor(rand() * 5)) : (rand() < 0.9 ? Math.floor(rand() * 5) : 5 + Math.floor(rand() * 3));
      inst.push(p.x, p.y, p.z, v, rand(), th);
    }
  }
  const NF = inst.length / 6;
  const qGeo = new THREE.InstancedBufferGeometry();
  qGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  qGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  qGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const ip = new Float32Array(NF * 3), iv = new Float32Array(NF * 3);
  for (let i = 0; i < NF; i++) { ip.set(inst.slice(i * 6, i * 6 + 3), i * 3); iv.set(inst.slice(i * 6 + 3, i * 6 + 6), i * 3); }
  qGeo.setAttribute('ipos', new THREE.InstancedBufferAttribute(ip, 3));
  qGeo.setAttribute('ivar', new THREE.InstancedBufferAttribute(iv, 3));
  qGeo.instanceCount = NF;
  const crowdMat = new THREE.ShaderMaterial({
    uniforms: { ...U, atlas: { value: atlas.tex }, grid: { value: new THREE.Vector2(atlas.cols, atlas.rows) }, bounce: { value: 1 } },
    vertexShader: /* glsl */`attribute vec3 ipos, ivar; uniform float uTime, bounce; uniform vec3 camPos; varying vec2 vUv; varying float vV, vLit; varying vec3 vW; varying float vPose;
      void main(){
        float ph = ivar.y;
        // the whole stand jumps in waves ("la tribuna salta")
        float wave = sin(uTime * 8.2 - ivar.z * 3.0 + ph * 1.4);
        float jump = max(wave, 0.0) * 0.32 * bounce;
        vec3 toCam = camPos - ipos; toCam.y = 0.0; toCam = normalize(toCam);
        vec3 right = vec3(toCam.z, 0.0, -toCam.x);
        float hgt = 1.75 * (0.92 + 0.16 * fract(ph * 7.1));
        vec3 w = ipos + right * position.x * hgt * 0.6 + vec3(0.0, position.y * hgt + jump, 0.0);
        vW = w;
        vUv = uv; vV = ivar.x;
        vPose = mod(floor(uTime * 2.6 + ph * 3.0), 3.0);
        vLit = 0.85 + 0.3 * fract(ph * 13.3);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: HAZE + /* glsl */`uniform sampler2D atlas; uniform vec2 grid; varying vec2 vUv; varying float vV, vLit; varying vec3 vW; varying float vPose;
      void main(){
        vec2 cell = vec2(vV, grid.y - 1.0 - vPose);
        vec4 t = texture2D(atlas, (cell + vec2(vUv.x, vUv.y)) / grid);
        if (t.a < 0.45) discard;
        vec3 c = pow(t.rgb, vec3(2.2)) * vLit * 1.15;
        gl_FragColor = vec4(inHaze(c, vW), 1.0);
      }`,
  });
  const crowd = new THREE.Mesh(qGeo, crowdMat);
  crowd.frustumCulled = false;
  scene.add(crowd);

  // ---------- flags (cloth on poles) + a giant banner sweeping a stand ----------
  const flagMat = new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 ipos; attribute vec2 iinfo; uniform float uTime; varying vec2 vUv; varying vec3 vW; varying float vShade;
      void main(){
        vUv = uv;
        float sz = iinfo.x;
        vec3 p = position * vec3(sz * 1.5, sz, 1.0);
        float ph = iinfo.y * 6.283;
        float wv = sin(uv.x * 5.0 - uTime * 7.0 + ph) * 0.5 + sin(uv.x * 9.0 + uv.y * 3.0 - uTime * 11.0 + ph) * 0.2;
        p.z += wv * uv.x * sz * 0.35;
        p.y -= uv.x * uv.x * sz * 0.15;
        float swing = sin(uTime * 2.2 + ph) * 0.6;
        mat2 r = mat2(cos(swing), -sin(swing), sin(swing), cos(swing));
        p.xz = r * p.xz;
        vec3 w = ipos + vec3(p.x, p.y + 2.5 + sz * 0.6, p.z);
        vW = w; vShade = 0.6 + 0.4 * cos(uv.x * 5.0 - uTime * 7.0 + ph);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: HAZE + `varying vec2 vUv; varying vec3 vW; varying float vShade; void main(){
      float y = step(0.333, vUv.y) * step(vUv.y, 0.667);
      vec3 c = mix(vec3(0.0, 0.05, 0.42), vec3(1.0, 0.72, 0.0), y) * vShade * 1.3;
      gl_FragColor = vec4(inHaze(c, vW), 1.0); }`,
  });
  const fGeo = new THREE.InstancedBufferGeometry();
  const pg = new THREE.PlaneGeometry(1, 1, 16, 6); pg.translate(0.5, 0, 0);
  fGeo.setIndex(pg.index); fGeo.setAttribute('position', pg.attributes.position); fGeo.setAttribute('uv', pg.attributes.uv);
  const NFL = 90; const fp = new Float32Array(NFL * 3), fi = new Float32Array(NFL * 2);
  for (let i = 0; i < NFL; i++) {
    const th = rand() * Math.PI * 2, d = 0.05 + rand() * 0.9;
    const p = standPt(th, d); fp.set([p.x, p.y, p.z], i * 3); fi.set([2.2 + rand() * 3.0, rand()], i * 2);
  }
  fGeo.setAttribute('ipos', new THREE.InstancedBufferAttribute(fp, 3));
  fGeo.setAttribute('iinfo', new THREE.InstancedBufferAttribute(fi, 2));
  fGeo.instanceCount = NFL;
  const flags = new THREE.Mesh(fGeo, flagMat); flags.frustumCulled = false; scene.add(flags);

  // giant banner rippling over the far stand (blue-yellow-blue)
  const bGeo = new THREE.PlaneGeometry(1, 1, 80, 30);
  const banner = new THREE.Mesh(bGeo, new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`uniform float uTime; varying vec2 vUv; varying vec3 vW; varying float vSh;
      void main(){
        vUv = uv;
        float th = mix(-0.42, 0.42, uv.x) - 1.5708;
        float d = mix(0.22, 0.8, uv.y);
        float a = mix(${A0.toFixed(1)}, ${A1.toFixed(1)}, d), b = mix(${B0.toFixed(1)}, ${B1.toFixed(1)}, d);
        vec3 p = vec3(cos(th) * a, ${Y0.toFixed(1)} + (${Y1.toFixed(1)} - ${Y0.toFixed(1)}) * pow(d, 1.08) + 2.4, sin(th) * b);
        float wv = sin(uv.x * 14.0 - uTime * 3.2) * 0.9 + sin(uv.y * 9.0 + uv.x * 6.0 - uTime * 4.6) * 0.6;
        p.y += wv; vSh = 0.65 + 0.35 * cos(uv.x * 14.0 - uTime * 3.2);
        vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: HAZE + `varying vec2 vUv; varying vec3 vW; varying float vSh; void main(){
      float y = step(0.333, vUv.y) * step(vUv.y, 0.667);
      vec3 c = mix(vec3(0.0, 0.05, 0.42), vec3(1.0, 0.72, 0.0), y) * vSh * 1.5;
      gl_FragColor = vec4(inHaze(c, vW), 1.0); }`,
  }));
  banner.frustumCulled = false;
  scene.add(banner);

  // ---------- floodlights: roof ring of lamps + volumetric beams ----------
  const NL = 64;
  const lp = new Float32Array(NL * 3);
  for (let i = 0; i < NL; i++) { const th = (i / NL) * Math.PI * 2; lp.set([Math.cos(th) * (A1 - 12), Y1 + 6.5, Math.sin(th) * (B1 - 12)], i * 3); }
  const lGeo = new THREE.BufferGeometry(); lGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const lampMat = new THREE.ShaderMaterial({
    uniforms: { scale: { value: H }, amt: { value: 1 } },
    vertexShader: `uniform float scale; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(scale * 7.0 / -mv.z, 2.0, 160.0); }`,
    fragmentShader: `uniform float amt; void main(){ vec2 p = gl_PointCoord - 0.5; float r = length(p); float c = exp(-r * r * 90.0) * 2.5 + exp(-r * 8.0) * 0.25 + (exp(-abs(p.x) * 70.0) + exp(-abs(p.y) * 70.0)) * exp(-r * 4.0) * 0.08;
      gl_FragColor = vec4(vec3(0.9, 0.95, 1.0) * c * 6.0 * amt, 1.0); }`, ...ADD,
  });
  scene.add(new THREE.Points(lGeo, lampMat));
  const beamGeo = new THREE.ConeGeometry(1, 1, 32, 1, true); beamGeo.translate(0, -0.5, 0);
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { ...U, amt: { value: 1 } }, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vH; varying vec3 vW; void main(){ vH = -position.y; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + `uniform float amt, uTime; varying vec3 vN; varying vec3 vV; varying float vH; varying vec3 vW; void main(){
      float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.5);
      float n = 0.6 + 0.4 * fbm3(vW * 0.05 + vec3(0.0, uTime * 0.4, 0.0));
      float a = f * (1.0 - vH) * smoothstep(0.0, 0.1, vH) * n * 0.05 * amt;
      gl_FragColor = vec4(vec3(0.75, 0.82, 1.0) * a, 1.0); }`, ...ADD,
  });
  for (let i = 0; i < 20; i++) {
    const th = (i / 20) * Math.PI * 2 + 0.08;
    const b = new THREE.Mesh(beamGeo, beamMat);
    const top = new THREE.Vector3(Math.cos(th) * (A1 - 12), Y1 + 6.5, Math.sin(th) * (B1 - 12));
    const target = new THREE.Vector3(Math.cos(th + 2.6) * 30, 0, Math.sin(th + 2.6) * 20);
    const len = top.distanceTo(target);
    b.position.copy(top);
    b.scale.set(len * 0.2, len, len * 0.2);
    b.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), target.clone().sub(top).normalize());
    scene.add(b);
  }

  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
    uniforms: { amt: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float amt; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(max(dot(normalize(vN), normalize(vV)), 0.0), 2.5); gl_FragColor = vec4(vec3(0.35, 0.45, 0.85) * f * 0.22 * amt, 1.0); }`,
    ...ADD,
  }));
  dome.scale.set(190, 120, 170); dome.position.y = 10;
  scene.add(dome);

  // ---------- flare smoke (blue / yellow) ----------
  const NS = 260;
  const smGeo = new THREE.InstancedBufferGeometry();
  smGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  smGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  smGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const sp = new Float32Array(NS * 3), sinfo = new Float32Array(NS * 4);
  const emit = [];
  for (let k = 0; k < 16; k++) { const th = rand() * Math.PI * 2, d = 0.15 + rand() * 0.7; emit.push([standPt(th, d), k % 2]); }
  for (let i = 0; i < NS; i++) {
    const [p, col] = emit[i % emit.length];
    sp.set([p.x + (rand() - 0.5) * 6, p.y, p.z + (rand() - 0.5) * 6], i * 3);
    sinfo.set([col, rand(), 6 + rand() * 10, rand()], i * 4);
  }
  smGeo.setAttribute('ipos', new THREE.InstancedBufferAttribute(sp, 3));
  smGeo.setAttribute('info', new THREE.InstancedBufferAttribute(sinfo, 4));
  smGeo.instanceCount = NS;
  const smokeMat = new THREE.ShaderMaterial({
    uniforms: { ...U, amt: { value: 1 } },
    vertexShader: /* glsl */`attribute vec3 ipos; attribute vec4 info; uniform float uTime; varying vec2 vUv; varying float vCol, vA, vSeed; varying vec3 vW;
      void main(){
        float life = fract(info.y + uTime * 0.09);
        float sz = info.z * (0.4 + life * 1.8);
        vec3 c = ipos + vec3(sin(info.w * 30.0 + uTime * 0.3) * 6.0 * life, life * 34.0, cos(info.w * 20.0) * 5.0 * life);
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 w = c + (right * position.x + up * position.y) * sz;
        vW = w; vUv = uv; vCol = info.x; vSeed = info.w;
        vA = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.55, 1.0, life));
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`uniform float amt, uTime; varying vec2 vUv; varying float vCol, vA, vSeed; varying vec3 vW;
      void main(){
        vec2 q = vUv - 0.5;
        float n = fbm(q * 3.2 + vSeed * 17.0 + vec2(0.0, -uTime * 0.25));
        float a = (1.0 - smoothstep(0.15, 0.5, length(q) + (n - 0.5) * 0.42)) * vA * amt * 0.42;
        vec3 col = vCol > 0.5 ? vec3(1.0, 0.7, 0.05) : vec3(0.15, 0.38, 1.0) * 1.35;
        vec3 c = col * (0.55 + 0.9 * n);
        gl_FragColor = vec4(c * a, a * 0.85);
      }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const smoke = new THREE.Mesh(smGeo, smokeMat); smoke.frustumCulled = false; scene.add(smoke);
  // flare cores
  const fcGeo = new THREE.BufferGeometry();
  fcGeo.setAttribute('position', new THREE.Float32BufferAttribute(emit.flatMap(([p]) => [p.x, p.y + 1.6, p.z]), 3));
  fcGeo.setAttribute('col', new THREE.Float32BufferAttribute(emit.map(([, c]) => c), 1));
  const fcMat = new THREE.ShaderMaterial({
    uniforms: { scale: { value: H }, uTime: { value: 0 } },
    vertexShader: `attribute float col; uniform float scale, uTime; varying float vC; varying float vF; void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
      vF = 0.75 + 0.25 * sin(uTime * 37.0 + position.x); gl_PointSize = clamp(scale * 3.5 / -mv.z, 2.0, 90.0); }`,
    fragmentShader: `varying float vC; varying float vF; void main(){ float r = length(gl_PointCoord - 0.5); float c = exp(-r * r * 60.0) * 3.0 + exp(-r * 7.0) * 0.4;
      vec3 col = vC > 0.5 ? vec3(1.0, 0.75, 0.2) : vec3(0.4, 0.55, 1.0); gl_FragColor = vec4(col * c * vF * 5.0, 1.0); }`, ...ADD,
  });
  scene.add(new THREE.Points(fcGeo, fcMat));

  // ---------- papelitos / confetti ----------
  const NC = 7000;
  const cGeo = new THREE.InstancedBufferGeometry();
  cGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  cGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const cp = new Float32Array(NC * 3), ci = new Float32Array(NC * 4);
  for (let i = 0; i < NC; i++) {
    const th = rand() * Math.PI * 2, rr = Math.sqrt(rand());
    cp.set([Math.cos(th) * 120 * rr, rand() * 70, Math.sin(th) * 100 * rr], i * 3);
    const k = rand();
    ci.set([k < 0.42 ? 0 : (k < 0.84 ? 1 : 2), rand(), rand(), rand()], i * 4);
  }
  cGeo.setAttribute('ipos', new THREE.InstancedBufferAttribute(cp, 3));
  cGeo.setAttribute('info', new THREE.InstancedBufferAttribute(ci, 4));
  cGeo.instanceCount = NC;
  const confMat = new THREE.ShaderMaterial({
    uniforms: { ...U, amt: { value: 1 } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 ipos; attribute vec4 info; uniform float uTime; uniform vec3 camPos; varying vec3 vC; varying float vGl; varying vec3 vW;
      void main(){
        float fall = 3.2 + info.y * 2.5;
        vec3 c = ipos;
        c.y = mod(ipos.y - uTime * fall, 70.0) + 2.0;
        if (info.w > 0.45) {
          vec3 box = vec3(56.0, 40.0, 56.0);
          vec3 rel = vec3(ipos.x * 0.47, ipos.y * 0.57 - uTime * fall, ipos.z * 0.56) - camPos + box * 0.5;
          c = camPos + mod(rel, box) - box * 0.5 + vec3(0.0, -6.0, 0.0);
        }
        c.x += sin(uTime * 1.7 + info.z * 40.0) * 1.2;
        c.z += cos(uTime * 1.3 + info.w * 40.0) * 1.2;
        float a = uTime * (4.0 + info.z * 6.0) + info.w * 10.0, b = uTime * (3.0 + info.y * 5.0) + info.z * 10.0;
        mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cos(a), sin(a), 0.0, -sin(a), cos(a));
        mat3 ry = mat3(cos(b), 0.0, -sin(b), 0.0, 1.0, 0.0, sin(b), 0.0, cos(b));
        vec3 n = ry * rx * vec3(0.0, 0.0, 1.0);
        vec3 w = c + ry * rx * (position * vec3(0.16, 0.11, 1.0));
        vW = w;
        vC = info.x < 0.5 ? vec3(0.05, 0.2, 1.0) : (info.x < 1.5 ? vec3(1.0, 0.75, 0.05) : vec3(1.0));
        vec3 V = normalize(cameraPosition - w);
        vGl = 0.35 + 1.6 * pow(abs(dot(n, normalize(vec3(0.2, 1.0, 0.3)))), 8.0) + 0.5 * abs(dot(n, V));
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: HAZE + `uniform float amt; varying vec3 vC; varying float vGl; varying vec3 vW; void main(){ gl_FragColor = vec4(inHaze(vC * vGl * 1.4, vW) * amt, 1.0); }`,
  });
  const confetti = new THREE.Mesh(cGeo, confMat); confetti.frustumCulled = false; scene.add(confetti);

  const planeHolder = new THREE.Group(); scene.add(planeHolder);
  const mats = [groundMat, pitch.material, standMat, roofMat, facadeMat, crowdMat, flagMat, banner.material, beamMat, smokeMat, confMat];
  void dome;

  return {
    scene, camera, planeHolder, NF,
    update(t, { haze = 1, smokeAmt = 1, confAmt = 1 } = {}) {
      camera.updateMatrixWorld();
      for (const m of mats) {
        if (m.uniforms.uTime) m.uniforms.uTime.value = t;
        if (m.uniforms.camPos) m.uniforms.camPos.value.copy(camera.position);
        if (m.uniforms.haze) m.uniforms.haze.value = haze;
      }
      fcMat.uniforms.uTime.value = t;
      smokeMat.uniforms.amt.value = smokeAmt;
      confMat.uniforms.amt.value = confAmt;
      const h = camera.position.y;
      camera.near = clamp(h * 0.004, 0.3, 50);
      camera.far = 60000;
      camera.updateProjectionMatrix();
    },
  };
}
