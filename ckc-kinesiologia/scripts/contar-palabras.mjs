/**
 * Cuenta las palabras de contenido editorial de cada pagina construida.
 *
 * Mide solo el texto del <main>, descontando la navegacion, el pie, los
 * avisos internos para el equipo de desarrollo y los textos de interfaz
 * repetidos (botones, rotulos). Da una referencia del volumen real de
 * contenido que lee un visitante.
 *
 * Uso: npm run words   (requiere haber corrido npm run build antes)
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');

async function archivosHtml(dir) {
  const salida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...(await archivosHtml(ruta)));
    else if (entrada.name.endsWith('.html')) salida.push(ruta);
  }
  return salida;
}

/** Extrae el texto visible del <main>, sin interfaz ni avisos internos. */
function textoDeContenido(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (!main) return '';

  return main[1]
    // Fuera scripts, estilos y SVG decorativos.
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    // Fuera los avisos de datos pendientes: son notas de proyecto.
    .replace(/<aside class="ckc-pendiente[\s\S]*?<\/aside>/gi, ' ')
    // Fuera el texto solo para lectores de pantalla.
    .replace(/<span class="ckc-visualmente-oculto"[\s\S]*?<\/span>/gi, ' ')
    // Fuera etiquetas y entidades.
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const contar = (t) => (t ? t.split(/\s+/).filter((p) => /[\p{L}\p{N}]/u.test(p)).length : 0);

const archivos = (await archivosHtml(dist)).sort();
const filas = [];
let total = 0;

for (const archivo of archivos) {
  const html = await readFile(archivo, 'utf8');
  const palabras = contar(textoDeContenido(html));
  const ruta = '/' + relative(dist, archivo).replace(/index\.html$/, '').replace(/\\/g, '/');
  filas.push({ ruta, palabras });
  // El 404 no es contenido del sitio.
  if (!archivo.endsWith('404.html')) total += palabras;
}

const ancho = Math.max(...filas.map((f) => f.ruta.length));
console.log('\nPalabras de contenido por página\n' + '─'.repeat(ancho + 12));
for (const f of filas) {
  const marca = f.ruta === '/404.html' ? '  (no se cuenta)' : '';
  console.log(`${f.ruta.padEnd(ancho)}  ${String(f.palabras).padStart(5)}${marca}`);
}
console.log('─'.repeat(ancho + 12));
console.log(`${'TOTAL'.padEnd(ancho)}  ${String(total).padStart(5)}\n`);
