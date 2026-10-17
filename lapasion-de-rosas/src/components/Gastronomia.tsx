import { textos } from "@content/site";
import { Medio } from "./ui/Medio";
import { Revelar } from "./ui/Revelar";
import { BotonEnlace } from "./ui/Boton";
import { Separador } from "./ui/MarcaRosa";

/**
 * Narrativa gastronómica. No es un catálogo: cada imagen tiene una función
 * distinta dentro de la composición y espacio suficiente para destacarse.
 */
export function Gastronomia() {
  const t = textos.gastronomia;

  return (
    <section id="gastronomia" className="seccion relative" aria-labelledby="gastronomia-titulo">
      <div className="marco">
        <div className="mx-auto max-w-2xl text-center">
          <Revelar
            como="h2"
            id="gastronomia-titulo"
            className="tipo-titulo text-[clamp(2.1rem,1.2rem+3.6vw,4.5rem)]"
          >
            {t.titulo} <span className="tipo-enfasis">{t.tituloEnfasis}</span>
          </Revelar>
          <Revelar como="p" retraso={120} className="tipo-bajada mx-auto mt-7 max-w-lg">
            {t.bajada}
          </Revelar>
        </div>

        <Separador className="mx-auto mt-16 max-w-md" />

        {/* --- Composición editorial -------------------------------------- */}
        <div className="mt-16 grid gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Plato protagonista */}
          <Revelar tipo="mascara" className="lg:col-span-7">
            <Medio
              clave="platoPrincipal"
              ratio="4/5"
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="w-full"
            />
          </Revelar>

          {/* Columna lateral: detalle + vino, escalonados */}
          <div className="flex flex-col gap-6 sm:gap-8 lg:col-span-5 lg:pt-20">
            <Revelar tipo="mascara" retraso={140}>
              <Medio
                clave="vino"
                ratio="4/5"
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="w-full"
              />
            </Revelar>

            <Revelar retraso={240} className="max-w-sm">
              <p className="font-serif text-[clamp(1.35rem,1.1rem+0.8vw,1.9rem)] font-light italic leading-snug text-marfil/90">
                «La delicadeza de los detalles. La intensidad de la experiencia.»
              </p>
            </Revelar>

            <Revelar tipo="mascara" retraso={320} className="sm:max-w-[18rem]">
              <Medio
                clave="platoDetalle"
                ratio="1/1"
                sizes="(min-width: 1024px) 20vw, 60vw"
                compacto
                className="w-full"
              />
            </Revelar>
          </div>
        </div>

        <Revelar retraso={120} className="mt-16 flex justify-center">
          <BotonEnlace href="#carta" variante="secundario">
            {t.cta}
          </BotonEnlace>
        </Revelar>
      </div>
    </section>
  );
}
