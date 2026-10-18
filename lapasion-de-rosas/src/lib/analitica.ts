/**
 * Medición de eventos.
 *
 * El sitio NO incluye ningún script de terceros por defecto. Esta capa
 * sólo emite un `CustomEvent` en el documento y, si existe, llama a
 * `window.dataLayer`. Conectá la herramienta que uses (respetando el
 * consentimiento del visitante) escuchando el evento `lpdr:evento`.
 *
 *   document.addEventListener("lpdr:evento", (e) => { ... })
 *
 * Nunca se envían datos personales: sólo el nombre del evento y
 * metadatos no identificables (por ejemplo, el motivo elegido).
 */

export type EventoSitio =
  | "reserva_click"
  | "reserva_inicio_formulario"
  | "reserva_envio"
  | "whatsapp_click"
  | "como_llegar_click"
  | "instagram_click"
  | "menu_visto"
  | "ocasion_seleccionada"
  | "prensa_click";

type Metadatos = Record<string, string | number | boolean>;

export function medir(evento: EventoSitio, metadatos: Metadatos = {}): void {
  if (typeof document === "undefined") return;

  document.dispatchEvent(
    new CustomEvent("lpdr:evento", { detail: { evento, ...metadatos } }),
  );

  const w = window as Window & { dataLayer?: Metadatos[] };
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: evento, ...metadatos });
  }
}
