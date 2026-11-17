// Procedural twin-engine wide-body airliner (≈ 60 m long, 58 m span), with a
// subtle Boca-inspired livery: white crown, yellow cheat-line, blue belly,
// blue tail fin crossed by a yellow band. No airline names or logos.
// Model axes: +z = nose, +y = up, starboard (right) wing on -x.
import * as THREE from 'three';
import { cabinStrip } from './fans.js';
import { GLSL_NOISE } from './util.js';

const R0 = 2.9;                    // fuselage radius
const NOSE = 30, TAIL = -30;

function fuselageShape(z) {
  // returns [radius, centre-y]
  if (z > 22) { const s = (NOSE - z) / (NOSE - 22); return [R0 * Math.pow(1 - Math.pow(1 - s, 2.4), 0.5), -0.55 * Math.pow(1 - s, 1.5)]; }
  if (z > -12) return [R0, 0];
  const s = (-12 - z) / (-12 - TAIL);
  return [R0 * (1 - 0.83 * Math.pow(s, 1.35)), R0 * 0.55 * Math.pow(s, 1.6)];
}

function buildFuselage() {
  const zs = [];
  for (let i = 0; i <= 40; i++) zs.push(NOSE - (8 * (1 - Math.cos((i / 40) * Math.PI / 2))));   // dense at the nose
  for (let z = 21.5; z > -12; z -= 0.5) zs.push(z);
  for (let i = 0; i <= 40; i++) zs.push(-12 - 18 * (i / 40));
  const seg = 72;
  const pos = [], idx = [];
  zs.forEach((z, i) => {
    const [r, yc] = fuselageShape(z);
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI * 2;
      pos.push(Math.sin(a) * r, yc + Math.cos(a) * r * 1.04, z);
    }
  });
  for (let i = 0; i < zs.length - 1; i++) for (let k = 0; k < seg; k++) {
    const a = i * (seg + 1) + k, b = a + seg + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// lofted wing: span along +x (sign flips), chord along -z, LE of root at origin
function buildWing({ rootChord, tipChord, semiSpan, sweep, dihedral, tRoot, tTip, twist = 0, winglet = 0, side = 1, vertical = false }) {
  const air = [];
  const NP = 22;
  for (let i = 0; i <= NP; i++) { const x = 0.5 - 0.5 * Math.cos((i / NP) * Math.PI); air.push(x); }
  const thick = (x, t) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  const stations = [];
  const NS = 14;
  for (let i = 0; i <= NS; i++) stations.push({ s: i / NS, up: 0 });
  if (winglet) for (let i = 1; i <= 6; i++) stations.push({ s: 1, up: i / 6 });
  const pos = [], idx = [];
  const ring = [];
  stations.forEach((st) => {
    const s = st.s;
    let chord = THREE.MathUtils.lerp(rootChord, tipChord, s);
    let x = s * semiSpan, y = s * semiSpan * Math.tan(dihedral), z = -s * semiSpan * Math.tan(sweep);
    const t = THREE.MathUtils.lerp(tRoot, tTip, s);
    if (st.up > 0) { // blended winglet: curves up and back
      const u = st.up, ang = u * u * 1.35;
      x += Math.sin(Math.min(ang, 1.2)) * 0.9 * u;
      y += winglet * u;
      z -= winglet * 0.8 * u * u;
      chord *= 1 - 0.6 * u;
    }
    const tw = -twist * s;
    const pts = [];
    // upper surface from TE to LE, then lower from LE to TE
    for (let i = NP; i >= 0; i--) pts.push([air[i], thick(air[i], t) * 0.95]);
    for (let i = 1; i <= NP; i++) pts.push([air[i], -thick(air[i], t) * 0.62]);
    const start = pos.length / 3;
    for (const [cx, cy] of pts) {
      const lz = -cx * chord, ly = cy * chord;
      const rz = lz * Math.cos(tw) - ly * Math.sin(tw), ry = lz * Math.sin(tw) + ly * Math.cos(tw);
      if (vertical) pos.push(ry, x + 0, z + rz + 0 * y); else pos.push(side * x, y + ry, z + rz);
    }
    ring.push(start);
  });
  const n = 2 * NP + 1;
  for (let j = 0; j < ring.length - 1; j++) for (let i = 0; i < n - 1; i++) {
    const a = ring[j] + i, b = ring[j + 1] + i;
    if (side > 0 || vertical) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  // tip cap
  const last = ring[ring.length - 1];
  for (let i = 1; i < NP; i++) {
    const a = last + i, b = last + n - 1 - i;
    if (side > 0 || vertical) idx.push(last + 0, a, a + 1); else idx.push(last + 0, a + 1, a);
    void b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buildNacelle() {
  const prof = [];
  const L = 7.2, Rm = 1.62;
  prof.push(new THREE.Vector2(1.18, L * 0.5));                       // inner lip
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 0.5; prof.push(new THREE.Vector2(1.3 + Math.sin(a) * 0.3, L * 0.5 + 0.12 - Math.cos(a) * 0.12 + 0.12 * Math.sin(a))); }
  for (let i = 1; i <= 12; i++) { const u = i / 12; prof.push(new THREE.Vector2(Rm * (1 - 0.28 * u * u), L * 0.5 - u * L * 0.8)); }
  prof.push(new THREE.Vector2(0.95, -L * 0.33)); prof.push(new THREE.Vector2(0.8, -L * 0.36));
  prof.push(new THREE.Vector2(0.62, -L * 0.42)); prof.push(new THREE.Vector2(0.05, -L * 0.62));    // exhaust cone
  const g = new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p.x, p.y)).reverse(), 48);
  g.rotateX(Math.PI / 2);
  return g;
}

