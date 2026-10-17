import Image from "next/image";
import { medios, type ClaveMedio, type RatioMedio, type TonoMedio } from "@content/medios";
import { MarcaRosa } from "./MarcaRosa";

/* -------------------------------------------------------------------------- */

const ratios: Record<RatioMedio, string> = {
  "4/5": "4 / 5",
  "3/4": "3 / 4",
  "1/1": "1 / 1",
  "16/9": "16 / 9",
  "21/9": "21 / 9",
};

/**
 * Paletas de las composiciones provisionales. No son fotografías: son
 * degradados generados por CSS, pensados para sostener la dirección de arte
 * sin hacer pasar material ajeno por fotos del restaurante.
 */
const paletas: Record<
  TonoMedio,
  { base: string; luzBaja: string; luzAlta: string; realce: string }
> = {
  brasa: {
    base: "#2a1a12",
    luzBaja: "rgba(213,121,57,0.62)",
    luzAlta: "rgba(255,196,128,0.3)",
    realce: "rgba(196,164,119,0.26)",
  },
  borgona: {
    base: "#2b1620",
    luzBaja: "rgba(122,43,66,0.85)",
    luzAlta: "rgba(196,164,119,0.22)",
    realce: "rgba(213,121,57,0.2)",
  },
  carbon: {
    base: "#232220",
    luzBaja: "rgba(62,51,44,0.95)",
    luzAlta: "rgba(196,164,119,0.2)",
    realce: "rgba(240,233,223,0.08)",
  },
  oro: {
    base: "#2b2318",
    luzBaja: "rgba(196,164,119,0.5)",
    luzAlta: "rgba(255,226,180,0.26)",
    realce: "rgba(213,121,57,0.24)",
  },
};

/* -------------------------------------------------------------------------- */

type Props = {
  clave: ClaveMedio;
  /** `true` sólo para la imagen principal de la portada. */
  prioridad?: boolean;
  /** Pista de tamaño para servir la resolución justa. */
  sizes?: string;
  /** Sobrescribe la proporción definida en medios.ts. */
  ratio?: RatioMedio;
  className?: string;
  /** Oculta el pie del marcador (útil en mosaicos muy chicos). */
  compacto?: boolean;
  /** Ocupa todo el alto del contenedor en vez de respetar la proporción. */
  llenar?: boolean;
};

/**
 * Muestra una fotografía del restaurante.
 *
 * Mientras `src` sea `null` en content/medios.ts, dibuja una composición
 * provisional identificada como tal, con el encuadre sugerido para la
 * producción fotográfica. En cuanto se carga la foto real, el marcador
 * desaparece solo.
 */
export function Medio({
  clave,
  prioridad,
  sizes = "100vw",
  ratio,
  className = "",
  compacto,
  llenar,
}: Props) {
  const m = medios[clave];
  // Al llenar el contenedor, la proporción la manda el contenedor.
  const proporcion = llenar ? undefined : ratios[ratio ?? m.ratio];

  if (m.src) {
    return (
      <div
        className={`relative overflow-hidden bg-carbon-alto ${llenar ? "h-full w-full" : ""} ${className}`}
        style={proporcion ? { aspectRatio: proporcion } : undefined}
      >
        <Image
          src={m.src}
          alt={m.alt}
          fill
          sizes={sizes}
          priority={prioridad}
          loading={prioridad ? undefined : "lazy"}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <Provisional
      ratio={proporcion}
      tono={m.tono}
      encuadre={m.encuadre}
      compacto={compacto}
      className={`${llenar ? "h-full w-full" : ""} ${className}`}
    />
  );
}

/* -------------------------------------------------------------------------- */

function Provisional({
  ratio,
  tono,
  encuadre,
  compacto,
  className = "",
}: {
  ratio?: string;
  tono: TonoMedio;
  encuadre: string;
  compacto?: boolean;
  className?: string;
}) {
  const p = paletas[tono];

  return (
    <div
      role="img"
      aria-label={`Espacio reservado para una fotografía del restaurante. Encuadre sugerido: ${encuadre}`}
      className={`grano relative overflow-hidden ${className}`}
      style={{ ...(ratio ? { aspectRatio: ratio } : {}), backgroundColor: p.base }}
    >
      {/* Luz principal baja —como una brasa fuera de cuadro— y un realce alto */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: [
            `radial-gradient(85% 100% at 20% 100%, ${p.luzBaja} 0%, transparent 68%)`,
            `radial-gradient(55% 65% at 80% 8%, ${p.luzAlta} 0%, transparent 72%)`,
            `radial-gradient(40% 45% at 62% 58%, ${p.realce} 0%, transparent 75%)`,
          ].join(", "),
        }}
      />

      {/* Barrido diagonal: da volumen y evita el degradado plano */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(118deg, transparent 18%, rgba(255,255,255,0.07) 42%, transparent 60%)",
        }}
      />

      {/* Caída a negro en los bordes, para que la tipografía apoye encima */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(120% 110% at 50% 45%, transparent 38%, rgba(10,10,9,0.72) 100%)",
        }}
      />

      <div aria-hidden className="absolute inset-0 grid place-items-center">
        <MarcaRosa className="h-[22%] max-h-28 w-auto text-marfil/[0.13]" />
      </div>

      {/* Marca de material provisional: siempre visible mientras no haya foto */}
      <div aria-hidden className={`absolute inset-x-0 bottom-0 ${compacto ? "p-3" : "p-4 sm:p-5"}`}>
        <p
          className="inline-flex items-center gap-2 border border-marfil/20 bg-carbon/65 px-2.5 py-1
                     font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.2em] text-marfil/80
                     backdrop-blur-sm"
        >
          <span className="inline-block h-1 w-1 rounded-full bg-brasa" />
          Imagen provisional
        </p>
        {!compacto && (
          <p className="mt-2 max-w-sm font-sans text-[0.6875rem] leading-relaxed text-marfil/60">
            {encuadre}
          </p>
        )}
      </div>
    </div>
  );
}
