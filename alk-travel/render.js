#!/usr/bin/env node
/*
 * ALK TRAVEL — renderer for alk-travel.html
 *
 *   node render.js beats [offset]        one frame per beat (30 PNGs) + contact sheet → work/beats
 *   node render.js frames t1 t2 ...      specific times → work/frames
 *   node render.js audio                 soundtrack (Web Audio OfflineAudioContext) → output/alk-travel-soundtrack.wav
 *   node render.js video                 60 fps, 3 sub-frames per frame blended with ffmpeg tmix, audio muxed
 *
 * If assets/logo.svg or assets/logo.png exists it replaces the placeholder logo.
 */
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const HTML = 'file://' + path.join(HERE, 'alk-travel.html');
const WORK = path.join(HERE, 'work');
const OUT = path.join(HERE, 'output');
const W = 1080, H = 1920, DUR = 15, FPS = 60, SUB = 3;

function logoAsset() {
  for (const f of ['logo.svg', 'logo.png', 'logo.webp']) {
    const p = path.join(HERE, 'assets', f);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(HTML);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 30000 });
  const logo = logoAsset();
  if (logo) {
    const ext = path.extname(logo).slice(1);
    const mime = ext === 'svg' ? 'image/svg+xml' : 'image/' + ext;
    const href = `data:${mime};base64,` + fs.readFileSync(logo).toString('base64');
    await page.evaluate(async (href) => {
      const img = new Image();
      img.src = href;
      await img.decode();
      window.setLogo(href, img.naturalWidth / img.naturalHeight);
    }, href);
  }
  return page;
}

async function shot(page, t, file) {
  await page.evaluate(t => window.seek(t), t);
  const buf = await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
  if (file) fs.writeFileSync(file, buf);
  return buf;
}

async function frames(times, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const page = await openPage(browser);
  const files = [];
  for (let i = 0; i < times.length; i++) {
    const f = path.join(dir, `f${String(i).padStart(2, '0')}_${times[i].toFixed(3)}.png`);
    await shot(page, times[i], f);
    files.push(f);
  }
  await browser.close();
  return files;
}

function contactSheet(files, out, cols) {
  const list = path.join(path.dirname(out), 'list.txt');
  fs.writeFileSync(list, files.map(f => `file '${f}'`).join('\n'));
  const rows = Math.ceil(files.length / cols);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
    '-vf', `scale=270:480:flags=lanczos,tile=${cols}x${rows}:padding=6:color=0x222222`, '-frames:v', '1', out]);
}

async function main() {
  const [mode, ...args] = process.argv.slice(2);
  if (mode === 'beats') {
    const off = parseFloat(args[0] || '0.32');
    const times = Array.from({ length: 30 }, (_, i) => i * 0.5 + off);
    const dir = path.join(WORK, 'beats');
    fs.rmSync(dir, { recursive: true, force: true });
    const files = await frames(times, dir);
    contactSheet(files.slice(0, 15), path.join(dir, 'sheet-a.png'), 5);
    contactSheet(files.slice(15), path.join(dir, 'sheet-b.png'), 5);
    console.log('beat frames →', dir);
  } else if (mode === 'frames') {
    const times = args.map(Number);
    const dir = path.join(WORK, 'frames');
    fs.rmSync(dir, { recursive: true, force: true });
    const files = await frames(times, dir);
    if (files.length > 1) contactSheet(files, path.join(dir, 'sheet.png'), Math.min(5, files.length));
    console.log(files.join('\n'));
  } else if (mode === 'audio') {
    await renderAudio();
  } else if (mode === 'video') {
    const opt = Object.fromEntries(args.join(' ').split('--').filter(Boolean).map(s => s.trim().split(/\s+/)));
    await renderVideo({
      fps: +(opt.fps || FPS), sub: +(opt.sub || SUB), workers: +(opt.workers || 4),
      out: opt.out || path.join(OUT, 'alk-travel-reel.mp4'), crf: +(opt.crf || 14), to: +(opt.to || DUR),
    });
  } else {
    console.log('usage: node render.js beats|frames|audio|video');
  }
}

