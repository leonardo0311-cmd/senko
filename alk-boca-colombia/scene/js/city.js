// Buenos Aires at night: Av. 9 de Julio, the Obelisco, Río de la Plata.
// Units: metres. x = east, y = up, z = south. Origin: the Obelisco.
import * as THREE from 'three';
import { GLSL_NOISE, rng, clamp } from './util.js';
import { GLSL_CITYLIGHTS, OBELISCO, M_PER_DEG_LAT, M_PER_DEG_LON } from './citylights.js';

const FOG = /* glsl */`
uniform vec3 fogColor; uniform float fogDensity;
vec3 applyFog(vec3 c, float dist, float h){
  float f = 1.0 - exp(-dist * fogDensity * mix(1.0, 0.35, clamp(h / 900.0, 0.0, 1.0)));
  return mix(c, fogColor, f);
}`;

export async function buildCity(W, H, { tSA, tLights, meta }) {
  // NOTE: buildings are placed on 125 m blocks so they line up with the street lights
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, W / H, 2, 400000);
  const fogU = { fogColor: { value: new THREE.Color(0.026, 0.032, 0.072) }, fogDensity: { value: 0.00006 } };
  const reg = meta.region;
  const geoU = {
    tSA: { value: tSA }, tLights: { value: tLights },
    regB: { value: new THREE.Vector4(reg.lon0, reg.lon1, reg.lat0, reg.lat1) },
    landRange: { value: meta.landRange },
    origin: { value: new THREE.Vector2(OBELISCO.lon, OBELISCO.lat) },
    mPerDeg: { value: new THREE.Vector2(M_PER_DEG_LON, M_PER_DEG_LAT) },
  };
  const GEO = /* glsl */`
    uniform sampler2D tSA, tLights; uniform vec4 regB; uniform float landRange; uniform vec2 origin, mPerDeg;
    vec2 toLonLat(vec2 xz){ return vec2(origin.x + xz.x / mPerDeg.x, origin.y - xz.y / mPerDeg.y); }
    float landDist(vec2 ll){ vec2 ruv = vec2((ll.x - regB.x) / (regB.y - regB.x), (regB.w - ll.y) / (regB.w - regB.z)); return (texture2D(tSA, ruv).r - 0.5) * 2.0 * landRange; }
    float lightDensity(vec2 ll){ vec2 wuv = vec2((ll.x + 180.0) / 360.0, (90.0 - ll.y) / 180.0); float L = texture2D(tLights, wuv).r; return clamp(pow(L, 0.75) * 1.25, 0.0, 1.0); }
  `;

  // ---------------- sky ----------------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTime: { value: 0 }, ...fogU },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_NOISE + /* glsl */`varying vec3 vDir; uniform float uTime; uniform vec3 fogColor; uniform float fogDensity;
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 zen = vec3(0.0015, 0.0045, 0.016), mid = vec3(0.006, 0.020, 0.075), hor = vec3(0.035, 0.050, 0.11);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.12, h));
        c = mix(c, zen, smoothstep(0.1, 0.65, h));
        // city glow on the horizon (light pollution), warmer toward the west (land)
        float west = 1.0 - smoothstep(-0.9, 0.2, d.x);
        c += vec3(0.10, 0.045, 0.015) * exp(-max(h, 0.0) * 22.0) * (0.35 + 0.65 * west);
        // last light of dusk, far north-west
        c += vec3(0.03, 0.05, 0.12) * exp(-max(h, 0.0) * 6.0) * smoothstep(-0.2, 0.9, -d.z);
        // thin high clouds catching the city glow
        vec2 cp = d.xz / max(h, 0.04) * 1.6;
        float cl = smoothstep(0.52, 0.85, fbm(cp + vec2(uTime * 0.01, 0.0)));
        c += vec3(0.06, 0.035, 0.03) * cl * smoothstep(0.02, 0.18, h) * (1.0 - smoothstep(0.3, 0.8, h));
        // a few stars
        vec3 g = d * 300.0; float hs = hash13(floor(g));
        c += vec3(0.8, 0.85, 1.0) * step(0.9975, hs) * (1.0 - smoothstep(0.0, 0.1, length(fract(g) - 0.5))) * smoothstep(0.15, 0.5, h) * 0.5;
        c = mix(fogColor, c, 1.0 - exp(-max(h, 0.0) * 16.0));
        if (h < 0.0) c = fogColor;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  scene.add(sky);

  // ---------------- ground: street lights + river ----------------
  const groundMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBright: { value: 1 }, camPos: { value: new THREE.Vector3() }, ...fogU, ...geoU },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + GLSL_CITYLIGHTS + FOG + GEO + /* glsl */`
      uniform float uTime, uBright; uniform vec3 camPos; varying vec3 vW;
      void main(){
        vec2 p = vW.xz;
        vec2 ll = toLonLat(p);
        float ld = landDist(ll) * 1000.0; // metres
        vec2 fw = fwidth(p);
        float land = smoothstep(-40.0 - fw.x, 40.0 + fw.x, ld - 380.0);
        float dens = lightDensity(ll);
        vec3 c = vec3(0.004, 0.006, 0.012);           // asphalt / roofs
        c += cityGround(p, fw, dens, uTime) * land;
        // river: dark water, sky reflection, shimmering reflections of the shore lights
        vec3 V = normalize(camPos - vW);
        float fres = 0.02 + 0.98 * pow(1.0 - max(V.y, 0.0), 5.0);
        float ripple = vnoise(vec2(p.x * 0.02, p.y * 0.006 + uTime * 0.3)) * vnoise(p * 0.05 - uTime * 0.2);
        vec3 water = vec3(0.004, 0.012, 0.035) + vec3(0.03, 0.05, 0.12) * fres * 0.8;
        float shore = exp(-max(-ld + 380.0, 0.0) / 450.0);
        water += vec3(1.0, 0.55, 0.2) * shore * ripple * 0.9 * fres;
        c = mix(water, c, land);
        c *= uBright;
        c = applyFog(c, length(camPos - vW), 0.0);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240000, 240000, 1, 1).rotateX(-Math.PI / 2), groundMat);
  scene.add(ground);

  // ---------------- buildings ----------------
  // land test on the CPU (small grey-scale crop of the same SDF)
  const bl = meta.baLand;
  const blBmp = await createImageBitmap(await (await fetch('../data/ba_land.png')).blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const blCan = new OffscreenCanvas(bl.w, bl.h);
  const blCtx = blCan.getContext('2d', { willReadFrequently: true });
  blCtx.drawImage(blBmp, 0, 0);
  const blData = blCtx.getImageData(0, 0, bl.w, bl.h).data;
  const landDistCPU = (x, z) => {
    const lon = OBELISCO.lon + x / M_PER_DEG_LON, lat = OBELISCO.lat - z / M_PER_DEG_LAT;
    const fx = clamp((lon - bl.lon0) / bl.dpp - 0.5, 0, bl.w - 1.001), fy = clamp((bl.lat1 - lat) / bl.dpp - 0.5, 0, bl.h - 1.001);
    const ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
    const g = (i, j) => blData[((iy + j) * bl.w + (ix + i)) * 4];
    const v = (g(0, 0) * (1 - ax) + g(1, 0) * ax) * (1 - ay) + (g(0, 1) * (1 - ax) + g(1, 1) * ax) * ay;
    return (v / 255 - 0.5) * 2 * meta.landRange * 1000;
  };

  const rand = rng(20261116);
  const boxes = [];
  const B = 125; // block period (streets on multiples of 125 m)
  // perimeter buildings of a BA "manzana" with an inner courtyard
  const addBlock = (x0, x1, z0, z1, hBase, hVar, towerChance) => {
    const W0 = x1 - x0, D0 = z1 - z0;
    for (let side = 0; side < 4; side++) {
      const along = side < 2 ? W0 : D0;
      const n = 2 + Math.floor(rand() * 3);
      let t0 = 0;
      for (let k = 0; k < n && t0 < along - 4; k++) {
        const len = Math.min(along - t0, (along / n) * (0.7 + rand() * 0.6));
        const depth = Math.min(14 + rand() * 18, (side < 2 ? D0 : W0) * 0.48);
        if (rand() < 0.07) { t0 += len; continue; }
        let h = hBase + Math.pow(rand(), 2.2) * hVar;
        if (rand() < towerChance) h = 85 + rand() * 105;
        const mid = t0 + len / 2;
        let x, z, sx, sz;
        if (side === 0) { x = x0 + mid; z = z0 + depth / 2; sx = len; sz = depth; }
        else if (side === 1) { x = x0 + mid; z = z1 - depth / 2; sx = len; sz = depth; }
        else if (side === 2) { x = x0 + depth / 2; z = z0 + mid; sx = depth; sz = len; }
        else { x = x1 - depth / 2; z = z0 + mid; sx = depth; sz = len; }
        boxes.push([x, z, sx - 1.2, sz - 1.2, h, rand()]);
        t0 += len;
      }
    }
  };
  const zones = [
    { x0: -3400, x1: 2800, z0: -3800, z1: 4800 },   // centre / 9 de Julio corridor
    { x0: -7200, x1: -1500, z0: -8400, z1: -3800 },  // Palermo / Aeroparque
  ];
  for (const zn of zones) {
    for (let bx = Math.floor(zn.x0 / B); bx < Math.ceil(zn.x1 / B); bx++) {
      for (let bz = Math.floor(zn.z0 / B); bz < Math.ceil(zn.z1 / B); bz++) {
        let x0 = bx * B + 8, x1 = (bx + 1) * B - 8, z0 = bz * B + 8, z1 = (bz + 1) * B - 8;
        let cx = (x0 + x1) / 2; const cz = (z0 + z1) / 2;
        // Av. 9 de Julio: 140 m wide, centred on x = 0
        if (x1 > -74 && x0 < 74) { if (cx < 0) x1 = -74; else x0 = 74; }
        if (x1 - x0 < 28) continue;
        cx = (x0 + x1) / 2;
        if (Math.hypot(cx, cz) < 150) continue;                 // Plaza de la República
        if (landDistCPU(cx, cz) < 380) continue;                // keep off the river
        const dc = Math.hypot(cx - 900, cz - 200);              // Microcentro
        const pm = Math.hypot(cx - 1900, cz + 300);             // Puerto Madero towers
        const hBase = 12 + 24 * Math.exp(-dc / 1800);
        const hVar = 22 + 70 * Math.exp(-dc / 1500);
        const tower = 0.015 + 0.3 * Math.exp(-pm / 450) + 0.05 * Math.exp(-dc / 900);
        addBlock(x0, x1, z0, z1, hBase, hVar, tower);
      }
    }
  }
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  bGeo.translate(0, 0.5, 0);
  const seedAttr = new Float32Array(boxes.length);
  const bMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() }, uBright: { value: 1 }, ...fogU },
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
      uniform float uTime, uBright; uniform vec3 camPos;
      varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vSeed; varying vec3 vSize;
      void main(){
        vec3 n = normalize(vN);
        vec3 c;
        float hgt = vW.y;
        if (n.y > 0.5) {
          // roof
          c = vec3(0.010, 0.012, 0.018) + vec3(0.02, 0.012, 0.006) * hash12(floor(vW.xz / 4.0) + vSeed * 91.0) * 0.6;
        } else {
          vec2 f = abs(n.x) > 0.5 ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
          vec2 cell = vec2(3.6, 3.2);
          vec2 g = f / cell;
          vec2 id = floor(g); vec2 uv = fract(g);
          vec2 fwg = fwidth(g);
          float win = smoothstep(0.12, 0.12 + fwg.x * 1.5, uv.x) * (1.0 - smoothstep(0.88 - fwg.x * 1.5, 0.88, uv.x)) *
                      smoothstep(0.25, 0.25 + fwg.y * 1.5, uv.y) * (1.0 - smoothstep(0.85 - fwg.y * 1.5, 0.85, uv.y));
          float hsh = hash12(id + vSeed * 137.0 + n.xz * 17.0);
          float floorLit = step(0.82, hash12(vec2(id.y, vSeed * 59.0)));   // whole office floors
          float lit = step(0.62 - floorLit * 0.5, hsh);
          float tone = hash12(id * 1.7 + vSeed * 3.0);
          vec3 lc = tone < 0.55 ? vec3(1.0, 0.66, 0.32) : (tone < 0.85 ? vec3(1.0, 0.86, 0.66) : vec3(0.62, 0.78, 1.0));
          float bri = (0.6 + 1.6 * hash12(id + 3.3)) * 1.25;
          vec3 wcol = lc * bri * lit;
          // far away: average the pattern instead of aliasing
          // far away / grazing: blend towards the statistical average instead of aliasing
          float farK = smoothstep(0.45, 1.3, max(fwg.x, fwg.y));
          vec3 wall = vec3(0.005, 0.0065, 0.011) + vec3(0.022, 0.011, 0.004) * exp(-hgt / 22.0); // street glow on the facade base
          vec3 glass = vec3(0.004, 0.009, 0.026);
          c = mix(wall, mix(glass, wcol, lit), win);
          vec3 avg = vec3(1.0, 0.78, 0.52) * 0.075;
          c = mix(c, wall + avg, farK);
          // top floors dimmer, crown light on some towers
          float crown = step(0.86, fract(vSeed * 13.7)) * step(70.0, vSize.y) * smoothstep(vSize.y - 2.2, vSize.y - 1.6, vL.y) * (1.0 - smoothstep(vSize.y - 1.0, vSize.y - 0.4, vL.y));
          c += vec3(0.7, 0.85, 1.0) * crown * 1.2;
        }
        c *= uBright;
        c = applyFog(c, length(camPos - vW), hgt);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const bMesh = new THREE.InstancedMesh(bGeo, bMat, boxes.length);
  const m4 = new THREE.Matrix4();
  boxes.forEach((b, i) => {
    m4.makeScale(b[2], b[4], b[3]); m4.setPosition(b[0], 0, b[1]);
    bMesh.setMatrixAt(i, m4); seedAttr[i] = b[5];
  });
  bGeo.setAttribute('seed', new THREE.InstancedBufferAttribute(seedAttr, 1));
  bMesh.frustumCulled = false;
  scene.add(bMesh);

  // aviation lights on the tallest buildings
  const tall = boxes.filter((b) => b[4] > 95);
  const avPos = new Float32Array(tall.length * 3), avPh = new Float32Array(tall.length);
  tall.forEach((b, i) => { avPos.set([b[0], b[4] + 2, b[1]], i * 3); avPh[i] = b[5] * 6.28; });
  const avGeo = new THREE.BufferGeometry();
  avGeo.setAttribute('position', new THREE.BufferAttribute(avPos, 3));
  avGeo.setAttribute('ph', new THREE.BufferAttribute(avPh, 1));
  const avMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, scale: { value: H } },
    vertexShader: `attribute float ph; uniform float uTime, scale; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
        vA = 0.25 + 0.75 * step(0.55, fract(uTime * 0.9 + ph)); gl_PointSize = clamp(scale * 6.0 / -mv.z, 2.0, 14.0); }`,
    fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); float a = exp(-r * r * 30.0); gl_FragColor = vec4(vec3(1.0, 0.05, 0.02) * a * vA * 6.0, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  });
  scene.add(new THREE.Points(avGeo, avMat));

  // ---------------- the Obelisco ----------------
  const obGeo = new THREE.BufferGeometry();
  {
    const b = 3.4, tp = 1.75, hS = 63.5, hT = 67.5;
    const P = [[-b, 0, -b], [b, 0, -b], [b, 0, b], [-b, 0, b], [-tp, hS, -tp], [tp, hS, -tp], [tp, hS, tp], [-tp, hS, tp], [0, hT, 0]];
    const faces = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const pos = [];
    for (const f of faces) { const [a, bb, c, d] = f.map((i) => P[i]); pos.push(...a, ...bb, ...c, ...a, ...c, ...d); }
    for (let k = 0; k < 4; k++) { const a = P[4 + k], bb = P[4 + ((k + 1) % 4)]; pos.push(...a, ...bb, ...P[8]); }
    obGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    obGeo.computeVertexNormals();
  }
  const obMat = new THREE.ShaderMaterial({
    uniforms: { camPos: { value: new THREE.Vector3() }, ...fogU },
    vertexShader: `varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: FOG + `uniform vec3 camPos; varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 n = normalize(vN); float y = vW.y;
        float flood = 0.9 + 1.6 * exp(-y / 33.0);
        float side = 0.75 + 0.25 * abs(dot(n, normalize(vec3(0.6, 0.0, 0.8))));
        vec3 c = vec3(1.0, 0.97, 0.92) * flood * side * 1.6;
        c += vec3(1.0, 0.95, 0.85) * smoothstep(93.0, 101.0, y) * 2.0;
        c = applyFog(c, length(camPos - vW), y);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const obelisco = new THREE.Mesh(obGeo, obMat);
  obelisco.scale.set(1.5, 1.5, 1.5); // a touch of artistic licence so it reads from the air
  scene.add(obelisco);
  // plaza ring of lights + glow pool at its base
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { amt: { value: 1 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vP; uniform float amt;
      void main(){ float r = length(vP) * 2.0; float ring = 0.0; float pool = exp(-r * r * 14.0);
        gl_FragColor = vec4((vec3(1.0, 0.85, 0.6) * ring * 2.0 + vec3(1.0, 0.95, 0.85) * pool * 0.9) * amt, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  }));
  plaza.scale.set(260, 1, 260); plaza.position.y = 0.6;
  scene.add(plaza);

  // ---------------- yellow location marker on the ground ----------------
  const marker = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, amt: { value: 0 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`uniform float time, amt; varying vec2 vP;
      void main(){
        float r = length(vP);
        float rings = 0.0;
        for (int i = 0; i < 3; i++) { float ph = fract(time * 0.85 + float(i) / 3.0); rings += exp(-pow((r - 0.08 - ph * 0.9) / 0.012, 2.0)) * (1.0 - ph) * 1.4; }
        vec3 c = vec3(1.0, 0.78, 0.0) * (exp(-r * 9.0) * 1.2 + rings * 1.3);
        gl_FragColor = vec4(c * amt * (1.0 - smoothstep(0.85, 1.0, r)), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  }));
  marker.position.y = 2;
  scene.add(marker);

  // lights for the airplane when it flies over the city
  const hemi = new THREE.HemisphereLight(0x6f8fd6, 0x3a2410, 0.9);
  const moon = new THREE.DirectionalLight(0xbfd2ff, 1.4);
  moon.position.set(-3000, 6000, -2000);
  scene.add(hemi, moon);

  const planeHolder = new THREE.Group();
  scene.add(planeHolder);

  return {
    scene, camera, planeHolder, groundMat, landDistCPU,
    update(t, s = {}) {
      camera.updateMatrixWorld();
      const cp = camera.position;
      for (const m of [groundMat, bMat, obMat]) if (m.uniforms.camPos) m.uniforms.camPos.value.copy(cp);
      groundMat.uniforms.uTime.value = t; bMat.uniforms.uTime.value = t; avMat.uniforms.uTime.value = t;
      sky.material.uniforms.uTime.value = t;
      const alt = Math.max(cp.y, 1);
      camera.near = clamp(alt * 0.01, 1, 2000);
      camera.far = Math.max(60000, alt * 30);
      camera.updateProjectionMatrix();
      // the haze thins out as we climb so the map read is clean
      fogU.fogDensity.value = 0.00006 * Math.max(0.05, 1 - alt / 20000);
      plaza.material.uniforms.amt.value = clamp(1.4 - alt / 2500, 0, 1);
      marker.material.uniforms.time.value = t;
      marker.material.uniforms.amt.value = s.marker ?? 0;
      const ms = Math.max(120, alt * 0.09);
      marker.scale.set(ms, 1, ms);
    },
  };
}
