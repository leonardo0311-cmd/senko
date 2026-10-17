"use client";

import { useEffect, useRef } from "react";
import { textos } from "@content/site";
import { Medio } from "./ui/Medio";
import { Revelar } from "./ui/Revelar";
import { nivelMovimiento } from "@/lib/motion";

/**
 * Ambientes y espacios. Una panorámica a sangre abre la sección y dos
 * verticales la completan. El parallax es deliberadamente mínimo: suficiente
 * para dar profundidad, nunca tanto como para marear.
 */
export function Espacios() {
  const panoramica = useRef<HTMLDivElement>(null);
  const t = textos.espacios;

  useEffect(() => {
    if (nivelMovimiento() !== "completo") return;
    const el = panoramica.current;
    if (!el) return;

    let pendiente = false;
    let visible = false;

    const mover = () => {
      pendiente = false;
      const rect = el.getBoundingClientRect();
      const avance = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      // Recorrido total de 5%: un desplazamiento apenas perceptible.
      el.style.transform = `translate3d(0, ${(avance - 0.5) * -5}%, 0) scale(1.06)`;
    };

    const alScrollear = () => {
      if (pendiente || !visible) return;
      pendiente = true;
      requestAnimationFrame(mover);
    };

    const observador = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) mover();
    });
    observador.observe(el);

    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => {
      observador.disconnect();
      window.removeEventListener("scroll", alScrollear);
    };
  }, []);

  return (
    <section id="espacios" className="relative" aria-labelledby="espacios-titulo">
      {/* --- Panorámica a sangre ---------------------------------------- */}
      <div className="relative h-[clamp(22rem,62vh,36rem)] overflow-hidden">
        <div ref={panoramica} className="absolute inset-0 will-change-transform">
          <Medio clave="espacioPanoramica" llenar sizes="100vw" compacto />
        </div>

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to top, rgba(16,16,15,0.96) 2%, rgba(16,16,15,0.3) 50%, rgba(16,16,15,0.6) 100%)",
          }}
        />

        <div className="marco absolute inset-x-0 bottom-0 pb-10">
          <Revelar como="p" className="tipo-indice mb-4 flex items-center gap-3">
            <span>{t.indice}</span>
            <span className="h-px w-8 bg-oro/40" aria-hidden />
            <span>{t.etiqueta}</span>
          </Revelar>
          <Revelar
            como="h2"
            retraso={80}
            id="espacios-titulo"
            className="tipo-titulo max-w-3xl text-[clamp(2rem,1.2rem+3.2vw,4rem)]"
          >
            {t.titulo} <span className="tipo-enfasis">{t.tituloEnfasis}</span>
          </Revelar>
        </div>
      </div>

      {/* --- Detalles ----------------------------------------------------- */}
      <div className="marco pb-[clamp(5rem,11vh,9.5rem)] pt-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Revelar como="p" className="tipo-bajada lg:col-span-5 lg:col-start-1">
            {t.bajada}
          </Revelar>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
            <Revelar tipo="mascara">
              <Medio
                clave="espacioMesa"
                ratio="4/5"
                sizes="(min-width: 1024px) 26vw, 50vw"
                compacto
                className="w-full"
              />
            </Revelar>
            <Revelar tipo="mascara" retraso={140} className="sm:pt-12">
              <Medio
                clave="espacioDetalleLuz"
                ratio="3/4"
                sizes="(min-width: 1024px) 26vw, 50vw"
                compacto
                className="w-full"
              />
            </Revelar>
          </div>
        </div>
      </div>
    </section>
  );
}
