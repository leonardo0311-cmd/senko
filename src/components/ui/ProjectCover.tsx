import type { Project } from "../../data/projects";
import { areaById } from "../../data/areas";
import { cn } from "../../lib/utils";

/** Portada del proyecto: usa la primera imagen real, o una portada tipográfica con la identidad. */
export default function ProjectCover({ project, className }: { project: Project; className?: string }) {
  const img = project.media.find((m) => m.type === "image");
  const area = areaById(project.area);
  if (img) {
    return <img src={img.src} alt={img.alt} loading="lazy" className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <div className={cn("relative flex h-full w-full flex-col justify-between overflow-hidden bg-graphite p-6", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_80%_110%,rgb(117_29_40/0.6),transparent_65%)]" />
      <span className="label relative text-ash">{area.name}</span>
      <span className="display relative text-[clamp(2rem,4vw,3.4rem)]">{project.title}</span>
    </div>
  );
}
