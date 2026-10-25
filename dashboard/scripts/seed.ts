/**
 * Carga la base con datos de ejemplo para poder ver la dashboard funcionando.
 *
 *   npm run db:seed    -> crea/completa la base
 *   npm run db:reset   -> borra data/senko.db y la vuelve a crear
 */
import "./cargar-env";

import { db } from "../src/lib/db";
import { hashearPassword } from "../src/lib/password";
import { calcularSena, calcularCobro } from "../src/lib/precios";
import type { MetodoPagoClave } from "../src/lib/types";

const conexion = db();

function id(prefijo: string, n: number) {
  return `${prefijo}_seed${String(n).padStart(4, "0")}`;
}
const ahora = new Date();
const iso = (d: Date) => d.toISOString();

function diaRelativo(dias: number, hora: number, minutos = 0): Date {
  const d = new Date(ahora);
  d.setDate(d.getDate() + dias);
  d.setHours(hora, minutos, 0, 0);
  return d;
}

// ------------------------------------------------------------ metodos de pago
// Estos son los porcentajes que pidio el dueño: recargo en tarjeta,
// descuento en efectivo y transferencia por alias.
const METODOS: Array<[MetodoPagoClave, string, number, number]> = [
  ["efectivo", "Efectivo", -10, 1],
  ["transferencia", "Transferencia / alias", -10, 2],
  ["debito", "Tarjeta de débito", 5, 3],
  ["credito", "Tarjeta de crédito", 15, 4],
];

for (const [clave, etiqueta, ajuste, orden] of METODOS) {
  conexion
    .prepare(
      `INSERT INTO metodos_pago (clave, etiqueta, ajuste_pct, activo, orden) VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(clave) DO UPDATE SET etiqueta = excluded.etiqueta, orden = excluded.orden`,
    )
    .run(clave, etiqueta, ajuste, orden);
}

const ajustePorMetodo = new Map(
  conexion
    .prepare<[], { clave: MetodoPagoClave; ajuste_pct: number }>(
      `SELECT clave, ajuste_pct FROM metodos_pago`,
    )
    .all()
    .map((f) => [f.clave, f.ajuste_pct] as const),
);

// -------------------------------------------------------------------- ajustes
const AJUSTES: Array<[string, string]> = [
  ["negocio_nombre", "Estudio Senko"],
  ["transferencia_alias", "estudio.senko.mp"],
  ["transferencia_cbu", "0000003100098765432109"],
  ["transferencia_titular", "Estudio Senko SRL"],
  ["sena_horas_vencimiento", "24"],
];
for (const [clave, valor] of AJUSTES) {
  conexion
    .prepare(
      `INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO NOTHING`,
    )
    .run(clave, valor);
}

// ------------------------------------------------------------------- usuarios
const USUARIOS = [
  { id: id("usr", 1), nombre: "Leonardo (dueño)", email: "dueno@senko.app", rol: "dueno", ocupacion: "Dueño del estudio", color: "#6366f1", tel: "+5491122334455" },
  { id: id("usr", 2), nombre: "Camila Ruiz", email: "camila@senko.app", rol: "profesional", ocupacion: "Colorista", color: "#ec4899", tel: "+5491133445566" },
  { id: id("usr", 3), nombre: "Nicolás Vera", email: "nicolas@senko.app", rol: "profesional", ocupacion: "Peluquero", color: "#14b8a6", tel: "+5491144556677" },
  { id: id("usr", 4), nombre: "Sofía Peralta", email: "sofia@senko.app", rol: "profesional", ocupacion: "Manicura", color: "#f59e0b", tel: "+5491155667788" },
] as const;

for (const u of USUARIOS) {
  conexion
    .prepare(
      `INSERT INTO usuarios (id, nombre, email, password_hash, rol, ocupacion, telefono, color, activo, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON CONFLICT(id) DO NOTHING`,
    )
    .run(u.id, u.nombre, u.email, hashearPassword("senko1234"), u.rol, u.ocupacion, u.tel, u.color, iso(ahora));
}

// ------------------------------------------------------------------ servicios
const SERVICIOS = [
  { id: id("srv", 1), nombre: "Corte y peinado", precio: 1800000, min: 45, senaTipo: "porcentaje", senaValor: 30 },
  { id: id("srv", 2), nombre: "Coloración completa", precio: 5500000, min: 120, senaTipo: "porcentaje", senaValor: 40 },
  { id: id("srv", 3), nombre: "Tratamiento de keratina", precio: 4200000, min: 90, senaTipo: "porcentaje", senaValor: 30 },
  { id: id("srv", 4), nombre: "Manicura semipermanente", precio: 1200000, min: 60, senaTipo: "fijo", senaValor: 400000 },
  { id: id("srv", 5), nombre: "Consulta de asesoría", precio: 900000, min: 30, senaTipo: "porcentaje", senaValor: 50 },
] as const;