const LIGHTING = /* glsl */`
uniform vec3 keyDir, keyColor, skyColor, groundColor; uniform float envK, uExposure;
vec3 envSample(vec3 r){
  float h = r.y;
  vec3 c = mix(groundColor * 0.6, skyColor, smoothstep(-0.25, 0.25, h));
  c += keyColor * 0.06 * pow(max(dot(r, keyDir), 0.0), 40.0) * 8.0;
  return c;
}
vec3 shade(vec3 base, float rough, vec3 N, vec3 V, float ao){
  vec3 L = normalize(keyDir);
  float ndl = max(dot(N, L), 0.0);
  vec3 H = normalize(L + V);
  float sp = pow(max(dot(N, H), 0.0), mix(180.0, 12.0, rough)) * mix(1.6, 0.25, rough);
  vec3 amb = mix(groundColor, skyColor, N.y * 0.5 + 0.5);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 R = reflect(-V, N);
  vec3 c = base * (keyColor * ndl + amb) * ao + keyColor * sp * ndl + envSample(R) * fres * envK * (1.0 - rough * 0.7);
  return c;
}
`;

export function buildPlane() {
  const group = new THREE.Group();          // world placement
  const body = new THREE.Group();           // banking / pitching
  group.add(body);
  const common = {
    keyDir: { value: new THREE.Vector3(0.3, 0.8, 0.4).normalize() }, keyColor: { value: new THREE.Color(0.55, 0.62, 0.8) },
    skyColor: { value: new THREE.Color(0.05, 0.09, 0.2) }, groundColor: { value: new THREE.Color(0.12, 0.07, 0.04) },
    envK: { value: 1.0 }, uExposure: { value: 1 }, uTime: { value: 0 },
  };
  const VS = /* glsl */`
    varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vWN; varying vec3 vVo;
    void main(){ vP = position; vN = normal; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vWN = normalize(mat3(modelMatrix) * normal);
      vVo = inverse(mat3(modelMatrix)) * (cameraPosition - w.xyz);
      gl_Position = projectionMatrix * viewMatrix * w; }`;

  // ---------- fuselage with livery, windows and the party inside ----------
  const strip = new THREE.CanvasTexture(cabinStrip(4096, 256, 36.9));
  strip.colorSpace = THREE.SRGBColorSpace; strip.wrapS = THREE.RepeatWrapping; strip.anisotropy = 8;
  strip.generateMipmaps = true; strip.minFilter = THREE.LinearMipmapLinearFilter;
  const fusMat = new THREE.ShaderMaterial({
    uniforms: { ...common, tStrip: { value: strip }, cabinGlow: { value: 1.0 }, logoLight: { value: 1.0 } },
    vertexShader: VS,
    fragmentShader: GLSL_NOISE + LIGHTING + /* glsl */`
      uniform sampler2D tStrip; uniform float uTime, cabinGlow; varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vWN; varying vec3 vVo;
      float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      void main(){
        vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW);
        float z = vP.z;
        // local cross-section coordinates
        float rad = ${R0.toFixed(2)};
        float yc = z > 22.0 ? -0.55 * pow(1.0 - (30.0 - z) / 8.0, 1.5) : (z > -12.0 ? 0.0 : rad * 0.55 * pow((-12.0 - z) / 18.0, 1.6));
        float hy = (vP.y - yc) / rad;         // -1 belly .. +1 crown
        float side = vP.x;
        // livery bands (cheat-line sweeps up toward the tail)
        float sweepUp = (1.0 - smoothstep(-24.0, -6.0, z)) * 0.35 - smoothstep(20.0, 29.0, z) * 0.12;
        float bandTop = -0.02 + sweepUp, bandBot = -0.22 + sweepUp;
        float aa = fwidth(hy) * 1.2;
        float yel = smoothstep(bandBot - aa, bandBot + aa, hy) * (1.0 - smoothstep(bandTop - aa, bandTop + aa, hy));
        float blue = 1.0 - smoothstep(bandBot - 0.06 - aa, bandBot - 0.06 + aa, hy);
        float pin = smoothstep(bandBot - 0.06 - aa, bandBot - 0.06 + aa, hy) * (1.0 - smoothstep(bandBot - aa, bandBot + aa, hy));
        vec3 white = vec3(0.86, 0.87, 0.88), bocaBlue = vec3(0.0, 0.035, 0.24), gold = vec3(1.0, 0.68, 0.0);
        vec3 base = white;
        base = mix(base, gold, yel);
        base = mix(base, bocaBlue, blue);
        base = mix(base, white * 0.9, pin);
        // panel lines
        float pl = 1.0 - smoothstep(0.0, fwidth(z) * 1.5 + 0.004, abs(fract(z / 2.4) - 0.5) - 0.497);
        base *= 1.0 - 0.06 * pl;
        float rough = mix(0.28, 0.35, blue);
        vec3 col = shade(base, rough, N, V, 1.0);
        col += gold * yel * 0.10 + bocaBlue * blue * 0.25;

        // passenger windows: row on both sides, hy ~ 0.30
        float wz = z / 0.53;
        float wid = floor(wz);
        vec2 wp = vec2((fract(wz) - 0.5) * 0.53, (hy - 0.32) * rad);
        float inCabin = step(-12.5, z) * step(z, 20.5);
        float door = step(abs(z - 18.6), 0.7) + step(abs(z - 7.2), 0.7) + step(abs(z + 6.5), 0.7) + step(abs(z + 11.6), 0.6);
        float d = sdRound(wp, vec2(0.15, 0.235), 0.11);
        float wAA = fwidth(d) * 1.2 + 0.002;
        float win = (1.0 - smoothstep(-wAA, wAA, d)) * inCabin * (1.0 - min(door, 1.0)) * step(0.0, abs(side) - 0.3);
        if (win > 0.001) {
          // fake interior with parallax: a cabin strip ~0.9 m behind the glass
          vec3 T = vec3(0.0, 0.0, 1.0);
          vec3 Nl = normalize(vN);
          vec3 B = normalize(cross(Nl, T));
          vec3 Vl = normalize(vVo);
          float vn = max(dot(Vl, Nl), 0.15);
          float depth = 3.2;
          float X = z - dot(Vl, T) / vn * depth;
          float Y = wp.y - (Vl.y / vn) * depth;
          float person = floor(X / 0.95);
          float ph = fract(sin(person * 91.7) * 4375.5);
          float jump = abs(sin(uTime * 6.5 + ph * 6.28)) * 0.07;
          float pose = step(0.0, sin(uTime * 5.0 + ph * 6.28));
          vec2 suv = vec2(X / 36.9, 0.5 + (Y - jump) / 2.3);   // canvas texture is flipY: v grows upward
          suv.y = clamp(suv.y, 0.01, 0.99) * 0.5 + pose * 0.5;
          vec3 inside = texture2D(tStrip, suv).rgb;
          inside = pow(inside, vec3(2.0)) * 3.4 * cabinGlow;
          // glass: reflection + slight tint
          float fres = 0.06 + 0.9 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
          vec3 glass = inside * (1.0 - fres) + envSample(reflect(-V, N)) * fres * 0.8;
          // window frame shading
          float rim = smoothstep(-0.03, 0.0, d);
          col = mix(col, glass, win * (1.0 - rim * 0.6));
        }
        // doors outline
        float dz = min(min(abs(z - 18.6), abs(z - 7.2)), min(abs(z + 6.5), abs(z + 11.6)));
        float dOut = abs(sdRound(vec2(dz, (hy - 0.12) * rad), vec2(0.52, 0.95), 0.18));
        col *= 1.0 - 0.35 * (1.0 - smoothstep(0.0, fwidth(dOut) * 1.5 + 0.004, dOut)) * step(0.3, abs(side));

        // cockpit windows
        vec2 cp = vec2(abs(side), vP.y - yc);
        float cock = step(25.6, z) * step(z, 27.9) * step(0.3, cp.y + (z - 25.6) * 0.18) * step(cp.y + (z - 25.6) * 0.1, 1.2) * step(cp.x, 2.1);
        float mull = step(0.06, abs(fract(atan(side, vP.y - yc) * 1.2 + 0.5) - 0.5));
        col = mix(col, vec3(0.005, 0.01, 0.02) + envSample(reflect(-V, N)) * 0.35, cock * mull);
        gl_FragColor = vec4(col * uExposure, 1.0);
      }`,
  });
  const fuselage = new THREE.Mesh(buildFuselage(), fusMat);
  body.add(fuselage);

  // ---------- grey surfaces ----------
  const greyMat = (tint = new THREE.Color(0.58, 0.6, 0.63), winglet = false) => new THREE.ShaderMaterial({
    uniforms: { ...common, tint: { value: tint }, wl: { value: winglet ? 1 : 0 } },
    vertexShader: VS,
    fragmentShader: LIGHTING + /* glsl */`
      uniform vec3 tint; uniform float wl; varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vWN;
      void main(){
        vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW);
        vec3 base = tint;
        float panel = 1.0 - smoothstep(0.0, fwidth(vP.x) * 1.5 + 0.004, abs(fract(vP.x / 1.7) - 0.5) - 0.495);
        base *= 1.0 - 0.07 * panel;
        if (wl > 0.5) { // winglets: Boca blue with a yellow band
          float up = smoothstep(0.6, 0.9, vP.y - abs(vP.x) * 0.087 - 1.2);
          float band = smoothstep(1.6, 1.7, vP.y - abs(vP.x) * 0.087) * (1.0 - smoothstep(2.3, 2.4, vP.y - abs(vP.x) * 0.087));
          base = mix(base, mix(vec3(0.0, 0.035, 0.24), vec3(0.92, 0.66, 0.0), band), up);
        }
        gl_FragColor = vec4(shade(base, 0.38, N, V, 1.0) * uExposure, 1.0);
      }`,
  });
  const wingCfg = { rootChord: 10.6, tipChord: 2.2, semiSpan: 26.2, sweep: 0.54, dihedral: 0.095, tRoot: 0.14, tTip: 0.1, twist: 0.05, winglet: 2.8 };
  for (const side of [1, -1]) {
    const w = new THREE.Mesh(buildWing({ ...wingCfg, side }), greyMat(undefined, true));
    w.position.set(side * 2.2, -1.6, 5.2);
    body.add(w);
    const st = new THREE.Mesh(buildWing({ rootChord: 6.2, tipChord: 2.2, semiSpan: 9.2, sweep: 0.6, dihedral: 0.12, tRoot: 0.11, tTip: 0.09, side }), greyMat());
    st.position.set(side * 0.5, 0.9, -20.8);
    body.add(st);
  }
  // wing-to-body fairing (blue belly)
  const fair = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
    uniforms: { ...common }, vertexShader: VS,
    fragmentShader: LIGHTING + `varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vWN;
      void main(){ vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW); gl_FragColor = vec4(shade(vec3(0.0, 0.035, 0.24), 0.32, N, V, 1.0) * uExposure, 1.0); }`,
  }));
  fair.scale.set(2.75, 1.6, 9.5); fair.position.set(0, -1.85, -0.8);
  body.add(fair);

  // vertical fin: Boca blue with a horizontal yellow band, lit by the logo lights
  const fin = new THREE.Mesh(buildWing({ rootChord: 9.2, tipChord: 3.1, semiSpan: 9.6, sweep: 0.72, dihedral: 0, tRoot: 0.11, tTip: 0.09, vertical: true }), new THREE.ShaderMaterial({
    uniforms: { ...common, logo: { value: 1 } }, vertexShader: VS,
    fragmentShader: LIGHTING + /* glsl */`uniform float logo; varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vWN;
      void main(){
        vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW);
        float h = vP.y;
        float aa = fwidth(h) * 1.2;
        float band = smoothstep(3.6 - aa, 3.6 + aa, h) * (1.0 - smoothstep(5.6 - aa, 5.6 + aa, h));
        vec3 base = mix(vec3(0.0, 0.035, 0.24), vec3(1.0, 0.68, 0.0), band);
        vec3 c = shade(base, 0.3, N, V, 1.0) + base * 0.08;
        // logo lights wash the fin from the stabilisers
        c += base * logo * 1.6 * exp(-h / 4.5) * (0.6 + 0.4 * abs(N.x));
        gl_FragColor = vec4(c * uExposure, 1.0);
      }`,
  }));
  fin.position.set(0, R0 * 0.62 + 0.9, -18.0);
  body.add(fin);

  // engines
  const nacMat = new THREE.ShaderMaterial({
    uniforms: { ...common }, vertexShader: VS,
    fragmentShader: GLSL_NOISE + LIGHTING + /* glsl */`uniform float uTime; varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vWN;
      void main(){
        vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW);
        float r = length(vP.xy);
        vec3 base = vec3(0.82, 0.83, 0.85);
        float lip = smoothstep(3.0, 3.4, vP.z);
        base = mix(base, vec3(0.75, 0.77, 0.8), lip);
        float ring = smoothstep(2.25, 2.35, vP.z) * (1.0 - smoothstep(2.75, 2.85, vP.z));
        base = mix(base, vec3(0.0, 0.035, 0.24), ring);
        float inner = 1.0 - step(1.25, r);
        if (vP.z > 3.3 && inner > 0.5) {
          // fan face: dark blades spinning, white spiral on the spinner
          float a = atan(vP.y, vP.x) + uTime * 30.0;
          float blades = 0.5 + 0.5 * sin(a * 22.0);
          base = vec3(0.02, 0.022, 0.026) * (0.6 + 0.6 * blades);
          if (r < 0.42) { base = vec3(0.04); float sp = step(0.5, fract(atan(vP.y, vP.x) / 6.283 + r * 2.2 + uTime * 5.0)); base = mix(base, vec3(0.8), sp * step(r, 0.4)); }
        }
        float rough = mix(0.32, 0.18, lip);
        vec3 c = shade(base, rough, N, V, 1.0);
        if (vP.z < -2.5 && r < 0.95) c += vec3(0.25, 0.12, 0.06) * (1.0 - smoothstep(-4.4, -2.5, vP.z)) * 0.6; // warm exhaust
        gl_FragColor = vec4(c * uExposure, 1.0);
      }`,
  });
  const pylonMat = greyMat(new THREE.Color(0.7, 0.71, 0.73));
  for (const side of [1, -1]) {
    const n = new THREE.Mesh(buildNacelle(), nacMat);
    n.position.set(side * 9.4, -3.05, 3.4);
    body.add(n);
    const py = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.5, 5.6), pylonMat);
    py.position.set(side * 9.4, -1.75, 1.4);
    body.add(py);
  }

  // ---------- lights ----------
  const lightGeo = new THREE.BufferGeometry();
  const tipY = -1.6 + 26.2 * 0.095, tipZ = 5.2 - 26.2 * Math.tan(0.54);
  const L = [ // x, y, z, r, g, b, kind (0 steady, 1 strobe, 2 beacon, 3 landing)
    [28.5, tipY, tipZ - 0.3, 1.0, 0.06, 0.03, 0],        // port nav (red)
    [-28.5, tipY, tipZ - 0.3, 0.05, 1.0, 0.3, 0],        // starboard nav (green)
    [28.6, tipY, tipZ - 2.1, 1, 1, 1, 1],                // strobes
    [-28.6, tipY, tipZ - 2.1, 1, 1, 1, 1],
    [0, -0.4 + R0 * 0.55, -30.1, 1, 1, 1, 0],          // tail light
    [0, R0 * 1.04 + 0.05, 2.0, 1, 0.05, 0.02, 2],      // beacon top
    [0, -R0 * 1.04 - 0.65, -2.0, 1, 0.05, 0.02, 2],    // beacon bottom
    [3.4, -1.85, 4.8, 1, 0.97, 0.9, 3],                  // landing lights (wing roots)
    [-3.4, -1.85, 4.8, 1, 0.97, 0.9, 3],
  ];
  lightGeo.setAttribute('position', new THREE.Float32BufferAttribute(L.flatMap((l) => l.slice(0, 3)), 3));
  lightGeo.setAttribute('color', new THREE.Float32BufferAttribute(L.flatMap((l) => l.slice(3, 6)), 3));
  lightGeo.setAttribute('kind', new THREE.Float32BufferAttribute(L.map((l) => l[6]), 1));
  const lightMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, scale: { value: 1000 }, landing: { value: 1 }, size: { value: 1 } },
    vertexShader: /* glsl */`attribute vec3 color; attribute float kind; uniform float uTime, scale, landing, size; varying vec3 vC; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        float a = 1.0;
        if (kind == 1.0) { float f = fract(uTime * 0.9); a = step(f, 0.05) + step(0.14, f) * step(f, 0.19); }
        if (kind == 2.0) { float f = fract(uTime * 0.75 + 0.4); a = 0.1 + 0.9 * exp(-f * 9.0); }
        if (kind == 3.0) { vec3 fwd = normalize(mat3(modelViewMatrix) * vec3(0.0, -0.05, 1.0)); a = landing * (0.15 + 3.0 * pow(max(dot(fwd, normalize(-mv.xyz)), 0.0), 6.0)); }
        vC = color; vA = a;
        gl_PointSize = clamp(scale * size * (kind == 3.0 ? 1.8 : 0.9) / -mv.z, 3.0, 220.0) * (0.6 + 0.4 * min(a, 1.5));
      }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 p = gl_PointCoord - 0.5; float r = length(p);
      float core = exp(-r * r * 160.0); float halo = exp(-r * 9.0) * 0.35; float star = exp(-abs(p.x) * 60.0) * exp(-abs(p.y) * 6.0) + exp(-abs(p.y) * 60.0) * exp(-abs(p.x) * 6.0);
      vec3 c = (vC * (halo + star * 0.25) + mix(vC, vec3(1.0), 0.7) * core) * vA * 9.0; gl_FragColor = vec4(c, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  });
  const lights = new THREE.Points(lightGeo, lightMat);
  lights.frustumCulled = false;
  body.add(lights);

  const mats = [fusMat, nacMat, fin.material, fair.material, pylonMat];
  body.traverse((o) => { if (o.material && !mats.includes(o.material)) mats.push(o.material); });

  return {
    group, body, fusMat, lightMat,
    setEnv({ keyDir, keyColor, skyColor, groundColor, envK, exposure } = {}) {
      for (const m of mats) {
        const u = m.uniforms; if (!u || !u.keyDir) continue;
        if (keyDir) u.keyDir.value.copy(keyDir).normalize();
        if (keyColor) u.keyColor.value.copy(keyColor);
        if (skyColor) u.skyColor.value.copy(skyColor);
        if (groundColor) u.groundColor.value.copy(groundColor);
        if (envK !== undefined) u.envK.value = envK;
        if (exposure !== undefined) u.uExposure.value = exposure;
      }
    },
    update(t, { pxScale = 1000, landing = 1, lightSize = 1 } = {}) {
      for (const m of mats) if (m.uniforms && m.uniforms.uTime) m.uniforms.uTime.value = t;
      lightMat.uniforms.uTime.value = t;
      lightMat.uniforms.scale.value = pxScale;
      lightMat.uniforms.landing.value = landing;
      lightMat.uniforms.size.value = lightSize;
    },
  };
}
