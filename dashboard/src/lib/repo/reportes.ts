import { db } from "../db";
import { METODOS_ORDEN } from "../types";
import type {
  Cliente,
  DesglosePorMetodo,
  MetodoPagoClave,
  ResumenCliente,
} from "../types";

export const DESGLOSE_VACIO = (): DesglosePorMetodo => ({
  efectivo: 0,
  transferencia: 0,
  credito: 0,
  debito: 0,
});

type Rango = { desde?: string; hasta?: string; profesionalId?: string };

function condicionesRango(rango: Rango, params: unknown[]): string {
  const condiciones = ["p.estado = 'confirmado'"];
  if (rango.desde) {
    condiciones.push("COALESCE(p.pagado_en, p.creado_en) >= ?");
    params.push(rango.desde);
  }
  if (rango.hasta) {
    condiciones.push("COALESCE(p.pagado_en, p.creado_en) < ?");
    params.push(rango.hasta);
  }
  if (rango.profesionalId) {
    condiciones.push("t.profesional_id = ?");
    params.push(rango.profesionalId);
  }
  return condiciones.join(" AND ");
}

/**
 * EL APARTADO PRINCIPAL: cuanto gasto cada cliente, separado por metodo de
 * pago, con el precio general y los recargos/descuentos discriminados.
 *
 * `totalCobrado` es lo que realmente entro en caja (con ajustes).
 * `totalBase`    es lo mismo medido a precio general (sin ajustes).
 * `totalAjustes` es la diferencia: positiva si el cliente pago recargos de
 *                tarjeta, negativa si se llevo descuentos por efectivo/alias.
 */
export function resumenPorCliente(rango: Rango = {}): ResumenCliente[] {
  const params: unknown[] = [];
  const where = condicionesRango(rango, params);

  type FilaPago = {
    cliente_id: string;
    metodo: MetodoPagoClave;
    tipo: string;
    total: number;
    base: number;
  };

  const pagos = db()
    .prepare<unknown[], FilaPago>(
      `SELECT p.cliente_id,
              p.metodo,
              p.tipo,
              SUM(p.monto_total) AS total,
              SUM(p.monto_base)  AS base
         FROM pagos p
         LEFT JOIN turnos t ON t.id = p.turno_id
        WHERE ${where}
        GROUP BY p.cliente_id, p.metodo, p.tipo`,
    )
    .all(...params);

  // Señas pendientes (pago creado pero todavia no acreditado).
  const paramsPend: unknown[] = [];
  const condPend = ["p.estado = 'pendiente'", "p.tipo = 'sena'"];
  if (rango.profesionalId) {
    condPend.push("t.profesional_id = ?");
    paramsPend.push(rango.profesionalId);
  }
  const pendientes = db()
    .prepare<unknown[], { cliente_id: string; total: number }>(
      `SELECT p.cliente_id, SUM(p.monto_total) AS total
         FROM pagos p
         LEFT JOIN turnos t ON t.id = p.turno_id
        WHERE ${condPend.join(" AND ")}
        GROUP BY p.cliente_id`,
    )
    .all(...paramsPend);

  const paramsTurnos: unknown[] = [];
  const condTurnos: string[] = [];
  if (rango.desde) {
    condTurnos.push("t.inicio >= ?");
    paramsTurnos.push(rango.desde);
  }
  if (rango.hasta) {
    condTurnos.push("t.inicio < ?");
    paramsTurnos.push(rango.hasta);
  }
  if (rango.profesionalId) {
    condTurnos.push("t.profesional_id = ?");
    paramsTurnos.push(rango.profesionalId);
  }
  const whereTurnos = condTurnos.length ? `WHERE ${condTurnos.join(" AND ")}` : "";

  const turnos = db()
    .prepare<unknown[], {
      cliente_id: string;
      total: number;
      cancelados: number;
      ultimo: string | null;
    }>(
      `SELECT t.cliente_id,
              SUM(CASE WHEN t.estado IN ('pendiente','confirmado','completado') THEN 1 ELSE 0 END) AS total,
              SUM(CASE WHEN t.estado IN ('cancelado','ausente') THEN 1 ELSE 0 END) AS cancelados,
              MAX(t.inicio) AS ultimo
         FROM turnos t
         ${whereTurnos}
        GROUP BY t.cliente_id`,
    )
    .all(...paramsTurnos);

  const clientes = db()
    .prepare<[], {
      id: string;
      nombre: string;
      telefono: string;
      email: string | null;
      notas: string | null;
      creado_en: string;
    }>(`SELECT * FROM clientes`)
    .all();

  const porId = new Map<string, ResumenCliente>();
  for (const c of clientes) {
    const cliente: Cliente = {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      email: c.email,
      notas: c.notas,
      creadoEn: c.creado_en,
    };
    porId.set(c.id, {
      cliente,
      totalCobrado: 0,
      totalBase: 0,
      totalAjustes: 0,
      porMetodo: DESGLOSE_VACIO(),
      baseEnPorMetodo: DESGLOSE_VACIO(),
      senasPagadas: 0,
      senasPendientes: 0,
      turnos: 0,
      turnosCancelados: 0,
      ultimoTurno: null,
    });
  }

  for (const fila of pagos) {
    const r = porId.get(fila.cliente_id);
    if (!r) continue;
    r.totalCobrado += fila.total;
    r.totalBase += fila.base;
    r.porMetodo[fila.metodo] += fila.total;
    r.baseEnPorMetodo[fila.metodo] += fila.base;
    if (fila.tipo === "sena") r.senasPagadas += fila.total;
  }
  for (const fila of pendientes) {
    const r = porId.get(fila.cliente_id);
    if (r) r.senasPendientes += fila.total;
  }
  for (const fila of turnos) {
    const r = porId.get(fila.cliente_id);
    if (!r) continue;
    r.turnos = fila.total;
    r.turnosCancelados = fila.cancelados;
    r.ultimoTurno = fila.ultimo;
  }
  for (const r of porId.values()) {
    r.totalAjustes = r.totalCobrado - r.totalBase;
  }

  return [...porId.values()].sort((a, b) => b.totalCobrado - a.totalCobrado);
}

