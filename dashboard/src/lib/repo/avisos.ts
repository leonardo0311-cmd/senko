import { db } from "../db";
import type {
  Comentario,
  Notificacion,
  TipoComentario,
  TipoNotificacion,
} from "../types";
import { ahora, bool, nuevoId } from "./comun";

// ------------------------------------------------------------- comentarios

type FilaComentario = {
  id: string;
  turno_id: string;
  autor_id: string | null;
  autor_nombre: string | null;
  texto: string;
  tipo: TipoComentario;
  minutos: number | null;
  creado_en: string;
};

const aComentario = (f: FilaComentario): Comentario => ({
  id: f.id,
  turnoId: f.turno_id,
  autorId: f.autor_id,
  autorNombre: f.autor_nombre ?? "Usuario eliminado",
  texto: f.texto,
  tipo: f.tipo,
  minutos: f.minutos,
  creadoEn: f.creado_en,
});

const SELECT_COMENTARIO = `
  SELECT c.*, u.nombre AS autor_nombre
    FROM comentarios c
    LEFT JOIN usuarios u ON u.id = c.autor_id
`;

export function comentariosDeTurno(turnoId: string): Comentario[] {
  return db()
    .prepare<[string], FilaComentario>(
      `${SELECT_COMENTARIO} WHERE c.turno_id = ? ORDER BY c.creado_en`,
    )
    .all(turnoId)
    .map(aComentario);
}

