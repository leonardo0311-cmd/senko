import { z } from "zod";
import { malaPeticion, ok, paraBot, refrescarPanel, verificarClaveBot } from "@/lib/bot";
import { obtenerServicio } from "@/lib/repo/servicios";
import {
  ConflictoHorario,
  actualizarTurno,
  cambiarEstadoTurno,
  obtenerTurno,
  obtenerTurnoPorRefExterna,
} from "@/lib/repo/turnos";

const esquema = z.object({
  /** Mover el turno: ISO 8601 con zona. */
  inicio: z.string().trim().min(10).optional(),
  estado: z.enum(["pendiente", "confirmado", "completado", "cancelado", "ausente"]).optional(),
  servicio_id: z.string().trim().min(1).optional(),
  notas: z.string().trim().nullable().optional(),
});

/** Acepta el id interno (`trn_...`) o la `ref_externa` del bot. */
function buscar(id: string) {
  return obtenerTurno(id) ?? obtenerTurnoPorRefExterna(id);
}

/**
 * GET /api/bot/turnos/:id — estado actual del turno.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rechazo = verificarClaveBot(request);
  if (rechazo) return rechazo;

  const { id } = await params;
  const turno = buscar(id);
  if (!turno) return malaPeticion("Ese turno no existe.", 404);

  return ok({ turno: paraBot(turno.id) });
}

/**
 * PATCH /api/bot/turnos/:id
 *
 * Mueve el turno de horario, le cambia el servicio o el estado. Cancelar es
 * `{"estado":"cancelado"}`: el horario queda libre para otro cliente.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rechazo = verificarClaveBot(request);
  if (rechazo) return rechazo;

  const { id } = await params;
  const turno = buscar(id);
  if (!turno) return malaPeticion("Ese turno no existe.", 404);

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

  if (!d.inicio && !d.estado && !d.servicio_id && d.notas === undefined) {
    return malaPeticion("No mandaste ningún cambio.");
  }

  // Solo estado: no hace falta recalcular horarios.
  if (d.estado && !d.inicio && !d.servicio_id && d.notas === undefined) {
    cambiarEstadoTurno(turno.id, d.estado);
    refrescarPanel();
    return ok({ turno: paraBot(turno.id) });
  }

  const servicio = obtenerServicio(d.servicio_id ?? turno.servicioId);
  if (!servicio) return malaPeticion("Ese servicio no existe.", 404);

  let inicio = new Date(turno.inicio);
  if (d.inicio) {
    inicio = new Date(d.inicio);
    if (Number.isNaN(inicio.getTime())) return malaPeticion("`inicio` no es una fecha válida.");
  }
  const fin = new Date(inicio.getTime() + servicio.duracionMin * 60_000);

  try {
    actualizarTurno(turno.id, {
      servicioId: servicio.id,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      precioBase: d.servicio_id ? servicio.precioBase : turno.precioBase,
      estado: d.estado,
      notas: d.notas === undefined ? undefined : d.notas,
    });
    refrescarPanel();
    return ok({ turno: paraBot(turno.id) });
  } catch (error) {
    if (error instanceof ConflictoHorario) return malaPeticion(error.message, 409);
    return malaPeticion("No se pudo actualizar el turno.", 500);
  }
}

/**
 * DELETE /api/bot/turnos/:id — cancela (no borra, para no perder el historial).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rechazo = verificarClaveBot(request);
  if (rechazo) return rechazo;

  const { id } = await params;
  const turno = buscar(id);
  if (!turno) return malaPeticion("Ese turno no existe.", 404);

  cambiarEstadoTurno(turno.id, "cancelado");
  refrescarPanel();
  return ok({ turno: paraBot(turno.id) });
}
