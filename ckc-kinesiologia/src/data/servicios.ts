/**
 * ============================================================================
 *  SERVICIOS DE CKC
 * ============================================================================
 *
 *  ORIGEN DE LA INFORMACION
 *  ------------------------
 *  Las cinco areas que figuran abajo son las que CKC publica en la descripcion
 *  de sus propios perfiles publicos (Instagram @ckc.kinesiocanning y la pagina
 *  de Facebook "Consultorio Kinésico Canning"), donde el consultorio se
 *  presenta como consultorio de kinesiologia deportiva, prevencion de caidas,
 *  suelo pelvico y MEP, con dos lineas de trabajo: "Sport" y "Beauty".
 *
 *  NO se agregaron especialidades por el solo hecho de ser habituales en otros
 *  centros de kinesiologia. Si CKC ofrece otras areas, hay que sumarlas aca.
 *
 *  DATO A CONFIRMAR: la sigla MEP se interpreta como Microelectrolisis
 *  Percutanea, que es su uso corriente en kinesiologia deportiva en Argentina
 *  y es coherente con las dos lineas "Sport" y "Beauty" que menciona CKC. El
 *  consultorio no publica la sigla desarrollada, asi que el contenido de esa
 *  pagina esta redactado con prudencia y marcado para revision profesional
 *  antes de publicarse. Ver PENDIENTES.md.
 *
 *  Los textos describen en que puede consistir cada area y en que situaciones
 *  suele consultarse. No prometen resultados, no garantizan la desaparicion
 *  del dolor, no fijan plazos de recuperacion ni indican ejercicios o
 *  tecnicas concretas para casos particulares.
 * ============================================================================
 */

export type Servicio = {
  slug: string;
  /** Nombre que se muestra en titulos y tarjetas. */
  nombre: string;
  /** Nombre tal como queda dentro del mensaje de WhatsApp. */
  nombreConsulta: string;
  /** Titulo SEO propio de la pagina. */
  tituloSeo: string;
  /** Meta descripcion propia de la pagina. */
  descripcionSeo: string;
  /** Frase corta para la tarjeta. */
  resumen: string;
  /** Tres o cuatro situaciones, en formato corto, para la tarjeta. */
  cuandoResumen: string[];
  /** Motivo grafico del panel visual. */
  motivo: 'arcos' | 'recorrido' | 'pulso' | 'campo' | 'eje' | 'horizonte';
  tono: 'primario' | 'arena' | 'acento' | 'profundo';
  /** Que fotografia real conviene poner en este lugar. */
  fotoSugerida: string;

  /** 1. Introduccion. */
  introduccion: string[];
  /** 2. Descripcion del servicio. */
  descripcion: string[];
  /** 3. Situaciones en las que puede estar indicado. */
  situaciones: string[];
  /** 4. Objetivos generales del tratamiento. */
  objetivos: string[];
  /** 5. Como se realiza la evaluacion inicial. */
  evaluacion: string[];
  /** 6. Que puede incluir el proceso terapeutico. */
  proceso: string[];
  /** 7. Importancia de la participacion del paciente. */
  participacion: string[];
  /** 8. Preguntas frecuentes propias del servicio. */
  preguntas: Array<{ pregunta: string; respuesta: string[] }>;
  /** Advertencia especifica, si el area la necesita. */
  advertencia?: string;
};

