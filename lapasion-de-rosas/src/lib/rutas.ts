/**
 * Prefijo para los archivos de `public/`.
 *
 * Vacío cuando el sitio vive en la raíz de un dominio. Un punto cuando vive en
 * un subdirectorio —por ejemplo GitHub Pages, que sirve en `/<repo>/`—, para
 * que las rutas sean relativas a la página y no a la raíz del dominio.
 */
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function publico(ruta: string): string {
  return `${base}${ruta}`;
}
