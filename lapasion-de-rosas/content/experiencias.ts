/**
 * ============================================================================
 * EXPERIENCIAS / OCASIONES
 * ============================================================================
 * Cada ocasión precarga el formulario de reserva y el mensaje de WhatsApp,
 * para que el visitante no tenga que explicar desde cero qué está buscando.
 */

import type { ClaveMedio } from "./medios";

export type Experiencia = {
  id: string;
  etiqueta: string;
  titulo: string;
  texto: string;
  cta: string;
  /** Frase breve que aparece en el selector de ocasión. */
  fraseSelector: string;
  medio: ClaveMedio;
  /** Mensaje con el que se abre WhatsApp desde esta ocasión. */
  mensajeWhatsapp: string;
  /** Si ocupa el bloque ancho de la grilla editorial. */
  destacada?: boolean;
};

export const experiencias: Experiencia[] = [
  {
    id: "cena",
    etiqueta: "Cenas especiales",
    titulo: "Para momentos que merecen algo más.",
    texto:
      "Una cena esperada, un aniversario, una sorpresa o simplemente las ganas de compartir una noche diferente.",
    cta: "Consultá por tu noche especial",
    fraseSelector: "Algunas noches merecen un escenario diferente.",
    medio: "ocasionCena",
    mensajeWhatsapp: "Hola, quisiera consultar por una cena especial en La Pasión de Rosas.",
    destacada: true,
  },
  {
    id: "familia",
    etiqueta: "Encuentros familiares",
    titulo: "Para celebrar estar juntos.",
    texto:
      "Los encuentros más importantes no siempre necesitan una fecha especial. A veces, el mejor motivo es volver a sentarse alrededor de una mesa.",
    cta: "Organizá tu encuentro",
    fraseSelector: "Los mejores momentos siempre encuentran una mesa.",
    medio: "ocasionFamilia",
    mensajeWhatsapp: "Hola, quisiera organizar un encuentro familiar en La Pasión de Rosas.",
  },
  {
    id: "trabajo",
    etiqueta: "Reuniones laborales",
    titulo: "Para conversaciones que importan.",
    texto:
      "Hay ideas, proyectos y decisiones que merecen un ambiente diferente. Un encuentro donde la gastronomía acompañe una buena conversación.",
    cta: "Consultá disponibilidad",
    fraseSelector: "Un buen encuentro puede abrir grandes conversaciones.",
    medio: "ocasionTrabajo",
    mensajeWhatsapp: "Hola, quisiera consultar por una reunión de trabajo en La Pasión de Rosas.",
  },
  {
    id: "celebracion",
    etiqueta: "Celebraciones",
    titulo: "Para brindar por lo que vale la pena.",
    texto:
      "Cumpleaños, logros, reencuentros y nuevas etapas. Cada celebración tiene su historia, y cada historia merece un escenario especial.",
    cta: "Contanos qué querés celebrar",
    fraseSelector: "Hay motivos que merecen un brindis inolvidable.",
    medio: "ocasionCelebracion",
    mensajeWhatsapp: "Hola, quisiera consultar por una celebración en La Pasión de Rosas.",
  },
];

/** Motivos del formulario de reserva (incluye los de arriba + una opción abierta). */
export const motivosReserva = [
  { id: "cena", etiqueta: "Cena especial" },
  { id: "familia", etiqueta: "Encuentro familiar" },
  { id: "trabajo", etiqueta: "Reunión laboral" },
  { id: "celebracion", etiqueta: "Celebración" },
  { id: "gastronomica", etiqueta: "Salida gastronómica" },
  { id: "otro", etiqueta: "Otro" },
] as const;

export type MotivoReserva = (typeof motivosReserva)[number]["id"];
