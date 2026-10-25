"use server";

import { redirect } from "next/navigation";
import { iniciarSesion } from "@/lib/auth";

export async function accionIngresar(_previo: unknown, datos: FormData) {
  const email = String(datos.get("email") ?? "");
  const password = String(datos.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completá email y contraseña." };
  }

  const resultado = await iniciarSesion(email, password);
  if (!resultado.ok) return { error: resultado.error };

  redirect(resultado.usuario.rol === "dueno" ? "/" : "/calendario");
}