/** Últimos comentarios de todos los turnos, para el panel del dueño. */
export function ultimosComentarios(limite = 30, profesionalId?: string): Comentario[] {
  const condiciones: string[] = [];
  const params: unknown[] = [];
  if (profesionalId) {
    condiciones.push("c.turno_id IN (SELECT id FROM turnos WHERE profesional_id = ?)");
    params.push(profesionalId);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  return db()
    .prepare<unknown[], FilaComentario>(
      `${SELECT_COMENTARIO} ${where} ORDER BY c.creado_en DESC LIMIT ?`,
    )
    .all(...params, limite)
    .map(aComentario);
}

export function contarComentarios(turnoId: string): number {
  const f = db()
    .prepare<[string], { n: number }>(
      `SELECT COUNT(*) AS n FROM comentarios WHERE turno_id = ?`,
    )
    .get(turnoId);
  return f?.n ?? 0;
}

export function crearComentario(datos: {
  turnoId: string;
  autorId: string;
  texto: string;
  tipo?: TipoComentario;
  minutos?: number | null;
}): Comentario {
  const id = nuevoId("cmt");
  db()
    .prepare(
      `INSERT INTO comentarios (id, turno_id, autor_id, texto, tipo, minutos, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      datos.turnoId,
      datos.autorId,
      datos.texto.trim(),
      datos.tipo ?? "nota",
      datos.minutos ?? null,
      ahora(),
    );
  const f = db()
    .prepare<[string], FilaComentario>(`${SELECT_COMENTARIO} WHERE c.id = ?`)
    .get(id);
  return aComentario(f!);
}

export function eliminarComentario(id: string): void {
  db().prepare(`DELETE FROM comentarios WHERE id = ?`).run(id);
}

// ----------------------------------------------------------- notificaciones

type FilaNotif = {
  id: string;
  destinatario_id: string;
  autor_id: string | null;
  autor_nombre: string | null;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  turno_id: string | null;
  turno_inicio: string | null;
  cliente_nombre: string | null;
  leida: number;
  avisada: number;
  creado_en: string;
};

const aNotif = (f: FilaNotif): Notificacion => ({
  id: f.id,
  destinatarioId: f.destinatario_id,
  autorId: f.autor_id,
  autorNombre: f.autor_nombre,
  tipo: f.tipo,
  titulo: f.titulo,
  cuerpo: f.cuerpo,
  turnoId: f.turno_id,
  turnoInicio: f.turno_inicio,
  clienteNombre: f.cliente_nombre,
  leida: bool(f.leida),
  avisada: bool(f.avisada),
  creadoEn: f.creado_en,
});

const SELECT_NOTIF = `
  SELECT n.*,
         u.nombre AS autor_nombre,
         t.inicio AS turno_inicio,
         c.nombre AS cliente_nombre
    FROM notificaciones n
    LEFT JOIN usuarios u ON u.id = n.autor_id
    LEFT JOIN turnos   t ON t.id = n.turno_id
    LEFT JOIN clientes c ON c.id = t.cliente_id
`;

export function listarNotificaciones(
  destinatarioId: string,
  opciones?: { soloSinLeer?: boolean; limite?: number },
): Notificacion[] {
  const condiciones = ["n.destinatario_id = ?"];
  const params: unknown[] = [destinatarioId];
  if (opciones?.soloSinLeer) condiciones.push("n.leida = 0");
  return db()
    .prepare<unknown[], FilaNotif>(
      `${SELECT_NOTIF} WHERE ${condiciones.join(" AND ")} ORDER BY n.creado_en DESC LIMIT ?`,
    )
    .all(...params, opciones?.limite ?? 100)
    .map(aNotif);
}

export function contarSinLeer(destinatarioId: string): number {
  const f = db()
    .prepare<[string], { n: number }>(
      `SELECT COUNT(*) AS n FROM notificaciones WHERE destinatario_id = ? AND leida = 0`,
    )
    .get(destinatarioId);
  return f?.n ?? 0;
}

export function crearNotificacion(datos: {
  destinatarioId: string;
  autorId?: string | null;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  turnoId?: string | null;
}): void {
  db()
    .prepare(
      `INSERT INTO notificaciones (id, destinatario_id, autor_id, tipo, titulo, cuerpo, turno_id, leida, avisada, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
    )
    .run(
      nuevoId("ntf"),
      datos.destinatarioId,
      datos.autorId ?? null,
      datos.tipo,
      datos.titulo.trim(),
      datos.cuerpo.trim(),
      datos.turnoId ?? null,
      ahora(),
    );
}

/** Le avisa a todos los dueños activos. Lo normal es que haya uno solo. */
export function avisarADuenos(datos: {
  autorId?: string | null;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  turnoId?: string | null;
}): number {
  const duenos = db()
    .prepare<[], { id: string }>(
      `SELECT id FROM usuarios WHERE rol = 'dueno' AND activo = 1`,
    )
    .all();
  for (const d of duenos) {
    crearNotificacion({ ...datos, destinatarioId: d.id });
  }
  return duenos.length;
}

export function marcarLeida(id: string, destinatarioId: string): void {
  db()
    .prepare(`UPDATE notificaciones SET leida = 1 WHERE id = ? AND destinatario_id = ?`)
    .run(id, destinatarioId);
}

export function marcarTodasLeidas(destinatarioId: string): void {
  db()
    .prepare(`UPDATE notificaciones SET leida = 1 WHERE destinatario_id = ? AND leida = 0`)
    .run(destinatarioId);
}

/**
 * Notificaciones que el bot todavía no mandó por WhatsApp. Al entregarlas se
 * marcan como avisadas para que no se repitan en la próxima consulta.
 */
export function pendientesDeAviso(limite = 50): Notificacion[] {
  return db()
    .prepare<[number], FilaNotif>(
      `${SELECT_NOTIF} WHERE n.avisada = 0 ORDER BY n.creado_en LIMIT ?`,
    )
    .all(limite)
    .map(aNotif);
}

export function marcarAvisadas(ids: string[]): void {
  if (ids.length === 0) return;
  const conexion = db();
  const marcar = conexion.prepare(`UPDATE notificaciones SET avisada = 1 WHERE id = ?`);
  const tx = conexion.transaction((lista: string[]) => {
    for (const id of lista) marcar.run(id);
  });
  tx(ids);
}