export function resumenDeCliente(clienteId: string, rango: Rango = {}): ResumenCliente | null {
  return resumenPorCliente(rango).find((r) => r.cliente.id === clienteId) ?? null;
}

/** Totales generales del periodo, con el mismo criterio que el resumen por cliente. */
export type TotalesPeriodo = {
  totalCobrado: number;
  totalBase: number;
  totalAjustes: number;
  porMetodo: DesglosePorMetodo;
  baseEnPorMetodo: DesglosePorMetodo;
  cantidadPagos: number;
  senasCobradas: number;
  senasPendientes: number;
  cantidadSenasPendientes: number;
  saldoPorCobrar: number;
};

export function totalesPeriodo(rango: Rango = {}): TotalesPeriodo {
  const params: unknown[] = [];
  const where = condicionesRango(rango, params);

  const filas = db()
    .prepare<unknown[], {
      metodo: MetodoPagoClave;
      tipo: string;
      total: number;
      base: number;
      n: number;
    }>(
      `SELECT p.metodo, p.tipo, SUM(p.monto_total) AS total, SUM(p.monto_base) AS base, COUNT(*) AS n
         FROM pagos p
         LEFT JOIN turnos t ON t.id = p.turno_id
        WHERE ${where}
        GROUP BY p.metodo, p.tipo`,
    )
    .all(...params);

  const totales: TotalesPeriodo = {
    totalCobrado: 0,
    totalBase: 0,
    totalAjustes: 0,
    porMetodo: DESGLOSE_VACIO(),
    baseEnPorMetodo: DESGLOSE_VACIO(),
    cantidadPagos: 0,
    senasCobradas: 0,
    senasPendientes: 0,
    cantidadSenasPendientes: 0,
    saldoPorCobrar: 0,
  };

  for (const f of filas) {
    totales.totalCobrado += f.total;
    totales.totalBase += f.base;
    totales.porMetodo[f.metodo] += f.total;
    totales.baseEnPorMetodo[f.metodo] += f.base;
    totales.cantidadPagos += f.n;
    if (f.tipo === "sena") totales.senasCobradas += f.total;
  }
  totales.totalAjustes = totales.totalCobrado - totales.totalBase;

  const paramsPend: unknown[] = [];
  const condPend = ["p.estado = 'pendiente'", "p.tipo = 'sena'"];
  if (rango.profesionalId) {
    condPend.push("t.profesional_id = ?");
    paramsPend.push(rango.profesionalId);
  }
  const pend = db()
    .prepare<unknown[], { total: number | null; n: number }>(
      `SELECT SUM(p.monto_total) AS total, COUNT(*) AS n
         FROM pagos p
         LEFT JOIN turnos t ON t.id = p.turno_id
        WHERE ${condPend.join(" AND ")}`,
    )
    .get(...paramsPend);
  totales.senasPendientes = pend?.total ?? 0;
  totales.cantidadSenasPendientes = pend?.n ?? 0;

  // Saldo por cobrar: turnos activos cuyo precio general supera lo ya imputado.
  const paramsSaldo: unknown[] = [];
  const condSaldo = ["t.estado IN ('pendiente','confirmado','completado')"];
  if (rango.desde) {
    condSaldo.push("t.inicio >= ?");
    paramsSaldo.push(rango.desde);
  }
  if (rango.hasta) {
    condSaldo.push("t.inicio < ?");
    paramsSaldo.push(rango.hasta);
  }
  if (rango.profesionalId) {
    condSaldo.push("t.profesional_id = ?");
    paramsSaldo.push(rango.profesionalId);
  }
  const saldo = db()
    .prepare<unknown[], { total: number | null }>(
      `SELECT SUM(MAX(t.precio_base - COALESCE(imputado.base, 0), 0)) AS total
         FROM turnos t
         LEFT JOIN (
           SELECT turno_id, SUM(monto_base) AS base
             FROM pagos WHERE estado = 'confirmado' AND turno_id IS NOT NULL
            GROUP BY turno_id
         ) imputado ON imputado.turno_id = t.id
        WHERE ${condSaldo.join(" AND ")}`,
    )
    .get(...paramsSaldo);
  totales.saldoPorCobrar = saldo?.total ?? 0;

  return totales;
}

