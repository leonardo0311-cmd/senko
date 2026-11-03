/**
 * NAVEGACION DE LA LANDING
 *
 * El sitio es una sola página larga, así que la navegación son anclas a las
 * secciones. Las únicas páginas aparte son la política de privacidad (hace
 * falta por el formulario) y el error 404.
 *
 * Si en algún momento se vuelven a abrir páginas internas, acá se cambian los
 * `href` por rutas y el resto del sitio sigue funcionando igual.
 */

export type EnlaceNav = {
  texto: string;
  href: string;
  /** Descripción corta para el menú móvil. */
  detalle?: string;
};

/** Menú principal del encabezado: todas son secciones de la misma página. */
export const NAV_PRINCIPAL: EnlaceNav[] = [
  { texto: 'Servicios', href: '/#servicios', detalle: 'Las cinco áreas de atención' },
  { texto: 'Qué te pasa', href: '/#motivos', detalle: 'Entrá por tu motivo de consulta' },
  { texto: 'Nosotros', href: '/#nosotros', detalle: 'Cómo trabajamos y qué nos distingue' },
  { texto: 'Instalaciones', href: '/#instalaciones', detalle: 'El espacio donde atendemos' },
  { texto: 'Equipo', href: '/#equipo', detalle: 'Los profesionales del consultorio' },
  { texto: 'Preguntas', href: '/#preguntas', detalle: 'Dudas frecuentes antes de consultar' },
  { texto: 'Turnos', href: '/#turnos', detalle: 'Contacto, ubicación y formulario' },
];

/** Las que se ven siempre en la barra de escritorio. */
export const NAV_DESTACADA: EnlaceNav[] = NAV_PRINCIPAL.filter((e) =>
  ['/#servicios', '/#motivos', '/#nosotros', '/#instalaciones', '/#turnos'].includes(e.href),
);

/** El resto, dentro del menú "Más". */
export const NAV_SECUNDARIA: EnlaceNav[] = NAV_PRINCIPAL.filter((e) =>
  ['/#equipo', '/#preguntas'].includes(e.href),
);

/** Columnas del pie de página. */
export const NAV_PIE: Array<{ titulo: string; enlaces: EnlaceNav[] }> = [
  {
    titulo: 'Servicios',
    enlaces: [
      { texto: 'Kinesiología deportiva', href: '/#servicio-kinesiologia-deportiva' },
      { texto: 'Tratamiento y prevención de lesiones', href: '/#servicio-tratamiento-y-prevencion-de-lesiones' },
      { texto: 'Prevención de caídas', href: '/#servicio-prevencion-de-caidas' },
      { texto: 'Suelo pélvico', href: '/#servicio-suelo-pelvico' },
      { texto: 'MEP', href: '/#mep' },
    ],
  },
  {
    titulo: 'El consultorio',
    enlaces: [
      { texto: 'Quiénes somos', href: '/#nosotros' },
      { texto: 'Equipo profesional', href: '/#equipo' },
      { texto: 'Instalaciones', href: '/#instalaciones' },
      { texto: 'Clubes e instituciones', href: '/#instituciones' },
    ],
  },
  {
    titulo: 'Información',
    enlaces: [
      { texto: 'Buscá por lo que te pasa', href: '/#motivos' },
      { texto: 'Preguntas frecuentes', href: '/#preguntas' },
      { texto: 'Turnos y contacto', href: '/#turnos' },
      { texto: 'Política de privacidad', href: '/politica-de-privacidad/' },
    ],
  },
];
