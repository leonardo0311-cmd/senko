/**
 * Toda la plata se guarda y se calcula en centavos (enteros) para no arrastrar
 * errores de punto flotante. Solo se convierte a texto al mostrarla.
 */

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 150000 (centavos) -> "$ 1.500" */
export function plata(centavos: number): string {
  return formatoARS.format(Math.round(centavos / 100));
}

/** 150000 -> "1500" (para inputs) */
export function aPesos(centavos: number): number {
  return Math.round(centavos) / 100;
}

/** "1500" | 1500 -> 150000 */
export function aCentavos(pesos: string | number): number {
  const n = typeof pesos === "string" ? Number(pesos.replace(",", ".")) : pesos;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** -10 -> "-10%", 10 -> "+10%", 0 -> "sin ajuste" */
export function porcentaje(pct: number): string {
  if (pct === 0) return "sin ajuste";
  const valor = Number.isInteger(pct) ? String(pct) : pct.toFixed(2);
  return `${pct > 0 ? "+" : ""}${valor}%`;
}
