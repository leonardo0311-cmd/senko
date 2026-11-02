/**
 * Verifica que todos los enlaces internos del sitio construido lleven a una
 * pagina o a un recurso que exista, y que las anclas (#algo) apunten a un
 * elemento presente en la pagina destino.
 *
 * Uso: node scripts/verificar-enlaces.mjs   (despues de npm run build)
 */
import { readdir, readFile, access } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(raiz, 'dist');

async function archivosHtml(dir) {
  const salida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) salida.push(...(await archivosHtml(ruta)));
    else if (e.name.endsWith('.html')) salida.push(ruta);
  }
  return salida;
}

const existe = async (p) => { try { await access(p); return true; } catch { return false; } };

const archivos = await archivosHtml(dist);

/** Mapa de pagina -> conjunto de ids presentes, para validar las anclas. */
const idsPorPagina = new Map();
for (const archivo of archivos) {
  const html = await readFile(archivo, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const url = '/' + relative(dist, archivo).replace(/index\.html$/, '').replace(/\\/g, '/');
  idsPorPagina.set(url, ids);
}

const problemas = [];
let revisados = 0;

for (const archivo of archivos) {
  const html = await readFile(archivo, 'utf8');
  const origen = '/' + relative(dist, archivo).replace(/index\.html$/, '').replace(/\\/g, '/');

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = m[1];

    // Externos y protocolos especiales: fuera del alcance de esta revision.
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/.test(href)) {
      // Ancla dentro de la misma pagina.
      if (href.startsWith('#') && href.length > 1) {
        revisados++;
        const ids = idsPorPagina.get(origen) ?? new Set();
        if (!ids.has(href.slice(1))) {
          problemas.push(`${origen} → ${href} (ancla inexistente en la página)`);
        }
      }
      continue;
    }
    if (!href.startsWith('/')) continue;

    revisados++;
    const [ruta, ancla] = href.split('#');

    // Pagina o recurso destino.
    const candidatos = ruta.endsWith('/')
      ? [join(dist, ruta, 'index.html')]
      : [join(dist, ruta), join(dist, ruta, 'index.html'), join(dist, `${ruta}.html`)];

    let ok = false;
    for (const c of candidatos) if (await existe(c)) { ok = true; break; }

    if (!ok) {
      problemas.push(`${origen} → ${href} (destino inexistente)`);
      continue;
    }

    // Ancla en otra pagina.
    if (ancla) {
      const destino = ruta.endsWith('/') ? ruta : `${ruta}/`;
      const ids = idsPorPagina.get(destino);
      if (ids && !ids.has(ancla)) {
        problemas.push(`${origen} → ${href} (ancla inexistente en el destino)`);
      }
    }
  }
}

console.log(`\nEnlaces internos revisados: ${revisados} en ${archivos.length} páginas`);
if (problemas.length === 0) {
  console.log('✓ Todos los enlaces internos y las anclas resuelven correctamente.\n');
} else {
  console.log(`\n✗ ${problemas.length} problema(s):\n`);
  problemas.forEach((p) => console.log('  - ' + p));
  console.log('');
  process.exitCode = 1;
}
