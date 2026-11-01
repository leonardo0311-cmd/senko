import { process } from "../../data/process";
import MaskText, { titleLines } from "../ui/MaskText";
import SectionLabel from "../ui/SectionLabel";
import Reveal from "../ui/Reveal";

export default function Process() {
  return (
    <section id="metodologia" className="py-24 sm:py-32">
      <div className="container-x">
        <SectionLabel>{process.label}</SectionLabel>
        <MaskText lines={titleLines(process.title, process.titleAccent)} className="mt-8 text-[clamp(2.6rem,6.5vw,5.8rem)]" />
        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border hairline bg-fg/10 md:grid-cols-5">
          {process.steps.map((s, i) => (
            <Reveal as="li" key={s.name} delay={i * 0.07} className="relative bg-canvas p-6 pb-8">
              <div className="flex items-center gap-3">
                <span className="label text-brand">{s.index}</span>
                <span className="h-px flex-1 bg-fg/15" aria-hidden="true" />
              </div>
              <h3 className="display mt-8 text-[2rem]">{s.name}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
