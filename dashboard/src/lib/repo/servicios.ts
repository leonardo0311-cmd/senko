import { db } from "../db";
import type { Servicio } from "../types";
import { ahora, bool, int, nuevoId } from "./comun";

type Fila = {
  id: string;
  nombre: string;
  precio_base: number;
  duracion_min: number;
  sena_tipo: "porcentaje" | "fijo";
  sena_valor: number;
  activo: number;
  creado_en: string;
};

const aServicio = (f: Fila): Servicio => ({
  id: f.id,
  nombre: f.nombre,
  precioBase: f.precio_base,
  duracionMin: f.duracion_min,
  senaTipo: f.sena_tipo,
  senaValor: f.sena_valor,
  activo: bool(f.activo),
});

export function listarServicios(soloActivos = false): Servicio[] {
  const sql = soloActivos
    ? `SELECT * FROM servicios WHERE activo = 1 ORDER BY nombre`
    : `SELECT * FROM servicios ORDER BY activo DESC, nombre`;
  return db().prepare<[], Fila>(sql).all().map(aServicio);
}

export function obtenerServicio(id: string): Servicio | null {
  const f = db().prepare<[string], Fila>(`SELECT * FROM servicios WHERE id = ?`).get(id);
  return f ? aServicio(f) : null;
}

export function crearServicio(datos: {
  nombre: string;
  precioBase: number;
  duracionMin: number;
  senaTipo: "porcentaje" | "fijo";
  senaValor: number;
}): Servicio {
  const id = nuevoId("srv");
  db()
    .prepare(
      `INSERT INTO servicios (id, nombre, precio_base, duracion_min, sena_tipo, sena_valor, activo, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    )
    .run(
      id,
      datos.nombre.trim(),
      Math.round(datos.precioBase),
      datos.duracionMin,
      datos.senaTipo,
      datos.senaValor,
      ahora(),
    );
  return obtenerServicio(id)!;
}

export function actualizarServicio(
  id: string,
  datos: Partial<Omit<Servicio, "id">>,
): void {
  const actual = obtenerServicio(id);
  if (!actual) throw new Error("Servicio inexistente");
  db()
    .prepare(
      `UPDATE servicios SET nombre = ?, precio_base = ?, duracion_min = ?, sena_tipo = ?, sena_valor = ?, activo = ?
       WHERE id = ?`,
    )
    .run(
      datos.nombre?.trim() ?? actual.nombre,
      Math.round(datos.precioBase ?? actual.precioBase),
      datos.duracionMin ?? actual.duracionMin,
      datos.senaTipo ?? actual.senaTipo,
      datos.senaValor ?? actual.senaValor,
      int(datos.activo ?? actual.activo),
      id,
    );
}

export function eliminarServicio(id: string): void {
  // Si ya tiene turnos no se borra, se desactiva, para no perder historial.
  const usos = db()
    .prepare<[string], { n: number }>(`SELECT COUNT(*) AS n FROM turnos WHERE servicio_id = ?`)
    .get(id);
  if ((usos?.n ?? 0) > 0) {
    db().prepare(`UPDATE servicios SET activo = 0 WHERE id = ?`).run(id);
    return;
  }
  db().prepare(`DELETE FROM servicios WHERE id = ?`).run(id);
}
