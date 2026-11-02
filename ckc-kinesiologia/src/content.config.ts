import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

/**
 * Coleccion de articulos del blog.
 *
 * Para publicar una nota nueva: crear un archivo .md en src/content/blog/ con
 * el bloque de datos de arriba (titulo, resumen, fecha, categoria, etc.) y
 * escribir el contenido en Markdown. El sitio la lista sola, le arma la URL,
 * las metaetiquetas y los datos estructurados.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    /** Titulo SEO propio, si conviene que sea distinto del titulo visible. */
    tituloSeo: z.string().optional(),
    /** Resumen para el listado y la meta descripcion. */
    resumen: z.string(),
    fecha: z.coerce.date(),
    /** Fecha de ultima revision del contenido, si hubo una. */
    actualizado: z.coerce.date().optional(),
    categoria: z.enum([
      'Movimiento',
      'Prevención',
      'Rehabilitación',
      'La consulta',
      'Hábitos',
    ]),
    /** Minutos estimados de lectura. */
    lectura: z.number(),
    motivo: z
      .enum(['arcos', 'recorrido', 'pulso', 'campo', 'eje', 'horizonte'])
      .default('arcos'),
    tono: z.enum(['primario', 'arena', 'acento', 'profundo']).default('primario'),
    /** Que fotografia conviene poner cuando haya material propio. */
    fotoSugerida: z.string().optional(),
    /** Servicios relacionados, por slug, para los enlaces internos. */
    serviciosRelacionados: z.array(z.string()).default([]),
    destacado: z.boolean().default(false),
  }),
});

export const collections = { blog };
