"use client";

import { useRef } from "react";
import { textos } from "@content/site";
import { Brasas } from "./Brasas";
import { Medio } from "./ui/Medio";
import { Revelar } from "./ui/Revelar";
import { useProgresoScroll } from "@/lib/useProgresoScroll";

/**
 * El fuego como transición hacia la gastronomía.
 *
 * El scroll controla la intensidad: pocas chispas al entrar, más en el centro,
 * y se apagan al salir. Con movimiento reducido, el lienzo no dibuja nada y
 * queda la composición estática —que es una pieza por sí misma, no un hueco.
 */
export function TransicionFuego() {
  const seccion = useRef<HTMLElement>(null);
  const progreso = useProgresoScroll(seccion);
  const t = textos.fuego;

  return (
    <section
      ref={seccion}
      className="relative overflow-hidden bg-carbon-bajo"
      aria-labelledby="fuego-titulo"
    >
      {/* Calor que sube desde el borde inferior */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(120% 60% at 50% 108%, rgba(213,121,57,0.22) 0%, transparent 62%)",
            "radial-gradient(90% 50% at 18% 100%, rgba(80,29,44,0.4) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      <Brasas intensidadRef={progreso} />

      <div className="marco relative py-[clamp(6rem,16vh,12rem)]">
        <div className="mx-auto max-w-2xl text-center">
          <Revelar como="p" className="tipo-indice mb-6 flex items-center justify-center gap-3">
            <span>{t.indice}</span>
            <span className="h-px w-8 bg-oro/40" aria-hidden />
            <span>{t.etiqueta}</span>
          </Revelar>

          <Revelar
            como="h2"
            retraso={100}
            id="fuego-titulo"
            className="tipo-titulo text-[clamp(2.3rem,1.2rem+4.2vw,5rem)]"
          >
            {t.titulo} <span className="tipo-enfasis">{t.tituloEnfasis}</span>
          </Revelar>

          <Revelar como="p" retraso={200} className="tipo-bajada mx-auto mt-7 max-w-md">
            {t.bajada}
          </Revelar>
        </div>

        {/* La fotografía emerge desde la oscuridad */}
        <Revelar tipo="mascara" retraso={240} className="mx-auto mt-16 max-w-4xl">
          <div className="relative">
            <Medio
              clave="platoBrasas"
              ratio="16/9"
              sizes="(min-width: 1024px) 60rem, 100vw"
              className="w-full"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to top, rgba(10,10,9,0.85) 0%, transparent 45%)",
              }}
            />
          </div>
        </Revelar>
      </div>
    </section>
  );
}
