"use client";

import type { ReactNode } from "react";
import { BotonEnlace } from "./Boton";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { medir } from "@/lib/analitica";

type Props = {
  mensaje: string;
  children: ReactNode;
  variante?: "principal" | "secundario";
  origen: string;
  className?: string;
};

/**
 * Botón de contacto con degradación honesta.
 *
 * Si hay un WhatsApp oficial confirmado, abre el chat con el mensaje
 * precargado. Si todavía no lo hay, lleva al formulario de reservas en lugar
 * de enlazar a un número inventado: nunca queda un enlace muerto ni un botón
 * decorativo sin función.
 */
export function ContactoDirecto({
  mensaje,
  children,
  variante = "secundario",
  origen,
  className,
}: Props) {
  const wa = enlaceWhatsapp(mensaje);

  if (wa) {
    return (
      <BotonEnlace
        href={wa}
        externo
        variante={variante}
        className={className}
        onClick={() => medir("whatsapp_click", { origen })}
      >
        {children}
      </BotonEnlace>
    );
  }

  return (
    <BotonEnlace
      href="#reservas"
      variante={variante}
      className={className}
      onClick={() => medir("reserva_click", { origen })}
    >
      {children}
    </BotonEnlace>
  );
}
