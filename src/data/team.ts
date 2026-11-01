export type Member = {
  id: string;
  name: string;
  role: string;
  /** Sólo los datos provistos por la agencia. Nada de biografías inventadas. */
  skills: string[];
  line: string;
  /** Retrato real: copiá el archivo a /public/media/ y escribí la ruta. */
  photo: string | null;
};

export const team: Member[] = [
  {
    id: "leonardo",
    name: "Leonardo",
    role: "Dirección creativa",
    skills: ["Dirección creativa", "Edición", "Dirección de proyecto"],
    line: "Define hacia dónde va la idea y se asegura de que el proyecto llegue entero hasta el final.",
    photo: null,
  },
  {
    id: "kiara",
    name: "Kiara",
    role: "Contenido",
    skills: ["Creación de contenido", "Modelaje", "Participación audiovisual"],
    line: "Crea el contenido y lo pone en cámara: la cara visible de las piezas que producimos.",
    photo: null,
  },
  {
    id: "lautaro",
    name: "Lautaro",
    role: "Técnica audiovisual",
    skills: ["Edición", "Sonido", "Iluminación", "Producción técnica"],
    line: "Resuelve la parte técnica: sonido, luz y el armado final de cada pieza.",
    photo: null,
  },
];
