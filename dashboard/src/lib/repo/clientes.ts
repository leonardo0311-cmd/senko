import { db } from "../db";
import type { Cliente } from "../types";
import { ahora, nuevoId } from "./comun";

type Fila = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  notas: string | null;
  creado_en: string;
};

const aCliente = (f: Fila): Cliente => ({
  id: f.id,
  nombre: f.nombre,
  telefono: f.telefono,
  email: f.email,
  notas: f.notas,
  creadoEn: f.creado_en,
});

export function listarClientes(): Cliente[] {
  return db()
    .prepare<[], Fila>(`SELECT * FROM clientes ORDER BY nombre`)
    .all()
    .map(aCliente);
}

export function obtenerCliente(id: string): Cliente | null {
  const f = db().prepare<[string], Fila>(`SELECT * FROM clientes WHERE id = ?`).get(id);
  return f ? aCliente(f) : null;
}

export function obtenerClientePorTelefono(telefono: string): Cliente | null {
  const f = db()
    .prepare<[string], Fila>(`SELECT * FROM clientes WHERE telefono = ?`)
    .get(normalizarTelefono(telefono));
  return f ? aCliente(f) : null;
}

export function crearCliente(datos: {
  nombre: string;
  telefono: string;
  email?: string | null;
  notas?: string | null;
}): Cliente {
  const id = nuevoId("cli");
  db()
    .prepare(
      `INSERT INTO clientes (id, nombre, telefono, email, notas, creado_en) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      datos.nombre.trim(),
      normalizarTelefono(datos.telefono),
      datos.email?.trim() || null,
      datos.notas?.trim() || null,
      ahora(),
    );
  return obtenerCliente(id)!;
}

/** Busca por telefono de WhatsApp y si no existe lo crea. Lo usa el bot. */
export function obtenerOCrearCliente(telefono: string, nombre: string): Cliente {
  const existente = obtenerClientePorTelefono(telefono);
  if (existente) return existente;
  return crearCliente({ nombre, telefono });
}

export function actualizarCliente(
  id: string,
  datos: { nombre?: string; telefono?: string; email?: string | null; notas?: string | null },
): void {
  const actual = obtenerCliente(id);
  if (!actual) throw new Error("Cliente inexistente");
  db()
    .prepare(`UPDATE clientes SET nombre = ?, telefono = ?, email = ?, notas = ? WHERE id = ?`)
    .run(
      datos.nombre?.trim() ?? actual.nombre,
      datos.telefono ? normalizarTelefono(datos.telefono) : actual.telefono,
      datos.email !== undefined ? datos.email?.trim() || null : actual.email,
      datos.notas !== undefined ? datos.notas?.trim() || null : actual.notas,
      id,
    );
}

export function eliminarCliente(id: string): void {
  db().prepare(`DELETE FROM clientes WHERE id = ?`).run(id);
}

/** Deja solo digitos y el + inicial, para que el bot y la dashboard coincidan. */
export function normalizarTelefono(telefono: string): string {
  const limpio = telefono.trim().replace(/[^\d+]/g, "");
  return limpio.startsWith("+") ? `+${limpio.slice(1).replace(/\+/g, "")}` : limpio;
}
