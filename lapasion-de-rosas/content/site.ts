/**
 * ============================================================================
 * FUENTE ÚNICA DE DATOS — La Pasión de Rosas
 * ============================================================================
 *
 * Los textos visibles están en `content/i18n.ts` (español e inglés).
 * Acá viven los datos duros: contacto, redes, reservas y SEO.
 *
 * SOBRE `verificado`
 * ------------------
 * Cada dato sensible lleva un flag. Mientras sea `false`, el sitio NO publica
 * el valor: muestra una vía de contacto en su lugar. Así no sale al aire una
 * dirección, un horario o un teléfono sin confirmar. Ver VERIFICAR.md.
 */

export type DatoVerificable<T> = {
  valor: T;
  verificado: boolean;
  /** Nota interna para quien edita. Nunca se muestra al visitante. */
  nota?: string;
};

const dato = <T,>(valor: T, verificado: boolean, nota?: string): DatoVerificable<T> => ({
  valor,
  verificado,
  nota,
});

/** Devuelve el valor sólo si fue confirmado; si no, `null`. */
export function siVerificado<T>(d: DatoVerificable<T>): T | null {
  return d.verificado ? d.valor : null;
}

/* -------------------------------------------------------------------------- */

export const marca = {
  nombre: "La Pasión de Rosas",
  ciudad: "Ezeiza",
  provincia: "Provincia de Buenos Aires",
  pais: "Argentina",
  /**
   * Logotipo oficial, tal como lo entregó el restaurante. El archivo de
   * `public/marca/logo-original.png` es el maestro; `logo.webp` es el mismo
   * con el fondo recortado para poder apoyarlo sobre cualquier superficie.
   * No se redibujó nada. Si vuelve a null, el sitio compone el nombre
   * tipográficamente, como antes de tenerlo.
   */
  logo: {
    src: "/marca/logo.webp",
    ancho: 814,
    alto: 512,
  } as { src: string; ancho: number; alto: number } | null,
} as const;

export const contacto = {
  whatsapp: dato(
    "",
    false,
    "PENDIENTE. Fuentes de terceros listan números distintos y desactualizados. Pedir el oficial.",
  ),
  telefono: dato("", false, "PENDIENTE."),
  email: dato("", false, "PENDIENTE."),
  direccion: dato(
    "",
    false,
    "PENDIENTE. Fuentes públicas en conflicto (Berutti 287 vs. A. U. Illia 710).",
  ),
  mapaUrl: dato("", false, "PENDIENTE. Pegar el enlace oficial de Google Maps."),
  horarios: dato<string[]>([], false, "PENDIENTE. Fuentes públicas en conflicto."),
} as const;

export const redes = {
  instagram: dato(
    { usuario: "la_pasion_de_rosas", url: "https://www.instagram.com/la_pasion_de_rosas/" },
    false,
    "Confirmar que sea el perfil oficial vigente.",
  ),
  tiktok: dato("", false),
} as const;

export const reservas = {
  /** El restaurante confirma a mano: el sitio nunca da una reserva por hecha. */
  confirmacionAutomatica: false,
} as const;

export const navegacion = [
  { id: "inicio", clave: "nav_home" },
  { id: "carta", clave: "nav_menu" },
  { id: "lugar", clave: "nav_locations" },
  { id: "nosotros", clave: "nav_about" },
  { id: "prensa", clave: "nav_press" },
  { id: "reservas", clave: "nav_reservations" },
  { id: "contacto", clave: "nav_contact" },
] as const;

export const seo = {
  descripcion:
    "Parrilla en Ezeiza, Provincia de Buenos Aires. Costillar a las brasas, con reserva previa. Se cocina para pocos.",
  descripcionEn:
    "Argentine grill in Ezeiza, Buenos Aires Province. Slow-fire short ribs, by reservation only.",
  palabras: [
    "parrilla en Ezeiza",
    "restaurante en Ezeiza",
    "costillar asado Ezeiza",
    "cena especial Ezeiza",
    "restaurante para celebraciones Buenos Aires",
  ],
} as const;

/**
 * URL base del sitio, usada para el canonical, el sitemap y la vista previa al
 * compartir el enlace.
 *
 * 1. `NEXT_PUBLIC_SITE_URL` si está definida (el dominio real, en producción).
 * 2. El dominio del propio deploy en Vercel, para que una vista previa no
 *    apunte a un dominio que todavía no existe.
 * 3. El dominio definitivo, como último recurso.
 */
function resolverSiteUrl(): string {
  const explicita = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicita) return explicita.replace(/\/$/, "");

  const vercel =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return "https://lapasionderosas.com.ar";
}

export const siteUrl = resolverSiteUrl();

/* --------------------------------------------------------------------------
 * PRENSA
 *
 * Notas publicadas sobre la casa. Los enlaces salieron de una búsqueda web;
 * no se pudieron abrir una por una para verificar su contenido, así que
 * `prensaVerificada` queda en false y el sitio muestra el aviso naranja.
 * Al confirmarlas, poner la bandera en true.
 * ------------------------------------------------------------------------ */

export const prensaVerificada = false;

export type Nota = {
  /** Nombre del medio, tal como se firma. */
  medio: string;
  /** Titular de la nota. */
  titulo: string;
  /** Enlace a la nota en el sitio del medio. */
  url: string;
};

export const PRENSA: readonly Nota[] = [
  {
    medio: "Ámbito",
    titulo:
      "Joya oculta: una parrilla secreta con una propuesta única que es furor entre amantes de la carne",
    url: "https://www.ambito.com/lifestyle/joya-oculta-una-parrilla-secreta-una-propuesta-unica-que-es-furor-amantes-la-carne-n5770221",
  },
  {
    medio: "Informe Operadores de Mercado",
    titulo: "La Pasión de Rosas",
    url: "https://www.informeoperadores.com.ar/2022/01/31/la-pasion-de-rosas/",
  },
  {
    medio: "Tripadvisor",
    titulo: "La Pasión de Rosas, Ezeiza · opiniones y reservas",
    url: "https://www.tripadvisor.com.ar/Restaurant_Review-g2008837-d12080015-Reviews-La_Pasion_de_Rosas-Ezeiza_Province_of_Buenos_Aires_Central_Argentina.html",
  },
] as const;
