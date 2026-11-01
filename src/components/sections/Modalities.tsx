import { modalities } from "../../data/site";
import MaskText, { titleLines } from "../ui/MaskText";
import SectionLabel from "../ui/SectionLabel";
import Reveal from "../ui/Reveal";

export default function Modalities() {
  return (
    <section id="modalidades" className="border-t hairline py-24 sm:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionLabel>{modalities.label}</SectionLabel>
          <MaskText lines={titleLines(modalities.title, modalities.titleAccent)} className="mt-8 text-[clamp(2.4rem,5vw,4.4rem)]" />
          <Reveal>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-paper/75">{modalities.note}</p>
          </Reveal>
        </div>
        <ul className="lg:col-span-6 lg:col-start-7">
          {modalities.items.map((m, i) => (
            <Reveal as="li" key={m.name} delay={i * 0.06} className="flex flex-col gap-1 border-b hairline py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
              <h3 className="display text-[1.9rem]">{m.name}</h3>
              <p className="text-ash sm:max-w-[22rem] sm:text-right">{m.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