for (const s of SERVICIOS) {
  conexion
    .prepare(
      `INSERT INTO servicios (id, nombre, precio_base, duracion_min, sena_tipo, sena_valor, activo, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?) ON CONFLICT(id) DO NOTHING`,
    )
    .run(s.id, s.nombre, s.precio, s.min, s.senaTipo, s.senaValor, iso(ahora));
}

// Que servicio atiende cada profesional
const ASIGNACIONES: Array<[string, string[]]> = [
  [USUARIOS[1].id, [SERVICIOS[0].id, SERVICIOS[1].id, SERVICIOS[2].id]],
  [USUARIOS[2].id, [SERVICIOS[0].id, SERVICIOS[2].id, SERVICIOS[4].id]],
  [USUARIOS[3].id, [SERVICIOS[3].id, SERVICIOS[0].id, SERVICIOS[4].id]],
];
for (const [prof, servicios] of ASIGNACIONES) {
  for (const srv of servicios) {
    conexion
      .prepare(
        `INSERT OR IGNORE INTO profesional_servicios (profesional_id, servicio_id) VALUES (?, ?)`,
      )
      .run(prof, srv);
  }
}

// Cada profesional con su propia semana laboral.
const HORARIOS: Record<string, Array<[number, string, string]>> = {
  [USUARIOS[1].id]: [
    [1, "09:00", "18:00"], [2, "09:00", "18:00"], [3, "09:00", "18:00"],
    [4, "09:00", "18:00"], [5, "09:00", "18:00"], [6, "09:00", "13:00"],
  ],
  [USUARIOS[2].id]: [
    [2, "10:00", "19:00"], [3, "10:00", "19:00"], [4, "10:00", "19:00"],
    [5, "10:00", "19:00"], [6, "09:00", "14:00"],
  ],
  [USUARIOS[3].id]: [
    [1, "11:00", "20:00"], [3, "11:00", "20:00"], [5, "11:00", "20:00"],
    [6, "10:00", "15:00"],
  ],
};

