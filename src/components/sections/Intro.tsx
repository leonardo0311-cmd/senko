import { intro, pillars } from "../../data/site";
import MaskText, { titleLines } from "../ui/MaskText";
import SectionLabel from "../ui/SectionLabel";
import Reveal from "../ui/Reveal";

export default function Intro() {
  return (
    <section id="rinde" className="py-24 sm:py-32">
      <div className="container-x">
        <SectionLabel>{intro.label}</SectionLabel>
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <MaskText lines={titleLines(intro.title, intro.titleAccent)} className="text-[clamp(2.6rem,6.5vw,5.8rem)] lg:col-span-7" />
          <Reveal className="lg:col-span-5 lg:pt-4">
            <p className="text-lg leading-relaxed text-paper/80">{intro.text}</p>
          </Reveal>
        </div>

        <ol className="mt-20 grid gap-px overflow-hidden rounded-2xl border hairline bg-paper/10 sm:grid-cols-2 lg:grid-cols-5">
          {pillars.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.05} className="bg-ink p-6">
              <span className="label text-signal">0{i + 1}</span>
              <h3 className="mt-6 text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ash">{p.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
