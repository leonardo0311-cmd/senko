/** Tipos de dominio. La UI y la API trabajan solo con esto, nunca con filas de SQL. */

export type Rol = "dueno" | "profesional";

export type MetodoPagoClave = "efectivo" | "transferencia" | "credito" | "debito";

export const METODOS_ORDEN: MetodoPagoClave[] = [
  "efectivo",
  "transferencia",
  "debito",
  "credito",
];

export type EstadoTurno =
  | "pendiente"
  | "confirmado"
  | "completado"
  | "cancelado"
  | "ausente";

export type OrigenTurno = "bot" | "dashboard";

export type TipoPago = "sena" | "saldo" | "total";

export type EstadoPago = "pendiente" | "confirmado" | "rechazado";

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  /** Qué hace: peluquera, colorista, manicura… Es texto libre. */
  ocupacion: string | null;
  telefono: string | null;
  color: string;
  activo: boolean;
  creadoEn: string;
};

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  notas: string | null;
  creadoEn: string;
};

export type Servicio = {
  id: string;
  nombre: string;
  /** En centavos. */
  precioBase: number;
  duracionMin: number;
  senaTipo: "porcentaje" | "fijo";
  /** Porcentaje (0-100) o centavos, segun `senaTipo`. */
  senaValor: number;
  activo: boolean;
};

export type MetodoPago = {
  clave: MetodoPagoClave;
  etiqueta: string;
  /** Positivo = recargo, negativo = descuento. Ej: 10 = +10%, -10 = -10%. */
  ajustePct: number;
  activo: boolean;
  orden: number;
};

export type Horario = {
  id: string;
  profesionalId: string;
  /** 0 = domingo ... 6 = sabado */
  diaSemana: number;
  desde: string;
  hasta: string;
};

export type Turno = {
  id: string;
  clienteId: string;
  profesionalId: string;
  servicioId: string;
  inicio: string;
  fin: string;
  estado: EstadoTurno;
  origen: OrigenTurno;
  /** Precio general del servicio al momento de reservar, en centavos. */
  precioBase: number;
  notas: string | null;
  refExterna: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type TurnoDetalle = Turno & {
  clienteNombre: string;
  clienteTelefono: string;
  profesionalNombre: string;
  profesionalColor: string;
  servicioNombre: string;
  /** Suma de pagos confirmados imputados al turno, en centavos. */
  pagado: number;
  /** Seña esperada segun la regla del servicio, en centavos. */
  senaEsperada: number;
  senaCubierta: boolean;
  /** Cuantos comentarios tiene cargados. */
  comentarios: number;
  /** Minutos de la ultima demora avisada, si hay alguna. */
  demoraMin: number | null;
};

export type Pago = {
  id: string;
  turnoId: string | null;
  clienteId: string;
  metodo: MetodoPagoClave;
  tipo: TipoPago;
  /** Parte del precio general que cubre este pago, en centavos. */
  montoBase: number;
  ajustePct: number;
  /** Recargo (+) o descuento (-) aplicado, en centavos. */
  ajusteMonto: number;
  /** Lo que realmente entra en caja, en centavos. */
  montoTotal: number;
  estado: EstadoPago;
  alias: string | null;
  referencia: string | null;
  pagadoEn: string | null;
  creadoEn: string;
};

export type PagoDetalle = Pago & {
  clienteNombre: string;
  servicioNombre: string | null;
  turnoInicio: string | null;
  profesionalNombre: string | null;
};

/** Totales por metodo de pago, en centavos. */
export type DesglosePorMetodo = Record<MetodoPagoClave, number>;

export type ResumenCliente = {
  cliente: Cliente;
  /** Lo que realmente gasto, con recargos y descuentos aplicados. */
  totalCobrado: number;
  /** Lo mismo medido a precio general, sin ajustes. */
  totalBase: number;
  /** totalCobrado - totalBase. Positivo = pago mas por recargos. */
  totalAjustes: number;
  porMetodo: DesglosePorMetodo;
  baseEnPorMetodo: DesglosePorMetodo;
  senasPagadas: number;
  senasPendientes: number;
  turnos: number;
  turnosCancelados: number;
  ultimoTurno: string | null;
};

// ------------------------------------------------- comentarios y avisos

export type TipoComentario = "nota" | "demora" | "ausencia";

export type Comentario = {
  id: string;
  turnoId: string;
  autorId: string | null;
  autorNombre: string;
  texto: string;
  tipo: TipoComentario;
  /** Minutos de demora, solo cuando `tipo` es "demora". */
  minutos: number | null;
  creadoEn: string;
};

export type TipoNotificacion = "demora" | "ausencia" | "comentario" | "sena";

export type Notificacion = {
  id: string;
  destinatarioId: string;
  autorId: string | null;
  autorNombre: string | null;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string;
  turnoId: string | null;
  /** Datos del turno al que apunta, para no tener que ir a buscarlo. */
  turnoInicio: string | null;
  clienteNombre: string | null;
  leida: boolean;
  /** Ya se la pasamos al bot para que la mande por WhatsApp. */
  avisada: boolean;
  creadoEn: string;
};
