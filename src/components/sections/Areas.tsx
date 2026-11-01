import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { areas } from "../../data/areas";
import MaskText, { titleLines } from "../ui/MaskText";
import SectionLabel from "../ui/SectionLabel";
import Reveal from "../ui/Reveal";

export default function Areas() {
  const others = areas.filter((a) => a.id !== "artista");
  return (
    <section id="areas" className="py-24 sm:py-32">
      <div className="container-x">
        <SectionLabel>Áreas</SectionLabel>
        <MaskText lines={titleLines("Especialistas en", "entretenimiento.")} className="mt-8 text-[clamp(2.6rem,6.5vw,5.8rem)]" />
        <p className="mt-6 max-w-2xl text-lg text-fg/75">
          Artist Marketing es nuestra especialidad. Desde ahí trabajamos también con los espacios, los eventos y las marcas que hacen
          al entretenimiento.
        </p>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {others.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.08}>
              <Link
                to={a.path}
                className="group flex h-full flex-col gap-10 rounded-2xl border hairline bg-surface p-7 transition-colors duration-300 hover:border-fg/30 hover:bg-surface-2"
              >
                <div className="flex items-start justify-between">
                  <span className="label text-subtle">{a.index}</span>
                  <ArrowUpRight className="text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col">
                  <h3 className="display text-[2.4rem]">{a.name}</h3>
                  <p className="mt-1 text-sm text-muted">{a.audience}</p>
                  <p className="mt-6 text-lg font-semibold leading-snug">{a.card.title}</p>
                  <p className="mt-2 leading-relaxed text-fg/70">{a.card.text}</p>
                  <p className="mt-auto pt-6 text-[0.95rem] font-semibold text-brand">{a.selector.cta}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
