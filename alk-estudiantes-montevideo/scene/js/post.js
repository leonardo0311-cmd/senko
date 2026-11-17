// HDR pipeline: shots render into multisampled half-float targets, sub-frames
// are accumulated (true motion blur), then bloom + filmic grade to the canvas.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function rt(w, h, opts = {}) {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat, colorSpace: THREE.LinearSRGBColorSpace,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, ...opts,
  });
}

export class Post {
  constructor(renderer, W, H) {
    this.r = renderer; this.W = W; this.H = H;
    this.shotRT = [rt(W, H, { samples: 4, depthBuffer: true }), rt(W, H, { samples: 4, depthBuffer: true })];
    this.accum = rt(W, H, { type: THREE.FloatType });
    this.quad = new FullScreenQuad();

    // composite a (pair of) shot image(s) into the accumulation buffer
    this.compMat = new THREE.ShaderMaterial({
      uniforms: { tA: { value: null }, tB: { value: null }, mode: { value: 0 }, p: { value: 0 }, w: { value: 1 },
        flash: { value: 0 }, aspect: { value: W / H }, edge: { value: 0 } },
      vertexShader: VERT,
      fragmentShader: /* glsl */`
        uniform sampler2D tA, tB; uniform int mode; uniform float p, w, flash, aspect, edge; varying vec2 vUv;
        void main(){
          vec3 a = texture2D(tA, vUv).rgb;
          vec3 c = a;
          if (mode == 1) { // cross dissolve
            c = mix(a, texture2D(tB, vUv).rgb, p);
          } else if (mode == 2) { // luminous dissolve: brighter pixels of B burn in first
            vec3 b = texture2D(tB, vUv).rgb;
            float lb = dot(b, vec3(.3,.6,.1));
            float k = smoothstep(0.0, 1.0, p * 1.6 - 0.3 + min(lb, 1.0) * 0.5 * (1.0 - p));
            c = mix(a, b, k);
          } else if (mode == 3) { // diagonal Boca-stripe wipe (blue | yellow | blue band)
            vec3 b = texture2D(tB, vUv).rgb;
            float d = (vUv.x * aspect * 0.55 + vUv.y) ;
            float pos = mix(-0.75, 1.95, p);
            float x = d - pos;
            float band = 0.62;
            vec3 blue = vec3(0.75, 0.005, 0.02) * 1.4, yel = vec3(1.0, 0.98, 0.96) * 1.05;   // red | white | red stripe band
            if (x < 0.0) c = b;               // already revealed
            else if (x < band) {             // the stripe band
              float s = x / band;
              c = s < 0.36 ? blue : (s < 0.64 ? yel * (1.0 + 0.6 * smoothstep(0.36, 0.5, s) * (1.0 - smoothstep(0.5, 0.64, s))) : blue);
              c += vec3(1.0) * 0.8 * exp(-pow((s - 0.0) * 60.0, 2.0));
            } else c = a;
          }
          c += vec3(flash);
          gl_FragColor = vec4(c * w, 1.0);
        }`,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
      depthTest: false, depthWrite: false,
    });

    // ---- bloom (dual filtering, Jimenez 2014 style) ----
    this.mips = [];
    let w = Math.max(1, W >> 1), h = Math.max(1, H >> 1);
    for (let i = 0; i < 7; i++) { this.mips.push(rt(w, h)); w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); }
    this.prefilter = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, texel: { value: new THREE.Vector2() }, threshold: { value: 1.0 }, knee: { value: 0.6 } },
      vertexShader: VERT,
      fragmentShader: /* glsl */`
        uniform sampler2D t; uniform vec2 texel; uniform float threshold, knee; varying vec2 vUv;
        vec3 q(vec3 c){ float br = max(c.r, max(c.g, c.b)); float rq = clamp(br - threshold + knee, 0.0, 2.0*knee); rq = rq*rq/(4.0*knee+1e-4);
          return c * max(rq, br - threshold) / max(br, 1e-4); }
        void main(){
          vec3 c = texture2D(t, vUv + texel*vec2(-1,-1)).rgb + texture2D(t, vUv + texel*vec2(1,-1)).rgb
                 + texture2D(t, vUv + texel*vec2(-1,1)).rgb + texture2D(t, vUv + texel*vec2(1,1)).rgb;
          c *= 0.25;
          c = min(c, vec3(60.0));
          gl_FragColor = vec4(q(c), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.down = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, texel: { value: new THREE.Vector2() } },
      vertexShader: VERT,
      fragmentShader: /* glsl */`
        uniform sampler2D t; uniform vec2 texel; varying vec2 vUv;
        void main(){
          vec3 A = texture2D(t, vUv + texel*vec2(-2,-2)).rgb, B = texture2D(t, vUv + texel*vec2(0,-2)).rgb, C = texture2D(t, vUv + texel*vec2(2,-2)).rgb;
          vec3 D = texture2D(t, vUv + texel*vec2(-1,-1)).rgb, E = texture2D(t, vUv + texel*vec2(1,-1)).rgb;
          vec3 F = texture2D(t, vUv + texel*vec2(-2,0)).rgb, G = texture2D(t, vUv).rgb, Hh = texture2D(t, vUv + texel*vec2(2,0)).rgb;
          vec3 I = texture2D(t, vUv + texel*vec2(-1,1)).rgb, J = texture2D(t, vUv + texel*vec2(1,1)).rgb;
          vec3 K = texture2D(t, vUv + texel*vec2(-2,2)).rgb, L = texture2D(t, vUv + texel*vec2(0,2)).rgb, M = texture2D(t, vUv + texel*vec2(2,2)).rgb;
          vec3 c = (D+E+I+J)*0.125 + (A+B+G+F)*0.03125 + (B+C+Hh+G)*0.03125 + (F+G+L+K)*0.03125 + (G+Hh+M+L)*0.03125;
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.up = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, texel: { value: new THREE.Vector2() }, radius: { value: 1.0 }, gain: { value: 1.0 } },
      vertexShader: VERT,
      fragmentShader: /* glsl */`
        uniform sampler2D t; uniform vec2 texel; uniform float radius, gain; varying vec2 vUv;
        void main(){
          vec2 d = texel * radius;
          vec3 c = texture2D(t, vUv + vec2(-d.x,-d.y)).rgb + 2.0*texture2D(t, vUv + vec2(0,-d.y)).rgb + texture2D(t, vUv + vec2(d.x,-d.y)).rgb
                 + 2.0*texture2D(t, vUv + vec2(-d.x,0)).rgb + 4.0*texture2D(t, vUv).rgb + 2.0*texture2D(t, vUv + vec2(d.x,0)).rgb
                 + texture2D(t, vUv + vec2(-d.x,d.y)).rgb + 2.0*texture2D(t, vUv + vec2(0,d.y)).rgb + texture2D(t, vUv + vec2(d.x,d.y)).rgb;
          gl_FragColor = vec4(c / 16.0 * gain, 1.0);
        }`,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
      depthTest: false, depthWrite: false,
    });

    // ---- final grade ----
    this.grade = new THREE.ShaderMaterial({
      uniforms: {
        tHDR: { value: this.accum.texture }, tBloom: { value: this.mips[0].texture },
        exposure: { value: 1 }, bloom: { value: 0.6 }, vignette: { value: 0.35 }, grain: { value: 0.035 },
        saturation: { value: 1.08 }, contrast: { value: 1.06 }, time: { value: 0 }, fade: { value: 0 },
        shadowTint: { value: new THREE.Vector3(0.0, 0.012, 0.04) }, highTint: { value: new THREE.Vector3(1.02, 1.0, 0.96) },
        ca: { value: 0.0015 }, resolution: { value: new THREE.Vector2(W, H) },
      },
      vertexShader: VERT,
      fragmentShader: /* glsl */`
        uniform sampler2D tHDR, tBloom; uniform float exposure, bloom, vignette, grain, saturation, contrast, time, fade, ca;
        uniform vec3 shadowTint, highTint; uniform vec2 resolution; varying vec2 vUv;
        vec3 RRTAndODTFit(vec3 v){ vec3 a = v*(v+0.0245786)-0.000090537; vec3 b = v*(0.983729*v+0.4329510)+0.238081; return a/b; }
        vec3 aces(vec3 c){
          const mat3 i = mat3(0.59719,0.07600,0.02840, 0.35458,0.90834,0.13383, 0.04823,0.01566,0.83777);
          const mat3 o = mat3(1.60475,-0.10208,-0.00327, -0.53108,1.10813,-0.07276, -0.07367,-0.00605,1.07602);
          return clamp(o * RRTAndODTFit(i * c), 0.0, 1.0);
        }
        float h(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main(){
          vec2 cuv = vUv - 0.5;
          float r2 = dot(cuv*vec2(1.0, 1.0), cuv);
          vec2 off = cuv * ca * (0.5 + r2 * 4.0);
          vec3 c;
          c.r = texture2D(tHDR, vUv + off).r; c.g = texture2D(tHDR, vUv).g; c.b = texture2D(tHDR, vUv - off).b;
          c += texture2D(tBloom, vUv).rgb * bloom;
          c *= exposure;
          c = aces(c);
          // grade (display-referred, still linear)
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = mix(vec3(l), c, saturation);
          c += shadowTint * (1.0 - smoothstep(0.0, 0.35, l));
          c *= mix(vec3(1.0), highTint, smoothstep(0.3, 1.0, l));
          c = pow(max(c, 0.0), vec3(1.0/2.2));                 // to display gamma
          c = (c - 0.5) * contrast + 0.5;
          float v = 1.0 - smoothstep(0.2, 0.95, length(cuv * vec2(1.0, 0.82)));
          c *= mix(1.0 - vignette, 1.0, v);
          c *= 1.0 - fade;
          float g = h(vUv * resolution + fract(time * 7.13) * 431.0) + h(vUv * resolution * 1.7 + fract(time * 3.7) * 97.0) - 1.0;
          c += g * grain * (0.6 + 0.4 * (1.0 - l));
          c += (h(vUv * resolution + time) - 0.5) / 255.0;    // dither
          gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
  }

  beginFrame() {
    this.r.setRenderTarget(this.accum);
    this.r.setClearColor(0x000000, 0);
    this.r.clear(true, false, false);
  }

  // layers: { shots:[shotA, shotB?], mode, p, flash }
  addSubframe(layer, t, weight) {
    const r = this.r;
    const [a, b] = layer.shots;
    a.render(r, this.shotRT[0], t);
    if (b) b.render(r, this.shotRT[1], t);
    const m = this.compMat;
    m.uniforms.tA.value = this.shotRT[0].texture;
    m.uniforms.tB.value = b ? this.shotRT[1].texture : this.shotRT[0].texture;
    m.uniforms.mode.value = b ? (layer.mode || 1) : 0;
    m.uniforms.p.value = layer.p || 0;
    m.uniforms.flash.value = layer.flash || 0;
    m.uniforms.w.value = weight;
    this.quad.material = m;
    r.setRenderTarget(this.accum);
    r.autoClear = false;
    this.quad.render(r);
    r.autoClear = true;
  }

  endFrame(t, g = {}) {
    const r = this.r;
    // bloom
    const mips = this.mips;
    this.prefilter.uniforms.t.value = this.accum.texture;
    this.prefilter.uniforms.texel.value.set(1 / this.W, 1 / this.H);
    this.prefilter.uniforms.threshold.value = g.threshold ?? 0.9;
    this.prefilter.uniforms.knee.value = g.knee ?? 0.5;
    this.quad.material = this.prefilter; r.setRenderTarget(mips[0]); this.quad.render(r);
    for (let i = 1; i < mips.length; i++) {
      this.down.uniforms.t.value = mips[i - 1].texture;
      this.down.uniforms.texel.value.set(1 / mips[i - 1].width, 1 / mips[i - 1].height);
      this.quad.material = this.down; r.setRenderTarget(mips[i]); this.quad.render(r);
    }
    r.autoClear = false;
    for (let i = mips.length - 1; i > 0; i--) {
      this.up.uniforms.t.value = mips[i].texture;
      this.up.uniforms.texel.value.set(1 / mips[i].width, 1 / mips[i].height);
      this.up.uniforms.radius.value = g.bloomRadius ?? 1.0;
      this.up.uniforms.gain.value = 1.0;
      this.quad.material = this.up; r.setRenderTarget(mips[i - 1]); this.quad.render(r);
    }
    r.autoClear = true;
    // grade
    const u = this.grade.uniforms;
    u.exposure.value = g.exposure ?? 1.0;
    u.bloom.value = g.bloom ?? 0.5;
    u.vignette.value = g.vignette ?? 0.35;
    u.grain.value = g.grain ?? 0.03;
    u.saturation.value = g.saturation ?? 1.08;
    u.contrast.value = g.contrast ?? 1.05;
    u.fade.value = g.fade ?? 0;
    u.ca.value = g.ca ?? 0.0012;
    if (g.shadowTint) u.shadowTint.value.set(...g.shadowTint);
    if (g.highTint) u.highTint.value.set(...g.highTint);
    u.time.value = t;
    this.quad.material = this.grade;
    r.setRenderTarget(null);
    this.quad.render(r);
  }
}
