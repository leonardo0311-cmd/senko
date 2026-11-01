import { capabilities } from "../../data/site";
import MaskText, { titleLines } from "../ui/MaskText";
import SectionLabel from "../ui/SectionLabel";
import Reveal from "../ui/Reveal";

export default function Capabilities() {
  return (
    <section id="capacidades" className="border-t hairline bg-graphite py-24 sm:py-32">
      <div className="container-x">
        <SectionLabel>{capabilities.label}</SectionLabel>
        <MaskText lines={titleLines(capabilities.title, capabilities.titleAccent)} className="mt-8 text-[clamp(2.6rem,6.5vw,5.8rem)]" />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {capabilities.items.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.1} className="rounded-2xl border hairline bg-ink p-7 sm:p-9">
              <h3 id={c.id} className="display text-[clamp(2rem,4vw,3rem)]">{c.name}</h3>
              <p className="mt-4 text-lg leading-relaxed text-paper/80">{c.text}</p>
              <ul className="mt-8 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {c.list.map((item) => (
                  <li key={item} className="flex gap-3 border-b hairline py-2 text-[0.95rem] text-paper/85">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              {"note" in c && c.note && (
                <p className="mt-8 rounded-xl border border-signal/30 bg-signal/[0.06] p-4 text-[0.95rem] text-paper/85">{c.note}</p>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
