"use client";

import { contacto, siVerificado, textos } from "@content/site";
import { Medio } from "./ui/Medio";
import { Revelar } from "./ui/Revelar";
import { BotonEnlace } from "./ui/Boton";
import { Separador } from "./ui/MarcaRosa";
import { medir } from "@/lib/analitica";

/**
 * Ubicación. Composición editorial con la fachada como protagonista; el mapa
 * acompaña, no manda.
 *
 * Los datos que todavía no fueron confirmados por el restaurante no se
 * publican: en su lugar se invita a consultar. Nunca se inventa una
 * dirección, un horario ni un tiempo de viaje.
 */
export function Ubicacion() {
  const t = textos.ubicacion;
  const direccion = siVerificado(contacto.direccion);
  const localidad = siVerificado(contacto.localidad);
  const mapa = siVerificado(contacto.mapaUrl);
  const horarios = siVerificado(contacto.horarios);
  const coords = siVerificado(contacto.coordenadas);

  return (
    <section id="ubicacion" className="seccion relative" aria-labelledby="ubicacion-titulo">
      <div className="marco">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <Revelar tipo="mascara" className="lg:col-span-5">
            <Medio
              clave="fachada"
              ratio="4/5"
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="w-full"
            />
          </Revelar>

          <div className="lg:col-span-6 lg:col-start-7">
            <Revelar
              como="h2"
              id="ubicacion-titulo"
              className="tipo-titulo text-[clamp(2rem,1.2rem+3vw,3.6rem)]"
            >
              {t.titulo} <span className="tipo-enfasis">{t.tituloEnfasis}</span>
            </Revelar>

            <Revelar como="p" retraso={100} className="tipo-bajada mt-6 max-w-md">
              {t.bajada}
            </Revelar>

            <Separador className="my-9 max-w-sm" />

            <Revelar retraso={160}>
              <dl className="space-y-6">
                <div>
                  <dt className="tipo-indice mb-2">Dónde estamos</dt>
                  <dd className="font-serif text-xl font-light text-marfil">
                    {direccion ?? localidad}
                  </dd>
                  {!direccion && (
                    <p className="mt-2 max-w-sm text-sm text-marfil-tenue">
                      Te pasamos la dirección exacta al confirmar tu reserva.
                    </p>
                  )}
                </div>

                <div>
                  <dt className="tipo-indice mb-2">Cuándo</dt>
                  <dd>
                    {horarios && horarios.length > 0 ? (
                      <ul className="space-y-1.5">
                        {horarios.map((h) => (
                          <li key={h.dia} className="flex justify-between gap-6 text-sm">
                            <span className="text-marfil">{h.dia}</span>
                            <span className="tabular-nums text-marfil-tenue">{h.franja}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="max-w-sm text-sm text-marfil-tenue">
                        Trabajamos con reserva previa. Consultanos por los días y turnos
                        disponibles.
                      </p>
                    )}
                  </dd>
                </div>
              </dl>
            </Revelar>

            {mapa && (
              <Revelar retraso={240} className="mt-9">
                <BotonEnlace
                  href={mapa}
                  externo
                  variante="secundario"
                  onClick={() => medir("como_llegar_click", { origen: "ubicacion" })}
                >
                  {t.cta}
                </BotonEnlace>
              </Revelar>
            )}
          </div>
        </div>

        {/* El mapa se carga sólo si hay coordenadas confirmadas */}
        {coords && (
          <Revelar retraso={120} className="mt-14">
            <div className="relative overflow-hidden border border-[var(--borde-tenue)]">
              <iframe
                title="Ubicación de La Pasión de Rosas en el mapa"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[22rem] w-full grayscale-[0.4] contrast-[1.1]"
                src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=es&z=16&output=embed`}
              />
            </div>
          </Revelar>
        )}
      </div>
    </section>
  );
}
