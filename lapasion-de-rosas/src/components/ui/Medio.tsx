"use client";

import { medios, type ClaveMedio, type TonoMedio } from "@content/medios";
import { useIdioma } from "@/lib/idioma";

/**
 * Muestra una fotografía del restaurante.
 *
 * Mientras no haya foto real cargada en content/medios.ts, dibuja una
 * composición provisional identificada como tal. En cuanto se carga la foto,
 * la marca desaparece sola.
 */

const paletas: Record<TonoMedio, { base: string; capas: string }> = {
  fuego: {
    base: "#2a1409",
    capas: [
      "radial-gradient(90% 100% at 22% 100%, rgba(255,131,71,0.62) 0%, transparent 66%)",
      "radial-gradient(60% 70% at 78% 10%, rgba(200,72,31,0.42) 0%, transparent 72%)",
      "linear-gradient(118deg, transparent 18%, rgba(255,226,200,0.07) 44%, transparent 64%)",
      "radial-gradient(120% 110% at 50% 45%, transparent 36%, rgba(9,6,4,0.76) 100%)",
    ].join(", "),
  },
  brasa: {
    base: "#2a1b10",
    capas: [
      "radial-gradient(85% 100% at 25% 100%, rgba(200,72,31,0.5) 0%, transparent 68%)",
      "radial-gradient(55% 65% at 80% 12%, rgba(244,236,220,0.14) 0%, transparent 72%)",
      "linear-gradient(118deg, transparent 20%, rgba(255,255,255,0.05) 44%, transparent 62%)",
      "radial-gradient(120% 110% at 50% 45%, transparent 38%, rgba(9,6,4,0.74) 100%)",
    ].join(", "),
  },
  carbon: {
    base: "#211c16",
    capas: [
      "radial-gradient(85% 100% at 20% 100%, rgba(60,48,36,0.95) 0%, transparent 70%)",
      "radial-gradient(55% 65% at 80% 8%, rgba(244,236,220,0.12) 0%, transparent 72%)",
      "linear-gradient(118deg, transparent 20%, rgba(255,255,255,0.05) 44%, transparent 62%)",
      "radial-gradient(120% 110% at 50% 45%, transparent 38%, rgba(9,6,4,0.76) 100%)",
    ].join(", "),
  },
  humo: {
    base: "#262019",
    capas: [
      "radial-gradient(90% 100% at 30% 100%, rgba(154,142,120,0.4) 0%, transparent 70%)",
      "radial-gradient(55% 65% at 75% 10%, rgba(255,131,71,0.2) 0%, transparent 72%)",
      "linear-gradient(118deg, transparent 20%, rgba(255,255,255,0.06) 44%, transparent 62%)",
      "radial-gradient(120% 110% at 50% 45%, transparent 38%, rgba(9,6,4,0.72) 100%)",
    ].join(", "),
  },
};

export function Medio({
  clave,
  prioridad,
  sizes = "100vw",
  className = "",
  /** Oculta el pie del marcador en mosaicos chicos. */
  compacto,
}: {
  clave: ClaveMedio;
  prioridad?: boolean;
  sizes?: string;
  className?: string;
  compacto?: boolean;
}) {
  const { t, pick } = useIdioma();
  const m = medios[clave];
  const alt = pick(m.alt, m.altEn);

  if (m.src) {
    // <picture> con AVIF primero y WebP como respaldo: sin el respaldo, un
    // navegador sin soporte AVIF no muestra absolutamente nada.
    return (
      <picture>
        <source srcSet={`/fotos/${m.src}.avif`} type="image/avif" />
        <img
          src={`/fotos/${m.src}.webp`}
          alt={alt}
          width={m.ancho}
          height={m.alto}
          loading={prioridad ? "eager" : "lazy"}
          fetchPriority={prioridad ? "high" : undefined}
          decoding="async"
          sizes={sizes}
          className={`ph ${className}`}
        />
      </picture>
    );
  }

  const p = paletas[m.tono];

  return (
    <div
      role="img"
      aria-label={`${alt}. ${t("media_pending")}.`}
      className={`ph relative overflow-hidden ${className}`}
      style={{ backgroundColor: p.base }}
    >
      <span aria-hidden className="absolute inset-0" style={{ backgroundImage: p.capas }} />
      <span
        aria-hidden
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {!compacto && (
        <span
          aria-hidden
          className="absolute bottom-2.5 left-2.5 border px-2 py-1 text-[0.5rem] font-bold uppercase tracking-[0.18em] backdrop-blur-sm"
          style={{
            color: "rgba(244,236,220,0.78)",
            background: "rgba(9,6,4,0.62)",
            borderColor: "rgba(244,236,220,0.22)",
          }}
        >
          {t("media_pending")}
        </span>
      )}
    </div>
  );
}
