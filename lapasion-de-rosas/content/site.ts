/**
 * ============================================================================
 * FUENTE UNICA DE CONTENIDO - La Pasion de Rosas
 * ============================================================================
 *
 * Todo el texto, los datos de contacto y las imagenes del sitio se editan
 * desde este archivo. No hace falta tocar ningun componente.
 *
 * SOBRE EL CAMPO `verificado`
 * ---------------------------
 * Cada dato sensible (direccion, telefono, horarios, numeros publicos) lleva
 * un flag `verificado`. Mientras este en `false`, el sitio NO publica el valor:
 * muestra en su lugar una via de contacto directa. Esto evita que informacion
 * sin confirmar del restaurante salga publicada como si fuera oficial.
 *
 * Para publicar un dato: confirmalo con el restaurante, escribilo abajo y
 * pone `verificado: true`. Ver VERIFICAR.md para la lista completa pendiente.
 */

export type DatoVerificable<T> = {
  valor: T;
  verificado: boolean;
  /** Nota interna para quien edita. Nunca se muestra al visitante. */
  nota?: string;
};

const dato = <T,>(valor: T, verificado: boolean, nota?: string): DatoVerificable<T> => ({
  valor,
  verificado,
  nota,
});

/** Devuelve el valor solo si fue confirmado; si no, `null`. */
export function siVerificado<T>(d: DatoVerificable<T>): T | null {
  return d.verificado ? d.valor : null;
}

/* -------------------------------------------------------------------------- */
/* MARCA                                                                      */
/* -------------------------------------------------------------------------- */

