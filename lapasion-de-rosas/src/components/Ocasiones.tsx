"use client";

import { experiencias } from "@content/experiencias";
import { textos } from "@content/site";
import { Medio } from "./ui/Medio";
import { Revelar } from "./ui/Revelar";
import { EncabezadoSeccion } from "./ui/EncabezadoSeccion";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { medir } from "@/lib/analitica";

/**
 * «Cada encuentro tiene su momento».
 *
 * Grilla editorial asimétrica: la primera experiencia ocupa el bloque ancho.
 * Al elegir una, el formulario de reservas queda precargado con ese motivo,
 * para que el visitante no tenga que explicarlo de nuevo.
 */
export function Ocasiones() {
  const t = textos.ocasiones;

  return (
    <section id="encuentros" className="seccion relative" aria-labelledby="ocasiones-titulo">
      <div className="marco">
        <EncabezadoSeccion
          tituloId="ocasiones-titulo"
          indice={t.indice}
          etiqueta={t.etiqueta}
          titulo={t.titulo}
          enfasis={t.tituloEnfasis}
          bajada={t.bajada}
        />

        <div className="mt-16 grid gap-5 sm:gap-6 lg:grid-cols-12">
          {experiencias.map((exp, i) => (
            <Revelar
              key={exp.id}
              retraso={i * 90}
              className={exp.destacada ? "lg:col-span-7" : "lg:col-span-5"}
            >
              <TarjetaOcasion experiencia={exp} destacada={exp.destacada} />
            </Revelar>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function TarjetaOcasion({
  experiencia: exp,
  destacada,
}: {
  experiencia: (typeof experiencias)[number];
  destacada?: boolean;
}) {
  const wa = enlaceWhatsapp(exp.mensajeWhatsapp);
  const href = wa ?? `#reservas?motivo=${exp.id}`;

  const alHacerClick = () => {
    medir(wa ? "whatsapp_click" : "reserva_click", { origen: "ocasion", motivo: exp.id });
    if (!wa) {
      // Sin WhatsApp confirmado: llevar al formulario con el motivo ya elegido.
      window.dispatchEvent(new CustomEvent("lpdr:motivo", { detail: exp.id }));
    }
  };

  return (
    <article className="group h-full">
      <a
        href={href}
        {...(wa ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={alHacerClick}
        className="relative flex h-full flex-col overflow-hidden border border-[var(--borde-tenue)] bg-carbon-alto"
      >
        <div className="relative overflow-hidden">
          <div className="transition-transform duration-[900ms] ease-[var(--ease-suave)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <Medio
              clave={exp.medio}
              ratio={destacada ? "16/9" : "4/5"}
              sizes={
                destacada ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 40vw, 100vw"
              }
              compacto
              className="w-full"
            />
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to top, rgba(16,16,15,0.95) 8%, rgba(16,16,15,0.35) 55%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-borgona/0 transition-colors duration-700 group-hover:bg-borgona/25"
          />
        </div>

        <div className="relative -mt-24 flex flex-1 flex-col p-7 sm:p-8">
          <p className="tipo-indice mb-3">{exp.etiqueta}</p>

          <h3 className="font-serif text-[clamp(1.5rem,1.2rem+1.1vw,2.2rem)] font-light leading-tight text-marfil transition-transform duration-500 ease-[var(--ease-suave)] group-hover:-translate-y-0.5 motion-reduce:transition-none">
            {exp.titulo}
          </h3>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-marfil-tenue">{exp.texto}</p>

          <span className="mt-7 inline-flex items-center gap-2.5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-oro transition-colors group-hover:text-marfil">
            {exp.cta}
            <span
              aria-hidden
              className="inline-block transition-transform duration-400 ease-[var(--ease-suave)] group-hover:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </span>
        </div>
      </a>
    </article>
  );
}
