// High-speed wave-piercing catamaran (≈99 m, Incat-style, like Buquebus'
// "Francisco") crossing the Río de la Plata at sunset: animated water with sky
// reflections, sun glitter, hull wakes, Kelvin wake and waterjet spray, plus the
// Buenos Aires skyline on the horizon. Model axes: +z = bow, +y = up. Metres.
import * as THREE from 'three';
import { GLSL_NOISE, rng } from './util.js';
import { buildFlareCores } from './fx.js';

const ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };

const SKY = /* glsl */`
uniform vec3 sunDir;
vec3 skyCol(vec3 d){
  float h = d.y;
  float s = max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(sunDir.x, 0.0, sunDir.z))), 0.0);
  vec3 zen = vec3(0.006, 0.008, 0.025), mid = vec3(0.07, 0.03, 0.06);
  vec3 hor = mix(vec3(0.05, 0.035, 0.07), vec3(1.35, 0.34, 0.07), pow(s, 3.0));
  vec3 c = mix(hor, mid, smoothstep(0.0, 0.12, h));
  c = mix(c, zen, smoothstep(0.08, 0.6, h));
  float sd = max(dot(d, sunDir), 0.0);
  c += vec3(1.0, 0.45, 0.15) * pow(sd, 18.0) * 1.2 + vec3(1.0, 0.7, 0.4) * pow(sd, 900.0) * 30.0;
  return c;
}`;

const LIGHT = /* glsl */`
uniform vec3 keyDir, keyColor, fillColor;
vec3 shade(vec3 base, float rough, vec3 N, vec3 V){
  vec3 Lk = normalize(keyDir);
  float ndl = max(dot(N, Lk), 0.0);
  vec3 H = normalize(Lk + V);
  float sp = pow(max(dot(N, H), 0.0), mix(140.0, 10.0, rough)) * mix(1.4, 0.2, rough);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 amb = fillColor * (0.6 + 0.4 * N.y);
  return base * (keyColor * ndl + amb) + keyColor * sp * ndl + skyCol(reflect(-V, N)) * fres * (1.0 - rough * 0.7) * 0.7;
}`;

function planShape(pts) { const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z))); return s; }
function extrude(shape, y0, h, bevel = 0.4) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  g.computeVertexNormals();
  return g;
}
// rounded-front deck outline
function deckOutline(halfW, zBack, zFront, frontR) {
  const pts = [[-halfW, zBack], [halfW, zBack], [halfW, zFront - frontR]];
  for (let i = 1; i < 24; i++) { const a = (i / 24) * Math.PI; pts.push([Math.cos(a) * halfW, zFront - frontR + Math.sin(a) * frontR]); }
  pts.push([-halfW, zFront - frontR]);
  return planShape(pts);
}

