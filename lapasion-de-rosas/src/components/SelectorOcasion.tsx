"use client";

import { useState } from "react";
import { experiencias } from "@content/experiencias";
import { textos } from "@content/site";
import { Medio } from "./ui/Medio";
import { Revelar } from "./ui/Revelar";
import { ContactoDirecto } from "./ui/ContactoDirecto";
import { medir } from "@/lib/analitica";

/**
 * «¿Qué momento querés vivir?»
 *
 * Una invitación, no un cuestionario: una sola pregunta, respuesta inmediata
 * y una vía de contacto ya contextualizada. Implementado como lista de
 * pestañas accesible (roving tabindex + flechas del teclado).
 */
export function SelectorOcasion() {
  const [activa, setActiva] = useState(0);
  const t = textos.selector;
  const exp = experiencias[activa];

  const elegir = (i: number) => {
    setActiva(i);
    medir("ocasion_seleccionada", { motivo: experiencias[i].id });
  };

  const alTeclado = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const ultimo = experiencias.length - 1;
    let siguiente: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") siguiente = activa === ultimo ? 0 : activa + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") siguiente = activa === 0 ? ultimo : activa - 1;
    if (e.key === "Home") siguiente = 0;
    if (e.key === "End") siguiente = ultimo;

    if (siguiente === null) return;
    e.preventDefault();
    elegir(siguiente);
    document.getElementById(`ocasion-tab-${siguiente}`)?.focus();
  };

  return (
    <section className="seccion relative bg-carbon-bajo" aria-labelledby="selector-titulo">
      <div className="marco">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-6">
            <Revelar
              como="h2"
              id="selector-titulo"
              className="tipo-titulo text-[clamp(2rem,1.2rem+3vw,3.6rem)]"
            >
              {t.titulo}
            </Revelar>
            <Revelar como="p" retraso={100} className="tipo-bajada mt-5 max-w-md">
              {t.bajada}
            </Revelar>

            <Revelar retraso={180}>
              <div
                role="tablist"
                aria-label="Tipo de ocasión"
                aria-orientation="vertical"
                onKeyDown={alTeclado}
                className="mt-10 flex flex-col"
              >
                {experiencias.map((e, i) => {
                  const seleccionada = i === activa;
                  return (
                    <button
                      key={e.id}
                      id={`ocasion-tab-${i}`}
                      role="tab"
                      type="button"
                      aria-selected={seleccionada}
                      aria-controls="ocasion-panel"
                      tabIndex={seleccionada ? 0 : -1}
                      onClick={() => elegir(i)}
                      className={`group flex items-center justify-between gap-5 border-b border-[var(--borde-tenue)] py-5 text-left transition-colors duration-300 ${
                        seleccionada ? "text-marfil" : "text-marfil/60 hover:text-marfil/85"
                      }`}
                    >
                      <span className="font-serif text-[clamp(1.25rem,1.05rem+0.7vw,1.75rem)] font-light">
                        {e.etiqueta}
                      </span>
                      <span
                        aria-hidden
                        className={`h-px shrink-0 bg-oro transition-[width] duration-500 ease-[var(--ease-suave)] ${
                          seleccionada ? "w-10" : "w-0 group-hover:w-5"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </Revelar>
          </div>

          {/* --- Panel contextual ------------------------------------------ */}
          <Revelar retraso={120} className="lg:col-span-6">
            <div
              id="ocasion-panel"
              role="tabpanel"
              aria-labelledby={`ocasion-tab-${activa}`}
              tabIndex={0}
              className="relative"
            >
              {/* `key` fuerza el re-montaje: la imagen y el texto entran juntos */}
              <div key={exp.id} className="animate-[panel-aparece_0.6s_var(--ease-suave)_both]">
                <Medio
                  clave={exp.medio}
                  ratio="3/4"
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  compacto
                  className="w-full"
                />

                <div className="mt-7">
                  <p className="font-serif text-[clamp(1.35rem,1.1rem+0.9vw,2rem)] font-light italic leading-snug text-marfil">
                    {exp.fraseSelector}
                  </p>
                  <ContactoDirecto
                    mensaje={exp.mensajeWhatsapp}
                    origen="selector"
                    variante="secundario"
                    className="mt-7"
                  >
                    {exp.cta}
                  </ContactoDirecto>
                </div>
              </div>
            </div>
          </Revelar>
        </div>
      </div>

      <style>{`
        @keyframes panel-aparece {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  );
}
