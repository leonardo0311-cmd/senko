/**
 * ============================================================================
 * LA CARTA
 * ============================================================================
 *
 * ⚠️  `verificada: false` → el sitio muestra un aviso visible de que los platos
 * y precios son de ejemplo. **No publiques el sitio así.** Cuando el
 * restaurante confirme su carta real, reemplazá los ítems y poné
 * `verificada: true`: el aviso desaparece solo.
 *
 * Los platos de abajo son genéricos de parrilla argentina, cargados para que
 * se vea cómo funciona la carta (buscador, filtros, categorías). No son los
 * platos de La Pasión de Rosas.
 *
 * FORMATO DE UN PLATO
 *   { n: "Nombre", nEn: "Name", p: "12.500", t: ["Brasas"] }
 *   `p` es el precio sin signo. `t` son etiquetas (ver TAGS).
 */

export const cartaVerificada = false;

/** Etiquetas disponibles. La clave es canónica; la traducción vive en i18n.ts */
export const TAGS = ["Brasas", "Compartir", "Vegetariano", "SinTACC", "Clasico"] as const;
export type Tag = (typeof TAGS)[number];

export type Plato = {
  n: string;
  nEn?: string;
  /** Precio en pesos, sin "$". Dejalo vacío para no mostrarlo. */
  p: string;
  t: Tag[];
};

export type Grupo = { title: string; titleEn?: string; items: Plato[] };

export type Categoria = {
  id: string;
  label: string;
  labelEn?: string;
  /** Un menú cerrado por pasos, en vez de una lista de precios. */
  type?: "set";
  price?: string;
  note?: string;
  noteEn?: string;
  options?: string[];
  optionsEn?: string[];
  items?: Plato[];
  groups?: Grupo[];
};

export const MENU: Categoria[] = [
  {
    id: "pasos",
    label: "Menú por pasos",
    labelEn: "Tasting menu",
    type: "set",
    price: "$ 48.000",
    note: "Una secuencia pensada de principio a fin, con el costillar como plato central. Por persona.",
    noteEn:
      "A sequence designed from start to finish, with the short rib as the centrepiece. Per person.",
    options: [
      "Picada de la casa y pan recién horneado",
      "Empanada de carne cortada a cuchillo",
      "Chorizo bombón y morcilla",
      "Costillar a las brasas con ensalada y papas",
      "Postre del día",
    ],
    optionsEn: [
      "House charcuterie board and freshly baked bread",
      "Hand-cut beef empanada",
      "Chorizo bombón and black pudding",
      "Live-fire short ribs with salad and potatoes",
      "Dessert of the day",
    ],
  },
  {
    id: "entradas",
    label: "Para empezar",
    labelEn: "To start",
    items: [
      { n: "Empanada de carne", nEn: "Beef empanada", p: "3.200", t: ["Clasico"] },
      { n: "Provoleta al disco", nEn: "Grilled provoleta", p: "9.800", t: ["Brasas", "Vegetariano", "SinTACC"] },
      { n: "Chorizo bombón", nEn: "Chorizo bombón", p: "6.400", t: ["Brasas", "SinTACC"] },
      { n: "Morcilla", nEn: "Black pudding", p: "6.400", t: ["Brasas", "SinTACC"] },
      { n: "Picada de la casa", nEn: "House board", p: "14.500", t: ["Compartir"] },
      { n: "Mollejas a la parrilla", nEn: "Grilled sweetbreads", p: "18.900", t: ["Brasas", "SinTACC"] },
    ],
  },
  {
    id: "brasas",
    label: "De las brasas",
    labelEn: "From the fire",
    groups: [
      {
        title: "El plato de la casa",
        titleEn: "The house dish",
        items: [
          { n: "Costillar asado (para dos)", nEn: "Short ribs (for two)", p: "56.000", t: ["Brasas", "Compartir", "SinTACC"] },
          { n: "Costillar asado (porción)", nEn: "Short ribs (single portion)", p: "32.000", t: ["Brasas", "SinTACC"] },
        ],
      },
      {
        title: "Cortes",
        titleEn: "Cuts",
        items: [
          { n: "Entraña", nEn: "Skirt steak", p: "29.500", t: ["Brasas", "SinTACC"] },
          { n: "Bife de chorizo", nEn: "Sirloin", p: "31.000", t: ["Brasas", "SinTACC"] },
          { n: "Vacío", nEn: "Flank steak", p: "26.500", t: ["Brasas", "SinTACC"] },
          { n: "Matambrito de cerdo", nEn: "Pork flank", p: "24.000", t: ["Brasas", "SinTACC"] },
        ],
      },
    ],
  },
  {
    id: "guarniciones",
    label: "Para acompañar",
    labelEn: "Sides",
    items: [
      { n: "Papas rústicas", nEn: "Rustic potatoes", p: "6.400", t: ["Vegetariano"] },
      { n: "Ensalada de estación", nEn: "Seasonal salad", p: "5.900", t: ["Vegetariano", "SinTACC"] },
      { n: "Verduras a la parrilla", nEn: "Grilled vegetables", p: "7.800", t: ["Brasas", "Vegetariano", "SinTACC"] },
      { n: "Puré rústico", nEn: "Rustic mash", p: "5.600", t: ["Vegetariano", "SinTACC"] },
    ],
  },
  {
    id: "postres",
    label: "El final",
    labelEn: "To finish",
    items: [
      { n: "Flan con dulce de leche", nEn: "Flan with dulce de leche", p: "6.200", t: ["Clasico"] },
      { n: "Queso y dulce", nEn: "Cheese and quince", p: "6.200", t: ["Clasico", "SinTACC"] },
      { n: "Helado artesanal", nEn: "Artisanal ice cream", p: "5.800", t: ["SinTACC"] },
    ],
  },
  {
    id: "bodega",
    label: "Bodega",
    labelEn: "Cellar",
    groups: [
      {
        title: "Vinos",
        titleEn: "Wine",
        items: [
          { n: "Malbec de la casa (botella)", nEn: "House Malbec (bottle)", p: "16.000", t: ["SinTACC"] },
          { n: "Cabernet Sauvignon (botella)", nEn: "Cabernet Sauvignon (bottle)", p: "18.500", t: ["SinTACC"] },
          { n: "Copa de tinto", nEn: "Glass of red", p: "4.800", t: ["SinTACC"] },
        ],
      },
      {
        title: "Sin alcohol",
        titleEn: "Non-alcoholic",
        items: [
          { n: "Agua mineral", nEn: "Mineral water", p: "3.200", t: ["SinTACC"] },
          { n: "Gaseosa", nEn: "Soft drink", p: "3.400", t: ["SinTACC"] },
          { n: "Limonada casera", nEn: "Homemade lemonade", p: "4.600", t: ["Vegetariano", "SinTACC"] },
        ],
      },
    ],
  },
];

/** Platos destacados en la sección de especialidades. */
export const ESPECIALIDADES = {
  principal: { n: "Costillar", nEn: "Short ribs", p: "56.000" },
  secundarios: [
    { n: "Entraña", nEn: "Skirt steak", p: "29.500", t: ["Brasas"] as Tag[] },
    { n: "Bife de chorizo", nEn: "Sirloin", p: "31.000", t: ["Brasas"] as Tag[] },
    { n: "Mollejas a la parrilla", nEn: "Grilled sweetbreads", p: "18.900", t: ["Brasas"] as Tag[] },
    { n: "Provoleta al disco", nEn: "Grilled provoleta", p: "9.800", t: ["Vegetariano"] as Tag[] },
  ],
};
