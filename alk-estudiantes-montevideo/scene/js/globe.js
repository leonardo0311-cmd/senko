// 3D globe (dark, Estudiantes red & white styling): SDF coastlines/borders
// (Natural Earth, ARG POV), relief, city lights, routes and markers.
import * as THREE from 'three';
import { R, lonLatToVec, enu } from './geo.js';
import { loadDataTexture, loadJSON } from './assets.js';
import { GLSL_NOISE, clamp } from './util.js';
import { GLSL_CITYLIGHTS, ORIGIN, M_PER_DEG_LAT, M_PER_DEG_LON } from './citylights.js';

export const BA = { lon: -58.3816, lat: -34.6037 };          // Buenos Aires
export const BA_PORT = { lon: -58.3665, lat: -34.5925 };     // Buquebus terminal, Dársena Norte
export const LP = { lon: -57.9545, lat: -34.9214 };          // La Plata
export const MVD = { lon: -56.1882, lat: -34.9058 };         // Montevideo
export const MVD_PORT = { lon: -56.2125, lat: -34.9035 };
// bus: La Plata -> Buenos Aires -> Zárate-Brazo Largo -> Gualeguaychú -> Puente San Martín -> Fray Bentos -> Mercedes -> Montevideo
export const BUS_ROUTE = [
  [-57.9545, -34.9214], [-58.18, -34.80], [-58.38, -34.62], [-58.62, -34.45], [-58.85, -34.24], [-59.03, -34.10],
  [-58.93, -33.95], [-58.78, -33.55], [-58.62, -33.20], [-58.50, -33.03], [-58.36, -33.07], [-58.24, -33.10],
  [-58.15, -33.12], [-58.03, -33.25], [-57.72, -33.55], [-57.38, -33.87], [-57.36, -34.18], [-57.10, -34.45],
  [-56.62, -34.63], [-56.38, -34.80], [-56.1882, -34.9058],
];
// ferry: Buenos Aires (Dársena Norte) -> Montevideo across the Río de la Plata
export const SEA_ROUTE = [
  [-58.3665, -34.5925], [-58.30, -34.60], [-58.10, -34.66], [-57.75, -34.74], [-57.35, -34.83], [-56.95, -34.92],
  [-56.60, -34.95], [-56.35, -34.93], [-56.2125, -34.9035],
];

