"use server";

import { redirect } from "next/navigation";
import { cerrarSesion } from "@/lib/auth";

export async function accionSalir() {
  await cerrarSesion();
  redirect("/login");
}
