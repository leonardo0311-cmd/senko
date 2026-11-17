// Stadium kit (embeddable group): bowl, pitch, red-and-white crowd, flags, a
// giant red-white-red banner, flare smoke, papelitos and floodlights.
// variant 'uno'        : roofed modern stadium (La Plata), lights on the roof rim
// variant 'centenario' : open bowl, celeste outer wall, four floodlight masts and
//                        the Torre de los Homenajes (Montevideo)
import * as THREE from 'three';
import { GLSL_NOISE, rng } from './util.js';
import { fanAtlas, buildCrowd, buildFlags } from './fans.js';
import { buildSmoke, buildFlareCores, buildConfetti } from './fx.js';

const ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };

export const HAZE = /* glsl */`uniform float haze; uniform vec3 camPos; uniform vec3 sCenter;
  vec3 inHaze(vec3 c, vec3 w){
    float dist = length(camPos - w);
    vec2 lw = w.xz - sCenter.xz;
    float inside = 1.0 - smoothstep(110.0, 190.0, length(lw * vec2(0.9, 1.1)));
    float k = mix(0.00008, 0.0011, inside * smoothstep(-5.0, 30.0, w.y + 10.0)) * haze;
    vec3 hc = mix(vec3(0.016, 0.012, 0.014), vec3(0.15, 0.11, 0.12), inside);
    return mix(c, hc, 1.0 - exp(-dist * k));
  }`;

