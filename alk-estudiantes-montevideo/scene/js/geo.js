// Geographic helpers. Globe units are kilometres, y = north pole.
import * as THREE from 'three';

export const R = 6371.0;
const D2R = Math.PI / 180;

export function lonLatToVec(lon, lat, alt = 0, out = new THREE.Vector3()) {
  const l = lon * D2R, p = lat * D2R, r = R + alt;
  return out.set(r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l));
}

export function vecToLonLat(v) {
  const r = v.length();
  return { lon: Math.atan2(v.x, v.z) / D2R, lat: Math.asin(v.y / r) / D2R, alt: r - R };
}

// local east / up / north basis at lon, lat
export function enu(lon, lat) {
  const l = lon * D2R, p = lat * D2R;
  const up = new THREE.Vector3(Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l));
  const east = new THREE.Vector3(Math.cos(l), 0, -Math.sin(l));
  const north = new THREE.Vector3(-Math.sin(p) * Math.sin(l), Math.cos(p), -Math.sin(p) * Math.cos(l));
  return { up, east, north };
}

// Matrix that maps a local frame (x=east, y=up, z=south, metres) at lon/lat
// into globe space (km). Used to keep city and globe cameras in lock-step.
export function localFrameMatrix(lon, lat) {
  const { up, east, north } = enu(lon, lat);
  const south = north.clone().negate();
  const origin = lonLatToVec(lon, lat, 0);
  const m = new THREE.Matrix4().makeBasis(east, up, south);
  m.scale(new THREE.Vector3(0.001, 0.001, 0.001));
  m.setPosition(origin);
  return m;
}

// great-circle interpolation between two lon/lat points
export function slerpLonLat(a, b, t) {
  const va = lonLatToVec(a.lon, a.lat).normalize();
  const vb = lonLatToVec(b.lon, b.lat).normalize();
  const ang = va.angleTo(vb);
  const s = Math.sin(ang);
  return va.multiplyScalar(Math.sin((1 - t) * ang) / s).add(vb.multiplyScalar(Math.sin(t * ang) / s));
}

export function distanceKm(a, b) {
  return lonLatToVec(a.lon, a.lat).normalize().angleTo(lonLatToVec(b.lon, b.lat).normalize()) * R;
}
