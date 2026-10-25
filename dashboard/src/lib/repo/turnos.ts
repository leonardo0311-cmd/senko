import { db } from "../db";
import { calcularSena } from "../precios";
import type { EstadoTurno, OrigenTurno, Turno, TurnoDetalle } from "../types";
import { ahora, nuevoId } from "./comun";

type Fila = {
  id: string;
  cliente_id: string;
  profesional_id: string;
  servicio_id: string;
  inicio: string;
  fin: string;
  estado: EstadoTurno;
  origen: OrigenTurno;
  precio_base: number;
  notas: string | null;
  ref_externa: string | null;
  creado_en: string;
  actualizado_en: string;
};

type FilaDetalle = Fila & {
  cliente_nombre: string;
  cliente_telefono: string;
  profesional_nombre: string;
  profesional_color: string;
  servicio_nombre: string;
  sena_tipo: "porcentaje" | "fijo";
  sena_valor: number;
  pagado: number | null;
  comentarios: number | null;
  demora_min: number | null;
};

/** Estados que ocupan lugar en la agenda. Cancelado y ausente liberan el horario. */
export const ESTADOS_ACTIVOS = ["pendiente", "confirmado", "completado"] as const;

const aTurno = (f: Fila): Turno => ({
  id: f.id,
  clienteId: f.cliente_id,
  profesionalId: f.profesional_id,
  servicioId: f.servicio_id,
  inicio: f.inicio,
  fin: f.fin,
  estado: f.estado,
  origen: f.origen,
  precioBase: f.precio_base,
  notas: f.notas,
  refExterna: f.ref_externa,
  creadoEn: f.creado_en,
  actualizadoEn: f.actualizado_en,
});

function aDetalle(f: FilaDetalle): TurnoDetalle {
  const senaEsperada = calcularSena({
    precioBase: f.precio_base,
    senaTipo: f.sena_tipo,
    senaValor: f.sena_valor,
  });
  const pagado = f.pagado ?? 0;
  return {
    ...aTurno(f),
    clienteNombre: f.cliente_nombre,
    clienteTelefono: f.cliente_telefono,
    profesionalNombre: f.profesional_nombre,
    profesionalColor: f.profesional_color,
    servicioNombre: f.servicio_nombre,
    pagado,
    senaEsperada,
    senaCubierta: senaEsperada === 0 || pagado >= senaEsperada,
    comentarios: f.comentarios ?? 0,
    demoraMin: f.demora_min,
  };
}

const SELECT_DETALLE = `
  SELECT t.*,
         c.nombre   AS cliente_nombre,
         c.telefono AS cliente_telefono,
         u.nombre   AS profesional_nombre,
         u.color    AS profesional_color,
         s.nombre   AS servicio_nombre,
         s.sena_tipo,
         s.sena_valor,
         (SELECT COALESCE(SUM(p.monto_base), 0)
            FROM pagos p
           WHERE p.turno_id = t.id AND p.estado = 'confirmado') AS pagado,
         (SELECT COUNT(*) FROM comentarios cm WHERE cm.turno_id = t.id) AS comentarios,
         (SELECT cm.minutos FROM comentarios cm
           WHERE cm.turno_id = t.id AND cm.tipo = 'demora'
           ORDER BY cm.creado_en DESC LIMIT 1) AS demora_min
    FROM turnos t
    JOIN clientes  c ON c.id = t.cliente_id
    JOIN usuarios  u ON u.id = t.profesional_id
    JOIN servicios s ON s.id = t.servicio_id
`;

export function obtenerTurno(id: string): TurnoDetalle | null {
  const f = db()
    .prepare<[string], FilaDetalle>(`${SELECT_DETALLE} WHERE t.id = ?`)
    .get(id);
  return f ? aDetalle(f) : null;
}

export function obtenerTurnoPorRefExterna(ref: string): TurnoDetalle | null {
  const f = db()
    .prepare<[string], FilaDetalle>(`${SELECT_DETALLE} WHERE t.ref_externa = ?`)
    .get(ref);
  return f ? aDetalle(f) : null;
}

/**
 * Turnos en un rango [desde, hasta). Si se pasa `profesionalId` devuelve solo
 * los de ese profesional: es el filtro que aplica la dashboard cuando el que
 * entra es un profesional y no el dueño.
 */
export function listarTurnos(filtros: {
  desde: string;
  hasta: string;
  profesionalId?: string | null;
  clienteId?: string | null;
  estados?: EstadoTurno[];
}): TurnoDetalle[] {
  const condiciones = ["t.inicio >= ?", "t.inicio < ?"];
  const params: unknown[] = [filtros.desde, filtros.hasta];

  if (filtros.profesionalId) {
    condiciones.push("t.profesional_id = ?");
    params.push(filtros.profesionalId);
  }
  if (filtros.clienteId) {
    condiciones.push("t.cliente_id = ?");
    params.push(filtros.clienteId);
  }
  if (filtros.estados?.length) {
    condiciones.push(`t.estado IN (${filtros.estados.map(() => "?").join(", ")})`);
    params.push(...filtros.estados);
  }

  return db()
    .prepare<unknown[], FilaDetalle>(
      `${SELECT_DETALLE} WHERE ${condiciones.join(" AND ")} ORDER BY t.inicio`,
    )
    .all(...params)
    .map(aDetalle);
}

