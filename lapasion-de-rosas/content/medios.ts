/**
 * ============================================================================
 * MEDIOS — Fotografías
 * ============================================================================
 * Mientras `src` sea `null`, el componente <Medio /> dibuja una composición
 * provisional (CSS, sin fotografía) con una marca visible. No se usan fotos de
 * otros restaurantes haciéndolas pasar por propias.
 *
 * Para publicar una foto real: guardala en /public/fotos/ y escribí la ruta.
 */

export type TonoMedio = "fuego" | "brasa" | "carbon" | "humo";

export type Medio = {
  src: string | null;
  alt: string;
  altEn: string;
  tono: TonoMedio;
  /** Encuadre sugerido para la producción fotográfica. */
  encuadre: string;
};

export const medios = {
  hero: {
    src: null,
    alt: "Costillar sobre las brasas, con humo",
    altEn: "Short ribs over the embers, with smoke",
    tono: "fuego",
    encuadre: "Costillar sobre la parrilla, brasas vivas y humo. Plano cerrado, luz cálida.",
  },
  nosotros: {
    src: null,
    alt: "Mesa servida en el salón",
    altEn: "A set table in the dining room",
    tono: "brasa",
    encuadre: "Vertical. Mesa servida, el salón desenfocado detrás.",
  },
  fuego: {
    src: null,
    alt: "Brasas bajo la parrilla",
    altEn: "Embers under the grill",
    tono: "fuego",
    encuadre: "Horizontal. Brasas reales, fondo oscuro. Sin llamas abiertas.",
  },
  especialidad: {
    src: null,
    alt: "El costillar recién salido de la parrilla",
    altEn: "The short ribs fresh off the grill",
    tono: "fuego",
    encuadre: "El costillar entero, con su corte a la vista. Textura y temperatura.",
  },
  salon: {
    src: null,
    alt: "El salón antes del servicio",
    altEn: "The dining room before service",
    tono: "carbon",
    encuadre: "Panorámica del salón vacío y preparado, antes de abrir.",
  },
  parrilla: {
    src: null,
    alt: "La parrilla durante el servicio",
    altEn: "The grill during service",
    tono: "fuego",
    encuadre: "La parrilla trabajando. Humo, brasa, manos del asador.",
  },
  detalle: {
    src: null,
    alt: "Detalle de la mesa",
    altEn: "A detail of the table",
    tono: "humo",
    encuadre: "Macro: copa, cubierto, sal gruesa o pan recién servido.",
  },
  vino: {
    src: null,
    alt: "Copa de vino tinto servida",
    altEn: "A glass of red wine",
    tono: "brasa",
    encuadre: "Copa de vino con luz detrás, para que el color se lea profundo.",
  },
  reservas: {
    src: null,
    alt: "Mesa preparada esperando a los comensales",
    altEn: "A table set and waiting",
    tono: "carbon",
    encuadre: "Mesa preparada, luz baja, el lugar listo para recibir.",
  },
  fachada: {
    src: null,
    alt: "El frente del lugar al anochecer",
    altEn: "The entrance at dusk",
    tono: "humo",
    encuadre: "Fachada de noche, con la luz interior encendida.",
  },
} satisfies Record<string, Medio>;

export type ClaveMedio = keyof typeof medios;

/** Video de portada. Si es null, la portada usa `medios.hero`. */
export const videoPortada: string | null = null;
