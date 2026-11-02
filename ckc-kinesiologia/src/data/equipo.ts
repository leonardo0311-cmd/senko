/**
 * ============================================================================
 *  EQUIPO PROFESIONAL
 * ============================================================================
 *
 *  DATOS PENDIENTES DE CONFIRMACION.
 *
 *  No se publicaron nombres, titulos, matriculas, formacion academica,
 *  especialidades, años de experiencia ni testimonios, porque no fue posible
 *  verificarlos en una fuente oficial del consultorio. Inventarlos seria grave
 *  tratandose de credenciales sanitarias.
 *
 *  El sitio muestra fichas en estado "a completar": conservan el diseño final
 *  y dejan claro que dato va en cada lugar.
 *
 *  COMO COMPLETARLO
 *  ----------------
 *  Reemplazar las fichas vacias por una entrada por profesional, con los datos
 *  verificados. Ejemplo de ficha completa:
 *
 *    import retrato from '@/imagenes/equipo/nombre-apellido.jpg';
 *
 *    {
 *      id: 'nombre-apellido',
 *      nombre: 'Nombre Apellido',
 *      tituloProfesional: 'Licenciado/a en Kinesiología y Fisiatría',
 *      matricula: 'M.P. 00000',
 *      presentacion: 'Dos o tres frases en primera persona o en tercera.',
 *      formacion: [
 *        'Licenciatura en Kinesiología y Fisiatría, Universidad X',
 *        'Posgrado en …',
 *      ],
 *      areas: ['Kinesiología deportiva', 'Suelo pélvico'],
 *      foto: retrato,
 *    }
 *
 *  Importante: publicar solo credenciales verificables. La matricula figura
 *  tambien en los registros del colegio profesional correspondiente.
 * ============================================================================
 */

import type { ImageMetadata } from 'astro';

export type Profesional = {
  id: string;
  /** `null` mientras el dato no este confirmado. */
  nombre: string | null;
  tituloProfesional: string | null;
  matricula: string | null;
  presentacion: string | null;
  formacion: string[] | null;
  areas: string[] | null;
  /** Retrato profesional importado desde `src/imagenes/`. */
  foto?: ImageMetadata;
  /** Motivo grafico mientras no haya retrato. */
  motivo?: 'arcos' | 'recorrido' | 'pulso' | 'campo' | 'eje' | 'horizonte';
};

/** Ficha vacia reutilizable. */
const fichaVacia = (id: string, motivo: Profesional['motivo']): Profesional => ({
  id,
  nombre: null,
  tituloProfesional: null,
  matricula: null,
  presentacion: null,
  formacion: null,
  areas: null,
  motivo,
});

/**
 * Cantidad de fichas que se muestran. Son dos a modo de estructura editable:
 * no implican que el equipo tenga dos integrantes, dato que tambien esta
 * pendiente de confirmacion.
 */
export const PROFESIONALES: Profesional[] = [
  fichaVacia('profesional-1', 'eje'),
  fichaVacia('profesional-2', 'campo'),
];

/** `true` cuando al menos una ficha tiene los datos cargados. */
export const hayEquipoCargado = PROFESIONALES.some((p) => p.nombre !== null);
