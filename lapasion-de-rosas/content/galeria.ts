/**
 * ============================================================================
 * GALERÍA
 * ============================================================================
 * Orden configurable. Cada entrada apunta a una clave de `content/medios.ts`.
 * Para sumar fotos: agregá la imagen en medios.ts y referencia su clave acá.
 */

import type { ClaveMedio } from "./medios";

export type CategoriaGaleria = "todo" | "gastronomia" | "ambiente" | "detalles";

export type ItemGaleria = {
  medio: ClaveMedio;
  categoria: Exclude<CategoriaGaleria, "todo">;
};

export const filtrosGaleria: { id: CategoriaGaleria; etiqueta: string }[] = [
  { id: "todo", etiqueta: "Todo" },
  { id: "gastronomia", etiqueta: "Gastronomía" },
  { id: "ambiente", etiqueta: "Ambiente" },
  { id: "detalles", etiqueta: "Detalles" },
];

export const galeria: ItemGaleria[] = [
  { medio: "platoPrincipal", categoria: "gastronomia" },
  { medio: "espacioMesa", categoria: "ambiente" },
  { medio: "platoDetalle", categoria: "detalles" },
  { medio: "espacioParrilla", categoria: "gastronomia" },
  { medio: "vino", categoria: "detalles" },
  { medio: "espacioDetalleLuz", categoria: "ambiente" },
  { medio: "platoBrasas", categoria: "gastronomia" },
  { medio: "historiaDetalle", categoria: "detalles" },
  { medio: "fachada", categoria: "ambiente" },
];
