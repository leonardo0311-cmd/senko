import { areaById, releasePhases } from "../../data/areas";
import MaskText from "../ui/MaskText";
import SectionLabel from "../ui/SectionLabel";
import CTA from "../ui/CTA";
import Reveal from "../ui/Reveal";

/** Bloque destacado de la especialidad principal. Visualmente distinto al resto (fondo bordó). */
export default function ArtistFeature() {
  const area = areaById("artista");
  return (
    <section id="artist-marketing" className="relative overflow-hidden bg-wine-deep py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgb(142_34_48/0.9),transparent_60%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_0%_100%,rgb(107_61_240/0.18),transparent_70%)]" aria-hidden="true" />
      <div className="container-x relative">
        <SectionLabel className="text-paper/70">Nuestra especialidad</SectionLabel>
        <MaskText
          lines={[[{ text: "Artist" }], [{ text: "Marketing", accent: false }]]}
          className="mt-8 text-[clamp(3.6rem,13vw,12rem)]"
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <p className="display text-[clamp(1.8rem,3.4vw,2.8rem)] leading-[0.95]">{area.card.title}</p>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.1}>
            <p className="text-lg leading-relaxed text-paper/85">{area.page.lead}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {area.page.blocks.map((b) => (
                <li key={b.title} className="rounded-full border border-paper/25 px-3.5 py-1.5 text-sm text-paper/90">
                  {b.title}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {releasePhases.map((ph, i) => (
            <Reveal key={ph.name} delay={i * 0.08} className="rounded-2xl border border-paper/15 bg-ink/40 p-6 backdrop-blur-sm">
              <span className="label text-signal-soft">Release · 0{i + 1}</span>
              <h3 className="mt-4 text-xl font-bold">{ph.name}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-paper/75">{ph.text}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-paper/15 pt-10 md:flex-row md:items-center md:justify-between">
          <p className="text-xl font-semibold">{area.page.cta.question}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CTA to={area.path} variant="ghost">
              Ver Artist Marketing
            </CTA>
            <CTA to="/contacto?tipo=artista" variant="light">
              {area.page.cta.label}
            </CTA>
          </div>
        </div>
      </div>
    </section>
  );
}
