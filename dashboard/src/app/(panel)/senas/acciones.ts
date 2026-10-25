"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/lib/auth";
import { cambiarEstadoPago, obtenerPago } from "@/lib/repo/pagos";
import { obtenerTurno } from "@/lib/repo/turnos";
import type { EstadoPago } from "@/lib/types";

/** Acredita o rechaza una seña. Un profesional solo toca las de sus turnos. */
export async function accionResolverSena(datos: FormData): Promise<void> {
  const usuario = await exigirSesion();
  const pagoId = String(datos.get("pagoId") ?? "");
  const estado = String(datos.get("estado") ?? "") as EstadoPago;
  if (!["confirmado", "rechazado", "pendiente"].includes(estado)) return;

  const pago = obtenerPago(pagoId);
  if (!pago) return;

  if (usuario.rol !== "dueno") {
    if (!pago.turnoId) return;
    const turno = obtenerTurno(pago.turnoId);
    if (!turno || turno.profesionalId !== usuario.id) return;
  }

  cambiarEstadoPago(pagoId, estado);
  revalidatePath("/senas");
  revalidatePath("/pagos");
  revalidatePath("/calendario");
  revalidatePath("/clientes");
  revalidatePath("/");
}
