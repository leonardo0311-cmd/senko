import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { areas } from "../../data/areas";
import Reveal from "../ui/Reveal";

/** Atajo de conversión: cada visitante elige quién es y va a la página que le habla. */
export default function AudienceSelector() {
  return (
    <section aria-labelledby="selector-title" className="border-b hairline py-16 sm:py-20">
      <div className="container-x">
        <h2 id="selector-title" className="label mb-8 text-ash">
          ¿Qué proyecto tenés entre manos?
        </h2>
        <div className="grid gap-px overflow-hidden rounded-2xl border hairline bg-paper/10 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.06}>
              <Link
                to={a.path}
                className="group flex h-full min-h-44 flex-col justify-between gap-6 bg-ink p-6 transition-colors duration-300 hover:bg-graphite"
              >
                <span className="label text-ash-dark">{a.index}</span>
                <span>
                  <span className="display block text-[1.9rem]">{a.selector.label}</span>
                  <span className="mt-2 flex items-center gap-2 text-[0.95rem] text-signal">
                    {a.selector.cta}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
