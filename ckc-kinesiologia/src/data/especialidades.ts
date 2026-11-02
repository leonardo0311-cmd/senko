/**
 * ESPECIALIDADES Y TRATAMIENTOS
 *
 * Organiza por MOTIVO DE CONSULTA las areas de atencion confirmadas del
 * consultorio, para que cada visitante identifique rapido la categoria que le
 * interesa. Cada categoria remite al servicio correspondiente: no se inventan
 * areas nuevas ni se sugiere que toda molestia requiera kinesiologia.
 */

export type Especialidad = {
  id: string;
  titulo: string;
  /** Icono del encabezado. */
  icono:
    | 'cuerpo'
    | 'movimiento'
    | 'equilibrio'
    | 'persona'
    | 'tiempo'
    | 'objetivo';
  /** Que tipo de problema aborda. */
  queAborda: string;
  /** Sintomas o limitaciones que pueden motivar una consulta. */
  senales: string[];
  /** Por que importa una evaluacion profesional. */
  porQueEvaluar: string;
  /** Que objetivos pueden plantearse. */
  objetivos: string;
  /** Como se determina el plan de tratamiento. */
  comoSeDefine: string;
  /** Que papel cumple la continuidad del proceso. */
  continuidad: string;
  /** Servicios relacionados, por slug. */
  servicios: string[];
};

