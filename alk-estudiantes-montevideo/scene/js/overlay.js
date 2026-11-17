// Spanish typography layer (DOM, 1080x1920 units), animated deterministically per frame.
import { clamp, range, easeOutExpo, easeOutCubic, easeInCubic, easeOutBack, mix } from './util.js';

const BUS = `<svg viewBox="0 0 96 48" width="86" height="43"><rect x="4" y="4" width="86" height="34" rx="7" fill="#fff"/><rect x="10" y="9" width="62" height="10" rx="2" fill="#171717"/><rect x="10" y="22" width="40" height="8" rx="2" fill="#171717"/><rect x="76" y="9" width="10" height="21" rx="2" fill="#171717"/><rect x="4" y="31" width="86" height="4" fill="#E30613"/><circle cx="22" cy="40" r="6" fill="#171717" stroke="#fff" stroke-width="2.5"/><circle cx="70" cy="40" r="6" fill="#171717" stroke="#fff" stroke-width="2.5"/></svg>`;
const FERRY = `<svg viewBox="0 0 96 48" width="86" height="43"><path d="M6 30 L90 30 L84 39 L12 39 Z" fill="#fff"/><path d="M20 21 L74 21 Q84 21 86 30 L16 30 Z" fill="#fff"/><rect x="24" y="23.5" width="52" height="4" rx="2" fill="#171717"/><path d="M34 13 L62 13 Q68 13 70 21 L30 21 Z" fill="#fff"/><rect x="26" y="9" width="4" height="8" fill="#fff"/><path d="M2 44 Q12 40 22 44 T42 44 T62 44 T82 44 T94 44" stroke="#E30613" stroke-width="3" fill="none"/></svg>`;

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
const show = (e, on) => { e.style.display = on ? 'block' : 'none'; };

