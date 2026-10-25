import { NextResponse } from "next/server";
import { z } from "zod";
import { malaPeticion, ok, paraBot, refrescarPanel, verificarClaveBot } from "@/lib/bot";
import { calcularSena, cobroPorMetodo } from "@/lib/precios";
import { listarMetodosPago, obtenerAjustes } from "@/lib/repo/config";
import { pagosDeTurno, registrarPago } from "@/lib/repo/pagos";
import { obtenerServicio } from "@/lib/repo/servicios";
import { obtenerTurno, obtenerTurnoPorRefExterna } from "@/lib/repo/turnos";

const esquema = z.object({
  /** Id interno del turno o la `ref_externa` del bot. */
  turno_id: z.string().trim().min(1),
  metodo: z.enum(["efectivo", "transferencia", "credito", "debito"]),
  /**
   * Monto A PRECIO GENERAL, en centavos. Si no se manda, se toma la seña que
   * corresponde al servicio. El recargo o descuento del metodo lo calcula el
   * servidor, nunca el bot.
   */
  monto_base_centavos: z.number().int().positive().optional(),
  /**
   * `false` deja la seña como "por acreditar" para que el dueño la confirme
   * cuando vea la plata. Por defecto es false para transferencia y true para
   * los demas metodos.
   */
  acreditada: z.boolean().optional(),
  referencia: z.string().trim().optional(),
});

/**
 * POST /api/bot/senas
 *
 * Registra la seña que informo el cliente por WhatsApp. Devuelve el turno
 * actualizado, con la seña que falta (si falta) y el saldo pendiente.
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

  const turno = obtenerTurno(d.turno_id) ?? obtenerTurnoPorRefExterna(d.turno_id);
  if (!turno) return malaPeticion("Ese turno no existe.", 404);
  if (turno.estado === "cancelado") {
    return malaPeticion("Ese turno está cancelado.", 409);
  }

  const servicio = obtenerServicio(turno.servicioId);
  if (!servicio) return malaPeticion("El servicio del turno no existe.", 500);

  // Si ya hay una seña esperando que el dueño la acredite, no se crea otra:
  // si no, un reintento del bot la contaría dos veces en "por acreditar".
  const pendiente = pagosDeTurno(turno.id).find(
    (p) => p.tipo === "sena" && p.estado === "pendiente",
  );
  if (pendiente) {
    return NextResponse.json(
      {
        ok: false,
        error: "Ese turno ya tiene una seña esperando que el dueño la acredite.",
        pago_pendiente: {
          id: pendiente.id,
          metodo: pendiente.metodo,
          a_cobrar_centavos: pendiente.montoTotal,
          referencia: pendiente.referencia,
        },
      },
      { status: 409 },
    );
  }

  const senaEsperada = calcularSena(servicio);
  const restante = turno.precioBase - turno.pagado;
  if (restante <= 0) {
    return malaPeticion("Ese turno ya está pago por completo.", 409);
  }

  const montoBase = d.monto_base_centavos ?? Math.max(senaEsperada - turno.pagado, 0);
  if (montoBase <= 0) {
    return malaPeticion("La seña de ese turno ya está cubierta.", 409);
  }
  if (montoBase > restante) {
    return malaPeticion(
      `El monto supera lo que falta del turno: quedan ${restante} centavos a precio general.`,
      409,
    );
  }

  const metodos = listarMetodosPago();
  const configMetodo = metodos.find((m) => m.clave === d.metodo);
  if (!configMetodo?.activo) {
    return malaPeticion(`El método ${d.metodo} está desactivado.`, 409);
  }

  const acreditada = d.acreditada ?? d.metodo !== "transferencia";
  const ajustes = obtenerAjustes();
  const cobro = cobroPorMetodo(montoBase, d.metodo, metodos);

  const pago = registrarPago({
    clienteId: turno.clienteId,
    turnoId: turno.id,
    metodo: d.metodo,
    tipo: "sena",
    montoBase,
    estado: acreditada ? "confirmado" : "pendiente",
    alias: d.metodo === "transferencia" ? ajustes.transferencia_alias || null : null,
    referencia: d.referencia || null,
  });

  refrescarPanel();

  return ok(
    {
      pago: {
        id: pago.id,
        estado: pago.estado,
        metodo: pago.metodo,
        monto_base_centavos: cobro.base,
        ajuste_pct: cobro.ajustePct,
        ajuste_centavos: cobro.ajusteMonto,
        a_cobrar_centavos: cobro.total,
        a_cobrar_pesos: Math.round(cobro.total / 100),
      },
      turno: paraBot(turno.id),
    },
    201,
  );
}
