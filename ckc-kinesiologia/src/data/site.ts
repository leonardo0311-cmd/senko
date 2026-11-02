/**
 * ============================================================================
 *  CKC KINESIOLOGIA — CONFIGURACION CENTRAL DEL SITIO
 * ============================================================================
 *
 *  Este es el UNICO archivo que hay que editar para completar los datos del
 *  consultorio. Todo lo que figura como `null` es un dato PENDIENTE DE
 *  CONFIRMACION: el sitio esta construido para funcionar sin esos datos y
 *  para incorporarlos automaticamente en todas las paginas en cuanto se
 *  completen aca.
 *
 *  Reglas que respeta este proyecto:
 *   - Ningun dato de contacto, horario, credencial profesional ni cobertura
 *     medica fue inventado.
 *   - Los datos marcados como `null` no se publican en ninguna parte del sitio;
 *     en su lugar aparece una invitacion a consultar por los canales activos.
 *   - Los datos estructurados (JSON-LD) solo declaran los campos confirmados.
 *
 *  Ver PENDIENTES.md para la lista completa y el detalle de cada dato.
 * ============================================================================
 */

export type Pendiente<T> = T | null;

/* ---------------------------------------------------------------------------
 * 1. IDENTIDAD
 * ------------------------------------------------------------------------- */

export const BRAND = {
  /** Nombre corto, usado en el logotipo y la navegacion. */
  shortName: 'CKC',
  /** Nombre comercial completo. Confirmado: perfil publico de Instagram y Facebook. */
  name: 'CKC Kinesiología',
  /** Razon social / nombre completo publicado por el consultorio. Confirmado. */
  fullName: 'CKC — Consultorio Kinésico Canning',
  /** Bajada que acompaña al logotipo. */
  tagline: 'Consultorio Kinésico Canning',

  /**
   * Logotipo oficial.
   * PENDIENTE: CKC ya tiene un logotipo propio (se usa en sus redes). No se
   * creo ni se reemplazo por uno nuevo. Mientras no este el archivo, el
   * componente <Logo /> muestra un logotipo tipografico provisional con el
   * nombre real del consultorio.
   *
   * Para activarlo: colocar el archivo en /public/marca/ y poner aca la ruta,
   * por ejemplo '/marca/ckc-logo.svg'. Se recomienda SVG, o PNG a 2x.
   */
  logoSrc: null as Pendiente<string>,
  /** Alto de renderizado del logotipo en el encabezado, en pixeles. */
  logoHeight: 34,

  /**
   * Imagen para compartir en redes sociales (Open Graph), 1200x630 px.
   * PENDIENTE: idealmente una foto real del consultorio con el logotipo.
   * Mientras no exista, se genera una imagen de marca propia del sitio.
   */
  ogImage: '/og/ckc-og.png',
} as const;

/* ---------------------------------------------------------------------------
 * 2. CONTACTO
 * ------------------------------------------------------------------------- */

export const CONTACTO = {
  /**
   * WhatsApp: numero en formato internacional, solo digitos, sin "+",
   * sin espacios y sin guiones. Para Argentina: 54 + 9 + area sin 0 + numero
   * sin 15. Ejemplo de formato (NO es el numero de CKC): '5491112345678'.
   *
   * PENDIENTE DE CONFIRMACION. No se publico ningun numero porque no pudo
   * verificarse en una fuente oficial del consultorio. En cuanto se complete,
   * todos los botones del sitio pasan automaticamente a abrir WhatsApp con el
   * mensaje correspondiente a cada seccion.
   *
   * Mientras este en `null`, los botones siguen siendo funcionales: llevan a
   * la pagina de contacto, donde se ofrecen los canales que si estan activos.
   */
  whatsapp: null as Pendiente<string>,

  /**
   * Telefono de linea para mostrar y para el enlace `tel:`.
   * `display` es como se muestra; `link` es solo digitos con prefijo pais.
   *
   * PENDIENTE DE CONFIRMACION. Un directorio externo de terceros publica un
   * telefono asociado al consultorio, pero no pudo verificarse en un canal
   * oficial de CKC y la fuente tiene mas de dos años, por lo que no se publica.
   * Ver PENDIENTES.md.
   */
  telefono: null as Pendiente<{ display: string; link: string }>,

  /**
   * Correo electronico de contacto.
   * PENDIENTE DE CONFIRMACION.
   */
  email: null as Pendiente<string>,

  /** Instagram oficial. CONFIRMADO. */
  instagram: {
    usuario: '@ckc.kinesiocanning',
    url: 'https://www.instagram.com/ckc.kinesiocanning/',
  },

  /** Facebook oficial. CONFIRMADO. */
  facebook: {
    nombre: 'Consultorio Kinésico Canning',
    url: 'https://www.facebook.com/kinesio.canning/',
  },
} as const;

