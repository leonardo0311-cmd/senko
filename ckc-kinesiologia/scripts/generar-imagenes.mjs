/**
 * Genera las imagenes de marca del sitio a partir de SVG:
 *  - /og/ckc-og.png        imagen para compartir en redes (1200x630)
 *  - /apple-touch-icon.png icono para pantalla de inicio en iOS (180x180)
 *
 * Son imagenes PROVISIONALES de marca, no fotografias del consultorio.
 * Cuando CKC aporte su logotipo y fotos propias, conviene reemplazar la
 * imagen de Open Graph por una foto real con el logotipo.
 *
 * Uso: node scripts/generar-imagenes.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const publico = join(raiz, 'public');

const TINTA = '#113f3b';
const ACENTO = '#c0764a';

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="0.65" y2="1">
      <stop offset="0%" stop-color="#eef4f3"/>
      <stop offset="60%" stop-color="#e2edeb"/>
      <stop offset="100%" stop-color="#f0eae1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#f)"/>
  <g fill="none" stroke="${TINTA}" stroke-opacity="0.16" stroke-width="1.3">
    <circle cx="1010" cy="300" r="300"/>
    <circle cx="1010" cy="300" r="226"/>
    <circle cx="1010" cy="300" r="78"/>
    <path d="M-40 600C240 600 300 250 540 250s220 260 700 150"/>
  </g>
  <circle cx="1010" cy="300" r="152" fill="none" stroke="${ACENTO}" stroke-opacity="0.4" stroke-width="1.8" stroke-dasharray="6 10"/>

  <g transform="translate(88 214)">
    <circle cx="26" cy="26" r="25" fill="none" stroke="${TINTA}" stroke-opacity="0.26" stroke-width="1.8"/>
    <path d="M26 9.5a16.5 16.5 0 0 0 0 33" fill="none" stroke="${TINTA}" stroke-width="2.9" stroke-linecap="round"/>
    <path d="M34.5 16.2a13.8 13.8 0 0 1 0 19.6" fill="none" stroke="${ACENTO}" stroke-width="2.9" stroke-linecap="round"/>
  </g>

  <text x="156" y="256" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="${TINTA}">CKC <tspan font-style="italic">Kinesiología</tspan></text>
  <text x="88" y="330" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="600" letter-spacing="3.4" fill="${TINTA}" fill-opacity="0.62">CONSULTORIO KINÉSICO CANNING</text>
  <text x="88" y="404" font-family="Georgia, 'Times New Roman', serif" font-size="56" fill="${TINTA}">Recuperá tu movimiento.</text>
  <text x="88" y="470" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-style="italic" fill="#1f6f68">Volvé a sentirte bien.</text>
  <text x="88" y="536" font-family="Helvetica, Arial, sans-serif" font-size="21" fill="${TINTA}" fill-opacity="0.66">Canning, Provincia de Buenos Aires</text>
</svg>`;

const icono = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="${TINTA}"/>
  <circle cx="90" cy="90" r="62" fill="none" stroke="#ffffff" stroke-opacity="0.26" stroke-width="5"/>
  <path d="M90 38a52 52 0 0 0 0 104" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round"/>
  <path d="M117 58a40 40 0 0 1 0 64" fill="none" stroke="${ACENTO}" stroke-width="11" stroke-linecap="round"/>
</svg>`;

await mkdir(join(publico, 'og'), { recursive: true });

await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(join(publico, 'og', 'ckc-og.png'));
await sharp(Buffer.from(icono)).png({ compressionLevel: 9 }).toFile(join(publico, 'apple-touch-icon.png'));
await writeFile(join(publico, 'og', 'ckc-og.svg'), og, 'utf8');

console.log('Imágenes de marca generadas en public/');
