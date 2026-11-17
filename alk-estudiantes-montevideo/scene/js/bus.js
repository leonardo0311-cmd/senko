// Double-decker long-distance coach (≈14 m, Paradiso-style proportions) with a
// red & white livery (no third-party brands), LED destination sign "MONTEVIDEO",
// working lights; plus the road scene: boarding bay at night and the highway at dusk.
// Model axes: +z = front, +y = up, right side (doors) = -x. Units: metres.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLSL_NOISE, rng, clamp } from './util.js';
import { fanAtlas, buildCrowd, buildFlags } from './fans.js';
import { buildSmoke, buildFlareCores } from './fx.js';

const ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };
const L = 14.0, WID = 2.6, HGT = 4.1, Y0 = 0.38;

const LIGHTING = /* glsl */`
uniform vec3 keyDir, keyColor, skyColor, groundColor; uniform float envK;
vec3 envSample(vec3 r){
  float h = r.y;
  vec3 c = mix(groundColor * 0.5, skyColor, smoothstep(-0.2, 0.3, h));
  c += keyColor * 0.5 * pow(max(dot(normalize(r), normalize(keyDir)), 0.0), 12.0);
  return c;
}
vec3 shade(vec3 base, float rough, vec3 N, vec3 V){
  vec3 Lk = normalize(keyDir);
  float ndl = max(dot(N, Lk), 0.0);
  vec3 H = normalize(Lk + V);
  float sp = pow(max(dot(N, H), 0.0), mix(160.0, 10.0, rough)) * mix(1.5, 0.2, rough);
  vec3 amb = mix(groundColor, skyColor, N.y * 0.5 + 0.5);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  return base * (keyColor * ndl + amb) + keyColor * sp * ndl + envSample(reflect(-V, N)) * fres * envK * (1.0 - rough * 0.7);
}`;

