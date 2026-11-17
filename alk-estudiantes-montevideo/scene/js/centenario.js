// Montevideo at night around Parque Batlle with the Estadio Centenario
// (Torre de los Homenajes, four floodlight masts) packed with Estudiantes fans.
import * as THREE from 'three';
import { GLSL_NOISE, rng } from './util.js';
import { buildStadiumKit } from './stadium.js';

export function buildCentenario(W, H) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, W / H, 0.5, 60000);
  const U = { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() } };

  const sky = new THREE.Mesh(new THREE.SphereGeometry(40000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_NOISE + `varying vec3 vDir; void main(){ vec3 d = normalize(vDir); float h = d.y;
      vec3 c = mix(vec3(0.035, 0.022, 0.03), vec3(0.002, 0.002, 0.005), smoothstep(0.0, 0.5, h));
      vec3 g = d * 300.0; float hs = hash13(floor(g)); c += vec3(0.85, 0.85, 0.9) * step(0.998, hs) * (1.0 - smoothstep(0.0, 0.1, length(fract(g) - 0.5))) * smoothstep(0.1, 0.5, h) * 0.4;
      gl_FragColor = vec4(c, 1.0); }`,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // city: scattered lights, winding avenues, the dark park around the stadium, the bay to the south-west
  const groundMat = new THREE.ShaderMaterial({
    uniforms: { ...U },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + /* glsl */`uniform float uTime; uniform vec3 camPos; varying vec3 vW;
      float lineCov(float x, float N, float w){ w = max(w, 1e-4); float a = x + 0.5 * w, b = x - 0.5 * w;
        return clamp((floor(a) + min(fract(a) * N, 1.0) - floor(b) - min(fract(b) * N, 1.0)) / (N * w), 0.0, 1.0); }
      vec3 dots(vec2 p, vec2 fw, float dens){
        vec3 acc = vec3(0.0); float px = max(fw.x, fw.y);
        for (int k = 0; k < 2; k++) {
          float S = k == 0 ? 10.0 : 26.0;
          vec2 q = p / S + float(k) * 13.7; vec2 cell = floor(q), f = fract(q) - 0.5; vec2 o = hash22(cell) - 0.5;
          float on = step(1.0 - dens * (k == 0 ? 0.8 : 0.55), hash12(cell + 7.1));
          float s0 = k == 0 ? 0.035 : 0.05; float sig2 = s0 * s0 + pow(px / S, 2.0) * 0.35;
          vec2 d = f - o * 0.7; float I = (s0 * s0 / sig2) * exp(-dot(d, d) / (2.0 * sig2));
          float h = hash12(cell + 3.3);
          vec3 col = h < 0.55 ? vec3(1.0, 0.6, 0.3) : (h < 0.85 ? vec3(1.0, 0.88, 0.72) : vec3(0.8, 0.9, 1.0));
          acc += col * I * on * (k == 0 ? 2.4 : 3.6);
        }
        // a grid of streets (Montevideo's blocks) slightly warped + avenues
        vec2 w = p + vec2(fbm(p * 0.0012) - 0.5, fbm(p * 0.0012 + 5.0) - 0.5) * 300.0;
        float st = lineCov(w.x / 90.0, 18.0, fw.x / 90.0) + lineCov(w.y / 90.0, 18.0, fw.y / 90.0);
        float av = lineCov(w.x / 720.0, 60.0, fw.x / 720.0) + lineCov(w.y / 640.0, 55.0, fw.y / 640.0);
        acc += vec3(1.0, 0.6, 0.25) * st * 0.9 * dens + vec3(1.0, 0.85, 0.65) * av * 2.2 * dens;
        return acc;
      }
      void main(){
        vec2 p = vW.xz; vec2 fw = fwidth(p);
        float r = length(p * vec2(1.0, 0.85));
        float park = 1.0 - smoothstep(330.0, 420.0, r);                 // Parque Batlle
        float dens = (0.55 + 0.45 * vnoise(p * 0.0007)) * (1.0 - park) * (1.0 - smoothstep(5500.0, 9000.0, length(p)));
        float bay = smoothstep(-200.0, 200.0, -(p.x + p.y * 0.6) - 2600.0);  // the bay / river to the south-west
        vec3 c = vec3(0.004, 0.005, 0.004);
        c += dots(p, fw, dens) * (1.0 - bay);
        c += vec3(0.008, 0.02, 0.01) * park * (0.6 + 0.6 * fbm(p * 0.05));       // trees
        vec3 water = vec3(0.004, 0.006, 0.012) + vec3(0.25, 0.1, 0.08) * pow(1.0 - abs(normalize(camPos - vW).y), 6.0) * 0.4;
        c = mix(c, water, bay);
        // red / white spill of the stadium
        c += vec3(0.5, 0.06, 0.05) * exp(-r / 160.0) * 0.25;
        float dist = length(camPos - vW);
        c = mix(c, vec3(0.03, 0.02, 0.025), 1.0 - exp(-dist * 0.00011));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000).rotateX(-Math.PI / 2), groundMat));

  // buildings around the park (incl. a big hospital-like block to the north-east)
  const r = rng(1930);
  const boxes = [];
  for (let i = 0; i < 1400; i++) {
    const a = r() * Math.PI * 2, d = 430 + Math.pow(r(), 0.7) * 2600;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (-(x + z * 0.6) - 2600 > -150) continue;
    boxes.push([x, z, 14 + r() * 20, 14 + r() * 20, 10 + Math.pow(r(), 2.2) * 70, r(), (r() - 0.5) * 0.4]);
  }
  boxes.push([330, -420, 110, 34, 92, 0.3, 0.2]);
  const bMat = new THREE.ShaderMaterial({
    uniforms: { ...U },
    vertexShader: `attribute float seed; varying vec3 vW; varying vec3 vN; varying float vSeed; void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal); vSeed = seed; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + `uniform vec3 camPos; varying vec3 vW; varying vec3 vN; varying float vSeed;
      void main(){ vec3 n = normalize(vN); vec3 c;
        if (n.y > 0.5) c = vec3(0.01); else {
          vec2 td = normalize(vec2(-n.z, n.x)); vec2 f = vec2(dot(vW.xz, td), vW.y); vec2 g = f / vec2(3.4, 3.1); vec2 id = floor(g), uv = fract(g); vec2 fwg = fwidth(g);
          float win = step(0.15, uv.x) * step(uv.x, 0.85) * step(0.25, uv.y) * step(uv.y, 0.85);
          float lit = step(0.66, hash12(id + vSeed * 31.0 + n.xz * 7.0));
          vec3 lc = mix(vec3(1.0, 0.65, 0.38), vec3(1.0, 0.9, 0.78), hash12(id * 1.3)) * (0.6 + 1.4 * hash12(id + 2.0));
          c = vec3(0.006, 0.006, 0.008) + lc * win * lit * 1.1;
          c = mix(c, vec3(0.006) + vec3(1.0, 0.75, 0.5) * 0.07, smoothstep(0.45, 1.3, max(fwg.x, fwg.y)));
          c += vec3(0.4, 0.04, 0.03) * exp(-length(vW.xz) / 260.0) * 0.5;
        }
        float dist = length(camPos - vW); c = mix(c, vec3(0.03, 0.02, 0.025), 1.0 - exp(-dist * 0.00011));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const bGeo = new THREE.BoxGeometry(1, 1, 1); bGeo.translate(0, 0.5, 0);
  const seeds = new Float32Array(boxes.length);
  const bm = new THREE.InstancedMesh(bGeo, bMat, boxes.length);
  const m4 = new THREE.Matrix4();
  boxes.forEach((b, i) => { m4.compose(new THREE.Vector3(b[0], 0, b[1]), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), b[6]), new THREE.Vector3(b[2], b[4], b[3])); bm.setMatrixAt(i, m4); seeds[i] = b[5]; });
  bGeo.setAttribute('seed', new THREE.InstancedBufferAttribute(seeds, 1));
  bm.frustumCulled = false;
  scene.add(bm);

  const kit = buildStadiumKit(H, { variant: 'centenario', seed: 11 });
  scene.add(kit.group);

  return {
    scene, camera, kit,
    update(t, s = {}) {
      camera.updateMatrixWorld();
      U.uTime.value = t; U.camPos.value.copy(camera.position);
      groundMat.uniforms.camPos.value.copy(camera.position); bMat.uniforms.camPos.value.copy(camera.position);
      kit.update(t, camera.position, { smokeAmt: s.smoke ?? 1, confAmt: s.confetti ?? 1 });
      const h = camera.position.y;
      camera.near = Math.min(Math.max(h * 0.004, 0.3), 50);
      camera.updateProjectionMatrix();
    },
  };
}
