import type { MetodoPago, MetodoPagoClave, Servicio } from "./types";

/**
 * Motor de precios.
 *
 * Reglas del negocio:
 *  1. Cada servicio tiene un PRECIO GENERAL (`precioBase`).
 *  2. Cada metodo de pago tiene un ajuste porcentual firmado y configurable
 *     desde Configuracion:
 *       - credito / debito  -> ajuste positivo  (recargo)
 *       - efectivo / transferencia por alias -> ajuste negativo (descuento)
 *  3. El ajuste se aplica sobre la parte del precio general que cubre ese pago,
 *     no sobre el total del turno. Asi un cliente puede señar por transferencia
 *     (con descuento) y pagar el saldo con credito (con recargo), y cada tramo
 *     queda con su propio ajuste.
 *  4. La seña se calcula siempre sobre el precio general, antes de ajustes.
 *
 * Redondeo: el ajuste se redondea al centavo mas cercano (half-up).
 */

export type Cobro = {
  /** Parte del precio general que cubre el pago, en centavos. */
  base: number;
  ajustePct: number;
  /** Recargo (+) o descuento (-), en centavos. */
  ajusteMonto: number;
  /** Lo que entra en caja: base + ajusteMonto, en centavos. */
  total: number;
};

/** Aplica el ajuste de un metodo de pago sobre un monto base. */
export function calcularCobro(base: number, ajustePct: number): Cobro {
  const baseEntera = Math.round(base);
  const ajusteMonto = Math.round((baseEntera * ajustePct) / 100);
  return {
    base: baseEntera,
    ajustePct,
    ajusteMonto,
    total: baseEntera + ajusteMonto,
  };
}

/** Igual que `calcularCobro` pero buscando el metodo en la configuracion. */
export function cobroPorMetodo(
  base: number,
  metodo: MetodoPagoClave,
  metodos: MetodoPago[],
): Cobro {
  const config = metodos.find((m) => m.clave === metodo);
  return calcularCobro(base, config?.ajustePct ?? 0);
}

/** Seña esperada de un servicio, en centavos, a precio general. */
export function calcularSena(servicio: Pick<Servicio, "precioBase" | "senaTipo" | "senaValor">): number {
  if (servicio.senaTipo === "fijo") {
    return Math.min(Math.round(servicio.senaValor), servicio.precioBase);
  }
  const porPorcentaje = Math.round((servicio.precioBase * servicio.senaValor) / 100);
  return Math.min(porPorcentaje, servicio.precioBase);
}

/**
 * Precio final del turno pagado enteramente con un metodo.
 * Es lo que el bot le informa al cliente por WhatsApp.
 */
export function precioFinal(
  precioBase: number,
  metodo: MetodoPagoClave,
  metodos: MetodoPago[],
): number {
  return cobroPorMetodo(precioBase, metodo, metodos).total;
}

/** Tabla "precio segun como pagues", para la UI y para el bot. */
export function tarifario(
  precioBase: number,
  metodos: MetodoPago[],
): Array<{ metodo: MetodoPagoClave; etiqueta: string; ajustePct: number; total: number }> {
  return metodos
    .filter((m) => m.activo)
    .sort((a, b) => a.orden - b.orden)
    .map((m) => ({
      metodo: m.clave,
      etiqueta: m.etiqueta,
      ajustePct: m.ajustePct,
      total: calcularCobro(precioBase, m.ajustePct).total,
    }));
}