export function buildFerry() {
  const group = new THREE.Group();
  const common = {
    sunDir: { value: new THREE.Vector3() }, keyDir: { value: new THREE.Vector3() }, keyColor: { value: new THREE.Color(1.2, 0.5, 0.25) },
    fillColor: { value: new THREE.Color(0.16, 0.08, 0.1) }, uTime: { value: 0 },
  };
  const VS = `varying vec3 vP; varying vec3 vW; varying vec3 vWN; varying vec3 vN;
    void main(){ vP = position; vN = normal; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vWN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
  const mat = (frag, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...common, ...extra }, vertexShader: VS, fragmentShader: GLSL_NOISE + SKY + LIGHT + frag });

  // hull: white, navy waterline stripe, Buquebus-style swoosh (blue wave, orange arc, green tip) on the aft quarter
  const hullMat = mat(/* glsl */`varying vec3 vP; varying vec3 vW; varying vec3 vWN; varying vec3 vN;
    void main(){
      vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW);
      vec3 n = normalize(vN);
      vec3 base = vec3(0.86, 0.86, 0.87);
      float y = vP.y, z = vP.z;
      float aa = fwidth(y) * 1.5 + 0.01;
      base = mix(base, vec3(0.02, 0.06, 0.32), 1.0 - smoothstep(1.35 - aa, 1.35 + aa, y));          // navy boot stripe
      if (abs(n.x) > 0.5 && y > 1.6) {
        vec2 q = vec2(z + 16.0, y - 1.2);                                                           // swoosh space
        float wave = step(q.y, 3.4 + 2.6 * sin(clamp(q.x / 9.0, -1.6, 1.6))) * step(-14.0, q.x) * step(q.x, 10.0) * step(1.8 - q.x * 0.08, q.y);
        float r = length(q - vec2(3.0, -2.0));
        float arc = smoothstep(7.6, 7.75, r) * (1.0 - smoothstep(9.0, 9.15, r)) * step(-1.0, q.x) * step(0.4, q.y);
        float green = smoothstep(4.0, 4.1, length(q - vec2(-6.0, 1.0))) * (1.0 - smoothstep(4.9, 5.0, length(q - vec2(-6.0, 1.0)))) * step(q.x, -6.0) * step(2.0, q.y);
        base = mix(base, vec3(0.03, 0.2, 0.62), wave);
        base = mix(base, vec3(0.98, 0.62, 0.05), arc);
        base = mix(base, vec3(0.1, 0.55, 0.25), green * (1.0 - wave));
      }
      vec3 c = shade(base, 0.32, N, V);
      gl_FragColor = vec4(c, 1.0);
    }`);
  // demihulls (lower, pointed wave-piercing bows)
  for (const sx of [-1, 1]) {
    const hw = 2.6, cx = sx * 10.6;
    const s = planShape([[cx - hw, -49.5], [cx + hw, -49.5], [cx + hw, 30], [cx + hw * 0.5, 44], [cx, 49.5], [cx - hw * 0.5, 44], [cx - hw, 30]]);
    group.add(new THREE.Mesh(extrude(s, -1.2, 3.6, 0.25), hullMat));
  }
  // cross structure (main hull above the tunnel) with a pointed centre bow
  const cross = planShape([[-13.4, -49.5], [13.4, -49.5], [13.4, 30], [11.0, 40], [5.0, 44.5], [0, 46.5], [-5.0, 44.5], [-11.0, 40], [-13.4, 30]]);
  group.add(new THREE.Mesh(extrude(cross, 2.6, 5.8, 0.5), hullMat));
  // tunnel underside (dark)
  const tunnel = new THREE.Mesh(new THREE.PlaneGeometry(16, 88).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x030405 }));
  tunnel.position.set(0, 2.55, -4); group.add(tunnel);

  // superstructure decks with the wrap-around dark window band
  const deckMat = (yMin, yMax, lit) => mat(/* glsl */`uniform float wy0, wy1, lit; varying vec3 vP; varying vec3 vW; varying vec3 vWN; varying vec3 vN;
    void main(){
      vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW); vec3 n = normalize(vN);
      float y = vP.y; float aa = fwidth(y) * 1.5 + 0.01;
      float band = smoothstep(wy0 - aa, wy0 + aa, y) * (1.0 - smoothstep(wy1 - aa, wy1 + aa, y)) * (1.0 - step(0.6, n.y));
      vec3 base = vec3(0.87, 0.87, 0.88);
      vec3 c = shade(base, 0.3, N, V);
      if (band > 0.0) {
        float fres = 0.08 + 0.92 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
        float mull = 1.0 - 0.4 * step(0.93, fract(vP.z / 2.4 + vP.x / 2.4));
        vec3 inside = vec3(1.0, 0.72, 0.45) * 0.035 * lit * mull;
        vec3 g = vec3(0.004, 0.005, 0.007) + inside * (1.0 - fres) + skyCol(reflect(-V, N)) * fres * 0.55;
        c = mix(c, g, band);
      }
      gl_FragColor = vec4(c, 1.0);
    }`, { wy0: { value: yMin }, wy1: { value: yMax }, lit: { value: lit } });
  group.add(new THREE.Mesh(extrude(deckOutline(12.7, -44, 32, 11.5), 8.4, 5.2, 0.45), deckMat(9.6, 12.7, 1.0)));
  group.add(new THREE.Mesh(extrude(deckOutline(8.2, -12, 23, 7.6), 13.6, 3.6, 0.4), deckMat(14.5, 16.6, 0.7)));
  // sun deck rail line + small aft deckhouse
  group.add(new THREE.Mesh(extrude(deckOutline(10.5, -44, -14, 3), 13.6, 1.4, 0.2), deckMat(99, 99, 0)));
  // exhaust stacks (tilted, gold-beige) and the mast
  const stackMat = mat(`varying vec3 vP; varying vec3 vW; varying vec3 vWN; varying vec3 vN; void main(){ vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vW);
    gl_FragColor = vec4(shade(vec3(0.62, 0.52, 0.34), 0.35, N, V), 1.0); }`);
  for (const sx of [-1, 1]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 9, 20), stackMat);
    st.scale.set(1, 1, 1.5); st.position.set(sx * 9.6, 18.0, -37); st.rotation.x = -0.32;
    group.add(st);
  }
  const mastMat = new THREE.MeshBasicMaterial({ color: 0x9a9a9c });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 9, 8), mastMat); mast.position.set(0, 21.6, 8); group.add(mast);
  const radar = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 8), mastMat); radar.position.set(0, 25.2, 8); group.add(radar);
  // navigation / deck lights
  const lights = buildFlareCores([[13.6, 9.2, 28, 0], [-13.6, 9.2, 28, 1], [0, 26.2, 8, 1], [0, 8.6, -49.8, 1]], 1000, { size: 0.9 });
  group.add(lights.mesh);

  return {
    group,
    setLight({ sunDir, keyColor, fillColor }) {
      for (const m of [hullMat, stackMat]) { m.uniforms.sunDir.value.copy(sunDir); m.uniforms.keyDir.value.copy(sunDir); if (keyColor) m.uniforms.keyColor.value.copy(keyColor); if (fillColor) m.uniforms.fillColor.value.copy(fillColor); }
      group.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.keyDir) { o.material.uniforms.sunDir.value.copy(sunDir); o.material.uniforms.keyDir.value.copy(sunDir); if (keyColor) o.material.uniforms.keyColor.value.copy(keyColor); if (fillColor) o.material.uniforms.fillColor.value.copy(fillColor); } });
    },
    update(t, H) { lights.mat.uniforms.uTime.value = t; lights.mat.uniforms.scale.value = H; },
  };
}

export function buildRiver(W, H) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.5, 60000);
  const sunDir = new THREE.Vector3(-0.22, 0.045, -1).normalize();   // sunset behind the ship (west), ship sails east (+z)
  const sky = new THREE.Mesh(new THREE.SphereGeometry(40000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { sunDir: { value: sunDir } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_NOISE + SKY + `varying vec3 vDir; void main(){ vec3 d = normalize(vDir); vec3 c = skyCol(d);
      float cl = smoothstep(0.5, 0.82, fbm(vec2(atan(d.z, d.x) * 4.0, d.y * 18.0)));
      float s = max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(sunDir.x, 0.0, sunDir.z))), 0.0);
      c = mix(c, vec3(0.5, 0.12, 0.06) * pow(s, 2.0) + vec3(0.03, 0.01, 0.02), cl * smoothstep(0.015, 0.06, d.y) * (1.0 - smoothstep(0.15, 0.35, d.y)));
      if (d.y < 0.0) c = skyCol(vec3(d.x, 0.001, d.z)) * 0.3;
      gl_FragColor = vec4(c, 1.0); }`,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // Buenos Aires skyline on the western horizon (silhouette with tiny lights)
  const sky2 = [];
  const rr = rng(1580);
  for (let i = 0; i < 90; i++) sky2.push([(rr() - 0.5) * 9000, 60 + Math.pow(rr(), 2) * 320, 30 + rr() * 90]);
  const skyline = new THREE.Group();
  const silMat = new THREE.MeshBasicMaterial({ color: 0x0c0507 });
  sky2.forEach(([x, h, w]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), silMat); b.position.set(x, h / 2 - 5, 0); skyline.add(b); });
  skyline.position.set(-900, 0, -15000);
  scene.add(skyline);
  const cityL = buildFlareCores(sky2.flatMap(([x, h]) => [[x - 900, h * 0.6, -14990, 1], [x - 905, h * 0.3, -14990, 0]]), H, { size: 6 });
  scene.add(cityL.mesh);

  const waterMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() }, sunDir: { value: sunDir }, speed: { value: 19.5 }, shipZ: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + SKY + /* glsl */`uniform float uTime, speed, shipZ; uniform vec3 camPos; varying vec3 vW;
      float hgt(vec2 p){
        float h = 0.0;
        h += sin(dot(p, vec2(0.08, 0.06)) + uTime * 1.1) * 0.55;
        h += sin(dot(p, vec2(-0.11, 0.09)) + uTime * 1.6) * 0.22;
        h += sin(dot(p, vec2(0.21, -0.17)) + uTime * 2.3) * 0.1;
        h += (fbm(p * 0.09 + vec2(uTime * 0.05, uTime * 0.11)) - 0.5) * 1.1 + (fbm(p * 0.45 - uTime * 0.2) - 0.5) * 0.35;
        return h;
      }
      void main(){
        vec2 w = vW.xz;
        vec2 p = w + vec2(0.0, speed * uTime);                  // water flows past the ship
        float dist = length(camPos - vW);
        float lod = clamp(dist / 900.0, 0.0, 1.0);
        float e = 0.6;
        float hc = hgt(p);
        vec3 n = normalize(vec3(-(hgt(p + vec2(e, 0.0)) - hc) / e * (1.0 - lod * 0.8), 1.0, -(hgt(p + vec2(0.0, e)) - hc) / e * (1.0 - lod * 0.8)));
        vec3 V = normalize(camPos - vW);
        vec3 R = reflect(-V, n);
        R.y = abs(R.y);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
        vec3 deep = vec3(0.006, 0.012, 0.022);
        vec3 c = mix(deep, skyCol(R), fres);
        c += vec3(1.0, 0.6, 0.3) * pow(max(dot(R, sunDir), 0.0), 350.0) * 18.0;   // glitter
        // ---- wakes (ship frame: stern at z = -49.5, hulls at x = +-10.6) ----
        vec2 s = vec2(w.x, w.y - shipZ);
        float behind = -s.y - 49.5;
        float foam = 0.0;
        float fn = fbm(p * 0.35) * 0.7 + fbm(p * 1.4) * 0.3;
        if (behind > -4.0) {
          float spread = 3.0 + behind * 0.09;
          float jets = exp(-pow((abs(s.x) - 10.6) / spread, 2.0)) * exp(-max(behind, 0.0) / 900.0);
          float churn = exp(-pow(s.x / (8.0 + behind * 0.12), 2.0)) * exp(-max(behind, 0.0) / 420.0) * 0.8;
          float kel = abs(abs(s.x) - (13.0 + max(behind, 0.0) * 0.354));
          float kelvin = exp(-kel * kel / (2.0 + behind * 0.02)) * exp(-max(behind, 0.0) / 1400.0) * 0.6;
          foam = max(max(jets, churn), kelvin) * smoothstep(-4.0, 6.0, behind);
        }
        // bow waves + hull-side foam
        float side = exp(-pow((abs(s.x) - 13.6) / 1.4, 2.0)) * step(-49.5, s.y) * step(s.y, 47.0) * (0.4 + 0.6 * smoothstep(20.0, 46.0, s.y));
        float bow = exp(-length(vec2(abs(s.x) - 10.6, s.y - 48.0)) / 4.0);
        foam = max(foam, max(side * 0.8, bow));
        foam *= smoothstep(0.25, 0.75, fn + foam * 0.5);
        c = mix(c, vec3(0.92, 0.8, 0.75) * (0.55 + 0.45 * max(dot(n, normalize(vec3(sunDir.x, 0.6, sunDir.z))), 0.0)) * 0.9, clamp(foam, 0.0, 1.0));
        c = mix(c, skyCol(normalize(vec3(-V.x, 0.0, -V.z))) * 0.9, 1.0 - exp(-dist * 0.00012));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000).rotateX(-Math.PI / 2), waterMat));

  // waterjet spray ("rooster tails") behind the stern
  const NS = 500;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const info = new Float32Array(NS * 4);
  const r = rng(99);
  for (let i = 0; i < NS; i++) info.set([r() < 0.5 ? -1 : 1, r(), r(), r()], i * 4);
  geo.setAttribute('info', new THREE.InstancedBufferAttribute(info, 4));
  geo.instanceCount = NS;
  const sprayMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, sunDir: { value: sunDir } },
    vertexShader: /* glsl */`attribute vec4 info; uniform float uTime; varying vec2 vUv; varying float vA;
      void main(){
        float life = fract(info.y + uTime * 0.7);
        vec3 c = vec3(info.x * (10.6 + (info.z - 0.5) * 3.0), 1.5 + life * 7.0 * (1.0 - life) * 2.2, -51.0 - life * 55.0);
        c.x += info.x * life * 4.0;
        float sz = 2.5 + life * 9.0;
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 w = (modelMatrix * vec4(c, 1.0)).xyz + (right * position.x + up * position.y) * sz;
        vUv = uv; vA = (1.0 - life) * smoothstep(0.0, 0.08, life);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: GLSL_NOISE + `uniform float uTime; varying vec2 vUv; varying float vA; void main(){ vec2 q = vUv - 0.5; float n = fbm(q * 4.0 + vA * 3.0);
      float a = (1.0 - smoothstep(0.1, 0.5, length(q) + (n - 0.5) * 0.4)) * vA * 0.22;
      vec3 c = vec3(1.0, 0.82, 0.72) * (0.6 + 0.5 * n);
      gl_FragColor = vec4(c * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const spray = new THREE.Mesh(geo, sprayMat); spray.frustumCulled = false;

  const ferry = buildFerry();
  ferry.group.add(spray);
  scene.add(ferry.group);
  ferry.setLight({ sunDir, keyColor: new THREE.Color(1.15, 0.72, 0.5), fillColor: new THREE.Color(0.17, 0.16, 0.21) });

  return {
    scene, camera, ferry, sunDir,
    update(t) {
      waterMat.uniforms.uTime.value = t; waterMat.uniforms.camPos.value.copy(camera.position);
      sprayMat.uniforms.uTime.value = t;
      cityL.mat.uniforms.uTime.value = t;
      ferry.update(t, H);
      for (const o of [ferry.group]) o.traverse((m) => { if (m.material && m.material.uniforms && m.material.uniforms.uTime) m.material.uniforms.uTime.value = t; });
    },
  };
}
