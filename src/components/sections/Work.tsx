import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { publishedProjects } from "../../data/projects";
import { areaById } from "../../data/areas";
import MaskText, { titleLines } from "../ui/MaskText";
import SectionLabel from "../ui/SectionLabel";
import Reveal from "../ui/Reveal";
import ProjectCover from "../ui/ProjectCover";
import CTA from "../ui/CTA";

const caseParts = [
  { name: "Desafío", text: "Qué necesitaba resolver el proyecto." },
  { name: "Estrategia", text: "Qué decidimos hacer y por qué." },
  { name: "Ejecución", text: "Las acciones, piezas y campañas." },
  { name: "Resultados", text: "Indicadores reales, cuando hay datos." },
];

/** Proyectos. Si todavía no hay casos publicados, muestra cómo se va a documentar cada uno. */
export default function Work({ limit = 4, showHeader = true }: { limit?: number; showHeader?: boolean }) {
  const items = publishedProjects.slice(0, limit);
  return (
    <section id="proyectos" className="border-t hairline py-24 sm:py-32">
      <div className="container-x">
        {showHeader && (
          <>
            <SectionLabel>Proyectos</SectionLabel>
            <MaskText lines={titleLines("Trabajo real.", "Resultados verificables.")} className="mt-8 text-[clamp(2.6rem,6.5vw,5.8rem)]" />
          </>
        )}

        {items.length > 0 ? (
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {items.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.06}>
                <Link to={`/proyectos/${p.slug}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                    <ProjectCover project={p} className="transition-transform duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h3 className="text-xl font-bold">{p.title}</h3>
                    <span className="label text-muted">{areaById(p.area).name}</span>
                  </div>
                  <p className="mt-1 text-muted">{p.kind} · {p.year}</p>
                </Link>
              </Reveal>
            ))}
            {items.length % 2 === 1 && (
              <Reveal delay={items.length * 0.06} className="hidden md:block">
                <Link
                  to="/contacto"
                  className="group flex aspect-[4/3] flex-col justify-between rounded-2xl border border-dashed border-fg/20 p-8 transition-colors hover:border-brand"
                >
                  <span className="label text-subtle">Próximo caso</span>
                  <span>
                    <span className="display block text-[clamp(2rem,3.4vw,3rem)]">
                      Tu proyecto puede <span className="accent text-brand-soft">ser el siguiente.</span>
                    </span>
                    <span className="mt-6 inline-flex items-center gap-2 font-semibold text-fg/85 group-hover:text-brand">
                      Contanos en qué estás <ArrowUpRight size={18} />
                    </span>
                  </span>
                </Link>
              </Reveal>
            )}
          </div>
        ) : (
          <div className="mt-14 grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p className="text-lg leading-relaxed text-fg/80">
                Estamos documentando nuestros proyectos con autorización de cada cliente. Acá vas a encontrar campañas, producciones y
                casos completos, contados con sus números reales.
              </p>
              <p className="mt-4 text-fg/60">No mostramos clientes ni resultados que no podamos respaldar.</p>
              <div className="mt-8">
                <CTA to="/contacto" variant="ghost">Sumá tu proyecto</CTA>
              </div>
            </Reveal>
            <ol className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
              {caseParts.map((c, i) => (
                <Reveal as="li" key={c.name} delay={i * 0.06} className="rounded-2xl border border-dashed border-fg/20 p-6">
                  <span className="label text-subtle">Caso · 0{i + 1}</span>
                  <h3 className="mt-6 text-xl font-bold">{c.name}</h3>
                  <p className="mt-1 text-muted">{c.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
