/**
 * Las cuatro áreas de RINDE. Cada una tiene su página (/artist-marketing, /venue-marketing,
 * /event-marketing, /marcas) y su tarjeta en la home. Artist Marketing es la especialidad
 * principal y tiene contenido extra (etapas de lanzamiento, rol frente al manager).
 */

export type AreaId = "artista" | "venue" | "evento" | "marca";

export type AreaBlock = { title: string; text: string; items: string[] };

export type Area = {
  id: AreaId;
  path: string;
  index: string;
  name: string;
  /** A quién le habla, en una línea. */
  audience: string;
  /** Texto del selector "¿Qué proyecto tenés entre manos?" en la home. */
  selector: { label: string; cta: string };
  /** Tarjeta en la home. */
  card: { title: string; text: string };
  /** Página propia. */
  page: {
    title: string;
    titleAccent: string;
    lead: string;
    problem: { title: string; text: string };
    audiences: string[];
    blocks: AreaBlock[];
    goals: string[];
    integration: string;
    cta: { question: string; label: string };
  };
  seo: { title: string; description: string };
};

export const releasePhases = [
  {
    name: "Prelanzamiento",
    text: "Construimos expectativa y narrativa antes de que salga la canción.",
    items: ["Concepto y narrativa", "Teasers y contenido anticipado", "Campañas de intriga", "Pre-save y aviso a la comunidad"],
  },
  {
    name: "Lanzamiento",
    text: "Concentramos la comunicación para que el estreno llegue a quien tiene que llegar.",
    items: ["Piezas gráficas y audiovisuales", "Publicidad digital", "Coordinación de publicaciones", "Acciones con comunidades"],
  },
  {
    name: "Postlanzamiento",
    text: "Extendemos la vida de la canción más allá de la primera semana.",
    items: ["Reutilización creativa del material", "Impulso de fragmentos destacados", "Continuidad de contenido", "Análisis de resultados"],
  },
];

