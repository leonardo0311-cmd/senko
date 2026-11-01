/**
 * Contenido de RINDE: entrevistas con artistas, videos de shows en vivo y fotografía.
 *
 * Para sumar una pieza, agregá un objeto a `contentItems`:
 *  - Subí la portada o la foto a /public/content/ (jpg o webp, ~1600 px de ancho).
 *  - Si el video es propio, subí un mp4 liviano y ponelo en `video` (se reproduce en la web).
 *  - Si está en YouTube, Instagram o TikTok, poné el link en `url` (se abre en una pestaña nueva).
 * Mostrar sólo material publicado o con el OK del artista. Las entrevistas no implican que el artista sea cliente.
 */

export type ContentKind = "entrevista" | "en-vivo" | "foto";

export type ContentItem = {
  id: string;
  kind: ContentKind;
  /** Nombre del artista o banda. */
  artist: string;
  /** Título corto opcional, ej: "Antes del show en Niceto". */
  title?: string;
  /** Fecha legible, ej: "Octubre 2026". */
  date?: string;
  /** Portada del video o la foto. */
  image: string;
  alt: string;
  video?: string;
  url?: string;
};

export const contentKinds: Record<ContentKind, { label: string; plural: string; text: string }> = {
  entrevista: {
    label: "Entrevista",
    plural: "Entrevistas",
    text: "Conversaciones con artistas sobre su música, sus lanzamientos y lo que pasa antes de subir al escenario.",
  },
  "en-vivo": {
    label: "En vivo",
    plural: "En vivo",
    text: "Videos de músicos en pleno show: la energía del escenario y del público, en piezas pensadas para redes.",
  },
  foto: {
    label: "Foto",
    plural: "Fotos",
    text: "Fotografía de shows y backstage para prensa, redes y campañas de lanzamiento.",
  },
};

export const contentItems: ContentItem[] = [];