/* ---------------------------------------------------------------------------
 * 3. UBICACION
 * ------------------------------------------------------------------------- */

export const UBICACION = {
  /** Localidad. CONFIRMADA. */
  localidad: 'Canning',
  /** Partido / zona. CONFIRMADA a nivel provincia. */
  provincia: 'Provincia de Buenos Aires',
  pais: 'Argentina',
  /** Texto corto que si se puede publicar hoy. */
  resumen: 'Canning, Provincia de Buenos Aires',

  /**
   * Direccion exacta (calle, numero, oficina, codigo postal).
   *
   * PENDIENTE DE CONFIRMACION. Existe una direccion publicada por un
   * directorio externo de terceros (ver PENDIENTES.md), pero no pudo
   * verificarse en un canal oficial de CKC y la fuente tiene mas de dos años.
   * Por eso NO se publica como dato del consultorio.
   *
   * Para activarla, completar los campos y el sitio la va a mostrar en el
   * pie de pagina, en la pagina de contacto y en los datos estructurados.
   */
  direccion: null as Pendiente<{
    calle: string;
    numero: string;
    /** Piso, oficina o consultorio. Opcional. */
    detalle?: string;
    codigoPostal: string;
  }>,

  /**
   * Mapa interactivo. Pegar aca la URL del `src` del iframe que entrega
   * Google Maps en "Compartir > Insertar un mapa".
   *
   * PENDIENTE DE CONFIRMACION: depende de la direccion exacta. No se cargaron
   * coordenadas ni se eligio una ubicacion aproximada, para no mostrar un
   * punto equivocado en el mapa.
   */
  mapaEmbedUrl: null as Pendiente<string>,

  /** Enlace "Ver en Google Maps" / "Como llegar". PENDIENTE. */
  mapaEnlace: null as Pendiente<string>,

  /**
   * Referencias para llegar (estacionamiento, accesos, transporte).
   * PENDIENTE DE CONFIRMACION.
   */
  comoLlegar: null as Pendiente<string[]>,
} as const;

/* ---------------------------------------------------------------------------
 * 4. HORARIOS
 * ------------------------------------------------------------------------- */

/**
 * Horarios de atencion.
 *
 * PENDIENTE DE CONFIRMACION. No se publicaron horarios: la unica referencia
 * horaria encontrada proviene de un aviso de busqueda laboral de hace mas de
 * dos años y corresponde a la carga horaria de un puesto, no al horario de
 * atencion a pacientes.
 *
 * Formato esperado para activarlo:
 *   horarios: [
 *     { dias: 'Lunes a viernes', franjas: ['08:00 a 12:00', '14:00 a 20:00'] },
 *     { dias: 'Sabados', franjas: ['09:00 a 13:00'] },
 *   ]
 *
 * `schemaOrg` sirve para los datos estructurados y solo debe completarse si
 * los horarios estan confirmados. Formato: dias en ingles abreviado.
 *   schemaOrg: [{ dias: ['Mo','Tu','We','Th','Fr'], abre: '08:00', cierra: '20:00' }]
 */
export const HORARIOS = {
  lista: null as Pendiente<Array<{ dias: string; franjas: string[] }>>,
  schemaOrg: null as Pendiente<
    Array<{ dias: string[]; abre: string; cierra: string }>
  >,
  /** Nota al pie sobre los horarios, si corresponde. */
  nota: null as Pendiente<string>,
} as const;

/* ---------------------------------------------------------------------------
 * 5. ADMINISTRACION Y COBERTURAS
 * ------------------------------------------------------------------------- */

export const ADMINISTRACION = {
  /**
   * Obras sociales y prepagas con las que trabaja el consultorio.
   * PENDIENTE DE CONFIRMACION. No se afirma en ninguna parte del sitio que se
   * atiendan determinadas coberturas: las preguntas frecuentes derivan la
   * consulta al consultorio.
   */
  coberturas: null as Pendiente<string[]>,

  /**
   * Medios de pago aceptados.
   * PENDIENTE DE CONFIRMACION.
   */
  mediosDePago: null as Pendiente<string[]>,

  /**
   * Si el consultorio requiere orden medica / derivacion para iniciar
   * tratamiento. `null` = sin confirmar, y el sitio explica que depende del
   * caso y de la cobertura, sin afirmar que no hace falta.
   */
  requiereOrdenMedica: null as Pendiente<boolean>,

  /**
   * Politica de reprogramacion y cancelacion de turnos (texto libre).
   * PENDIENTE DE CONFIRMACION.
   */
  politicaDeTurnos: null as Pendiente<string>,
} as const;

