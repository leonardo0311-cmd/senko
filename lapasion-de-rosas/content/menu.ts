/**
 * ============================================================================
 * PROPUESTA GASTRONÓMICA
 * ============================================================================
 *
 * IMPORTANTE: no se inventan platos, precios ni técnicas.
 * Las categorías de abajo están vacías a propósito. Cargá únicamente lo que
 * el restaurante confirme. Mientras una categoría no tenga platos, el sitio
 * muestra su descripción y una invitación a consultar, sin listar nada falso.
 *
 * CÓMO CARGAR UN PLATO
 *   { nombre: "Nombre oficial", descripcion: "Breve, opcional", precio: null }
 *
 * PRECIOS
 *   `precio: null`  -> no se muestra (recomendado si varían seguido).
 *   `precio: 48000` -> se muestra formateado en pesos argentinos.
 */

export type Plato = {
  nombre: string;
  descripcion?: string;
  /** En pesos argentinos. `null` = no publicar precio. */
  precio?: number | null;
  /** Solo si está verificado. Ej: ["sin TACC"] */
  notas?: string[];
};

export type CategoriaMenu = {
  id: string;
  nombre: string;
  descripcion?: string;
  platos: Plato[];
};

/**
 * Formatos de servicio. Fuentes públicas mencionan un "Menú por pasos" y una
 * "Carta abierta", pero no están confirmados por el restaurante: mantené
 * `verificado: false` hasta que lo confirmen.
 */
export const formatosServicio = {
  verificado: false,
  items: [
    {
      id: "pasos",
      nombre: "Menú por pasos",
      descripcion: "Una secuencia pensada de principio a fin.",
    },
    {
      id: "carta",
      nombre: "Carta abierta",
      descripcion: "Platos a elección dentro de la propuesta del día.",
    },
  ],
};

export const categorias: CategoriaMenu[] = [
  {
    id: "principios",
    nombre: "Para empezar",
    descripcion: "Lo que llega primero a la mesa.",
    platos: [],
  },
  {
    id: "brasas",
    nombre: "De las brasas",
    descripcion: "El trabajo lento del fuego.",
    platos: [],
  },
  {
    id: "mesa",
    nombre: "Para acompañar",
    platos: [],
  },
  {
    id: "dulces",
    nombre: "El final",
    platos: [],
  },
  {
    id: "bodega",
    nombre: "Bodega",
    descripcion: "Una selección de vinos argentinos.",
    platos: [],
  },
];

/** Carta en PDF, como opción secundaria. Dejar en null si no existe. */
export const cartaPdf: string | null = null;

/** Aviso que se muestra mientras el menú no esté cargado. */
export const avisoMenu =
  "La propuesta cambia según la temporada y el día. Escribinos y te contamos qué se está cocinando.";