function ledSignTexture(text) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
  // render text, then sample it on a dot grid (LED matrix look)
  const t = document.createElement('canvas'); t.width = 256; t.height = 24;
  const tx = t.getContext('2d');
  tx.fillStyle = '#000'; tx.fillRect(0, 0, 256, 24);
  tx.fillStyle = '#fff'; tx.font = '700 20px "Barlow Condensed", sans-serif'; tx.textAlign = 'center'; tx.textBaseline = 'middle';
  tx.fillText(text, 128, 13);
  const d = tx.getImageData(0, 0, 256, 24).data;
  for (let j = 0; j < 24; j++) for (let i = 0; i < 256; i++) {
    const v = d[(j * 256 + i) * 4] / 255;
    if (v < 0.35) continue;
    x.fillStyle = `rgba(255, ${Math.round(150 + 40 * v)}, 40, ${0.55 + 0.45 * v})`;
    x.beginPath(); x.arc(i * 4 + 2, j * 4 + 2, 1.6, 0, 7); x.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildBus() {
  const group = new THREE.Group();
  const common = {
    keyDir: { value: new THREE.Vector3(-0.6, 0.35, 0.3) }, keyColor: { value: new THREE.Color(1.0, 0.45, 0.3) },
    skyColor: { value: new THREE.Color(0.08, 0.06, 0.1) }, groundColor: { value: new THREE.Color(0.05, 0.03, 0.03) },
    envK: { value: 1.0 }, interior: { value: 1.0 }, uTime: { value: 0 }, brake: { value: 0 },
  };
  const VS = /* glsl */`varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vWN;
    void main(){ vP = position; vN = normal; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vWN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
  const body = new THREE.Mesh(new RoundedBoxGeometry(WID, HGT - Y0, L, 6, 0.32), new THREE.ShaderMaterial({
    uniforms: { ...common },
    vertexShader: VS,
    fragmentShader: GLSL_NOISE + LIGHTING + /* glsl */`
      uniform float interior, uTime, brake; varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vWN;
      float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      float aaBox(vec2 p, vec2 b, float r){ float d = sdRound(p, b, r); return 1.0 - smoothstep(-fwidth(d), fwidth(d), d); }
      void main(){
        vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW);
        vec3 n = normalize(vN);
        float y = vP.y + ${((HGT - Y0) / 2 + Y0).toFixed(3)};   // height above the road
        float z = vP.z;                                         // along the body, front = +7
        vec3 white = vec3(0.86, 0.86, 0.87), red = vec3(0.78, 0.01, 0.03);
        vec3 base = white; float rough = 0.3; float glass = 0.0; vec3 emit = vec3(0.0);
        if (abs(n.x) > 0.6) {
          // ---- sides ----
          float sideR = n.x < 0.0 ? 1.0 : 0.0;   // right side (doors)
          float up = aaBox(vec2(z + 0.9, y - 3.12), vec2(5.75, 0.62), 0.28);
          float lowEnd = mix(1.4, 2.4, sideR);
          float low = aaBox(vec2(z - (lowEnd - 6.7) * 0.5 + 0.15, y - 1.72), vec2((lowEnd + 6.7) * 0.5 - 0.3, 0.45), 0.2);
          float door = sideR * aaBox(vec2(z - 4.25, y - 1.6), vec2(0.55, 1.15), 0.12);
          float drv = aaBox(vec2(z - 5.6, y - 1.75), vec2(0.55, 0.5), 0.15);
          // livery: red skirt, vertical red-white stripes block at the rear, red sweep
          float skirt = 1.0 - smoothstep(0.98, 1.02, y);
          float stripes = step(z, -2.2) * step(0.5, fract(z / 0.55)) * step(y, 2.35) * step(1.02, y);
          float sweepLine = y - (1.05 + (z + 7.0) * 0.12);
          float sweep = step(z, 2.5) * smoothstep(-0.03, 0.0, sweepLine) * (1.0 - smoothstep(0.32, 0.35, sweepLine)) * step(2.3, y + 0.0) * step(y, 2.45) ;
          base = mix(base, red, max(skirt, stripes));
          float band = step(2.3, y) * step(y, 2.42);        // red band between decks
          base = mix(base, red, band);
          // luggage bay seams
          float seam = 1.0 - smoothstep(0.0, 0.02, abs(fract((z + 7.0) / 2.2) - 0.5) - 0.48);
          base *= 1.0 - 0.25 * seam * step(y, 1.0);
          glass = max(max(up, low), max(door, drv));
        } else if (n.z > 0.6) {
          // ---- front ----
          vec2 f = vec2(vP.x, y);
          float wsUp = aaBox(f - vec2(0.0, 3.17), vec2(1.18, 0.66), 0.22);
          float wsLow = aaBox(f - vec2(0.0, 1.78), vec2(1.18, 0.6), 0.15);
          float sign_ = aaBox(f - vec2(0.0, 2.42), vec2(0.95, 0.09), 0.03);
          glass = max(wsUp, wsLow);
          float hl = aaBox(vec2(abs(f.x) - 0.92, f.y - 0.78), vec2(0.27, 0.09), 0.05);
          float drl = aaBox(vec2(abs(f.x) - 0.9, f.y - 0.95), vec2(0.3, 0.018), 0.01);
          base = mix(base, vec3(0.02), aaBox(f - vec2(0.0, 0.62), vec2(1.2, 0.2), 0.08));     // bumper grille
          base = mix(base, red, step(f.y, 0.42));
          emit += vec3(1.0, 0.97, 0.9) * hl * 6.0 + vec3(0.9, 0.95, 1.0) * drl * 5.0;
          base = mix(base, vec3(0.0), sign_);
        } else if (n.z < -0.6) {
          // ---- rear ----
          vec2 f = vec2(vP.x, y);
          float tl = aaBox(vec2(abs(f.x) - 1.12, f.y - 1.3), vec2(0.08, 0.55), 0.04);
          float rw = aaBox(f - vec2(0.0, 3.2), vec2(1.0, 0.45), 0.2);
          glass = rw;
          base = mix(base, red, step(0.6, f.y) * step(f.y, 2.2) * step(0.5, fract(f.x / 0.43)));
          emit += vec3(1.0, 0.02, 0.02) * tl * (2.5 + 5.0 * brake);
        } else {
          base = vec3(0.8, 0.8, 0.82);                       // roof
        }
        vec3 col = shade(base, rough, N, V);
        if (glass > 0.001) {
          float fres = 0.1 + 0.9 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
          vec3 refl = envSample(reflect(-V, N));
          // interior: ceiling light strip, warm glow, seat backs (rows), passengers' heads
          float seat = step(0.5, fract(vP.z * 1.18 + 0.2)) * (1.0 - smoothstep(0.3, 0.55, abs(y - (y > 2.4 ? 2.75 : 1.55))));
          float ceil_ = 1.0 - smoothstep(0.0, 0.08, abs(y - (y > 2.4 ? 3.62 : 2.08)));
          vec3 inside = vec3(1.0, 0.6, 0.38) * 0.12 * interior + vec3(1.0, 0.85, 0.7) * ceil_ * 1.2 * interior;
          inside += vec3(0.9, 0.05, 0.05) * 0.06 * interior * seat;
          vec3 gcol = vec3(0.01, 0.012, 0.016) + inside * (1.0 - fres) + refl * fres * 0.9;
          col = mix(col, gcol, glass);
        }
        col += emit;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  body.position.y = (HGT - Y0) / 2 + Y0;
  group.add(body);
  // LED destination sign
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 0.17), new THREE.MeshBasicMaterial({ map: ledSignTexture('MONTEVIDEO'), color: new THREE.Color(3, 3, 3) }));
  sign.position.set(0, 2.42, L / 2 + 0.012);
  group.add(sign);
  // mirrors ("bull horns")
  const mMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), mMat);
    arm.position.set(sx * 1.25, 3.3, L / 2 + 0.25); arm.rotation.y = sx * 0.45; group.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.28), mMat);
    head.position.set(sx * 1.48, 2.95, L / 2 + 0.55); group.add(head);
  }
  // wheels
  const wheelMat = new THREE.ShaderMaterial({
    uniforms: { ...common, rot: { value: 0 } },
    vertexShader: VS,
    fragmentShader: LIGHTING + `uniform float rot; varying vec3 vP; varying vec3 vN; varying vec3 vW; varying vec3 vWN;
      void main(){ vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW);
        float r = length(vP.xz); float a = atan(vP.z, vP.x) + rot;
        vec3 base = vec3(0.02);
        if (abs(normalize(vN).y) > 0.5) {
          float rim = 1.0 - smoothstep(0.30, 0.31, r);
          float spokes = step(0.5, fract(a * 10.0 / 6.283)) * step(0.12, r);
          base = mix(base, vec3(0.6, 0.6, 0.62) * (0.6 + 0.4 * spokes), rim);
        }
        gl_FragColor = vec4(shade(base, 0.5, N, V), 1.0); }`,
  });
  const wheels = [];
  for (const wz of [4.85, -3.55, -4.95]) for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.32, 32), wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(sx * 1.16, 0.52, wz);
    group.add(w); wheels.push(w);
  }
  // point lights (markers / sign glow / headlight glare)
  const pts = [
    [0.92, 0.78, L / 2 + 0.05, 1, 0.97, 0.9, 3], [-0.92, 0.78, L / 2 + 0.05, 1, 0.97, 0.9, 3],
    [1.12, 1.3, -L / 2 - 0.05, 1, 0.03, 0.02, 1], [-1.12, 1.3, -L / 2 - 0.05, 1, 0.03, 0.02, 1],
    [1.25, 4.0, L / 2 - 0.2, 1, 0.55, 0.1, 0], [-1.25, 4.0, L / 2 - 0.2, 1, 0.55, 0.1, 0], [0, 4.02, L / 2 - 0.2, 1, 0.55, 0.1, 0],
  ];
  for (let z = -6; z <= 5; z += 2.2) for (const sx of [-1, 1]) pts.push([sx * 1.31, 0.9, z, 1, 0.5, 0.05, 0]);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap((p) => p.slice(0, 3)), 3));
  lg.setAttribute('color', new THREE.Float32BufferAttribute(pts.flatMap((p) => p.slice(3, 6)), 3));
  lg.setAttribute('kind', new THREE.Float32BufferAttribute(pts.map((p) => p[6]), 1));
  const lMat = new THREE.ShaderMaterial({
    uniforms: { scale: { value: 1000 }, brake: { value: 0 } },
    vertexShader: `attribute vec3 color; attribute float kind; uniform float scale, brake; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        float a = kind == 1.0 ? 0.6 + brake * 1.2 : 0.7;
        if (kind == 3.0) { vec3 fwd = normalize(mat3(modelViewMatrix) * vec3(0.0, -0.05, 1.0)); a = 0.25 + 3.0 * pow(max(dot(fwd, normalize(-mv.xyz)), 0.0), 5.0); }
        vC = color; vA = a; gl_PointSize = clamp(scale * (kind == 3.0 ? 1.4 : 0.35) / -mv.z, 2.0, 260.0); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 p = gl_PointCoord - 0.5; float r = length(p);
      float c = exp(-r * r * 140.0) + exp(-r * 9.0) * 0.3 + (exp(-abs(p.x) * 60.0) * exp(-abs(p.y) * 7.0) + exp(-abs(p.y) * 60.0) * exp(-abs(p.x) * 7.0)) * 0.2;
      gl_FragColor = vec4(mix(vC, vec3(1.0), 0.4) * c * vA * 8.0, 1.0); }`, ...ADD,
  });
  const lights = new THREE.Points(lg, lMat); lights.frustumCulled = false;
  group.add(lights);
  // headlight beams on the road (light pool + haze cone)
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { amt: { value: 1 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float amt; varying vec2 vP; void main(){ float z = vP.y + 0.5; float x = vP.x / max(0.25 + z * 0.75, 0.1);
      float a = exp(-x * x * 9.0) * smoothstep(0.0, 0.08, z) * (1.0 - smoothstep(0.4, 1.0, z)); gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * a * 0.55 * amt, 1.0); }`, ...ADD,
  }));
  pool.scale.set(9, 1, 34); pool.position.set(0, 0.03, L / 2 + 17);
  pool.rotation.y = Math.PI;
  group.add(pool);

  return {
    group, mats: [body.material, wheelMat], lMat,
    setEnv({ keyDir, keyColor, skyColor, groundColor, envK, interior } = {}) {
      for (const m of [body.material, wheelMat]) {
        const u = m.uniforms;
        if (keyDir) u.keyDir.value.copy(keyDir).normalize();
        if (keyColor) u.keyColor.value.copy(keyColor);
        if (skyColor) u.skyColor.value.copy(skyColor);
        if (groundColor) u.groundColor.value.copy(groundColor);
        if (envK !== undefined) u.envK.value = envK;
        if (interior !== undefined && u.interior) u.interior.value = interior;
      }
    },
    update(t, { speed = 0, dist = 0, pxScale = 1000, brake = 0, beams = 1 } = {}) {
      body.material.uniforms.uTime.value = t; body.material.uniforms.brake.value = brake;
      wheelMat.uniforms.rot.value = dist / 0.52;
      lMat.uniforms.scale.value = pxScale; lMat.uniforms.brake.value = brake;
      pool.material.uniforms.amt.value = beams;
    },
  };
}

// ------------------------------------------------------------------ road scene
export function buildRoad(W, H) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.2, 20000);
  const sunDir = new THREE.Vector3(-0.95, 0.06, -0.3).normalize();   // sunset to the west (bus heads north = +z)
  const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { sunDir: { value: sunDir }, dusk: { value: 1 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_NOISE + /* glsl */`uniform vec3 sunDir; uniform float dusk; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        float s = max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(sunDir.x, 0.0, sunDir.z))), 0.0);
        vec3 zen = vec3(0.004, 0.004, 0.009), hor = mix(vec3(0.05, 0.02, 0.03), vec3(0.75, 0.12, 0.05), pow(s, 3.0) * dusk);
        vec3 c = mix(hor, zen, smoothstep(-0.02, 0.45, h));
        c += vec3(1.0, 0.25, 0.06) * exp(-max(h, 0.0) * 18.0) * pow(s, 10.0) * 1.4 * dusk;
        float cl = smoothstep(0.45, 0.8, fbm(vec2(atan(d.z, d.x) * 3.0, h * 14.0)));
        c = mix(c, c * 0.4 + vec3(0.25, 0.05, 0.03) * pow(s, 4.0) * dusk, cl * smoothstep(0.02, 0.1, h) * (1.0 - smoothstep(0.2, 0.4, h)));
        if (h < 0.0) c = hor * 0.25;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // ground: pampas fields, highway (x = 0 northbound lanes, x = -14 southbound), parking bay at x = +16
  const groundMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() }, sunDir: { value: sunDir }, lot: { value: 1 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + /* glsl */`uniform float uTime, lot; uniform vec3 camPos, sunDir; varying vec3 vW;
      float ln(float d, float w){ float a = fwidth(d) + 0.002; return 1.0 - smoothstep(w - a, w + a, abs(d)); }
      void main(){
        vec2 p = vW.xz;
        float fw = length(fwidth(p));
        vec3 field = vec3(0.012, 0.012, 0.008) * (0.6 + 0.6 * fbm(p * 0.02)) * (0.8 + 0.4 * sin(p.x * 0.8 + fbm(p * 0.01) * 6.0));
        vec3 c = field;
        // carriageways: northbound x in [-1.9, 7.3], southbound x in [-16.2, -7.0]
        float nb = step(-1.9, p.x) * step(p.x, 7.3), sb = step(-16.2, p.x) * step(p.x, -7.0);
        vec3 asphalt = vec3(0.012, 0.012, 0.014) * (0.8 + 0.4 * vnoise(p * 3.0));
        float wet = pow(1.0 - abs(normalize(camPos - vW).y), 6.0);
        asphalt += vec3(0.6, 0.12, 0.05) * wet * 0.05;
        c = mix(c, asphalt, max(nb, sb));
        // markings
        float dash = step(0.55, fract(p.y / 12.0));
        float mk = ln(p.x - 2.7, 0.07) * dash + ln(p.x + 1.75, 0.08) + ln(p.x - 7.15, 0.08) + ln(p.x + 7.15, 0.08) + ln(p.x + 16.05, 0.08) + ln(p.x + 11.6, 0.07) * dash;
        float fade = 1.0 - smoothstep(60.0, 900.0, length(camPos.xz - p));
        c = mix(c, vec3(0.5), clamp(mk, 0.0, 1.0) * (0.35 + 0.65 * fade));
        // parking bay (boarding) near the start: lit concrete
        float bay = step(9.0, p.x) * step(p.x, 30.0) * step(-40.0, p.y) * step(p.y, 40.0) * lot;
        vec3 conc = vec3(0.03, 0.028, 0.03) * (0.8 + 0.3 * vnoise(p * 2.0));
        c = mix(c, conc, bay);
        float pools = 0.0;
        for (int i = 0; i < 4; i++) { vec2 lp = vec2(18.0, -30.0 + float(i) * 20.0); pools += exp(-dot(p - lp, p - lp) / 120.0); }
        c += vec3(1.0, 0.85, 0.65) * pools * 0.35 * bay;
        // road-side lamps light pools along the highway
        float lamp = exp(-pow(fract(p.y / 60.0) - 0.5, 2.0) * 120.0) * exp(-pow(p.x - 9.0, 2.0) / 40.0);
        c += vec3(1.0, 0.7, 0.4) * lamp * 0.25;
        float dist = length(camPos - vW);
        c = mix(c, vec3(0.03, 0.012, 0.014), 1.0 - exp(-dist * 0.0012));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000).rotateX(-Math.PI / 2), groundMat));

  // lamp posts and reflective posts along the highway
  const postsN = 120;
  const postGeo = new THREE.CylinderGeometry(0.09, 0.12, 9, 6); postGeo.translate(0, 4.5, 0);
  const posts = new THREE.InstancedMesh(postGeo, new THREE.MeshBasicMaterial({ color: 0x0b0b0c }), postsN);
  const m4 = new THREE.Matrix4();
  const lampPts = [];
  for (let i = 0; i < postsN; i++) { const z = -400 + i * 60; m4.makeTranslation(9.5, 0, z); posts.setMatrixAt(i, m4); lampPts.push([8.3, 9, z, 1]); }
  scene.add(posts);
  const lamps = buildFlareCores(lampPts.map((p) => [p[0], p[1], p[2], 1]), H, { size: 2.2 });
  scene.add(lamps.mesh);
  // reflector posts on the median (foreground parallax) and distant traffic on the horizon
  const refN = 700;
  const refGeo = new THREE.BoxGeometry(0.1, 0.9, 0.1); refGeo.translate(0, 0.45, 0);
  const refl = new THREE.InstancedMesh(refGeo, new THREE.MeshBasicMaterial({ color: 0x0d0d0e }), refN);
  const refPts = [];
  for (let i = 0; i < refN; i++) { const z = -200 + i * 12; m4.makeTranslation(-2.4, 0, z); refl.setMatrixAt(i, m4); refPts.push([-2.4, 0.8, z, 0]); }
  scene.add(refl);
  const refLights = buildFlareCores(refPts, H, { size: 0.35 });
  scene.add(refLights.mesh);
  const farPts = [];
  const fr = rng(4711);
  for (let i = 0; i < 160; i++) farPts.push([-60 - fr() * 2500, 1.0, fr() * 6000, fr() < 0.5 ? 1 : 0]);
  const farLights = buildFlareCores(farPts, H, { size: 0.8 });
  scene.add(farLights.mesh);
  // boarding bay lamps
  const bayLamps = buildFlareCores([0, 1, 2, 3].map((i) => [18, 8, -30 + i * 20, 1]), H, { size: 3 });
  scene.add(bayLamps.mesh);

  // supporters at the boarding bay (static crowd + a few walking to the door)
  const atlas = fanAtlas({ cols: 8, seed: 4242 });
  const atlasBack = fanAtlas({ cols: 8, seed: 4343, back: true });
  const r = rng(77);
  const crowdPts = [];
  for (let i = 0; i < 70; i++) {
    const x = 16 + r() * 5.5, z = -1 + r() * 10;
    crowdPts.push([x, 0, z, Math.floor(r() * 8), r()]);
  }
  const crowd = buildCrowd(atlas, crowdPts, { lit: 0.42, bounce: 0.18, rim: 0.5 });
  crowd.mat.uniforms.rimColor.value.setRGB(1.0, 0.75, 0.55);
  scene.add(crowd.mesh);
  const flags = buildFlags(crowdPts.filter((_, i) => i % 9 === 0).map((p) => [p[0], 0.3, p[2], 0.7 + (p[4] * 0.4), p[4]]));
  scene.add(flags.mesh);
  // walkers: dynamic instances heading to the door
  const NW = 9;
  const walkers = [];
  for (let i = 0; i < NW; i++) walkers.push({ x0: 17 + r() * 4, z0: 1 + r() * 7, delay: i * 0.15, v: r() });
  const walkPts = walkers.map((w) => [w.x0, 0, w.z0, Math.floor(w.v * 8), w.v]);
  const walk = buildCrowd(atlasBack, walkPts, { lit: 0.42, bounce: 0.05, jumpRate: 3.0, rim: 0.5 });
  walk.mat.uniforms.rimColor.value.setRGB(1.0, 0.75, 0.55);
  scene.add(walk.mesh);
  const smoke = buildSmoke([[17, 1.6, 9, 0], [18, 1.6, -1, 0]], { count: 36, size: [2.5, 6], rise: 10, drift: 3, alpha: 0.12, colors: [new THREE.Color(0.6, 0.05, 0.04), new THREE.Color(0.5, 0.48, 0.48)] });
  scene.add(smoke.mesh);
  const cores = buildFlareCores([[17, 2.0, 9, 0], [18, 2.0, -1, 0]], H, { size: 2.5 });
  scene.add(cores.mesh);

  const holder = new THREE.Group();
  scene.add(holder);
  return {
    scene, camera, holder, sunDir,
    update(t, { door = new THREE.Vector3(22.7, 0, 4.25), board = 0, lot = 1 } = {}) {
      groundMat.uniforms.uTime.value = t; groundMat.uniforms.camPos.value.copy(camera.position); groundMat.uniforms.lot.value = lot;
      lamps.mat.uniforms.uTime.value = t; bayLamps.mat.uniforms.uTime.value = t; cores.mat.uniforms.uTime.value = t; refLights.mat.uniforms.uTime.value = t; farLights.mat.uniforms.uTime.value = t;
      smoke.mat.uniforms.uTime.value = t;
      crowd.update(t, camera.position); flags.update(t, camera.position); walk.update(t, camera.position);
      // walkers move toward the door and step up into the bus
      const attr = walk.mesh.geometry.attributes.ipos;
      walkers.forEach((w, i) => {
        const u = clamp((board - w.delay) / 0.9);
        const x = THREE.MathUtils.lerp(w.x0, door.x - 0.6, u), z = THREE.MathUtils.lerp(w.z0, door.z, u);
        const y = u > 0.85 ? (u - 0.85) / 0.15 * 0.9 : 0;
        attr.setXYZ(i, u >= 1 ? 9999 : x, y, z);
      });
      attr.needsUpdate = true;
    },
  };
}
