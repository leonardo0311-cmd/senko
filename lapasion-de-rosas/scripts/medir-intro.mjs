import { chromium } from "playwright";
const CORRIDAS = Number(process.env.CORRIDAS || 7);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const fps = [], p90 = [], largos = [];
for (let i = 0; i < CORRIDAS; i++) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.LENTITUD || 4) });
  await p.addInitScript(() => {
    window.__f = []; let a = performance.now();
    const tic = (t) => { window.__f.push([t, t - a]); a = t; requestAnimationFrame(tic); };
    requestAnimationFrame(tic);
    window.__abre = null;
    addEventListener("DOMContentLoaded", () => {
      const mirar = () => {
        const c = document.querySelector(".sobre-capa");
        if (c?.classList.contains("abriendo") && window.__abre === null) window.__abre = performance.now();
      };
      new MutationObserver(mirar).observe(document.body, { attributes: true, subtree: true, attributeFilter: ["class"] });
      mirar();
    });
  });
  await p.goto("http://localhost:3270/", { waitUntil: "load" });
  await p.waitForTimeout(4200);
  const r = await p.evaluate(() => {
    const f = window.__f.filter(([t]) => t >= window.__abre && t <= window.__abre + 2000).map(([, d]) => d);
    const o = [...f].sort((x, y) => x - y);
    return { fps: 1000 / (f.reduce((x, y) => x + y, 0) / f.length), p90: o[Math.floor(o.length * 0.9)], largos: f.filter(x => x > 32).length / f.length };
  });
  fps.push(r.fps); p90.push(r.p90); largos.push(r.largos);
  await p.close();
}
const med = (a) => { const o = [...a].sort((x, y) => x - y); return o[Math.floor(o.length / 2)]; };
const rango = (a) => `${Math.round(Math.min(...a))}–${Math.round(Math.max(...a))}`;
console.log(`${CORRIDAS} corridas · fps mediana ${Math.round(med(fps))} (rango ${rango(fps)}) · p90 mediana ${Math.round(med(p90))}ms · cuadros largos ${Math.round(med(largos) * 100)}%`);
await b.close();
