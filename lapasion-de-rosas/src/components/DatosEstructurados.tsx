import { contacto, marca, redes, seo, siVerificado, siteUrl } from "@content/site";

/**
 * Datos estructurados schema.org.
 *
 * Sólo se publican campos confirmados: un marcado incompleto es preferible a
 * uno que afirme datos incorrectos.
 */
export function DatosEstructurados() {
  const direccion = siVerificado(contacto.direccion);
  const telefono = siVerificado(contacto.telefono) ?? siVerificado(contacto.whatsapp);
  const horarios = siVerificado(contacto.horarios);
  const instagram = siVerificado(redes.instagram);
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
      addressLocality: marca.ciudad,
      addressRegion: marca.provincia,
      addressCountry: "AR",
      ...(direccion ? { streetAddress: direccion } : {}),
    },
  };

  if (telefono) datos.telephone = telefono;
  if (mapa) datos.hasMap = mapa;
  if (instagram) datos.sameAs = [instagram.url];
  if (horarios && horarios.length > 0) datos.openingHours = horarios;

  return (
    <script
      type="application/ld+json"
      // El objeto se construye acá mismo a partir de datos propios.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }}
    />
  );
}