export async function buildGlobe(W, H) {
  const meta = await loadJSON('../data/geo.json');
  const [tSA, tWorld, tRelief, tLights] = await Promise.all([
    loadDataTexture('../data/sa_sdf.png'), loadDataTexture('../data/world_sdf.png'),
    loadDataTexture('../data/sa_relief.png'), loadDataTexture('../data/world_lights.png'),
  ]);
  tWorld.wrapS = THREE.RepeatWrapping; tLights.wrapS = THREE.RepeatWrapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 1, 60000);

  const bg = new THREE.Mesh(new THREE.SphereGeometry(50000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_NOISE + `varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float n = fbm3(d * 3.0);
        vec3 c = mix(vec3(0.004, 0.004, 0.005), vec3(0.016, 0.006, 0.007), n * n * 1.3);
        vec3 g = d * 420.0; vec3 i = floor(g); float h = hash13(i);
        vec3 f = fract(g) - 0.5; float s = (1.0 - smoothstep(0.0, 0.08, length(f))) * step(0.986, h) * (0.4 + 2.0 * fract(h * 91.7));
        c += vec3(0.9, 0.9, 0.95) * s * 0.3;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  bg.renderOrder = -10; bg.frustumCulled = false;
  scene.add(bg);

  const reg = meta.region, rel = meta.relief;
  const globeMat = new THREE.ShaderMaterial({
    uniforms: {
      tSA: { value: tSA }, tWorld: { value: tWorld }, tRelief: { value: tRelief }, tLights: { value: tLights },
      regB: { value: new THREE.Vector4(reg.lon0, reg.lon1, reg.lat0, reg.lat1) },
      relB: { value: new THREE.Vector4(rel.lon0, rel.lat0, rel.lon1, rel.lat1) },
      relPx: { value: new THREE.Vector2(1 / tRelief.image.width, 1 / tRelief.image.height) },
      landRange: { value: meta.landRange }, borderRange: { value: meta.borderRange },
      countryRange: { value: meta.countryRange }, worldRange: { value: meta.worldLandRange },
      uArg: { value: 0 }, uUry: { value: 0 }, uTime: { value: 0 }, uLights: { value: 1 }, uGrid: { value: 1 },
      uCoast: { value: 1 }, uBorders: { value: 1 }, uBright: { value: 1 }, uCity: { value: 0 },
      lpO: { value: new THREE.Vector2(ORIGIN.lon, ORIGIN.lat) }, mPerDeg: { value: new THREE.Vector2(M_PER_DEG_LON, M_PER_DEG_LAT) },
      camPosW: { value: new THREE.Vector3() },
    },
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(position); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + GLSL_CITYLIGHTS + /* glsl */`
      uniform float uCity; uniform vec2 lpO, mPerDeg;
      uniform sampler2D tSA, tWorld, tRelief, tLights;
      uniform vec4 regB, relB; uniform vec2 relPx;
      uniform float landRange, borderRange, countryRange, worldRange;
      uniform float uArg, uUry, uTime, uLights, uGrid, uCoast, uBorders, uBright;
      uniform vec3 camPosW;
      varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 n = normalize(vN);
        float lon = degrees(atan(n.x, n.z)), lat = degrees(asin(clamp(n.y, -1.0, 1.0)));
        vec2 ruv = vec2((lon - regB.x) / (regB.y - regB.x), (regB.w - lat) / (regB.w - regB.z));
        float edgeW = smoothstep(0.0, 0.025, min(min(ruv.x, 1.0 - ruv.x), min(ruv.y, 1.0 - ruv.y)));
        vec2 wuv = vec2((lon + 180.0) / 360.0, (90.0 - lat) / 180.0);
        float dW = (texture2D(tWorld, wuv).r - 0.5) * 2.0 * worldRange;
        vec4 s = texture2D(tSA, clamp(ruv, 0.0, 1.0));
        float landD = mix(dW, (s.r - 0.5) * 2.0 * landRange, edgeW);
        float borderD = mix(1e4, s.g * borderRange, edgeW);
        float argD = mix(-1e4, (s.b - 0.5) * 2.0 * countryRange, edgeW);
        float uryD = mix(-1e4, (s.a - 0.5) * 2.0 * countryRange, edgeW);
        float aa = max(fwidth(landD), 0.02);
        float landM = smoothstep(-aa, aa, landD);

        vec2 ruv2 = vec2((lon - relB.x) / (relB.z - relB.x), (relB.w - lat) / (relB.w - relB.y));
        float inRel = step(0.0, ruv2.x) * step(ruv2.x, 1.0) * step(0.0, ruv2.y) * step(ruv2.y, 1.0);
        float hC = texture2D(tRelief, ruv2).r * inRel;
        float hE = texture2D(tRelief, ruv2 + vec2(relPx.x, 0.0)).r, hWw = texture2D(tRelief, ruv2 - vec2(relPx.x, 0.0)).r;
        float hN = texture2D(tRelief, ruv2 - vec2(0.0, relPx.y)).r, hS = texture2D(tRelief, ruv2 + vec2(0.0, relPx.y)).r;
        vec3 nl = normalize(vec3(-(hE - hWw) * 9.0 * inRel, -(hN - hS) * 9.0 * inRel, 1.0));
        float shade = clamp(dot(nl, normalize(vec3(-0.55, 0.6, 0.55))), 0.0, 1.0);
        float micro = fbm(vec2(lon, lat) * 6.0) * 0.5 + fbm(vec2(lon, lat) * 40.0) * 0.5;

        float shelf = exp(-max(-landD, 0.0) / 140.0);
        vec3 ocean = mix(vec3(0.0022, 0.0025, 0.0032), vec3(0.006, 0.0068, 0.0088), shelf);
        ocean *= 0.85 + 0.3 * fbm(vec2(lon, lat) * 1.5);
        float gl1 = abs(fract(lon / 5.0 + 0.5) - 0.5) * 5.0, gl2 = abs(fract(lat / 5.0 + 0.5) - 0.5) * 5.0;
        float grid = max(1.0 - smoothstep(0.0, fwidth(lon) * 0.9, gl1), 1.0 - smoothstep(0.0, fwidth(lat) * 0.9, gl2));
        ocean += vec3(0.03, 0.03, 0.035) * grid * uGrid * (1.0 - landM) * 0.5;

        vec3 land = vec3(0.03, 0.029, 0.033) * (0.5 + 1.1 * shade) * (0.85 + 0.3 * micro);
        land += vec3(0.03, 0.03, 0.035) * hC * hC * 1.4;
        vec3 col = mix(ocean, land, landM);

        float coastLine = exp(-pow(landD / (aa * 1.3 + 0.08), 2.0));
        col += vec3(0.85, 0.86, 0.9) * coastLine * 1.2 * uCoast;
        col += vec3(0.1, 0.1, 0.12) * exp(-max(-landD, 0.0) / 18.0) * (1.0 - landM) * 0.35 * uCoast;

        float bAA = max(fwidth(borderD), 0.02);
        float bLine = 1.0 - smoothstep(bAA * 0.4, bAA * 1.6 + 0.15, borderD);
        col += vec3(0.5, 0.5, 0.55) * bLine * 0.28 * landM * uBorders;

        float cAA = max(fwidth(argD), 0.02);
        float argM = smoothstep(-cAA, cAA, argD);
        col += vec3(0.02, 0.02, 0.024) * argM * uArg;
        col += vec3(0.9, 0.9, 0.95) * exp(-pow(argD / (cAA * 1.4 + 0.1), 2.0)) * uArg * 0.55;

        float kAA = max(fwidth(uryD), 0.02);
        float uryM = smoothstep(-kAA, kAA, uryD);
        vec3 red = vec3(0.89, 0.024, 0.075);
        col = mix(col, col * 0.5 + red * (0.12 + 0.07 * (0.5 + 0.5 * sin(uTime * 5.0))) * (0.6 + 0.8 * shade), uryM * uUry);
        col += red * 3.5 * exp(-pow(uryD / (kAA * 1.5 + 0.12), 2.0)) * uUry;
        col += red * 0.5 * exp(-abs(uryD) / 40.0) * uUry * (1.0 - uryM);

        float L = texture2D(tLights, wuv).r;
        float sparkle = 1.0;
        col += vec3(1.0, 0.72, 0.5) * pow(L, 1.6) * 2.0 * sparkle * uLights * landM * (1.0 - uCity * 0.0);
        // street-level detail of La Plata (same function as the city scene) for a seamless zoom
        if (uCity > 0.001) {
          vec2 pLP = vec2((lon - lpO.x) * mPerDeg.x, -(lat - lpO.y) * mPerDeg.y);
          float nearLP = 1.0 - smoothstep(22000.0, 38000.0, length(pLP));
          if (nearLP > 0.0) {
            float dens = clamp(pow(L, 0.75) * 1.3, 0.0, 1.0);
            vec3 cg = cityGround(pLP, fwidth(pLP), dens, uTime);
            col = mix(col, land * 0.3 + cg, nearLP * uCity * landM);
          }
        }

        vec3 V = normalize(camPosW - vW);
        float fres = pow(1.0 - clamp(dot(V, n), 0.0, 1.0), 3.0);
        col += vec3(0.25, 0.22, 0.24) * fres * 0.35;
        gl_FragColor = vec4(col * uBright, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(R, 512, 256), globeMat));

  const atmoMat = new THREE.ShaderMaterial({
    uniforms: { camPosW: { value: new THREE.Vector3() }, uAlpha: { value: 1 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 camPosW; uniform float uAlpha; varying vec3 vW;
      void main(){
        vec3 d = normalize(vW - camPosW);
        float tc = -dot(camPosW, d);
        float dist = length(camPosW + d * tc);
        float Rr = ${R.toFixed(1)};
        float g = dist > Rr ? exp(-(dist - Rr) / 70.0) + 0.35 * exp(-(dist - Rr) / 260.0) : exp(-(Rr - dist) / 380.0) * 0.55;
        vec3 c = mix(vec3(0.55, 0.2, 0.22), vec3(0.85, 0.82, 0.86), clamp(g, 0.0, 1.0)) * g;
        gl_FragColor = vec4(c * 0.45 * uAlpha, 1.0);
      }`,
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 256, 128), atmoMat));

  // ---------- routes ----------
  const curveFrom = (ll, lift, N = 400) => {
    const pts = ll.map(([lon, lat]) => lonLatToVec(lon, lat, 0));
    const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const out = [];
    for (let i = 0; i <= N; i++) { const u = i / N; const p = c.getPointAt(u).normalize().multiplyScalar(R + lift(u)); out.push(p); }
    return out;
  };
  const sample = (pts) => (u) => { const f = clamp(u) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)); return pts[i].clone().lerp(pts[i + 1], f - i); };
  const arcPts = curveFrom([[BA.lon, BA.lat], [MVD.lon, MVD.lat]], (u) => 1.5 + 34 * Math.sin(Math.PI * u), 300);
  const seaPts = curveFrom(SEA_ROUTE, () => 3.0, 400);
  const busPts = curveFrom(BUS_ROUTE, () => 3.0, 600);
  const arc = makeRibbon(arcPts, W, H, { width: 11, color: new THREE.Color(1.0, 0.05, 0.06), core: new THREE.Color(1, 1, 1) });
  const sea = makeRibbon(seaPts, W, H, { width: 13, color: new THREE.Color(0.95, 0.95, 1.0), core: new THREE.Color(1, 1, 1), dashed: true });
  const bus = makeRibbon(busPts, W, H, { width: 13, color: new THREE.Color(1.0, 0.05, 0.06), core: new THREE.Color(1, 0.85, 0.85) });
  scene.add(arc.mesh, sea.mesh, bus.mesh);

  const markers = {
    ba: makeMarker(BA, new THREE.Color(1, 1, 1)),
    mvd: makeMarker(MVD, new THREE.Color(1.0, 0.06, 0.08)),
    lp: makeMarker(LP, new THREE.Color(1.0, 0.06, 0.08)),
  };
  for (const m of Object.values(markers)) scene.add(m.group);

  // moving vehicle tokens (glowing pucks) for the map
  const token = (color) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { amt: { value: 0 }, color: { value: color } },
      vertexShader: `varying vec2 vP; void main(){ vP = position.xy; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * vec2(length(modelMatrix[0].xyz)); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float amt; uniform vec3 color; varying vec2 vP; void main(){ float r = length(vP); vec3 c = color * exp(-r * 6.0) * 1.6 + vec3(1.0) * (1.0 - smoothstep(0.12, 0.18, r)) * 3.0; gl_FragColor = vec4(c * amt, 1.0); }`,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    }));
    m.frustumCulled = false; m.renderOrder = 10;
    scene.add(m);
    return m;
  };
  const busToken = token(new THREE.Color(1, 0.05, 0.06));
  const seaToken = token(new THREE.Color(0.9, 0.9, 1.0));

  const vehicleHolder = new THREE.Group();
  scene.add(vehicleHolder);
  const hemi = new THREE.HemisphereLight(0xdde0ff, 0x101014, 1.0);
  scene.add(hemi);

  return {
    scene, camera, globeMat, atmoMat, meta, markers, vehicleHolder,
    arcAt: sample(arcPts), seaAt: sample(seaPts), busAt: sample(busPts),
    update(t, s) {
      camera.updateMatrixWorld();
      const cp = camera.position;
      globeMat.uniforms.camPosW.value.copy(cp);
      atmoMat.uniforms.camPosW.value.copy(cp);
      globeMat.uniforms.uTime.value = t;
      const alt = cp.length() - R;
      atmoMat.uniforms.uAlpha.value = clamp((alt - 150) / 900);
      camera.near = Math.max(0.05, alt * 0.02);
      camera.far = cp.length() + R * 1.2;
      camera.updateProjectionMatrix();
      arc.update(s.arc ?? 0, s.arcGlow ?? 1, t);
      sea.update(s.sea ?? 0, s.seaGlow ?? 1, t);
      bus.update(s.bus ?? 0, s.busGlow ?? 1, t);
      markers.ba.update(camera, t, s.baMarker ?? 0);
      markers.mvd.update(camera, t, s.mvdMarker ?? 0);
      markers.lp.update(camera, t, s.lpMarker ?? 0);
      const place = (tok, at, u, amt) => {
        tok.visible = amt > 0.001;
        if (!tok.visible) return;
        tok.position.copy(at(u)).multiplyScalar(1.0004);
        tok.scale.setScalar(cp.distanceTo(tok.position) * 0.012);
        tok.material.uniforms.amt.value = amt;
      };
      place(busToken, this.busAt, s.busTokenU ?? 0, s.busToken ?? 0);
      place(seaToken, this.seaAt, s.seaTokenU ?? 0, s.seaToken ?? 0);
      for (const k of ['uArg', 'uUry', 'uLights', 'uGrid', 'uCoast', 'uBorders', 'uBright', 'uCity']) if (s[k] !== undefined) globeMat.uniforms[k].value = s[k];
    },
  };
}

// Ribbon with constant pixel width: coloured glow + white-hot core, progress reveal.
function makeRibbon(pts, W, H, { width = 10, color, core = new THREE.Color(1, 1, 1), dashed = false } = {}) {
  const n = pts.length;
  const pos = new Float32Array(n * 6), prev = new Float32Array(n * 6), next = new Float32Array(n * 6);
  const side = new Float32Array(n * 2), uu = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    for (let k = 0; k < 2; k++) {
      const j = i * 2 + k;
      pos.set([p.x, p.y, p.z], j * 3); prev.set([a.x, a.y, a.z], j * 3); next.set([b.x, b.y, b.z], j * 3);
      side[j] = k ? 1 : -1; uu[j] = i / (n - 1);
    }
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('prev', new THREE.BufferAttribute(prev, 3));
  g.setAttribute('next', new THREE.BufferAttribute(next, 3));
  g.setAttribute('side', new THREE.BufferAttribute(side, 1));
  g.setAttribute('uu', new THREE.BufferAttribute(uu, 1));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { res: { value: new THREE.Vector2(W, H) }, width: { value: width * W / 1080 }, prog: { value: 0 }, glow: { value: 1 },
      color: { value: color }, core: { value: core }, time: { value: 0 }, dashed: { value: dashed ? 1 : 0 } },
    vertexShader: /* glsl */`
      attribute vec3 prev, next; attribute float side, uu; uniform vec2 res; uniform float width;
      varying float vSide, vU;
      void main(){
        vec4 c = projectionMatrix * viewMatrix * vec4(position, 1.0);
        vec4 a = projectionMatrix * viewMatrix * vec4(prev, 1.0);
        vec4 b = projectionMatrix * viewMatrix * vec4(next, 1.0);
        vec2 sa = a.xy / a.w * res, sb = b.xy / b.w * res;
        vec2 dir = normalize(sb - sa + 1e-6);
        vec2 nrm = vec2(-dir.y, dir.x);
        c.xy += nrm * side * width / res * c.w;
        vSide = side; vU = uu;
        gl_Position = c;
      }`,
    fragmentShader: /* glsl */`
      uniform float prog, glow, time, dashed; uniform vec3 color, core; varying float vSide, vU;
      void main(){
        float x = abs(vSide);
        float halo = exp(-x * x * 7.0);
        float hot = exp(-x * x * 45.0);
        float vis = 1.0 - smoothstep(prog - 0.004, prog + 0.0005, vU);
        float head = exp(-pow((vU - prog) / 0.012, 2.0)) * step(0.001, prog) * step(prog, 0.999);
        float pulse = 0.78 + 0.22 * sin(vU * 140.0 - time * 14.0);
        float dash = dashed > 0.5 ? (0.45 + 0.55 * step(0.42, fract(vU * 60.0 - time * 1.2))) : 1.0;
        vec3 c = color * halo * 2.2 * pulse * dash + core * hot * 1.6 * dash;
        c *= vis * glow;
        c += mix(color, vec3(1.0), 0.6) * head * halo * 12.0 * glow;
        gl_FragColor = vec4(c, 1.0);
      }`,
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return { mesh, mat, update(p, gl, t) { mat.uniforms.prog.value = p; mat.uniforms.glow.value = gl; mat.uniforms.time.value = t; mesh.visible = p > 0.0005 && gl > 0.001; } };
}

function makeMarker(ll, color) {
  const group = new THREE.Group();
  const { up, east, north } = enu(ll.lon, ll.lat);
  const base = lonLatToVec(ll.lon, ll.lat, 0.8);
  group.position.copy(base);
  group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, north, up));
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, amt: { value: 0 }, color: { value: color } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform float time, amt; uniform vec3 color; varying vec2 vP;
      void main(){
        float r = length(vP);
        float dot_ = 1.0 - smoothstep(0.055, 0.075, r);
        float halo = exp(-r * 9.0) * 1.2;
        float rings = 0.0;
        for (int i = 0; i < 3; i++) { float ph = fract(time * 0.85 + float(i) / 3.0); rings += exp(-pow((r - 0.08 - ph * 0.9) / 0.012, 2.0)) * (1.0 - ph) * 1.4; }
        vec3 c = color * (halo + rings * 1.3) + vec3(1.0) * dot_ * 3.5;
        gl_FragColor = vec4(c * amt * (1.0 - smoothstep(0.85, 1.0, r)), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  }));
  group.add(disc);
  const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
  beamGeo.rotateX(Math.PI / 2); beamGeo.translate(0, 0, 0.5);
  const beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
    uniforms: { amt: { value: 0 }, color: { value: color } },
    vertexShader: `varying float vH; varying vec3 vN; varying vec3 vV; void main(){ vH = position.z; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float amt; uniform vec3 color; varying float vH; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.0); float fade = pow(1.0 - vH, 2.2);
        gl_FragColor = vec4((color * 1.4 + vec3(0.5)) * f * fade * amt * 1.2, 1.0); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  }));
  group.add(beam);
  return {
    group, base,
    update(cam, t, amt) {
      group.visible = amt > 0.001;
      const d = cam.position.distanceTo(base);
      const s = d * 0.04;
      disc.scale.setScalar(s * (0.6 + 0.4 * Math.min(1, amt * 1.5)));
      disc.material.uniforms.time.value = t; disc.material.uniforms.amt.value = amt;
      beam.scale.set(s * 0.016, s * 0.016, s * 1.4 * Math.min(1, amt * 1.4));
      beam.material.uniforms.amt.value = amt;
    },
  };
}
