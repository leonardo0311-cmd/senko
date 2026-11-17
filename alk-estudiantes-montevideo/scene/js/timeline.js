// Shot list + timing — ALK TRAVEL · Estudiantes viaja a Montevideo (20 s).
import * as THREE from 'three';
import { buildGlobe, BA, LP, MVD } from './globe.js';
import { buildCity, STADIUM_POS } from './city.js';
import { ORIGIN, M_PER_DEG_LAT, M_PER_DEG_LON } from './citylights.js';
import { lonLatToVec, enu } from './geo.js';
import { buildBus, buildRoad } from './bus.js';
import { buildRiver } from './ferry.js';
import { buildCentenario } from './centenario.js';
import { buildEndcard } from './endcard.js';
import { buildOverlay } from './overlay.js';
import { clamp, range, smoothstep, mix, easeInOutCubic, easeOutCubic, easeInCubic, easeInOutSine, easeOutExpo } from './util.js';

export const DURATION = 20.0;
const D2R = Math.PI / 180;

export function orbitCam(cam, ll, dist, heading, tilt, alt = 0, roll = 0) {
  const { up, east, north } = enu(ll.lon, ll.lat);
  const hd = heading * D2R, tl = tilt * D2R;
  const h = north.clone().multiplyScalar(Math.cos(hd)).add(east.clone().multiplyScalar(Math.sin(hd)));
  const target = lonLatToVec(ll.lon, ll.lat, alt);
  const pos = target.clone().add(up.clone().multiplyScalar(Math.cos(tl) * dist)).add(h.clone().multiplyScalar(-Math.sin(tl) * dist));
  cam.position.copy(pos);
  cam.up.copy(up.clone().multiplyScalar(Math.sin(tl)).add(h.clone().multiplyScalar(Math.cos(tl))));
  cam.lookAt(target);
  if (roll) cam.rotateZ(roll);
  cam.updateMatrixWorld();
}
function orbitLocal(cam, tx, tz, dist, heading, tilt, roll = 0, ty = 0) {
  const hd = heading * D2R, tl = tilt * D2R;
  const h = new THREE.Vector3(Math.sin(hd), 0, -Math.cos(hd));
  const target = new THREE.Vector3(tx, ty, tz);
  cam.position.copy(target).add(new THREE.Vector3(0, Math.cos(tl) * dist, 0)).add(h.clone().multiplyScalar(-Math.sin(tl) * dist));
  cam.up.set(0, 1, 0).multiplyScalar(Math.sin(tl)).add(h.clone().multiplyScalar(Math.cos(tl)));
  cam.lookAt(target);
  if (roll) cam.rotateZ(roll);
  cam.updateMatrixWorld();
}
const localToLL = (x, z) => ({ lon: ORIGIN.lon + x / M_PER_DEG_LON, lat: ORIGIN.lat - z / M_PER_DEG_LAT });
const lerpLL = (a, b, u) => ({ lon: mix(a.lon, b.lon, u), lat: mix(a.lat, b.lat, u) });
const focalPx = (H, fov) => H / (2 * Math.tan(fov * D2R / 2));

function makeShot(scene, camera, update, clear = 0x000000) {
  return {
    scene, camera, pose: update,
    render(r, rt, t) {
      update(t);
      r.setRenderTarget(rt);
      r.setClearColor(clear, 1);
      r.clear(true, true, true);
      r.render(scene, camera);
    },
  };
}

