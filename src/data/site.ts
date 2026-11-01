/**
 * RINDE — configuración central del sitio.
 * Los valores en `null` son datos que NO fueron provistos:
 * el sitio se adapta y oculta la pieza en lugar de inventarla.
 */

export const siteUrl = "https://rinde-senko4.vercel.app";

export const brand = {
  name: "Rinde",
  wordmark: "Rinde.",
  tagline: "Entertainment Marketing",
  /** Descriptor de especialidad, para Artist Marketing y redes. */
  specialty: "Artist Marketing & Entertainment",
  signature: "Construimos marcas. Potenciamos artistas. Conectamos experiencias con audiencias.",
  city: "Argentina",
  since: "2024",
} as const;

export const contact = {
  /** Email comercial. Null = todavía no fue provisto. */
  email: null as string | null,
  /** Teléfono internacional sin signos. El botón de WhatsApp sólo aparece si existe. Provisorio: número indicado el 01/11/2026. */
  whatsapp: "5491128801462" as string | null,
  /** Cómo se muestra el número en la web. */
  whatsappDisplay: "+54 9 11 2880-1462",
  /** Endpoint real del formulario (ej: Formspree). Mientras sea null, no se simula un envío exitoso. */
  endpoint: (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined) || null,
  instagram: "https://www.instagram.com/somos.rinde/",
  instagramHandle: "@somos.rinde",
  /** Tiempo de respuesta que se comunica en la web. */
  responseTime: "24 a 48 horas hábiles",
} as const;

/** Empresa a cuyo nombre se firman los contratos y se factura (dato del usuario, 01/11/2026). */
export const company = {
  name: "Senko Intelligence",
  cuit: "30-71959078-7",
} as const;

export type NavItem = { label: string; to: string; children?: { label: string; to: string; hint: string }[] };

export const nav: NavItem[] = [
  { label: "Artist Marketing", to: "/artist-marketing" },
  {
    label: "Áreas",
    to: "/#areas",
    children: [
      { label: "Artist Marketing", to: "/artist-marketing", hint: "Artistas, managers y sellos" },
      { label: "Venue Marketing", to: "/venue-marketing", hint: "Boliches, bares y espacios" },
      { label: "Event Marketing", to: "/event-marketing", hint: "Productoras y festivales" },
      { label: "Entertainment Brands", to: "/marcas", hint: "Marcas y sponsors" },
    ],
  },
  { label: "Contenido", to: "/contenido" },
  { label: "Nosotros", to: "/nosotros" },
];

export const hero = {
  eyebrow: "RINDE — Entertainment Marketing",
  /** Cada string es una línea del titular. `accent` marca la palabra en serif itálica. */
  lines: [
    [{ text: "El entretenimiento" }],
    [{ text: "no se improvisa." }],
    [{ text: "Se " }, { text: "construye.", accent: true }],
  ] as { text: string; accent?: boolean }[][],
  support:
    "Desarrollamos estrategias de marketing, comunicación y publicidad para artistas, eventos, espacios y marcas del entretenimiento.",
  primaryCta: { label: "Trabajemos juntos", to: "/contacto" },
  secondaryCta: { label: "Conocé lo que hacemos", to: "/#areas" },
  /** Video real del hero (mp4 liviano, sin sonido). Null = composición de luces de escenario. */
  video: null as string | null,
  poster: null as string | null,
};

export const marquee = [
  "Artist Marketing",
  "Release Campaigns",
  "Audience Development",
  "Venue Marketing",
  "Event Marketing",
  "Creative Direction",
  "Performance Marketing",
  "Entertainment Brands",
];

export const intro = {
  label: "Qué es RINDE",
  title: "No vendemos publicaciones.",
  titleAccent: "Desarrollamos estrategias.",
  text: "RINDE es una agencia de marketing especializada en entretenimiento. Trabajamos con artistas, managers, productoras, venues y marcas para construir identidad, desarrollar audiencias y convertir la atención del público en resultados concretos: oyentes, entradas, reservas y contrataciones.",
};

