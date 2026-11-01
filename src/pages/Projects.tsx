import Work from "../components/sections/Work";
import MaskText, { titleLines } from "../components/ui/MaskText";
import SectionLabel from "../components/ui/SectionLabel";
import Closing from "../components/sections/Closing";
import { useSeo } from "../lib/seo";

export default function Projects() {
  useSeo({
    path: "/proyectos",
    title: "Proyectos — Campañas, producciones y casos | RINDE",
    description: "Campañas, producciones audiovisuales e identidades para artistas, eventos, venues y marcas, con sus resultados verificables.",
  });
  return (
    <>
      <section className="pb-4 pt-36 sm:pt-44">
        <div className="container-x">
          <SectionLabel>Proyectos</SectionLabel>
          <MaskText as="h1" onMount lines={titleLines("Trabajo real.", "Resultados verificables.")} className="mt-8 text-[clamp(2.8rem,9vw,8rem)]" />
          <p className="mt-8 max-w-2xl text-lg text-fg/75">
            Campañas, producciones audiovisuales, identidades visuales, eventos y casos de marketing. Cada proyecto cuenta el desafío, la
            estrategia, lo que hicimos y, cuando hay datos, los resultados.
          </p>
        </div>
      </section>
      <Work limit={100} showHeader={false} />
      <Closing />
    </>
  );
}