export const SERVICIOS: Servicio[] = [
  /* ========================================================================
     1. KINESIOLOGIA DEPORTIVA
     ===================================================================== */
  {
    slug: 'kinesiologia-deportiva',
    nombre: 'Kinesiología deportiva',
    nombreConsulta: 'kinesiología deportiva',
    tituloSeo: 'Kinesiología deportiva en Canning | CKC Kinesiología',
    descripcionSeo:
      'Kinesiología deportiva en Canning: evaluación del movimiento, recuperación de lesiones deportivas y preparación para volver a entrenar. Consultá por un turno en CKC.',
    resumen:
      'Acompañamos a quienes hacen deporte o actividad física y necesitan recuperarse de una lesión, resolver una molestia o preparar su vuelta al entrenamiento.',
    cuandoResumen: [
      'Te lesionaste entrenando o compitiendo',
      'Una molestia reaparece cada vez que volvés a entrenar',
      'Querés volver a tu actividad de forma progresiva',
    ],
    motivo: 'recorrido',
    tono: 'primario',
    fotoSugerida: 'Foto a incorporar: sesión de kinesiología deportiva en el consultorio',

    introduccion: [
      'Hacer deporte le exige al cuerpo repetir gestos, tolerar cargas y recuperarse entre un esfuerzo y el siguiente. Cuando algo de ese equilibrio se altera, suele aparecer una molestia que primero se tolera, después condiciona el entrenamiento y finalmente obliga a parar.',
      'La kinesiología deportiva se ocupa de ese recorrido: entender qué pasó, acompañar la recuperación y preparar la vuelta a la actividad con criterios profesionales y no por intuición.',
    ],
    descripcion: [
      'En esta área trabajamos con personas que practican deporte de manera recreativa, federada o competitiva, y también con quienes entrenan por salud y quieren seguir haciéndolo sin que una molestia se los impida.',
      'El abordaje empieza por entender el gesto deportivo de cada persona: qué hace, con qué frecuencia, en qué condiciones y en qué momento aparece el síntoma. Esa información es tan importante como el examen físico, porque una misma molestia puede tener causas distintas según cómo y cuánto se entrene.',
      'A partir de la evaluación se define si la kinesiología es el abordaje adecuado, qué objetivos tiene sentido plantear y si hace falta la intervención de otro profesional. Cuando corresponde, sugerimos una consulta médica antes de avanzar.',
    ],
    situaciones: [
      'Lesiones producidas durante el entrenamiento o la competencia.',
      'Molestias que aparecen siempre en el mismo gesto o en la misma etapa del esfuerzo.',
      'Dolores que reaparecen cada vez que se retoma la actividad después de una pausa.',
      'Recuperación posterior a una lesión deportiva ya diagnosticada por un médico.',
      'Sensación de inestabilidad, falta de fuerza o pérdida de confianza en una zona del cuerpo.',
      'Preparación para volver a entrenar luego de un período de inactividad.',
    ],
    objetivos: [
      'Comprender qué factores están participando en la molestia o la lesión.',
      'Trabajar sobre la movilidad, la fuerza y el control del movimiento según lo que indique la evaluación.',
      'Acompañar la progresión de cargas de manera ordenada, respetando los tiempos de cada persona.',
      'Aportar criterios para reducir la probabilidad de que el episodio se repita.',
      'Devolver confianza en el movimiento, que suele ser parte del problema y de la solución.',
    ],
    evaluacion: [
      'La primera consulta se dedica a escuchar y a evaluar. Preguntamos por el motivo de consulta, cómo empezó, qué lo mejora y qué lo empeora, qué estudios hay si los hay, qué tratamientos se probaron antes y cuál es el objetivo concreto de la persona.',
      'Después hacemos una evaluación funcional: observamos la movilidad de la zona y de las regiones vecinas, probamos fuerza y control del movimiento, y cuando es posible miramos el gesto deportivo que genera el síntoma.',
      'Con todo eso se define el plan. Si la evaluación sugiere que hace falta un estudio complementario o una valoración médica, lo decimos con claridad: no tiene sentido iniciar un tratamiento sobre un diagnóstico incierto.',
    ],
    proceso: [
      'El contenido del tratamiento depende de cada caso y lo define el profesional a partir de la evaluación. No existe una rutina única que sirva para todas las personas con la misma lesión.',
      'Según la situación, el proceso puede combinar trabajo manual sobre los tejidos, ejercicio terapéutico progresivo, trabajo de control motor, pautas de carga para el entrenamiento y recursos de fisioterapia cuando están indicados.',
      'A medida que avanza el proceso, el plan se revisa. Lo que es adecuado en la primera semana puede dejar de serlo más adelante, y la idea es que el tratamiento acompañe esa evolución en lugar de repetirse igual sesión tras sesión.',
    ],
    participacion: [
      'Acá buena parte del progreso ocurre entre sesiones: en cómo se dosifica el entrenamiento, en si se respetan las pautas acordadas y en lo que la persona observa sobre cómo responde su cuerpo. Esa información es parte de la evaluación continua, no un dato accesorio.',
    ],
    preguntas: [
      {
        pregunta: '¿Tengo que dejar de entrenar durante el tratamiento?',
        respuesta: [
          'No necesariamente. En muchos casos se puede seguir entrenando con ajustes en el tipo de ejercicio, el volumen o la intensidad, y a veces mantener la actividad adaptada es parte del tratamiento.',
          'En otras situaciones sí conviene suspender temporalmente un gesto determinado. Eso se define en la evaluación y se revisa a lo largo del proceso, porque depende de cada caso.',
        ],
      },
      {
        pregunta: '¿Hace falta un diagnóstico médico previo?',
        respuesta: [
          'Depende de la situación. Hay consultas en las que la evaluación kinésica alcanza para empezar a trabajar, y otras en las que es importante contar primero con un diagnóstico médico o con estudios por imágenes.',
          'Si durante la evaluación surge que hace falta una valoración médica, te lo planteamos antes de iniciar el tratamiento. Escribinos y lo vemos según tu caso.',
        ],
      },
      {
        pregunta: '¿Cuándo voy a poder volver a competir?',
        respuesta: [
          'No es algo que pueda responderse de antemano ni por un plazo general, porque depende del tipo de lesión, de la respuesta de cada persona y de las exigencias de su deporte.',
          'Lo que sí se puede hacer es definir criterios de progresión: señales concretas que indican que se puede avanzar a la etapa siguiente. Eso se conversa en la consulta y se va revisando.',
        ],
      },
    ],
  },

  /* ========================================================================
     2. TRATAMIENTO Y PREVENCION DE LESIONES
     ===================================================================== */
  {
    slug: 'tratamiento-y-prevencion-de-lesiones',
    nombre: 'Tratamiento y prevención de lesiones',
    nombreConsulta: 'tratamiento y prevención de lesiones',
    tituloSeo: 'Tratamiento y prevención de lesiones en Canning | CKC',
    descripcionSeo:
      'Tratamiento kinésico de lesiones y trabajo preventivo en Canning. Evaluamos tu caso para definir objetivos y un plan adecuado. Consultá por un turno en CKC.',
    resumen:
      'Trabajamos tanto sobre la lesión que ya apareció como sobre las condiciones que la hicieron posible, para reducir la chance de que vuelva a pasar.',
    cuandoResumen: [
      'Tenés una lesión y querés empezar a tratarla',
      'La misma molestia te vuelve cada tanto',
      'Querés anticiparte antes de que se convierta en un problema',
    ],
    motivo: 'arcos',
    tono: 'arena',
    fotoSugerida: 'Foto a incorporar: evaluación kinésica de una lesión',

    introduccion: [
      'Una lesión casi nunca es solo el episodio que la hizo evidente. Alrededor hay una historia: cargas que se acumularon, gestos que se repitieron, zonas que dejaron de moverse como antes o un cambio de rutina que el cuerpo no alcanzó a asimilar.',
      'Por eso esta área tiene dos caras que funcionan juntas: tratar lo que está pasando ahora y trabajar sobre las condiciones que lo hicieron posible.',
    ],
    descripcion: [
      'El tratamiento de una lesión busca acompañar la recuperación de la función: que la zona vuelva a moverse, a sostener carga y a participar del movimiento general del cuerpo con la menor molestia posible.',
      'La parte preventiva aparece desde el comienzo, no al final. Mientras se trabaja sobre el problema actual también se identifican los factores que conviene atender para reducir la probabilidad de recaída, que es una de las preocupaciones más frecuentes de quienes ya pasaron por una lesión.',
      'La prevención no garantiza que no vuelva a ocurrir nada: ninguna intervención puede asegurar eso. Lo que sí puede hacer es mejorar las condiciones con las que el cuerpo enfrenta las exigencias de cada día.',
    ],
    situaciones: [
      'Lesiones musculares, articulares o tendinosas en proceso de recuperación.',
      'Molestias que se repiten en la misma zona cada cierto tiempo.',
      'Dolores que aparecieron después de un cambio de actividad, de rutina o de carga de trabajo.',
      'Zonas que quedaron con menos movilidad o menos fuerza después de una lesión anterior.',
      'Personas que quieren empezar o retomar una actividad física y prefieren hacerlo con una evaluación previa.',
      'Molestias vinculadas a posturas o gestos sostenidos durante muchas horas.',
    ],
    objetivos: [
      'Acompañar la recuperación de la movilidad y la función de la zona afectada.',
      'Trabajar sobre la tolerancia a la carga de forma progresiva.',
      'Identificar los factores que conviene atender para reducir la chance de recaída.',
      'Aportar herramientas y pautas para sostener el cuidado fuera del consultorio.',
      'Que la persona entienda qué le pasó y qué puede hacer al respecto.',
    ],
    evaluacion: [
      'La evaluación inicial combina la conversación y el examen físico. Interesa saber cuándo empezó, cómo evolucionó, qué actividades se vieron afectadas y qué espera la persona del tratamiento.',
      'Revisamos la movilidad, la fuerza y el control del movimiento de la zona y de las regiones relacionadas, porque muchas veces el origen de una molestia no está exactamente donde se siente.',
      'También miramos el contexto: trabajo, actividad física, horas de postura sostenida, cambios recientes. Esa información suele explicar buena parte del cuadro y es clave para la parte preventiva.',
    ],
    proceso: [
      'El plan se define caso por caso. Según lo que indique la evaluación, puede incluir ejercicio terapéutico progresivo, trabajo manual, recursos de fisioterapia y pautas concretas para la vida cotidiana o el entrenamiento.',
      'En general el proceso avanza por etapas: primero se busca que la zona tolere mejor el movimiento, después se trabaja sobre la fuerza y el control, y más adelante sobre las exigencias específicas de la actividad de cada persona.',
      'La frecuencia y la duración de las sesiones dependen del caso y pueden cambiar a medida que la situación evoluciona. Son temas que se conversan en la consulta, no reglas fijas.',
    ],
    participacion: [
      'En la parte preventiva el trabajo entre sesiones es decisivo, y una pauta solo funciona si encuentra un lugar realista en la rutina. Preferimos acordar indicaciones sostenibles antes que planes extensos que queden a mitad de camino: si algo no es viable, conviene decirlo y buscar una alternativa.',
    ],
    preguntas: [
      {
        pregunta: '¿Cuántas sesiones voy a necesitar?',
        respuesta: [
          'No hay un número que valga para todos los casos, y desconfiá de quien lo asegure sin haberte evaluado. Depende del tipo de lesión, del tiempo que lleva, de la respuesta de cada persona y del objetivo que se plantee.',
          'Después de la evaluación inicial se puede conversar sobre una expectativa realista, que se revisa a medida que el proceso avanza.',
        ],
      },
      {
        pregunta: '¿Se puede prevenir cualquier lesión?',
        respuesta: [
          'No. Hay factores que no están bajo control, como un golpe o un accidente, y ningún trabajo preventivo puede evitarlos.',
          'Lo que sí se puede trabajar son las condiciones modificables: movilidad, fuerza, control del movimiento y cómo se dosifican las cargas. Mejorar eso no elimina el riesgo, pero puede reducirlo.',
        ],
      },
      {
        pregunta: '¿Puedo consultar aunque la molestia sea leve?',
        respuesta: [
          'Sí. Consultar temprano suele ser más simple que esperar a que la molestia se instale y empiece a condicionar lo que hacés.',
          'Si en la evaluación surge que no hace falta un tratamiento kinésico, también te lo vamos a decir.',
        ],
      },
    ],
  },

  /* ========================================================================
     3. PREVENCION DE CAIDAS
     ===================================================================== */
  {
    slug: 'prevencion-de-caidas',
    nombre: 'Prevención de caídas',
    nombreConsulta: 'prevención de caídas y evaluación del riesgo de caídas',
    tituloSeo: 'Prevención de caídas y evaluación del riesgo en Canning | CKC',
    descripcionSeo:
      'Evaluación del riesgo de caídas y trabajo kinésico sobre equilibrio, marcha y fuerza en Canning. Atención cuidada para adultos mayores. Consultá en CKC.',
    resumen:
      'Evaluamos el riesgo de caídas y trabajamos sobre el equilibrio, la marcha y la fuerza, con una atención pensada para adultos mayores y sus familias.',
    cuandoResumen: [
      'Hubo una caída o un episodio de desequilibrio',
      'Aparece inseguridad al caminar o al bajar escaleras',
      'La familia nota cambios en la forma de moverse',
    ],
    motivo: 'eje',
    tono: 'primario',
    fotoSugerida: 'Foto a incorporar: trabajo de equilibrio y marcha en el consultorio',

    introduccion: [
      'Una caída rara vez es un hecho aislado. Suele ser el resultado de varios factores que se suman: menos fuerza en las piernas, cambios en el equilibrio, una marcha más insegura, la visión, la medicación o el propio entorno de la casa.',
      'Trabajar sobre esos factores es posible, y hacerlo a tiempo cambia mucho las cosas. El objetivo no es solo evitar una caída: es que la persona recupere confianza para seguir haciendo lo que hacía.',
    ],
    descripcion: [
      'Esta área combina dos cosas. Primero, una evaluación del riesgo de caídas: una valoración profesional que mira equilibrio, marcha, fuerza y otros factores que pueden estar influyendo.',
      'Segundo, un plan de trabajo construido a partir de esa evaluación, orientado a los aspectos que resultaron más relevantes en cada caso. No es lo mismo alguien que perdió fuerza después de una internación que alguien que tiene inseguridad en terrenos irregulares.',
      'El miedo a caerse merece una mención aparte, porque es muy frecuente y tiene un efecto propio: lleva a moverse menos, y moverse menos suele aumentar el riesgo. Romper ese círculo es parte del trabajo.',
    ],
    situaciones: [
      'Caídas recientes, ya sea una sola o varias en los últimos meses.',
      'Episodios de desequilibrio, tropiezos frecuentes o sensación de inestabilidad.',
      'Inseguridad al caminar, al girar, al levantarse de una silla o al bajar escaleras.',
      'Pérdida de fuerza en las piernas, sobre todo después de una internación o un período de reposo.',
      'Cambios en la forma de caminar que nota la propia persona o su familia.',
      'Personas que ya evitan ciertas actividades por temor a caerse.',
    ],
    objetivos: [
      'Identificar los factores que, en cada caso, pueden estar aumentando el riesgo.',
      'Trabajar sobre el equilibrio, la fuerza de las piernas y la calidad de la marcha según lo que indique la evaluación.',
      'Recuperar seguridad y confianza en los movimientos de la vida diaria.',
      'Aportar recomendaciones concretas sobre el entorno y las actividades cotidianas.',
      'Sostener la mayor autonomía posible en las tareas de cada día.',
    ],
    evaluacion: [
      'La evaluación empieza con la historia: si hubo caídas, en qué circunstancias, si hubo consecuencias, qué actividades se dejaron de hacer y qué preocupa más a la persona y a su familia.',
      'Después se valoran el equilibrio en distintas condiciones, la marcha, la fuerza de las piernas y la capacidad de hacer movimientos cotidianos como levantarse de una silla, girar o caminar sorteando un obstáculo.',
      'También se conversa sobre otros factores que pueden estar participando, como la visión, el calzado, la medicación o las características de la vivienda. Varios de ellos requieren la intervención de otros profesionales, y cuando corresponde lo planteamos.',
    ],
    proceso: [
      'El plan se construye a partir de lo que mostró la evaluación y se adapta al ritmo de cada persona. Puede incluir ejercicios de fuerza para las piernas, trabajo de equilibrio en condiciones progresivamente más exigentes, práctica de movimientos cotidianos y pautas para el entorno.',
      'La progresión es gradual y se revisa seguido. Avanzar demasiado rápido no ayuda, y avanzar demasiado lento tampoco: encontrar ese punto es parte del trabajo profesional.',
      'Cuando la familia participa del cuidado, conversamos también con ella, siempre con el acuerdo de la persona. Tener a todos en la misma página ayuda a que las pautas se sostengan.',
    ],
    participacion: [
      'La fuerza y el equilibrio responden al trabajo sostenido y se pierden rápido con la inactividad, así que acá la continuidad es parte del resultado. Buscamos indicaciones simples, que se puedan hacer en casa sin complicaciones, y conversamos sobre lo que preocupa: la confianza también se construye hablando.',
    ],
    advertencia:
      'Si hubo una caída con golpe en la cabeza, pérdida de conocimiento, mareos intensos o una lesión, lo primero es una consulta médica. La evaluación kinésica complementa esa atención, no la reemplaza.',
    preguntas: [
      {
        pregunta: '¿A partir de qué edad conviene hacer una evaluación?',
        respuesta: [
          'No hay una edad exacta. Lo que marca el momento son las señales: una caída, episodios de desequilibrio, inseguridad al caminar o pérdida de fuerza en las piernas.',
          'Si aparece alguna de esas situaciones, conviene consultar sin esperar a que se repita.',
        ],
      },
      {
        pregunta: '¿Puede venir acompañada mi mamá o mi papá?',
        respuesta: [
          'Sí, y en muchos casos ayuda. La familia suele aportar información valiosa sobre cambios que la propia persona no registra, y puede colaborar con la continuidad del trabajo en casa.',
          'Escribinos y coordinamos la consulta teniendo en cuenta esa situación.',
        ],
      },
      {
        pregunta: '¿Se puede trabajar si la persona ya usa bastón o andador?',
        respuesta: [
          'Sí. El uso de una ayuda para caminar no impide el trabajo kinésico: forma parte de lo que se evalúa.',
          'En la evaluación se mira cómo se usa esa ayuda y si es la adecuada para la situación actual, que es algo que puede cambiar con el tiempo.',
        ],
      },
    ],
  },

  /* ========================================================================
     4. SUELO PELVICO
     ===================================================================== */
  {
    slug: 'suelo-pelvico',
    nombre: 'Suelo pélvico',
    nombreConsulta: 'kinesiología de suelo pélvico',
    tituloSeo: 'Kinesiología de suelo pélvico en Canning | CKC Kinesiología',
    descripcionSeo:
      'Kinesiología de suelo pélvico en Canning: evaluación y tratamiento de disfunciones del piso pélvico, con atención cuidada y privada. Consultá en CKC.',
    resumen:
      'Un área de consulta frecuente y poco conversada. Evaluamos y trabajamos las disfunciones del piso pélvico con la privacidad y el cuidado que el tema requiere.',
    cuandoResumen: [
      'Pérdidas de orina al toser, estornudar o hacer actividad física',
      'Molestias o cambios después de un embarazo o un parto',
      'Sensación de peso o presión en la zona pélvica',
    ],
    motivo: 'campo',
    tono: 'acento',
    fotoSugerida: 'Foto a incorporar: consultorio privado donde se realiza la atención',

    introduccion: [
      'El suelo pélvico es un conjunto de músculos que sostiene los órganos de la pelvis y participa en funciones cotidianas: la continencia, el soporte de los órganos y la respuesta del cuerpo frente a los esfuerzos.',
      'Cuando algo en ese sistema no funciona como debería, los síntomas suelen afectar bastante la vida diaria. Y casi siempre se consultan más tarde de lo necesario, porque es un tema del que cuesta hablar.',
    ],
    descripcion: [
      'La kinesiología de suelo pélvico se ocupa de evaluar y tratar las disfunciones de esta zona. Es un área con entidad propia dentro de la kinesiología y con herramientas específicas.',
      'Buena parte de las consultas aparece en etapas concretas de la vida: durante o después de un embarazo, luego de un parto, en el período posterior a una cirugía pélvica o durante los cambios hormonales asociados a la menopausia. También consultan varones, por ejemplo después de una cirugía de próstata.',
      'La atención se realiza en un espacio privado y respetando el ritmo de cada persona. Antes de cualquier evaluación se explica en qué consiste, para qué sirve y qué incluye, y nada se hace sin el acuerdo explícito de la persona.',
    ],
    situaciones: [
      'Pérdidas de orina al toser, estornudar, reír, saltar o hacer actividad física.',
      'Necesidad urgente y frecuente de ir al baño.',
      'Sensación de peso, presión o bulto en la zona pélvica o genital.',
      'Molestias o cambios funcionales después de un embarazo o un parto.',
      'Recuperación posterior a una cirugía pélvica o abdominal, cuando está indicada.',
      'Dolor en la zona pélvica, lumbar baja o en las relaciones sexuales.',
      'Dificultades vinculadas a la evacuación intestinal.',
    ],
    objetivos: [
      'Entender qué está pasando y qué factores participan en los síntomas.',
      'Mejorar la conciencia y el control de la musculatura del suelo pélvico.',
      'Trabajar la coordinación de esta zona con la respiración y con el resto del cuerpo.',
      'Reducir el impacto de los síntomas en la vida cotidiana.',
      'Aportar información clara sobre hábitos y cuidados vinculados a la zona.',
    ],
    evaluacion: [
      'La primera consulta es, sobre todo, una conversación. Se repasan el motivo de consulta, los antecedentes relevantes, los embarazos y partos si los hubo, las cirugías, los hábitos vinculados a la zona y el objetivo de la persona.',
      'Después, y siempre con consentimiento previo y explicación detallada, se realiza la evaluación funcional que corresponda. Qué incluye y cómo se hace se conversa antes: nunca es una sorpresa.',
      'Si en la evaluación surge que hace falta una consulta médica —ginecológica, urológica u otra— lo planteamos. Muchos cuadros de esta área se abordan mejor en conjunto con otros profesionales.',
    ],
    proceso: [
      'El plan depende del cuadro y de lo que haya mostrado la evaluación. Según el caso, puede incluir trabajo de conciencia y control muscular, ejercicio terapéutico específico, coordinación con la respiración, pautas de hábitos y recursos de fisioterapia cuando están indicados.',
      'Los ejercicios de suelo pélvico no son todos iguales ni sirven para todas las situaciones: hay cuadros en los que conviene trabajar la activación y otros en los que el objetivo es justamente lo contrario. Por eso no publicamos rutinas generales y por eso la evaluación previa importa tanto.',
      'Es un proceso que suele requerir continuidad y en el que los cambios aparecen de manera gradual. Se revisa periódicamente para ajustar lo que haga falta.',
    ],
    participacion: [
      'Además de la continuidad entre sesiones, acá importa especialmente poder conversar con confianza. Hay síntomas que cuesta mencionar y que resultan clave para orientar el tratamiento: el espacio de la consulta está para eso.',
    ],
    advertencia:
      'Los síntomas de esta zona pueden tener distintas causas y algunas requieren valoración médica. El contenido de esta página es información general y no reemplaza una consulta individual.',
    preguntas: [
      {
        pregunta: '¿Es normal perder orina después de tener un hijo?',
        respuesta: [
          'Es frecuente, pero frecuente no es lo mismo que inevitable. Muchas personas conviven años con pérdidas de orina creyendo que no hay nada que hacer.',
          'Es un motivo de consulta habitual y conviene evaluarlo. Lo que se pueda trabajar en cada caso depende de la evaluación individual.',
        ],
      },
      {
        pregunta: '¿La atención es privada?',
        respuesta: [
          'Sí. La consulta se realiza en un espacio privado, con la explicación previa de todo lo que incluye y con tu consentimiento en cada paso.',
          'Podés venir acompañada o acompañado si eso te resulta más cómodo.',
        ],
      },
      {
        pregunta: '¿Los varones también consultan por esta área?',
        respuesta: [
          'Sí. Las disfunciones de suelo pélvico no son exclusivas de las mujeres. Es un motivo de consulta frecuente, por ejemplo, después de una cirugía de próstata.',
          'Si tenés dudas sobre si tu caso corresponde a esta área, escribinos y te orientamos.',
        ],
      },
      {
        pregunta: '¿Alcanza con hacer ejercicios de Kegel?',
        respuesta: [
          'No siempre, y en algunos cuadros puede incluso no ser lo indicado. Los ejercicios de contracción voluntaria son una herramienta entre varias y no resuelven todas las situaciones.',
          'Qué corresponde en cada caso surge de la evaluación. Por eso no recomendamos empezar con rutinas generales encontradas en internet.',
        ],
      },
    ],
  },

  /* ========================================================================
     5. MEP
     ===================================================================== */
  {
    slug: 'mep',
    nombre: 'MEP',
    nombreConsulta: 'MEP',
    tituloSeo: 'MEP en Canning | CKC Kinesiología',
    descripcionSeo:
      'MEP en CKC Kinesiología, Canning: en qué consiste, en qué situaciones puede estar indicada y cómo se determina si es adecuada para tu caso. Consultanos.',
    resumen:
      'Una de las técnicas que el consultorio ofrece, en sus líneas Sport y Beauty. Su indicación siempre surge de una evaluación profesional previa.',
    cuandoResumen: [
      'Te la recomendaron y querés saber en qué consiste',
      'Tenés una molestia que no cede con otros abordajes',
      'Querés saber si es adecuada para tu caso',
    ],
    motivo: 'pulso',
    tono: 'profundo',
    fotoSugerida: 'Foto a incorporar: equipamiento utilizado en las sesiones de MEP',

    introduccion: [
      'MEP es una de las técnicas que CKC ofrece, en dos líneas de trabajo: una orientada al ámbito deportivo y de las lesiones, y otra al área de estética.',
      'Como toda técnica, no es un tratamiento en sí misma: es un recurso que puede formar parte de un plan cuando la evaluación profesional indica que tiene sentido en ese caso.',
    ],
    descripcion: [
      'Se trata de un procedimiento que se aplica de forma localizada sobre la zona a tratar, con el objetivo de favorecer los procesos de reparación del propio organismo.',
      'En el consultorio se ofrece en dos líneas. La línea Sport se vincula al trabajo sobre lesiones y molestias del aparato locomotor, habitualmente en situaciones que ya tienen un tiempo de evolución. La línea Beauty corresponde al área de estética.',
      'En cualquiera de las dos, la técnica se integra a un plan más amplio. Rara vez se utiliza de manera aislada: suele combinarse con ejercicio terapéutico y con otros recursos, según el caso.',
    ],
    situaciones: [
      'Molestias del aparato locomotor que llevan tiempo y no respondieron a otros abordajes.',
      'Procesos en los que la evaluación sugiere trabajar sobre un tejido en particular.',
      'Casos en los que se busca complementar un plan de tratamiento ya iniciado.',
      'Consultas del área de estética correspondientes a la línea Beauty.',
    ],
    objetivos: [
      'Aportar un recurso más dentro de un plan definido profesionalmente.',
      'Trabajar de forma localizada sobre la zona que la evaluación identificó.',
      'Acompañar el proceso general de tratamiento, no reemplazarlo.',
    ],
    evaluacion: [
      'La indicación nunca se decide por teléfono ni a partir de una recomendación de terceros. Primero se evalúa: motivo de consulta, antecedentes, estudios si los hay, tratamientos previos y objetivo de la persona.',
      'A partir de ahí se determina si la técnica es adecuada para el caso, si conviene combinarla con otros recursos o si hay un abordaje más apropiado. También se revisa si existe alguna condición que la contraindique.',
      'Antes de cualquier aplicación se explica en qué consiste el procedimiento, qué sensaciones puede generar y qué cuidados conviene tener después. La persona decide con esa información.',
    ],
    proceso: [
      'La cantidad de aplicaciones, su frecuencia y su combinación con otros recursos dependen de cada caso y los define el profesional durante el proceso.',
      'Lo habitual es que la técnica se integre a un plan que incluye otros componentes, en particular ejercicio terapéutico orientado a sostener los cambios en el tiempo.',
      'La respuesta se evalúa sesión a sesión y el plan se ajusta en función de lo que se observa.',
    ],
    participacion: [
      'Las pautas posteriores a cada aplicación y la continuidad del trabajo complementario son parte del tratamiento. Y si en algún momento tenés dudas sobre el procedimiento o sobre lo que sentís después, decilo: esa información sirve para ajustar el plan.',
    ],
    advertencia:
      'Esta página describe en términos generales en qué consiste la técnica y cómo se determina su indicación. No constituye una recomendación para ningún caso particular: eso surge siempre de una evaluación profesional individual. Si querés saber si es adecuada para tu situación, consultanos.',
    preguntas: [
      {
        pregunta: '¿En qué consiste exactamente la sesión?',
        respuesta: [
          'El procedimiento se explica en detalle en la consulta, una vez hecha la evaluación y sabiendo de qué caso se trata.',
          'Preferimos hacerlo así y no publicar una descripción general: lo que corresponde, cómo se aplica y qué esperar varían según la situación de cada persona.',
        ],
      },
      {
        pregunta: '¿Cómo sé si es adecuada para mi caso?',
        respuesta: [
          'Con una evaluación. Es la única forma de determinar si la técnica tiene sentido para tu situación o si conviene otro abordaje.',
          'Escribinos contándonos tu motivo de consulta y te orientamos sobre los próximos pasos.',
        ],
      },
      {
        pregunta: '¿Cuál es la diferencia entre la línea Sport y la línea Beauty?',
        respuesta: [
          'La línea Sport se orienta al trabajo sobre lesiones y molestias del aparato locomotor. La línea Beauty corresponde al área de estética del consultorio.',
          'Si querés saber cuál corresponde a lo que estás buscando, consultanos y te lo aclaramos.',
        ],
      },
    ],
  },
];

/** Busca un servicio por su slug. */
export function servicioPorSlug(slug: string): Servicio | undefined {
  return SERVICIOS.find((s) => s.slug === slug);
}
