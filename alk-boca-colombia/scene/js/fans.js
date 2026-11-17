// Procedural painters for Boca Juniors supporters (no crests or logos — just the
// iconic blue jersey with the horizontal yellow band, scarves and flags).
import { rng } from './util.js';

export const BLUE = '#0b2f8f', BLUE_D = '#061d5e', YELLOW = '#f5c800', YELLOW_D = '#c99a00';
const SKIN = ['#f1c7a3', '#e0ac85', '#c98f68', '#a8714f', '#8a5a3c', '#f5d2b5', '#d79d78'];
const HAIR = ['#1b1210', '#2a1a12', '#3b2618', '#120c0a', '#5a3b22', '#0d0d0d'];

// one supporter, feet at (x, y), height h (pixels). pose: 0 arms up, 1 arms mid, 2 one arm up
export function drawFan(ctx, x, y, h, r, pose, opts = {}) {
  const s = h / 100;
  const skin = SKIN[Math.floor(r() * SKIN.length)];
  const hair = HAIR[Math.floor(r() * HAIR.length)];
  const kind = r(); // jersey type
  const jersey = opts.jersey || (kind < 0.72 ? 'home' : (kind < 0.9 ? 'yellow' : 'navy'));
  const scarf = r() < 0.55, flag = !scarf && r() < 0.35;
  const lean = (r() - 0.5) * 6 * s;
  ctx.save();
  ctx.translate(x + lean, y);
  const body = jersey === 'yellow' ? YELLOW : (jersey === 'navy' ? '#0a1f55' : BLUE);
  const sleeve = jersey === 'yellow' ? YELLOW_D : BLUE_D;
  // torso (shoulders at -62, waist at -20)
  const tw = 26 * s * (0.9 + r() * 0.25);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-tw, -60 * s); ctx.quadraticCurveTo(-tw - 2 * s, -30 * s, -tw * 0.8, -6 * s);
  ctx.lineTo(tw * 0.8, -6 * s); ctx.quadraticCurveTo(tw + 2 * s, -30 * s, tw, -60 * s);
  ctx.quadraticCurveTo(0, -68 * s, -tw, -60 * s); ctx.fill();
  if (jersey === 'home') { // the yellow band across the chest
    ctx.save(); ctx.clip();
    ctx.fillStyle = YELLOW; ctx.fillRect(-tw * 1.2, -46 * s, tw * 2.4, 12 * s);
    ctx.restore();
  } else if (jersey === 'yellow') {
    ctx.save(); ctx.clip(); ctx.fillStyle = BLUE; ctx.fillRect(-tw * 1.2, -62 * s, tw * 2.4, 5 * s); ctx.restore();
  }
  // shading on the torso
  const g = ctx.createLinearGradient(-tw, 0, tw, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(0.45, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.rect(-tw * 1.1, -64 * s, tw * 2.2, 60 * s); ctx.globalCompositeOperation = 'source-atop'; ctx.fill(); ctx.globalCompositeOperation = 'source-over';

  // arms
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

  // neck + head
  ctx.fillStyle = skin;
  ctx.fillRect(-5 * s, -70 * s, 10 * s, 10 * s);
  ctx.beginPath(); ctx.ellipse(0, -80 * s, 10.5 * s, 12.5 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.ellipse(0, -86 * s, 11 * s, 8 * s, 0, Math.PI, 2 * Math.PI); ctx.fill();
  if (r() < 0.3) { ctx.fillRect(-11 * s, -88 * s, 22 * s, 6 * s); }
  // open mouth (singing)
  ctx.fillStyle = 'rgba(40,10,10,0.8)';
  ctx.beginPath(); ctx.ellipse(0, -74 * s, 3 * s, 3.2 * s, 0, 0, 7); ctx.fill();
  // face shading
  const fg = ctx.createRadialGradient(-3 * s, -84 * s, 2 * s, 0, -80 * s, 14 * s);
  fg.addColorStop(0, 'rgba(255,230,200,0.18)'); fg.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(0, -80 * s, 10.5 * s, 12.5 * s, 0, 0, 7); ctx.fill();

  // scarf held above the head (blue / yellow stripes with fringes)
  if (scarf && pose !== 2) {
    const yS = up ? -118 * s : -98 * s, w = up ? 44 * s : 52 * s;
    ctx.save(); ctx.translate(0, yS); ctx.rotate((r() - 0.5) * 0.25);
    const n = 7;
    for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? YELLOW : BLUE; ctx.fillRect(-w + (2 * w / n) * i, -6 * s, 2 * w / n + 0.5, 12 * s); }
    ctx.fillStyle = YELLOW_D;
    for (let i = 0; i < 6; i++) { ctx.fillRect(-w - 4 * s, -5 * s + i * 2 * s, 4 * s, 1 * s); ctx.fillRect(w, -5 * s + i * 2 * s, 4 * s, 1 * s); }
    ctx.restore();
  }
  if (flag) { // blue-yellow-blue flag on a short pole
    ctx.save(); ctx.translate(tw * 0.9, -110 * s); ctx.rotate(0.25 + (r() - 0.5) * 0.3);
    ctx.fillStyle = '#ddd'; ctx.fillRect(-1 * s, 0, 2 * s, 60 * s);
    const fw = 46 * s, fh = 30 * s;
    ctx.fillStyle = BLUE; ctx.fillRect(1 * s, 0, fw, fh);
    ctx.fillStyle = YELLOW; ctx.fillRect(1 * s, fh / 3, fw, fh / 3);
    ctx.restore();
  }
  ctx.restore();
}

// Long strip of the cabin seen through the windows: two poses stacked vertically.
// Returns a canvas; x maps to metres along the cabin (repeat), y to height.
export function cabinStrip(width = 4096, rowH = 256, metres = 24) {
  const c = document.createElement('canvas');
  c.width = width; c.height = rowH * 2;
  const ctx = c.getContext('2d');
  const pxPerM = width / metres;
  for (let row = 0; row < 2; row++) {
    const y0 = row * rowH;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, y0, width, rowH); ctx.clip();
    // cabin interior: ceiling LED wash (blue/gold mood lighting) + overhead bins
    const bg = ctx.createLinearGradient(0, y0, 0, y0 + rowH);
    bg.addColorStop(0, '#16307e'); bg.addColorStop(0.3, '#2a3c78'); bg.addColorStop(0.62, '#3b3a44'); bg.addColorStop(1, '#1d1a1c');
    ctx.fillStyle = bg; ctx.fillRect(0, y0, width, rowH);
    for (let x = 0; x < width; x += pxPerM * 0.9) { // warm reading lights
      ctx.fillStyle = 'rgba(255,214,140,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y0 + rowH * 0.06, pxPerM * 0.08, rowH * 0.025, 0, 0, 7); ctx.fill();
    }
    // back row (smaller, further away, a bit darker)
    const rb = rng(991);
    for (let x = pxPerM * 0.3; x < width; x += pxPerM * (0.5 + rb() * 0.25)) {
      ctx.globalAlpha = 0.8;
      drawFan(ctx, x, y0 + rowH * 0.72, pxPerM * 0.72, rng(Math.floor(x)), (row + Math.floor(x)) % 3 === 0 ? 2 : row);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(10,15,40,0.3)'; ctx.fillRect(0, y0, width, rowH);
    // front row
    const r = rng(77);
    for (let x = pxPerM * 0.2; x < width; x += pxPerM * (0.55 + r() * 0.2)) {
      const pose = (Math.floor(x) % 5 === 0) ? 2 : row;
      drawFan(ctx, x, y0 + rowH * 0.9, pxPerM * 0.95, rng(Math.floor(x * 7.3)), pose);
    }
    // seat backs in the foreground (dark blue with a yellow headrest cover)
    for (let x = pxPerM * 0.1; x < width; x += pxPerM * 0.82) {
      ctx.fillStyle = '#0a1636';
      ctx.fillRect(x, y0 + rowH * 0.86, pxPerM * 0.45, rowH * 0.2);
      ctx.fillStyle = '#d4a900';
      ctx.fillRect(x, y0 + rowH * 0.86, pxPerM * 0.45, rowH * 0.03);
    }
    ctx.restore();
  }
  // soft focus: we look through thick cabin glass
  const c2 = document.createElement('canvas');
  c2.width = c.width; c2.height = c.height;
  const x2 = c2.getContext('2d');
  x2.filter = 'blur(1.6px)';
  x2.drawImage(c, 0, 0);
  return c2;
}
