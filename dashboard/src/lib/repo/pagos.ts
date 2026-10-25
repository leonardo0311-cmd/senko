import { db } from "../db";
import { cobroPorMetodo } from "../precios";
import type {
  EstadoPago,
  MetodoPagoClave,
  Pago,
  PagoDetalle,
  TipoPago,
} from "../types";
import { ahora, nuevoId } from "./comun";
import { listarMetodosPago } from "./config";

type Fila = {
  id: string;
  turno_id: string | null;
  cliente_id: string;
  metodo: MetodoPagoClave;
  tipo: TipoPago;
  monto_base: number;
  ajuste_pct: number;
  ajuste_monto: number;
  monto_total: number;
  estado: EstadoPago;
  alias: string | null;
  referencia: string | null;
  pagado_en: string | null;
  creado_en: string;
};

type FilaDetalle = Fila & {
  cliente_nombre: string;
  servicio_nombre: string | null;
  turno_inicio: string | null;
  profesional_nombre: string | null;
};

const aPago = (f: Fila): Pago => ({
  id: f.id,
  turnoId: f.turno_id,
  clienteId: f.cliente_id,
  metodo: f.metodo,
  tipo: f.tipo,
  montoBase: f.monto_base,
  ajustePct: f.ajuste_pct,
  ajusteMonto: f.ajuste_monto,
  montoTotal: f.monto_total,
  estado: f.estado,
  alias: f.alias,
  referencia: f.referencia,
  pagadoEn: f.pagado_en,
  creadoEn: f.creado_en,
});

const aDetalle = (f: FilaDetalle): PagoDetalle => ({
  ...aPago(f),
  clienteNombre: f.cliente_nombre,
  servicioNombre: f.servicio_nombre,
  turnoInicio: f.turno_inicio,
  profesionalNombre: f.profesional_nombre,
});

const SELECT_DETALLE = `
  SELECT p.*,
         c.nombre AS cliente_nombre,
         s.nombre AS servicio_nombre,
         t.inicio AS turno_inicio,
         u.nombre AS profesional_nombre
    FROM pagos p
    JOIN clientes  c ON c.id = p.cliente_id
    LEFT JOIN turnos    t ON t.id = p.turno_id
    LEFT JOIN servicios s ON s.id = t.servicio_id
    LEFT JOIN usuarios  u ON u.id = t.profesional_id
`;

export function obtenerPago(id: string): PagoDetalle | null {
  const f = db().prepare<[string], FilaDetalle>(`${SELECT_DETALLE} WHERE p.id = ?`).get(id);
  return f ? aDetalle(f) : null;
}

export function listarPagos(filtros?: {
  desde?: string;
  hasta?: string;
  clienteId?: string;
  metodo?: MetodoPagoClave;
  tipo?: TipoPago;
  estado?: EstadoPago;
  profesionalId?: string;
  limite?: number;
}): PagoDetalle[] {
  const condiciones: string[] = [];
  const params: unknown[] = [];

  if (filtros?.desde) {
    condiciones.push("COALESCE(p.pagado_en, p.creado_en) >= ?");
    params.push(filtros.desde);
  }
  if (filtros?.hasta) {
    condiciones.push("COALESCE(p.pagado_en, p.creado_en) < ?");
    params.push(filtros.hasta);
  }
  if (filtros?.clienteId) {
    condiciones.push("p.cliente_id = ?");
    params.push(filtros.clienteId);
  }
  if (filtros?.metodo) {
    condiciones.push("p.metodo = ?");
    params.push(filtros.metodo);
  }
  if (filtros?.tipo) {
    condiciones.push("p.tipo = ?");
    params.push(filtros.tipo);
  }
  if (filtros?.estado) {
    condiciones.push("p.estado = ?");
    params.push(filtros.estado);
  }
  if (filtros?.profesionalId) {
    condiciones.push("t.profesional_id = ?");
    params.push(filtros.profesionalId);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const limite = filtros?.limite ?? 500;

  return db()
    .prepare<unknown[], FilaDetalle>(
      `${SELECT_DETALLE} ${where} ORDER BY COALESCE(p.pagado_en, p.creado_en) DESC LIMIT ?`,
    )
    .all(...params, limite)
    .map(aDetalle);
}

export function pagosDeTurno(turnoId: string): Pago[] {
  return db()
    .prepare<[string], Fila>(`SELECT * FROM pagos WHERE turno_id = ? ORDER BY creado_en`)
    .all(turnoId)
    .map(aPago);
}

/**
 * Registra un pago. El ajuste del metodo se calcula aca mismo: quien llama
 * pasa el monto a precio general y el motor de precios resuelve el recargo o
 * descuento, asi la dashboard y el bot nunca pueden discrepar.
 */
export function registrarPago(datos: {
  clienteId: string;
  turnoId?: string | null;
  metodo: MetodoPagoClave;
  tipo: TipoPago;
  /** Parte del precio general que cubre este pago, en centavos. */
  montoBase: number;
  estado?: EstadoPago;
  alias?: string | null;
  referencia?: string | null;
  pagadoEn?: string | null;
}): PagoDetalle {
  const metodos = listarMetodosPago();
  const cobro = cobroPorMetodo(datos.montoBase, datos.metodo, metodos);
  const estado = datos.estado ?? "confirmado";
  const id = nuevoId("pag");

  db()
    .prepare(
      `INSERT INTO pagos (id, turno_id, cliente_id, metodo, tipo, monto_base, ajuste_pct, ajuste_monto,
                          monto_total, estado, alias, referencia, pagado_en, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      datos.turnoId || null,
      datos.clienteId,
      datos.metodo,
      datos.tipo,
      cobro.base,
      cobro.ajustePct,
      cobro.ajusteMonto,
      cobro.total,
      estado,
      datos.alias?.trim() || null,
      datos.referencia?.trim() || null,
      estado === "confirmado" ? (datos.pagadoEn ?? ahora()) : (datos.pagadoEn ?? null),
      ahora(),
    );
  return obtenerPago(id)!;
}

export function cambiarEstadoPago(id: string, estado: EstadoPago): void {
  db()
    .prepare(
      `UPDATE pagos SET estado = ?, pagado_en = CASE WHEN ? = 'confirmado' THEN COALESCE(pagado_en, ?) ELSE pagado_en END
       WHERE id = ?`,
    )
    .run(estado, estado, ahora(), id);
}

export function eliminarPago(id: string): void {
  db().prepare(`DELETE FROM pagos WHERE id = ?`).run(id);
}
