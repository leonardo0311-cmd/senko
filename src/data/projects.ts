import type { AreaId } from "./areas";

export type Media = { type: "image" | "video"; src: string; alt: string; poster?: string };

export type Project = {
  slug: string;
  /** Nombre del artista, evento, espacio o marca. */
  title: string;
  /** Tipo de proyecto, ej: "Campaña de lanzamiento", "Cobertura de evento". */
  kind: string;
  area: AreaId;
  year: string;
  short: string;
  challenge: string;
  strategy: string;
  execution: string[];
  /** Sólo resultados verificables. Null = todavía no hay datos o no se pueden publicar. */
  results: string[] | null;
  media: Media[];
  /**
   * Sólo se muestran los proyectos con `published: true`.
   * Antes de publicar: autorización del cliente para mostrar el material y los números.
   */
  published: boolean;
};

/**
 * Portfolio de RINDE.
 * Para sumar un caso: copiá el bloque de ejemplo, completá los campos con información real,
 * subí las imágenes o videos a /public/media/<slug>/ y poné `published: true`.
 * No inventar clientes, números, testimonios ni resultados.
 */
export const projects: Project[] = [
  {
    slug: "maly-bar",
    title: "Maly Bar y Music",
    kind: "Piezas de comunicación para un venue",
    area: "venue",
    year: "2026",
    short: "El flyer del show de El Polaco y una animación de cierre con la identidad neón del bar, en los formatos de cada red.",
    challenge:
      "Maly Bar y Music, en Canning, tenía que comunicar el show en vivo de El Polaco del viernes 16 de octubre y llevar a la gente a reservar mesa. Y sumar a sus videos un cierre propio que los identificara como contenido del bar.",
    strategy:
      "Trabajamos todo con la estética neón del logo de Maly (rosa, cian y violeta sobre fondo oscuro) para que cada pieza se reconozca como del bar. El flyer ordena la información en tres pasos: quién toca, cuándo y cómo reservar. El cierre animado se pensó para sumarse al final de cualquier video.",
    execution: [
      "Flyer del show para feed (4:5) e historias (9:16)",
      "Animación de cierre de 6,5 segundos: el logo se enciende como un neón, con sonido",
      "Versiones vertical, cuadrada y horizontal del cierre para Reels, feed y YouTube",
    ],
    results: null,
    media: [
      {
        type: "video",
        src: "/media/maly-bar/outro.mp4",
        poster: "/media/maly-bar/outro-poster.jpg",
        alt: "Animación de cierre de Maly Bar y Music: el logo con flamenco y palmeras se enciende en neón",
      },
      {
        type: "image",
        src: "/media/maly-bar/flyer-polaco-feed.webp",
        alt: "Flyer neón para el feed: El Polaco en vivo en Maly, viernes 16 de octubre",
      },
      {
        type: "image",
        src: "/media/maly-bar/flyer-polaco-story.webp",
        alt: "El mismo flyer en formato historia, con la invitación a reservar mesa",
      },
    ],
    // Autorizado por Maly Bar (confirmado por RINDE el 01/11/2026). Sin resultados publicados: no hay datos medidos.
    published: true,
  },
];

export const publishedProjects = projects.filter((p) => p.published);
