import { db } from "../db";
import { hashearPassword } from "../password";
import type { Rol, Usuario } from "../types";
import { ahora, bool, int, nuevoId } from "./comun";

type Fila = {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: Rol;
  ocupacion: string | null;
  telefono: string | null;
  color: string;
  activo: number;
  creado_en: string;
};

const aUsuario = (f: Fila): Usuario => ({
  id: f.id,
  nombre: f.nombre,
  email: f.email,
  rol: f.rol,
  ocupacion: f.ocupacion,
  telefono: f.telefono,
  color: f.color,
  activo: bool(f.activo),
  creadoEn: f.creado_en,
});

export function listarUsuarios(): Usuario[] {
  const filas = db()
    .prepare<[], Fila>(
      `SELECT * FROM usuarios ORDER BY CASE rol WHEN 'dueno' THEN 0 ELSE 1 END, nombre`,
    )
    .all();
  return filas.map(aUsuario);
}

export function listarProfesionales(soloActivos = true): Usuario[] {
  const sql = soloActivos
    ? `SELECT * FROM usuarios WHERE rol = 'profesional' AND activo = 1 ORDER BY nombre`
    : `SELECT * FROM usuarios WHERE rol = 'profesional' ORDER BY nombre`;
  return db().prepare<[], Fila>(sql).all().map(aUsuario);
}

export function obtenerUsuario(id: string): Usuario | null {
  const f = db().prepare<[string], Fila>(`SELECT * FROM usuarios WHERE id = ?`).get(id);
  return f ? aUsuario(f) : null;
}

export function obtenerUsuarioPorEmail(
  email: string,
): { usuario: Usuario; passwordHash: string } | null {
  const f = db()
    .prepare<[string], Fila>(`SELECT * FROM usuarios WHERE email = ?`)
    .get(email.trim().toLowerCase());
  return f ? { usuario: aUsuario(f), passwordHash: f.password_hash } : null;
}

export function crearUsuario(datos: {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  ocupacion?: string | null;
  telefono?: string | null;
  color?: string;
}): Usuario {
  const id = nuevoId("usr");
  db()
    .prepare(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, ocupacion, telefono, color, activo, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    )
    .run(
      id,
      datos.nombre.trim(),
      datos.email.trim().toLowerCase(),
      hashearPassword(datos.password),
      datos.rol,
      datos.ocupacion?.trim() || null,
      datos.telefono?.trim() || null,
      datos.color ?? colorSiguiente(),
      ahora(),
    );
  return obtenerUsuario(id)!;
}

export function actualizarUsuario(
  id: string,
  datos: {
    nombre?: string;
    email?: string;
    ocupacion?: string | null;
    telefono?: string | null;
    color?: string;
    activo?: boolean;
  },
): void {
  const actual = obtenerUsuario(id);
  if (!actual) throw new Error("Usuario inexistente");
  db()
    .prepare(
      `UPDATE usuarios SET nombre = ?, email = ?, ocupacion = ?, telefono = ?, color = ?, activo = ?
       WHERE id = ?`,
    )
    .run(
      datos.nombre?.trim() ?? actual.nombre,
      (datos.email ?? actual.email).trim().toLowerCase(),
      datos.ocupacion !== undefined ? datos.ocupacion?.trim() || null : actual.ocupacion,
      datos.telefono !== undefined ? datos.telefono?.trim() || null : actual.telefono,
      datos.color ?? actual.color,
      int(datos.activo ?? actual.activo),
      id,
    );
}

export function cambiarPassword(id: string, password: string): void {
  db()
    .prepare(`UPDATE usuarios SET password_hash = ? WHERE id = ?`)
    .run(hashearPassword(password), id);
}

export function eliminarUsuario(id: string): void {
  db().prepare(`DELETE FROM usuarios WHERE id = ? AND rol = 'profesional'`).run(id);
}

export function contarDuenosActivos(): number {
  const f = db()
    .prepare<[], { n: number }>(
      `SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'dueno' AND activo = 1`,
    )
    .get();
  return f?.n ?? 0;
}

const PALETA = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16"];

function colorSiguiente(): string {
  const f = db().prepare<[], { n: number }>(`SELECT COUNT(*) AS n FROM usuarios`).get();
  return PALETA[(f?.n ?? 0) % PALETA.length];
}

// ------------------------------------------- servicios que atiende cada profesional

export function serviciosDeProfesional(profesionalId: string): string[] {
  return db()
    .prepare<[string], { servicio_id: string }>(
      `SELECT servicio_id FROM profesional_servicios WHERE profesional_id = ?`,
    )
    .all(profesionalId)
    .map((f) => f.servicio_id);
}

export function definirServiciosDeProfesional(profesionalId: string, servicioIds: string[]): void {
  const conexion = db();
  const tx = conexion.transaction((ids: string[]) => {
    conexion.prepare(`DELETE FROM profesional_servicios WHERE profesional_id = ?`).run(profesionalId);
    const insertar = conexion.prepare(
      `INSERT OR IGNORE INTO profesional_servicios (profesional_id, servicio_id) VALUES (?, ?)`,
    );
    for (const id of ids) insertar.run(profesionalId, id);
  });
  tx(servicioIds);
}
