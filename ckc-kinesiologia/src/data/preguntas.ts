/**
 * ============================================================================
 *  PREGUNTAS FRECUENTES
 * ============================================================================
 *
 *  Criterio de redaccion: donde la respuesta depende de una politica
 *  administrativa del consultorio (coberturas, medios de pago, requisito de
 *  orden medica, horarios, reprogramaciones) NO se afirma nada. La respuesta
 *  explica la situacion general y deriva la consulta a CKC.
 *
 *  En cuanto se confirmen esos datos en src/data/site.ts, conviene reescribir
 *  las respuestas marcadas con [COMPLETAR] para que sean concretas.
 * ============================================================================
 */

export type Pregunta = {
  pregunta: string;
  /** Parrafos de la respuesta. Admite HTML simple. */
  respuesta: string[];
  grupo: 'turnos' | 'consulta' | 'tratamiento' | 'administrativo';
  /**
   * Nota interna para el equipo: qué dato falta confirmar para poder dar una
   * respuesta concreta. NO se publica; solo aparece en modo desarrollo.
   */
  pendiente?: string;
};

export const PREGUNTAS: Pregunta[] = [
  /* --- TURNOS ----------------------------------------------------------- */
  {
    grupo: 'turnos',
    pregunta: '¿Cómo puedo solicitar un turno?',
    respuesta: [
      'Podés escribirnos por WhatsApp desde cualquier botón de este sitio o por mensaje directo en <a href="https://www.instagram.com/ckc.kinesiocanning/" target="_blank" rel="noopener noreferrer">Instagram</a>. También podés dejarnos tus datos en el <a href="/#turnos">formulario de contacto</a>.',
      'Contanos brevemente tu motivo de consulta: con esa información podemos orientarte sobre los próximos pasos y coordinar el turno que corresponda.',
    ],
  },
  {
    grupo: 'turnos',
    pregunta: '¿Qué tengo que llevar a mi primera consulta?',
    respuesta: [
      'Si tenés estudios por imágenes, informes médicos o resultados de análisis vinculados a tu motivo de consulta, llevalos: aportan información útil. Si estás tomando medicación, conviene tener la lista a mano.',
      'Para la parte práctica de la evaluación es cómodo usar ropa que permita moverse con libertad y dejar expuesta la zona a evaluar si hace falta.',
      'Si tenés una derivación u orden médica, llevala también. Y si no tenés nada de esto, igual podés consultar: lo vemos en la evaluación.',
    ],
  },
  {
    grupo: 'turnos',
    pregunta: '¿Cómo me preparo para la primera sesión?',
    respuesta: [
      'No hace falta ninguna preparación especial. Ayuda llegar con unos minutos de margen y con ropa cómoda.',
      'Lo más útil que podés traer es la información sobre lo que te pasa: cuándo empezó, qué lo mejora, qué lo empeora, qué actividades se vieron afectadas y qué te gustaría poder volver a hacer. Ese último punto suele ser el que mejor orienta el tratamiento.',
    ],
  },
  {
    grupo: 'turnos',
    pregunta: '¿Qué pasa si tengo que reprogramar un turno?',
    respuesta: [
      'Avisanos con la mayor anticipación posible por el mismo canal por el que coordinaste el turno y lo reprogramamos.',
      'Las condiciones de aviso y reprogramación son parte de la organización del consultorio: consultanos y te las detallamos al coordinar tu turno.',
    ],
    pendiente:
      'Confirmar con CKC la política de aviso, reprogramación y cancelación de turnos.',
  },

  /* --- LA CONSULTA ------------------------------------------------------ */
  {
    grupo: 'consulta',
    pregunta: '¿Necesito una orden médica para consultar?',
    respuesta: [
      'Depende de la situación y, sobre todo, de la cobertura con la que quieras atenderte: muchas obras sociales y prepagas exigen una derivación u orden médica para autorizar las sesiones.',
      'Para saber qué corresponde en tu caso, escribinos antes de sacar el turno y te lo aclaramos. No queremos que te enteres de un requisito administrativo el día de la consulta.',
    ],
  },
  {
    grupo: 'consulta',
    pregunta: '¿Qué sucede durante la evaluación inicial?',
    respuesta: [
      'La primera consulta se dedica a entender tu caso. Empieza con una conversación: tu motivo de consulta, cuándo empezó, cómo evolucionó, qué antecedentes son relevantes, qué estudios tenés si los tenés y qué objetivo te importa alcanzar.',
      'Después se hace una evaluación funcional: se observan la movilidad, la fuerza y el control del movimiento de la zona y de las regiones relacionadas, porque el origen de una molestia no siempre está donde se siente.',
      'Con esa información se define si la kinesiología es el abordaje adecuado, qué objetivos tiene sentido plantear y cómo seguir. Si hace falta una consulta médica o un estudio previo, te lo decimos en ese momento.',
    ],
  },
  {
    grupo: 'consulta',
    pregunta: '¿Puedo consultar si tengo dolor al moverme?',
    respuesta: [
      'Sí, el dolor al moverse es uno de los motivos de consulta más frecuentes. Conviene no dejarlo pasar demasiado tiempo: en general es más simple trabajar sobre una molestia reciente que sobre una que llevó meses de adaptación.',
      'Si el dolor es intenso, apareció después de un golpe fuerte, o se acompaña de fiebre, pérdida de fuerza, hormigueos o adormecimiento importantes, lo primero es una consulta médica. En esos casos te vamos a sugerir ese camino antes de iniciar un tratamiento.',
    ],
  },
  {
    grupo: 'consulta',
    pregunta: '¿Cómo sé qué tratamiento necesito?',
    respuesta: [
      'No hace falta que lo sepas antes de consultar: justamente para eso existe la evaluación inicial. Es la instancia en la que un profesional determina qué está pasando y qué abordaje corresponde.',
      'Tampoco es recomendable decidirlo a partir de información general de internet, incluida la de este sitio: las páginas de servicios explican en qué consiste cada área, pero la indicación para una persona concreta siempre surge de una evaluación individual.',
      'Si no sabés a qué área corresponde tu caso, escribinos contándonos qué te pasa y te orientamos.',
    ],
  },
  {
    grupo: 'consulta',
    pregunta: '¿Cómo puedo conocer los servicios disponibles?',
    respuesta: [
      'En la sección de <a href="/#servicios">servicios</a> está el detalle de cada área de atención: tocando cualquiera se abre en qué consiste, en qué situaciones puede estar indicada y qué busca el tratamiento.',
      'En <a href="/#motivos">buscá por lo que te pasa</a> la información está organizada por motivo de consulta, que suele ser una forma más directa de encontrar lo que buscás.',
      'También publicamos novedades y contenido sobre movimiento y prevención en <a href="https://www.instagram.com/ckc.kinesiocanning/" target="_blank" rel="noopener noreferrer">Instagram</a>.',
    ],
  },

  /* --- EL TRATAMIENTO --------------------------------------------------- */
  {
    grupo: 'tratamiento',
    pregunta: '¿Cuánto puede durar un proceso de rehabilitación?',
    respuesta: [
      'Varía mucho y no es algo que se pueda anticipar de forma general. Depende del motivo de consulta, del tiempo que lleva, de los antecedentes de cada persona, de su respuesta al tratamiento y del objetivo que se plantee.',
      'Lo que sí se puede hacer, después de la evaluación inicial, es conversar sobre una expectativa realista y definir cómo se va a ir revisando. Esa expectativa se ajusta a medida que el proceso avanza.',
      'Desconfiá de cualquier promesa de plazos exactos hecha antes de una evaluación.',
    ],
  },
  {
    grupo: 'tratamiento',
    pregunta: '¿Cuántas sesiones podría necesitar?',
    respuesta: [
      'No hay un número que sirva para todos los casos. Depende del cuadro, de su evolución y de los objetivos acordados.',
      'Después de la evaluación inicial se puede plantear una estimación y se revisa periódicamente. Si en algún momento consideramos que la kinesiología ya no está aportando, también te lo vamos a decir.',
    ],
  },
  {
    grupo: 'tratamiento',
    pregunta: '¿El tratamiento va a hacer que se me vaya el dolor?',
    respuesta: [
      'No podemos garantizarlo, y nadie debería hacerlo. La evolución depende de muchos factores, algunos de los cuales no están bajo control del tratamiento.',
      'Lo que sí podemos hacer es evaluar tu caso con seriedad, plantear objetivos razonables, explicarte en qué consiste el proceso e ir revisando la evolución para ajustar lo que haga falta. Si el abordaje no es el adecuado para tu situación, te lo decimos.',
    ],
  },
  {
    grupo: 'tratamiento',
    pregunta: '¿Tengo que hacer ejercicios en casa?',
    respuesta: [
      'En muchos casos, sí: buena parte del progreso ocurre entre sesiones. Según el cuadro, el plan puede incluir pautas de movimiento, ejercicios u otras indicaciones para sostener el trabajo en casa.',
      'Las indicaciones se acuerdan pensando en tu rutina real. Si algo no es viable para tu día a día, decilo y buscamos una alternativa: una pauta que no se puede cumplir no sirve.',
    ],
  },

  /* --- ADMINISTRATIVO --------------------------------------------------- */
  {
    grupo: 'administrativo',
    pregunta: '¿Dónde está ubicado CKC?',
    respuesta: [
      'El consultorio está en Canning, Provincia de Buenos Aires.',
      'La dirección exacta está pendiente de confirmación en este sitio, así que preferimos no publicar un dato sin verificar. Escribinos por WhatsApp o por <a href="https://www.instagram.com/ckc.kinesiocanning/" target="_blank" rel="noopener noreferrer">Instagram</a> y te pasamos la dirección y las indicaciones para llegar.',
    ],
    pendiente:
      'Confirmar la dirección exacta y cargarla en UBICACION.direccion.',
  },
  {
    grupo: 'administrativo',
    pregunta: '¿Qué medios de pago se aceptan?',
    respuesta: [
      'Es un dato que todavía no está confirmado en este sitio y no queremos publicar información inexacta sobre algo así.',
      'Consultanos antes de tu turno y te lo detallamos.',
    ],
    pendiente:
      'Confirmar los medios de pago y cargarlos en ADMINISTRACION.mediosDePago.',
  },
  {
    grupo: 'administrativo',
    pregunta: '¿Atienden obras sociales o prepagas?',
    respuesta: [
      'La información sobre coberturas médicas está pendiente de confirmación en este sitio. No publicamos un listado sin verificarlo porque es un dato que cambia y que puede generar un viaje en falso.',
      'Escribinos indicando cuál es tu cobertura y te confirmamos cómo es la atención en tu caso, incluido si hace falta una orden médica o una autorización previa.',
    ],
    pendiente:
      'Confirmar las obras sociales y prepagas y cargarlas en ADMINISTRACION.coberturas.',
  },
  {
    grupo: 'administrativo',
    pregunta: '¿Cuáles son los horarios de atención?',
    respuesta: [
      'Los horarios están pendientes de confirmación en este sitio.',
      'Escribinos y te contamos la disponibilidad actual para coordinar un turno que te sirva.',
    ],
    pendiente:
      'Confirmar los horarios de atención y cargarlos en HORARIOS.lista.',
  },
];

/** Agrupa las preguntas por categoria, en el orden en que se muestran. */
export const GRUPOS: Array<{ id: Pregunta['grupo']; titulo: string; descripcion: string }> = [
  {
    id: 'turnos',
    titulo: 'Turnos y primera visita',
    descripcion: 'Cómo pedir un turno, qué llevar y cómo prepararte.',
  },
  {
    id: 'consulta',
    titulo: 'La consulta',
    descripcion: 'Qué pasa en la evaluación inicial y cuándo conviene consultar.',
  },
  {
    id: 'tratamiento',
    titulo: 'El tratamiento',
    descripcion: 'Duración, cantidad de sesiones y trabajo entre consultas.',
  },
  {
    id: 'administrativo',
    titulo: 'Ubicación, horarios y pagos',
    descripcion: 'Dónde estamos y cómo son las cuestiones administrativas.',
  },
];

export const preguntasDeGrupo = (grupo: Pregunta['grupo']) =>
  PREGUNTAS.filter((p) => p.grupo === grupo);
