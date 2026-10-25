import { Chip } from "./ui";
import type { EstadoPago, EstadoTurno, OrigenTurno, TipoPago } from "@/lib/types";

const TURNO: Record<EstadoTurno, { texto: string; tono: string }> = {
  pendiente: { texto: "Pendiente", tono: "aviso" },
  confirmado: { texto: "Confirmado", tono: "acento" },
  completado: { texto: "Completado", tono: "ok" },
  cancelado: { texto: "Cancelado", tono: "neutro" },
  ausente: { texto: "No vino", tono: "grave" },
};

export function EstadoTurnoChip({ estado }: { estado: EstadoTurno }) {
  const e = TURNO[estado];
  return <Chip tono={e.tono}>{e.texto}</Chip>;
}

const PAGO: Record<EstadoPago, { texto: string; tono: string }> = {
  pendiente: { texto: "Por acreditar", tono: "aviso" },
  confirmado: { texto: "Acreditado", tono: "ok" },
  rechazado: { texto: "Rechazado", tono: "grave" },
};

export function EstadoPagoChip({ estado }: { estado: EstadoPago }) {
  const e = PAGO[estado];
  return <Chip tono={e.tono}>{e.texto}</Chip>;
}

const TIPO: Record<TipoPago, string> = {
  sena: "Seña",
  saldo: "Saldo",
  total: "Pago total",
};

export function TipoPagoChip({ tipo }: { tipo: TipoPago }) {
  return <Chip tono="neutro">{TIPO[tipo]}</Chip>;
}

export function OrigenChip({ origen }: { origen: OrigenTurno }) {
  return origen === "bot" ? (
    <Chip tono="acento" titulo="Reservado por el bot de WhatsApp">
      bot
    </Chip>
  ) : (
    <Chip tono="neutro" titulo="Cargado a mano desde el panel">
      panel
    </Chip>
  );
}

export const TEXTO_TIPO_PAGO = TIPO;
