import { NextResponse } from "next/server";
import { z } from "zod";
import { malaPeticion, ok, paraBot, refrescarPanel, verificarClaveBot } from "@/lib/bot";
import { normalizarTelefono, obtenerOCrearCliente } from "@/lib/repo/clientes";
import { obtenerServicio } from "@/lib/repo/servicios";
import {
  ConflictoHorario,
  crearTurno,
  hayDisponibilidad,
  listarTurnos,
  obtenerTurnoPorRefExterna,
} from "@/lib/repo/turnos";
import { obtenerUsuario, serviciosDeProfesional } from "@/lib/repo/usuarios";

const esquema = z.object({
  telefono: z.string().trim().min(6),
  nombre: z.string().trim().min(2),
  servicio_id: z.string().trim().min(1),
  profesional_id: z.string().trim().min(1),
  /** ISO 8601 con zona, ej "2026-10-27T14:00:00-03:00". */
  inicio: z.string().trim().min(10),
  notas: z.string().trim().optional(),
  /** Id del turno en el bot. Evita duplicados si reintenta. */
  ref_externa: z.string().trim().optional(),
  estado: z.enum(["pendiente", "confirmado"]).optional(),
});

/**
 * POST /api/bot/turnos
 *
 * Crea el turno que reservo el cliente por WhatsApp. Si el telefono no esta
 * registrado se crea el cliente. Devuelve la seña a pedir y el precio final
 * segun cada metodo, listo para contestarle al cliente.
 *
 * Idempotente por `ref_externa`: si el bot reintenta con la misma referencia,
 * devuelve el turno que ya existe en lugar de duplicarlo.
 */
export async function POST(request: Request) {
  const rechazo = verificarClaveBot(request);
  if (rechazo) return rechazo;

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return malaPeticion("El cuerpo tiene que ser JSON.");
  }

  const parseado = esquema.safeParse(cuerpo);
  if (!parseado.success) {
    return malaPeticion(
      `Datos inválidos: ${parseado.error.issues
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}`,
    );
  }
  const d = parseado.data;

  if (d.ref_externa) {
    const existente = obtenerTurnoPorRefExterna(d.ref_externa);
    if (existente) {
      return ok({ duplicado: true, turno: paraBot(existente.id) }, 200);
    }
  }

  const servicio = obtenerServicio(d.servicio_id);
  if (!servicio) return malaPeticion("Ese servicio no existe.", 404);
  if (!servicio.activo) return malaPeticion("Ese servicio está desactivado.", 409);

  const profesional = obtenerUsuario(d.profesional_id);
  if (!profesional || profesional.rol !== "profesional") {
    return malaPeticion("Ese profesional no existe.", 404);
  }
  if (!profesional.activo) return malaPeticion("Ese profesional está desactivado.", 409);
  if (!serviciosDeProfesional(profesional.id).includes(servicio.id)) {
    return malaPeticion("Ese profesional no atiende ese servicio.", 409);
  }

  const inicio = new Date(d.inicio);
  if (Number.isNaN(inicio.getTime())) return malaPeticion("`inicio` no es una fecha válida.");
  const fin = new Date(inicio.getTime() + servicio.duracionMin * 60_000);

  if (!hayDisponibilidad(profesional.id, inicio.toISOString(), fin.toISOString())) {
    const ocupados = listarTurnos({
      desde: new Date(inicio.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      hasta: new Date(inicio.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      profesionalId: profesional.id,
      estados: ["pendiente", "confirmado", "completado"],
    }).map((t) => ({ inicio: t.inicio, fin: t.fin }));
    return NextResponse.json(
      {
        ok: false,
        error: "Ese horario ya está ocupado para ese profesional.",
        ocupados,
      },
      { status: 409 },
    );
  }

  try {
    const cliente = obtenerOCrearCliente(normalizarTelefono(d.telefono), d.nombre);
    const turno = crearTurno({
      clienteId: cliente.id,
      profesionalId: profesional.id,
      servicioId: servicio.id,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      precioBase: servicio.precioBase,
      estado: d.estado ?? "pendiente",
      origen: "bot",
      notas: d.notas || null,
      refExterna: d.ref_externa || null,
    });

    refrescarPanel();
    return ok({ turno: paraBot(turno.id) }, 201);
  } catch (error) {
    if (error instanceof ConflictoHorario) return malaPeticion(error.message, 409);
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return malaPeticion("Ese `ref_externa` o teléfono ya está usado.", 409);
    }
    return malaPeticion("No se pudo crear el turno.", 500);
  }
}

/**
 * GET /api/bot/turnos?telefono=...  → turnos del cliente, para "¿cuándo tengo turno?"
 * GET /api/bot/turnos?desde=&hasta= → agenda de un rango
 */
export async function GET(request: Request) {
  const rechazo = verificarClaveBot(request);
  if (rechazo) return rechazo;

  const url = new URL(request.url);
  const telefono = url.searchParams.get("telefono");
  const desde = url.searchParams.get("desde") ?? new Date().toISOString();
  const hasta =
    url.searchParams.get("hasta") ??
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const turnos = listarTurnos({
    desde,
    hasta,
    profesionalId: url.searchParams.get("profesionalId"),
  }).filter((t) => !telefono || t.clienteTelefono === normalizarTelefono(telefono));

  return ok({ turnos: turnos.map((t) => paraBot(t.id)) });
}
