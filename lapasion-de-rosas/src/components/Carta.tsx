"use client";

import { useEffect, useRef } from "react";
import { avisoMenu, cartaPdf, categorias, formatosServicio } from "@content/menu";
import { Revelar } from "./ui/Revelar";
import { Separador } from "./ui/MarcaRosa";
import { ContactoDirecto } from "./ui/ContactoDirecto";
import { medir } from "@/lib/analitica";

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/**
 * La carta en HTML, accesible y editable desde content/menu.ts.
 *
 * Mientras una categoría no tenga platos cargados, se muestra su descripción
 * y una invitación a consultar: no se inventan nombres, precios ni técnicas.
 * El PDF, si existe, queda como opción secundaria.
 */
export function Carta() {
  const seccion = useRef<HTMLElement>(null);
  const yaMedido = useRef(false);

  useEffect(() => {
    const el = seccion.current;
    if (!el) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting && !yaMedido.current) {
          yaMedido.current = true;
          medir("menu_visto");
        }
      },
      { threshold: 0.3 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const hayPlatos = categorias.some((c) => c.platos.length > 0);

  return (
    <section
      ref={seccion}
      id="carta"
      className="seccion relative bg-chocolate/35"
      aria-labelledby="carta-titulo"
    >
      <div className="marco">
        <div className="mx-auto max-w-2xl text-center">
          <Revelar como="p" className="tipo-indice mb-6">
            La carta
          </Revelar>
          <Revelar
            como="h2"
            retraso={80}
            id="carta-titulo"
            className="tipo-titulo text-[clamp(2rem,1.2rem+3.2vw,3.9rem)]"
          >
            Lo que se cocina <span className="tipo-enfasis">acá.</span>
          </Revelar>
        </div>

        {/* Formatos de servicio: sólo si el restaurante los confirmó */}
        {formatosServicio.verificado && (
          <Revelar className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
            {formatosServicio.items.map((f) => (
              <div key={f.id} className="border border-[var(--borde-tenue)] p-6">
                <h3 className="font-serif text-xl font-light text-marfil">{f.nombre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-marfil-tenue">{f.descripcion}</p>
              </div>
            ))}
          </Revelar>
        )}

        <div className="mx-auto mt-16 max-w-3xl">
          {hayPlatos ? (
            <div className="space-y-16">
              {categorias
                .filter((c) => c.platos.length > 0)
                .map((categoria, i) => (
                  <Revelar key={categoria.id} retraso={i * 60}>
                    <h3 className="font-serif text-[clamp(1.5rem,1.2rem+1vw,2.1rem)] font-light text-oro">
                      {categoria.nombre}
                    </h3>
                    {categoria.descripcion && (
                      <p className="mt-2 text-sm text-marfil-tenue">{categoria.descripcion}</p>
                    )}

                    <ul className="mt-7 space-y-6">
                      {categoria.platos.map((plato) => (
                        <li
                          key={plato.nombre}
                          className="border-b border-[var(--borde-tenue)] pb-6 last:border-0"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
                            <h4 className="font-serif text-lg font-normal text-marfil">
                              {plato.nombre}
                            </h4>
                            {typeof plato.precio === "number" && (
                              <span className="font-sans text-sm tabular-nums text-oro">
                                {pesos.format(plato.precio)}
                              </span>
                            )}
                          </div>
                          {plato.descripcion && (
                            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-marfil-tenue">
                              {plato.descripcion}
                            </p>
                          )}
                          {plato.notas && plato.notas.length > 0 && (
                            <p className="mt-2 font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-marfil/60">
                              {plato.notas.join(" · ")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Revelar>
                ))}
            </div>
          ) : (
            <Revelar className="text-center">
              <Separador className="mx-auto max-w-xs" />
              <p className="tipo-bajada mx-auto mt-10 max-w-md">{avisoMenu}</p>
              <div className="mt-9 flex justify-center">
                <ContactoDirecto
                  mensaje="Hola, quisiera consultar por la propuesta gastronómica de La Pasión de Rosas."
                  origen="carta"
                >
                  Consultá la propuesta del día
                </ContactoDirecto>
              </div>
            </Revelar>
          )}

          {cartaPdf && (
            <Revelar className="mt-14 text-center">
              <a
                href={cartaPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-[0.75rem] uppercase tracking-[0.16em] text-oro underline decoration-oro/40 underline-offset-[6px] transition-colors hover:text-marfil"
              >
                Descargar la carta en PDF
              </a>
            </Revelar>
          )}
        </div>
      </div>
    </section>
  );
}
