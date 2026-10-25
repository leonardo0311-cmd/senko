import { horariosDeProfesional } from "./repo/config";
import { listarTurnos } from "./repo/turnos";

/**
 * Huecos libres de un profesional para un dia.
 *
 * Cruza los horarios de trabajo configurados con los turnos ya tomados. Es la
 * misma cuenta que hace la grilla del panel, asi que el bot y la dashboard
 * siempre ofrecen lo mismo.
 */
export function huecosLibres(opciones: {
  profesionalId: string;
  /** "2026-10-27" en hora local del negocio. */
  fecha: string;
  /** Duracion del servicio en minutos. */
  duracionMin: number;
  /** Cada cuantos minutos se ofrece un inicio. Por defecto, cada 15. */
  pasoMin?: number;
  /** No ofrecer horarios que empiecen antes de este instante. */
  desdeAhora?: boolean;
}): Array<{ inicio: string; fin: string }> {
  const { profesionalId, fecha, duracionMin } = opciones;
  const paso = opciones.pasoMin ?? 15;

  const dia = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(dia.getTime())) return [];

  const horarios = horariosDeProfesional(profesionalId).filter(
    (h) => h.diaSemana === dia.getDay(),
  );
  if (horarios.length === 0) return [];

  const finDia = new Date(dia);
  finDia.setDate(finDia.getDate() + 1);

  const tomados = listarTurnos({
    desde: dia.toISOString(),
    hasta: finDia.toISOString(),
    profesionalId,
    estados: ["pendiente", "confirmado", "completado"],
  }).map((t) => ({ inicio: new Date(t.inicio).getTime(), fin: new Date(t.fin).getTime() }));

  const ahora = Date.now();
  const libres: Array<{ inicio: string; fin: string }> = [];

  for (const tramo of horarios) {
    const [hDesde, mDesde] = tramo.desde.split(":").map(Number);
    const [hHasta, mHasta] = tramo.hasta.split(":").map(Number);

    const abre = new Date(dia);
    abre.setHours(hDesde, mDesde, 0, 0);
    const cierra = new Date(dia);
    cierra.setHours(hHasta, mHasta, 0, 0);

    for (
      let t = abre.getTime();
      t + duracionMin * 60_000 <= cierra.getTime();
      t += paso * 60_000
    ) {
      const fin = t + duracionMin * 60_000;
      if (opciones.desdeAhora !== false && t < ahora) continue;
      const choca = tomados.some((ocupado) => t < ocupado.fin && fin > ocupado.inicio);
      if (!choca) {
        libres.push({ inicio: new Date(t).toISOString(), fin: new Date(fin).toISOString() });
      }
    }
  }

  return libres.sort((a, b) => a.inicio.localeCompare(b.inicio));
}
