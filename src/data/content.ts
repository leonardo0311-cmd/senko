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
  /** Nombre del artista o banda. Si todavía no está confirmado, se deja vacío y se muestra el título. */
  artist?: string;
  /** Título corto, ej: "Antes del show en Niceto". Obligatorio si no hay artista. */
  title?: string;
  /** Fecha legible, ej: "Octubre 2026". */
  date?: string;
  /** Portada del video o la foto. */
  image: string;
  alt: string;
  video?: string;
  url?: string;
  /** Video o foto vertical (celular, 9:16). */
  vertical?: boolean;
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

export const contentItems: ContentItem[] = [
  {
    // Pendiente: nombre del artista (el usuario lo tiene que confirmar).
    id: "maly-entrevista-show",
    kind: "entrevista",
    title: "Entrevista y show en Maly Bar",
    image: "/content/maly-entrevista-show.webp",
    video: "/content/maly-entrevista-show.mp4",
    alt: "Dos artistas entrevistados antes de su show en Maly Bar",
    vertical: true,
  },
  {
    // Pendiente: nombre del artista (el usuario lo tiene que confirmar).
    id: "maly-en-vivo",
    kind: "en-vivo",
    title: "Show en vivo en Maly Bar",
    image: "/content/maly-en-vivo.webp",
    video: "/content/maly-en-vivo.mp4",
    alt: "Artista cantando en el escenario de Maly Bar entre humo y luces cálidas",
    vertical: true,
  },
];

/** Nombre que se muestra en la tarjeta: el artista o, si falta, el título. */
export const contentHeading = (i: ContentItem) => i.artist ?? i.title ?? contentKinds[i.kind].label;
