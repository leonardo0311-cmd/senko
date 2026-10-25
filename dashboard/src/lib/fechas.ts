import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export const LOCALE = es;

export type Periodo = "hoy" | "semana" | "mes" | "mes-pasado" | "anio" | "todo";

export const PERIODOS: Array<{ clave: Periodo; etiqueta: string }> = [
  { clave: "hoy", etiqueta: "Hoy" },
  { clave: "semana", etiqueta: "Esta semana" },
  { clave: "mes", etiqueta: "Este mes" },
  { clave: "mes-pasado", etiqueta: "Mes pasado" },
  { clave: "anio", etiqueta: "Este año" },
  { clave: "todo", etiqueta: "Todo" },
];

export function esPeriodo(valor: string | undefined): Periodo {
  const claves = PERIODOS.map((p) => p.clave);
  return claves.includes(valor as Periodo) ? (valor as Periodo) : "mes";
}

/** Rango [desde, hasta) en ISO. `todo` devuelve undefined en los dos extremos. */
export function rangoDePeriodo(periodo: Periodo): { desde?: string; hasta?: string } {
  const hoy = new Date();
  switch (periodo) {
    case "hoy":
      return { desde: startOfDay(hoy).toISOString(), hasta: addDays(startOfDay(hoy), 1).toISOString() };
    case "semana": {
      const lunes = startOfWeek(hoy, { weekStartsOn: 1 });
      return { desde: lunes.toISOString(), hasta: addDays(lunes, 7).toISOString() };
    }
    case "mes": {
      const primero = startOfMonth(hoy);
      return {
        desde: primero.toISOString(),
        hasta: startOfMonth(addDays(endOfMonth(hoy), 1)).toISOString(),
      };
    }
    case "mes-pasado": {
      const primero = startOfMonth(hoy);
      const anterior = startOfMonth(addDays(primero, -1));
      return { desde: anterior.toISOString(), hasta: primero.toISOString() };
    }
    case "anio":
      return {
        desde: new Date(hoy.getFullYear(), 0, 1).toISOString(),
        hasta: new Date(hoy.getFullYear() + 1, 0, 1).toISOString(),
      };
    case "todo":
    default:
      return {};
  }
}

export function etiquetaPeriodo(periodo: Periodo): string {
  return PERIODOS.find((p) => p.clave === periodo)?.etiqueta ?? "Este mes";
}

// ------------------------------------------------------------ formato corto

export const fechaCorta = (iso: string) => format(new Date(iso), "dd/MM/yyyy", { locale: es });
export const fechaLarga = (iso: string) =>
  format(new Date(iso), "EEEE d 'de' MMMM", { locale: es });
export const hora = (iso: string) => format(new Date(iso), "HH:mm");
export const fechaYHora = (iso: string) =>
  format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: es });
export const diaMes = (iso: string) => format(new Date(iso), "d MMM", { locale: es });

/** Para <input type="datetime-local"> en hora local. */
export function paraInputLocal(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

/** De <input type="datetime-local"> a ISO. */
export function desdeInputLocal(valor: string): string {
  return new Date(valor).toISOString();
}

export { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, format };