// ---------------- S1 master camera: the street before the stadium -> the river ----------------
const MAPC = { lon: -57.35, lat: -33.95 };
function s1Rig(t, city) {
  const g = city.kit.group;
  const standW = g.localToWorld(new THREE.Vector3(0, 0, -64));
  const centerW = g.localToWorld(new THREE.Vector3(0, 0, 0));
  const fwd = standW.clone().sub(centerW).setY(0).normalize();
  const headIn = Math.atan2(fwd.x, -fwd.z) / D2R;
  const inside = easeInOutSine(range(0, 1.3, t));
  const crane = easeInOutCubic(range(1.0, 2.6, t));
  const lift = easeInOutSine(range(0.95, 1.7, t));
  const tgtIn = standW.clone().lerp(centerW, 0.12 * inside);
  const tgtCity = new THREE.Vector3(STADIUM_POS.x * 0.3, 0, STADIUM_POS.z * 0.3);
  const tg = tgtIn.clone().lerp(tgtCity, crane);
  const ty = mix(mix(15, 17, inside), 0, crane);
  const logD = mix(Math.log(mix(84, 100, inside)), Math.log(1.25e6), easeInOutCubic(range(1.0, 4.4, t)));
  const dist = Math.exp(logD);
  const tilt = mix(mix(mix(84, 80, inside), 38, lift), 18, crane) + 20 * easeInOutCubic(range(2.6, 4.4, t));
  const heading = mix(headIn, 18, easeInOutCubic(range(1.0, 4.4, t)));
  const geoBlend = easeInOutCubic(range(2.4, 4.4, t));
  return { tx: tg.x, tz: tg.z, ty, dist, tilt, heading, geoBlend };
}