export function buildOverlay(root) {
  root.innerHTML = '';
  const shade = el(root, '', 'shade');

  // ---------- S1 ----------
  const h1 = el(root, '', 'block', 'left:0; top:290px; width:1080px;');
  const h1Lines = ['¡EL PINCHA VA', 'POR LA GLORIA', 'ETERNA!'].map((txt, i) => {
    const m = el(h1, '', 'mask', `left:80px; top:${i * 146}px; height:156px; width:980px;`);
    return el(m, txt, `t hl ${i === 2 ? 'red glowR' : 'shadow'}`, 'font-size:158px; left:0; top:0;');
  });
  const h1Bar = el(h1, '', 'bar', 'left:86px; top:458px; width:330px; height:12px;');

  // map labels (anchored to the globe)
  const lab = (html, cls = '') => el(root, `<div class="lead"></div>${html}`, `anchor ${cls}`);
  const labBA = lab('<div class="t lab1" style="left:0;top:-30px">BUENOS AIRES</div>');
  const labMVD = lab('<div class="t lab1 red glowR" style="left:0;top:-32px">MONTEVIDEO</div>');
  const labARG = el(root, 'ARGENTINA', 't region');
  const labURY = el(root, 'URUGUAY', 't region');
  const labRIO = el(root, 'RÍO DE LA PLATA', 't river');

  // ---------- S2 / S3 option blocks (identical layout = equal importance) ----------
  const option = (n, icon, word) => {
    const b = el(root, '', 'block', 'left:0; top:300px; width:1080px;');
    const badge = el(b, `<span>OPCIÓN ${n}</span>`, 't badge', 'left:84px; top:0;');
    const ic = el(b, icon, 't icon', 'left:300px; top:6px;');
    const l1 = el(b, 'VIAJÁ EN', 't hl shadow', 'left:84px; top:92px; font-size:96px;');
    const mk = el(b, '', 'mask', 'left:76px; top:178px; width:1000px; height:190px;');
    const l2 = el(mk, word, 't hl red glowR', 'left:6px; top:0; font-size:182px; font-weight:900;');
    const l3 = el(b, '<span class="redbar"></span>IDA Y VUELTA', 't idv', 'left:84px; top:380px;');
    return { b, badge, ic, l1, l2, l3 };
  };
  const opt1 = option(1, BUS, 'MICRO');
  const opt2 = option(2, FERRY, 'BUQUEBUS');

  // ---------- S4 ----------
  const h4 = el(root, '', 'block', 'left:0; top:300px; width:1080px;');
  const h4a = el(h4, 'MONTEVIDEO', 't hl red glowR center', 'font-size:150px; top:0;');
  const h4b = el(h4, 'NOS ESPERA', 't hl shadow center', 'font-size:150px; top:140px;');
  const m4 = el(root, '', 'block', 'left:0; top:300px; width:1080px;');
  const m4a = el(m4, 'ESTUDIANTES', 't hl shadow center', 'font-size:150px; top:0;');
  const m4b = el(m4, '<span class="red">VS.</span> PALMEIRAS', 't hl shadow center', 'font-size:112px; top:146px;');
  const m4c = el(m4, '<span>FINAL COPA LIBERTADORES</span>', 't pill center', 'top:290px;');

  // ---------- S5 end card ----------
  const end = el(root, '', 'block', 'left:0; top:0; width:1080px; height:1920px;');
  const e0 = el(end, 'LA PASIÓN NO TIENE FRONTERAS.', 't tagline center', 'top:258px;');
  const e1 = el(end, '¡VAMOS PINCHA!', 't hl shadow center', 'font-size:150px; top:310px;');
  const e2 = el(end, 'ELEGÍ CÓMO VIAJAR A LA FINAL', 't sub center', 'top:472px;');
  const card = (x, icon, word) => el(end, `<div class="cicon">${icon}</div><div class="cword">${word}</div><div class="cidv">IDA Y VUELTA</div>`, 't card', `left:${x}px; top:556px;`);
  const c1 = card(80, BUS, 'MICRO');
  const c2 = card(560, FERRY, 'BUQUEBUS');
  const orTxt = el(end, 'o', 't ortxt', 'left:516px; top:660px;');
  const q1 = el(end, '¿QUERÉS MÁS INFORMACIÓN?', 't cta1 center', 'top:896px;');
  const q2 = el(end, 'ESCRIBINOS <span class="bubble">ESTUDIANTES</span>', 't cta2 center', 'top:964px;');
  const q3 = el(end, 'Y TE CONTAMOS TODOS LOS DETALLES', 't cta3 center', 'top:1108px;');
  const logo = el(end, '<div class="wrap"><img src="../assets/alk-logo-white.png" alt="ALK TRAVEL"><div class="lshine"></div></div>', 't logo center', 'top:1204px;');
  const logoShine = logo.querySelector('.lshine');

  const placeLab = (node, a, vis, flipAt = 560, force = null) => {
    show(node, vis > 0.001 && a && a.vis);
    if (!a || !a.vis) return;
    node.style.left = `${a.x}px`; node.style.top = `${a.y}px`;
    node.style.opacity = String(vis);
    if (node.classList.contains('anchor')) { node.classList.toggle('left', force === null ? a.x > flipAt : force); node.firstChild.style.width = `${36 * vis}px`; }
  };

  return {
    update(t, A = {}) {
      const sh = Math.max(range(0.2, 0.6, t) * (1 - range(3.3, 3.7, t)), range(4.1, 4.4, t) * (1 - range(7.6, 7.9, t)),
        range(7.95, 8.3, t) * (1 - range(11.7, 11.95, t)), range(11.95, 12.2, t) * (1 - range(15.4, 15.7, t)));
      shade.style.opacity = String(sh * 0.85);

      // S1 headline
      show(h1, t > 0.2 && t < 3.7);
      h1Lines.forEach((ln, i) => {
        const a = easeOutExpo(range(0.32 + i * 0.13, 0.92 + i * 0.13, t));
        const ex = easeInCubic(range(3.2 + i * 0.05, 3.5 + i * 0.05, t));
        set(ln, { y: (1 - a) * 156 - ex * 60, skew: (1 - a) * -8, o: a * (1 - ex), blur: ex * 10 });
      });
      const bar = easeOutExpo(range(0.95, 1.5, t)) * (1 - easeInCubic(range(3.15, 3.45, t)));
      set(h1Bar, { sx: bar, s: 1, o: bar > 0.01 ? 1 : 0, skew: -18 });

      // labels
      placeLab(labBA, A.ba, A.baVis ?? 0, 560, A.ba ? A.ba.x > 360 : true);
      placeLab(labMVD, A.mvd, A.mvdVis ?? 0, 560, A.mvd ? A.mvd.x > 700 : false);
      placeLab(labARG, A.arg, A.argVis ?? 0);
      placeLab(labURY, A.ury, A.uryVis ?? 0);
      placeLab(labRIO, A.rio, A.rioVis ?? 0);

      // option blocks
      const optAnim = (o, t0, t1) => {
        show(o.b, t > t0 - 0.05 && t < t1 + 0.05);
        const a0 = easeOutBack(range(t0, t0 + 0.4, t), 1.6), a1 = easeOutExpo(range(t0 + 0.1, t0 + 0.6, t)), a2 = easeOutExpo(range(t0 + 0.22, t0 + 0.75, t));
        const a3 = easeOutCubic(range(t0 + 0.45, t0 + 0.9, t));
        const ex = easeInCubic(range(t1 - 0.3, t1, t));
        set(o.badge, { s: mix(0.6, 1, a0), o: Math.min(1, a0 * 1.5) * (1 - ex) });
        set(o.ic, { x: (1 - a1) * -40, o: a1 * (1 - ex) });
        set(o.l1, { y: (1 - a1) * 40, o: a1 * (1 - ex), blur: (1 - a1) * 8 + ex * 8 });
        set(o.l2, { y: (1 - a2) * 190, skew: (1 - a2) * -8, o: a2 * (1 - ex), blur: ex * 10 });
        set(o.l3, { x: (1 - a3) * -60, o: a3 * (1 - ex) });
      };
      optAnim(opt1, 4.2, 7.85);
      optAnim(opt2, 8.12, 11.9);

      // S4
      show(h4, t > 11.95 && t < 13.6);
      const b1 = easeOutCubic(range(12.02, 12.32, t)), b2 = easeOutCubic(range(12.14, 12.44, t)), bx = easeInCubic(range(13.25, 13.5, t));
      set(h4a, { s: mix(1.35, 1, b1), o: b1 * (1 - bx), blur: (1 - b1) * 16 + bx * 10 });
      set(h4b, { s: mix(1.35, 1, b2), o: b2 * (1 - bx), blur: (1 - b2) * 16 + bx * 10 });
      show(m4, t > 13.4 && t < 15.75);
      const d1 = easeOutExpo(range(13.5, 13.95, t)), d2 = easeOutExpo(range(13.62, 14.07, t)), d3 = easeOutExpo(range(13.85, 14.3, t)), dx = easeInCubic(range(15.35, 15.6, t));
      set(m4a, { y: (1 - d1) * 80, o: d1 * (1 - dx), blur: (1 - d1) * 12 + dx * 10 });
      set(m4b, { y: (1 - d2) * 80, o: d2 * (1 - dx), blur: (1 - d2) * 12 + dx * 10 });
      set(m4c, { sx: mix(0.3, 1, d3), s: 1, o: d3 * (1 - dx) });

      // S5
      show(end, t > 15.7);
      const f1 = easeOutExpo(range(15.85, 16.3, t)), f2 = easeOutCubic(range(16.05, 16.45, t));
      const f3 = easeOutBack(range(16.3, 16.75, t), 1.4), f4 = easeOutBack(range(16.42, 16.87, t), 1.4);
      set(e0, { o: easeOutCubic(range(15.95, 16.5, t)), ls: `${mix(0.5, 0.22, easeOutCubic(range(15.95, 16.5, t)))}em` });
      set(e1, { y: (1 - f1) * 90, s: mix(1.2, 1, f1), o: f1, blur: (1 - f1) * 14, skew: (1 - f1) * -8 });
      set(e2, { o: f2, ls: `${mix(0.4, 0.12, f2)}em` });
      const dimCards = 1 - 0.25 * easeOutCubic(range(17.7, 18.2, t));
      set(c1, { y: (1 - range(16.3, 16.75, t)) * 60, s: mix(0.85, 1, clamp(f3)), o: Math.min(1, f3 * 1.4) * dimCards });
      set(c2, { y: (1 - range(16.42, 16.87, t)) * 60, s: mix(0.85, 1, clamp(f4)), o: Math.min(1, f4 * 1.4) * dimCards });
      set(orTxt, { o: easeOutCubic(range(16.7, 17.0, t)) * dimCards });
      const g1 = easeOutExpo(range(17.55, 17.95, t)), g2 = easeOutBack(range(17.75, 18.2, t), 1.8), g3 = easeOutCubic(range(18.0, 18.4, t));
      set(q1, { y: (1 - g1) * 50, o: g1, blur: (1 - g1) * 8 });
      const ping = 1 + 0.04 * Math.sin(Math.max(0, t - 18.2) * 5.0) * Math.exp(-Math.max(0, t - 18.2) * 1.5);
      set(q2, { s: mix(0.7, 1, g2) * ping, o: Math.min(1, g2 * 1.4) });
      set(q3, { o: g3, ls: `${mix(0.3, 0.06, g3)}em` });
      const g4 = easeOutCubic(range(18.4, 18.95, t));
      set(logo, { o: g4, s: mix(0.9, 1, g4), blur: (1 - g4) * 10, clip: `inset(0 ${(1 - easeOutExpo(range(18.4, 18.9, t))) * 100}% 0 0)` });
      const ls1 = range(19.0, 19.6, t);
      logoShine.style.opacity = String(Math.sin(ls1 * Math.PI));
      logoShine.style.backgroundPosition = `${mix(110, -10, ls1)}% 0`;
    },
  };
}