/* ---------------------------------------------------------------------------
 * 6. FORMULARIO DE CONTACTO
 * ------------------------------------------------------------------------- */

export const FORMULARIO = {
  /**
   * El formulario del sitio NO simula envios.
   *
   * - Si `endpoint` es `null` (estado actual): el formulario valida los datos
   *   y arma un mensaje prolijo que la persona envia por WhatsApp. No se
   *   muestra ningun cartel de "mensaje enviado" porque no hay servidor que
   *   lo reciba. Esto esta explicado de forma visible en la propia pagina.
   *
   * - Si se completa `endpoint` con la URL de un servicio real de recepcion de
   *   formularios (Formspree, Basin, Web3Forms, una funcion propia, etc.), el
   *   formulario hace un POST real y recien entonces muestra la confirmacion
   *   de envio.
   */
  endpoint: null as Pendiente<string>,
  /** Metodo HTTP para el endpoint. */
  metodo: 'POST' as const,
} as const;

/* ---------------------------------------------------------------------------
 * 7. ANALITICA
 * ------------------------------------------------------------------------- */

export const ANALITICA = {
  /**
   * Codigo de verificacion de Google Search Console (solo el valor del
   * atributo `content` de la metaetiqueta). PENDIENTE / opcional.
   */
  googleSearchConsole: null as Pendiente<string>,
  /**
   * ID de medicion de Google Analytics 4 (formato 'G-XXXXXXXXXX').
   * PENDIENTE / opcional. Si se activa, conviene revisar el aviso de
   * privacidad y, segun el caso, sumar un cartel de consentimiento.
   */
  ga4: null as Pendiente<string>,
} as const;

/* ---------------------------------------------------------------------------
 * 8. MENSAJES PRECARGADOS DE WHATSAPP
 * ------------------------------------------------------------------------- */

/**
 * Mensaje base y variantes por seccion. El mensaje cambia segun desde donde
 * se inicia la conversacion, para que el consultorio sepa de que se trata la
 * consulta sin tener que preguntarlo.
 */
export const MENSAJES = {
  general:
    'Hola, quisiera recibir información sobre los servicios de CKC Kinesiología y consultar por un turno.',
  turno:
    'Hola, quisiera consultar por un turno en CKC Kinesiología. ¿Qué disponibilidad tienen?',
  servicio: (servicio: string) =>
    `Hola, quisiera consultar por ${servicio} en CKC Kinesiología y saber si es adecuado para mi caso.`,
  especialidad: (area: string) =>
    `Hola, quisiera consultar por ${area} en CKC Kinesiología.`,
  ubicacion:
    'Hola, quisiera confirmar la dirección y los horarios de atención de CKC Kinesiología.',
  coberturas:
    'Hola, quisiera consultar por las coberturas médicas y los medios de pago de CKC Kinesiología.',
  equipo:
    'Hola, quisiera consultar por un turno con el equipo de CKC Kinesiología.',
  primeraConsulta:
    'Hola, es mi primera consulta en CKC Kinesiología y quisiera saber cómo prepararme y qué llevar.',
} as const;

/* ---------------------------------------------------------------------------
 * 9. AVISO LEGAL
 * ------------------------------------------------------------------------- */

export const LEGAL = {
  /**
   * Responsable del tratamiento de datos personales, para la politica de
   * privacidad. PENDIENTE DE CONFIRMACION (razon social y domicilio legal).
   */
  responsableDatos: null as Pendiente<{ razonSocial: string; domicilio: string }>,
  /** Fecha de ultima actualizacion de la politica de privacidad. */
  privacidadActualizada: '2 de noviembre de 2025',
  /** Año de inicio para el aviso de derechos del pie de pagina. */
  anioDesde: 2025,
} as const;

/* ---------------------------------------------------------------------------
 * 10. ESTADO DE LOS DATOS (para los avisos del sitio)
 * ------------------------------------------------------------------------- */

export const hayWhatsApp = CONTACTO.whatsapp !== null;
export const hayTelefono = CONTACTO.telefono !== null;
export const hayEmail = CONTACTO.email !== null;
export const hayDireccion = UBICACION.direccion !== null;
export const hayMapa = UBICACION.mapaEmbedUrl !== null;
export const hayHorarios = HORARIOS.lista !== null;
export const hayFormularioReal = FORMULARIO.endpoint !== null;

/** Direccion en una sola linea, o `null` si todavia no esta confirmada. */
export const direccionEnLinea = (() => {
  const d = UBICACION.direccion;
  if (!d) return null;
  const base = `${d.calle} ${d.numero}`;
  const detalle = d.detalle ? `, ${d.detalle}` : '';
  return `${base}${detalle}, ${UBICACION.localidad}, ${UBICACION.provincia}`;
})();
