// Procedural painters for Estudiantes de La Plata supporters: red-and-white
// striped jerseys, scarves and red-white-red flags. No crests or logos are drawn.
import * as THREE from 'three';
import { rng } from './util.js';

export const RED = '#e30613', RED_D = '#a8000f', WHITE = '#f4f4f4', WHITE_D = '#cfcfcf', DARK = '#171717';
const SKIN = ['#f1c7a3', '#e0ac85', '#c98f68', '#a8714f', '#8a5a3c', '#f5d2b5', '#d79d78'];
const HAIR = ['#1b1210', '#2a1a12', '#3b2618', '#120c0a', '#5a3b22', '#0d0d0d'];

// one supporter, waist at (x, y), height h (pixels). pose: 0 arms up, 1 arms mid, 2 one arm up.
// opts.back: seen from behind (no face). opts.jersey: 'home' | 'red' | 'white' | 'dark'
export function drawFan(ctx, x, y, h, r, pose, opts = {}) {
  const s = h / 100;
  const skin = SKIN[Math.floor(r() * SKIN.length)];
  const hair = HAIR[Math.floor(r() * HAIR.length)];
  const kind = r();
  const jersey = opts.jersey || (kind < 0.7 ? 'home' : (kind < 0.82 ? 'red' : (kind < 0.92 ? 'white' : 'dark')));
  const scarf = r() < 0.55, flag = !scarf && r() < 0.4;
  const back = !!opts.back;
  const lean = (r() - 0.5) * 6 * s;
  ctx.save();
  ctx.translate(x + lean, y);
  const body = jersey === 'red' ? RED : (jersey === 'white' ? WHITE : (jersey === 'dark' ? '#1d1d1f' : WHITE));
  const sleeve = jersey === 'dark' ? '#141416' : (jersey === 'white' ? WHITE_D : RED_D);
  const tw = 26 * s * (0.9 + r() * 0.25);
  const torso = () => {
    ctx.beginPath();
    ctx.moveTo(-tw, -60 * s); ctx.quadraticCurveTo(-tw - 2 * s, -30 * s, -tw * 0.8, -6 * s);
    ctx.lineTo(tw * 0.8, -6 * s); ctx.quadraticCurveTo(tw + 2 * s, -30 * s, tw, -60 * s);
    ctx.quadraticCurveTo(0, -68 * s, -tw, -60 * s);
  };
  ctx.fillStyle = body; torso(); ctx.fill();
  if (jersey === 'home') { // vertical red and white stripes
    ctx.save(); torso(); ctx.clip();
    const n = 7, sw = (tw * 2.2) / n;
    for (let i = 0; i < n; i++) if (i % 2 === 0) { ctx.fillStyle = RED; ctx.fillRect(-tw * 1.1 + i * sw, -70 * s, sw, 70 * s); }
    ctx.restore();
  } else if (jersey === 'white') {
    ctx.save(); torso(); ctx.clip(); ctx.fillStyle = RED; ctx.fillRect(-tw * 1.2, -62 * s, tw * 2.4, 6 * s); ctx.restore();
  }
  const g = ctx.createLinearGradient(-tw, 0, tw, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(0.45, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g; torso(); ctx.globalCompositeOperation = 'source-atop'; ctx.fill(); ctx.globalCompositeOperation = 'source-over';

  const arm = (side, ang, bend) => {
    ctx.save();
    ctx.translate(side * tw * 0.85, -56 * s);
    ctx.rotate(ang);
    ctx.fillStyle = sleeve; ctx.fillRect(-5 * s, -18 * s, 10 * s, 18 * s);
    ctx.fillStyle = skin; ctx.translate(0, -18 * s); ctx.rotate(bend);
    ctx.fillRect(-4 * s, -20 * s, 8 * s, 20 * s);
    ctx.beginPath(); ctx.arc(0, -22 * s, 5 * s, 0, 7); ctx.fill();
    ctx.restore();
  };
  const up = pose === 0, mid = pose === 1;
  const aL = up ? -2.65 : (mid ? -2.1 : -0.35), aR = up ? 2.65 : (mid ? 2.1 : 2.75);
  arm(-1, aL + (r() - 0.5) * 0.2, up ? 0.15 : (mid ? 0.6 : 0.2));
  arm(1, aR + (r() - 0.5) * 0.2, up ? -0.15 : (mid ? -0.6 : -0.1));

  ctx.fillStyle = skin;
  ctx.fillRect(-5 * s, -70 * s, 10 * s, 10 * s);
  ctx.beginPath(); ctx.ellipse(0, -80 * s, 10.5 * s, 12.5 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = hair;
  if (back) { // back of the head: hair covers it
    ctx.beginPath(); ctx.ellipse(0, -81 * s, 11 * s, 12.8 * s, 0, 0, 7); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(0, -86 * s, 11 * s, 8 * s, 0, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(40,10,10,0.8)';
    ctx.beginPath(); ctx.ellipse(0, -74 * s, 3 * s, 3.2 * s, 0, 0, 7); ctx.fill();
  }
  if (r() < 0.25) { ctx.fillStyle = r() < 0.5 ? RED : WHITE; ctx.fillRect(-11 * s, -91 * s, 22 * s, 6 * s); } // cap / headband

  if (scarf && pose !== 2) { // red-white scarf above the head
    const yS = up ? -118 * s : -98 * s, w = up ? 44 * s : 52 * s;
    ctx.save(); ctx.translate(0, yS); ctx.rotate((r() - 0.5) * 0.25);
    const n = 7;
    for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? WHITE : RED; ctx.fillRect(-w + (2 * w / n) * i, -6 * s, 2 * w / n + 0.5, 12 * s); }
    ctx.fillStyle = WHITE_D;
    for (let i = 0; i < 6; i++) { ctx.fillRect(-w - 4 * s, -5 * s + i * 2 * s, 4 * s, 1 * s); ctx.fillRect(w, -5 * s + i * 2 * s, 4 * s, 1 * s); }
    ctx.restore();
  }
  if (flag) { // red-white-red flag on a short pole
    ctx.save(); ctx.translate(tw * 0.9, -110 * s); ctx.rotate(0.25 + (r() - 0.5) * 0.3);
    ctx.fillStyle = '#ddd'; ctx.fillRect(-1 * s, 0, 2 * s, 60 * s);
    const fw = 48 * s, fh = 30 * s;
    ctx.fillStyle = RED; ctx.fillRect(1 * s, 0, fw, fh);
    ctx.fillStyle = WHITE; ctx.fillRect(1 * s, fh / 3, fw, fh / 3);
    ctx.restore();
  }
  ctx.restore();
}

// atlas of `cols` people x 3 poses; returns { tex, cols, rows }
export function fanAtlas({ cols = 8, back = false, seed = 5000, jerseyOf = null } = {}) {
  const rows = 3, cw = 96, ch = 160;
  const c = document.createElement('canvas');
  c.width = cols * cw; c.height = rows * ch;
  const ctx = c.getContext('2d');
  for (let v = 0; v < cols; v++) for (let p = 0; p < rows; p++) {
    ctx.save();
    ctx.beginPath(); ctx.rect(v * cw, p * ch, cw, ch); ctx.clip();
    const seeded = rng(seed + v * 31);
    drawFan(ctx, v * cw + cw / 2, p * ch + ch * 0.99, ch * 0.78, seeded, p, { back, jersey: jerseyOf ? jerseyOf(v) : undefined });
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  return { tex, cols, rows };
}

// Billboard crowd (instanced quads) — positions: array of [x, y, z, variant, phase]
// Supports a back-light rim (silhouettes against a bright stadium / flare glow).
export function buildCrowd(atlas, people, { height = 1.75, hazeGLSL = '', rim = 0, lit = 1.0, bounce = 0.3, jumpRate = 8.0 } = {}) {
  const N = people.length;
  const qGeo = new THREE.InstancedBufferGeometry();
  qGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  qGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  qGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const ip = new Float32Array(N * 3), iv = new Float32Array(N * 2);
  people.forEach((p, i) => { ip.set([p[0], p[1], p[2]], i * 3); iv.set([p[3], p[4]], i * 2); });
  qGeo.setAttribute('ipos', new THREE.InstancedBufferAttribute(ip, 3));
  qGeo.setAttribute('ivar', new THREE.InstancedBufferAttribute(iv, 2));
  qGeo.instanceCount = N;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() }, camLocal: { value: new THREE.Vector3() }, atlas: { value: atlas.tex },
      grid: { value: new THREE.Vector2(atlas.cols, atlas.rows) }, rim: { value: rim }, lit: { value: lit }, bounce: { value: bounce },
      rimColor: { value: new THREE.Color(1.0, 0.12, 0.08) }, haze: { value: 1 }, amt: { value: 1 } },
    vertexShader: /* glsl */`attribute vec3 ipos; attribute vec2 ivar; uniform float uTime, bounce; uniform vec3 camLocal;
      varying vec2 vUv; varying float vV, vLit, vPose; varying vec3 vW;
      void main(){
        float ph = ivar.y;
        float wave = sin(uTime * ${jumpRate.toFixed(2)} - ipos.x * 0.05 + ph * 1.4);
        float jump = max(wave, 0.0) * bounce;
        vec3 toCam = camLocal - ipos; toCam.y = 0.0; toCam = normalize(toCam);
        vec3 right = vec3(toCam.z, 0.0, -toCam.x);
        float hgt = ${height.toFixed(3)} * (0.92 + 0.16 * fract(ph * 7.1));
        vec3 w = ipos + right * position.x * hgt * 0.6 + vec3(0.0, position.y * hgt + jump, 0.0);
        vec4 wp = modelMatrix * vec4(w, 1.0);
        vW = wp.xyz; vUv = uv; vV = ivar.x;
        vPose = mod(floor(uTime * 2.6 + ph * 3.0), 3.0);
        vLit = 0.85 + 0.3 * fract(ph * 13.3);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: hazeGLSL + /* glsl */`uniform sampler2D atlas; uniform vec2 grid; uniform float rim, lit, amt; uniform vec3 rimColor;
      varying vec2 vUv; varying float vV, vLit, vPose; varying vec3 vW;
      vec3 hz(vec3 c, vec3 w){ ${hazeGLSL ? 'return inHaze(c, w);' : 'return c;'} }
      void main(){
        vec2 cell = vec2(vV, grid.y - 1.0 - vPose);
        vec2 uv = (cell + vUv) / grid;
        vec4 t = texture2D(atlas, uv);
        if (t.a < 0.45) discard;
        vec3 c = pow(t.rgb, vec3(2.2)) * vLit * lit;
        if (rim > 0.0) {
          vec2 o = vec2(0.045 / grid.x, 0.03 / grid.y);
          float e = 4.0 * t.a - texture2D(atlas, uv + vec2(o.x, 0.0)).a - texture2D(atlas, uv - vec2(o.x, 0.0)).a - texture2D(atlas, uv + vec2(0.0, o.y)).a - texture2D(atlas, uv - vec2(0.0, o.y)).a;
          c += rimColor * clamp(e, 0.0, 1.0) * rim + rimColor * rim * 0.06;
        }
        gl_FragColor = vec4(hz(c, vW) * amt, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(qGeo, mat);
  mesh.frustumCulled = false;
  return { mesh, mat, update(t, camWorld, camLocal) { mat.uniforms.uTime.value = t; mat.uniforms.camPos.value.copy(camWorld); mat.uniforms.camLocal.value.copy(camLocal || camWorld); } };
}

// waving red-white-red flags on poles (instanced cloth)
export function buildFlags(list, { hazeGLSL = '', backlight = 0 } = {}) {
  const N = list.length;
  const fGeo = new THREE.InstancedBufferGeometry();
  const pg = new THREE.PlaneGeometry(1, 1, 16, 6); pg.translate(0.5, 0, 0);
  fGeo.setIndex(pg.index); fGeo.setAttribute('position', pg.attributes.position); fGeo.setAttribute('uv', pg.attributes.uv);
  const fp = new Float32Array(N * 3), fi = new Float32Array(N * 2);
  list.forEach((f, i) => { fp.set([f[0], f[1], f[2]], i * 3); fi.set([f[3], f[4]], i * 2); });
  fGeo.setAttribute('ipos', new THREE.InstancedBufferAttribute(fp, 3));
  fGeo.setAttribute('iinfo', new THREE.InstancedBufferAttribute(fi, 2));
  fGeo.instanceCount = N;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, camPos: { value: new THREE.Vector3() }, haze: { value: 1 }, backlight: { value: backlight } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 ipos; attribute vec2 iinfo; uniform float uTime; varying vec2 vUv; varying vec3 vW; varying float vShade;
      void main(){
        vUv = uv;
        float sz = iinfo.x;
        vec3 p = position * vec3(sz * 1.5, sz, 1.0);
        float ph = iinfo.y * 6.283;
        float wv = sin(uv.x * 5.0 - uTime * 7.0 + ph) * 0.5 + sin(uv.x * 9.0 + uv.y * 3.0 - uTime * 11.0 + ph) * 0.2;
        p.z += wv * uv.x * sz * 0.35;
        p.y -= uv.x * uv.x * sz * 0.15;
        float swing = sin(uTime * 2.2 + ph) * 0.6;
        mat2 r = mat2(cos(swing), -sin(swing), sin(swing), cos(swing));
        p.xz = r * p.xz;
        vec4 wp = modelMatrix * vec4(ipos + vec3(p.x, p.y + 2.5 + sz * 0.6, p.z), 1.0);
        vW = wp.xyz; vShade = 0.6 + 0.4 * cos(uv.x * 5.0 - uTime * 7.0 + ph);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: hazeGLSL + /* glsl */`uniform float backlight; varying vec2 vUv; varying vec3 vW; varying float vShade;
      vec3 hz(vec3 c, vec3 w){ ${hazeGLSL ? 'return inHaze(c, w);' : 'return c;'} }
      void main(){
        float wh = step(0.333, vUv.y) * step(vUv.y, 0.667);
        vec3 c = mix(vec3(0.85, 0.01, 0.03), vec3(0.95), wh) * vShade * 1.25;
        c *= 1.0 + backlight * (0.8 + 0.6 * vShade);
        gl_FragColor = vec4(hz(c, vW), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(fGeo, mat);
  mesh.frustumCulled = false;
  return { mesh, mat, update(t, camPos) { mat.uniforms.uTime.value = t; mat.uniforms.camPos.value.copy(camPos); } };
}
