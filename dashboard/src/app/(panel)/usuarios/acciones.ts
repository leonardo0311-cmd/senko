"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirDueno } from "@/lib/auth";
import {
  actualizarUsuario,
  cambiarPassword,
  contarDuenosActivos,
  crearUsuario,
  definirServiciosDeProfesional,
  eliminarUsuario,
  obtenerUsuario,
  obtenerUsuarioPorEmail,
} from "@/lib/repo/usuarios";
import { definirHorarios } from "@/lib/repo/config";
import { db } from "@/lib/db";

type Resultado = { error?: string; ok?: string };

function refrescar() {
  revalidatePath("/usuarios");
  revalidatePath("/calendario");
  revalidatePath("/pagos");
}

const esquemaNuevo = z.object({
  nombre: z.string().trim().min(2, "Poné el nombre del profesional."),
  email: z.string().trim().toLowerCase().email("El email no es válido."),
  password: z.string().min(8, "La contraseña tiene que tener 8 caracteres o más."),
  ocupacion: z.string().trim().max(60, "La ocupación es muy larga.").optional(),
  telefono: z.string().trim().optional(),
  rol: z.enum(["dueno", "profesional"]),
});

export async function accionCrearUsuario(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();

  const parseado = esquemaNuevo.safeParse({
    nombre: datos.get("nombre") ?? "",
    email: datos.get("email") ?? "",
    password: datos.get("password") ?? "",
    ocupacion: datos.get("ocupacion") ?? "",
    telefono: datos.get("telefono") ?? "",
    rol: (datos.get("rol") as string) || "profesional",
  });
  if (!parseado.success) {
    return { error: parseado.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const d = parseado.data;

  if (obtenerUsuarioPorEmail(d.email)) {
    return { error: "Ya existe un usuario con ese email." };
  }

  const usuario = crearUsuario({
    nombre: d.nombre,
    email: d.email,
    password: d.password,
    rol: d.rol,
    ocupacion: d.ocupacion || null,
    telefono: d.telefono || null,
  });

  // Por defecto atiende todos los servicios activos; después se ajusta.
  const servicios = db()
    .prepare<[], { id: string }>(`SELECT id FROM servicios WHERE activo = 1`)
    .all()
    .map((f) => f.id);
  if (d.rol === "profesional") {
    definirServiciosDeProfesional(usuario.id, servicios);
    definirHorarios(
      usuario.id,
      [1, 2, 3, 4, 5].map((dia) => ({ diaSemana: dia, desde: "09:00", hasta: "18:00" })),
    );
  }

  refrescar();
  return { ok: `${usuario.nombre} ya puede entrar con ${usuario.email}.` };
}

export async function accionEditarUsuario(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();

  const id = String(datos.get("usuarioId") ?? "");
  const usuario = obtenerUsuario(id);
  if (!usuario) return { error: "Ese usuario no existe." };

  const nombre = String(datos.get("nombre") ?? "").trim();
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  if (nombre.length < 2) return { error: "Poné el nombre del profesional." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "El email no es válido." };

  const otro = obtenerUsuarioPorEmail(email);
  if (otro && otro.usuario.id !== id) {
    return { error: "Ese email ya lo usa otro usuario." };
  }

  try {
    actualizarUsuario(id, {
      nombre,
      email,
      ocupacion: String(datos.get("ocupacion") ?? ""),
      telefono: String(datos.get("telefono") ?? ""),
      color: String(datos.get("color") ?? usuario.color),
    });

    const servicios = datos.getAll("servicios").map(String).filter(Boolean);
    if (usuario.rol === "profesional") definirServiciosDeProfesional(id, servicios);

    refrescar();
    return { ok: "Usuario actualizado." };
  } catch {
    return { error: "No se pudo actualizar el usuario." };
  }
}

export async function accionAlternarActivo(datos: FormData): Promise<void> {
  await exigirDueno();
  const id = String(datos.get("usuarioId") ?? "");
  const usuario = obtenerUsuario(id);
  if (!usuario) return;

  // Nunca dejar el negocio sin un dueño que pueda entrar.
  if (usuario.rol === "dueno" && usuario.activo && contarDuenosActivos() <= 1) return;

  actualizarUsuario(id, { activo: !usuario.activo });
  refrescar();
}

export async function accionCambiarPassword(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();
  const id = String(datos.get("usuarioId") ?? "");
  const password = String(datos.get("password") ?? "");
  if (password.length < 8) {
    return { error: "La contraseña tiene que tener 8 caracteres o más." };
  }
  if (!obtenerUsuario(id)) return { error: "Ese usuario no existe." };

  cambiarPassword(id, password);
  refrescar();
  return { ok: "Contraseña cambiada. Pasale la nueva al profesional." };
}

export async function accionEliminarUsuario(datos: FormData): Promise<void> {
  await exigirDueno();
  const id = String(datos.get("usuarioId") ?? "");
  const usuario = obtenerUsuario(id);
  if (!usuario || usuario.rol !== "profesional") return;

  // Si tiene turnos cargados se desactiva, para no perder el historial.
  const turnos = db()
    .prepare<[string], { n: number }>(`SELECT COUNT(*) AS n FROM turnos WHERE profesional_id = ?`)
    .get(id);
  if ((turnos?.n ?? 0) > 0) {
    actualizarUsuario(id, { activo: false });
  } else {
    eliminarUsuario(id);
  }
  refrescar();
}

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Días y horarios de trabajo de un profesional. Es lo que cruza el bot con los
 * turnos tomados para saber qué horarios puede ofrecer.
 */
export async function accionGuardarHorarios(_previo: unknown, datos: FormData): Promise<Resultado> {
  await exigirDueno();

  const id = String(datos.get("usuarioId") ?? "");
  const usuario = obtenerUsuario(id);
  if (!usuario) return { error: "Ese usuario no existe." };
  if (usuario.rol !== "profesional") return { error: "Los horarios son de los profesionales." };

  const tramos: Array<{ diaSemana: number; desde: string; hasta: string }> = [];

  for (let dia = 0; dia <= 6; dia += 1) {
    if (datos.get(`activo_${dia}`) !== "on") continue;
    const desde = String(datos.get(`desde_${dia}`) ?? "").trim();
    const hasta = String(datos.get(`hasta_${dia}`) ?? "").trim();

    if (!HORA.test(desde) || !HORA.test(hasta)) {
      return { error: `Revisá las horas de ${NOMBRE_DIA[dia]}: tienen que ser HH:MM.` };
    }
    if (hasta <= desde) {
      return { error: `En ${NOMBRE_DIA[dia]}, la hora de cierre tiene que ser posterior a la de apertura.` };
    }
    tramos.push({ diaSemana: dia, desde, hasta });
  }

  definirHorarios(id, tramos);
  refrescar();

  return {
    ok: tramos.length
      ? `Horarios guardados: ${tramos.length} ${tramos.length === 1 ? "día" : "días"} por semana.`
      : "Se quitaron todos los horarios: el bot no va a ofrecer turnos con esta persona.",
  };
}

const NOMBRE_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
