/**
 * Resultados que el usuario pasó con su fuente. Sólo números reales y con contexto:
 * no inventar cifras, no redondear para arriba y no nombrar clientes sin autorización.
 */

export type Stat = {
  /** Valor exacto. */
  value: number;
  /** Cómo se muestra en grande, si no es el número completo (ej. "38" con unidad "millones"). */
  display?: string;
  unit?: string;
  prefix?: string;
  label: string;
};

/** Mejor resultado: cliente que no se puede nombrar, contrato terminado (dato del usuario, 02/11/2026). */
export const featuredResult = {
  tag: "Cliente confidencial",
  stats: [
    { value: 38_000_000, display: "38", unit: "millones", label: "de visualizaciones" },
    { value: 79_000, display: "79", unit: "mil", prefix: "+", label: "seguidores nuevos" },
  ] satisfies Stat[],
  note: "Proyecto terminado. Por confidencialidad no nombramos al cliente.",
};

/** Captura de Estadísticas de Instagram que mandó el usuario (02/11/2026): últimos 30 días, del 2 al 31 de octubre de 2026. */
export const recentResult = {
  tag: "Una cuenta que manejamos hoy",
  period: "Instagram · últimos 30 días · octubre de 2026",
  stats: [
    { value: 1_448_682, label: "reproducciones" },
    { value: 226_088, label: "espectadores" },
    { value: 4_770, prefix: "+", label: "seguidores netos" },
    { value: 27_117, label: "interacciones" },
  ] satisfies Stat[],
  highlight: { value: "52,4%", text: "de las reproducciones vino de gente que todavía no seguía la cuenta." },
};

export const resultsNote =
  "Datos tomados de las estadísticas de cada plataforma. Cada proyecto parte de un punto distinto: no prometemos números, los medimos.";
