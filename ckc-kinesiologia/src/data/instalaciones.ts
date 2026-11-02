/**
 * ============================================================================
 *  INSTALACIONES
 * ============================================================================
 *
 *  FOTOGRAFIAS PENDIENTES.
 *
 *  No se usaron imagenes de otros centros ni fotografias genericas que
 *  pudieran hacerse pasar por el consultorio, y no se describen espacios ni
 *  equipamiento que no se haya podido verificar.
 *
 *  Cada casillero de la galeria indica que fotografia corresponde en ese
 *  lugar. Mientras no haya fotos propias, se muestra la composicion grafica
 *  de la marca.
 *
 *  COMO CARGAR LAS FOTOS
 *  ---------------------
 *  1. Guardar los archivos en `src/imagenes/instalaciones/`.
 *  2. Importarlos arriba y asignarlos al campo `imagen` de cada entrada.
 *  3. Escribir en `alt` una descripcion real de lo que se ve en la foto.
 *
 *  Ejemplo:
 *    import recepcion from '@/imagenes/instalaciones/recepcion.jpg';
 *    { ..., imagen: recepcion, alt: 'Recepción del consultorio con mostrador y sala de espera' }
 *
 *  Astro se encarga de optimizar el peso, generar formatos modernos y cargar
 *  las imagenes de forma diferida. Al tener `imagen`, el casillero habilita
 *  solo la ampliacion en la ventana modal.
 *
 *  Si algun espacio de esta lista no existe en el consultorio, hay que
 *  eliminar la entrada: no debe quedar publicado nada que no corresponda.
 * ============================================================================
 */

import type { ImageMetadata } from 'astro';

export type ItemGaleria = {
  id: string;
  /** Titulo visible debajo de la imagen. */
  titulo: string;
  /** Texto alternativo. Con foto cargada, describe la foto real. */
  alt: string;
  imagen?: ImageMetadata;
  tamanio?: 'normal' | 'ancha' | 'alta';
  proporcion?: '16/9' | '4/3' | '3/2' | '1/1' | '4/5' | '3/4';
  motivo?: 'arcos' | 'recorrido' | 'pulso' | 'campo' | 'eje' | 'horizonte';
  tono?: 'primario' | 'arena' | 'acento' | 'profundo';
};

export const GALERIA: ItemGaleria[] = [
  {
    id: 'recepcion',
    titulo: 'Recepción',
    alt: 'Foto a incorporar: recepción y espacio de espera',
    tamanio: 'ancha',
    proporcion: '16/9',
    motivo: 'horizonte',
    tono: 'arena',
  },
  {
    id: 'consultorio',
    titulo: 'Consultorio',
    alt: 'Foto a incorporar: consultorio de atención individual',
    tamanio: 'normal',
    proporcion: '4/3',
    motivo: 'arcos',
    tono: 'primario',
  },
  {
    id: 'espacio-tratamiento',
    titulo: 'Espacio de tratamiento',
    alt: 'Foto a incorporar: espacio donde se realizan los tratamientos',
    tamanio: 'normal',
    proporcion: '4/3',
    motivo: 'recorrido',
    tono: 'primario',
  },
  {
    id: 'area-trabajo',
    titulo: 'Área de trabajo activo',
    alt: 'Foto a incorporar: área destinada al ejercicio terapéutico',
    tamanio: 'alta',
    proporcion: '4/5',
    motivo: 'eje',
    tono: 'acento',
  },
  {
    id: 'equipamiento',
    titulo: 'Equipamiento',
    alt: 'Foto a incorporar: equipamiento disponible en el consultorio',
    tamanio: 'normal',
    proporcion: '4/3',
    motivo: 'pulso',
    tono: 'profundo',
  },
  {
    id: 'detalles',
    titulo: 'Detalles del espacio',
    alt: 'Foto a incorporar: detalle del espacio de atención',
    tamanio: 'normal',
    proporcion: '4/3',
    motivo: 'campo',
    tono: 'arena',
  },
];

/** `true` cuando al menos una foto real esta cargada. */
export const hayFotosPropias = GALERIA.some((i) => i.imagen);
