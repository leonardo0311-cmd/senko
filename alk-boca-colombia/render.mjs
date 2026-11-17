#!/usr/bin/env node
// Render the ALK TRAVEL reel: headless Chromium (WebGL2) renders each frame
// deterministically, frames are written as PNG and encoded with ffmpeg.
//
//   node render.mjs                         full render -> output/
//   node render.mjs --still 1.5,7.2,15      PNG stills (for review)
//   node render.mjs --scale 0.5 --mb 1      fast low-res preview video
//   node render.mjs --from 8 --to 13.6      only a time range
import { createServer } from 'node:http';
import { readFile, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const DURATION = 19.0;

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const scale = parseFloat(args.scale || '1');
const W = Math.round(1080 * scale), H = Math.round(1920 * scale);
const MB = parseInt(args.mb || '5', 10); // motion-blur sub-frames
const workers = parseInt(args.workers || '2', 10);
const outName = args.out || (scale === 1 ? 'alk-boca-viaja-a-colombia-reel.mp4' : `preview-${W}x${H}.mp4`);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.wav': 'audio/wav' };

function serve() {
  return new Promise((resolve) => {
    const srv = createServer(async (req, res) => {
      const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = join(ROOT, path === '/' ? '/scene/index.html' : path);
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(body);
      } catch { res.writeHead(404).end(); }
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

function run(cmd, argv) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning' || args.verbose) console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  await page.goto(`http://127.0.0.1:${port}/scene/index.html?w=${W}&h=${H}&mb=${MB}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
  return page;
}

async function main() {
  const { chromium } = require('playwright');
  const srv = await serve();
  const port = srv.address().port;
  if (args.serve) { console.log(`http://127.0.0.1:${port}/scene/index.html?preview=1`); return; }

  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
  const outDir = join(ROOT, 'output');
  await mkdir(outDir, { recursive: true });

  if (args.still) {
    const page = await openPage(browser, port);
    const stillDir = args.dir || join(ROOT, 'frames', 'stills');
    await mkdir(stillDir, { recursive: true });
    for (const s of String(args.still).split(',')) {
      const t = parseFloat(s);
      const t0 = Date.now();
      await page.evaluate((tt) => window.renderFrame(tt), t);
      const file = join(stillDir, `still-${t.toFixed(2)}.png`);
      await page.screenshot({ path: file, type: 'png' });
      console.log(`${file}  (${Date.now() - t0} ms)`);
    }
    await browser.close(); srv.close();
    return;
  }

  const from = parseFloat(args.from || '0'), to = parseFloat(args.to || String(DURATION));
  const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
  const frameDir = join(ROOT, 'frames', `${W}x${H}`);
  if (!args.resume) await rm(frameDir, { recursive: true, force: true });
  await mkdir(frameDir, { recursive: true });

  const todo = [];
  for (let f = f0; f < f1; f++) if (!(args.resume && existsSync(join(frameDir, `${String(f).padStart(5, '0')}.png`)))) todo.push(f);
  console.log(`rendering ${todo.length} frames at ${W}x${H}, ${MB} sub-frames, ${workers} workers`);
  const tStart = Date.now();
  let done = 0;
  const pages = await Promise.all(Array.from({ length: Math.min(workers, todo.length || 1) }, () => openPage(browser, port)));
  await Promise.all(pages.map(async (page, wi) => {
    for (let k = wi; k < todo.length; k += pages.length) {
      const f = todo[k];
      await page.evaluate((tt) => window.renderFrame(tt), f / FPS);
      await page.screenshot({ path: join(frameDir, `${String(f).padStart(5, '0')}.png`), type: 'png' });
      done++;
      if (done % 10 === 0 || done === todo.length) {
        const el = (Date.now() - tStart) / 1000;
        process.stdout.write(`\r  ${done}/${todo.length} frames  ${el.toFixed(0)}s elapsed, ~${(el / done * (todo.length - done)).toFixed(0)}s left   `);
      }
    }
  }));
  console.log();
  await browser.close();
  srv.close();

  // ---- encode ----
  const frames = (await readdir(frameDir)).filter((f) => f.endsWith('.png')).sort();
  const first = parseInt(frames[0], 10);
  const audio = join(ROOT, 'output', 'soundtrack.wav');
  const withAudio = !args['no-audio'] && existsSync(audio) && first === 0;
  const out = join(outDir, outName);
  const ff = ['-y', '-framerate', String(FPS), '-start_number', String(first), '-i', join(frameDir, '%05d.png')];
  if (withAudio) ff.push('-i', audio);
  ff.push('-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', scale === 1 ? '16' : '20', '-maxrate', '15M', '-bufsize', '30M', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-level', '4.2', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-movflags', '+faststart', '-r', String(FPS));
  if (withAudio) ff.push('-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest');
  ff.push(out);
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...ff]);
  console.log('wrote', out);
}

main().catch((e) => { console.error(e); process.exit(1); });
