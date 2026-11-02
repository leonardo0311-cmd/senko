export type EnlaceNav = {
  texto: string;
  href: string;
  /** Descripcion corta para el menu movil y el pie de pagina. */
  detalle?: string;
};

/** Menu principal del encabezado. */
export const NAV_PRINCIPAL: EnlaceNav[] = [
  { texto: 'Inicio', href: '/', detalle: 'Volver a la portada' },
  { texto: 'Nosotros', href: '/nosotros/', detalle: 'Quiénes somos y cómo pensamos la kinesiología' },
  { texto: 'Servicios', href: '/servicios/', detalle: 'Las cinco áreas de atención del consultorio' },
  { texto: 'Especialidades', href: '/especialidades/', detalle: 'Motivos de consulta y tratamientos' },
  { texto: 'Cómo trabajamos', href: '/como-trabajamos/', detalle: 'Qué esperar, paso a paso' },
  { texto: 'Equipo', href: '/profesionales/', detalle: 'Los profesionales del consultorio' },
  { texto: 'Instalaciones', href: '/instalaciones/', detalle: 'El espacio donde atendemos' },
  { texto: 'Blog', href: '/blog/', detalle: 'Salud, movimiento y prevención' },
  { texto: 'Preguntas frecuentes', href: '/preguntas-frecuentes/', detalle: 'Dudas habituales antes de consultar' },
  { texto: 'Contacto', href: '/contacto/', detalle: 'Turnos, ubicación y canales de contacto' },
];

/**
 * Enlaces que se muestran siempre visibles en la barra de escritorio.
 * El resto queda dentro del menu "Más", para que el encabezado no se sature.
 */
export const NAV_DESTACADA: EnlaceNav[] = NAV_PRINCIPAL.filter((e) =>
  ['/nosotros/', '/servicios/', '/especialidades/', '/como-trabajamos/', '/contacto/'].includes(e.href),
);

export const NAV_SECUNDARIA: EnlaceNav[] = NAV_PRINCIPAL.filter((e) =>
  ['/profesionales/', '/instalaciones/', '/blog/', '/preguntas-frecuentes/'].includes(e.href),
);

/** Columnas del pie de pagina. */
export const NAV_PIE: Array<{ titulo: string; enlaces: EnlaceNav[] }> = [
  {
    titulo: 'El consultorio',
    enlaces: [
      { texto: 'Nosotros', href: '/nosotros/' },
      { texto: 'Cómo trabajamos', href: '/como-trabajamos/' },
      { texto: 'Equipo profesional', href: '/profesionales/' },
      { texto: 'Instalaciones', href: '/instalaciones/' },
    ],
  },
  {
    titulo: 'Atención',
    enlaces: [
      { texto: 'Todos los servicios', href: '/servicios/' },
      { texto: 'Kinesiología deportiva', href: '/servicios/kinesiologia-deportiva/' },
      { texto: 'Lesiones: tratamiento y prevención', href: '/servicios/tratamiento-y-prevencion-de-lesiones/' },
      { texto: 'Prevención de caídas', href: '/servicios/prevencion-de-caidas/' },
      { texto: 'Suelo pélvico', href: '/servicios/suelo-pelvico/' },
      { texto: 'MEP', href: '/servicios/mep/' },
    ],
  },
  {
    titulo: 'Información',
    enlaces: [
      { texto: 'Especialidades y tratamientos', href: '/especialidades/' },
      { texto: 'Preguntas frecuentes', href: '/preguntas-frecuentes/' },
      { texto: 'Blog', href: '/blog/' },
      { texto: 'Contacto y turnos', href: '/contacto/' },
      { texto: 'Política de privacidad', href: '/politica-de-privacidad/' },
    ],
  },
];