export function turnosDeCliente(clienteId: string, limite = 50): TurnoDetalle[] {
  return db()
    .prepare<[string, number], FilaDetalle>(
      `${SELECT_DETALLE} WHERE t.cliente_id = ? ORDER BY t.inicio DESC LIMIT ?`,
    )
    .all(clienteId, limite)
    .map(aDetalle);
}

/** Turnos que se superponen con un horario, para un profesional. */
export function turnosSuperpuestos(
  profesionalId: string,
  inicio: string,
  fin: string,
  excluirTurnoId?: string,
): Turno[] {
  const params: unknown[] = [profesionalId, fin, inicio];
  let sql = `
    SELECT * FROM turnos
     WHERE profesional_id = ?
       AND estado IN ('pendiente', 'confirmado', 'completado')
       AND inicio < ?
       AND fin > ?`;
  if (excluirTurnoId) {
    sql += ` AND id != ?`;
    params.push(excluirTurnoId);
  }
  return db().prepare<unknown[], Fila>(sql).all(...params).map(aTurno);
}

export function hayDisponibilidad(
  profesionalId: string,
  inicio: string,
  fin: string,
  excluirTurnoId?: string,
): boolean {
  return turnosSuperpuestos(profesionalId, inicio, fin, excluirTurnoId).length === 0;
}

export function crearTurno(datos: {
  clienteId: string;
  profesionalId: string;
  servicioId: string;
  inicio: string;
  fin: string;
  precioBase: number;
  estado?: EstadoTurno;
  origen?: OrigenTurno;
  notas?: string | null;
  refExterna?: string | null;
}): TurnoDetalle {
  if (!hayDisponibilidad(datos.profesionalId, datos.inicio, datos.fin)) {
    throw new ConflictoHorario(
      "Ese horario ya está ocupado para ese profesional.",
    );
  }
  const id = nuevoId("trn");
  const momento = ahora();
  db()
    .prepare(
      `INSERT INTO turnos (id, cliente_id, profesional_id, servicio_id, inicio, fin, estado, origen,
                           precio_base, notas, ref_externa, creado_en, actualizado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      datos.clienteId,
      datos.profesionalId,
      datos.servicioId,
      datos.inicio,
      datos.fin,
      datos.estado ?? "pendiente",
      datos.origen ?? "dashboard",
      Math.round(datos.precioBase),
      datos.notas?.trim() || null,
      datos.refExterna || null,
      momento,
      momento,
    );
  return obtenerTurno(id)!;
}

export function moverTurno(id: string, inicio: string, fin: string): TurnoDetalle {
  const turno = obtenerTurno(id);
  if (!turno) throw new Error("Turno inexistente");
  if (!hayDisponibilidad(turno.profesionalId, inicio, fin, id)) {
    throw new ConflictoHorario("Ese horario ya está ocupado para ese profesional.");
  }
  db()
    .prepare(`UPDATE turnos SET inicio = ?, fin = ?, actualizado_en = ? WHERE id = ?`)
    .run(inicio, fin, ahora(), id);
  return obtenerTurno(id)!;
}

export function cambiarEstadoTurno(id: string, estado: EstadoTurno): void {
  db()
    .prepare(`UPDATE turnos SET estado = ?, actualizado_en = ? WHERE id = ?`)
    .run(estado, ahora(), id);
}

export function actualizarTurno(
  id: string,
  datos: {
    profesionalId?: string;
    servicioId?: string;
    inicio?: string;
    fin?: string;
    precioBase?: number;
    estado?: EstadoTurno;
    notas?: string | null;
  },
): TurnoDetalle {
  const turno = obtenerTurno(id);
  if (!turno) throw new Error("Turno inexistente");

  const profesionalId = datos.profesionalId ?? turno.profesionalId;
  const inicio = datos.inicio ?? turno.inicio;
  const fin = datos.fin ?? turno.fin;

  if (!hayDisponibilidad(profesionalId, inicio, fin, id)) {
    throw new ConflictoHorario("Ese horario ya está ocupado para ese profesional.");
  }

  db()
    .prepare(
      `UPDATE turnos SET profesional_id = ?, servicio_id = ?, inicio = ?, fin = ?, precio_base = ?,
                         estado = ?, notas = ?, actualizado_en = ?
       WHERE id = ?`,
    )
    .run(
      profesionalId,
      datos.servicioId ?? turno.servicioId,
      inicio,
      fin,
      Math.round(datos.precioBase ?? turno.precioBase),
      datos.estado ?? turno.estado,
      datos.notas !== undefined ? datos.notas?.trim() || null : turno.notas,
      ahora(),
      id,
    );
  return obtenerTurno(id)!;
}

export function eliminarTurno(id: string): void {
  db().prepare(`DELETE FROM turnos WHERE id = ?`).run(id);
}

/** Se lanza cuando el horario pedido choca con otro turno. */
export class ConflictoHorario extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ConflictoHorario";
  }
}
