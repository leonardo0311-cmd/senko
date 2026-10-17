/**
 * Preferencias de movimiento y capacidad del dispositivo.
 * Un único lugar decide cuánto se anima el sitio.
 */

export function prefiereMenosMovimiento(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Presupuesto de animación según el equipo. Los efectos costosos
 * (partículas, parallax) se reducen o se apagan en gama media y baja.
 */
export type NivelMovimiento = "nulo" | "reducido" | "completo";

export function nivelMovimiento(): NivelMovimiento {
  if (typeof window === "undefined") return "nulo";
  if (prefiereMenosMovimiento()) return "nulo";

  const nucleos = navigator.hardwareConcurrency ?? 4;
  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const pantallaChica = window.matchMedia("(max-width: 768px)").matches;
  const punteroGrueso = window.matchMedia("(pointer: coarse)").matches;

  if (nucleos <= 4 || memoria <= 4) return "reducido";
  if (pantallaChica || punteroGrueso) return "reducido";
  return "completo";
}

/** Observa cambios en la preferencia de movimiento del sistema. */
export function alCambiarPreferencia(cb: (reducido: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = (e: MediaQueryListEvent) => cb(e.matches);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
