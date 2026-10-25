import { NextResponse } from "next/server";

/**
 * Autenticacion de la API que consume el bot de WhatsApp.
 *
 * El bot manda la cabecera `x-senko-bot-key` con el valor de la variable de
 * entorno SENKO_BOT_API_KEY. Es una clave compartida: alcanza porque el bot es
 * un servicio, no un usuario final.
 */
export function verificarClaveBot(request: Request): NextResponse | null {
  const esperada = process.env.SENKO_BOT_API_KEY;

  if (!esperada || esperada.length < 8) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "La API del bot no está configurada: falta SENKO_BOT_API_KEY en el entorno del servidor.",
      },
      { status: 503 },
    );
  }

  const recibida = request.headers.get("x-senko-bot-key");
  if (!recibida || !comparar(recibida, esperada)) {
    return NextResponse.json(
      { ok: false, error: "Clave del bot inválida o ausente." },
      { status: 401 },
    );
  }
  return null;
}

/** Comparacion en tiempo constante, para no filtrar la clave por timing. */
function comparar(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}

export function malaPeticion(error: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

export function ok<T>(datos: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, ...datos }, { status });
}

// ---------------------------------------------------------------------------
// Serializacion de turnos para el bot
// ---------------------------------------------------------------------------

import { revalidatePath } from "next/cache";
import { calcularSena, tarifario } from "./precios";
import { listarMetodosPago, obtenerAjustes } from "./repo/config";
import { obtenerServicio } from "./repo/servicios";
import { obtenerTurno } from "./repo/turnos";

/**
 * Forma en la que el bot ve un turno: montos en centavos y en pesos enteros,
 * la seña que falta, y el precio final con cada metodo de pago, listo para
 * contestarle al cliente por WhatsApp.
 */
export function paraBot(turnoId: string) {
  const turno = obtenerTurno(turnoId);
  if (!turno) return null;

  const servicio = obtenerServicio(turno.servicioId);
  const metodos = listarMetodosPago().filter((m) => m.activo);
  const ajustes = obtenerAjustes();
  const sena = servicio ? calcularSena(servicio) : 0;
  const faltaSena = Math.max(sena - turno.pagado, 0);

  return {
    id: turno.id,
    ref_externa: turno.refExterna,
    estado: turno.estado,
    origen: turno.origen,
    inicio: turno.inicio,
    fin: turno.fin,
    cliente: { id: turno.clienteId, nombre: turno.clienteNombre, telefono: turno.clienteTelefono },
    profesional: { id: turno.profesionalId, nombre: turno.profesionalNombre },
    servicio: { id: turno.servicioId, nombre: turno.servicioNombre },
    precio_general_centavos: turno.precioBase,
    precio_general_pesos: Math.round(turno.precioBase / 100),
    sena: {
      esperada_centavos: sena,
      esperada_pesos: Math.round(sena / 100),
      falta_centavos: faltaSena,
      cubierta: turno.senaCubierta,
      alias: ajustes.transferencia_alias || null,
      vence_en_horas: Number(ajustes.sena_horas_vencimiento) || 24,
    },
    imputado_centavos: turno.pagado,
    saldo_centavos: Math.max(turno.precioBase - turno.pagado, 0),
    precio_por_metodo: tarifario(turno.precioBase, metodos).map((t) => ({
      metodo: t.metodo,
      etiqueta: t.etiqueta,
      ajuste_pct: t.ajustePct,
      total_centavos: t.total,
      total_pesos: Math.round(t.total / 100),
    })),
  };
}

/** Invalida las pantallas del panel tras un cambio hecho por el bot. */
export function refrescarPanel() {
  revalidatePath("/");
  revalidatePath("/calendario");
  revalidatePath("/senas");
  revalidatePath("/pagos");
  revalidatePath("/clientes");
}
