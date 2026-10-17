import { textos } from "@content/site";
import { Medio } from "./ui/Medio";
import { Revelar } from "./ui/Revelar";

/**
 * «Un lugar para descubrir». Composición editorial asimétrica: una vertical
 * grande, un bloque de texto al lado y un detalle cuadrado superpuesto.
 */
export function Historia() {
  const t = textos.historia;

  return (
    <section id="experiencia" className="seccion relative" aria-labelledby="historia-titulo">
      <div className="marco">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          {/* --- Columna visual ------------------------------------------- */}
          <div className="relative lg:col-span-6 lg:col-start-1">
            <Revelar tipo="mascara">
              <Medio
                clave="historiaPrincipal"
                ratio="4/5"
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="w-full"
              />
            </Revelar>

            {/* Detalle superpuesto: sólo donde hay espacio para que respire */}
            <Revelar
              retraso={260}
              className="absolute -bottom-10 -right-4 hidden w-[38%] max-w-[13rem] sm:block lg:-right-10"
            >
              <div className="border border-[var(--borde-sutil)] bg-carbon p-1.5">
                <Medio
                  clave="historiaDetalle"
                  ratio="1/1"
                  sizes="(min-width: 1024px) 18vw, 38vw"
                  compacto
                />
              </div>
            </Revelar>
          </div>

          {/* --- Columna de texto ------------------------------------------ */}
          <div className="lg:col-span-5 lg:col-start-8">
            <Revelar como="p" className="tipo-indice mb-6 flex items-center gap-3">
              <span>{t.indice}</span>
              <span className="h-px w-8 bg-oro/40" aria-hidden />
              <span>{t.etiqueta}</span>
            </Revelar>

            <Revelar
              como="h2"
              retraso={80}
              id="historia-titulo"
              className="tipo-titulo text-[clamp(2.1rem,1.3rem+3.1vw,3.9rem)]"
            >
              {t.titulo}
              <br />
              <span className="tipo-enfasis">{t.tituloEnfasis}</span>
            </Revelar>

            <div className="mt-8 space-y-5">
              {t.parrafos.map((p, i) => (
                <Revelar como="p" key={i} retraso={160 + i * 80} className="tipo-bajada">
                  {p}
                </Revelar>
              ))}
            </div>

            <Revelar retraso={340} className="mt-11 flex items-center gap-4">
              <span className="h-px w-10 bg-oro/40" aria-hidden />
              <p className="font-sans text-[0.625rem] uppercase tracking-[0.3em] text-oro/75">
                {t.firma}
              </p>
            </Revelar>
          </div>
        </div>
      </div>
    </section>
  );
}
