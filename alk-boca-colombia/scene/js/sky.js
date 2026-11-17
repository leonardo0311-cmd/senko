// Night sky above a moonlit cloud deck (cruise shots). Units: metres.
import * as THREE from 'three';
import { GLSL_NOISE, rng } from './util.js';

export function buildSky(W, H) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.2, 200000);
  const moonDir = new THREE.Vector3(-0.55, 0.32, -0.75).normalize();

  const dome = new THREE.Mesh(new THREE.SphereGeometry(150000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { moonDir: { value: moonDir } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_NOISE + /* glsl */`uniform vec3 moonDir; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 c = mix(vec3(0.03, 0.06, 0.16), vec3(0.003, 0.008, 0.03), smoothstep(-0.05, 0.6, h));
        float m = max(dot(d, moonDir), 0.0);
        c += vec3(0.25, 0.35, 0.6) * pow(m, 30.0) * 0.6 + vec3(0.1, 0.16, 0.32) * pow(m, 4.0) * 0.25;
        c += vec3(1.0, 0.97, 0.9) * smoothstep(0.99955, 0.9997, m) * 6.0;
        vec3 g = d * 360.0; float hs = hash13(floor(g));
        c += vec3(0.85, 0.9, 1.0) * step(0.997, hs) * (1.0 - smoothstep(0.0, 0.12, length(fract(g) - 0.5))) * smoothstep(0.05, 0.4, h) * (0.4 + fract(hs * 77.0));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  dome.renderOrder = -10; dome.frustumCulled = false;
  scene.add(dome);

  const cloudMat = new THREE.ShaderMaterial({
    uniforms: { off: { value: new THREE.Vector2() }, moonDir: { value: moonDir }, camPos: { value: new THREE.Vector3() }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + /* glsl */`uniform vec2 off; uniform vec3 moonDir, camPos; uniform float uTime; varying vec3 vW;
      float dens(vec2 p){ return fbm(p * 0.00055 + off * 0.00055) * 0.7 + fbm(p * 0.0021 + off * 0.0021 + 3.0) * 0.3; }
      void main(){
        vec2 p = vW.xz;
        float d = dens(p);
        float e = 22.0;
        float dx = dens(p + vec2(e, 0.0)) - d, dz = dens(p + vec2(0.0, e)) - d;
        vec3 n = normalize(vec3(-dx * 900.0, 1.0, -dz * 900.0));
        float lit = clamp(dot(n, moonDir) * 0.6 + 0.4, 0.0, 1.0);
        float cov = smoothstep(0.38, 0.62, d);
        vec3 top = mix(vec3(0.012, 0.022, 0.05), vec3(0.16, 0.22, 0.36), lit * lit) * (0.5 + 0.8 * d);
        // city glows bleeding through thin cloud
        float city = smoothstep(0.62, 0.9, fbm(p * 0.00011 + 9.0 + off * 0.00011));
        vec3 under = vec3(0.012, 0.016, 0.03) + vec3(0.5, 0.26, 0.08) * city * 0.25;
        vec3 c = mix(under, top, cov);
        float dist = length(camPos - vW);
        c = mix(c, vec3(0.03, 0.05, 0.12), 1.0 - exp(-dist * 0.000045));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(300000, 300000).rotateX(-Math.PI / 2), cloudMat);
  clouds.position.y = -420;
  scene.add(clouds);

  // wisps close to the camera for parallax / speed
  const N = 70;
  const wp = new Float32Array(N * 3), ws = new Float32Array(N);
  const rnd = rng(2027);   // deterministic: every render worker must see the same wisps
  for (let i = 0; i < N; i++) {
    wp.set([(rnd() - 0.5) * 260, -40 + rnd() * 120, -rnd() * 1600], i * 3);
    ws[i] = 30 + rnd() * 70;
  }
  const wGeo = new THREE.BufferGeometry();
  wGeo.setAttribute('position', new THREE.BufferAttribute(wp, 3));
  wGeo.setAttribute('sz', new THREE.BufferAttribute(ws, 1));
  const wMat = new THREE.ShaderMaterial({
    uniforms: { scroll: { value: 0 }, scale: { value: H }, amt: { value: 1 } },
    vertexShader: /* glsl */`attribute float sz; uniform float scroll, scale; varying float vA; varying vec2 vSeed;
      void main(){ vec3 p = position; p.z = mod(p.z + scroll, 1600.0) - 1400.0; vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv; gl_PointSize = clamp(scale * sz / -mv.z, 1.0, 900.0); vA = smoothstep(-1400.0, -1000.0, p.z) * (1.0 - smoothstep(100.0, 200.0, p.z)); vSeed = position.xy; }`,
    fragmentShader: GLSL_NOISE + `uniform float amt; varying float vA; varying vec2 vSeed; void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q);
      float n = fbm(q * 3.0 + vSeed * 0.1); float a = (1.0 - smoothstep(0.1, 0.5, r + (n - 0.5) * 0.35)) * vA * amt * 0.16;
      gl_FragColor = vec4(vec3(0.16, 0.22, 0.36) * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const wisps = new THREE.Points(wGeo, wMat);
  wisps.frustumCulled = false;
  scene.add(wisps);

  const planeHolder = new THREE.Group();
  scene.add(planeHolder);

  return {
    scene, camera, moonDir, planeHolder, cloudMat,
    update(t, { speed = 240, wispAmt = 1 } = {}) {
      cloudMat.uniforms.off.value.set(0, -t * speed);
      cloudMat.uniforms.camPos.value.copy(camera.position);
      wMat.uniforms.scroll.value = t * speed * 1.0;
      wMat.uniforms.amt.value = wispAmt;
    },
  };
}
