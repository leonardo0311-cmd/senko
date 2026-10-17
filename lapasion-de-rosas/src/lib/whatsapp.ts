import { contacto, marca, siVerificado } from "@content/site";

/**
 * Arma un enlace de WhatsApp con el mensaje precargado.
 * Devuelve `null` si todavía no hay un número oficial confirmado: el sitio
 * nunca enlaza a un número inventado.
 */
export function enlaceWhatsapp(mensaje?: string): string | null {
  const numero = siVerificado(contacto.whatsapp);
  if (!numero) return null;

  const limpio = numero.replace(/\D/g, "");
  if (limpio.length < 8) return null;

  const texto = mensaje ?? mensajePorDefecto;
  return `https://wa.me/${limpio}?text=${encodeURIComponent(texto)}`;
}

export const mensajePorDefecto = `Hola, estoy visitando la web de ${marca.nombre} y quisiera hacer una consulta.`;

export type DatosConsulta = {
  nombre: string;
  telefono: string;
  email?: string;
  fecha?: string;
  horario?: string;
  personas?: string;
  motivo: string;
  comentarios?: string;
};

/** Mensaje estructurado para una solicitud de reserva. */
export function mensajeReserva(d: DatosConsulta): string {
  const lineas = [
    `Hola, quisiera consultar por una reserva en ${marca.nombre}.`,
    "",
    `Nombre: ${d.nombre}`,
    `Teléfono: ${d.telefono}`,
  ];

  if (d.email) lineas.push(`Email: ${d.email}`);
  if (d.fecha) lineas.push(`Fecha: ${formatearFecha(d.fecha)}`);
  if (d.horario) lineas.push(`Horario: ${d.horario}`);
  if (d.personas) lineas.push(`Cantidad de personas: ${d.personas}`);
  lineas.push(`Motivo de la visita: ${d.motivo}`);
  if (d.comentarios) lineas.push(`Comentarios: ${d.comentarios}`);

  return lineas.join("\n");
}

/** `2026-03-14` -> `14/03/2026`. Evita el desfasaje de zona horaria de `new Date`. */
export function formatearFecha(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Enlace mailto como alternativa cuando el canal configurado es el correo. */
export function enlaceEmail(asunto: string, cuerpo: string): string | null {
  const direccion = siVerificado(contacto.email);
  if (!direccion) return null;
  return `mailto:${direccion}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
