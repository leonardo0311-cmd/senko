// Shot list + timing for the whole reel.
import * as THREE from 'three';
import { buildGlobe, BA, COL } from './globe.js';
import { buildCity } from './city.js';
import { buildPlane } from './plane.js';
import { buildSky } from './sky.js';
import { buildStadium } from './stadium.js';
import { buildEndcard } from './endcard.js';
import { buildOverlay } from './overlay.js';
import { OBELISCO, M_PER_DEG_LAT, M_PER_DEG_LON } from './citylights.js';
import { R, lonLatToVec, enu } from './geo.js';
import { keys, clamp, range, smoothstep, mix, easeInOutCubic, easeOutCubic, easeInCubic, easeInOutSine } from './util.js';

export const DURATION = 19.0;
const D2R = Math.PI / 180;

// camera looking at a surface point: dist (km), heading (deg, 0 = facing north), tilt (deg from vertical)
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
// same rig in the city's local metric frame (x east, y up, z south)
function orbitLocal(cam, tx, tz, dist, heading, tilt, roll = 0) {
  const hd = heading * D2R, tl = tilt * D2R;
  const h = new THREE.Vector3(Math.sin(hd), 0, -Math.cos(hd));
  const target = new THREE.Vector3(tx, 0, tz);
  cam.position.copy(target).add(new THREE.Vector3(0, Math.cos(tl) * dist, 0)).add(h.clone().multiplyScalar(-Math.sin(tl) * dist));
  cam.up.set(0, 1, 0).multiplyScalar(Math.sin(tl)).add(h.clone().multiplyScalar(Math.cos(tl)));
  cam.lookAt(target);
  if (roll) cam.rotateZ(roll);
  cam.updateMatrixWorld();
}
const localToLL = (x, z) => ({ lon: OBELISCO.lon + x / M_PER_DEG_LON, lat: OBELISCO.lat - z / M_PER_DEG_LAT });
const lerpLL = (a, b, u) => ({ lon: mix(a.lon, b.lon, u), lat: mix(a.lat, b.lat, u) });

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

// ---------------- S1 master camera: street level -> continent ----------------
const MID = { lon: -64.0, lat: -17.5 };
function s1Rig(t) {
  // ground target (local metres), distance (m), heading, tilt (deg from vertical)
  const glide = easeInOutSine(range(0, 1.5, t));
  const rise = easeInOutCubic(range(1.2, 2.35, t));
  const tz = mix(mix(-400, -350, glide), 0, rise);
  const tx = mix(-25, 0, rise);
  const dGlide = mix(1728, 934, glide);
  const logD = mix(Math.log(dGlide), Math.log(10.6e6), easeInOutCubic(range(1.25, 4.45, t)));
  const dist = Math.exp(logD);
  const tilt = mix(mix(80, 66, glide), 0, rise) + 33 * easeInOutCubic(range(2.75, 4.45, t));
  const heading = 3 * Math.sin(t * 1.1) * (1 - rise) - 9 * easeInOutCubic(range(2.4, 4.45, t));
  const geoBlend = easeInOutCubic(range(2.5, 4.45, t));
  return { tx, tz, dist, tilt, heading, geoBlend };
}

// orient a plane holder: position, forward direction, up hint, bank (rad), uniform scale
function placePlane(plane, pos, fwd, upHint, bank = 0, pitch = 0, scale = 1) {
  const f = fwd.clone().normalize();
  const r = new THREE.Vector3().crossVectors(f, upHint).normalize();     // starboard (-x of model)
  const u = new THREE.Vector3().crossVectors(r, f).normalize();
  const m = new THREE.Matrix4().makeBasis(r.clone().negate(), u, f);      // model: x = port, y = up, z = nose
  plane.group.position.copy(pos);
  plane.group.quaternion.setFromRotationMatrix(m);
  plane.group.scale.setScalar(scale);
  plane.body.rotation.set(-pitch, 0, bank);
  plane.group.updateMatrixWorld(true);
}
const focalPx = (H, fov) => H / (2 * Math.tan(fov * D2R / 2));

