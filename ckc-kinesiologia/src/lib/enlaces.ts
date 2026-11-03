import { CONTACTO, MENSAJES } from '@/data/site';

/**
 * Arma el enlace para iniciar una conversacion de WhatsApp con el mensaje
 * precargado que corresponde a la seccion desde la que se hace clic.
 *
 * Si el numero todavia no esta confirmado en `src/data/site.ts`, devuelve un
 * enlace interno a la pagina de contacto. De esa forma el boton nunca queda
 * roto ni apunta a un numero inventado: lleva a la seccion donde estan los
 * canales que si estan activos.
 */
export function enlaceWhatsApp(mensaje: string = MENSAJES.general): string {
  const numero = CONTACTO.whatsapp;
  if (!numero) return '/#turnos';
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** `true` si el enlace de WhatsApp apunta de verdad a WhatsApp. */
export function whatsAppActivo(): boolean {
  return CONTACTO.whatsapp !== null;
}

/** Atributos de apertura: solo abre en pestaña nueva si es un enlace externo. */
export function atributosEnlace(href: string) {
  const externo = /^https?:\/\//.test(href);
  return externo
    ? { target: '_blank', rel: 'noopener noreferrer' as const }
    : {};
}

/** Normaliza una ruta interna para que siempre termine con barra. */
export function ruta(path: string): string {
  if (/^https?:\/\//.test(path) || path.startsWith('#')) return path;
  const [base, hash] = path.split('#');
  const limpio = base.endsWith('/') ? base : `${base}/`;
  return hash ? `${limpio}#${hash}` : limpio;
}

/** Compara la ruta actual con la de un enlace, ignorando la barra final. */
export function esRutaActiva(actual: string, destino: string): boolean {
  const n = (s: string) => (s.endsWith('/') ? s : `${s}/`);
  const a = n(actual);
  const d = n(destino);
  if (d === '/') return a === '/';
  return a === d || a.startsWith(d);
}
