"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirDueno } from "@/lib/auth";
import { aCentavos } from "@/lib/dinero";
import {
  actualizarMetodoPago,
  guardarAjuste,
  type ClaveAjuste,
} from "@/lib/repo/config";
import {
  actualizarServicio,
  crearServicio,
  eliminarServicio,
  obtenerServicio,
} from "@/lib/repo/servicios";
import { METODOS_ORDEN, type MetodoPagoClave } from "@/lib/types";

type Resultado = { error?: string; ok?: string };

function refrescar() {
  revalidatePath("/configuracion");
  revalidatePath("/calendario");
  revalidatePath("/clientes");
  revalidatePath("/senas");
  revalidatePath("/pagos");
  revalidatePath("/");
}

/**
 * Guarda los porcentajes de todos los metodos de una sola vez.
 *
 * OJO: el ajuste cambia el precio de los pagos NUEVOS. Los pagos ya
 * registrados guardan el porcentaje con el que se cobraron, asi que el
 * historial no se reescribe.
 */
export async function accionGuardarMetodos(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();

  const cambios: Array<{ clave: MetodoPagoClave; etiqueta: string; ajustePct: number; activo: boolean }> = [];

  for (const clave of METODOS_ORDEN) {
    const etiqueta = String(datos.get(`etiqueta_${clave}`) ?? "").trim();
    const crudo = String(datos.get(`ajuste_${clave}`) ?? "0").replace(",", ".");
    const ajustePct = Number(crudo);

    if (!etiqueta) return { error: "Cada método necesita un nombre." };
    if (!Number.isFinite(ajustePct)) {
      return { error: `El porcentaje de ${etiqueta} no es un número.` };
    }
    if (ajustePct < -100 || ajustePct > 100) {
      return { error: `El porcentaje de ${etiqueta} tiene que estar entre -100 y 100.` };
    }
    cambios.push({
      clave,
      etiqueta,
      ajustePct,
      activo: datos.get(`activo_${clave}`) === "on",
    });
  }

  if (!cambios.some((c) => c.activo)) {
    return { error: "Tiene que quedar al menos un método de pago activo." };
  }

  for (const c of cambios) {
    actualizarMetodoPago(c.clave, {
      etiqueta: c.etiqueta,
      ajustePct: c.ajustePct,
      activo: c.activo,
    });
  }

  refrescar();
  return { ok: "Porcentajes guardados. Se aplican a los pagos nuevos." };
}

const esquemaAjustes = z.object({
  negocio_nombre: z.string().trim().min(1, "Poné el nombre del negocio."),
  transferencia_alias: z.string().trim(),
  transferencia_cbu: z.string().trim(),
  transferencia_titular: z.string().trim(),
  sena_horas_vencimiento: z.string().trim(),
});

export async function accionGuardarAjustes(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();

  const parseado = esquemaAjustes.safeParse({
    negocio_nombre: datos.get("negocio_nombre") ?? "",
    transferencia_alias: datos.get("transferencia_alias") ?? "",
    transferencia_cbu: datos.get("transferencia_cbu") ?? "",
    transferencia_titular: datos.get("transferencia_titular") ?? "",
    sena_horas_vencimiento: datos.get("sena_horas_vencimiento") ?? "24",
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const horas = Number(parseado.data.sena_horas_vencimiento);
  if (!Number.isFinite(horas) || horas < 1 || horas > 720) {
    return { error: "El vencimiento de la seña va de 1 a 720 horas." };
  }

  for (const [clave, valor] of Object.entries(parseado.data)) {
    guardarAjuste(clave as ClaveAjuste, valor);
  }

  refrescar();
  return { ok: "Datos del negocio guardados." };
}

const esquemaServicio = z.object({
  nombre: z.string().trim().min(2, "Poné el nombre del servicio."),
  precio: z.string().trim().min(1, "Poné el precio general."),
  duracion: z.string().trim().min(1, "Poné cuánto dura."),
  senaTipo: z.enum(["porcentaje", "fijo"]),
  senaValor: z.string().trim().min(1, "Poné el valor de la seña."),
});

export async function accionGuardarServicio(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();

  const parseado = esquemaServicio.safeParse({
    nombre: datos.get("nombre") ?? "",
    precio: datos.get("precio") ?? "",
    duracion: datos.get("duracion") ?? "",
    senaTipo: (datos.get("senaTipo") as string) || "porcentaje",
    senaValor: datos.get("senaValor") ?? "",
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Revisá los datos del servicio." };
  }
  const d = parseado.data;

  const precioBase = aCentavos(d.precio);
  if (precioBase <= 0) return { error: "El precio tiene que ser mayor a cero." };

  const duracionMin = Number(d.duracion);
  if (!Number.isInteger(duracionMin) || duracionMin < 5 || duracionMin > 600) {
    return { error: "La duración va de 5 a 600 minutos." };
  }

  const numeroSena = Number(d.senaValor.replace(",", "."));
  if (!Number.isFinite(numeroSena) || numeroSena < 0) {
    return { error: "El valor de la seña no es válido." };
  }
  if (d.senaTipo === "porcentaje" && numeroSena > 100) {
    return { error: "La seña en porcentaje no puede pasar de 100." };
  }
  const senaValor = d.senaTipo === "porcentaje" ? numeroSena : aCentavos(numeroSena);
  if (d.senaTipo === "fijo" && senaValor > precioBase) {
    return { error: "La seña fija no puede ser mayor al precio del servicio." };
  }

  const servicioId = String(datos.get("servicioId") ?? "");

  if (servicioId) {
    if (!obtenerServicio(servicioId)) return { error: "Ese servicio no existe." };
    actualizarServicio(servicioId, {
      nombre: d.nombre,
      precioBase,
      duracionMin,
      senaTipo: d.senaTipo,
      senaValor,
      activo: datos.get("activo") === "on",
    });
    refrescar();
    return { ok: `"${d.nombre}" actualizado.` };
  }

  crearServicio({
    nombre: d.nombre,
    precioBase,
    duracionMin,
    senaTipo: d.senaTipo,
    senaValor,
  });
  refrescar();
  return { ok: `"${d.nombre}" agregado.` };
}

export async function accionEliminarServicio(datos: FormData): Promise<void> {
  await exigirDueno();
  eliminarServicio(String(datos.get("servicioId") ?? ""));
  refrescar();
}