export async function buildTimeline(renderer, W, H, overlayEl) {
  const globe = await buildGlobe(W, H);
  const city = await buildCity(W, H, { tSA: globe.globeMat.uniforms.tSA.value, tLights: globe.globeMat.uniforms.tLights.value, meta: globe.meta });
  const sky = buildSky(W, H);
  const plane = buildPlane();
  const stadium = buildStadium(W, H);
  const endcard = buildEndcard(W, H, { tSA: globe.globeMat.uniforms.tSA.value, meta: globe.meta });
  const ov = buildOverlay(overlayEl);
  window.__dbg = { globe, city, sky, plane, stadium };

  // ---- S1A/B: Buenos Aires ----
  const cityS1 = makeShot(city.scene, city.camera, (t) => {
    const k = s1Rig(t);
    city.camera.fov = 46; city.camera.updateProjectionMatrix();
    orbitLocal(city.camera, k.tx, k.tz, k.dist, k.heading, k.tilt);
    if (plane.group.parent === city.planeHolder) city.planeHolder.remove(plane.group);
    city.update(t, { marker: smoothstep(1.55, 2.0, t) });
  });
  // ---- S1C: the continent ----
  const globeS1 = makeShot(globe.scene, globe.camera, (t) => {
    const k = s1Rig(t);
    globe.camera.fov = 46; globe.camera.updateProjectionMatrix();
    const ll = lerpLL(localToLL(k.tx, k.tz), MID, k.geoBlend);
    orbitCam(globe.camera, ll, k.dist / 1000, k.heading, k.tilt);
    if (plane.group.parent === globe.planeHolder) globe.planeHolder.remove(plane.group);
    globe.update(t, {
      route: easeInOutCubic(range(3.15, 4.7, t)) * 0.62,
      routeGround: easeInOutCubic(range(3.15, 4.7, t)) * 0.62,
      baMarker: smoothstep(2.4, 2.8, t), colMarker: 0,
      uArg: smoothstep(3.0, 3.8, t) * 0.8, uCol: 0, uScan: -1, uLights: 1, uCoast: smoothstep(2.4, 3.2, t),
    });
  });

  // ---- S2A: take-off over the Río de la Plata, chase camera ----
  const T2A = 4.3;
  const climbDir = new THREE.Vector3(-0.30, 0.19, -0.935).normalize();
  const takeoffP0 = new THREE.Vector3(-2700, 120, -5000);
  const cityS2 = makeShot(city.scene, city.camera, (t) => {
    const lt = t - T2A;
    const pos = takeoffP0.clone().addScaledVector(climbDir, 92 * lt + 4 * lt * lt);
    const bank = mix(0.0, -0.13, easeInOutSine(range(0, 1.6, lt)));
    placePlane(plane, pos, climbDir, new THREE.Vector3(0, 1, 0), bank, 0.06);
    if (plane.group.parent !== city.planeHolder) city.planeHolder.add(plane.group);
    plane.setEnv({ keyDir: new THREE.Vector3(-0.35, 0.75, -0.55), keyColor: new THREE.Color(0.42, 0.5, 0.72),
      skyColor: new THREE.Color(0.05, 0.08, 0.17), groundColor: new THREE.Color(0.2, 0.11, 0.05), envK: 0.9, exposure: 1 });
    // camera ahead-right of the plane looking back at it (landing lights into the lens,
    // downtown Buenos Aires behind); the plane climbs past the camera
    const u = easeInOutSine(range(0, 1.45, lt));
    const off = new THREE.Vector3(mix(-24, -50, u), mix(9, 5, u), mix(78, 4, u));    // model frame (x port, z nose)
    const look = new THREE.Vector3(mix(-2, 0, u), mix(1.5, 0.5, u), mix(4, -10, u));
    const cam = city.camera;
    cam.fov = 40; cam.updateProjectionMatrix();
    cam.position.copy(off.applyMatrix4(plane.group.matrixWorld));
    cam.up.set(0, 1, 0);
    cam.lookAt(look.applyMatrix4(plane.group.matrixWorld));
    cam.rotateZ(-0.05 + 0.03 * Math.sin(lt * 3));
    cam.updateMatrixWorld();
    plane.update(t, { pxScale: focalPx(H, 40) * 1.6, landing: 1 });
    city.update(t, { marker: 0 });
  });

  // ---- S2B: along the windows, the party inside ----
  const T2B = 5.7;
  const skyS2 = makeShot(sky.scene, sky.camera, (t) => {
    const lt = t - T2B;
    placePlane(plane, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), 0.0, 0.0);
    if (plane.group.parent !== sky.planeHolder) sky.planeHolder.add(plane.group);
    plane.setEnv({ keyDir: sky.moonDir, keyColor: new THREE.Color(0.38, 0.46, 0.68), skyColor: new THREE.Color(0.04, 0.07, 0.16),
      groundColor: new THREE.Color(0.06, 0.07, 0.11), envK: 1.1, exposure: 1 });
    const u = easeInOutSine(range(0, 1.25, lt));
    const pull = easeInCubic(range(0.85, 1.25, lt));
    const zModel = mix(-4.0, 8.5, u);                       // along the fuselage (model z, nose = +)
    const cam = sky.camera;
    cam.fov = 40; cam.updateProjectionMatrix();
    // plane faces -z in this scene, so model z maps to world -z; starboard side is +x
    cam.position.set(2.9 + 2.5 + pull * 30, 0.95 + pull * 9, -zModel + 0.6 + pull * 26);
    cam.up.set(0, 1, 0);
    cam.lookAt(2.6, 0.86 + pull * 2, -zModel - 3.6);
    cam.rotateZ(0.04);
    cam.updateMatrixWorld();
    plane.update(t, { pxScale: focalPx(H, 40) * 1.2, landing: 0.2 });
    sky.update(t, { speed: 240 });
  });

  // ---- S2C: over the map toward Colombia ----
  const T2C = 6.85;
  const PLANE_SCALE = 5.2; // km per model metre (map-scale icon of the real model)
  const routeU = (t) => mix(0.36, 0.9, easeInOutSine(range(T2C - 0.2, 8.75, t)));
  const globeS2 = makeShot(globe.scene, globe.camera, (t) => {
    const u = routeU(t);
    const p = globe.routeAt(u), pn = globe.routeAt(Math.min(1, u + 0.004));
    const up = p.clone().normalize();
    const fwd = pn.clone().sub(p).normalize();
    placePlane(plane, p, fwd, up, -0.05 * Math.sin(t * 1.3), 0, PLANE_SCALE);
    if (plane.group.parent !== globe.planeHolder) globe.planeHolder.add(plane.group);
    const east = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), up).normalize();
    plane.setEnv({ keyDir: up.clone().multiplyScalar(0.8).addScaledVector(east, 0.45).addScaledVector(fwd, -0.3), keyColor: new THREE.Color(0.75, 0.8, 0.95),
      skyColor: new THREE.Color(0.06, 0.1, 0.25), groundColor: new THREE.Color(0.02, 0.05, 0.14), envK: 0.9, exposure: 1.15 });
    // chase camera: behind & above, pulling back over the shot
    const lt = t - T2C;
    const back = mix(420, 2300, easeOutCubic(range(-0.15, 1.6, lt)));
    const high = mix(180, 1500, easeOutCubic(range(-0.15, 1.6, lt)));
    const side = mix(-260, -500, easeInOutSine(range(0, 1.8, lt)));
    const right = new THREE.Vector3().crossVectors(fwd, up).normalize();
    const cam = globe.camera;
    cam.fov = 42; cam.updateProjectionMatrix();
    cam.position.copy(p).addScaledVector(fwd, -back).addScaledVector(up, high).addScaledVector(right, side);
    cam.up.copy(up);
    const look = globe.routeAt(Math.min(1, u + mix(0.05, 0.22, easeInOutSine(range(0, 1.6, lt))))).clone();
    cam.lookAt(look.lerp(p, 0.35));
    cam.updateMatrixWorld();
    plane.update(t, { pxScale: focalPx(H, 42) * 1.4 * PLANE_SCALE, landing: 0.4 });
    globe.update(t, {
      route: u, routeGround: 1, routeGlow: 1,
      baMarker: 1, colMarker: smoothstep(7.4, 7.8, t),
      uArg: 0.5, uCol: smoothstep(7.35, 8.0, t), uScan: -1, uLights: 1, uCoast: 1,
    });
  });

  // ---- S3: arrival — the stadium in Colombia ----
  // keyed camera: [time, position, look]
  const S3K = [
    [8.55, [0, 700, 2000], [0, 0, -200]],
    [9.4, [0, 330, 900], [0, 10, -50]],
    [10.1, [0, 122, 262], [0, 12, -30]],
    [10.6, [-4, 66, 112], [0, 10, -45]],
    [11.6, [-20, 36, 72], [-6, 15, -60]],
    [12.7, [-40, 26, 50], [-16, 17, -70]],
    [13.8, [-58, 21, 32], [-24, 18, -75]],
  ];
  const camPath = new THREE.CatmullRomCurve3(S3K.map((k) => new THREE.Vector3(...k[1])), false, 'catmullrom', 0.5);
  const lookPath = new THREE.CatmullRomCurve3(S3K.map((k) => new THREE.Vector3(...k[2])), false, 'catmullrom', 0.5);
  const keyU = (t) => {
    if (t <= S3K[0][0]) return 0;
    for (let i = 1; i < S3K.length; i++) if (t <= S3K[i][0]) return (i - 1 + (t - S3K[i - 1][0]) / (S3K[i][0] - S3K[i - 1][0])) / (S3K.length - 1);
    return 1;
  };
  const T3 = 8.55, T3E = 13.7;
  const stadiumS3 = makeShot(stadium.scene, stadium.camera, (t) => {
    const u = keyU(t);
    const cam = stadium.camera;
    cam.fov = 44; cam.updateProjectionMatrix();
    cam.position.copy(camPath.getPoint(u));
    cam.up.set(0, 1, 0);
    cam.lookAt(lookPath.getPoint(u));
    cam.rotateZ(0.06 * Math.sin(t * 0.9) + 0.02 * Math.sin(t * 3.1));
    cam.updateMatrixWorld();
    // the plane passes overhead on its approach
    const pt = range(8.55, 10.3, t);
    if (pt > 0 && pt < 1) {
      const a = new THREE.Vector3(20, 450, 1400), b = new THREE.Vector3(-60, 150, -600);
      const pos = a.clone().lerp(b, pt);
      placePlane(plane, pos, b.clone().sub(a), new THREE.Vector3(0, 1, 0), 0.08, -0.04);
      if (plane.group.parent !== stadium.planeHolder) stadium.planeHolder.add(plane.group);
      plane.setEnv({ keyDir: new THREE.Vector3(0.2, 1, 0.3), keyColor: new THREE.Color(0.35, 0.42, 0.62), skyColor: new THREE.Color(0.04, 0.07, 0.15),
        groundColor: new THREE.Color(0.18, 0.1, 0.05), envK: 0.9, exposure: 1 });
      plane.update(t, { pxScale: focalPx(H, 44) * 1.8, landing: 1, lightSize: 1.3 });
    } else if (plane.group.parent === stadium.planeHolder) stadium.planeHolder.remove(plane.group);
    stadium.update(t, { haze: 1, smokeAmt: smoothstep(9.6, 10.6, t), confAmt: smoothstep(10.2, 10.9, t) });
  });

  // ---- S4: the offer ----
  const endS4 = makeShot(endcard.scene, endcard.camera, (t) => {
    endcard.update(t, { intro: smoothstep(13.55, 14.4, t), routeP: easeInOutCubic(range(13.9, 15.7, t)), priceGlow: Math.exp(-Math.pow((t - 14.75) / 0.35, 2)) });
  });

  const project = (shot, ll, t) => {
    shot.pose(t);
    const cam = shot.camera;
    const p = lonLatToVec(ll.lon, ll.lat, 2);
    const facing = p.clone().normalize().dot(cam.position.clone().sub(p)) > 0;
    const v = p.clone().project(cam);
    return { x: (v.x * 0.5 + 0.5) * 1080, y: (-v.y * 0.5 + 0.5) * 1920, vis: facing && v.z < 1 ? 1 : 0 };
  };

  return {
    duration: DURATION,
    layerAt(t) {
      if (t < 2.45) return { shots: [cityS1] };
      if (t < 2.85) return { shots: [cityS1, globeS1], mode: 1, p: easeInOutSine(range(2.45, 2.85, t)) };
      if (t < 4.18) return { shots: [globeS1] };
      if (t < 4.3) return { shots: [globeS1], flash: 0.55 * smoothstep(4.2, 4.3, t) };
      if (t < 5.7) return { shots: [cityS2], flash: 0.55 * (1 - smoothstep(4.3, 4.38, t)) };
      if (t < 5.86) return { shots: [cityS2, skyS2], mode: 1, p: easeInOutSine(range(5.7, 5.86, t)) };
      if (t < 6.85) return { shots: [skyS2] };
      if (t < 7.05) return { shots: [skyS2, globeS2], mode: 2, p: easeInOutSine(range(6.85, 7.05, t)) };
      if (t < 8.55) return { shots: [globeS2] };
      if (t < 8.85) return { shots: [globeS2, stadiumS3], mode: 2, p: easeInOutSine(range(8.55, 8.85, t)) };
      if (t < 13.45) return { shots: [stadiumS3] };
      if (t < 13.95) return { shots: [stadiumS3, endS4], mode: 3, p: easeInOutSine(range(13.45, 13.95, t)) };
      return { shots: [endS4] };
    },
    gradeAt(t) {
      const stadiumK = range(9.6, 10.4, t) * (1 - range(13.45, 13.9, t));
      const endK = range(13.6, 14.2, t);
      return { exposure: 1.0 + 0.05 * stadiumK, bloom: 0.55 + 0.15 * stadiumK - 0.1 * endK, vignette: 0.4 - 0.12 * endK, grain: 0.03 - 0.01 * endK, saturation: 1.08 + 0.06 * stadiumK };
    },
    overlay(t) {
      const anchors = {};
      if (t > 2.9 && t < 4.2) anchors.ba = project(globeS1, BA, t);
      if (t > 7.7 && t < 8.6) anchors.col = project(globeS2, COL, t);
      ov.update(t, anchors);
    },
  };
}