const WAV = path.join(OUT, 'alk-travel-soundtrack.wav');
async function renderAudio() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await openPage(browser);
  const t0 = Date.now();
  const b64 = await page.evaluate(async () => await window.renderAudio());
  await browser.close();
  fs.mkdirSync(WORK, { recursive: true });
  const raw = path.join(WORK, 'soundtrack-raw.wav');
  fs.writeFileSync(raw, Buffer.from(b64, 'base64'));
  // gentle peak limiting to ≈ -14 LUFS for social playback, peaks kept under -1 dBFS
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', 'alimiter=level_in=1.25:limit=0.8:attack=3:release=80:level=false',
    '-ar', '48000', '-c:a', 'pcm_s16le', WAV]);
  console.log(`audio → ${WAV} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}

function run(cmd, argv, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, argv, Object.assign({ stdio: ['pipe', 'ignore', 'pipe'] }, opts));
    let err = '';
    p.stderr.on('data', d => { err += d; if (err.length > 20000) err = err.slice(-20000); });
    p.on('close', code => code === 0 ? res() : rej(new Error(`${cmd} exited ${code}\n${err.slice(-3000)}`)));
    p.on('error', rej);
    if (opts.feed) opts.feed(p).catch(rej);
  });
}

/*
 * Each output frame k (time k/fps) is the average of `sub` renders spread evenly
 * across the frame interval and centred on k/fps. Renders are streamed at fps*sub
 * into ffmpeg, blended with tmix and decimated back to fps with select.
 */
async function renderVideo({ fps, sub, workers, out, crf, to }) {
  if (!fs.existsSync(WAV)) await renderAudio();
  const total = Math.round(to * fps);
  const dir = path.join(WORK, 'chunks');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const per = Math.ceil(total / workers);
  const jobs = [];
  let done = 0;
  const started = Date.now();
  for (let w = 0; w < workers; w++) {
    const k0 = w * per, k1 = Math.min(total, k0 + per);
    if (k0 >= k1) break;
    const file = path.join(dir, `chunk${w}.mkv`);
    jobs.push((async () => {
      const browser = await chromium.launch();
      const page = await openPage(browser);
      const vf = sub > 1
        ? `tmix=frames=${sub}:weights='${Array(sub).fill(1).join(' ')}',select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/(${fps}*TB)`
        : `setpts=N/(${fps}*TB)`;
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps * sub), '-c:v', 'png', '-i', '-',
        '-vf', vf, '-r', String(fps), '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', file], {
        feed: async (p) => {
          for (let k = k0; k < k1; k++) {
            for (let j = 0; j < sub; j++) {
              const t = (k + (j - (sub - 1) / 2) / sub) / fps;      // centred on k/fps
              const png = await shot(page, t);
              if (!p.stdin.write(png)) await new Promise(r => p.stdin.once('drain', r));
            }
            done++;
            if (done % 60 === 0) {
              const el = (Date.now() - started) / 1000;
              console.log(`  ${done}/${total} frames · ${el.toFixed(0)} s · eta ${(el / done * (total - done)).toFixed(0)} s`);
            }
          }
          p.stdin.end();
          await browser.close();
        },
      });
      return file;
    })());
  }
  const files = await Promise.all(jobs);
  const list = path.join(dir, 'concat.txt');
  fs.writeFileSync(list, files.map(f => `file '${f}'`).join('\n'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', WAV,
    '-map', '0:v', '-map', '1:a',
    '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high', '-level:v', '4.2',
    '-x264-params', 'keyint=60:min-keyint=60:aq-mode=3',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-r', String(fps), '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', String(total / fps),
    '-movflags', '+faststart', out]);
  console.log(`video → ${out} (${((Date.now() - started) / 1000).toFixed(0)} s)`);
}
main().catch(e => { console.error(e); process.exit(1); });