export const areas: Area[] = [
  {
    id: "artista",
    path: "/artist-marketing",
    index: "01",
    name: "Artist Marketing",
    audience: "Artistas, managers, sellos y discográficas",
    selector: { label: "Artista o manager", cta: "Potenciá tu proyecto artístico" },
    card: {
      title: "Un artista no es una cuenta de Instagram. Es una marca.",
      text: "Identidad, comunicación, lanzamientos y crecimiento de audiencias para proyectos musicales, junto al manager y al equipo del artista.",
    },
    page: {
      title: "Estrategia para",
      titleAccent: "carreras musicales.",
      lead: "Desarrollamos la marca, la comunicación y el crecimiento de artistas, en coordinación con su manager y su equipo.",
      problem: {
        title: "La música es buena. Lo que falta es un plan.",
        text: "Muchos artistas publican sin estrategia, lanzan canciones sin campaña y suman seguidores sin construir una comunidad. El resultado es esfuerzo disperso: contenido que no se conecta con la música, lanzamientos que pasan en una semana y un público que no se convierte en oyentes ni en entradas vendidas.",
      },
      audiences: ["Artistas emergentes y en crecimiento", "Managers y representantes", "Sellos independientes y discográficas", "Equipos de artistas que quieren profesionalizar su comunicación"],
      blocks: [
        {
          title: "Artist Branding & Identity",
          text: "Una identidad clara y consistente que diferencie al artista y genere reconocimiento.",
          items: ["Análisis de identidad e imagen actual", "Posicionamiento y diferenciales", "Universo visual y dirección creativa", "Tono y personalidad comunicacional", "Análisis de referentes y competencia"],
        },
        {
          title: "Digital Marketing",
          text: "Presencia digital con intención: cada contenido cumple una función.",
          items: ["Estrategia de Instagram, TikTok y YouTube", "Planificación y formatos propios", "Detrás de escena y contenido de personalidad", "Gestión de redes y optimización de perfiles", "Análisis de rendimiento"],
        },
        {
          title: "Release Marketing",
          text: "Cada canción o videoclip con su campaña, en tres etapas.",
          items: ["Prelanzamiento", "Lanzamiento", "Postlanzamiento"],
        },
        {
          title: "Audience Development",
          text: "Una comunidad real: que te conozcan, te escuchen, vayan a tus shows y se queden.",
          items: ["Identificación del público objetivo", "Conexión entre redes y plataformas musicales", "Fidelización de seguidores", "Expansión a nuevas ciudades"],
        },
        {
          title: "Performance Marketing",
          text: "Pauta para lanzamientos y shows, con segmentación y medición.",
          items: ["Meta Ads y TikTok Ads", "Tráfico a Spotify, YouTube y plataformas", "Promoción de fechas", "Remarketing y optimización"],
        },
      ],
      goals: ["Más reconocimiento", "Lanzamientos con campaña", "Oyentes y comunidad reales", "Más convocatoria en shows", "Una imagen profesional para nuevas contrataciones"],
      integration: "Artist Marketing se apoya en Creative Production para el contenido y en Performance Marketing para la pauta. Cuando hay shows, se conecta con Event Marketing.",
      cta: { question: "¿Sos manager o formás parte del equipo de un artista?", label: "Hablemos de tu artista" },
    },
    seo: {
      title: "Artist Marketing — Estrategia para artistas y managers | RINDE",
      description: "Branding de artista, estrategia digital, campañas de lanzamiento, desarrollo de audiencias y publicidad para proyectos musicales. Trabajamos junto al manager.",
    },
  },
  {
    id: "venue",
    path: "/venue-marketing",
    index: "02",
    name: "Venue Marketing",
    audience: "Boliches, bares, discotecas y espacios de entretenimiento",
    selector: { label: "Boliche, bar o venue", cta: "Profesionalizá la comunicación de tu espacio" },
    card: {
      title: "Un boliche no vende entradas. Vende una noche.",
      text: "Identidad, contenido y campañas para que tu espacio sea el lugar al que la gente quiere ir, y al que vuelve.",
    },
    page: {
      title: "Un boliche no vende entradas.",
      titleAccent: "Vende una noche.",
      lead: "Construimos la identidad y la comunicación de tu espacio para que la gente lo elija, vuelva y lo recomiende.",
      problem: {
        title: "Publicar más no es comunicar mejor.",
        text: "Muchos espacios suben flyers todas las semanas y aun así no se diferencian. El problema no es la cantidad de posteos: es que la comunicación no transmite qué noche se vive ahí, qué música suena ni por qué ir este sábado y no otro.",
      },
      audiences: ["Boliches y discotecas", "Bares con propuesta musical", "Espacios de shows y eventos", "Grupos que manejan varios locales"],
      blocks: [
        {
          title: "Identidad y posicionamiento",
          text: "Qué es tu espacio, para quién es y por qué es distinto.",
          items: ["Posicionamiento del establecimiento", "Identidad visual y dirección creativa", "Tono de comunicación"],
        },
        {
          title: "Contenido y cobertura",
          text: "Mostrar la experiencia, no sólo anunciarla.",
          items: ["Producción de Reels", "Cobertura audiovisual de noches", "Entrevistas a invitados", "Contenido con artistas"],
        },
        {
          title: "Convocatoria",
          text: "Que cada fecha llegue con expectativa.",
          items: ["Calendario de eventos", "Campañas por fecha", "Comunicación de promociones", "Pauta local segmentada"],
        },
        {
          title: "Comunidad y medición",
          text: "Saber qué funciona y construir público fiel.",
          items: ["Desarrollo de comunidad", "Seguimiento de reservas y asistencia", "Análisis de resultados"],
        },
      ],
      goals: ["Más asistencia y reservas", "Una identidad reconocible en la ciudad", "Fechas con expectativa previa", "Público que vuelve"],
      integration: "Venue Marketing combina Creative Production para la cobertura de cada noche y Performance Marketing para la convocatoria local.",
      cta: { question: "¿Tenés un boliche, bar o espacio de entretenimiento?", label: "Profesionalizá la comunicación de tu espacio" },
    },
    seo: {
      title: "Venue Marketing — Marketing para boliches, bares y espacios | RINDE",
      description: "Posicionamiento, contenido, cobertura y campañas de convocatoria para boliches, bares, discotecas y espacios de entretenimiento.",
    },
  },
  {
    id: "evento",
    path: "/event-marketing",
    index: "03",
    name: "Event Marketing",
    audience: "Productoras, festivales, shows y organizadores",
    selector: { label: "Productora o evento", cta: "Impulsá tu próximo evento" },
    card: {
      title: "Cada evento tiene su campaña.",
      text: "Estrategia de lanzamiento, piezas, pauta y cobertura para vender entradas y generar expectativa.",
    },
    page: {
      title: "Cada evento",
      titleAccent: "tiene su campaña.",
      lead: "Diseñamos y ejecutamos la promoción de shows, recitales y festivales: del anuncio al contenido posterior.",
      problem: {
        title: "Una fecha de boliche no se vende como un festival.",
        text: "Cambian el público, la ubicación, la capacidad, el precio, el calendario y los tiempos de venta. Una campaña copiada de otro evento suele llegar tarde o hablarle a la gente equivocada. Cada evento necesita su propio plan.",
      },
      audiences: ["Productoras de shows y recitales", "Festivales", "Organizadores de fiestas y ciclos", "Artistas que producen su propia fecha"],
      blocks: [
        {
          title: "Estrategia de lanzamiento",
          text: "Un plan por etapas, según los tiempos de venta.",
          items: ["Anuncio, preventa, venta general y última semana", "Identidad visual de campaña", "Comunicación de fechas y horarios"],
        },
        {
          title: "Piezas y contenido",
          text: "Material que genera ganas de estar ahí.",
          items: ["Flyers y piezas promocionales", "Video promocional", "Promoción de artistas participantes"],
        },
        {
          title: "Venta de entradas",
          text: "Pauta orientada a resultados medibles.",
          items: ["Campañas de publicidad digital", "Segmentación por zona y gustos", "Remarketing a interesados"],
        },
        {
          title: "Cobertura",
          text: "El evento también es contenido para el próximo.",
          items: ["Cobertura y backstage", "Entrevistas", "Aftermovie y contenido posterior", "Análisis de rendimiento"],
        },
      ],
      goals: ["Vender entradas", "Generar expectativa", "Posicionar la marca del evento", "Contenido para la próxima edición"],
      integration: "Event Marketing usa Creative Production para piezas y cobertura, y Performance Marketing para la venta. Si el evento tiene un artista principal, se coordina con su estrategia.",
      cta: { question: "¿Producís shows, recitales o festivales?", label: "Impulsá tu próximo evento" },
    },
    seo: {
      title: "Event Marketing — Promoción de shows y festivales | RINDE",
      description: "Estrategia de lanzamiento, piezas, publicidad digital para venta de entradas y cobertura de shows, recitales y festivales.",
    },
  },
  {
    id: "marca",
    path: "/marcas",
    index: "04",
    name: "Entertainment Brands",
    audience: "Marcas y empresas vinculadas a la música, la noche y el espectáculo",
    selector: { label: "Marca o sponsor", cta: "Conectá tu marca con el entretenimiento" },
    card: {
      title: "Marcas que quieren estar donde está el público.",
      text: "Conectamos marcas con artistas, eventos y comunidades musicales, con acciones que suman a la experiencia.",
    },
    page: {
      title: "El público ya está en el show.",
      titleAccent: "Tu marca puede estar ahí.",
      lead: "Conectamos marcas con artistas, eventos y comunidades musicales de forma genuina.",
      problem: {
        title: "Poner un logo no es estar presente.",
        text: "Patrocinar un evento no garantiza que el público recuerde la marca. Lo que funciona es una presencia que suma a la experiencia: contenido con artistas, activaciones con sentido y campañas pensadas para esa audiencia.",
      },
      audiences: ["Bebidas", "Indumentaria y accesorios", "Tecnología", "Gastronomía y lifestyle", "Sponsors de eventos"],
      blocks: [
        {
          title: "Estrategia",
          text: "Qué artistas, eventos y comunidades tienen sentido para tu marca.",
          items: ["Estrategia de marca en entretenimiento", "Selección de artistas y eventos afines", "Desarrollo de colaboraciones"],
        },
        {
          title: "Campañas con artistas",
          text: "Contenido que el público quiere ver.",
          items: ["Campañas y contenido con artistas", "Marketing de contenidos", "Producción audiovisual"],
        },
        {
          title: "Activaciones y patrocinios",
          text: "Presencia en eventos que se recuerda.",
          items: ["Activaciones en eventos", "Patrocinios", "Acciones con comunidades"],
        },
        {
          title: "Difusión",
          text: "Que la acción llegue más allá del evento.",
          items: ["Publicidad digital", "Campañas de posicionamiento", "Medición de alcance y resultados"],
        },
      ],
      goals: ["Asociar la marca a experiencias", "Llegar a audiencias jóvenes y comprometidas", "Contenido con artistas", "Presencia medible en eventos"],
      integration: "Entertainment Brands se conecta con Artist Marketing y Event Marketing para encontrar los artistas y eventos adecuados, y con Creative Production para el contenido.",
      cta: { question: "¿Tu marca quiere conectar con el entretenimiento?", label: "Conectá tu marca con el entretenimiento" },
    },
    seo: {
      title: "Entertainment Brands — Marcas, artistas y eventos | RINDE",
      description: "Estrategia, campañas con artistas, activaciones y patrocinios para marcas que quieren conectar con la música, la noche y el espectáculo.",
    },
  },
];

export const areaById = (id: AreaId) => areas.find((a) => a.id === id)!;
export const areaByPath = (path: string) => areas.find((a) => a.path === path);
