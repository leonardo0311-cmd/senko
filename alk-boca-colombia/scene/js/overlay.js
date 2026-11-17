// Spanish typography layer (DOM, 1080x1920 units), animated deterministically per frame.
import { clamp, range, easeOutExpo, easeOutCubic, easeInCubic, easeOutBack, easeInOutCubic, mix } from './util.js';

const PIN = `<svg viewBox="0 0 24 32" width="34" height="46"><path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0z" fill="#F5D400"/><circle cx="12" cy="11.8" r="4.6" fill="#061329"/></svg>`;
const PLANE = `<svg viewBox="0 0 64 64" width="44" height="44"><path d="M60 30.5c0-1.9-1.6-3.5-3.5-3.5H40.8L26.6 5.3C26.1 4.5 25.2 4 24.3 4h-3.1c-.9 0-1.5.9-1.2 1.8L26 27H13.6l-4.8-6.4C8.4 20.2 7.8 20 7.2 20H4.6c-.8 0-1.4.8-1.1 1.6L6.9 32 3.5 42.4c-.3.8.3 1.6 1.1 1.6h2.6c.6 0 1.2-.3 1.6-.8L13.6 37H26l-6 21.2c-.3.9.4 1.8 1.2 1.8h3.1c.9 0 1.8-.5 2.3-1.3L40.8 37h15.7c1.9 0 3.5-1.6 3.5-3.5v-3z" fill="#F5D400"/></svg>`;

function el(parent, html, cls = '', style = '') {
  const d = document.createElement('div');
  d.className = cls; d.innerHTML = html;
  if (style) d.setAttribute('style', style);
  parent.appendChild(d);
  return d;
}
const set = (e, { x = 0, y = 0, s = 1, sx = null, o = 1, blur = 0, skew = 0, clip = null, ls = null } = {}) => {
  e.style.transform = `translate(${x}px, ${y}px) scale(${sx ?? s}, ${s}) skewX(${skew}deg)`;
  e.style.opacity = String(clamp(o));
  e.style.filter = blur > 0.05 ? `blur(${blur}px)` : 'none';
  if (clip !== null) e.style.clipPath = clip;
  if (ls !== null) e.style.letterSpacing = ls;
};

