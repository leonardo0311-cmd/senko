"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirDueno, exigirSesion } from "@/lib/auth";
import { aCentavos } from "@/lib/dinero";
import { fechaYHora, hora } from "@/lib/fechas";
import { calcularSena } from "@/lib/precios";
import { obtenerOCrearCliente } from "@/lib/repo/clientes";
import { avisarADuenos, crearComentario } from "@/lib/repo/avisos";
import { obtenerAjuste } from "@/lib/repo/config";
import { registrarPago } from "@/lib/repo/pagos";
import { obtenerServicio } from "@/lib/repo/servicios";
import {
  ConflictoHorario,
  actualizarTurno,
  cambiarEstadoTurno,
  eliminarTurno,
  hayDisponibilidad,
  obtenerTurno,
} from "@/lib/repo/turnos";
import { crearTurno } from "@/lib/repo/turnos";
import type { EstadoTurno, MetodoPagoClave, TipoPago } from "@/lib/types";

type Resultado = { error?: string; ok?: string };

function refrescar() {
  revalidatePath("/calendario");
  revalidatePath("/senas");
  revalidatePath("/pagos");
  revalidatePath("/clientes");
  revalidatePath("/");
}

const esquemaNuevo = z.object({
  clienteNombre: z.string().trim().min(2, "Poné el nombre del cliente."),
  clienteTelefono: z.string().trim().min(6, "Poné el WhatsApp del cliente."),
  profesionalId: z.string().trim().min(1, "Elegí el profesional."),
  servicioId: z.string().trim().min(1, "Elegí el servicio."),
  inicio: z.string().trim().min(1, "Elegí día y hora."),
  estado: z.enum(["pendiente", "confirmado", "completado", "cancelado", "ausente"]),
  notas: z.string().trim().optional(),
});

export async function accionCrearTurno(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();

  const parseado = esquemaNuevo.safeParse({
    clienteNombre: datos.get("clienteNombre") ?? "",
    clienteTelefono: datos.get("clienteTelefono") ?? "",
    profesionalId: datos.get("profesionalId") ?? "",
    servicioId: datos.get("servicioId") ?? "",
    inicio: datos.get("inicio") ?? "",
    estado: (datos.get("estado") as string) || "confirmado",
    notas: datos.get("notas") ?? "",
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Revisá los datos del turno." };
  }
  const d = parseado.data;

  const profesionalId = d.profesionalId;

  const servicio = obtenerServicio(d.servicioId);
  if (!servicio) return { error: "Ese servicio no existe." };

  const inicio = new Date(d.inicio);
  if (Number.isNaN(inicio.getTime())) return { error: "La fecha y hora no son válidas." };
  const fin = new Date(inicio.getTime() + servicio.duracionMin * 60_000);

  // Se chequea el horario antes de tocar la tabla de clientes, así un intento
  // fallido no deja un cliente creado a medias.
  if (!hayDisponibilidad(profesionalId, inicio.toISOString(), fin.toISOString())) {
    return { error: "Ese horario ya está ocupado para ese profesional." };
  }

  try {
    const cliente = obtenerOCrearCliente(d.clienteTelefono, d.clienteNombre);
    crearTurno({
      clienteId: cliente.id,
      profesionalId,
      servicioId: servicio.id,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      precioBase: servicio.precioBase,
      estado: d.estado as EstadoTurno,
      origen: "dashboard",
      notas: d.notas || null,
    });
    refrescar();
    return { ok: `Turno creado para ${cliente.nombre}.` };
  } catch (error) {
    if (error instanceof ConflictoHorario) return { error: error.message };
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { error: "Ese teléfono ya está registrado con otro nombre." };
    }
    return { error: "No se pudo crear el turno." };
  }
}

export async function accionEditarTurno(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();
  const turnoId = String(datos.get("turnoId") ?? "");
  const turno = obtenerTurno(turnoId);
  if (!turno) return { error: "Ese turno no existe." };

  const inicioTexto = String(datos.get("inicio") ?? "");
  const servicioId = String(datos.get("servicioId") ?? turno.servicioId);
  const profesionalId = String(datos.get("profesionalId") ?? turno.profesionalId);

  const servicio = obtenerServicio(servicioId);
  if (!servicio) return { error: "Ese servicio no existe." };

  const inicio = inicioTexto ? new Date(inicioTexto) : new Date(turno.inicio);
  if (Number.isNaN(inicio.getTime())) return { error: "La fecha y hora no son válidas." };
  const fin = new Date(inicio.getTime() + servicio.duracionMin * 60_000);

  try {
    actualizarTurno(turnoId, {
      profesionalId,
      servicioId,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      notas: String(datos.get("notas") ?? "") || null,
    });
    refrescar();
    return { ok: "Turno actualizado." };
  } catch (error) {
    if (error instanceof ConflictoHorario) return { error: error.message };
    return { error: "No se pudo actualizar el turno." };
  }
}

