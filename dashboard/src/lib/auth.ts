import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashearPassword, verificarPassword } from "./password";
import { obtenerUsuarioPorEmail, obtenerUsuario } from "./repo/usuarios";
import type { Usuario } from "./types";

export { hashearPassword, verificarPassword };

const COOKIE = "senko_sesion";
const DURACION_DIAS = 7;

function secreto(): string {
  const valor = process.env.SENKO_SESSION_SECRET;
  if (!valor || valor.length < 16) {
    throw new Error(
      "Falta SENKO_SESSION_SECRET (minimo 16 caracteres). Copiá .env.example a .env.local.",
    );
  }
  return valor;
}

// ------------------------------------------------------------------- sesiones

function firmar(payload: string): string {
  return crypto.createHmac("sha256", secreto()).update(payload).digest("base64url");
}

function crearToken(usuarioId: string): string {
  const expira = Date.now() + DURACION_DIAS * 24 * 60 * 60 * 1000;
  const payload = `${usuarioId}.${expira}`;
  return `${payload}.${firmar(payload)}`;
}

function leerToken(token: string): string | null {
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [usuarioId, expiraStr, firma] = partes;
  const payload = `${usuarioId}.${expiraStr}`;
  const esperada = Buffer.from(firmar(payload));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length) return null;
  if (!crypto.timingSafeEqual(esperada, recibida)) return null;
  if (Number(expiraStr) < Date.now()) return null;
  return usuarioId;
}

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }> {
  const fila = obtenerUsuarioPorEmail(email.trim().toLowerCase());
  const generico = "Email o contraseña incorrectos.";
  if (!fila) return { ok: false, error: generico };
  if (!verificarPassword(password, fila.passwordHash)) return { ok: false, error: generico };
  if (!fila.usuario.activo) {
    return { ok: false, error: "Tu usuario está desactivado. Hablá con el dueño." };
  }

  const almacen = await cookies();
  almacen.set(COOKIE, crearToken(fila.usuario.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_DIAS * 24 * 60 * 60,
  });
  return { ok: true, usuario: fila.usuario };
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(COOKIE);
}

/** Usuario de la sesion actual, o null. No redirige. */
export async function usuarioActual(): Promise<Usuario | null> {
  const almacen = await cookies();
  const token = almacen.get(COOKIE)?.value;
  if (!token) return null;
  const usuarioId = leerToken(token);
  if (!usuarioId) return null;
  const usuario = obtenerUsuario(usuarioId);
  if (!usuario || !usuario.activo) return null;
  return usuario;
}

/** Exige sesion. Si no hay, manda al login. */
export async function exigirSesion(): Promise<Usuario> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

/** Exige que sea el dueño. Los profesionales no pasan. */
export async function exigirDueno(): Promise<Usuario> {
  const usuario = await exigirSesion();
  if (usuario.rol !== "dueno") redirect("/calendario?error=sin-permiso");
  return usuario;
}
