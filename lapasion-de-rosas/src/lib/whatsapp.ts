import { contacto, siVerificado } from "@content/site";

/**
 * Arma un enlace de WhatsApp con el mensaje precargado.
 * Devuelve `null` si todavía no hay un número oficial confirmado: el sitio
 * nunca enlaza a un número inventado.
 */
export function enlaceWhatsapp(mensaje: string): string | null {
  const numero = siVerificado(contacto.whatsapp);
  if (!numero) return null;
  const limpio = numero.replace(/\D/g, "");
  if (limpio.length < 8) return null;
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}