for (const [prof] of ASIGNACIONES) {
  const tramos = HORARIOS[prof] ?? [];
  for (const [dia, desde, hasta] of tramos) {
    conexion
      .prepare(
        `INSERT OR IGNORE INTO horarios (id, profesional_id, dia_semana, desde, hasta) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(`hor_${prof}_${dia}`, prof, dia, desde, hasta);
  }
}

// ------------------------------------------------------------------- clientes
const CLIENTES = [
  { id: id("cli", 1), nombre: "Martina Gómez", tel: "+5491166778899", notas: "Prefiere turnos a la mañana." },
  { id: id("cli", 2), nombre: "Julián Castro", tel: "+5491177889900", notas: null },
  { id: id("cli", 3), nombre: "Agustina Ríos", tel: "+5491188990011", notas: "Siempre paga por transferencia." },
  { id: id("cli", 4), nombre: "Federico Lamas", tel: "+5491199001122", notas: null },
  { id: id("cli", 5), nombre: "Valentina Sosa", tel: "+5491100112233", notas: "Cliente nueva, vino por Instagram." },
  { id: id("cli", 6), nombre: "Tomás Herrera", tel: "+5491111223344", notas: null },
  { id: id("cli", 7), nombre: "Lucía Benítez", tel: "+5491122334466", notas: "Pide siempre con Camila." },
  { id: id("cli", 8), nombre: "Bruno Acosta", tel: "+5491133445577", notas: null },
] as const;

for (const c of CLIENTES) {
  conexion
    .prepare(
      `INSERT INTO clientes (id, nombre, telefono, email, notas, creado_en)
       VALUES (?, ?, ?, NULL, ?, ?) ON CONFLICT(id) DO NOTHING`,
    )
    .run(c.id, c.nombre, c.tel, c.notas, iso(ahora));
}

// --------------------------------------------------------- turnos y pagos
type Plan = {
  cliente: number;
  prof: number;
  srv: number;
  dias: number;
  hora: number;
  estado: "pendiente" | "confirmado" | "completado" | "cancelado" | "ausente";
  origen: "bot" | "dashboard";
  /** metodo de la seña, o null si todavia no señó */
  sena: MetodoPagoClave | null;
  senaPendiente?: boolean;
  /** metodo con el que pago el saldo, o null si debe saldo */
  saldo: MetodoPagoClave | null;
};

const PLAN: Plan[] = [
  // --- pasado: turnos completados, con seña + saldo pagos
  { cliente: 0, prof: 1, srv: 1, dias: -18, hora: 10, estado: "completado", origen: "bot", sena: "transferencia", saldo: "efectivo" },
  { cliente: 1, prof: 2, srv: 0, dias: -16, hora: 15, estado: "completado", origen: "bot", sena: "efectivo", saldo: "credito" },
  { cliente: 2, prof: 1, srv: 2, dias: -15, hora: 11, estado: "completado", origen: "bot", sena: "transferencia", saldo: "transferencia" },
  { cliente: 3, prof: 3, srv: 3, dias: -14, hora: 16, estado: "completado", origen: "dashboard", sena: "debito", saldo: "debito" },
  { cliente: 4, prof: 2, srv: 4, dias: -12, hora: 9, estado: "completado", origen: "bot", sena: "efectivo", saldo: "efectivo" },
  { cliente: 0, prof: 1, srv: 0, dias: -11, hora: 12, estado: "completado", origen: "bot", sena: "transferencia", saldo: "credito" },
  { cliente: 5, prof: 3, srv: 3, dias: -10, hora: 10, estado: "completado", origen: "dashboard", sena: "credito", saldo: "credito" },
  { cliente: 6, prof: 1, srv: 1, dias: -9, hora: 14, estado: "completado", origen: "bot", sena: "transferencia", saldo: "transferencia" },
  { cliente: 2, prof: 1, srv: 0, dias: -8, hora: 11, estado: "completado", origen: "bot", sena: "transferencia", saldo: "efectivo" },
  { cliente: 7, prof: 2, srv: 4, dias: -7, hora: 17, estado: "completado", origen: "bot", sena: "efectivo", saldo: "debito" },
  { cliente: 1, prof: 2, srv: 2, dias: -6, hora: 9, estado: "completado", origen: "dashboard", sena: "debito", saldo: "credito" },
  { cliente: 3, prof: 3, srv: 0, dias: -5, hora: 13, estado: "ausente", origen: "bot", sena: "transferencia", saldo: null },
  { cliente: 4, prof: 1, srv: 1, dias: -4, hora: 10, estado: "completado", origen: "bot", sena: "credito", saldo: "credito" },
  { cliente: 5, prof: 2, srv: 0, dias: -3, hora: 16, estado: "completado", origen: "bot", sena: "efectivo", saldo: "efectivo" },
  { cliente: 6, prof: 3, srv: 3, dias: -2, hora: 11, estado: "completado", origen: "dashboard", sena: "transferencia", saldo: "transferencia" },
  { cliente: 0, prof: 1, srv: 2, dias: -1, hora: 15, estado: "completado", origen: "bot", sena: "transferencia", saldo: "debito" },
  { cliente: 7, prof: 2, srv: 4, dias: -1, hora: 10, estado: "cancelado", origen: "bot", sena: null, saldo: null },

  // --- hoy
  { cliente: 1, prof: 1, srv: 0, dias: 0, hora: 9, estado: "completado", origen: "bot", sena: "transferencia", saldo: "efectivo" },
  { cliente: 2, prof: 2, srv: 4, dias: 0, hora: 11, estado: "confirmado", origen: "bot", sena: "transferencia", saldo: null },
  { cliente: 3, prof: 3, srv: 3, dias: 0, hora: 12, estado: "confirmado", origen: "bot", sena: "efectivo", saldo: null },
  { cliente: 4, prof: 1, srv: 1, dias: 0, hora: 14, estado: "confirmado", origen: "dashboard", sena: "credito", saldo: null },
  { cliente: 5, prof: 2, srv: 0, dias: 0, hora: 16, estado: "pendiente", origen: "bot", sena: null, senaPendiente: true, saldo: null },
  // Dos profesionales atendiendo a la misma hora: la grilla los pone lado a lado.
  { cliente: 6, prof: 3, srv: 0, dias: 0, hora: 9, estado: "confirmado", origen: "bot", sena: "transferencia", saldo: null },
  { cliente: 7, prof: 2, srv: 4, dias: 0, hora: 9, estado: "confirmado", origen: "bot", sena: "efectivo", saldo: null },

  // --- proximos dias
  { cliente: 6, prof: 1, srv: 2, dias: 1, hora: 10, estado: "confirmado", origen: "bot", sena: "transferencia", saldo: null },
  { cliente: 7, prof: 3, srv: 0, dias: 1, hora: 12, estado: "confirmado", origen: "bot", sena: "debito", saldo: null },
  { cliente: 4, prof: 2, srv: 0, dias: 1, hora: 12, estado: "confirmado", origen: "bot", sena: "transferencia", saldo: null },
  { cliente: 0, prof: 2, srv: 4, dias: 1, hora: 15, estado: "pendiente", origen: "bot", sena: null, senaPendiente: true, saldo: null },
  { cliente: 1, prof: 1, srv: 0, dias: 2, hora: 9, estado: "confirmado", origen: "bot", sena: "efectivo", saldo: null },
  { cliente: 2, prof: 3, srv: 3, dias: 2, hora: 11, estado: "confirmado", origen: "dashboard", sena: "transferencia", saldo: null },
  { cliente: 3, prof: 2, srv: 1, dias: 2, hora: 16, estado: "pendiente", origen: "bot", sena: null, senaPendiente: true, saldo: null },
  { cliente: 4, prof: 1, srv: 2, dias: 3, hora: 10, estado: "confirmado", origen: "bot", sena: "credito", saldo: null },
  { cliente: 5, prof: 3, srv: 4, dias: 3, hora: 14, estado: "confirmado", origen: "bot", sena: "transferencia", saldo: null },
  { cliente: 6, prof: 2, srv: 0, dias: 4, hora: 11, estado: "pendiente", origen: "bot", sena: null, saldo: null },
  { cliente: 7, prof: 1, srv: 1, dias: 4, hora: 15, estado: "confirmado", origen: "bot", sena: "transferencia", saldo: null },
  { cliente: 0, prof: 3, srv: 0, dias: 5, hora: 10, estado: "confirmado", origen: "dashboard", sena: "efectivo", saldo: null },
  { cliente: 1, prof: 2, srv: 2, dias: 6, hora: 12, estado: "pendiente", origen: "bot", sena: null, senaPendiente: true, saldo: null },
];

const insertarTurno = conexion.prepare(
  `INSERT INTO turnos (id, cliente_id, profesional_id, servicio_id, inicio, fin, estado, origen,
                       precio_base, notas, ref_externa, creado_en, actualizado_en)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
);
const insertarPago = conexion.prepare(
  `INSERT INTO pagos (id, turno_id, cliente_id, metodo, tipo, monto_base, ajuste_pct, ajuste_monto,
                      monto_total, estado, alias, referencia, pagado_en, creado_en)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
);

const aliasNegocio = "estudio.senko.mp";
let nPago = 0;

const cargar = conexion.transaction(() => {
  PLAN.forEach((p, i) => {
    const cliente = CLIENTES[p.cliente];
    const prof = USUARIOS[p.prof];
    const srv = SERVICIOS[p.srv];
    const inicio = diaRelativo(p.dias, p.hora);
    const fin = new Date(inicio.getTime() + srv.min * 60_000);
    const turnoId = id("trn", i + 1);

    insertarTurno.run(
      turnoId,
      cliente.id,
      prof.id,
      srv.id,
      iso(inicio),
      iso(fin),
      p.estado,
      p.origen,
      srv.precio,
      p.origen === "bot" ? "Reservado por WhatsApp" : null,
      p.origen === "bot" ? `wa-${turnoId}` : null,
      iso(diaRelativo(p.dias - 3, 12)),
      iso(ahora),
    );

    const senaBase = calcularSena({
      precioBase: srv.precio,
      senaTipo: srv.senaTipo,
      senaValor: srv.senaValor,
    });

    // Seña
    if (p.sena || p.senaPendiente) {
      const metodo: MetodoPagoClave = p.sena ?? "transferencia";
      const cobro = calcularCobro(senaBase, ajustePorMetodo.get(metodo) ?? 0);
      const estadoPago = p.senaPendiente ? "pendiente" : "confirmado";
      nPago += 1;
      insertarPago.run(
        id("pag", nPago),
        turnoId,
        cliente.id,
        metodo,
        "sena",
        cobro.base,
        cobro.ajustePct,
        cobro.ajusteMonto,
        cobro.total,
        estadoPago,
        metodo === "transferencia" ? aliasNegocio : null,
        metodo === "transferencia" ? `TRF-${1000 + nPago}` : null,
        estadoPago === "confirmado" ? iso(diaRelativo(p.dias - 2, 11)) : null,
        iso(diaRelativo(p.dias - 2, 11)),
      );
    }

    // Saldo
    if (p.saldo) {
      const restante = srv.precio - senaBase;
      if (restante > 0) {
        const cobro = calcularCobro(restante, ajustePorMetodo.get(p.saldo) ?? 0);
        nPago += 1;
        insertarPago.run(
          id("pag", nPago),
          turnoId,
          cliente.id,
          p.saldo,
          "saldo",
          cobro.base,
          cobro.ajustePct,
          cobro.ajusteMonto,
          cobro.total,
          "confirmado",
          p.saldo === "transferencia" ? aliasNegocio : null,
          p.saldo === "transferencia" ? `TRF-${1000 + nPago}` : null,
          iso(new Date(fin.getTime() + 15 * 60_000)),
          iso(fin),
        );
      }
    }
  });
});

cargar();

// ------------------------------------------------- comentarios y avisos
// Un par de ejemplos para que el dueño vea cómo le llegan los avisos.

const insertarComentario = conexion.prepare(
  `INSERT INTO comentarios (id, turno_id, autor_id, texto, tipo, minutos, creado_en)
   VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
);
const insertarNotif = conexion.prepare(
  `INSERT INTO notificaciones (id, destinatario_id, autor_id, tipo, titulo, cuerpo, turno_id, leida, avisada, creado_en)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?) ON CONFLICT(id) DO NOTHING`,
);

/** Primer turno de hoy de un profesional, para colgarle los ejemplos. */
function turnoDeHoy(profesionalId: string): { id: string; cliente: string; inicio: string } | null {
  const inicioDia = diaRelativo(0, 0);
  const finDia = diaRelativo(1, 0);
  const f = conexion
    .prepare(
      `SELECT t.id, t.inicio, c.nombre AS cliente
         FROM turnos t JOIN clientes c ON c.id = t.cliente_id
        WHERE t.profesional_id = ? AND t.inicio >= ? AND t.inicio < ?
        ORDER BY t.inicio LIMIT 1`,
    )
    .get(profesionalId, iso(inicioDia), iso(finDia)) as
    | { id: string; inicio: string; cliente: string }
    | undefined;
  return f ? { id: f.id, cliente: f.cliente, inicio: f.inicio } : null;
}

const horaDe = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

const EJEMPLOS: Array<{
  prof: (typeof USUARIOS)[number];
  tipo: "demora" | "nota";
  texto: string;
  minutos: number | null;
  leida: boolean;
}> = [
  { prof: USUARIOS[1], tipo: "demora", texto: "Se retrasa 20 min. Avisó por WhatsApp que está en camino.", minutos: 20, leida: false },
  { prof: USUARIOS[2], tipo: "nota", texto: "Pidió cambiar a un tono más claro. Puede llevar media hora más.", minutos: null, leida: false },
  { prof: USUARIOS[3], tipo: "nota", texto: "Trajo su propio esmalte.", minutos: null, leida: true },
];

let nEjemplo = 0;
for (const ej of EJEMPLOS) {
  const turno = turnoDeHoy(ej.prof.id);
  if (!turno) continue;
  nEjemplo += 1;

  const cuando = iso(new Date(new Date(turno.inicio).getTime() - 30 * 60_000));

  insertarComentario.run(
    id("cmt", nEjemplo), turno.id, ej.prof.id, ej.texto, ej.tipo, ej.minutos, cuando,
  );

  insertarNotif.run(
    id("ntf", nEjemplo),
    USUARIOS[0].id,
    ej.prof.id,
    ej.tipo === "demora" ? "demora" : "comentario",
    ej.tipo === "demora"
      ? `${turno.cliente} se retrasa ${ej.minutos} min`
      : `${ej.prof.nombre} comentó un turno`,
    ej.tipo === "demora"
      ? `Turno de las ${horaDe(turno.inicio)} con ${ej.prof.nombre}.`
      : `${turno.cliente} · ${horaDe(turno.inicio)} — ${ej.texto}`,
    turno.id,
    ej.leida ? 1 : 0,
    cuando,
  );
}

const conteo = (tabla: string) =>
  (conexion.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get() as { n: number }).n;

console.log("Base cargada:");
console.log(`  usuarios  ${conteo("usuarios")}`);
console.log(`  clientes  ${conteo("clientes")}`);
console.log(`  servicios ${conteo("servicios")}`);
console.log(`  turnos    ${conteo("turnos")}`);
console.log(`  pagos     ${conteo("pagos")}`);
console.log(`  comentarios ${conteo("comentarios")}`);
console.log(`  avisos      ${conteo("notificaciones")}`);
console.log("");
console.log("Entrar con:");
console.log("  dueño        dueno@senko.app   / senko1234");
console.log("  profesional  camila@senko.app  / senko1234");
