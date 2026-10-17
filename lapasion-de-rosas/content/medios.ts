/**
 * ============================================================================
 * MEDIOS — Fotografías
 * ============================================================================
 *
 * ⚠️  LAS FOTOS ACTUALES SON DE REFERENCIA, GENERADAS CON IA.
 *
 * No son fotografías de La Pasión de Rosas ni de sus platos: son imágenes
 * originales, art-directadas a la paleta del sitio, que ocupan el lugar de la
 * producción fotográfica real. Sirven para ver el diseño terminado y como
 * guion de encuadres para la sesión de fotos.
 *
 * **Reemplazalas por fotos reales antes de publicar el sitio.** Un restaurante
 * mostrando platos que no son los suyos induce a error a quien reserva.
 * Cada entrada lleva `generada: true` mientras siga siendo de referencia.
 *
 * PARA CARGAR UNA FOTO REAL
 * 1. Guardá el archivo en /public/fotos/ (preferentemente .avif o .webp).
 * 2. Cambiá `src` por la ruta nueva y poné `generada: false`.
 * 3. Revisá que `alt` y `altEn` describan lo que se ve.
 *
 * Si `src` es `null`, el sitio dibuja una composición provisional hecha con
 * CSS, marcada como tal.
 */

export type TonoMedio = "fuego" | "brasa" | "carbon" | "humo";

export type Medio = {
  /** Ruta dentro de /public. `null` = todavía no hay imagen. */
  src: string | null;
  /** Ancho y alto reales del archivo, para reservar el espacio sin saltos. */
  ancho?: number;
  alto?: number;
  alt: string;
  altEn: string;
  /** Color de la composición provisional cuando `src` es null. */
  tono: TonoMedio;
  /** `true` mientras sea una imagen de referencia y no una foto del lugar. */
  generada: boolean;
  /** Encuadre para la producción fotográfica real. */
  encuadre: string;
};

export const medios = {
  hero: {
    src: "/fotos/hero.avif",
    ancho: 1920,
    alto: 1080,
    generada: true,
    alt: "Costillar sobre las brasas de la parrilla, con humo",
    altEn: "Short ribs over the embers of the grill, with smoke",
    tono: "fuego",
    encuadre:
      "Costillar entero sobre la parrilla, brasas vivas debajo y humo. Plano general bajo, luz sólo de la brasa.",
  },
  nosotros: {
    src: "/fotos/nosotros.avif",
    ancho: 802,
    alto: 1002,
    generada: true,
    alt: "Mesa servida en el salón, con una copa de vino y una vela",
    altEn: "A set table in the dining room, with a glass of wine and a candle",
    tono: "brasa",
    encuadre: "Vertical. Mesa servida en primer plano, el salón desenfocado detrás.",
  },
  fuego: {
    src: "/fotos/fuego.avif",
    ancho: 1920,
    alto: 1080,
    generada: true,
    alt: "Brasas encendidas bajo la parrilla",
    altEn: "Glowing embers under the grill",
    tono: "fuego",
    encuadre: "Horizontal. Brasas reales, sin llama abierta. Fondo que cae a negro.",
  },
  especialidad: {
    src: "/fotos/especialidad.avif",
    ancho: 1140,
    alto: 641,
    generada: true,
    alt: "El costillar en la parrilla, con la corteza a la vista",
    altEn: "The short rib rack on the grill, crust in full view",
    tono: "fuego",
    encuadre: "Plano cerrado del costillar: textura, corteza y temperatura.",
  },
  salon: {
    src: "/fotos/salon.avif",
    ancho: 2048,
    alto: 900,
    generada: true,
    alt: "El salón con sus lámparas encendidas",
    altEn: "The dining room with its lamps lit",
    tono: "carbon",
    encuadre: "Panorámica del salón preparado, antes de abrir.",
  },
  parrilla: {
    src: "/fotos/parrilla.avif",
    ancho: 1500,
    alto: 844,
    generada: true,
    alt: "La parrilla y las brasas durante el servicio",
    altEn: "The grill and embers during service",
    tono: "fuego",
    encuadre: "La parrilla trabajando: humo, brasa y las manos del asador.",
  },
  detalle: {
    src: "/fotos/detalle.avif",
    ancho: 650,
    alto: 650,
    generada: true,
    alt: "Detalle de las brasas encendidas",
    altEn: "A close detail of the glowing embers",
    tono: "humo",
    encuadre: "Macro: sal gruesa, un cuchillo gastado o el pan recién servido.",
  },
  vino: {
    src: "/fotos/vino.avif",
    ancho: 420,
    alto: 525,
    generada: true,
    alt: "Una copa de vino tinto sobre la mesa, junto a una vela",
    altEn: "A glass of red wine on the table, next to a candle",
    tono: "brasa",
    encuadre: "Copa de vino a contraluz, para que el color se lea profundo.",
  },
  reservas: {
    src: "/fotos/reservas.avif",
    ancho: 1920,
    alto: 1080,
    generada: true,
    alt: "Una mesa preparada en el salón, esperando",
    altEn: "A table set and waiting in the dining room",
    tono: "carbon",
    encuadre: "Mesa preparada, luz baja, el lugar listo para recibir.",
  },
  fachada: {
    src: null,
    generada: false,
    alt: "El frente del lugar al anochecer",
    altEn: "The entrance at dusk",
    tono: "humo",
    encuadre:
      "Vertical. Fachada al anochecer, con la luz interior encendida y la vereda iluminada.",
  },
} satisfies Record<string, Medio>;

export type ClaveMedio = keyof typeof medios;

/** Video de portada. Si es null, la portada usa `medios.hero`. */
export const videoPortada: string | null = null;

/** ¿Queda alguna imagen de referencia sin reemplazar? Lo usa el aviso del sitio. */
export const hayMediosGenerados = Object.values(medios).some((m) => m.generada);
