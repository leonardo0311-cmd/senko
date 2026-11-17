// 3D globe of South America: SDF coastlines/borders (Natural Earth, ARG POV),
// relief shading, city lights, atmosphere, luminous great-circle route, markers.
import * as THREE from 'three';
import { R, lonLatToVec, enu, slerpLonLat } from './geo.js';
import { loadDataTexture, loadJSON } from './assets.js';
import { GLSL_NOISE, clamp } from './util.js';

export const BA = { lon: -58.3816, lat: -34.6037 };
export const COL = { lon: -74.30, lat: 4.35 };     // marker: centre of Colombia, near Bogotá
export const COL_LABEL = { lon: -73.2, lat: 4.2 };

export async function buildGlobe(W, H) {
  const meta = await loadJSON('../data/geo.json');
  const [tSA, tWorld, tRelief, tLights] = await Promise.all([
    loadDataTexture('../data/sa_sdf.png'), loadDataTexture('../data/world_sdf.png'),
    loadDataTexture('../data/sa_relief.png'), loadDataTexture('../data/world_lights.png'),
  ]);
  tWorld.wrapS = THREE.RepeatWrapping; tLights.wrapS = THREE.RepeatWrapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 1, 60000);

  // ---------- background ----------
  const bg = new THREE.Mesh(new THREE.SphereGeometry(50000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: GLSL_NOISE + `varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float n = fbm3(d * 3.0) ;
        vec3 c = mix(vec3(0.0016, 0.004, 0.012), vec3(0.004, 0.012, 0.04), n * n * 1.2);
        // stars
        vec3 g = d * 420.0; vec3 i = floor(g); float h = hash13(i);
        vec3 f = fract(g) - 0.5; float s = (1.0 - smoothstep(0.0, 0.08, length(f))) * step(0.985, h) * (0.4 + 2.0 * fract(h * 91.7));
        c += vec3(0.75, 0.85, 1.0) * s * 0.35;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  bg.renderOrder = -10;
  bg.frustumCulled = false;
  scene.add(bg);

  // ---------- globe ----------
  const reg = meta.region, rel = meta.relief;
  const globeMat = new THREE.ShaderMaterial({
    uniforms: {
      tSA: { value: tSA }, tWorld: { value: tWorld }, tRelief: { value: tRelief }, tLights: { value: tLights },
      regB: { value: new THREE.Vector4(reg.lon0, reg.lon1, reg.lat0, reg.lat1) },
      relB: { value: new THREE.Vector4(rel.lon0, rel.lat0, rel.lon1, rel.lat1) },
      relPx: { value: new THREE.Vector2(1 / tRelief.image.width, 1 / tRelief.image.height) },
      landRange: { value: meta.landRange }, borderRange: { value: meta.borderRange },
      countryRange: { value: meta.countryRange }, worldRange: { value: meta.worldLandRange },
      uArg: { value: 0 }, uCol: { value: 0 }, uTime: { value: 0 }, uLights: { value: 1 }, uGrid: { value: 1 },
      uCoast: { value: 1 }, uBorders: { value: 1 }, uScan: { value: -1 }, uBright: { value: 1 },
      camPosW: { value: new THREE.Vector3() },
    },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vW;
      void main(){ vN = normalize(position); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform sampler2D tSA, tWorld, tRelief, tLights;
      uniform vec4 regB, relB; uniform vec2 relPx;
      uniform float landRange, borderRange, countryRange, worldRange;
      uniform float uArg, uCol, uTime, uLights, uGrid, uCoast, uBorders, uScan, uBright;
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
        float colD = mix(-1e4, (s.a - 0.5) * 2.0 * countryRange, edgeW);

        float aa = max(fwidth(landD), 0.02);
        float landM = smoothstep(-aa, aa, landD);

        // relief (hill shading) ------------------------------------------
        vec2 ruv2 = vec2((lon - relB.x) / (relB.z - relB.x), (relB.w - lat) / (relB.w - relB.y));
        float inRel = step(0.0, ruv2.x) * step(ruv2.x, 1.0) * step(0.0, ruv2.y) * step(ruv2.y, 1.0);
        float hC = texture2D(tRelief, ruv2).r * inRel;
        float hE = texture2D(tRelief, ruv2 + vec2(relPx.x, 0.0)).r, hWw = texture2D(tRelief, ruv2 - vec2(relPx.x, 0.0)).r;
        float hN = texture2D(tRelief, ruv2 - vec2(0.0, relPx.y)).r, hS = texture2D(tRelief, ruv2 + vec2(0.0, relPx.y)).r;
        vec3 nl = normalize(vec3(-(hE - hWw) * 9.0 * inRel, -(hN - hS) * 9.0 * inRel, 1.0));
        float shade = clamp(dot(nl, normalize(vec3(-0.55, 0.6, 0.55))), 0.0, 1.0);
        // fine terrain texture so close-ups don't look flat
        float micro = fbm(vec2(lon, lat) * 6.0) * 0.5 + fbm(vec2(lon, lat) * 40.0) * 0.5;

        // ocean -----------------------------------------------------------
        float shelf = exp(-max(-landD, 0.0) / 140.0);
        vec3 ocean = mix(vec3(0.0018, 0.006, 0.022), vec3(0.003, 0.016, 0.06), shelf);
        ocean *= 0.85 + 0.3 * fbm(vec2(lon, lat) * 1.5);
        // graticule
        float gl1 = abs(fract(lon / 10.0 + 0.5) - 0.5) * 10.0, gl2 = abs(fract(lat / 10.0 + 0.5) - 0.5) * 10.0;
        float gw = fwidth(lon) * 0.9;
        float grid = max(1.0 - smoothstep(0.0, gw, gl1), 1.0 - smoothstep(0.0, fwidth(lat) * 0.9, gl2));
        ocean += vec3(0.02, 0.06, 0.16) * grid * uGrid * (1.0 - landM) * 0.6;

        // land ------------------------------------------------------------
        vec3 land = vec3(0.0035, 0.03, 0.14) * (0.45 + 1.15 * shade) * (0.85 + 0.3 * micro);
        land += vec3(0.03, 0.06, 0.12) * hC * hC * 1.6;          // high Andes catch light
        vec3 col = mix(ocean, land, landM);

        // coastline: crisp line + glow over the water
        float coastLine = exp(-pow(landD / (aa * 1.3 + 0.08), 2.0));
        col += vec3(0.30, 0.62, 1.0) * coastLine * 1.5 * uCoast;
        col += vec3(0.02, 0.16, 0.6) * exp(-max(-landD, 0.0) / 22.0) * (1.0 - landM) * 0.45 * uCoast;

        // borders
        float bAA = max(fwidth(borderD), 0.02);
        float bLine = 1.0 - smoothstep(bAA * 0.4, bAA * 1.6 + 0.15, borderD);
        col += vec3(0.30, 0.48, 0.85) * bLine * 0.32 * landM * uBorders;

        // Argentina
        float cAA = max(fwidth(argD), 0.02);
        float argM = smoothstep(-cAA, cAA, argD);
        col += vec3(0.010, 0.030, 0.12) * argM * uArg;
        col += vec3(0.55, 0.72, 1.0) * exp(-pow(argD / (cAA * 1.4 + 0.1), 2.0)) * uArg * 0.9;

        // Colombia (destination)
        float kAA = max(fwidth(colD), 0.02);
        float colM = smoothstep(-kAA, kAA, colD);
        vec3 gold = vec3(0.92, 0.64, 0.0);
        col = mix(col, col * 0.55 + gold * (0.13 + 0.09 * (0.5 + 0.5 * sin(uTime * 5.0))) * (0.6 + 0.8 * shade), colM * uCol);
        col += gold * 4.0 * exp(-pow(colD / (kAA * 1.5 + 0.12), 2.0)) * uCol;
        col += gold * 0.6 * exp(-abs(colD) / 45.0) * uCol * (1.0 - colM);

        // city lights
        float L = texture2D(tLights, wuv).r;
        float sparkle = 0.6 + 0.8 * vnoise(vec2(lon, lat) * 180.0);
        col += vec3(1.0, 0.58, 0.22) * pow(L, 1.6) * 2.2 * sparkle * uLights * landM;

        // scan sweep used in the intro
        if (uScan > -0.5) {
          float sd = abs(lat - uScan);
          col += vec3(0.25, 0.55, 1.0) * exp(-sd * 1.2) * 0.25 + vec3(0.6, 0.85, 1.0) * exp(-sd * 8.0) * 0.6;
        }

        // limb light
        vec3 V = normalize(camPosW - vW);
        float fres = pow(1.0 - clamp(dot(V, n), 0.0, 1.0), 3.0);
        col += vec3(0.08, 0.30, 1.0) * fres * 0.45;
        gl_FragColor = vec4(col * uBright, 1.0);
      }`,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 512, 256), globeMat);
  scene.add(globe);

  // ---------- atmosphere halo ----------
  const atmoMat = new THREE.ShaderMaterial({
    uniforms: { camPosW: { value: new THREE.Vector3() }, uAlpha: { value: 1 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 camPosW; uniform float uAlpha; varying vec3 vW;
      void main(){
        vec3 d = normalize(vW - camPosW);
        float tc = -dot(camPosW, d);
        float dist = length(camPosW + d * tc);
        float Rr = ${R.toFixed(1)};
        float g = dist > Rr ? exp(-(dist - Rr) / 70.0) + 0.35 * exp(-(dist - Rr) / 260.0) : exp(-(Rr - dist) / 380.0) * 0.55;
        vec3 c = mix(vec3(0.10, 0.35, 1.0), vec3(0.45, 0.75, 1.0), clamp(g, 0.0, 1.0)) * g;
        gl_FragColor = vec4(c * 0.75 * uAlpha, 1.0);
      }`,
    side: THREE.BackSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 256, 128), atmoMat);
  scene.add(atmo);

  // ---------- route (screen-space ribbon along a raised great circle) ----------
  const N = 600;
  const routePts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const dir = slerpLonLat(BA, COL, u).normalize();
    const h = 12 + 520 * Math.sin(Math.PI * u) ** 0.9;
    routePts.push(dir.multiplyScalar(R + h));
  }
  const routeAt = (u) => {
    const f = clamp(u) * N, i = Math.min(N - 1, Math.floor(f)), k = f - i;
    return routePts[i].clone().lerp(routePts[i + 1], k);
  };
  const route = makeRibbon(routePts, W, H);
  scene.add(route.mesh);
  // shadow of the route on the ground
  const groundPts = routePts.map((p) => p.clone().normalize().multiplyScalar(R + 2));
  const groundRoute = makeRibbon(groundPts, W, H, { width: 3, color: new THREE.Color(0.25, 0.45, 1.0), dashed: true });
  scene.add(groundRoute.mesh);

  // ---------- markers ----------
  const baMarker = makeMarker(BA, new THREE.Color(1.0, 0.78, 0.0));
  const colMarker = makeMarker(COL, new THREE.Color(1.0, 0.78, 0.0));
  scene.add(baMarker.group, colMarker.group);

  const planeHolder = new THREE.Group();
  scene.add(planeHolder);

  // lights for the plane when it flies over the map
  const hemi = new THREE.HemisphereLight(0x8fb3ff, 0x0a1430, 1.2);
  const key = new THREE.DirectionalLight(0xfff1dd, 2.4);
  scene.add(hemi, key, key.target);

  return {
    scene, camera, globeMat, atmoMat, route, groundRoute, routeAt, baMarker, colMarker, planeHolder, key, meta,
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
      route.update(camera, s.route ?? 0, s.routeGlow ?? 1, t);
      groundRoute.update(camera, s.routeGround ?? 0, 0.6, t);
      const pxScale = alt; // marker size proportional to distance -> constant on screen
      baMarker.update(camera, t, s.baMarker ?? 0);
      colMarker.update(camera, t, s.colMarker ?? 0);
      key.position.copy(cp).add(new THREE.Vector3(2000, 3000, 1000));
      key.target.position.set(0, 0, 0);
      for (const k of ['uArg', 'uCol', 'uLights', 'uGrid', 'uCoast', 'uBorders', 'uScan', 'uBright']) if (s[k] !== undefined) globeMat.uniforms[k].value = s[k];
    },
  };
}

// Ribbon with constant pixel width (like a glowing light path).
function makeRibbon(pts, W, H, { width = 13, color = new THREE.Color(1.0, 0.74, 0.06), dashed = false } = {}) {
  const n = pts.length;
  const pos = new Float32Array(n * 2 * 3), prev = new Float32Array(n * 2 * 3), next = new Float32Array(n * 2 * 3);
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
      color: { value: color }, time: { value: 0 }, dashed: { value: dashed ? 1 : 0 } },
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
      uniform float prog, glow, time, dashed; uniform vec3 color; varying float vSide, vU;
      void main(){
        float x = abs(vSide);
        float core = exp(-x * x * 9.0);
        float hot = exp(-x * x * 40.0);
        float vis = 1.0 - smoothstep(prog - 0.004, prog + 0.0005, vU);
        float head = exp(-pow((vU - prog) / 0.012, 2.0)) * step(0.001, prog) * step(prog, 0.999);
        float pulse = 0.75 + 0.25 * sin(vU * 120.0 - time * 14.0);
        vec3 c = color * core * 2.4 * pulse + vec3(1.0, 0.9, 0.55) * hot * 1.4;
        c *= vis * glow;
        c += vec3(1.0, 0.9, 0.6) * head * (core * 14.0) * glow;
        if (dashed > 0.5) {
          float d = step(0.5, fract(vU * 90.0 - time * 1.5));
          c = color * core * d * vis * glow * 0.7;
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return {
    mesh, mat,
    update(cam, p, gl, t) { mat.uniforms.prog.value = p; mat.uniforms.glow.value = gl; mat.uniforms.time.value = t; mesh.visible = p > 0.0005 && gl > 0.001; },
  };
}

// Surface marker: glowing dot + expanding rings + vertical light beam.
function makeMarker(ll, color) {
  const group = new THREE.Group();
  const { up, east, north } = enu(ll.lon, ll.lat);
  const base = lonLatToVec(ll.lon, ll.lat, 1.5);
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
        for (int i = 0; i < 3; i++) {
          float ph = fract(time * 0.85 + float(i) / 3.0);
          float rr = 0.08 + ph * 0.9;
          rings += exp(-pow((r - rr) / 0.012, 2.0)) * (1.0 - ph) * 1.4;
        }
        vec3 c = color * (halo + rings * 1.3) + vec3(1.0, 0.97, 0.85) * dot_ * 3.5;
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
        gl_FragColor = vec4((color * 1.4 + vec3(0.6)) * f * fade * amt * 1.2, 1.0); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  }));
  group.add(beam);
  return {
    group, base, up,
    update(cam, t, amt) {
      group.visible = amt > 0.001;
      const d = cam.position.distanceTo(base);
      const s = d * 0.045;
      disc.scale.setScalar(s * (0.6 + 0.4 * Math.min(1, amt * 1.5)));
      disc.material.uniforms.time.value = t; disc.material.uniforms.amt.value = amt;
      beam.scale.set(s * 0.016, s * 0.016, s * 1.6 * Math.min(1, amt * 1.4));
      beam.material.uniforms.amt.value = amt;
    },
  };
}