export const marca = {
  nombre: "La Pasión de Rosas",
  nombreCorto: "La Pasión de Rosas",
  concepto: "El arte de encontrarse",
  ciudad: "Ezeiza",
  provincia: "Buenos Aires",
  pais: "Argentina",
  /**
   * Logotipo oficial. Coloca el archivo en /public y actualiza la ruta.
   * Mientras `archivo` sea null, el sitio compone el nombre tipograficamente
   * (no se redibuja ni se inventa un logotipo).
   */
  logo: {
    archivo: null as string | null,
    ancho: 320,
    alto: 96,
    alt: "La Pasión de Rosas",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* CONTACTO                                                                   */
/* -------------------------------------------------------------------------- */

export const contacto = {
  /**
   * WhatsApp: unico canal de reserva confirmado publicamente.
   * Formato internacional sin signos, sin espacios: 54911XXXXXXXX
   */
  whatsapp: dato(
    "",
    false,
    "PENDIENTE. Fuentes de terceros listan numeros distintos y desactualizados. Pedir el numero oficial al restaurante.",
  ),
  telefono: dato("", false, "PENDIENTE. Confirmar telefono de atencion."),
  email: dato("", false, "PENDIENTE. Confirmar casilla de contacto."),

  direccion: dato(
    "",
    false,
    "PENDIENTE. Las fuentes publicas se contradicen (Berutti 287 vs. A. U. Illia 710). Confirmar con el restaurante.",
  ),
  localidad: dato("Ezeiza, Provincia de Buenos Aires", true),
  /** URL de Google Maps del local. */
  mapaUrl: dato("", false, "PENDIENTE. Pegar el enlace oficial de Google Maps."),
  /** Coordenadas para el mapa embebido. */
  coordenadas: dato<{ lat: number; lng: number } | null>(null, false, "PENDIENTE."),

  /**
   * Horarios. Mientras `verificado` sea false el sitio invita a consultar
   * por WhatsApp en lugar de mostrar dias y horas sin confirmar.
   */
  horarios: dato<{ dia: string; franja: string }[]>(
    [],
    false,
    "PENDIENTE. Fuentes de terceros se contradicen. Confirmar dias y turnos reales.",
  ),
} as const;

/* -------------------------------------------------------------------------- */
/* REDES                                                                      */
/* -------------------------------------------------------------------------- */

export const redes = {
  instagram: dato(
    { usuario: "la_pasion_de_rosas", url: "https://www.instagram.com/la_pasion_de_rosas/" },
    false,
    "Confirmar que sea el perfil oficial vigente antes de publicar.",
  ),
  /**
   * Cantidad de seguidores. Solo se muestra si el restaurante la aprueba y
   * esta actualizada. Nunca usar un contador estimado.
   */
  seguidores: dato<number | null>(
    null,
    false,
    "El brief menciona +160.000. No se publica hasta confirmarlo con el restaurante.",
  ),
  facebook: dato("", false),
  tripadvisor: dato("", false),
} as const;

/* -------------------------------------------------------------------------- */
/* RESERVAS                                                                   */
/* -------------------------------------------------------------------------- */

export const reservas = {
  /**
   * "whatsapp"  -> el formulario arma un mensaje precargado (recomendado hoy).
   * "email"     -> abre el cliente de correo con la consulta.
   * "plataforma"-> redirige a un sistema externo (completar `plataformaUrl`).
   */
  canal: "whatsapp" as "whatsapp" | "email" | "plataforma",
  plataformaUrl: dato("", false, "Completar solo si se contrata un sistema de reservas."),
  /**
   * El restaurante funciona con reserva previa. No se confirma ninguna
   * solicitud de forma automatica desde el sitio.
   */
  confirmacionAutomatica: false,
  avisoConfirmacion:
    "Tu solicitud queda sujeta a confirmación del restaurante. Te respondemos por el mismo canal.",
  avisoDatos:
    "Usamos tus datos únicamente para responder esta consulta. No los compartimos con terceros.",
} as const;

/* -------------------------------------------------------------------------- */
/* TEXTOS DE LAS SECCIONES                                                    */
/* -------------------------------------------------------------------------- */

export const textos = {
  preloader: {
    linea: "Una experiencia por descubrir.",
  },

  hero: {
    kicker: "Ezeiza · Buenos Aires",
    tituloLinea1: "Hay encuentros",
    tituloLinea2: "que merecen un lugar",
    tituloEnfasis: "extraordinario.",
    bajada:
      "En Ezeiza, una experiencia donde la gastronomía, el ambiente y los momentos especiales se encuentran.",
    ctaPrimario: "Reservá tu mesa",
    ctaSecundario: "Descubrí la experiencia",
    scroll: "Descubrí lo que nos hace diferentes.",
  },

  historia: {
    indice: "01",
    etiqueta: "La experiencia",
    titulo: "Hay lugares que se descubren.",
    tituloEnfasis: "Y no se olvidan.",
    parrafos: [
      "En Ezeiza, La Pasión de Rosas invita a vivir la gastronomía desde otro lugar. Un espacio donde el ambiente, los sabores y cada encuentro forman parte de una experiencia que merece ser compartida.",
      "Se cocina para pocos. Cada servicio se prepara con tiempo, y cada mesa se reserva con anticipación. Eso es lo que permite que la noche tenga su propio ritmo.",
    ],
    firma: "LA PASIÓN DE ROSAS — EZEIZA",
  },

  fuego: {
    indice: "02",
    etiqueta: "Gastronomía",
    titulo: "El fuego despierta",
    tituloEnfasis: "los sentidos.",
    bajada: "Brasas, tiempo y paciencia. El resto llega solo.",
  },

  gastronomia: {
    titulo: "Una experiencia que comienza",
    tituloEnfasis: "con los sentidos.",
    bajada:
      "Sabores, texturas y momentos que convierten una comida en algo para recordar.",
    cta: "Explorá nuestra propuesta gastronómica",
  },

  ocasiones: {
    indice: "03",
    etiqueta: "Encuentros",
    titulo: "Un lugar.",
    tituloEnfasis: "Infinitas razones para encontrarse.",
    bajada:
      "Hay momentos que merecen salir de lo cotidiano. Elegí la ocasión. Nosotros te invitamos a descubrir el escenario.",
  },

  selector: {
    titulo: "¿Qué momento querés vivir?",
    bajada: "Elegí la ocasión y te acercamos la forma más simple de consultarnos.",
  },

  espacios: {
    indice: "04",
    etiqueta: "El lugar",
    titulo: "El escenario también forma parte",
    tituloEnfasis: "de la experiencia.",
    bajada:
      "Cada encuentro tiene su propio ritmo. Descubrí los detalles, la atmósfera y los espacios que hacen de La Pasión de Rosas un lugar para disfrutar.",
  },

  social: {
    titulo: "Una experiencia que sigue",
    tituloEnfasis: "dando que hablar.",
    bajada: "Lo que se cuenta del lugar, contado por quienes estuvieron.",
  },

  galeria: {
    indice: "05",
    etiqueta: "Galería",
    titulo: "Momentos que hablan",
    tituloEnfasis: "por sí solos.",
  },

  reservas: {
    indice: "06",
    etiqueta: "Reservas",
    titulo: "Tu próximo gran momento",
    tituloEnfasis: "comienza acá.",
    bajada: "Elegí cuándo querés visitarnos y contanos qué ocasión te trae a nuestra mesa.",
  },

  ubicacion: {
    titulo: "Una experiencia para descubrir",
    tituloEnfasis: "en Ezeiza.",
    bajada:
      "Hay lugares que se convierten en parte de una historia. Encontrá el camino hacia tu próximo encuentro.",
    cta: "Cómo llegar",
  },

  cierre: {
    frase: "Los mejores encuentros merecen un lugar para recordarlos.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* NAVEGACION                                                                 */
/* -------------------------------------------------------------------------- */

export const navegacion = [
  { id: "experiencia", etiqueta: "La experiencia" },
  { id: "gastronomia", etiqueta: "Gastronomía" },
  { id: "encuentros", etiqueta: "Encuentros" },
  { id: "espacios", etiqueta: "Espacios" },
  { id: "galeria", etiqueta: "Galería" },
  { id: "reservas", etiqueta: "Reservas" },
] as const;

/* -------------------------------------------------------------------------- */
/* SEO                                                                        */
/* -------------------------------------------------------------------------- */

export const seo = {
  titulo: "La Pasión de Rosas — Restaurante en Ezeiza, Buenos Aires",
  tituloCorto: "La Pasión de Rosas",
  descripcion:
    "Una experiencia gastronómica en Ezeiza, Buenos Aires. Cenas especiales, encuentros familiares, reuniones y celebraciones alrededor de una mesa. Reservá tu lugar.",
  palabras: [
    "restaurante en Ezeiza",
    "experiencia gastronómica Ezeiza",
    "cena especial Ezeiza",
    "restaurante para celebraciones Buenos Aires",
    "parrilla Ezeiza",
    "costillar asado Ezeiza",
  ],
  /** Imagen para compartir en WhatsApp y redes. Se genera en /opengraph-image. */
  locale: "es_AR",
} as const;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://lapasionderosas.com.ar";
