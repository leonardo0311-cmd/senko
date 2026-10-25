import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

/**
 * Unico punto donde se abre la base de datos.
 *
 * Para migrar a la base del bot (Postgres/Supabase/MySQL) solo hay que
 * reescribir este archivo y los modulos de `src/lib/repo/`. El resto de la app
 * trabaja contra los tipos de `src/lib/types.ts`, nunca contra SQL.
 */

const DB_PATH = process.env.SENKO_DB_PATH
  ? path.resolve(process.env.SENKO_DB_PATH)
  : path.join(process.cwd(), "data", "senko.db");

let instancia: Database.Database | null = null;

export function db(): Database.Database {
  if (instancia) return instancia;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  instancia = new Database(DB_PATH);
  instancia.pragma("journal_mode = WAL");
  instancia.pragma("foreign_keys = ON");
  migrar(instancia);
  return instancia;
}

export const ESQUEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('dueno', 'profesional')),
  ocupacion     TEXT,
  telefono      TEXT,
  color         TEXT NOT NULL DEFAULT '#6366f1',
  activo        INTEGER NOT NULL DEFAULT 1,
  creado_en     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
  id        TEXT PRIMARY KEY,
  nombre    TEXT NOT NULL,
  telefono  TEXT NOT NULL UNIQUE,
  email     TEXT,
  notas     TEXT,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS servicios (
  id          TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL,
  precio_base INTEGER NOT NULL,
  duracion_min INTEGER NOT NULL DEFAULT 60,
  sena_tipo   TEXT NOT NULL DEFAULT 'porcentaje' CHECK (sena_tipo IN ('porcentaje', 'fijo')),
  sena_valor  REAL NOT NULL DEFAULT 30,
  activo      INTEGER NOT NULL DEFAULT 1,
  creado_en   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profesional_servicios (
  profesional_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  servicio_id    TEXT NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  PRIMARY KEY (profesional_id, servicio_id)
);

CREATE TABLE IF NOT EXISTS metodos_pago (
  clave     TEXT PRIMARY KEY CHECK (clave IN ('efectivo', 'transferencia', 'credito', 'debito')),
  etiqueta  TEXT NOT NULL,
  ajuste_pct REAL NOT NULL DEFAULT 0,
  activo    INTEGER NOT NULL DEFAULT 1,
  orden     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS horarios (
  id             TEXT PRIMARY KEY,
  profesional_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  dia_semana     INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  desde          TEXT NOT NULL,
  hasta          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS turnos (
  id             TEXT PRIMARY KEY,
  cliente_id     TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  profesional_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  servicio_id    TEXT NOT NULL REFERENCES servicios(id),
  inicio         TEXT NOT NULL,
  fin            TEXT NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'confirmado', 'completado', 'cancelado', 'ausente')),
  origen         TEXT NOT NULL DEFAULT 'dashboard' CHECK (origen IN ('bot', 'dashboard')),
  precio_base    INTEGER NOT NULL,
  notas          TEXT,
  ref_externa    TEXT UNIQUE,
  creado_en      TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pagos (
  id           TEXT PRIMARY KEY,
  turno_id     TEXT REFERENCES turnos(id) ON DELETE SET NULL,
  cliente_id   TEXT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  metodo       TEXT NOT NULL REFERENCES metodos_pago(clave),
  tipo         TEXT NOT NULL CHECK (tipo IN ('sena', 'saldo', 'total')),
  monto_base   INTEGER NOT NULL,
  ajuste_pct   REAL NOT NULL DEFAULT 0,
  ajuste_monto INTEGER NOT NULL DEFAULT 0,
  monto_total  INTEGER NOT NULL,
  estado       TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'rechazado')),
  alias        TEXT,
  referencia   TEXT,
  pagado_en    TEXT,
  creado_en    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comentarios (
  id        TEXT PRIMARY KEY,
  turno_id  TEXT NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  autor_id  TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  texto     TEXT NOT NULL,
  tipo      TEXT NOT NULL DEFAULT 'nota' CHECK (tipo IN ('nota', 'demora', 'ausencia')),
  minutos   INTEGER,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id              TEXT PRIMARY KEY,
  destinatario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  autor_id        TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('demora', 'ausencia', 'comentario', 'sena')),
  titulo          TEXT NOT NULL,
  cuerpo          TEXT NOT NULL,
  turno_id        TEXT REFERENCES turnos(id) ON DELETE CASCADE,
  leida           INTEGER NOT NULL DEFAULT 0,
  avisada         INTEGER NOT NULL DEFAULT 0,
  creado_en       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comentarios_turno    ON comentarios(turno_id, creado_en);
CREATE INDEX IF NOT EXISTS idx_notif_destinatario   ON notificaciones(destinatario_id, leida, creado_en);
CREATE INDEX IF NOT EXISTS idx_notif_avisada        ON notificaciones(avisada, creado_en);
CREATE INDEX IF NOT EXISTS idx_turnos_inicio       ON turnos(inicio);
CREATE INDEX IF NOT EXISTS idx_turnos_profesional  ON turnos(profesional_id, inicio);
CREATE INDEX IF NOT EXISTS idx_turnos_cliente      ON turnos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente       ON pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_turno         ON pagos(turno_id);
CREATE INDEX IF NOT EXISTS idx_pagos_metodo_estado ON pagos(metodo, estado);
`;

function migrar(conexion: Database.Database) {
  conexion.exec(ESQUEMA);
  agregarColumnas(conexion);
}

/**
 * Columnas sumadas después de la primera versión. `CREATE TABLE IF NOT EXISTS`
 * no toca una tabla que ya existe, así que las bases viejas se completan acá.
 */
const COLUMNAS_NUEVAS: Array<{ tabla: string; columna: string; definicion: string }> = [
  { tabla: "usuarios", columna: "ocupacion", definicion: "TEXT" },
];

function agregarColumnas(conexion: Database.Database) {
  for (const { tabla, columna, definicion } of COLUMNAS_NUEVAS) {
    const existe = conexion
      .prepare<[], { name: string }>(`PRAGMA table_info(${tabla})`)
      .all()
      .some((f) => f.name === columna);
    if (!existe) {
      conexion.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
    }
  }
}
