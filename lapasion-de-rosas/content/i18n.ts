/**
 * ============================================================================
 * TEXTOS — español e inglés
 * ============================================================================
 * Todo lo que se lee en pantalla sale de acá. Para cambiar una frase, editala
 * en los dos idiomas y listo: no hace falta tocar ningún componente.
 */

export type Idioma = "es" | "en";

type Diccionario = Record<string, string>;

export const I18N: Record<Idioma, Diccionario> = {
  es: {
    skip_link: "Saltar a la carta",
    cursor_view: "VER",

    nav_home: "Inicio",
    nav_menu: "La carta",
    nav_locations: "Dónde estamos",
    nav_about: "Nosotros",
    nav_press: "Prensa",
    nav_reservations: "Reservas",
    nav_contact: "Contacto",
    nav_toggle_aria: "Abrir menú",

    cta_book: "Pedí tu mesa",
    cta_view_menu: "Ver la carta",
    mobile_book: "Pedir mesa →",

    hero_eyebrow: "Ezeiza · Provincia de Buenos Aires",
    hero_name_1: "La Pasión",
    hero_name_2: "de Rosas",
    hero_sub: "Parrilla · A las brasas",
    hero_quote: "«Se cocina para pocos, y se reserva con tiempo.»",
    hero_scroll: "Scroll para descubrir",

    marquee: "<b>La Pasión de Rosas</b> · Parrilla · Brasas · Costillar · Ezeiza · Buenos Aires ·",

    about_eyebrow: "La Pasión de Rosas",
    about_title: "No es solo<br>una parrilla.<br><em>Es a puertas cerradas.</em>",
    about_text:
      "En Ezeiza, a las brasas y con reserva previa. Se cocina para pocos: cada servicio se prepara con tiempo y cada mesa se acuerda de antemano. Eso es lo que permite que la noche tenga su propio ritmo, que el fuego trabaje despacio y que nadie esté apurado.",
    about_meta_1_value: "Ezeiza",
    about_meta_1_label: "Provincia de Buenos Aires",
    about_meta_2_value: "Reserva",
    about_meta_2_label: "Previa, siempre",
    about_meta_3_value: "Brasas",
    about_meta_3_label: "El centro de la cocina",
    about_tag: "Una mesa por vez, sin apuro.",

    fuego_eyebrow: "El fuego",
    fuego_title: "Todo comienza con el fuego.",
    fuego_sub: "Brasas, tiempo y paciencia. El resto llega solo.",

    menu_eyebrow: "La carta",
    menu_title: "La carta",
    menu_note:
      "La propuesta cambia según el día y la temporada. Valores expresados en pesos argentinos.",
    menu_search_label: "Buscar un plato por nombre",
    menu_search_placeholder: "Buscar un plato… (ej. costillar, provoleta, vino)",
    menu_filters_aria: "Filtrar por tipo de plato",
    menu_clear: "Limpiar filtros",
    menu_catrail_aria: "Ir a una categoría de la carta",
    menu_set_subtitle: "Menú por pasos",
    menu_pending_label: "Pendiente",
    menu_pending_text:
      "Platos y precios de ejemplo, para mostrar cómo se ve la carta. Todavía no están confirmados por el restaurante: no publiques el sitio con estos valores.",
    results_found_one: "1 plato encontrado.",
    results_found_many: "{n} platos encontrados.",
    results_empty: "Ningún plato coincide con tu búsqueda.",

    tag_Brasas: "A las brasas",
    tag_Vegetariano: "Vegetariano",
    tag_SinTACC: "Sin TACC",
    tag_Compartir: "Para compartir",
    tag_Clasico: "Clásico",

    spec_eyebrow: "Especialidades",
    spec_title: "Lo que sale de la parrilla.",
    spec_block_eyebrow: "El plato de la casa",
    spec_desc:
      "El corte que define la casa: horas de brasa baja hasta que cede solo. Se sirve para compartir.",

    gal_eyebrow: "La experiencia",
    gal_title: "La experiencia,<br>en imágenes.",

    opts_eyebrow: "Encuentros",
    opts_title: "Un lugar. Muchos motivos.",
    opts_text1:
      "Hay momentos que merecen salir de lo cotidiano. Una cena esperada, una mesa larga en familia, una conversación que necesita otro escenario o un brindis que estuvo mucho tiempo pendiente.",
    opts_text2:
      "Contanos cuál es el tuyo cuando escribas: la mesa se prepara distinto según la ocasión.",
    opt1_name: "Cenas especiales",
    opt1_desc: "Un aniversario, una sorpresa o simplemente una noche diferente.",
    opt2_name: "Encuentros familiares",
    opt2_desc: "La mesa larga, los platos para compartir, la sobremesa que se estira.",
    opt3_name: "Reuniones de trabajo",
    opt3_desc: "Una conversación que merece otro escenario y tiempo sin apuro.",
    opt4_name: "Celebraciones",
    opt4_desc: "Cumpleaños, logros, reencuentros y nuevas etapas.",
    opt_cta: "Consultar",

    suc_eyebrow: "Dónde estamos",
    suc_title: "Encontrá<br>la mesa.",
    suc_sub:
      "Trabajamos con reserva previa. Escribinos y coordinamos el día, el horario y la cantidad de personas.",
    loc_pending_addr: "Ezeiza, Provincia de Buenos Aires · dirección exacta al confirmar la reserva",
    loc_pending_hours: "Días y horarios a confirmar · escribinos",
    loc_map: "Ver en mapa",
    loc_whatsapp: "WhatsApp",
    loc_book: "Pedir mesa",
    wa_message: "¡Hola! Quiero reservar una mesa en La Pasión de Rosas.",
    wa_message_occasion: "¡Hola! Quiero consultar por {occasion} en La Pasión de Rosas.",

    res_title: "Tu mesa<br>te espera.",
    res_sub: "Escribinos y la preparamos.",

    ig_eyebrow: "Redes",
    ig_title: "La Pasión de Rosas<br>en tu feed.",
    ig_cta: "Seguinos en Instagram",
    ig_alt: "La Pasión de Rosas en Instagram",

    footer_tag: "Parrilla a las brasas, con reserva previa. Ezeiza, Provincia de Buenos Aires.",
    footer_nav_heading: "Navegación",
    footer_contact_heading: "Contacto",
    footer_contact_wa: "Reservas por WhatsApp",
    footer_contact_pending: "Canal de reservas a confirmar",
    footer_bottom1: "La Pasión de Rosas · Parrilla · Ezeiza, Buenos Aires",
    footer_bottom2: "Los datos que nos dejás se usan únicamente para responder tu consulta.",

    lightbox_close: "Cerrar ✕",
    media_pending: "Imagen provisional",

    pending_label: "A confirmar",
    pending_contact:
      "Todavía no está publicado el canal oficial de reservas. Escribinos por Instagram mientras tanto.",

    sobre_aria: "Bienvenida a La Pasión de Rosas",
    sobre_pie: "Una mesa que se reserva con tiempo.",
    sobre_abrir: "Abrir la carta",

    prensa_eyebrow: "Prensa",
    prensa_title: "Lo que se dijo de la casa.",
    prensa_note: "Notas publicadas por medios. Los enlaces van al sitio de cada medio.",
    prensa_pending_label: "Pendiente",
    prensa_pending_text:
      "Enlaces encontrados en una búsqueda, todavía sin verificar uno por uno. Revisalos antes de publicar el sitio.",
    prensa_leer: "Leer la nota",
  },

  en: {
    skip_link: "Skip to the menu",
    cursor_view: "VIEW",

    nav_home: "Home",
    nav_menu: "Menu",
    nav_locations: "Find us",
    nav_about: "About",
    nav_press: "Press",
    nav_reservations: "Reservations",
    nav_contact: "Contact",
    nav_toggle_aria: "Open menu",

    cta_book: "Book a table",
    cta_view_menu: "View menu",
    mobile_book: "Book a table →",

    hero_eyebrow: "Ezeiza · Buenos Aires Province",
    hero_name_1: "La Pasión",
    hero_name_2: "de Rosas",
    hero_sub: "Argentine Grill · Live Fire",
    hero_quote: "“We cook for a few, and the table is booked ahead.”",
    hero_scroll: "Scroll to discover",

    marquee:
      "<b>La Pasión de Rosas</b> · Argentine Grill · Embers · Short Ribs · Ezeiza · Buenos Aires ·",

    about_eyebrow: "La Pasión de Rosas",
    about_title: "Not just<br>a grill.<br><em>A closed-door table.</em>",
    about_text:
      "In Ezeiza, over live fire and by reservation only. We cook for a few: every service is prepared slowly and every table is agreed in advance. That is what lets the evening keep its own pace, the fire work slowly, and nobody rush.",
    about_meta_1_value: "Ezeiza",
    about_meta_1_label: "Buenos Aires Province",
    about_meta_2_value: "Booking",
    about_meta_2_label: "Always in advance",
    about_meta_3_value: "Embers",
    about_meta_3_label: "The heart of the kitchen",
    about_tag: "One table at a time, never rushed.",

    fuego_eyebrow: "The fire",
    fuego_title: "It all starts with fire.",
    fuego_sub: "Embers, time and patience. The rest follows.",

    menu_eyebrow: "The menu",
    menu_title: "The menu",
    menu_note:
      "The offering changes with the day and the season. All prices are in Argentine pesos.",
    menu_search_label: "Search a dish by name",
    menu_search_placeholder: "Search a dish… (e.g. short ribs, provoleta, wine)",
    menu_filters_aria: "Filter by dish type",
    menu_clear: "Clear filters",
    menu_catrail_aria: "Jump to a menu category",
    menu_set_subtitle: "Tasting menu",
    menu_pending_label: "Pending",
    menu_pending_text:
      "Sample dishes and prices, shown so you can see how the menu looks. They are not confirmed by the restaurant yet: do not publish the site with these values.",
    results_found_one: "1 dish found.",
    results_found_many: "{n} dishes found.",
    results_empty: "No dishes match your search.",

    tag_Brasas: "Live fire",
    tag_Vegetariano: "Vegetarian",
    tag_SinTACC: "Gluten free",
    tag_Compartir: "To share",
    tag_Clasico: "Classic",

    spec_eyebrow: "Specialties",
    spec_title: "Straight off the grill.",
    spec_block_eyebrow: "The house dish",
    spec_desc:
      "The cut that defines the house: hours over low embers until it gives way on its own. Served to share.",

    gal_eyebrow: "The experience",
    gal_title: "The experience,<br>in pictures.",

    opts_eyebrow: "Occasions",
    opts_title: "One place. Many reasons.",
    opts_text1:
      "Some moments deserve to step outside the everyday. A long-awaited dinner, a long family table, a conversation that needs a different setting, or a toast that has been pending far too long.",
    opts_text2:
      "Tell us which one is yours when you write: the table is set differently depending on the occasion.",
    opt1_name: "Special dinners",
    opt1_desc: "An anniversary, a surprise, or simply a different kind of night.",
    opt2_name: "Family gatherings",
    opt2_desc: "The long table, dishes to share, the conversation that runs late.",
    opt3_name: "Work meetings",
    opt3_desc: "A conversation that deserves another setting, and time without rush.",
    opt4_name: "Celebrations",
    opt4_desc: "Birthdays, milestones, reunions and new chapters.",
    opt_cta: "Ask about it",

    suc_eyebrow: "Find us",
    suc_title: "Find<br>the table.",
    suc_sub:
      "We work by reservation only. Write to us and we will arrange the day, the time and the number of guests.",
    loc_pending_addr: "Ezeiza, Buenos Aires Province · exact address once the booking is confirmed",
    loc_pending_hours: "Days and hours to be confirmed · write to us",
    loc_map: "View on map",
    loc_whatsapp: "WhatsApp",
    loc_book: "Book a table",
    wa_message: "Hello! I'd like to book a table at La Pasión de Rosas.",
    wa_message_occasion: "Hello! I'd like to ask about {occasion} at La Pasión de Rosas.",

    res_title: "Your table<br>awaits.",
    res_sub: "Write to us and we'll set it.",

    ig_eyebrow: "Social",
    ig_title: "La Pasión de Rosas<br>in your feed.",
    ig_cta: "Follow us on Instagram",
    ig_alt: "La Pasión de Rosas on Instagram",

    footer_tag: "Live-fire grill, by reservation only. Ezeiza, Buenos Aires Province.",
    footer_nav_heading: "Navigation",
    footer_contact_heading: "Contact",
    footer_contact_wa: "Reservations via WhatsApp",
    footer_contact_pending: "Booking channel to be confirmed",
    footer_bottom1: "La Pasión de Rosas · Argentine Grill · Ezeiza, Buenos Aires",
    footer_bottom2: "We use the details you leave us only to answer your enquiry.",

    lightbox_close: "Close ✕",
    media_pending: "Placeholder image",

    pending_label: "To confirm",
    pending_contact:
      "The official booking channel is not published yet. Write to us on Instagram in the meantime.",

    sobre_aria: "Welcome to La Pasión de Rosas",
    sobre_pie: "A table you book ahead.",
    sobre_abrir: "Open the letter",

    prensa_eyebrow: "Press",
    prensa_title: "What has been written.",
    prensa_note: "Articles published by the press. Links go to each outlet's own site.",
    prensa_pending_label: "Pending",
    prensa_pending_text:
      "Links found through a search and not yet checked one by one. Review them before the site goes live.",
    prensa_leer: "Read the article",
  },
};

export const tituloDocumento: Record<Idioma, string> = {
  es: "La Pasión de Rosas · Parrilla en Ezeiza, Buenos Aires",
  en: "La Pasión de Rosas · Argentine Grill in Ezeiza, Buenos Aires",
};
