import { about } from "../data/site";
import { team } from "../data/team";
import MaskText, { titleLines } from "../components/ui/MaskText";
import SectionLabel from "../components/ui/SectionLabel";
import Reveal from "../components/ui/Reveal";
import Process from "../components/sections/Process";
import Closing from "../components/sections/Closing";
import { useSeo } from "../lib/seo";

export default function About() {
  useSeo({
    path: "/nosotros",
    title: "Sobre RINDE — Agencia de marketing para el entretenimiento",
    description: "Quiénes somos, cómo pensamos y cómo trabajamos: estrategia, creatividad y ejecución para artistas, eventos, venues y marcas.",
  });
  return (
    <>
      <section className="pb-20 pt-36 sm:pt-44">
        <div className="container-x">
          <SectionLabel>{about.label}</SectionLabel>
          <MaskText as="h1" onMount lines={titleLines(about.title, about.titleAccent)} className="mt-8 max-w-[18ch] text-[clamp(2.8rem,9vw,8rem)]" />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {about.paragraphs.map((t, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p className="text-lg leading-relaxed text-paper/80">{t}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t hairline bg-graphite py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <SectionLabel>Equipo</SectionLabel>
            <h2 className="display mt-6 text-[clamp(2rem,4.5vw,3.6rem)]">{about.model.title}</h2>
            <p className="mt-6 text-lg leading-relaxed text-paper/80">{about.model.text}</p>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
            {team.map((m, i) => (
              <Reveal as="li" key={m.id} delay={i * 0.06} className="flex flex-col rounded-2xl border hairline bg-ink p-5">
                <div className="aspect-[4/5] overflow-hidden rounded-xl bg-graphite-2">
                  {m.photo ? (
                    <img src={m.photo} alt={`Retrato de ${m.name}`} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-end bg-[radial-gradient(80%_60%_at_50%_100%,rgb(117_29_40/0.55),transparent_70%)] p-4">
                      <span className="display text-[4rem] leading-none text-paper/20">{m.name[0]}</span>
                    </div>
                  )}
                </div>
                <h3 className="mt-5 text-xl font-bold">{m.name}</h3>
                <p className="label mt-1 text-signal">{m.role}</p>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ash">{m.line}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t hairline py-20 sm:py-28">
        <div className="container-x">
          <SectionLabel>Cómo trabajamos</SectionLabel>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {about.principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06} className="rounded-2xl border hairline p-6">
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ash">{p.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Process />
      <Closing />
    </>
  );
}
