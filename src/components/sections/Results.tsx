import { featuredResult, recentResult, resultsNote } from "../../data/results";
import MaskText, { titleLines } from "../ui/MaskText";
import SectionLabel from "../ui/SectionLabel";
import Reveal from "../ui/Reveal";
import CountUp from "../ui/CountUp";

/** Resultados reales, cada uno con su fuente y su período. Sin nombrar clientes que no lo autorizaron. */
export default function Results() {
  return (
    <section id="resultados" className="relative py-24 sm:py-32">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel>Resultados</SectionLabel>
            <MaskText lines={titleLines("Números reales,", "con contexto.")} className="mt-8 text-[clamp(2.6rem,6.5vw,5.8rem)]" />
          </div>
          <Reveal className="lg:col-span-5">
            <p className="text-lg leading-relaxed text-fg/75">
              Cada cifra dice de dónde sale y en qué período. Lo que no podemos respaldar, no lo mostramos.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-12">
          <Reveal className="theme-wine relative flex flex-col overflow-hidden rounded-3xl p-6 sm:p-10 lg:col-span-5">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,rgb(246_242_234/0.12),transparent_70%)]"
              aria-hidden="true"
            />
            <p className="label relative text-fg/75">Nuestro mejor resultado · {featuredResult.tag}</p>
            <dl className="relative mt-10 space-y-8">
              {featuredResult.stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse">
                  <dt className="mt-3 text-lg text-fg/85">{s.label}</dt>
                  <dd className="display flex items-baseline gap-3 text-[clamp(4.2rem,14vw,8rem)] leading-[0.85]">
                    <span>
                      {s.prefix}
                      <CountUp to={Number(s.display)} duration={1.3} />
                    </span>
                    <span className="accent text-[0.42em] text-fg/90">{s.unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="relative mt-auto pt-10 text-sm text-fg/70">{featuredResult.note}</p>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col rounded-3xl border hairline bg-surface/40 p-6 sm:p-10 lg:col-span-7">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="label text-muted">{recentResult.tag}</p>
              <p className="label text-subtle">{recentResult.period}</p>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8">
              {recentResult.stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse">
                  <dt className="mt-2 text-muted">{s.label}</dt>
                  <dd className="display text-[clamp(1.9rem,8vw,4rem)] leading-none">
                    {s.prefix}
                    <CountUp to={s.value} />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-auto pt-10">
              <p className="flex flex-col gap-2 border-t hairline pt-6 sm:flex-row sm:items-baseline sm:gap-5">
                <span className="display shrink-0 text-[2.8rem] leading-none text-brand">{recentResult.highlight.value}</span>
                <span className="text-fg/80">{recentResult.highlight.text}</span>
              </p>
            </div>
          </Reveal>
        </div>

        <p className="mt-6 max-w-2xl text-sm text-subtle">{resultsNote}</p>
      </div>
    </section>
  );
}
