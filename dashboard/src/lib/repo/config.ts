import { db } from "../db";
import type { Horario, MetodoPago, MetodoPagoClave } from "../types";
import { bool, int, nuevoId } from "./comun";

// --------------------------------------------------------- metodos de pago

type FilaMetodo = {
  clave: MetodoPagoClave;
  etiqueta: string;
  ajuste_pct: number;
  activo: number;
  orden: number;
};

const aMetodo = (f: FilaMetodo): MetodoPago => ({
  clave: f.clave,
  etiqueta: f.etiqueta,
  ajustePct: f.ajuste_pct,
  activo: bool(f.activo),
  orden: f.orden,
});

export function listarMetodosPago(): MetodoPago[] {
  return db()
    .prepare<[], FilaMetodo>(`SELECT * FROM metodos_pago ORDER BY orden`)
    .all()
    .map(aMetodo);
}

export function obtenerMetodoPago(clave: MetodoPagoClave): MetodoPago | null {
  const f = db()
    .prepare<[string], FilaMetodo>(`SELECT * FROM metodos_pago WHERE clave = ?`)
    .get(clave);
  return f ? aMetodo(f) : null;
}

export function actualizarMetodoPago(
  clave: MetodoPagoClave,
  datos: { etiqueta?: string; ajustePct?: number; activo?: boolean },
): void {
  const actual = obtenerMetodoPago(clave);
  if (!actual) throw new Error(`Metodo de pago desconocido: ${clave}`);
  const pct = datos.ajustePct ?? actual.ajustePct;
  if (!Number.isFinite(pct) || pct < -100 || pct > 100) {
    throw new Error("El ajuste tiene que estar entre -100% y +100%.");
  }
  db()
    .prepare(`UPDATE metodos_pago SET etiqueta = ?, ajuste_pct = ?, activo = ? WHERE clave = ?`)
    .run(
      datos.etiqueta?.trim() || actual.etiqueta,
      pct,
      int(datos.activo ?? actual.activo),
      clave,
    );
}

// ------------------------------------------------------------------ ajustes

export type ClaveAjuste =
  | "negocio_nombre"
  | "transferencia_alias"
  | "transferencia_cbu"
  | "transferencia_titular"
  | "sena_horas_vencimiento";

const PREDETERMINADOS: Record<ClaveAjuste, string> = {
  negocio_nombre: "Senko Intelligence",
  transferencia_alias: "",
  transferencia_cbu: "",
  transferencia_titular: "",
  sena_horas_vencimiento: "24",
};

export function obtenerAjuste(clave: ClaveAjuste): string {
  const f = db()
    .prepare<[string], { valor: string }>(`SELECT valor FROM ajustes WHERE clave = ?`)
    .get(clave);
  return f?.valor ?? PREDETERMINADOS[clave];
}

export function obtenerAjustes(): Record<ClaveAjuste, string> {
  const filas = db()
    .prepare<[], { clave: string; valor: string }>(`SELECT clave, valor FROM ajustes`)
    .all();
  const mapa = { ...PREDETERMINADOS };
  for (const f of filas) {
    if (f.clave in mapa) mapa[f.clave as ClaveAjuste] = f.valor;
  }
  return mapa;
}

export function guardarAjuste(clave: ClaveAjuste, valor: string): void {
  db()
    .prepare(
      `INSERT INTO ajustes (clave, valor) VALUES (?, ?)
       ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
    )
    .run(clave, valor.trim());
}

// ----------------------------------------------------------------- horarios

type FilaHorario = {
  id: string;
  profesional_id: string;
  dia_semana: number;
  desde: string;
  hasta: string;
};

const aHorario = (f: FilaHorario): Horario => ({
  id: f.id,
  profesionalId: f.profesional_id,
  diaSemana: f.dia_semana,
  desde: f.desde,
  hasta: f.hasta,
});

export function horariosDeProfesional(profesionalId: string): Horario[] {
  return db()
    .prepare<[string], FilaHorario>(
      `SELECT * FROM horarios WHERE profesional_id = ? ORDER BY dia_semana, desde`,
    )
    .all(profesionalId)
    .map(aHorario);
}

export function definirHorarios(
  profesionalId: string,
  tramos: Array<{ diaSemana: number; desde: string; hasta: string }>,
): void {
  const conexion = db();
  const tx = conexion.transaction(() => {
    conexion.prepare(`DELETE FROM horarios WHERE profesional_id = ?`).run(profesionalId);
    const insertar = conexion.prepare(
      `INSERT INTO horarios (id, profesional_id, dia_semana, desde, hasta) VALUES (?, ?, ?, ?, ?)`,
    );
    for (const t of tramos) {
      insertar.run(nuevoId("hor"), profesionalId, t.diaSemana, t.desde, t.hasta);
    }
  });
  tx();
}
