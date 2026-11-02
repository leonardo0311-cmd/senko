/**
 * Revisa el estado de SEO y accesibilidad de cada pagina construida:
 *  - titulo SEO propio y unico, con largo razonable
 *  - meta descripcion propia y unica, con largo razonable
 *  - un unico H1 por pagina
 *  - jerarquia de encabezados sin saltos de nivel
 *  - texto alternativo en todas las imagenes
 *  - URL canonica, Open Graph y datos estructurados validos
 *  - idioma declarado
 *
 * Uso: node scripts/verificar-seo.mjs   (despues de npm run build)
 */
import { readdir, readFile } from 'node:fs/promises';
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

const archivos = (await archivosHtml(dist)).sort();
const errores = [];
const avisos = [];
const titulos = new Map();
const descripciones = new Map();

const sinEtiquetas = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

console.log('\nRevisión de SEO y accesibilidad\n' + '═'.repeat(78));

for (const archivo of archivos) {
  const html = await readFile(archivo, 'utf8');
  const url = '/' + relative(dist, archivo).replace(/index\.html$/, '').replace(/\\/g, '/');
  const es404 = archivo.endsWith('404.html');

  // --- Idioma ---
  if (!/<html[^>]+lang="es-AR"/.test(html)) errores.push(`${url}: falta lang="es-AR" en <html>`);

  // --- Titulo ---
  const titulo = html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  if (!titulo) errores.push(`${url}: no tiene <title>`);
  else {
    if (titulos.has(titulo)) errores.push(`${url}: título duplicado con ${titulos.get(titulo)}`);
    titulos.set(titulo, url);
    if (titulo.length > 65) avisos.push(`${url}: título de ${titulo.length} caracteres (ideal ≤ 65)`);
    if (titulo.length < 20) avisos.push(`${url}: título muy corto (${titulo.length} caracteres)`);
  }

  // --- Meta descripcion ---
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!desc) errores.push(`${url}: no tiene meta descripción`);
  else {
    if (descripciones.has(desc)) errores.push(`${url}: meta descripción duplicada con ${descripciones.get(desc)}`);
    descripciones.set(desc, url);
    if (desc.length > 165) avisos.push(`${url}: meta descripción de ${desc.length} caracteres (ideal ≤ 165)`);
    if (desc.length < 70) avisos.push(`${url}: meta descripción corta (${desc.length} caracteres)`);
  }

  // --- Canonica ---
  if (!/<link rel="canonical" href="https?:\/\//.test(html)) errores.push(`${url}: falta la URL canónica`);

  // --- Open Graph ---
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
    if (!new RegExp(`property="${p}"`).test(html)) errores.push(`${url}: falta ${p}`);
  }
  if (!/name="twitter:card"/.test(html)) errores.push(`${url}: falta twitter:card`);

  // --- Encabezados ---
  const encabezados = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
    nivel: Number(m[1]),
    texto: sinEtiquetas(m[2]),
  }));

  const h1 = encabezados.filter((h) => h.nivel === 1);
  if (h1.length === 0) errores.push(`${url}: no tiene H1`);
  if (h1.length > 1) errores.push(`${url}: tiene ${h1.length} H1 (debe haber uno solo)`);

  // Saltos de nivel (p. ej. de H2 a H4).
  let previo = 0;
  for (const h of encabezados) {
    if (previo !== 0 && h.nivel > previo + 1) {
      avisos.push(`${url}: salto de H${previo} a H${h.nivel} ("${h.texto.slice(0, 44)}")`);
    }
    previo = h.nivel;
  }

  // --- Imagenes sin texto alternativo ---
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\salt=/.test(m[0])) errores.push(`${url}: <img> sin atributo alt`);
  }

  // --- Datos estructurados ---
  const bloques = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (bloques.length === 0) errores.push(`${url}: no tiene datos estructurados`);
  for (const b of bloques) {
    try {
      const datos = JSON.parse(b[1]);
      const texto = JSON.stringify(datos);
      // Nunca deben publicarse reseñas, calificaciones ni precios inventados.
      for (const prohibido of ['aggregateRating', 'review', 'priceRange', 'offers']) {
        if (texto.includes(`"${prohibido}"`)) {
          errores.push(`${url}: los datos estructurados incluyen "${prohibido}" (dato no confirmado)`);
        }
      }
    } catch (e) {
      errores.push(`${url}: datos estructurados con JSON inválido — ${e.message}`);
    }
  }

  // --- Indexacion ---
  const noindex = /content="noindex/.test(html);
  if (es404 && !noindex) errores.push(`${url}: la página 404 debería llevar noindex`);

  const estado = es404 ? 'noindex' : noindex ? 'noindex' : 'index';
  console.log(
    `${url.padEnd(50)} H1:${h1.length}  enc:${String(encabezados.length).padStart(2)}  ${estado}`,
  );
}

console.log('═'.repeat(78));
console.log(`Páginas revisadas: ${archivos.length}`);
console.log(`Títulos únicos: ${titulos.size} · Meta descripciones únicas: ${descripciones.size}`);

if (avisos.length > 0) {
  console.log(`\n⚠ ${avisos.length} aviso(s):`);
  avisos.forEach((a) => console.log('  - ' + a));
}

if (errores.length > 0) {
  console.log(`\n✗ ${errores.length} error(es):`);
  errores.forEach((e) => console.log('  - ' + e));
  process.exitCode = 1;
} else {
  console.log('\n✓ Sin errores de SEO ni de accesibilidad estructural.');
}
console.log('');