export async function accionCambiarEstado(datos: FormData): Promise<void> {
  await exigirDueno();
  const turnoId = String(datos.get("turnoId") ?? "");
  const estado = String(datos.get("estado") ?? "") as EstadoTurno;
  const turno = obtenerTurno(turnoId);
  if (!turno) return;
  if (!["pendiente", "confirmado", "completado", "cancelado", "ausente"].includes(estado)) return;

  cambiarEstadoTurno(turnoId, estado);
  refrescar();
}

export async function accionEliminarTurno(datos: FormData): Promise<void> {
  await exigirDueno();
  eliminarTurno(String(datos.get("turnoId") ?? ""));
  refrescar();
}

const esquemaPago = z.object({
  turnoId: z.string().trim().min(1),
  metodo: z.enum(["efectivo", "transferencia", "credito", "debito"]),
  tipo: z.enum(["sena", "saldo", "total"]),
  monto: z.string().trim().min(1, "Poné el monto."),
  estado: z.enum(["pendiente", "confirmado"]),
  referencia: z.string().trim().optional(),
});

/**
 * Registra un pago contra un turno. El monto que se ingresa es a PRECIO
 * GENERAL; el recargo o descuento del metodo lo calcula el motor de precios.
 */
export async function accionRegistrarPago(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();

  const parseado = esquemaPago.safeParse({
    turnoId: datos.get("turnoId") ?? "",
    metodo: datos.get("metodo") ?? "",
    tipo: datos.get("tipo") ?? "",
    monto: datos.get("monto") ?? "",
    estado: (datos.get("estado") as string) || "confirmado",
    referencia: datos.get("referencia") ?? "",
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Revisá los datos del pago." };
  }
  const d = parseado.data;

  const turno = obtenerTurno(d.turnoId);
  if (!turno) return { error: "Ese turno no existe." };

  const montoBase = aCentavos(d.monto);
  if (montoBase <= 0) return { error: "El monto tiene que ser mayor a cero." };

  const restante = turno.precioBase - turno.pagado;
  if (montoBase > restante) {
    return {
      error: `Ese monto supera lo que falta del turno. A precio general quedan ${
        restante <= 0 ? "$ 0" : `$ ${Math.round(restante / 100).toLocaleString("es-AR")}`
      }.`,
    };
  }

  registrarPago({
    clienteId: turno.clienteId,
    turnoId: turno.id,
    metodo: d.metodo as MetodoPagoClave,
    tipo: d.tipo as TipoPago,
    montoBase,
    estado: d.estado,
    alias: d.metodo === "transferencia" ? obtenerAjuste("transferencia_alias") : null,
    referencia: d.referencia || null,
  });

  refrescar();
  return { ok: "Pago registrado." };
}

/** Atajo: registra la seña completa que corresponde al servicio del turno. */
export async function accionSenaSugerida(datos: FormData): Promise<void> {
  await exigirDueno();
  const turnoId = String(datos.get("turnoId") ?? "");
  const metodo = String(datos.get("metodo") ?? "transferencia") as MetodoPagoClave;

  const turno = obtenerTurno(turnoId);
  if (!turno) return;

  const servicio = obtenerServicio(turno.servicioId);
  if (!servicio) return;

  const sena = calcularSena(servicio);
  const restante = turno.precioBase - turno.pagado;
  const montoBase = Math.min(sena, restante);
  if (montoBase <= 0) return;

  registrarPago({
    clienteId: turno.clienteId,
    turnoId: turno.id,
    metodo,
    tipo: "sena",
    montoBase,
    estado: "confirmado",
    alias: metodo === "transferencia" ? obtenerAjuste("transferencia_alias") : null,
  });
  refrescar();
}

// ------------------------------------------------- comentarios y avisos

const esquemaComentario = z.object({
  turnoId: z.string().trim().min(1),
  texto: z.string().trim().min(2, "Escribí el comentario.").max(600, "El comentario es muy largo."),
});

/** Puede comentar el dueño, y el profesional en sus propios turnos. */
async function permisoSobreTurno(turnoId: string) {
  const usuario = await exigirSesion();
  const turno = obtenerTurno(turnoId);
  if (!turno) return { error: "Ese turno no existe." } as const;
  if (usuario.rol !== "dueno" && turno.profesionalId !== usuario.id) {
    return { error: "Solo podés comentar tus propios turnos." } as const;
  }
  return { usuario, turno } as const;
}

export async function accionComentar(_previo: unknown, datos: FormData): Promise<Resultado> {
  const parseado = esquemaComentario.safeParse({
    turnoId: datos.get("turnoId") ?? "",
    texto: datos.get("texto") ?? "",
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Revisá el comentario." };
  }

  const permiso = await permisoSobreTurno(parseado.data.turnoId);
  if ("error" in permiso) return permiso;
  const { usuario, turno } = permiso;

  crearComentario({
    turnoId: turno.id,
    autorId: usuario.id,
    texto: parseado.data.texto,
    tipo: "nota",
  });

  // El dueño no se avisa a sí mismo.
  if (usuario.rol !== "dueno") {
    avisarADuenos({
      autorId: usuario.id,
      tipo: "comentario",
      titulo: `${usuario.nombre} comentó un turno`,
      cuerpo: `${turno.clienteNombre} · ${fechaYHora(turno.inicio)} — ${parseado.data.texto}`,
      turnoId: turno.id,
    });
  }

  refrescar();
  revalidatePath("/notificaciones");
  return { ok: "Comentario agregado." };
}

const esquemaDemora = z.object({
  turnoId: z.string().trim().min(1),
  minutos: z.coerce.number().int().min(5, "Mínimo 5 minutos.").max(480, "Máximo 8 horas."),
  nota: z.string().trim().max(400).optional(),
});

/**
 * El profesional avisa que el cliente se retrasa. Queda como comentario en el
 * turno y le entra al dueño como notificación.
 */
export async function accionAvisarDemora(_previo: unknown, datos: FormData): Promise<Resultado> {
  const parseado = esquemaDemora.safeParse({
    turnoId: datos.get("turnoId") ?? "",
    minutos: datos.get("minutos") ?? "",
    nota: datos.get("nota") ?? "",
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Revisá los datos de la demora." };
  }

  const permiso = await permisoSobreTurno(parseado.data.turnoId);
  if ("error" in permiso) return permiso;
  const { usuario, turno } = permiso;

  const { minutos, nota } = parseado.data;
  const texto = nota
    ? `Se retrasa ${minutos} min. ${nota}`
    : `Se retrasa ${minutos} min.`;

  crearComentario({
    turnoId: turno.id,
    autorId: usuario.id,
    texto,
    tipo: "demora",
    minutos,
  });

  avisarADuenos({
    autorId: usuario.id,
    tipo: "demora",
    titulo: `${turno.clienteNombre} se retrasa ${minutos} min`,
    cuerpo: `${turno.servicioNombre} de las ${hora(turno.inicio)} con ${turno.profesionalNombre}.${
      nota ? ` ${nota}` : ""
    }`,
    turnoId: turno.id,
  });

  refrescar();
  revalidatePath("/notificaciones");
  return { ok: `Aviso enviado: el cliente se retrasa ${minutos} minutos.` };
}

/** El profesional avisa que el cliente no apareció. */
export async function accionAvisarAusencia(_previo: unknown, datos: FormData): Promise<Resultado> {
  const turnoId = String(datos.get("turnoId") ?? "");
  const nota = String(datos.get("nota") ?? "").trim().slice(0, 400);

  const permiso = await permisoSobreTurno(turnoId);
  if ("error" in permiso) return permiso;
  const { usuario, turno } = permiso;

  crearComentario({
    turnoId: turno.id,
    autorId: usuario.id,
    texto: nota ? `El cliente no vino. ${nota}` : "El cliente no vino.",
    tipo: "ausencia",
  });

  avisarADuenos({
    autorId: usuario.id,
    tipo: "ausencia",
    titulo: `${turno.clienteNombre} no vino`,
    cuerpo: `${turno.servicioNombre} de las ${hora(turno.inicio)} con ${turno.profesionalNombre}.${
      nota ? ` ${nota}` : ""
    } El turno sigue como estaba: cambiá el estado vos si corresponde.`,
    turnoId: turno.id,
  });

  refrescar();
  revalidatePath("/notificaciones");
  return { ok: "Aviso enviado al dueño." };
}