export const ESPECIALIDADES: Especialidad[] = [
  {
    id: 'musculoesqueleticas',
    titulo: 'Molestias musculoesqueléticas',
    icono: 'cuerpo',
    queAborda:
      'Dolores y limitaciones que afectan músculos, articulaciones, tendones y las estructuras que permiten el movimiento. Es el motivo de consulta más frecuente en kinesiología y abarca situaciones muy distintas entre sí.',
    senales: [
      'Dolor en una zona que no cede con el paso de los días.',
      'Rigidez al empezar el día o después de estar mucho tiempo en la misma posición.',
      'Molestias que aparecen en un movimiento puntual y no en otros.',
      'Dolor que cambia la forma de moverse, caminar o apoyar.',
    ],
    porQueEvaluar:
      'Una misma zona puede doler por motivos muy diferentes, y el origen no siempre está donde se siente el síntoma. La evaluación profesional distingue qué está pasando y, sobre todo, si la kinesiología es el abordaje adecuado o si conviene una consulta médica previa.',
    objetivos:
      'Según el caso, pueden plantearse objetivos vinculados a la movilidad, la tolerancia al movimiento, la fuerza, el control motor y la vuelta a las actividades que la molestia condicionó.',
    comoSeDefine:
      'A partir de la evaluación inicial. Se consideran el motivo de consulta, los antecedentes, el tiempo de evolución, los estudios disponibles y el objetivo concreto de la persona.',
    continuidad:
      'La mayoría de estos procesos requiere continuidad: los cambios en la movilidad y la fuerza responden al trabajo sostenido. Interrumpir cuando el dolor baja suele dejar el proceso a mitad de camino.',
    servicios: ['tratamiento-y-prevencion-de-lesiones', 'kinesiologia-deportiva'],
  },
  {
    id: 'lesiones-actividad-fisica',
    titulo: 'Lesiones relacionadas con la actividad física',
    icono: 'movimiento',
    queAborda:
      'Lesiones y molestias que aparecen al practicar deporte, entrenar o retomar la actividad física. Incluye tanto el episodio agudo como las molestias que se arrastran durante meses.',
    senales: [
      'Una lesión durante el entrenamiento o la competencia.',
      'Molestias que aparecen siempre en el mismo gesto o a partir de cierta intensidad.',
      'Dolor que reaparece cada vez que se retoma la actividad.',
      'Sensación de inestabilidad o de falta de fuerza en una zona.',
    ],
    porQueEvaluar:
      'En la actividad física importa entender el contexto: qué se hace, cuánto, con qué frecuencia y qué cambió antes de que apareciera el síntoma. Sin esa información es difícil que el problema deje de repetirse, aunque el dolor baje.',
    objetivos:
      'Acompañar la recuperación, trabajar la tolerancia progresiva a la carga, recuperar la confianza en el movimiento y aportar criterios para reducir la probabilidad de recaída.',
    comoSeDefine:
      'Con una evaluación que incluye el gesto deportivo cuando es posible observarlo. El plan contempla el deporte de la persona y sus exigencias específicas.',
    continuidad:
      'La vuelta a la actividad es progresiva y por etapas. Saltearlas es una de las causas más frecuentes de recaída, incluso cuando la molestia ya no se siente.',
    servicios: ['kinesiologia-deportiva', 'tratamiento-y-prevencion-de-lesiones'],
  },
  {
    id: 'posoperatorio',
    titulo: 'Recuperación posterior a determinadas cirugías',
    icono: 'tiempo',
    queAborda:
      'El proceso de recuperación funcional después de una cirugía, cuando el equipo médico tratante indica kinesiología como parte del tratamiento.',
    senales: [
      'Indicación médica de rehabilitación kinésica después de una cirugía.',
      'Limitación de movilidad o de fuerza en la zona operada.',
      'Dificultad para retomar actividades cotidianas durante la recuperación.',
      'Dudas sobre cómo avanzar sin forzar el proceso.',
    ],
    porQueEvaluar:
      'Cada cirugía tiene sus tiempos y sus cuidados, y cada persona evoluciona de manera distinta. La evaluación permite situarse en la etapa real del proceso y trabajar en consecuencia, respetando siempre las indicaciones del equipo médico tratante.',
    objetivos:
      'Acompañar la recuperación de la movilidad y la función, sostener la progresión de cargas según la etapa y retomar gradualmente las actividades de la vida diaria.',
    comoSeDefine:
      'A partir de la indicación médica y de la evaluación kinésica. Cuando hay pautas del equipo quirúrgico, el plan se construye dentro de ese marco.',
    continuidad:
      'Es una de las áreas donde la continuidad y el respeto por los tiempos pesan más. Apurar etapas puede comprometer el resultado; demorarlas, también.',
    servicios: ['tratamiento-y-prevencion-de-lesiones'],
  },
  {
    id: 'movilidad-equilibrio',
    titulo: 'Limitaciones de movilidad y equilibrio',
    icono: 'equilibrio',
    queAborda:
      'Situaciones en las que se reduce la capacidad de moverse con seguridad: menos fuerza, cambios en el equilibrio, una marcha más insegura o dificultad en movimientos cotidianos.',
    senales: [
      'Caídas, tropiezos frecuentes o episodios de desequilibrio.',
      'Inseguridad al caminar, al girar o al bajar escaleras.',
      'Dificultad para levantarse de una silla o de la cama.',
      'Evitar ciertas actividades por miedo a caerse.',
    ],
    porQueEvaluar:
      'El riesgo de caídas depende de varios factores que se suman, y no todos son kinésicos: la visión, la medicación o el entorno de la casa pueden estar participando. Una evaluación profesional distingue sobre qué se puede trabajar y qué conviene derivar.',
    objetivos:
      'Trabajar el equilibrio, la fuerza de las piernas y la calidad de la marcha, recuperar seguridad en los movimientos cotidianos y sostener la mayor autonomía posible.',
    comoSeDefine:
      'Con una evaluación del riesgo de caídas que valora equilibrio, marcha, fuerza y la capacidad de realizar movimientos de la vida diaria.',
    continuidad:
      'La fuerza y el equilibrio se mantienen con trabajo sostenido y se pierden rápido con la inactividad. La continuidad es parte del resultado.',
    servicios: ['prevencion-de-caidas'],
  },
  {
    id: 'funcionales',
    titulo: 'Alteraciones funcionales del suelo pélvico',
    icono: 'persona',
    queAborda:
      'Disfunciones vinculadas a la musculatura del piso pélvico, que afectan funciones cotidianas como la continencia, el soporte de los órganos pélvicos o la respuesta del cuerpo frente a los esfuerzos.',
    senales: [
      'Pérdidas de orina al toser, estornudar, reír o hacer actividad física.',
      'Urgencia o aumento de la frecuencia para ir al baño.',
      'Sensación de peso o presión en la zona pélvica.',
      'Cambios funcionales después de un embarazo, un parto o una cirugía pélvica.',
    ],
    porQueEvaluar:
      'Los síntomas de esta zona pueden tener causas distintas y algunas requieren valoración médica. Además, no todos los cuadros se trabajan igual: hay situaciones en las que conviene trabajar la activación muscular y otras en las que el objetivo es el contrario.',
    objetivos:
      'Mejorar la conciencia y el control de la musculatura, trabajar su coordinación con la respiración y el resto del cuerpo, y reducir el impacto de los síntomas en la vida cotidiana.',
    comoSeDefine:
      'Con una evaluación que empieza por la conversación y continúa, con consentimiento previo y explicación detallada, con la valoración funcional que corresponda.',
    continuidad:
      'Es un proceso gradual que requiere continuidad. Los cambios suelen aparecer de a poco y se sostienen con el trabajo entre sesiones.',
    servicios: ['suelo-pelvico'],
  },
  {
    id: 'reeducacion',
    titulo: 'Reeducación del movimiento y prevención',
    icono: 'objetivo',
    queAborda:
      'El trabajo sobre cómo se mueve el cuerpo: la calidad del movimiento, el control, la fuerza disponible y la forma en que se dosifican las cargas de cada día.',
    senales: [
      'Molestias que se repiten en la misma zona cada cierto tiempo.',
      'Querer empezar o retomar una actividad física con una evaluación previa.',
      'Haber tenido una lesión y querer reducir la chance de que vuelva.',
      'Molestias vinculadas a posturas o gestos sostenidos muchas horas.',
    ],
    porQueEvaluar:
      'Trabajar sobre el movimiento sin saber qué se necesita suele llevar a repetir ejercicios genéricos. La evaluación identifica qué conviene atender en cada caso y permite priorizar.',
    objetivos:
      'Mejorar las condiciones con las que el cuerpo enfrenta las exigencias cotidianas y aportar herramientas para sostener el cuidado de forma autónoma.',
    comoSeDefine:
      'A partir de una evaluación funcional y del contexto real de cada persona: su trabajo, su actividad física y el tiempo del que dispone.',
    continuidad:
      'En esta área la continuidad es casi todo: las condiciones que se construyen con trabajo sostenido se pierden cuando se interrumpe.',
    servicios: ['tratamiento-y-prevencion-de-lesiones', 'kinesiologia-deportiva'],
  },
];
