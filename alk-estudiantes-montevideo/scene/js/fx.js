// Shared particle effects: flare smoke (red / white), flare cores, papelitos confetti.
import * as THREE from 'three';
import { GLSL_NOISE } from './util.js';

const ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };

// emitters: [[x, y, z, colourIndex]] ; colours: array of THREE.Color
export function buildSmoke(emitters, { count = 220, size = [6, 16], rise = 34, drift = 6, colors, alpha = 0.42, rate = 0.09 } = {}) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const sp = new Float32Array(count * 3), info = new Float32Array(count * 4);
  let seed = 1;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < count; i++) {
    const e = emitters[i % emitters.length];
    sp.set([e[0] + (r() - 0.5) * 4, e[1], e[2] + (r() - 0.5) * 4], i * 3);
    info.set([e[3], r(), size[0] + r() * (size[1] - size[0]), r()], i * 4);
  }
  geo.setAttribute('ipos', new THREE.InstancedBufferAttribute(sp, 3));
  geo.setAttribute('info', new THREE.InstancedBufferAttribute(info, 4));
  geo.instanceCount = count;
  const cols = colors || [new THREE.Color(1.0, 0.08, 0.05), new THREE.Color(0.95, 0.92, 0.9)];
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, amt: { value: 1 }, c0: { value: cols[0] }, c1: { value: cols[1] }, glow: { value: 1 } },
    vertexShader: /* glsl */`attribute vec3 ipos; attribute vec4 info; uniform float uTime; varying vec2 vUv; varying float vCol, vA, vSeed;
      void main(){
        float life = fract(info.y + uTime * ${rate.toFixed(3)});
        float sz = info.z * (0.4 + life * 1.8);
        vec3 c = ipos + vec3(sin(info.w * 30.0 + uTime * 0.3) * ${drift.toFixed(1)} * life, life * ${rise.toFixed(1)}, cos(info.w * 20.0) * ${(drift * 0.8).toFixed(1)} * life);
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 w = (modelMatrix * vec4(c, 1.0)).xyz + (right * position.x + up * position.y) * sz * length(modelMatrix[0].xyz);
        vUv = uv; vCol = info.x; vSeed = info.w;
        vA = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.55, 1.0, life)) * smoothstep(10.0, 38.0, distance(cameraPosition, w));
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`uniform float amt, uTime, glow; uniform vec3 c0, c1; varying vec2 vUv; varying float vCol, vA, vSeed;
      void main(){
        vec2 q = vUv - 0.5;
        float n = fbm(q * 3.2 + vSeed * 17.0 + vec2(0.0, -uTime * 0.25));
        float a = (1.0 - smoothstep(0.15, 0.5, length(q) + (n - 0.5) * 0.42)) * vA * amt * ${alpha.toFixed(3)};
        vec3 col = vCol > 0.5 ? c1 : c0;
        vec3 c = col * (0.55 + 0.9 * n) * glow;
        gl_FragColor = vec4(c * a, a * 0.85);
      }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  return { mesh, mat };
}

export function buildFlareCores(points, H, { size = 3.5 } = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(points.flatMap((p) => [p[0], p[1], p[2]]), 3));
  g.setAttribute('col', new THREE.Float32BufferAttribute(points.map((p) => p[3]), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { scale: { value: H }, uTime: { value: 0 }, amt: { value: 1 } },
    vertexShader: `attribute float col; uniform float scale, uTime; varying float vC; varying float vF; void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
      vF = 0.75 + 0.25 * sin(uTime * 37.0 + position.x); gl_PointSize = clamp(scale * ${size.toFixed(2)} / -mv.z, 2.0, 120.0); }`,
    fragmentShader: `uniform float amt; varying float vC; varying float vF; void main(){ float r = length(gl_PointCoord - 0.5); float c = exp(-r * r * 60.0) * 3.0 + exp(-r * 7.0) * 0.4;
      vec3 col = vC > 0.5 ? vec3(1.0, 0.9, 0.85) : vec3(1.0, 0.18, 0.08); gl_FragColor = vec4(col * c * vF * 5.0 * amt, 1.0); }`, ...ADD,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  return { mesh: pts, mat };
}

// papelitos: half fall over a volume, half wrap around the camera so there is always paper near the lens
export function buildConfetti({ count = 6000, radius = [120, 100], height = 70, hazeGLSL = '', colors } = {}) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const cp = new Float32Array(count * 3), ci = new Float32Array(count * 4);
  let seed = 7;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < count; i++) {
    const th = r() * Math.PI * 2, rr = Math.sqrt(r());
    cp.set([Math.cos(th) * radius[0] * rr, r() * height, Math.sin(th) * radius[1] * rr], i * 3);
    const k = r();
    ci.set([k < 0.5 ? 0 : 1, r(), r(), r()], i * 4);
  }
  geo.setAttribute('ipos', new THREE.InstancedBufferAttribute(cp, 3));
  geo.setAttribute('info', new THREE.InstancedBufferAttribute(ci, 4));
  geo.instanceCount = count;
  const cols = colors || [new THREE.Color(0.95, 0.03, 0.05), new THREE.Color(1, 1, 1)];
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() }, camLocal: { value: new THREE.Vector3() }, haze: { value: 1 }, amt: { value: 1 }, c0: { value: cols[0] }, c1: { value: cols[1] } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 ipos; attribute vec4 info; uniform float uTime; uniform vec3 camLocal; uniform vec3 c0, c1; varying vec3 vC; varying float vGl; varying vec3 vW;
      void main(){
        float fall = 3.2 + info.y * 2.5;
        vec3 c = ipos;
        c.y = mod(ipos.y - uTime * fall, ${height.toFixed(1)}) + 2.0;
        if (info.w > 0.45) {
          vec3 box = vec3(56.0, 40.0, 56.0);
          vec3 rel = vec3(ipos.x * 0.47, ipos.y * 0.57 - uTime * fall, ipos.z * 0.56) - camLocal + box * 0.5;
          c = camLocal + mod(rel, box) - box * 0.5 + vec3(0.0, -6.0, 0.0);
        }
        c.x += sin(uTime * 1.7 + info.z * 40.0) * 1.2;
        c.z += cos(uTime * 1.3 + info.w * 40.0) * 1.2;
        float a = uTime * (4.0 + info.z * 6.0) + info.w * 10.0, b = uTime * (3.0 + info.y * 5.0) + info.z * 10.0;
        mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cos(a), sin(a), 0.0, -sin(a), cos(a));
        mat3 ry = mat3(cos(b), 0.0, -sin(b), 0.0, 1.0, 0.0, sin(b), 0.0, cos(b));
        vec3 n = ry * rx * vec3(0.0, 0.0, 1.0);
        vec3 w = (modelMatrix * vec4(c + ry * rx * (position * vec3(0.16, 0.11, 1.0)), 1.0)).xyz;
        vW = w;
        vC = info.x < 0.5 ? c0 : c1;
        vec3 V = normalize(cameraPosition - w);
        vGl = 0.35 + 1.6 * pow(abs(dot(n, normalize(vec3(0.2, 1.0, 0.3)))), 8.0) + 0.5 * abs(dot(n, V));
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: hazeGLSL + /* glsl */`uniform float amt; varying vec3 vC; varying float vGl; varying vec3 vW;
      vec3 hz(vec3 c, vec3 w){ ${hazeGLSL ? 'return inHaze(c, w);' : 'return c;'} }
      void main(){ gl_FragColor = vec4(hz(vC * vGl * 1.4, vW) * amt, 1.0); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  return { mesh, mat };
}
