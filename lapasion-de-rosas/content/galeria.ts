import type { ClaveMedio } from "./medios";

/**
 * Galería. `cls` define el tamaño dentro de la grilla editorial (g1…g5).
 * El orden es configurable: mové las filas y listo.
 */
export type ItemGaleria = {
  medio: ClaveMedio;
  cap: string;
  capEn: string;
  cls: "g1" | "g2" | "g3" | "g4" | "g5";
};

export const GALERIA: ItemGaleria[] = [
  { medio: "especialidad", cap: "El costillar, directo de la parrilla", capEn: "The short ribs, straight off the grill", cls: "g1" },
  { medio: "salon", cap: "El salón antes del servicio", capEn: "The dining room before service", cls: "g2" },
  { medio: "parrilla", cap: "La parrilla trabajando", capEn: "The grill at work", cls: "g3" },
  { medio: "detalle", cap: "Los detalles de la mesa", capEn: "Details on the table", cls: "g4" },
  { medio: "vino", cap: "La bodega", capEn: "From the cellar", cls: "g5" },
];

/** Mosaico de Instagram: se repiten claves a propósito, como un feed. */
export const FEED: ClaveMedio[] = [
  "especialidad", "salon", "parrilla", "detalle", "vino",
  "hero", "nosotros", "fachada", "fuego", "reservas",
];
