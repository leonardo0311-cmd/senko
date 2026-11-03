/**
 * ============================================================================
 *  FOTOGRAFÍAS DEL SITIO — UN SOLO LUGAR PARA CARGARLAS
 * ============================================================================
 *
 *  El sitio está armado para que la fotografía mande. Mientras una ranura esté
 *  en `null`, se dibuja la composición gráfica de la marca, que queda prolija;
 *  al cargar la imagen, la foto la reemplaza sola y Astro se encarga de
 *  optimizarla, generar formatos modernos y versiones por pantalla.
 *
 *  CÓMO CARGAR UNA FOTO
 *  --------------------
 *  1. Guardar el archivo en `src/imagenes/` (NO en `public/`: solo desde
 *     `src/` Astro las procesa).
 *  2. Descomentar el import de arriba y asignarlo a la ranura de abajo.
 *
 *     import hero from '@/imagenes/hero-consultorio.jpg';
 *     ...
 *     hero: hero,
 *
 *  3. Revisar el texto alternativo en `TEXTOS_ALT`: tiene que describir lo que
 *     realmente se ve en esa foto. Lo usan los lectores de pantalla y Google.
 *
 *  QUÉ FOTO VA EN CADA RANURA
 *  --------------------------
 *  Está descrito en `TEXTOS_ALT`, que hace las veces de guion de la producción
 *  fotográfica: si se contrata una sesión, esa lista es el pedido.
 *
 *  IMPORTANTE
 *  ----------
 *  Estas ranuras admiten fotografía ilustrativa de actividad kinésica. Las de
 *  EQUIPO (src/data/equipo.ts) e INSTALACIONES (src/data/instalaciones.ts) son
 *  distintas: ahí la foto afirma «este es nuestro equipo» o «este es nuestro
 *  consultorio», así que solo admiten fotos reales de CKC.
 * ============================================================================
 */

import type { ImageMetadata } from 'astro';

export type Ranura = ImageMetadata | null;

/* ---------------------------------------------------------------------------
 * RANURAS GENERALES
 * ------------------------------------------------------------------------- */

export type ClaveFoto =
  | 'hero'
  | 'nosotros'
  | 'comoTrabajamos'
  | 'ubicacion';

export const FOTOS: Record<ClaveFoto, Ranura> = {
  hero: null,
  nosotros: null,
  comoTrabajamos: null,
  ubicacion: null,
};

/* ---------------------------------------------------------------------------
 * RANURAS POR SERVICIO (la clave es el slug del servicio)
 * ------------------------------------------------------------------------- */

export const FOTOS_SERVICIOS: Record<string, Ranura> = {
  'kinesiologia-deportiva': null,
  'tratamiento-y-prevencion-de-lesiones': null,
  'prevencion-de-caidas': null,
  'suelo-pelvico': null,
  mep: null,
};

/* ---------------------------------------------------------------------------
 * TEXTOS ALTERNATIVOS / GUION FOTOGRÁFICO
 * ------------------------------------------------------------------------- */

/**
 * Qué se espera ver en cada ranura. Sirve para dos cosas: como `alt` cuando la
 * foto está cargada, y como pedido concreto si se encarga una producción.
 *
 * Al cargar una foto, revisar que el texto describa la imagen real.
 */
export const TEXTOS_ALT: Record<ClaveFoto | string, string> = {
  hero: 'Sesión de kinesiología en el consultorio: trabajo manual sobre la rodilla de un paciente',
  nosotros: 'Profesionales de CKC trabajando en el consultorio',
  comoTrabajamos: 'Momento de la evaluación inicial: el profesional escucha al paciente',
  ubicacion: 'Fachada o acceso del consultorio en Canning',

  'kinesiologia-deportiva':
    'Deportista realizando un ejercicio de rehabilitación con banda elástica, guiado por el kinesiólogo',
  'tratamiento-y-prevencion-de-lesiones':
    'Terapia manual sobre el hombro de un paciente en la camilla',
  'prevencion-de-caidas':
    'Adulto mayor practicando equilibrio y marcha con el acompañamiento del kinesiólogo',
  'suelo-pelvico': 'Consultorio privado donde se realiza la atención de suelo pélvico',
  mep: 'Equipamiento utilizado en las sesiones de MEP',
};

/** Devuelve la foto de un servicio, o `null` si todavía no se cargó. */
export const fotoDeServicio = (slug: string): Ranura => FOTOS_SERVICIOS[slug] ?? null;

/** `true` cuando hay al menos una foto cargada en todo el sitio. */
export const hayFotografia =
  Object.values(FOTOS).some((f) => f !== null) ||
  Object.values(FOTOS_SERVICIOS).some((f) => f !== null);
