/**
 * ============================================================================
 * MEDIOS — Fotografías y video
 * ============================================================================
 *
 * El sitio NO usa fotos de otros restaurantes ni imágenes de stock disfrazadas
 * de material propio. Mientras `src` sea `null`, el componente <Medio /> dibuja
 * una composición provisional —generada con CSS, sin fotografía— que lleva una
 * marca visible y el encuadre sugerido para la producción fotográfica.
 *
 * PARA PUBLICAR UNA FOTO REAL
 * 1. Guardá el archivo en /public/fotos/ (preferentemente .avif o .webp).
 * 2. Escribí la ruta en `src` (ej: "/fotos/costillar.avif").
 * 3. Revisá que el `alt` describa la imagen.
 * La marca de "imagen provisional" desaparece sola.
 */

export type TonoMedio = "brasa" | "borgona" | "carbon" | "oro";
export type RatioMedio = "4/5" | "3/4" | "1/1" | "16/9" | "21/9";

export type Medio = {
  /** Ruta de la foto real dentro de /public. `null` = aún no entregada. */
  src: string | null;
  /** Texto alternativo. Describí la escena, no la marca. */
  alt: string;
  ratio: RatioMedio;
  /** Temperatura de la composición provisional. */
  tono: TonoMedio;
  /** Encuadre sugerido para la producción fotográfica. */
  encuadre: string;
};

const medio = (m: Medio): Medio => m;

export const medios = {
  /* --- Portada ------------------------------------------------------------ */
  heroPoster: medio({
    src: null,
    alt: "Salón de La Pasión de Rosas con iluminación cálida y mesas preparadas.",
    ratio: "16/9",
    tono: "brasa",
    encuadre:
      "Plano general del salón al caer la noche. Cámara a la altura de la mesa, movimiento lento hacia adelante. Luz cálida, sombras profundas.",
  }),

  /* --- Historia ----------------------------------------------------------- */
  historiaPrincipal: medio({
    src: null,
    alt: "Interior del restaurante: mesa servida y luz cálida sobre la madera.",
    ratio: "4/5",
    tono: "borgona",
    encuadre:
      "Vertical. Una mesa preparada en primer plano, el salón desenfocado detrás. Copa con reflejo cálido.",
  }),
  historiaDetalle: medio({
    src: null,
    alt: "Detalle de la mesa: copa, cubiertos y un reflejo de luz.",
    ratio: "1/1",
    tono: "oro",
    encuadre: "Cuadrado. Macro de un detalle real: copa, mantel, cubierto o pan recién servido.",
  }),

  /* --- Gastronomía -------------------------------------------------------- */
  platoPrincipal: medio({
    src: null,
    alt: "Costillar asado recién servido, con su corte a la vista.",
    ratio: "3/4",
    tono: "brasa",
    encuadre:
      "Vertical. Plano cercano del costillar. Textura y temperatura visibles. Luz lateral cálida.",
  }),
  platoBrasas: medio({
    src: null,
    alt: "Brasas encendidas bajo la parrilla.",
    ratio: "16/9",
    tono: "brasa",
    encuadre: "Horizontal. Brasas reales, fondo oscuro. Sin llamas abiertas, solo rescoldo.",
  }),
  platoDetalle: medio({
    src: null,
    alt: "Detalle de una guarnición servida en la mesa.",
    ratio: "1/1",
    tono: "carbon",
    encuadre: "Cuadrado. Detalle de textura: una guarnición, el pan, la sal gruesa.",
  }),
  vino: medio({
    src: null,
    alt: "Copa de vino tinto servida sobre la mesa.",
    ratio: "4/5",
    tono: "borgona",
    encuadre: "Vertical. Copa de vino con luz detrás, para que el color se lea profundo.",
  }),

  /* --- Ocasiones ---------------------------------------------------------- */
  ocasionCena: medio({
    src: null,
    alt: "Mesa para dos preparada con luz cálida.",
    ratio: "4/5",
    tono: "borgona",
    encuadre: "Vertical. Mesa para dos, vela o luz baja. Íntimo, sin clichés románticos.",
  }),
  ocasionFamilia: medio({
    src: null,
    alt: "Mesa larga compartida en el salón del restaurante.",
    ratio: "4/5",
    tono: "brasa",
    encuadre: "Vertical. Mesa larga servida. Calidez y cercanía, platos para compartir.",
  }),
  ocasionTrabajo: medio({
    src: null,
    alt: "Mesa preparada con mantelería sobria en un sector tranquilo del salón.",
    ratio: "4/5",
    tono: "carbon",
    encuadre: "Vertical. Mesa sobria, luz pareja. Elegante y tranquilo, sin estética corporativa.",
  }),
  ocasionCelebracion: medio({
    src: null,
    alt: "Brindis durante una celebración en el restaurante.",
    ratio: "4/5",
    tono: "oro",
    encuadre: "Vertical. Copas en alto durante un brindis. Movimiento real, no posado.",
  }),

  /* --- Espacios ----------------------------------------------------------- */
  espacioPanoramica: medio({
    src: null,
    alt: "Vista panorámica del salón principal.",
    ratio: "21/9",
    tono: "carbon",
    encuadre: "Panorámica del salón completo, vacío y preparado, antes del servicio.",
  }),
  espacioDetalleLuz: medio({
    src: null,
    alt: "Detalle de la iluminación del salón.",
    ratio: "3/4",
    tono: "oro",
    encuadre: "Vertical. Una lámpara, un reflejo sobre la madera, una textura de pared.",
  }),
  espacioMesa: medio({
    src: null,
    alt: "Mesa preparada junto a la ventana.",
    ratio: "4/5",
    tono: "borgona",
    encuadre: "Vertical. Rincón característico del lugar, el que lo hace reconocible.",
  }),
  espacioParrilla: medio({
    src: null,
    alt: "La parrilla durante el servicio.",
    ratio: "16/9",
    tono: "brasa",
    encuadre: "Horizontal. La parrilla en pleno trabajo. Humo, brasa, manos del asador.",
  }),

  /* --- Ubicación ---------------------------------------------------------- */
  fachada: medio({
    src: null,
    alt: "Frente del restaurante al anochecer.",
    ratio: "4/5",
    tono: "carbon",
    encuadre: "Vertical. Fachada de noche, con la luz interior encendida.",
  }),
} satisfies Record<string, Medio>;

export type ClaveMedio = keyof typeof medios;

/**
 * Video de portada. Mientras `src` sea null, la portada usa `medios.heroPoster`.
 * Subí un MP4 comprimido (H.264, sin audio, ~8-12 s en loop) a /public/video/.
 */
export const videoPortada: { src: string | null; poster: ClaveMedio } = {
  src: null,
  poster: "heroPoster",
};
