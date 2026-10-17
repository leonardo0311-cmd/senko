/**
 * Ocasiones. Cada una precarga el mensaje de WhatsApp con su motivo,
 * para que el visitante no tenga que explicarlo desde cero.
 */
export const OCASIONES = [
  { id: "cena", nombre: "opt1_name", desc: "opt1_desc", motivo: "una cena especial", motivoEn: "a special dinner" },
  { id: "familia", nombre: "opt2_name", desc: "opt2_desc", motivo: "un encuentro familiar", motivoEn: "a family gathering" },
  { id: "trabajo", nombre: "opt3_name", desc: "opt3_desc", motivo: "una reunión de trabajo", motivoEn: "a work meeting" },
  { id: "celebracion", nombre: "opt4_name", desc: "opt4_desc", motivo: "una celebración", motivoEn: "a celebration" },
] as const;
