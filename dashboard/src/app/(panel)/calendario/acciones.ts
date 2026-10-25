"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirSesion } from "@/lib/auth";
import { aCentavos } from "@/lib/dinero";
import { calcularSena } from "@/lib/precios";
import { obtenerOCrearCliente } from "@/lib/repo/clientes";
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
  const usuario = await exigirSesion();

  const parseado = esquemaNuevo.safeParse({
    clienteNombre: datos.get("clienteNombre") ?? "",
    clienteTelefono: datos.get("clienteTelefono") ?? "",
    profesionalId:
      usuario.rol === "dueno" ? (datos.get("profesionalId") ?? "") : usuario.id,
    servicioId: datos.get("servicioId") ?? "",
    inicio: datos.get("inicio") ?? "",
    estado: (datos.get("estado") as string) || "confirmado",
    notas: datos.get("notas") ?? "",
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Revisá los datos del turno." };
  }
  const d = parseado.data;

  // Un profesional solo puede cargarse turnos a si mismo.
  const profesionalId = usuario.rol === "dueno" ? d.profesionalId : usuario.id;

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
  const usuario = await exigirSesion();
  const turnoId = String(datos.get("turnoId") ?? "");
  const turno = obtenerTurno(turnoId);
  if (!turno) return { error: "Ese turno no existe." };
  if (usuario.rol !== "dueno" && turno.profesionalId !== usuario.id) {
    return { error: "Solo podés editar tus propios turnos." };
  }

  const inicioTexto = String(datos.get("inicio") ?? "");
  const servicioId = String(datos.get("servicioId") ?? turno.servicioId);
  const profesionalId =
    usuario.rol === "dueno" ? String(datos.get("profesionalId") ?? turno.profesionalId) : turno.profesionalId;

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
  const usuario = await exigirSesion();
  const turnoId = String(datos.get("turnoId") ?? "");
  const estado = String(datos.get("estado") ?? "") as EstadoTurno;
  const turno = obtenerTurno(turnoId);
  if (!turno) return;
  if (usuario.rol !== "dueno" && turno.profesionalId !== usuario.id) return;
  if (!["pendiente", "confirmado", "completado", "cancelado", "ausente"].includes(estado)) return;

  cambiarEstadoTurno(turnoId, estado);
  refrescar();
}

export async function accionEliminarTurno(datos: FormData): Promise<void> {
  const usuario = await exigirSesion();
  if (usuario.rol !== "dueno") return;
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
  const usuario = await exigirSesion();

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
  if (usuario.rol !== "dueno" && turno.profesionalId !== usuario.id) {
    return { error: "Solo podés registrar pagos de tus propios turnos." };
  }

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
  const usuario = await exigirSesion();
  const turnoId = String(datos.get("turnoId") ?? "");
  const metodo = String(datos.get("metodo") ?? "transferencia") as MetodoPagoClave;

  const turno = obtenerTurno(turnoId);
  if (!turno) return;
  if (usuario.rol !== "dueno" && turno.profesionalId !== usuario.id) return;

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
