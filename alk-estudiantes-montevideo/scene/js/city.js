// La Plata at night: the square city with its 45° grid, diagonals and plazas,
// the cathedral on Plaza Moreno and the stadium glowing red by the Bosque, with
// supporters, flags and flares in the street. Units: metres, x = east, y = up,
// z = south, origin Plaza Moreno.
import * as THREE from 'three';
import { GLSL_NOISE, rng, clamp } from './util.js';
import { GLSL_CITYLIGHTS, ORIGIN, M_PER_DEG_LAT, M_PER_DEG_LON, BLOCK, HALF, toGrid, fromGrid } from './citylights.js';
import { buildStadiumKit } from './stadium.js';

const FOG = /* glsl */`
uniform vec3 fogColor; uniform float fogDensity;
vec3 applyFog(vec3 c, float dist, float h){
  float f = 1.0 - exp(-dist * fogDensity * mix(1.0, 0.35, clamp(h / 900.0, 0.0, 1.0)));
  return mix(c, fogColor, f);
}`;
const ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };

// stadium by the Bosque (grid coords -> world)
const [SX, SZ] = fromGrid(-300, -HALF - 330);
export const STADIUM_POS = new THREE.Vector3(SX, 0, SZ);

export async function buildCity(W, H, { tSA, tLights, meta }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, W / H, 1, 400000);
  const fogU = { fogColor: { value: new THREE.Color(0.02, 0.015, 0.018) }, fogDensity: { value: 0.00006 } };
  const reg = meta.region;
  const geoU = {
    tSA: { value: tSA }, tLights: { value: tLights },
    regB: { value: new THREE.Vector4(reg.lon0, reg.lon1, reg.lat0, reg.lat1) },
    landRange: { value: meta.landRange },
    origin: { value: new THREE.Vector2(ORIGIN.lon, ORIGIN.lat) },
    mPerDeg: { value: new THREE.Vector2(M_PER_DEG_LON, M_PER_DEG_LAT) },
  };
  const GEO = /* glsl */`
    uniform sampler2D tSA, tLights; uniform vec4 regB; uniform float landRange; uniform vec2 origin, mPerDeg;
    vec2 toLonLat(vec2 xz){ return vec2(origin.x + xz.x / mPerDeg.x, origin.y - xz.y / mPerDeg.y); }
    float landDist(vec2 ll){ vec2 ruv = vec2((ll.x - regB.x) / (regB.y - regB.x), (regB.w - ll.y) / (regB.w - regB.z)); return (texture2D(tSA, ruv).r - 0.5) * 2.0 * landRange; }
    float lightDensity(vec2 ll){ vec2 wuv = vec2((ll.x + 180.0) / 360.0, (90.0 - ll.y) / 180.0); float L = texture2D(tLights, wuv).r; return clamp(pow(L, 0.75) * 1.3, 0.0, 1.0); }
  `;

  // ---------------- sky: near-black with a red glow over the stadium ----------------
  const stadiumDir = new THREE.Vector3(SX, 0, SZ).normalize();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTime: { value: 0 }, sDir: { value: stadiumDir }, ...fogU },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_NOISE + /* glsl */`varying vec3 vDir; uniform float uTime; uniform vec3 fogColor, sDir; uniform float fogDensity;
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 c = mix(vec3(0.03, 0.025, 0.03), vec3(0.003, 0.003, 0.006), smoothstep(0.0, 0.5, h));
        float toS = max(dot(normalize(vec3(d.x, 0.0, d.z)), sDir), 0.0);
        c += vec3(0.16, 0.012, 0.01) * exp(-max(h, 0.0) * 9.0) * pow(toS, 6.0);
        vec2 cp = d.xz / max(h, 0.04) * 1.6;
        float cl = smoothstep(0.5, 0.85, fbm(cp + vec2(uTime * 0.01, 0.0)));
        c += vec3(0.05, 0.02, 0.02) * cl * smoothstep(0.02, 0.18, h) * (1.0 - smoothstep(0.3, 0.8, h));
        vec3 g = d * 300.0; float hs = hash13(floor(g));
        c += vec3(0.85, 0.85, 0.9) * step(0.998, hs) * (1.0 - smoothstep(0.0, 0.1, length(fract(g) - 0.5))) * smoothstep(0.15, 0.5, h) * 0.4;
        c = mix(fogColor, c, 1.0 - exp(-max(h, 0.0) * 16.0));
        if (h < 0.0) c = fogColor;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // ---------------- ground ----------------
  const groundMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBright: { value: 1 }, camPos: { value: new THREE.Vector3() }, sPos: { value: new THREE.Vector2(SX, SZ) }, ...fogU, ...geoU },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + GLSL_CITYLIGHTS + FOG + GEO + /* glsl */`
      uniform float uTime, uBright; uniform vec3 camPos; uniform vec2 sPos; varying vec3 vW;
      void main(){
        vec2 p = vW.xz;
        vec2 ll = toLonLat(p);
        float ld = landDist(ll) * 1000.0;
        vec2 fw = fwidth(p);
        float land = smoothstep(-40.0 - fw.x, 40.0 + fw.x, ld - 300.0);
        float dens = max(lightDensity(ll), 0.0);
        vec3 c = vec3(0.004, 0.004, 0.005);
        c += cityGround(p, fw, dens, uTime) * land;
        // red spill of the stadium lights on the surrounding streets
        float sd = length(p - sPos);
        c += vec3(0.5, 0.02, 0.015) * exp(-sd / 200.0) * 0.22 + vec3(0.4, 0.02, 0.01) * exp(-sd / 900.0) * 0.03;
        vec3 V = normalize(camPos - vW);
        float fres = 0.02 + 0.98 * pow(1.0 - max(V.y, 0.0), 5.0);
        vec3 water = vec3(0.003, 0.004, 0.008) + vec3(0.03, 0.03, 0.045) * fres;
        c = mix(water, c, land);
        c *= uBright;
        c = applyFog(c, length(camPos - vW), 0.0);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(240000, 240000).rotateX(-Math.PI / 2), groundMat));

  // ---------------- buildings on the 45° grid ----------------
  const rand = rng(19050404);
  const boxes = [];
  const addBlock = (u0, u1, v0, v1, hBase, hVar, towerChance) => {
    const W0 = u1 - u0, D0 = v1 - v0;
    for (let side = 0; side < 4; side++) {
      const along = side < 2 ? W0 : D0;
      const n = 2 + Math.floor(rand() * 3);
      let t0 = 0;
      for (let k = 0; k < n && t0 < along - 4; k++) {
        const len = Math.min(along - t0, (along / n) * (0.7 + rand() * 0.6));
        const depth = Math.min(12 + rand() * 16, (side < 2 ? D0 : W0) * 0.48);
        if (rand() < 0.08) { t0 += len; continue; }
        let h = hBase + Math.pow(rand(), 2.4) * hVar;
        if (rand() < towerChance) h = 55 + rand() * 45;
        const mid = t0 + len / 2;
        let u, v, su, sv;
        if (side === 0) { u = u0 + mid; v = v0 + depth / 2; su = len; sv = depth; }
        else if (side === 1) { u = u0 + mid; v = v1 - depth / 2; su = len; sv = depth; }
        else if (side === 2) { u = u0 + depth / 2; v = v0 + mid; su = depth; sv = len; }
        else { u = u1 - depth / 2; v = v0 + mid; su = depth; sv = len; }
        boxes.push([u, v, su - 1.2, sv - 1.2, h, rand()]);
        t0 += len;
      }
    }
  };
  const nB = Math.ceil(HALF / BLOCK) + 1;
  for (let bu = -nB; bu < nB; bu++) for (let bv = -nB; bv < nB; bv++) {
    let u0 = bu * BLOCK + 7, u1 = (bu + 1) * BLOCK - 7, v0 = bv * BLOCK + 7, v1 = (bv + 1) * BLOCK - 7;
    const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
    if (Math.max(Math.abs(cu), Math.abs(cv)) > HALF - 40) continue;
    // avenues every 6 blocks: wider street on that side
    const au = ((bu % 6) + 6) % 6, av = ((bv % 6) + 6) % 6;
    if (au === 0) u0 += 8; if (au === 5) u1 -= 8; if (av === 0) v0 += 8; if (av === 5) v1 -= 8;
    // plazas at avenue crossings
    const pu = Math.round(cu / 720) * 720, pv = Math.round(cv / 720) * 720;
    if (Math.max(Math.abs(cu - pu), Math.abs(cv - pv)) < 70) continue;
    // diagonals (X and rhombus) cut through the blocks
    const dX = Math.min(Math.abs(cu - cv), Math.abs(cu + cv)) * Math.SQRT1_2;
    const dR = Math.abs(Math.abs(cu) + Math.abs(cv) - HALF) * Math.SQRT1_2;
    if (dX < 62 || dR < 58) continue;
    // keep the stadium surroundings open
    const [wx, wz] = fromGrid(cu, cv);
    if (Math.hypot(wx - SX, wz - SZ) < 160) continue;
    const dc = Math.hypot(cu, cv);
    const hBase = 8 + 14 * Math.exp(-dc / 1500);
    const hVar = 18 + 40 * Math.exp(-dc / 1300);
    addBlock(u0, u1, v0, v1, hBase, hVar, 0.012 + 0.05 * Math.exp(-dc / 700));
  }
  const bGeo = new THREE.BoxGeometry(1, 1, 1); bGeo.translate(0, 0.5, 0);
  const seedAttr = new Float32Array(boxes.length);
  const bMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() }, uBright: { value: 1 }, sPos: { value: new THREE.Vector2(SX, SZ) }, ...fogU },
    vertexShader: /* glsl */`
      attribute float seed; varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vSeed; varying vec3 vSize;
      void main(){
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        vSize = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vL = position * vSize; vSeed = seed;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: GLSL_NOISE + FOG + /* glsl */`
      uniform float uTime, uBright; uniform vec3 camPos; uniform vec2 sPos;
      varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vSeed; varying vec3 vSize;
      void main(){
        vec3 n = normalize(vN);
        vec3 c;
        float hgt = vW.y;
        float redSpill = exp(-length(vW.xz - sPos) / 300.0);
        if (n.y > 0.5) {
          c = vec3(0.010, 0.010, 0.012) + vec3(0.02, 0.012, 0.008) * hash12(floor(vW.xz / 4.0) + vSeed * 91.0) * 0.6;
          c += vec3(0.12, 0.005, 0.005) * redSpill;
        } else {
          vec2 tdir = normalize(vec2(-n.z, n.x));
          vec2 f = vec2(dot(vW.xz, tdir), vW.y);
          vec2 g = f / vec2(3.6, 3.2);
          vec2 id = floor(g); vec2 uv = fract(g);
          vec2 fwg = fwidth(g);
          float win = smoothstep(0.12, 0.12 + fwg.x * 1.5, uv.x) * (1.0 - smoothstep(0.88 - fwg.x * 1.5, 0.88, uv.x)) *
                      smoothstep(0.25, 0.25 + fwg.y * 1.5, uv.y) * (1.0 - smoothstep(0.85 - fwg.y * 1.5, 0.85, uv.y));
          float hsh = hash12(id + vSeed * 137.0 + n.xz * 17.0);
          float floorLit = step(0.84, hash12(vec2(id.y, vSeed * 59.0)));
          float lit = step(0.64 - floorLit * 0.5, hsh);
          float tone = hash12(id * 1.7 + vSeed * 3.0);
          vec3 lc = tone < 0.6 ? vec3(1.0, 0.66, 0.36) : (tone < 0.88 ? vec3(1.0, 0.88, 0.72) : vec3(1.0, 0.25, 0.2));
          vec3 wcol = lc * (0.6 + 1.6 * hash12(id + 3.3)) * 1.2 * lit;
          float farK = smoothstep(0.45, 1.3, max(fwg.x, fwg.y));
          vec3 wall = vec3(0.006, 0.006, 0.008) + vec3(0.022, 0.012, 0.006) * exp(-hgt / 22.0);
          vec3 glass = vec3(0.008, 0.008, 0.012);
          c = mix(wall, mix(glass, wcol, lit), win);
          c = mix(c, wall + vec3(1.0, 0.78, 0.55) * 0.07, farK);
          c += vec3(0.3, 0.01, 0.008) * redSpill * (0.3 + 0.7 * max(dot(n.xz, normalize(sPos - vW.xz)), 0.0));
        }
        c *= uBright;
        c = applyFog(c, length(camPos - vW), hgt);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const bMesh = new THREE.InstancedMesh(bGeo, bMat, boxes.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 4);
  boxes.forEach((b, i) => {
    const [x, z] = fromGrid(b[0], b[1]);
    m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(b[2], b[4], b[3]));
    bMesh.setMatrixAt(i, m4); seedAttr[i] = b[5];
  });
  bGeo.setAttribute('seed', new THREE.InstancedBufferAttribute(seedAttr, 1));
  bMesh.frustumCulled = false;
  scene.add(bMesh);

  // ---------------- the cathedral on Plaza Moreno (floodlit neo-gothic) ----------------
  const cath = new THREE.Group();
  const cathMat = new THREE.ShaderMaterial({
    uniforms: { camPos: { value: new THREE.Vector3() }, ...fogU },
    vertexShader: `varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + FOG + `uniform vec3 camPos; varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 n = normalize(vN); float y = vW.y;
        float flood = 0.55 + 1.3 * exp(-y / 40.0);
        float side = 0.6 + 0.4 * abs(dot(n, normalize(vec3(0.6, 0.2, 0.8))));
        float arches = 0.75 + 0.25 * step(0.5, fract(vW.y / 7.0 + 0.5 * step(0.5, fract((vW.x + vW.z) / 6.0))));
        vec3 c = vec3(1.0, 0.72, 0.5) * flood * side * arches * 0.9;
        c = applyFog(c, length(camPos - vW), y);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const box = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cathMat); m.position.set(x, y + h / 2, z); cath.add(m); return m; };
  box(30, 32, 105, 0, 0, 0);                 // nave
  box(62, 26, 26, 0, 0, -8);                 // transept
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 18, 14, 4, 1, false, Math.PI / 4), cathMat);
  roof.scale.set(1, 1, 3.8); roof.position.set(0, 39, 0); cath.add(roof);
  for (const sx of [-11, 11]) {          // the two spires on the façade
    box(13, 70, 13, sx, 0, 48);
    const sp = new THREE.Mesh(new THREE.ConeGeometry(7.5, 46, 8), cathMat); sp.position.set(sx, 70 + 23, 48); cath.add(sp);
  }
  // façade faces the Bosque (north-east, along the grid axis)
  cath.rotation.y = -Math.PI / 4 + Math.PI;
  scene.add(cath);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { amt: { value: 1 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vP; uniform float amt; void main(){ float r = length(vP) * 2.0; gl_FragColor = vec4(vec3(1.0, 0.8, 0.6) * exp(-r * r * 9.0) * 0.8 * amt, 1.0); }`, ...ADD,
  }));
  plaza.scale.set(320, 1, 320); plaza.position.y = 0.6;
  scene.add(plaza);

  // ---------------- the stadium by the Bosque (packed, red & white) ----------------
  const kit = buildStadiumKit(H, { variant: 'uno', seed: 3 });
  kit.group.position.copy(STADIUM_POS);
  kit.group.rotation.y = -Math.PI / 4;
  scene.add(kit.group);
  const toS = new THREE.Vector3(SX, 0, SZ).normalize();
  const front = STADIUM_POS.clone().addScaledVector(toS, -190);

  // the yellow -> here red location marker on the ground (rings)
  const marker = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, amt: { value: 0 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`uniform float time, amt; varying vec2 vP;
      void main(){
        float r = length(vP);
        float rings = 0.0;
        for (int i = 0; i < 3; i++) { float ph = fract(time * 0.85 + float(i) / 3.0); rings += exp(-pow((r - 0.08 - ph * 0.9) / 0.012, 2.0)) * (1.0 - ph) * 1.4; }
        vec3 c = vec3(1.0, 0.06, 0.05) * (exp(-r * 9.0) * 1.2 + rings * 1.3) + vec3(1.0) * (1.0 - smoothstep(0.03, 0.05, r)) * 2.0;
        gl_FragColor = vec4(c * amt * (1.0 - smoothstep(0.85, 1.0, r)), 1.0);
      }`, ...ADD,
  }));
  marker.position.y = 2;
  scene.add(marker);

  const mats = [groundMat, bMat, cathMat];
  return {
    scene, camera, STADIUM_POS, front, toS, kit,
    update(t, s = {}) {
      camera.updateMatrixWorld();
      const cp = camera.position;
      for (const m of mats) if (m.uniforms.camPos) m.uniforms.camPos.value.copy(cp);
      groundMat.uniforms.uTime.value = t; bMat.uniforms.uTime.value = t; sky.material.uniforms.uTime.value = t;
      kit.update(t, cp, { smokeAmt: 1, confAmt: s.confetti ?? 1, haze: 1 });
      const alt = Math.max(cp.y, 1);
      camera.near = clamp(alt * 0.01, 0.5, 2000);
      camera.far = Math.max(60000, alt * 30);
      camera.updateProjectionMatrix();
      fogU.fogDensity.value = 0.00006 * Math.max(0.05, 1 - alt / 20000);
      plaza.material.uniforms.amt.value = clamp(1.4 - alt / 2500, 0, 1);
      marker.material.uniforms.time.value = t;
      marker.material.uniforms.amt.value = s.marker ?? 0;
      const ms = Math.max(120, alt * 0.09);
      marker.scale.set(ms, 1, ms);
    },
  };
}