export const pillars = [
  {
    title: "Especialización",
    text: "Trabajamos sólo en entretenimiento. Conocemos sus tiempos: lanzamientos, fechas, temporadas y giras.",
  },
  {
    title: "Visión integral",
    text: "Branding, contenido, publicidad y análisis bajo una misma estrategia.",
  },
  {
    title: "Estrategia a medida",
    text: "Primero entendemos el proyecto. Después proponemos. No vendemos paquetes cerrados.",
  },
  {
    title: "Creatividad con objetivos",
    text: "Cada pieza tiene una función: reconocimiento, comunidad, entradas, reproducciones.",
  },
  {
    title: "Trabajo colaborativo",
    text: "Nos integramos con managers, artistas y equipos existentes. No los reemplazamos.",
  },
];

export const capabilities = {
  label: "Cómo lo hacemos",
  title: "Estrategia y ejecución,",
  titleAccent: "en el mismo lugar.",
  items: [
    {
      id: "creative-production",
      name: "Creative Production",
      text: "Producimos piezas con identidad y con una intención clara: mostrar la personalidad de un artista, vender una fecha o anticipar un lanzamiento.",
      list: [
        "Dirección creativa",
        "Reels y contenido vertical",
        "Fotografía y videografía",
        "Edición audiovisual",
        "Cobertura de eventos y backstage",
        "Entrevistas",
        "Diseño gráfico y flyers",
        "Motion graphics",
        "Identidad visual de campañas",
      ],
    },
    {
      id: "performance-marketing",
      name: "Performance Marketing",
      text: "Campañas pagas para lanzamientos, shows y eventos, con segmentación por público y ciudad, y medición de lo que importa para cada objetivo.",
      list: [
        "Meta Ads y TikTok Ads",
        "Campañas de reconocimiento y alcance",
        "Tráfico a plataformas musicales",
        "Promoción de shows y venta de entradas",
        "Segmentación y remarketing",
        "Análisis y optimización de inversión",
      ],
      note: "La inversión en pauta siempre va separada de nuestros honorarios. Sabés cuánto es para RINDE y cuánto va a las plataformas.",
    },
  ],
};

export const modalities = {
  label: "Modalidades",
  title: "Cada proyecto necesita",
  titleAccent: "algo distinto.",
  items: [
    { name: "Campaña puntual", text: "Un lanzamiento, una fecha, un festival." },
    { name: "Acompañamiento mensual", text: "Estrategia, contenido y pauta de forma continua." },
    { name: "Desarrollo integral", text: "Identidad, posicionamiento y crecimiento de un artista o un espacio." },
    { name: "Producción especial", text: "Coberturas, videoclips y piezas de campaña." },
  ],
  note: "Sin paquetes cerrados ni precios de lista. Te proponemos lo que tu proyecto necesita, después de entenderlo.",
};

export const closing = {
  title: "Tu próximo proyecto",
  titleAccent: "merece una estrategia.",
  cta: { label: "Hablemos de tu proyecto", to: "/contacto" },
};

export const about = {
  label: "Sobre RINDE",
  title: "Una agencia hecha",
  titleAccent: "para el entretenimiento.",
  paragraphs: [
    "RINDE es una agencia de marketing que eligió especializarse. Trabajamos con artistas, managers, productoras, venues y marcas porque entendemos cómo funciona este negocio: sus tiempos, su público y lo que está en juego en cada lanzamiento y en cada fecha.",
    "Un artista no es una cuenta de Instagram, y un boliche no vende sólo entradas. Los dos venden identidad, experiencia y pertenencia. Por eso trabajamos de la estrategia a la ejecución: escuchamos, analizamos, diseñamos un plan y coordinamos su realización.",
  ],
  model: {
    title: "Cómo está armado el equipo",
    text: "Un núcleo que dirige la estrategia y la relación con cada cliente, y una red de especialistas en dirección creativa, producción audiovisual, diseño y publicidad digital que se suma según lo que pida cada proyecto. Vos hablás con RINDE; nosotros organizamos el equipo y respondemos por el resultado.",
  },
  principles: [
    { title: "Escuchamos antes de proponer", text: "Cada propuesta sale de un diagnóstico, no de un catálogo." },
    { title: "No prometemos viralidad", text: "Nos comprometemos con estrategia, ejecución ordenada y medición transparente." },
    { title: "No reemplazamos al manager", text: "Somos el departamento de marketing externo que trabaja junto a él." },
    { title: "Pauta y honorarios, separados", text: "Siempre sabés qué parte es inversión publicitaria y qué parte es nuestro trabajo." },
  ],
};
