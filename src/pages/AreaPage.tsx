import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { areas, releasePhases, type Area } from "../data/areas";
import { capabilities } from "../data/site";
import MaskText, { titleLines } from "../components/ui/MaskText";
import SectionLabel from "../components/ui/SectionLabel";
import Reveal from "../components/ui/Reveal";
import CTA from "../components/ui/CTA";
import StageLights from "../components/ui/StageLights";
import Closing from "../components/sections/Closing";
import { useSeo } from "../lib/seo";
import { cn } from "../lib/utils";

export default function AreaPage({ area }: { area: Area }) {
  useSeo({ path: area.path, title: area.seo.title, description: area.seo.description });
  const isArtist = area.id === "artista";
  const contactTo = `/contacto?tipo=${area.id}`;
  const p = area.page;

  return (
    <>
      {/* Encabezado */}
      <section className={cn("relative overflow-hidden pb-20 pt-36 sm:pb-28 sm:pt-44", isArtist && "theme-wine")}>
        {isArtist ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgb(142_34_48/0.75),transparent_60%)]" aria-hidden="true" />
            <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_0%_100%,rgb(43_10_16/0.45),transparent_70%)]" aria-hidden="true" />
          </>
        ) : (
          <StageLights className="opacity-50" />
        )}
        <div className="container-x relative">
          <SectionLabel index={area.index} className={isArtist ? "text-fg/70" : undefined}>
            {area.name}
          </SectionLabel>
          <MaskText as="h1" onMount lines={titleLines(p.title, p.titleAccent)} className="mt-8 max-w-[18ch] text-[clamp(2.8rem,9vw,8.5rem)]" />
          <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
            <p className="max-w-xl text-lg leading-relaxed text-fg/85 md:col-span-7 md:text-xl">{p.lead}</p>
            <div className="md:col-span-5 md:flex md:justify-end">
              <CTA to={contactTo} variant={isArtist ? "light" : "primary"}>
                {p.cta.label}
              </CTA>
            </div>
          </div>
        </div>
      </section>

      {/* Problema + para quién */}
      <section className="border-b hairline py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="label text-muted">El problema</p>
            <h2 className="display mt-6 text-[clamp(2rem,4.5vw,3.6rem)]">{p.problem.title}</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg/75">{p.problem.text}</p>
          </Reveal>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={0.1}>
            <p className="label text-muted">Para quién</p>
            <ul className="mt-6">
              {p.audiences.map((a) => (
                <li key={a} className="border-b hairline py-3 text-fg/90">
                  {a}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Qué hacemos */}
      <section className="py-20 sm:py-28">
        <div className="container-x">
          <SectionLabel>Qué hacemos</SectionLabel>
          <div className={cn("mt-12 grid gap-4 md:grid-cols-2", p.blocks.length === 5 ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
            {p.blocks.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.05} className="flex flex-col rounded-2xl border hairline bg-surface p-6">
                <span className="label text-brand">0{i + 1}</span>
                <h3 className="mt-6 text-xl font-bold">{b.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{b.text}</p>
                <ul className="mt-6 space-y-2 border-t hairline pt-4">
                  {b.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-[0.95rem] text-fg/85">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-fg/50" aria-hidden="true" />
                      {it}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {isArtist && <ArtistExtras />}

      {/* Objetivos + integración */}
      <section className="border-t hairline bg-surface py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionLabel>Objetivos que acompañamos</SectionLabel>
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {p.goals.map((g) => (
                <li key={g} className="rounded-full border border-fg/20 px-4 py-2 text-fg/90">
                  {g}
                </li>
              ))}
            </ul>
          </div>
          <Reveal className="lg:col-span-5 lg:col-start-8">
            <SectionLabel>Cómo se integra</SectionLabel>
            <p className="mt-8 text-lg leading-relaxed text-fg/80">{p.integration}</p>
            <p className="mt-4 text-fg/60">
              <Link to="/#capacidades" className="underline decoration-fg/30 underline-offset-4 hover:text-brand">
                {capabilities.items.map((c) => c.name).join(" y ")}
              </Link>{" "}
              trabajan dentro de cada área.
            </p>
          </Reveal>
        </div>
      </section>

      <OtherAreas current={area} />

      <Closing title={p.cta.question} accent="" cta={{ label: p.cta.label, to: contactTo }} />
    </>
  );
}

function ArtistExtras() {
  return (
    <>
      <section className="border-t hairline py-20 sm:py-28">
        <div className="container-x">
          <SectionLabel>Release Marketing</SectionLabel>
          <MaskText lines={titleLines("Cada lanzamiento", "con su campaña.")} className="mt-8 text-[clamp(2.4rem,6vw,5rem)]" />
          <p className="mt-6 max-w-2xl text-lg text-fg/75">
            La campaña se adapta al artista, al género, al público y al objetivo del lanzamiento. Trabajamos en tres etapas.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {releasePhases.map((ph, i) => (
              <Reveal key={ph.name} delay={i * 0.08} className="rounded-2xl border hairline p-6">
                <span className="label text-brand">0{i + 1}</span>
                <h3 className="display mt-6 text-[2.2rem]">{ph.name}</h3>
                <p className="mt-2 text-fg/75">{ph.text}</p>
                <ul className="mt-6 space-y-2 border-t hairline pt-4">
                  {ph.items.map((it) => (
                    <li key={it} className="text-[0.95rem] text-muted">
                      {it}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="theme-dark py-20 sm:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="label text-fg/70">Trabajo con managers</p>
            <h2 className="display mt-6 text-[clamp(2rem,4.5vw,3.6rem)]">No reemplazamos al manager.</h2>
            <p className="mt-6 text-lg leading-relaxed text-fg/85">
              Funcionamos como su departamento de marketing externo. El manager conoce la carrera, las decisiones artísticas y las
              contrataciones. Nosotros aportamos estrategia, creatividad, publicidad y conocimiento de audiencias. Definimos desde el
              inicio quién aprueba cada decisión.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="label text-fg/70">Lo que no prometemos</p>
            <h2 className="display mt-6 text-[clamp(2rem,4.5vw,3.6rem)]">Viralidad garantizada.</h2>
            <p className="mt-6 text-lg leading-relaxed text-fg/85">
              Ni reproducciones, ni contrataciones, ni éxito artístico como si dependieran sólo de nuestro trabajo. Nos comprometemos
              con una estrategia profesional, una ejecución ordenada, campañas bien planificadas y medición transparente.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function OtherAreas({ current }: { current: Area }) {
  return (
    <section className="border-t hairline py-16">
      <div className="container-x">
        <p className="label mb-6 text-muted">Otras áreas</p>
        <div className="grid gap-px overflow-hidden rounded-2xl border hairline bg-fg/10 sm:grid-cols-3">
          {areas
            .filter((a) => a.id !== current.id)
            .map((a) => (
              <Link key={a.id} to={a.path} className="group flex items-center justify-between gap-4 bg-canvas p-6 transition-colors hover:bg-surface">
                <span>
                  <span className="display block text-[1.7rem]">{a.name}</span>
                  <span className="text-sm text-muted">{a.audience}</span>
                </span>
                <ArrowUpRight className="shrink-0 text-muted group-hover:text-brand" aria-hidden="true" />
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