export function buildOverlay(root) {
  root.innerHTML = '';
  const shade = el(root, '', 'shade');
  // ---------- S1 headline ----------
  const h1 = el(root, '', 'block', 'left:0; top:288px; width:1080px;');
  const h1Lines = ['¡LA PASIÓN', 'SE PREPARA', 'PARA VIAJAR!'].map((txt, i) => {
    const m = el(h1, '', 'mask', `left:86px; top:${i * 142}px; height:150px; width:960px;`);
    return el(m, txt, `t hl ${i === 2 ? 'yellow glowY' : 'shadow'}`, 'font-size:156px; left:0; top:0;');
  });
  const h1Bar = el(h1, '', 'bar', 'left:92px; top:452px; width:420px; height:12px;');

  // ---------- map labels ----------
  const baLab = el(root, `<div class="lead"></div><div class="t lab1" style="left:0;top:-30px">BUENOS AIRES</div><div class="t lab2" style="left:2px;top:22px">ARGENTINA</div>`, 'anchor');
  const colLab = el(root, `<div class="lead"></div><div class="t lab1 yellow glowY" style="left:0;top:-34px;font-size:62px">COLOMBIA</div>`, 'anchor');

  // ---------- S2 DESTINO: COLOMBIA ----------
  const dest = el(root, '', 'block', 'left:0; top:300px; width:1080px;');
  const destPin = el(dest, PIN, 't', 'left:86px; top:8px;');
  const destLabel = el(dest, 'DESTINO:', 't label', 'left:134px; top:12px; font-size:38px;');
  const destMask = el(dest, '', 'mask', 'left:78px; top:58px; width:980px; height:200px;');
  const destWord = el(destMask, 'COLOMBIA', 't hl yellow glowY', 'font-size:204px; left:0; top:-6px; font-weight:900;');

  // ---------- S3 headline ----------
  const h3 = el(root, '', 'block', 'left:0; top:300px; width:1080px;');
  const h3a = el(h3, 'DONDE JUEGA BOCA,', 't hl shadow center', 'font-size:120px; top:0;');
  const h3b = el(h3, 'VIAJA SU GENTE.', 't hl yellow glowY center', 'font-size:138px; top:118px;');

  // ---------- S4 offer ----------
  const offer = el(root, '', 'block', 'left:0; top:0; width:1080px; height:1920px;');
  const o1 = el(offer, '¡BOCA VIAJA', 't hl shadow center', 'font-size:150px; top:336px;');
  const o2 = el(offer, 'A <span class="yellow">COLOMBIA!</span>', 't hl shadow center', 'font-size:150px; top:474px;');
  const oSub = el(offer, `<span class="rule"></span>${PLANE}<span>IDA Y VUELTA EN AVIÓN</span><span class="rule"></span>`, 't sub center', 'top:654px;');
  const oPrice = el(offer, '<span class="usd">USD</span><span class="numwrap"><span class="num">1.400</span><span class="numShine">1.400</span></span>', 't price center', 'top:726px;');
  const oShine = oPrice.querySelector('.numShine');
  const oPill = el(offer, '<span>SOLO PASAJE AÉREO</span>', 't pill center', 'top:1062px;');
  const oLogo = el(offer, '<div class="wrap"><img src="../assets/alk-logo-white.png" alt="ALK TRAVEL"><div class="lshine"></div></div>', 't logo center', 'top:1192px;');
  const oLogoShine = oLogo.querySelector('.lshine');

  const all = [shade, h1, baLab, colLab, dest, h3, offer];

  return {
    update(t, anchors = {}) {
      for (const e of all) e.style.display = 'block';
      // legibility shade at the top (headline zones)
      const sh = Math.max(range(0.2, 0.6, t) * (1 - range(3.6, 4.0, t)), range(7.2, 7.5, t) * (1 - range(8.4, 8.7, t)), range(10.3, 10.6, t) * (1 - range(13.35, 13.6, t)));
      shade.style.opacity = String(sh * 0.85);

      // S1 headline
      h1.style.display = t > 0.2 && t < 4.05 ? 'block' : 'none';
      h1Lines.forEach((ln, i) => {
        const a = easeOutExpo(range(0.35 + i * 0.13, 0.95 + i * 0.13, t));
        const ex = easeInCubic(range(3.5 + i * 0.05, 3.9 + i * 0.05, t));
        set(ln, { y: (1 - a) * 150 - ex * 60, skew: (1 - a) * -8, o: a * (1 - ex), blur: ex * 10 });
      });
      const bar = easeOutExpo(range(0.95, 1.5, t)) * (1 - easeInCubic(range(3.45, 3.8, t)));
      set(h1Bar, { sx: bar, s: 1, o: bar > 0.01 ? 1 : 0, skew: -18 });

      // labels
      const lab = (node, a, vis) => {
        node.style.display = vis > 0.001 && a ? 'block' : 'none';
        if (!a) return;
        node.style.left = `${a.x}px`; node.style.top = `${a.y}px`;
        node.classList.toggle('left', a.x > 560);
        node.style.opacity = String(vis * (a.vis ?? 1));
        node.firstChild.style.width = `${36 * vis}px`;
      };
      lab(baLab, anchors.ba, easeOutCubic(range(2.95, 3.4, t)) * (1 - range(4.0, 4.2, t)));
      lab(colLab, anchors.col, easeOutCubic(range(7.75, 8.1, t)) * (1 - range(8.45, 8.6, t)));

      // DESTINO: COLOMBIA
      dest.style.display = t > 7.2 && t < 8.7 ? 'block' : 'none';
      const d1 = easeOutExpo(range(7.3, 7.75, t)), dx = easeInCubic(range(8.35, 8.6, t));
      set(destPin, { y: (1 - easeOutBack(range(7.3, 7.7, t), 2.2)) * -40, o: d1 * (1 - dx) });
      set(destLabel, { o: d1 * (1 - dx), ls: `${mix(0.9, 0.42, d1)}em`, blur: dx * 8 });
      const d2 = easeOutExpo(range(7.45, 8.0, t));
      set(destWord, { x: (1 - d2) * -120, o: Math.min(1, d2 * 1.5) * (1 - dx), blur: (1 - d2) * 10 + dx * 12, skew: (1 - d2) * -10, clip: `inset(0 ${(1 - d2) * 100}% 0 0)` });

      // S3 headline
      h3.style.display = t > 10.3 && t < 13.65 ? 'block' : 'none';
      const s1 = easeOutCubic(range(10.45, 10.75, t)), s2 = easeOutCubic(range(10.65, 10.95, t));
      const out3 = easeInCubic(range(13.3, 13.55, t));
      const breathe = 1 + 0.012 * Math.sin((t - 10.9) * 2.4) * range(10.9, 11.4, t);
      set(h3a, { s: mix(1.35, 1, s1) * breathe, o: s1 * (1 - out3), blur: (1 - s1) * 16 + out3 * 10, y: -out3 * 40 });
      set(h3b, { s: mix(1.45, 1, s2) * breathe, o: s2 * (1 - out3), blur: (1 - s2) * 18 + out3 * 10, y: -out3 * 40 });

      // S4 offer
      offer.style.display = t > 13.55 ? 'block' : 'none';
      const a1 = easeOutExpo(range(13.75, 14.25, t)), a2 = easeOutExpo(range(13.88, 14.38, t));
      set(o1, { y: (1 - a1) * 90, s: mix(1.18, 1, a1), o: a1, blur: (1 - a1) * 14, skew: (1 - a1) * -10 });
      set(o2, { y: (1 - a2) * 90, s: mix(1.18, 1, a2), o: a2, blur: (1 - a2) * 14, skew: (1 - a2) * -10 });
      const a3 = easeOutCubic(range(14.25, 14.75, t));
      set(oSub, { o: a3, ls: `${mix(0.5, 0.16, a3)}em`, blur: (1 - a3) * 6 });
      const a4 = range(14.55, 14.95, t);
      const pop = a4 < 1 ? mix(1.9, 1, easeOutBack(a4, 1.4)) : 1 + 0.015 * Math.sin((t - 14.95) * 3.2);
      set(oPrice, { s: pop, o: Math.min(1, a4 * 2.5), blur: (1 - easeOutCubic(a4)) * 22 });
      const sh1 = range(15.0, 15.55, t), sh2 = range(16.9, 17.45, t);
      oShine.style.opacity = String(Math.max(Math.sin(sh1 * Math.PI), Math.sin(sh2 * Math.PI)));
      oShine.style.backgroundPosition = `${mix(110, -10, sh1 < 1 ? sh1 : sh2)}% 0`;
      const a5 = easeOutExpo(range(15.0, 15.45, t));
      set(oPill, { o: a5, sx: mix(0.3, 1, a5), s: 1 });
      oPill.firstChild.style.opacity = String(easeOutCubic(range(15.15, 15.5, t)));
      const a6 = easeOutCubic(range(15.5, 16.1, t));
      set(oLogo, { o: a6, s: mix(0.9, 1, a6), blur: (1 - a6) * 10, clip: `inset(0 ${(1 - easeOutExpo(range(15.5, 16.0, t))) * 100}% 0 0)` });
      const ls1 = range(16.05, 16.7, t), ls2 = range(17.9, 18.5, t);
      oLogoShine.style.opacity = String(Math.max(Math.sin(ls1 * Math.PI), Math.sin(ls2 * Math.PI)));
      oLogoShine.style.backgroundPosition = `${mix(110, -10, ls1 < 1 ? ls1 : ls2)}% 0`;
    },
  };
}
