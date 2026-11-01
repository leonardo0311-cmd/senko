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
export const projects: Project[] = [];

export const publishedProjects = projects.filter((p) => p.published);