/** Facturacion por profesional, para que el dueño compare. */
export function totalesPorProfesional(rango: Omit<Rango, "profesionalId"> = {}): Array<{
  profesionalId: string;
  nombre: string;
  color: string;
  totalCobrado: number;
  porMetodo: DesglosePorMetodo;
  turnos: number;
}> {
  const params: unknown[] = [];
  const where = condicionesRango(rango, params);

  const filas = db()
    .prepare<unknown[], {
      profesional_id: string;
      nombre: string;
      color: string;
      metodo: MetodoPagoClave;
      total: number;
    }>(
      `SELECT t.profesional_id, u.nombre, u.color, p.metodo, SUM(p.monto_total) AS total
         FROM pagos p
         JOIN turnos   t ON t.id = p.turno_id
         JOIN usuarios u ON u.id = t.profesional_id
        WHERE ${where}
        GROUP BY t.profesional_id, p.metodo`,
    )
    .all(...params);

  const paramsTurnos: unknown[] = [];
  const condTurnos = ["t.estado IN ('pendiente','confirmado','completado')"];
  if (rango.desde) {
    condTurnos.push("t.inicio >= ?");
    paramsTurnos.push(rango.desde);
  }
  if (rango.hasta) {
    condTurnos.push("t.inicio < ?");
    paramsTurnos.push(rango.hasta);
  }
  const conteos = db()
    .prepare<unknown[], { profesional_id: string; n: number }>(
      `SELECT t.profesional_id, COUNT(*) AS n FROM turnos t
        WHERE ${condTurnos.join(" AND ")} GROUP BY t.profesional_id`,
    )
    .all(...paramsTurnos);

  const mapa = new Map<string, ReturnType<typeof totalesPorProfesional>[number]>();
  for (const f of filas) {
    let item = mapa.get(f.profesional_id);
    if (!item) {
      item = {
        profesionalId: f.profesional_id,
        nombre: f.nombre,
        color: f.color,
        totalCobrado: 0,
        porMetodo: DESGLOSE_VACIO(),
        turnos: 0,
      };
      mapa.set(f.profesional_id, item);
    }
    item.totalCobrado += f.total;
    item.porMetodo[f.metodo] += f.total;
  }
  for (const c of conteos) {
    const item = mapa.get(c.profesional_id);
    if (item) item.turnos = c.n;
  }
  return [...mapa.values()].sort((a, b) => b.totalCobrado - a.totalCobrado);
}

/** Facturacion por dia, para el grafico de la portada. */
export function serieDiaria(rango: Rango): Array<{ dia: string; total: number }> {
  const params: unknown[] = [];
  const where = condicionesRango(rango, params);
  return db()
    .prepare<unknown[], { dia: string; total: number }>(
      `SELECT substr(COALESCE(p.pagado_en, p.creado_en), 1, 10) AS dia, SUM(p.monto_total) AS total
         FROM pagos p
         LEFT JOIN turnos t ON t.id = p.turno_id
        WHERE ${where}
        GROUP BY dia
        ORDER BY dia`,
    )
    .all(...params);
}

export { METODOS_ORDEN };
