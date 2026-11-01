import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { publishedProjects } from "../data/projects";
import { areaById } from "../data/areas";
import ProjectCover from "../components/ui/ProjectCover";
import SectionLabel from "../components/ui/SectionLabel";
import Reveal from "../components/ui/Reveal";
import Closing from "../components/sections/Closing";
import NotFound from "./NotFound";
import { useSeo } from "../lib/seo";

export default function ProjectPage() {
  const { slug } = useParams();
  const project = publishedProjects.find((p) => p.slug === slug);
  useSeo({
    path: `/proyectos/${slug}`,
    title: project ? `${project.title} — ${project.kind} | RINDE` : "Proyecto no encontrado | RINDE",
    description: project?.short,
  });
  const reduceMotion = useReducedMotion();
  if (!project) return <NotFound />;
  const area = areaById(project.area);
  const [hero, ...gallery] = project.media;

  return (
    <>
      <section className="pb-12 pt-36 sm:pt-44">
        <div className="container-x">
          <Link to="/proyectos" className="label inline-flex items-center gap-2 text-ash hover:text-paper">
            <ArrowLeft size={14} /> Proyectos
          </Link>
          <h1 className="display mt-8 text-[clamp(3rem,10vw,9rem)]">{project.title}</h1>
          <p className="mt-4 text-lg text-ash">
            {project.kind} · {area.name} · {project.year}
          </p>
        </div>
      </section>

      <div className="container-x">
        <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-graphite">
          {hero?.type === "video" ? (
            <video
              src={hero.src}
              poster={hero.poster}
              aria-label={hero.alt}
              autoPlay={!reduceMotion}
              muted
              loop
              playsInline
              controls
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : (
            <ProjectCover project={project} />
          )}
        </div>
      </div>

      <section className="py-20">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-7">
            <Reveal>
              <SectionLabel>Desafío</SectionLabel>
              <p className="mt-4 text-lg leading-relaxed text-paper/85">{project.challenge}</p>
            </Reveal>
            <Reveal>
              <SectionLabel>Estrategia</SectionLabel>
              <p className="mt-4 text-lg leading-relaxed text-paper/85">{project.strategy}</p>
            </Reveal>
          </div>
          <div className="space-y-12 lg:col-span-4 lg:col-start-9">
            <Reveal>
              <SectionLabel>Ejecución</SectionLabel>
              <ul className="mt-4">
                {project.execution.map((e) => (
                  <li key={e} className="border-b hairline py-3 text-paper/85">{e}</li>
                ))}
              </ul>
            </Reveal>
            {project.results && project.results.length > 0 && (
              <Reveal>
                <SectionLabel>Resultados</SectionLabel>
                <ul className="mt-4">
                  {project.results.map((r) => (
                    <li key={r} className="border-b hairline py-3 font-semibold">{r}</li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="pb-20">
          <div className="container-x grid items-start gap-4 md:grid-cols-2">
            {gallery.map((m) =>
              m.type === "video" ? (
                <video key={m.src} src={m.src} poster={m.poster} controls playsInline preload="none" className="w-full rounded-2xl" aria-label={m.alt} />
              ) : (
                <img key={m.src} src={m.src} alt={m.alt} loading="lazy" className="w-full rounded-2xl object-cover" />
              ),
            )}
          </div>
        </section>
      )}

      <Closing />
    </>
  );
}
