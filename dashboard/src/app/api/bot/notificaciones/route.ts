import { z } from "zod";
import { malaPeticion, ok, verificarClaveBot } from "@/lib/bot";
import { marcarAvisadas, pendientesDeAviso } from "@/lib/repo/avisos";
import { obtenerUsuario } from "@/lib/repo/usuarios";

/**
 * GET /api/bot/notificaciones[?marcar=false][&limite=20]
 *
 * Avisos que todavía no salieron por WhatsApp: demoras que cargó un
 * profesional, ausencias y comentarios. El bot los lee y se los manda al dueño
 * al teléfono.
 *
 * Por defecto los marca como enviados en la misma llamada, así no se repiten.
 * Con `marcar=false` los devuelve sin marcarlos, para probar sin consumirlos.
 */
export async function GET(request: Request) {
  const rechazo = verificarClaveBot(request);
  if (rechazo) return rechazo;

  const url = new URL(request.url);
  const limite = Math.min(Math.max(Number(url.searchParams.get("limite") ?? "50") || 50, 1), 200);
  const marcar = url.searchParams.get("marcar") !== "false";

  const pendientes = pendientesDeAviso(limite);

  const avisos = pendientes.map((n) => {
    const destinatario = obtenerUsuario(n.destinatarioId);
    return {
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      cuerpo: n.cuerpo,
      creado_en: n.creadoEn,
      autor: n.autorNombre,
      turno: n.turnoId
        ? { id: n.turnoId, inicio: n.turnoInicio, cliente: n.clienteNombre }
        : null,
      destinatario: destinatario
        ? { id: destinatario.id, nombre: destinatario.nombre, telefono: destinatario.telefono }
        : null,
    };
  });

  if (marcar) marcarAvisadas(pendientes.map((n) => n.id));

  return ok({ marcadas: marcar, avisos });
}

const esquema = z.object({ ids: z.array(z.string().trim().min(1)).min(1).max(200) });

/**
 * POST /api/bot/notificaciones  { "ids": ["ntf_..."] }
 *
 * Marca avisos como enviados. Sirve si el bot los leyó con `marcar=false` y
 * prefiere confirmarlos recién cuando WhatsApp acepta el mensaje.
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
    return malaPeticion("Mandá `ids` con al menos un identificador de aviso.");
  }

  marcarAvisadas(parseado.data.ids);
  return ok({ marcadas: parseado.data.ids.length });
}
