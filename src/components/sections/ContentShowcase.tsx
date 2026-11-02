import { useCallback, useMemo, useState } from "react";
import { Camera, Mic, Video } from "lucide-react";
import { contentItems, contentKinds, type ContentItem, type ContentKind } from "../../data/content";
import { contact } from "../../data/site";
import MaskText, { titleLines } from "../ui/MaskText";
import SectionLabel from "../ui/SectionLabel";
import Reveal from "../ui/Reveal";
import CTA from "../ui/CTA";
import Lightbox from "../ui/Lightbox";
import ContentCarousel from "../ui/ContentCarousel";
import { InstagramIcon } from "../ui/icons";
import { cn } from "../../lib/utils";

const icons: Record<ContentKind, typeof Mic> = { entrevista: Mic, "en-vivo": Video, foto: Camera };
const kinds = Object.keys(contentKinds) as ContentKind[];

/**
 * Contenido: entrevistas, shows en vivo y fotos. Sección oscura para que las imágenes resalten.
 * Mientras no haya piezas cargadas, presenta los formatos y lleva a Instagram (no se muestran piezas de relleno).
 */
export default function ContentShowcase({ limit, showHeader = true, asPage = false }: { limit?: number; showHeader?: boolean; asPage?: boolean }) {
  const [filter, setFilter] = useState<ContentKind | "todo">("todo");
  const [open, setOpen] = useState<ContentItem | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const available = useMemo(() => kinds.filter((k) => contentItems.some((i) => i.kind === k)), []);
  const items = useMemo(() => {
    const list = filter === "todo" ? contentItems : contentItems.filter((i) => i.kind === filter);
    return limit ? list.slice(0, limit) : list;
  }, [filter, limit]);
  // Con pocas piezas el carrusel ya muestra todo; los filtros aparecen cuando hay bastante material.
  const showFilters = available.length > 1 && contentItems.length >= 8;

  return (
    <section id="contenido" className={cn("theme-dark relative overflow-hidden py-24 sm:py-32", asPage && "pt-36 sm:pt-44")}>
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,rgb(117_29_40/0.55),transparent_65%)]" aria-hidden="true" />
      <div className="container-x relative">
        {showHeader && (
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>Contenido</SectionLabel>
              <MaskText
                as={asPage ? "h1" : "h2"}
                onMount={asPage}
                lines={titleLines("El escenario,", "de cerca.")}
                className="mt-8 text-[clamp(2.8rem,8vw,7rem)]"
              />
            </div>
            <Reveal className="lg:col-span-5">
              <p className="text-lg leading-relaxed text-fg/80">
                Entrevistas con artistas, videos de shows en vivo y fotos de músicos arriba del escenario. Contenido que muestra al
                artista como es, para que el público quiera ir a verlo.
              </p>
            </Reveal>
          </div>
        )}

        {contentItems.length > 0 ? (
          <>
            {showFilters && (
              <div className="mt-12 flex flex-wrap gap-2" role="group" aria-label="Filtrar contenido">
                {(["todo", ...available] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={filter === k}
                    onClick={() => setFilter(k)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      filter === k ? "border-fg bg-fg text-canvas" : "border-fg/25 text-fg/85 hover:border-fg",
                    )}
                  >
                    {k === "todo" ? "Todo" : contentKinds[k].plural}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <ul className="mt-14 grid gap-4 md:grid-cols-3">
              {kinds.map((k, i) => {
                const Icon = icons[k];
                return (
                  <Reveal as="li" key={k} delay={i * 0.06} className="flex flex-col rounded-2xl border hairline bg-surface/60 p-7">
                    <Icon size={26} strokeWidth={1.6} className="text-brand" aria-hidden="true" />
                    <h3 className="display mt-10 text-[clamp(1.8rem,3vw,2.4rem)]">{contentKinds[k].plural}</h3>
                    <p className="mt-3 text-fg/75">{contentKinds[k].text}</p>
                  </Reveal>
                );
              })}
            </ul>
            <Reveal className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CTA to={contact.instagram} external variant="light" icon={<InstagramIcon size={18} />}>
                Mirá el contenido en {contact.instagramHandle}
              </CTA>
              <CTA to="/contacto?tipo=artista" variant="ghost">
                Hablemos de contenido para tu artista
              </CTA>
            </Reveal>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="relative mt-6">
          <ContentCarousel key={filter} items={items} onOpen={setOpen} paused={!!open} />
          {limit && contentItems.length > limit && (
            <div className="container-x mt-8">
              <CTA to="/contenido" variant="ghost">
                Ver todo el contenido
              </CTA>
            </div>
          )}
        </div>
      )}
      <Lightbox item={open} onClose={close} />
    </section>
  );
}