export function buildStadiumKit(H, { variant = 'uno', seed = 1 } = {}) {
  const cent = variant === 'centenario';
  const A0 = 62, B0 = 44, Y0 = cent ? 2.5 : 3.5, A1 = cent ? 118 : 104, B1 = cent ? 96 : 86, Y1 = cent ? 34 : 36;
  const standPt = (th, d) => {
    const sq = (v) => Math.sign(v) * Math.pow(Math.abs(v), cent ? 0.75 : 0.62);   // rounded rectangle
    const a = A0 + (A1 - A0) * d, b = B0 + (B1 - B0) * d;
    return new THREE.Vector3(sq(Math.cos(th)) * a, Y0 + (Y1 - Y0) * Math.pow(d, 1.06), sq(Math.sin(th)) * b);
  };
  const group = new THREE.Group();
  const U = { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() }, haze: { value: 1 }, sCenter: { value: new THREE.Vector3() } };
  const mats = [];
  const reg = (m) => { mats.push(m); return m; };
  const rand = rng(seed * 7919);

  // pitch
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(130, 92).rotateX(-Math.PI / 2), reg(new THREE.ShaderMaterial({
    uniforms: { ...U },
    vertexShader: `varying vec3 vW; varying vec2 vP; void main(){ vP = position.xz; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + HAZE + /* glsl */`varying vec3 vW; varying vec2 vP;
      float ln(float d, float w){ float a = fwidth(d) + 0.02; return 1.0 - smoothstep(w - a, w + a, abs(d)); }
      void main(){
        vec2 p = vP; vec2 q = abs(p);
        float stripe = step(0.5, fract(p.x / 10.5));
        vec3 g = mix(vec3(0.035, 0.15, 0.045), vec3(0.05, 0.2, 0.06), stripe) * (0.85 + 0.3 * vnoise(p * 0.7));
        float L = 0.0, hw = 0.06;
        L = max(L, ln(q.x - 52.5, hw) * step(q.y, 34.06)); L = max(L, ln(q.y - 34.0, hw) * step(q.x, 52.56));
        L = max(L, ln(p.x, hw) * step(q.y, 34.0)); L = max(L, ln(length(p) - 9.15, hw));
        L = max(L, ln(q.x - 36.0, hw) * step(q.y, 20.16)); L = max(L, ln(q.y - 20.16, hw) * step(36.0, q.x) * step(q.x, 52.5));
        L = max(L, ln(q.x - 47.0, hw) * step(q.y, 9.16)); L = max(L, ln(q.y - 9.16, hw) * step(47.0, q.x) * step(q.x, 52.5));
        vec3 c = mix(g, vec3(0.9), L) * 1.6 * (0.9 + 0.25 * exp(-length(p) * 0.012));
        gl_FragColor = vec4(inHaze(c, vW), 1.0);
      }`,
  })));
  pitch.position.y = 0.05;
  group.add(pitch);

  // stands surface (fills the gaps between people; red / white sectors)
  const NT = 256, ND = 40;
  const sPos = [], sIdx = [], sUV = [];
  for (let j = 0; j <= ND; j++) for (let i = 0; i <= NT; i++) { const p = standPt((i / NT) * Math.PI * 2, j / ND); sPos.push(p.x, p.y, p.z); sUV.push(i / NT, j / ND); }
  for (let j = 0; j < ND; j++) for (let i = 0; i < NT; i++) { const a = j * (NT + 1) + i, b = a + NT + 1; sIdx.push(a, b, a + 1, a + 1, b, b + 1); }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3)); sGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sUV, 2));
  sGeo.setIndex(sIdx); sGeo.computeVertexNormals();
  const SECTORS = 16.0;
  group.add(new THREE.Mesh(sGeo, reg(new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + HAZE + /* glsl */`uniform float uTime; varying vec3 vW; varying vec2 vUv;
      void main(){
        float wh = step(0.5, fract(vUv.x * ${SECTORS.toFixed(1)}));
        vec3 base = mix(vec3(0.5, 0.004, 0.012), vec3(0.6, 0.58, 0.58), wh) * (0.3 + 0.3 * vnoise(vW.xz * 1.3 + uTime));
        float front = 1.0 - smoothstep(0.0, 0.02, vUv.y);
        base = mix(base, mix(vec3(1.0, 0.03, 0.05), vec3(1.0), step(0.5, fract(vUv.x * 40.0 + uTime * 0.6))) * 1.2, front);
        gl_FragColor = vec4(inHaze(base, vW), 1.0);
      }`,
  }))));

  // crowd: sectors alternate red-dominant / white-dominant (giant striped jersey)
  const atlas = fanAtlas({ cols: 8, seed: 7000 + seed, jerseyOf: (v) => (v < 4 ? 'home' : (v < 6 ? 'red' : (v < 7 ? 'white' : 'home'))) });
  const people = [];
  for (let d = 0.012; d < 0.985; d += 0.85 / Math.hypot(A1 - A0, Y1 - Y0)) {
    const a = A0 + (A1 - A0) * d, b = B0 + (B1 - B0) * d;
    const per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    const n = Math.floor(per / 0.6);
    const off = rand();
    for (let i = 0; i < n; i++) {
      const th = ((i + off + (rand() - 0.5) * 0.3) / n) * Math.PI * 2;
      if (Math.abs(((th / (Math.PI * 2)) * 28) % 1 - 0.5) > 0.485) continue;
      const p = standPt(th, d);
      const whiteSector = Math.floor(((th / (Math.PI * 2)) % 1) * SECTORS) % 2 === 1;
      const v = whiteSector ? (rand() < 0.75 ? 6 : Math.floor(rand() * 4)) : (rand() < 0.7 ? 4 + Math.floor(rand() * 2) : Math.floor(rand() * 4));
      people.push([p.x, p.y, p.z, v, rand()]);
    }
  }
  const crowd = buildCrowd(atlas, people, { hazeGLSL: HAZE, lit: 1.1, bounce: 0.32 });
  crowd.mat.uniforms.sCenter = U.sCenter; crowd.mat.uniforms.haze = U.haze;
  group.add(crowd.mesh);

  // flags + giant banner
  const flagList = [];
  for (let i = 0; i < 110; i++) { const p = standPt(rand() * Math.PI * 2, 0.05 + rand() * 0.9); flagList.push([p.x, p.y, p.z, 2.0 + rand() * 2.6, rand()]); }
  const flags = buildFlags(flagList, { hazeGLSL: HAZE });
  flags.mat.uniforms.sCenter = U.sCenter;
  group.add(flags.mesh);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 80, 30), reg(new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`uniform float uTime; varying vec2 vUv; varying vec3 vW; varying float vSh;
      vec3 standPt(float th, float d){
        float c = cos(th), s = sin(th);
        float e = ${cent ? '0.75' : '0.62'};
        float a = mix(${A0.toFixed(1)}, ${A1.toFixed(1)}, d), b = mix(${B0.toFixed(1)}, ${B1.toFixed(1)}, d);
        return vec3(sign(c) * pow(abs(c), e) * a, ${Y0.toFixed(1)} + (${Y1.toFixed(1)} - ${Y0.toFixed(1)}) * pow(d, 1.06) + 2.4, sign(s) * pow(abs(s), e) * b);
      }
      void main(){
        vUv = uv;
        vec3 p = standPt(mix(-0.2, 0.2, uv.x) - 1.5708, mix(0.38, 0.64, uv.y));
        float wv = sin(uv.x * 14.0 - uTime * 3.2) * 0.9 + sin(uv.y * 9.0 + uv.x * 6.0 - uTime * 4.6) * 0.6;
        p.y += wv; vSh = 0.65 + 0.35 * cos(uv.x * 14.0 - uTime * 3.2);
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: HAZE + `varying vec2 vUv; varying vec3 vW; varying float vSh; void main(){
      float wh = step(0.333, vUv.y) * step(vUv.y, 0.667);
      vec3 c = mix(vec3(0.85, 0.01, 0.03), vec3(0.95), wh) * vSh * 1.35;
      gl_FragColor = vec4(inHaze(c, vW), 1.0); }`,
  })));
  banner.frustumCulled = false;
  group.add(banner);

  // outer wall / facade
  const ringGeo = (a0, b0, y0, a1, b1, y1, n = 256) => {
    const pos = [], idx = [], uv = [];
    const e = cent ? 0.75 : 0.62;
    const sq = (v) => Math.sign(v) * Math.pow(Math.abs(v), e);
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * Math.PI * 2;
      pos.push(sq(Math.cos(th)) * a0, y0, sq(Math.sin(th)) * b0, sq(Math.cos(th)) * a1, y1, sq(Math.sin(th)) * b1);
      uv.push(i / n, 0, i / n, 1);
    }
    for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  const facadeMat = reg(new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: HAZE + (cent
      ? `uniform float uTime; varying vec3 vW; varying vec2 vUv; void main(){
          // celeste concrete wall, lit from below with red & white
          vec3 wall = vec3(0.12, 0.28, 0.42) * (0.35 + 0.65 * exp(-vUv.y * 2.0));
          float win = step(0.6, fract(vUv.x * 220.0)) * step(0.55, vUv.y) * step(vUv.y, 0.62);
          vec3 c = wall + vec3(1.0, 0.85, 0.7) * win * 0.6 + vec3(0.6, 0.02, 0.03) * exp(-vUv.y * 4.0) * (0.6 + 0.4 * sin(vUv.x * 40.0 - uTime * 2.0));
          gl_FragColor = vec4(inHaze(c, vW), 1.0); }`
      : `uniform float uTime; varying vec3 vW; varying vec2 vUv; void main(){
          float stripe = step(0.5, fract(vUv.x * 96.0));
          vec3 col = mix(vec3(1.0, 0.03, 0.03) * 1.4, vec3(1.0, 0.95, 0.92) * 1.0, stripe);
          float fin = smoothstep(0.2, 0.35, abs(fract(vUv.x * 384.0) - 0.5));
          float band = smoothstep(0.15, 0.2, vUv.y) * (1.0 - smoothstep(0.85, 0.9, vUv.y));
          vec3 c = col * fin * band * (0.8 + 0.2 * sin(vUv.x * 25.0 - uTime * 3.0)) + vec3(0.01);
          gl_FragColor = vec4(inHaze(c, vW), 1.0); }`),
  }));
  group.add(new THREE.Mesh(ringGeo(A1 + 6, B1 + 6, 0, A1 + 6, B1 + 6, Y1 + (cent ? 4 : 10)), facadeMat));
  if (!cent) { // roof canopy with the light rim
    group.add(new THREE.Mesh(ringGeo(A1 + 8, B1 + 8, Y1 + 11, A1 - 16, B1 - 16, Y1 + 8), reg(new THREE.ShaderMaterial({
      uniforms: { ...U }, side: THREE.DoubleSide,
      vertexShader: `varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: HAZE + `varying vec3 vW; varying vec2 vUv; void main(){
        float rib = smoothstep(0.42, 0.5, abs(fract(vUv.x * 96.0) - 0.5));
        vec3 c = mix(vec3(0.02, 0.02, 0.025), vec3(0.06, 0.06, 0.07), rib) * (0.7 + 0.6 * vUv.y);
        c += vec3(0.8, 0.8, 0.85) * (1.0 - smoothstep(0.0, 0.06, vUv.y)) * 0.4;
        gl_FragColor = vec4(inHaze(c, vW), 1.0); }`,
    }))));
  }

  // floodlights
  const lampPts = [];
  if (cent) {
    for (const [mx, mz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const base = new THREE.Vector3(mx * (A1 + 4), 0, mz * (B1 + 4));
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 62, 8), reg(new THREE.ShaderMaterial({
        uniforms: { ...U }, vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: HAZE + `varying vec3 vW; void main(){ gl_FragColor = vec4(inHaze(vec3(0.05, 0.05, 0.055), vW), 1.0); }`,
      })));
      mast.position.copy(base).setY(31);
      group.add(mast);
      for (let i = 0; i < 12; i++) lampPts.push([base.x - mx * (i % 4) * 1.6, 60 + Math.floor(i / 4) * 1.8, base.z - mz * (i % 4) * 1.2, 1]);
    }
  } else {
    for (let i = 0; i < 64; i++) { const th = (i / 64) * Math.PI * 2; const p = standPt(th, 1.0); lampPts.push([p.x * 0.88, Y1 + 9, p.z * 0.88, 1]); }
  }
  const lamps = buildFlareCores(lampPts, H, { size: cent ? 7 : 6 });
  group.add(lamps.mesh);
  const beamGeo = new THREE.ConeGeometry(1, 1, 32, 1, true); beamGeo.translate(0, -0.5, 0);
  const beamMat = reg(new THREE.ShaderMaterial({
    uniforms: { ...U, amt: { value: 1 } }, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vH; varying vec3 vW; void main(){ vH = -position.y; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + `uniform float amt, uTime; varying vec3 vN; varying vec3 vV; varying float vH; varying vec3 vW; void main(){
      float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.5);
      float n = 0.6 + 0.4 * fbm3(vW * 0.05 + vec3(0.0, uTime * 0.4, 0.0));
      float a = f * (1.0 - vH) * smoothstep(0.0, 0.1, vH) * n * 0.05 * amt;
      gl_FragColor = vec4(vec3(1.0, 0.92, 0.9) * a, 1.0); }`, ...ADD,
  }));
  const beamSrc = cent ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([mx, mz]) => new THREE.Vector3(mx * (A1 + 4), 61, mz * (B1 + 4))) : Array.from({ length: 16 }, (_, i) => { const p = standPt((i / 16) * Math.PI * 2 + 0.1, 1); return new THREE.Vector3(p.x * 0.88, Y1 + 9, p.z * 0.88); });
  beamSrc.forEach((top, i) => {
    for (let k = 0; k < (cent ? 3 : 1); k++) {
      const b = new THREE.Mesh(beamGeo, beamMat);
      const target = new THREE.Vector3(-top.x * 0.25 + (k - 1) * 18, 0, -top.z * 0.25 + (i % 2) * 10);
      const len = top.distanceTo(target);
      b.position.copy(top); b.scale.set(len * 0.2, len, len * 0.2);
      b.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), target.clone().sub(top).normalize());
      group.add(b);
    }
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), new THREE.ShaderMaterial({
    uniforms: { amt: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float amt; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(max(dot(normalize(vN), normalize(vV)), 0.0), 2.5); gl_FragColor = vec4(vec3(1.0, 0.5, 0.45) * f * 0.12 * amt, 1.0); }`, ...ADD,
  }));
  dome.scale.set(190, 120, 170); dome.position.y = 10;
  group.add(dome);

  // Torre de los Homenajes (Centenario)
  if (cent) {
    const tower = new THREE.Group();
    const tMat = reg(new THREE.ShaderMaterial({
      uniforms: { ...U },
      vertexShader: `varying vec3 vW; varying vec3 vN; varying vec3 vL; void main(){ vL = position; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: HAZE + `varying vec3 vW; varying vec3 vN; varying vec3 vL; void main(){
        float fins = 0.75 + 0.25 * step(0.5, fract((vL.x + vL.z) * 0.9));
        float flood = 0.5 + 1.2 * exp(-vW.y / 45.0);
        vec3 c = vec3(0.95, 0.93, 0.92) * flood * fins * (0.6 + 0.4 * abs(normalize(vN).x));
        c += vec3(0.9, 0.05, 0.05) * exp(-vW.y / 18.0) * 0.6;
        gl_FragColor = vec4(inHaze(c, vW), 1.0); }`,
    }));
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(9, 92, 7), tMat); shaft.position.y = 46; tower.add(shaft);
    const top = new THREE.Mesh(new THREE.BoxGeometry(11, 6, 9), tMat); top.position.y = 94; tower.add(top);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 4), tMat); crown.position.y = 101; tower.add(crown);
    tower.position.set(110, 0, 95);          // the Torre de los Homenajes rises beside the bowl
    group.add(tower);
  }

  // flare smoke + cores + confetti
  const emit = [];
  for (let k = 0; k < 18; k++) { const p = standPt(rand() * Math.PI * 2, 0.15 + rand() * 0.7); emit.push([p.x, p.y, p.z, k % 5 === 0 ? 1 : 0]); }
  const smoke = buildSmoke(emit, { count: 200, size: [6, 15], rise: 34, drift: 6, alpha: 0.2,
    colors: [new THREE.Color(1.0, 0.07, 0.06), new THREE.Color(0.9, 0.88, 0.88)] });
  group.add(smoke.mesh);
  const cores = buildFlareCores(emit.map((e) => [e[0], e[1] + 1.6, e[2], e[3]]), H);
  group.add(cores.mesh);
  const confetti = buildConfetti({ count: 6500, hazeGLSL: HAZE });
  confetti.mat.uniforms.sCenter = U.sCenter;
  group.add(confetti.mesh);

  return {
    group, standPt, A1, B1, Y1,
    update(t, camPos, { smokeAmt = 1, confAmt = 1, haze = 1 } = {}) {
      group.updateMatrixWorld();
      const local = camPos.clone();
      group.worldToLocal(local);     // crowd billboards & confetti work in the group frame
      U.uTime.value = t; U.camPos.value.copy(camPos); U.haze.value = haze;
      U.sCenter.value.setFromMatrixPosition(group.matrixWorld);
      for (const m of mats) { if (m.uniforms.uTime) m.uniforms.uTime.value = t; if (m.uniforms.camPos) m.uniforms.camPos.value.copy(camPos); if (m.uniforms.haze) m.uniforms.haze.value = haze; if (m.uniforms.sCenter) m.uniforms.sCenter.value.copy(U.sCenter.value); }
      crowd.update(t, camPos, local);
      flags.update(t, camPos);
      smoke.mat.uniforms.uTime.value = t; smoke.mat.uniforms.amt.value = smokeAmt;
      cores.mat.uniforms.uTime.value = t; lamps.mat.uniforms.uTime.value = t;
      const inBowl = 1 - THREE.MathUtils.smoothstep(Math.hypot(local.x, local.z * 1.15) + Math.max(0, local.y - 60) * 2, 120, 200);
      confetti.mat.uniforms.uTime.value = t; confetti.mat.uniforms.amt.value = confAmt * inBowl; confetti.mat.uniforms.camPos.value.copy(camPos); confetti.mat.uniforms.camLocal.value.copy(local);
    },
  };
}
