"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/lib/auth";
import { marcarLeida, marcarTodasLeidas } from "@/lib/repo/avisos";

export async function accionMarcarLeida(datos: FormData): Promise<void> {
  const usuario = await exigirSesion();
  marcarLeida(String(datos.get("notificacionId") ?? ""), usuario.id);
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
}

export async function accionMarcarTodas(): Promise<void> {
  const usuario = await exigirSesion();
  marcarTodasLeidas(usuario.id);
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
}
