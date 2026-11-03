/**
 * ============================================================================
 *  TRAYECTORIA: AÑOS, CIFRAS, CLUBES E INSTITUCIONES
 * ============================================================================
 *
 *  Esta es la información que más convence a alguien que está eligiendo dónde
 *  atenderse: cuánto hace que trabajan, con qué clubes e instituciones, y qué
 *  volumen de atención manejan.
 *
 *  TODO ESTÁ EN `null` A PROPÓSITO.
 *  --------------------------------
 *  No se inventó ningún año, ninguna cifra y, sobre todo, ningún nombre de
 *  club o institución. Nombrar a un club con el que el consultorio no trabaja
 *  sería una afirmación falsa sobre un tercero, además de un problema para
 *  CKC. Mientras estos campos estén vacíos, las secciones del sitio muestran
 *  su diseño final con un aviso visible de que faltan los datos.
 *
 *  Al completarlos, las secciones se llenan solas en el inicio y en Nosotros.
 * ============================================================================
 */

export type Pendiente<T> = T | null;

/* ---------------------------------------------------------------------------
 * 1. AÑOS DE TRAYECTORIA
 * ------------------------------------------------------------------------- */

/**
 * Año en que el consultorio comenzó a atender. Los años de trayectoria se
 * calculan solos a partir de acá, así que la cifra nunca queda desactualizada.
 *
 * Ejemplo:  anioInicio: 2014,
 */
export const anioInicio: Pendiente<number> = null;

/** Años de trayectoria cumplidos, o `null` si todavía no se cargó el año. */
export const aniosDeTrayectoria: number | null =
  anioInicio === null ? null : new Date().getFullYear() - anioInicio;

/* ---------------------------------------------------------------------------
 * 2. CIFRAS DESTACADAS
 * ------------------------------------------------------------------------- */

export type Cifra = {
  id: string;
  /** El número o dato. `null` mientras no esté confirmado. */
  valor: Pendiente<string>;
  /** Qué mide. Se muestra siempre, aunque falte el valor. */
  etiqueta: string;
  /** Aclaración breve debajo. */
  detalle?: string;
};

/**
 * Las cifras de la franja del inicio.
 *
 * Usar solo números que el consultorio pueda respaldar. Es preferible una
 * cifra prudente y verdadera que una redonda e inflada: si alguien pregunta
 * en la consulta, tiene que cerrar.
 *
 * Ejemplo de cifra cargada:
 *   { id: 'clubes', valor: '8', etiqueta: 'Clubes e instituciones', … }
 */
export const CIFRAS: Cifra[] = [
  {
    id: 'anios',
    valor: aniosDeTrayectoria !== null ? `${aniosDeTrayectoria}` : null,
    etiqueta: 'Años atendiendo en Canning',
    detalle: 'Se calcula solo a partir del año de inicio',
  },
  {
    id: 'clubes',
    valor: null,
    etiqueta: 'Clubes e instituciones',
    detalle: 'Con los que trabaja el consultorio',
  },
  {
    id: 'areas',
    valor: '5',
    etiqueta: 'Áreas de atención',
    detalle: 'Deportiva, lesiones, caídas, suelo pélvico y MEP',
  },
  {
    id: 'deportistas',
    valor: null,
    etiqueta: 'Deportistas acompañados',
    detalle: 'Cifra a confirmar por el consultorio',
  },
];

/** `true` cuando al menos una cifra que falta ya está cargada. */
export const hayCifras = CIFRAS.some((c) => c.valor !== null && c.id !== 'areas');

/* ---------------------------------------------------------------------------
 * 3. CLUBES E INSTITUCIONES
 * ------------------------------------------------------------------------- */

import type { ImageMetadata } from 'astro';

export type Institucion = {
  id: string;
  /** Nombre tal como se escribe oficialmente. */
  nombre: string;
  /** Qué tipo de vínculo: "Club", "Escuela deportiva", "Gimnasio"… */
  tipo: string;
  /** Una línea sobre el trabajo que se hace con esa institución. Opcional. */
  detalle?: string;
  /**
   * Logotipo. Guardarlo en `src/imagenes/instituciones/` e importarlo.
   * Si falta, se muestra el nombre tipografiado, que también queda prolijo.
   */
  logo?: ImageMetadata;
  /** Sitio o red de la institución, si corresponde enlazarla. */
  url?: string;
};

/**
 * Clubes, instituciones y equipos con los que trabaja CKC.
 *
 * ⚠️ IMPORTANTE: cargar únicamente instituciones con las que exista un vínculo
 * real y, antes de publicar sus nombres o logotipos, pedirles autorización.
 * Usar la marca de un club sin permiso puede traerle un problema al
 * consultorio, aunque la relación sea cierta.
 *
 * Ejemplo:
 *   import escudo from '@/imagenes/instituciones/club-ejemplo.png';
 *   { id: 'club-ejemplo', nombre: 'Club Ejemplo', tipo: 'Club',
 *     detalle: 'Atención del plantel de primera', logo: escudo }
 */
export const INSTITUCIONES: Institucion[] = [];

export const hayInstituciones = INSTITUCIONES.length > 0;

/* ---------------------------------------------------------------------------
 * 4. HITOS DE LA TRAYECTORIA
 * ------------------------------------------------------------------------- */

export type Hito = {
  anio: string;
  titulo: string;
  texto: string;
};

/**
 * Línea de tiempo del consultorio, para la página Nosotros.
 *
 * Ejemplo:
 *   { anio: '2014', titulo: 'Abre el consultorio',
 *     texto: 'CKC empieza a atender en Canning con …' }
 */
export const HITOS: Hito[] = [];

export const hayHitos = HITOS.length > 0;

/* ---------------------------------------------------------------------------
 * 5. POSICIONAMIENTO
 * ------------------------------------------------------------------------- */

/**
 * Frase de posicionamiento del consultorio en la zona.
 *
 * NOTA SOBRE LAS AFIRMACIONES COMPARATIVAS. Decir "el más grande de Canning"
 * es una afirmación comparativa: en publicidad sanitaria conviene poder
 * respaldarla (por superficie, cantidad de profesionales, de áreas o de
 * pacientes) porque un competidor puede cuestionarla.
 *
 * Por eso el sitio, por defecto, no usa el superlativo: comunica la escala con
 * datos concretos (años, clubes, áreas), que además convencen más.
 *
 * Si CKC quiere afirmarlo igual, completar `afirmacionDeEscala` con la frase
 * exacta que quiera usar y `respaldo` con el dato que la sostiene.
 *
 * Ejemplo:
 *   afirmacionDeEscala: 'El centro de kinesiología más grande de Canning',
 *   respaldo: 'Por cantidad de áreas de atención y profesionales',
 */
export const afirmacionDeEscala: Pendiente<string> = null;
export const respaldo: Pendiente<string> = null;
