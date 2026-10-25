import { malaPeticion, ok, verificarClaveBot } from "@/lib/bot";
import { calcularSena, tarifario } from "@/lib/precios";
import { listarMetodosPago, obtenerAjustes } from "@/lib/repo/config";
import { listarServicios } from "@/lib/repo/servicios";
import { listarProfesionales, serviciosDeProfesional } from "@/lib/repo/usuarios";

/**
 * GET /api/bot/catalogo
 *
 * Todo lo que el bot necesita para armar la conversacion: servicios con precio
 * general, seña, precio final por metodo de pago, profesionales que atienden
 * cada servicio y los datos de transferencia.
 *
 * Los montos van en centavos (`*_centavos`) y tambien en pesos enteros
 * (`*_pesos`) para que el bot no tenga que dividir.
 */
export async function GET(request: Request) {
  const rechazo = verificarClaveBot(request);
  if (rechazo) return rechazo;

  try {
    const metodos = listarMetodosPago().filter((m) => m.activo);
    const ajustes = obtenerAjustes();
    const profesionales = listarProfesionales();

    const servicios = listarServicios(true).map((s) => {
      const sena = calcularSena(s);
      return {
        id: s.id,
        nombre: s.nombre,
        duracion_min: s.duracionMin,
        precio_general_centavos: s.precioBase,
        precio_general_pesos: Math.round(s.precioBase / 100),
        sena: {
          tipo: s.senaTipo,
          valor: s.senaValor,
          centavos: sena,
          pesos: Math.round(sena / 100),
        },
        saldo_centavos: s.precioBase - sena,
        precio_por_metodo: tarifario(s.precioBase, metodos).map((t) => ({
          metodo: t.metodo,
          etiqueta: t.etiqueta,
          ajuste_pct: t.ajustePct,
          total_centavos: t.total,
          total_pesos: Math.round(t.total / 100),
        })),
        profesionales: profesionales
          .filter((p) => serviciosDeProfesional(p.id).includes(s.id))
          .map((p) => ({ id: p.id, nombre: p.nombre })),
      };
    });

    return ok({
      negocio: ajustes.negocio_nombre,
      transferencia: {
        alias: ajustes.transferencia_alias || null,
        cbu: ajustes.transferencia_cbu || null,
        titular: ajustes.transferencia_titular || null,
      },
      sena_vence_en_horas: Number(ajustes.sena_horas_vencimiento) || 24,
      metodos_pago: metodos.map((m) => ({
        clave: m.clave,
        etiqueta: m.etiqueta,
        ajuste_pct: m.ajustePct,
      })),
      profesionales: profesionales.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        servicios: serviciosDeProfesional(p.id),
      })),
      servicios,
    });
  } catch {
    return malaPeticion("No se pudo leer el catálogo.", 500);
  }
}
