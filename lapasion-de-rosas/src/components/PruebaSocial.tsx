import { redes, siVerificado, textos } from "@content/site";
import { Medio } from "./ui/Medio";
import { Revelar } from "./ui/Revelar";
import { Separador } from "./ui/MarcaRosa";
import { EnlaceInstagram } from "./ui/EnlaceInstagram";

/**
 * Notoriedad.
 *
 * Reglas que respeta:
 *  - No hay reseñas ni testimonios inventados.
 *  - El contador de seguidores sólo aparece si el restaurante lo aprobó y
 *    está actualizado (`redes.seguidores.verificado`).
 *  - No es un muro de capturas de Instagram: son pocas piezas, curadas.
 */
export function PruebaSocial() {
  const t = textos.social;
  const instagram = siVerificado(redes.instagram);
  const seguidores = siVerificado(redes.seguidores);

  // Sin perfil confirmado, la sección no tiene nada verdadero que mostrar.
  if (!instagram) return null;

  return (
    <section className="seccion relative bg-chocolate/30" aria-labelledby="social-titulo">
      <div className="marco">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-5">
            <Revelar
              como="h2"
              id="social-titulo"
              className="tipo-titulo text-[clamp(2rem,1.2rem+3vw,3.6rem)]"
            >
              {t.titulo} <span className="tipo-enfasis">{t.tituloEnfasis}</span>
            </Revelar>

            <Revelar como="p" retraso={100} className="tipo-bajada mt-6 max-w-md">
              {t.bajada}
            </Revelar>

            {seguidores !== null && (
              <Revelar retraso={160} className="mt-9 flex items-baseline gap-3">
                <span className="font-serif text-[clamp(2.2rem,1.6rem+2vw,3.2rem)] font-light text-oro tabular-nums">
                  {new Intl.NumberFormat("es-AR").format(seguidores)}
                </span>
                <span className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-marfil/55">
                  seguidores en Instagram
                </span>
              </Revelar>
            )}

            <Separador className="my-9 max-w-xs" />

            <Revelar retraso={220}>
              <EnlaceInstagram origen="prueba_social" />
            </Revelar>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:col-span-6 lg:col-start-7">
            <Revelar tipo="mascara">
              <Medio clave="ocasionCelebracion" ratio="4/5" sizes="(min-width: 1024px) 24vw, 45vw" compacto />
            </Revelar>
            <Revelar tipo="mascara" retraso={120} className="pt-10">
              <Medio clave="platoPrincipal" ratio="4/5" sizes="(min-width: 1024px) 24vw, 45vw" compacto />
            </Revelar>
          </div>
        </div>
      </div>
    </section>
  );
}
