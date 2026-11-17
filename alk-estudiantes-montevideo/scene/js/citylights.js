// La Plata at night: the planned square city (grid rotated 45°, avenues every
// six blocks, the great X diagonals, a rhombus of diagonals, plazas, ring road),
// shared by the city scene and the globe so the camera can rise seamlessly.
// Coordinates: metres, x = east, y = south, origin at Plaza Moreno (cathedral).
export const ORIGIN = { lon: -57.9545, lat: -34.9214 };
export const M_PER_DEG_LAT = 110574.0;
export const M_PER_DEG_LON = 111320.0 * Math.cos(ORIGIN.lat * Math.PI / 180);
export const BLOCK = 120.0;          // block period (m)
export const HALF = 2520.0;          // half side of the urban square (m)
export const toGrid = (x, y) => [(x + y) * Math.SQRT1_2, (y - x) * Math.SQRT1_2];  // geo (east, south) -> grid
export const fromGrid = (u, v) => [(u - v) * Math.SQRT1_2, (u + v) * Math.SQRT1_2];

export const GLSL_CITYLIGHTS = /* glsl */`
float lineCov(float x, float N, float w){
  w = max(w, 1e-4);
  float a = x + 0.5 * w, b = x - 0.5 * w;
  return clamp((floor(a) + min(fract(a) * N, 1.0) - floor(b) - min(fract(b) * N, 1.0)) / (N * w), 0.0, 1.0);
}
float kerbLights(float x, float P, float S, float lw, float fw){
  float c = x / P;
  float off = (S * 0.5 - lw * 0.5) / P;
  return lineCov(c + off + lw / P * 0.5, P / lw, fw / P) + lineCov(c - off + lw / P * 0.5, P / lw, fw / P);
}
// soft line of half-width hw (m) along distance d, filtered by the pixel footprint
float band(float d, float hw, float fw){ return 1.0 - smoothstep(hw - fw * 0.5 - 0.5, hw + fw * 0.5 + 0.5, abs(d)); }
// moving light pairs along a road: s = coordinate along the road, lane offset handled by caller
float traffic(float s, float laneId, float t, float dir, float closeK){
  float spacing = 30.0 + 26.0 * hash12(vec2(laneId, 9.0));
  float sp = dir * s / spacing + t * 2.2 * 10.0 / spacing + hash12(vec2(laneId, 4.0));
  float present = step(0.4, hash12(vec2(laneId, floor(sp))));
  float cf = fract(sp) * spacing;
  float car = smoothstep(0.0, 0.6, cf) * (1.0 - smoothstep(1.2, 1.8, cf)) * present;
  return mix(0.05, car, closeK);
}
// p: metres (x east, y south) from Plaza Moreno. density: 0..1 urban light density.
vec3 cityGround(vec2 p, vec2 fw, float density, float t){
  vec2 g = vec2(p.x + p.y, p.y - p.x) * 0.70710678;             // grid frame
  vec2 fwg = vec2(length(fw), length(fw));
  float fwm = fwg.x;
  float closeK = 1.0 - smoothstep(4.0, 25.0, fwm);
  float inSq = (1.0 - smoothstep(${'${HALF}'} - 10.0, ${'${HALF}'} + 30.0, max(abs(g.x), abs(g.y))));
  // outside the square: warped suburban grid
  float far = 1.0 - inSq;
  vec2 q = g + vec2(vnoise(p * 0.0004) - 0.5, vnoise(p * 0.0004 + 7.3) - 0.5) * 160.0 * far;
  float lampX = mix(1.0, 0.25 + 2.2 * smoothstep(0.62, 0.95, fract(q.y / 28.0)), closeK);
  float lampY = mix(1.0, 0.25 + 2.2 * smoothstep(0.62, 0.95, fract(q.x / 28.0)), closeK);
  float streets = kerbLights(q.x, 120.0, 13.0, 2.0, fwg.x) * lampX + kerbLights(q.y, 120.0, 13.0, 2.0, fwg.y) * lampY;
  streets += (kerbLights(q.x, 120.0, 9.0, 7.0, fwg.x) + kerbLights(q.y, 120.0, 9.0, 7.0, fwg.y)) * 0.1;
  // avenues every six blocks (with a lit median)
  float aves = (kerbLights(q.x, 720.0, 30.0, 4.0, fwg.x) + kerbLights(q.x, 720.0, 4.0, 3.0, fwg.x)) * lampX
             + (kerbLights(q.y, 720.0, 30.0, 4.0, fwg.y) + kerbLights(q.y, 720.0, 4.0, 3.0, fwg.y)) * lampY;
  aves *= inSq;
  // the great diagonals (X) and the rhombus of diagonals
  float dX = min(abs(g.x - g.y), abs(g.x + g.y)) * 0.70710678;
  float dR = abs(abs(g.x) + abs(g.y) - ${'${HALF}'}) * 0.70710678;
  // diagonals: lamp rows on both kerbs + median, with traffic
  float lampD = mix(1.0, 0.2 + 2.4 * smoothstep(0.7, 0.97, fract((g.x + g.y) * 0.7071 / 26.0)), closeK);
  float diag = (band(dX - 11.0, 1.5, fwm) + band(dX + 11.0, 1.5, fwm) + band(dX, 1.2, fwm)) * inSq
             + (band(dR - 10.0, 1.5, fwm) + band(dR + 10.0, 1.5, fwm)) * inSq;
  diag *= lampD;
  float diagTraffic = band(dX - 5.0, 3.0, fwm) * traffic(g.x + g.y, floor((g.x - g.y) / 3.5), t, sign(g.x - g.y + 0.01), closeK) * inSq;
  // ring road (Circunvalación): lamp rows, not a filled band
  float rd = max(abs(g.x), abs(g.y)) - ${HALF.toFixed(1)} - 30.0;
  float ring = (band(rd - 22.0, 1.5, fwm) + band(rd + 22.0, 1.5, fwm) + band(rd, 1.5, fwm)) * lampD;
  // plazas at avenue crossings: dark lawns framed by lights
  vec2 pc = (fract(g / 720.0 + 0.5) - 0.5) * 720.0;
  float plaza = (1.0 - smoothstep(55.0, 60.0 + fwm, max(abs(pc.x), abs(pc.y)))) * inSq;
  float plazaRim = band(max(abs(pc.x), abs(pc.y)) - 60.0, 1.2, fwm) * inSq * mix(1.0, 0.3 + 2.0 * step(0.75, fract((pc.x + pc.y) / 18.0)), closeK);
  // dark patches (rail yards, parks) & the Paseo del Bosque to the north-east
  float patchN = smoothstep(0.28, 0.6, vnoise(p * 0.0009 + 11.0) * 0.6 + vnoise(p * 0.004) * 0.4);
  float bosque = 0.0;
  float d = density * mix(0.3, 1.0, mix(patchN, 1.0, inSq * 0.7));
  vec3 warm = vec3(1.0, 0.52, 0.18), white = vec3(0.88, 0.92, 1.0);
  float seg = 0.6 + 0.8 * hash12(floor(q / 120.0) + 0.5);
  vec3 c = mix(warm, white, smoothstep(0.55, 0.8, vnoise(p * 0.0015 + 4.0)) * 0.6) * streets * d * 2.0 * mix(1.0, seg, 0.7);
  c += mix(white, warm, 0.3) * aves * d * 2.8;
  c += white * diag * 2.2 * smoothstep(0.05, 0.3, density) + vec3(1.0, 0.95, 0.85) * diagTraffic * 3.0;
  c += mix(white, warm, 0.5) * ring * 2.0 * smoothstep(0.05, 0.3, density);
  c = mix(c, vec3(0.004, 0.012, 0.006), plaza * 0.85);
  c += white * plazaRim * 1.4 * smoothstep(0.05, 0.3, density);
  c *= 1.0 - bosque;
  return c;
}
`.replaceAll('${HALF}', HALF.toFixed(1));
