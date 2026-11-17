// Night-time street-light carpet of Buenos Aires, shared by the city scene and
// the globe (so the camera can rise from street level to the continent with no seam).
// Coordinates: metres, x = east, y = south, origin at the Obelisco.
export const OBELISCO = { lon: -58.38156, lat: -34.60373 };
export const M_PER_DEG_LAT = 110574.0;
export const M_PER_DEG_LON = 111320.0 * Math.cos(OBELISCO.lat * Math.PI / 180);

export const GLSL_CITYLIGHTS = /* glsl */`
// box-filtered coverage of periodic lines: line occupies [0, 1/N) of each period
float lineCov(float x, float N, float w){
  w = max(w, 1e-4);
  float a = x + 0.5 * w, b = x - 0.5 * w;
  return clamp((floor(a) + min(fract(a) * N, 1.0) - floor(b) - min(fract(b) * N, 1.0)) / (N * w), 0.0, 1.0);
}
// pair of lamp rows on both kerbs of every street (period P metres, street width S)
float kerbLights(float x, float P, float S, float lw, float fw){
  float c = x / P;
  float off = (S * 0.5 - lw * 0.5) / P;
  return lineCov(c + off + lw / P * 0.5, P / lw, fw / P) + lineCov(c - off + lw / P * 0.5, P / lw, fw / P);
}
// p: metres (x east, y south) from the Obelisco. density: 0..1 urban light density.
vec3 cityGround(vec2 p, vec2 fw, float density, float t){
  float far = smoothstep(4500.0, 9000.0, length(p + vec2(2000.0, 2000.0)));
  vec2 q = p + vec2(vnoise(p * 0.00035) - 0.5, vnoise(p * 0.00035 + 7.3) - 0.5) * 120.0 * far;
  float rot = 0.10 * (vnoise(p * 0.00012 + 3.1) - 0.5) * far;
  q = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * q;
  float fwm = max(fw.x, fw.y);
  float closeK = 1.0 - smoothstep(4.0, 25.0, fwm);
  // lamps every ~28 m along the kerbs, resolvable only up close
  float lampX = mix(1.0, 0.25 + 2.2 * smoothstep(0.62, 0.95, fract(q.y / 28.0)), closeK);
  float lampY = mix(1.0, 0.25 + 2.2 * smoothstep(0.62, 0.95, fract(q.x / 28.0)), closeK);
  float sx = kerbLights(q.x, 125.0, 13.0, 2.0, fw.x) * lampX + kerbLights(q.x, 125.0, 9.0, 7.0, fw.x) * 0.10;
  float sy = kerbLights(q.y, 125.0, 13.0, 2.0, fw.y) * lampY + kerbLights(q.y, 125.0, 9.0, 7.0, fw.y) * 0.10;
  float in9e = 1.0 - smoothstep(64.0, 74.0, abs(p.x));
  float streets = (sx + sy) * (1.0 - in9e);
  // avenues every 8 blocks: brighter double rows
  float ax = kerbLights(q.x, 1000.0, 14.0, 4.0, fw.x) * lampX;
  float ay = kerbLights(q.y, 1000.0, 14.0, 4.0, fw.y) * lampY;
  float aves = (ax + ay) * (1.0 - in9e);
  // parks, rail yards, low density patches
  float patchN = smoothstep(0.28, 0.6, vnoise(p * 0.0009 + 11.0) * 0.6 + vnoise(p * 0.004) * 0.4);
  float d = density * mix(0.25, 1.0, patchN);
  vec3 warm = vec3(1.0, 0.52, 0.18), white = vec3(0.86, 0.92, 1.0);
  float wmix = smoothstep(0.55, 0.8, vnoise(p * 0.0015 + 4.0));
  float seg = 0.55 + 0.9 * hash12(floor(q / 125.0) + 0.5);
  vec3 c = mix(warm, white, wmix * 0.65) * streets * d * 2.0 * mix(1.0, seg, 0.8);
  c += mix(white, warm, 0.3) * aves * d * 3.2;
  // Av. 9 de Julio: lamp rows along the medians + sparse traffic in the lanes
  float ax9 = abs(p.x);
  float in9 = 1.0 - smoothstep(66.0, 72.0 + fw.x, ax9);
  float rows = kerbLights(p.x + 1000.0, 2000.0, 128.0, 3.0, fw.x) + kerbLights(p.x + 1000.0, 2000.0, 72.0, 2.5, fw.x) + kerbLights(p.x + 1000.0, 2000.0, 24.0, 2.0, fw.x);
  float rowLamps = mix(1.0, 0.15 + 3.0 * smoothstep(0.78, 0.98, fract(p.y / 26.0)), closeK);
  float pools = kerbLights(p.x + 1000.0, 2000.0, 72.0, 14.0, fw.x) * mix(1.0, 0.3 + 0.9 * exp(-pow((fract(p.y / 26.0) - 0.88) * 7.0, 2.0)), closeK);
  float laneW = 3.4;
  float laneId = floor(p.x / laneW);
  float lane = fract(p.x / laneW);
  float dir = p.x < 0.0 ? 1.0 : -1.0;
  float spacing = 34.0 + 30.0 * hash12(vec2(laneId, 9.0));
  float sp = dir * p.y / spacing + t * (2.2 + 0.6 * hash12(vec2(laneId, 3.0))) * 10.0 / spacing + hash12(vec2(laneId, 4.0));
  float carId = floor(sp);
  float cf = fract(sp) * spacing;            // metres along the car slot
  float present = step(0.35, hash12(vec2(laneId, carId)));
  float car = smoothstep(0.0, 0.6, cf) * (1.0 - smoothstep(1.2, 1.8, cf)) * present;   // light pair ~1.5 m
  float pair = smoothstep(0.18, 0.3, lane) * (1.0 - smoothstep(0.38, 0.5, lane)) + smoothstep(0.5, 0.62, lane) * (1.0 - smoothstep(0.7, 0.82, lane));
  float laneMask = (1.0 - smoothstep(38.0, 46.0, ax9)) * step(5.0, ax9);
  vec3 tcol = p.x < 0.0 ? vec3(1.0, 0.93, 0.8) * 3.0 : vec3(1.0, 0.05, 0.02) * 2.4;
  vec3 traffic = tcol * car * pair * laneMask;
  traffic = mix(tcol * 0.035 * laneMask, traffic, closeK);
  vec3 avenue = vec3(0.014, 0.016, 0.02) + white * rows * rowLamps * 1.3 + vec3(1.0, 0.85, 0.65) * pools * 0.22 + traffic;
  // green medians (trees) darken the light pools a little
  avenue *= 1.0 - 0.5 * (smoothstep(46.0, 50.0, ax9) * (1.0 - smoothstep(60.0, 64.0, ax9)));
  c = mix(c, avenue, in9);
  // Av. Corrientes: theatre lights
  float corr = 1.0 - smoothstep(9.0, 14.0 + fw.y, abs(p.y));
  c += corr * warm * 0.35 * smoothstep(0.05, 0.25, density) * step(72.0, ax9) * (1.0 - smoothstep(600.0, 1400.0, ax9)) * closeK;
  return c;
}
`;