export async function buildTimeline(renderer, W, H, overlayEl) {
  const globe = await buildGlobe(W, H);
  const city = await buildCity(W, H, { tSA: globe.globeMat.uniforms.tSA.value, tLights: globe.globeMat.uniforms.tLights.value, meta: globe.meta });
  const road = buildRoad(W, H);
  const bus = buildBus();
  road.holder.add(bus.group);
  const river = buildRiver(W, H);
  const cent = buildCentenario(W, H);
  const endcard = buildEndcard(W, H, { tSA: globe.globeMat.uniforms.tSA.value, meta: globe.meta });
  const ov = buildOverlay(overlayEl);
  window.__dbg = { globe, city, road, bus, river };

  // ---- S1A/B: La Plata ----
  const cityS1 = makeShot(city.scene, city.camera, (t) => {
    const k = s1Rig(t, city);
    city.camera.fov = 46; city.camera.updateProjectionMatrix();
    orbitLocal(city.camera, k.tx, k.tz, k.dist, k.heading, k.tilt, 0.025 * Math.sin(t * 1.3) * (1 - range(1, 2, t)), k.ty);
    city.update(t, { marker: 0 });
  });
  // ---- S1C: Argentina & Uruguay ----
  const globeS1 = makeShot(globe.scene, globe.camera, (t) => {
    const k = s1Rig(t, city);
    globe.camera.fov = 46; globe.camera.updateProjectionMatrix();
    const ll = lerpLL(localToLL(k.tx, k.tz), MAPC, k.geoBlend);
    orbitCam(globe.camera, ll, k.dist / 1000, k.heading, k.tilt);
    globe.update(t, {
      arc: easeInOutCubic(range(3.05, 4.1, t)), sea: 0, bus: 0,
      baMarker: smoothstep(2.9, 3.3, t), mvdMarker: smoothstep(3.2, 3.6, t), lpMarker: smoothstep(2.6, 3.0, t) * 0.7,
      uArg: smoothstep(2.9, 3.6, t) * 0.6, uUry: smoothstep(3.2, 3.9, t) * 0.8, uLights: 0.35 + 0.65 * smoothstep(3.3, 4.2, t), uCoast: smoothstep(2.4, 3.0, t), uCity: 1 - smoothstep(2.9, 3.4, t),
    });
  });

  // ---- S2: OPCIÓN 1 — the coach ----
  const T2A = 3.95, T2B = 5.45;
  const roadS2 = makeShot(road.scene, road.camera, (t) => {
    const cam = road.camera;
    if (t < T2B) {
      // boarding bay at night: fans with flags walk to the door, LED sign "MONTEVIDEO"
      const u = easeInOutSine(range(T2A - 0.2, T2B + 0.1, t));
      bus.group.position.set(24, 0, 0);
      bus.setEnv({ keyDir: new THREE.Vector3(-0.5, 0.9, 0.2), keyColor: new THREE.Color(0.75, 0.62, 0.5), skyColor: new THREE.Color(0.04, 0.03, 0.05),
        groundColor: new THREE.Color(0.06, 0.04, 0.03), envK: 0.8, interior: 1.2 });
      bus.update(t, { dist: 0, pxScale: focalPx(H, 40) * 0.6, beams: 0.6 });
      cam.fov = 40; cam.updateProjectionMatrix();
      cam.position.set(mix(11.0, 13.5, u), mix(4.6, 5.4, u), mix(25.5, 22.0, u));
      cam.up.set(0, 1, 0);
      cam.lookAt(mix(22.6, 23.2, u), mix(2.2, 2.0, u), mix(2.5, 0.5, u));
      road.update(t, { board: range(T2A + 0.05, T2B - 0.1, t) * 1.5, lot: 1 });
    } else {
      // on the highway at dusk, tracking shot: front 3/4 -> the coach passes and heads into the night
      const lt = t - T2B;
      const z = 700 + 25 * lt;
      bus.group.position.set(4.9, 0, z);
      bus.setEnv({ keyDir: road.sunDir.clone().setY(0.28), keyColor: new THREE.Color(1.25, 0.46, 0.28), skyColor: new THREE.Color(0.11, 0.08, 0.11),
        groundColor: new THREE.Color(0.06, 0.03, 0.03), envK: 1.1, interior: 1.0 });
      bus.update(t, { dist: 25 * lt, pxScale: focalPx(H, 40) * 0.6, beams: 1 });
      const u = easeInOutSine(range(0, 2.6, lt));
      cam.fov = 40; cam.updateProjectionMatrix();
      cam.position.set(mix(-10.5, -9.0, u), mix(1.8, 3.6, u), z + mix(24.0, -27, u));
      cam.up.set(0, 1, 0);
      cam.lookAt(4.9, mix(2.1, 2.2, u), z + mix(1.0, -1.0, u));
      cam.rotateZ(0.03 * Math.sin(lt * 2.0));
      road.update(t, { board: 0, lot: 0 });
    }
    cam.updateMatrixWorld();
  });

  // ---- S3: OPCIÓN 2 — Buquebus across the Río de la Plata ----
  const T3 = 7.85, T3M = 10.15;
  const riverS3 = makeShot(river.scene, river.camera, (t) => {
    const u = easeInOutSine(range(T3 - 0.1, T3M + 0.25, t));
    const cam = river.camera;
    cam.fov = 40; cam.updateProjectionMatrix();
    cam.position.set(mix(-46, -104, u), mix(62, 30, u), mix(165, 74, u));
    cam.up.set(0, 1, 0);
    cam.lookAt(mix(0, 2, u), mix(4, 7, u), mix(4, -10, u));
    cam.rotateZ(-0.03 + 0.02 * Math.sin(t * 1.4));
    cam.updateMatrixWorld();
    river.update(t);
  });
  const SEAC = { lon: -57.28, lat: -34.78 };
  const globeS3 = makeShot(globe.scene, globe.camera, (t) => {
    const u = easeInOutCubic(range(T3M - 0.15, 11.95, t));
    globe.camera.fov = 40; globe.camera.updateProjectionMatrix();
    orbitCam(globe.camera, { lon: -57.25, lat: -34.62 }, mix(520, 600, u), mix(4, -2, u), mix(26, 32, u));
    const sp = easeInOutCubic(range(T3M + 0.05, 11.55, t));
    globe.update(t, {
      arc: 0, sea: sp, bus: 0, seaToken: smoothstep(T3M, T3M + 0.25, t), seaTokenU: sp,
      baMarker: 1, mvdMarker: smoothstep(T3M + 0.1, T3M + 0.5, t), lpMarker: 0.5,
      uArg: 0.45, uUry: 0.45, uLights: 0.15, uCoast: 1, uCity: 0,
    });
  });

  // ---- S4: both routes converge on Montevideo -> Estadio Centenario ----
  const T4 = 11.9, T4S = 12.75;
  const CONV = { lon: -57.55, lat: -33.95 };
  const globeS4 = makeShot(globe.scene, globe.camera, (t) => {
    const dive = easeInCubic(range(12.35, 12.98, t));
    const ll = lerpLL(CONV, MVD, easeInOutCubic(range(12.25, 12.98, t)));
    const dist = Math.exp(mix(Math.log(mix(760, 820, range(T4 - 0.2, 12.3, t))), Math.log(25), dive));
    globe.camera.fov = 42; globe.camera.updateProjectionMatrix();
    orbitCam(globe.camera, ll, dist, mix(28, 60, easeInOutCubic(range(T4 - 0.2, 12.98, t))), mix(26, 48, dive));
    const bp = easeInOutCubic(range(T4 - 0.05, 12.45, t));
    globe.update(t, {
      arc: 0, sea: 1, bus: bp, busToken: smoothstep(T4, T4 + 0.2, t) * (1 - dive), busTokenU: bp, seaToken: 1 - dive, seaTokenU: 1,
      baMarker: 1 - dive, mvdMarker: 1, lpMarker: 0.6 * (1 - dive),
      uArg: 0.45, uUry: 0.6, uLights: 0.15, uCoast: 1, uCity: 0,
    });
  });
  const S4K = [
    [12.75, [110, 430, 920], [20, 20, 0]],
    [13.6, [80, 175, 400], [15, 24, 0]],
    [14.55, [-40, 88, 150], [0, 14, -30]],
    [15.7, [-30, 54, 76], [-6, 12, -72]],
  ];
  const c4Path = new THREE.CatmullRomCurve3(S4K.map((k) => new THREE.Vector3(...k[1])), false, 'catmullrom', 0.5);
  const c4Look = new THREE.CatmullRomCurve3(S4K.map((k) => new THREE.Vector3(...k[2])), false, 'catmullrom', 0.5);
  const keyU4 = (t) => {
    if (t <= S4K[0][0]) return 0;
    for (let i = 1; i < S4K.length; i++) if (t <= S4K[i][0]) return (i - 1 + easeInOutSine((t - S4K[i - 1][0]) / (S4K[i][0] - S4K[i - 1][0])) * 0 + (t - S4K[i - 1][0]) / (S4K[i][0] - S4K[i - 1][0])) / (S4K.length - 1);
    return 1;
  };
  const centS4 = makeShot(cent.scene, cent.camera, (t) => {
    const u = keyU4(t);
    const cam = cent.camera;
    cam.fov = 44; cam.updateProjectionMatrix();
    cam.position.copy(c4Path.getPoint(u));
    cam.up.set(0, 1, 0);
    cam.lookAt(c4Look.getPoint(u));
    cam.rotateZ(0.05 * Math.sin(t * 0.9));
    cam.updateMatrixWorld();
    cent.update(t, { smoke: smoothstep(13.2, 14.0, t), confetti: smoothstep(13.8, 14.4, t) });
  });

  // ---- S5: the two options + call to action ----
  const endS5 = makeShot(endcard.scene, endcard.camera, (t) => {
    endcard.update(t, { intro: smoothstep(15.6, 16.4, t), routeP: easeInOutCubic(range(15.9, 17.4, t)), pulse: Math.exp(-Math.pow((t - 18.2) / 0.4, 2)) });
  });

  const project = (shot, ll, t) => {
    shot.pose(t);
    const cam = shot.camera;
    const p = lonLatToVec(ll.lon, ll.lat, 1);
    const facing = p.clone().normalize().dot(cam.position.clone().sub(p)) > 0;
    const v = p.clone().project(cam);
    return { x: (v.x * 0.5 + 0.5) * 1080, y: (-v.y * 0.5 + 0.5) * 1920, vis: facing && v.z < 1 ? 1 : 0 };
  };

  return {
    duration: DURATION,
    layerAt(t) {
      if (t < 2.4) return { shots: [cityS1] };
      if (t < 2.8) return { shots: [cityS1, globeS1], mode: 1, p: easeInOutSine(range(2.4, 2.8, t)) };
      if (t < 3.95) return { shots: [globeS1] };
      if (t < 4.15) return { shots: [globeS1, roadS2], mode: 2, p: easeInOutSine(range(3.95, 4.15, t)) };
      if (t < 5.4) return { shots: [roadS2] };
      if (t < 5.55) return { shots: [roadS2], flash: 0.35 * Math.sin(Math.PI * range(5.4, 5.55, t)) };
      if (t < 7.8) return { shots: [roadS2] };
      if (t < 8.05) return { shots: [roadS2, riverS3], mode: 1, p: easeInOutSine(range(7.8, 8.05, t)) };
      if (t < 10.1) return { shots: [riverS3] };
      if (t < 10.35) return { shots: [riverS3, globeS3], mode: 2, p: easeInOutSine(range(10.1, 10.35, t)) };
      if (t < 11.85) return { shots: [globeS3] };
      if (t < 12.0) return { shots: [globeS3, globeS4], mode: 1, p: easeInOutSine(range(11.85, 12.0, t)) };
      if (t < 12.75) return { shots: [globeS4] };
      if (t < 13.0) return { shots: [globeS4, centS4], mode: 2, p: easeInOutSine(range(12.75, 13.0, t)) };
      if (t < 15.5) return { shots: [centS4] };
      if (t < 15.95) return { shots: [centS4, endS5], mode: 3, p: easeInOutSine(range(15.5, 15.95, t)) };
      return { shots: [endS5] };
    },
    gradeAt(t) {
      const stad = Math.max(range(0, 0.2, t) * (1 - range(1.2, 1.8, t)), range(13.0, 13.6, t) * (1 - range(15.5, 15.9, t)));
      const endK = range(15.7, 16.2, t);
      return { exposure: 1.0, bloom: 0.6 + 0.12 * stad - 0.15 * endK, vignette: 0.45 - 0.12 * endK, grain: 0.03 - 0.01 * endK,
        saturation: 1.1, contrast: 1.07, shadowTint: [0.012, 0.002, 0.004], highTint: [1.02, 1.0, 0.98] };
    },
    overlay(t) {
      const A = {};
      const geoP = (ll, shot) => project(shot, ll, t);
      if (t > 3.2 && t < 4.05) {
        A.ba = geoP(BA, globeS1); A.mvd = geoP(MVD, globeS1); A.arg = geoP({ lon: -59.2, lat: -35.9 }, globeS1); A.ury = geoP({ lon: -55.9, lat: -32.9 }, globeS1);
        const v = easeOutCubic(range(3.3, 3.65, t)) * (1 - range(3.88, 4.05, t));
        A.baVis = v; A.mvdVis = v; A.argVis = v * 0.9; A.uryVis = v * 0.9;
      } else if (t > 10.3 && t < 11.95) {
        A.ba = geoP(BA, globeS3); A.mvd = geoP(MVD, globeS3); A.rio = geoP({ lon: -57.2, lat: -35.2 }, globeS3);
        const v = easeOutCubic(range(10.35, 10.75, t)) * (1 - range(11.7, 11.95, t));
        A.baVis = v; A.mvdVis = v; A.rioVis = v;
      } else if (t > 11.95 && t < 12.8) {
        A.mvd = geoP(MVD, globeS4);
        A.mvdVis = easeOutCubic(range(11.95, 12.2, t)) * (1 - range(12.45, 12.7, t));
      }
      // never let a map label sit under a headline block
      for (const k of ['ba', 'mvd', 'arg', 'ury', 'rio']) if (A[k] && A[k].y < 800) A[k + 'Vis'] = (A[k + 'Vis'] || 0) * clamp((A[k].y - 700) / 100);
      ov.update(t, A);
    },
  };
}
