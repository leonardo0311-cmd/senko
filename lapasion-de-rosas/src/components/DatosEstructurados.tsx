import { contacto, marca, redes, siVerificado, seo, siteUrl } from "@content/site";

/**
 * Datos estructurados schema.org.
 *
 * Sólo se publican campos confirmados: si la dirección, el teléfono o los
 * horarios todavía no están verificados, no se emiten. Es preferible un
 * marcado incompleto a uno que afirme datos incorrectos.
 */
export function DatosEstructurados() {
  const direccion = siVerificado(contacto.direccion);
  const telefono = siVerificado(contacto.telefono) ?? siVerificado(contacto.whatsapp);
  const horarios = siVerificado(contacto.horarios);
  const instagram = siVerificado(redes.instagram);
  const coords = siVerificado(contacto.coordenadas);
  const mapa = siVerificado(contacto.mapaUrl);

  const datos: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: marca.nombre,
    description: seo.descripcion,
    url: siteUrl,
    servesCuisine: "Argentina",
    acceptsReservations: "True",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ezeiza",
      addressRegion: "Provincia de Buenos Aires",
      addressCountry: "AR",
      ...(direccion ? { streetAddress: direccion } : {}),
    },
  };

  if (telefono) datos.telephone = telefono;
  if (mapa) datos.hasMap = mapa;
  if (instagram) datos.sameAs = [instagram.url];
  if (coords) {
    datos.geo = { "@type": "GeoCoordinates", latitude: coords.lat, longitude: coords.lng };
  }
  if (horarios && horarios.length > 0) {
    datos.openingHours = horarios.map((h) => `${h.dia} ${h.franja}`);
  }

  return (
    <script
      type="application/ld+json"
      // El objeto se construye acá mismo a partir de datos propios.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }}
    />
  );
}
