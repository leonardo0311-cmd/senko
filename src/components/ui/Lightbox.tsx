import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { contentHeading, type ContentItem } from "../../data/content";

/** Visor a pantalla completa para fotos y videos propios. Esc o un clic afuera lo cierran. */
export default function Lightbox({ item, onClose }: { item: ContentItem | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={contentHeading(item)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/92 p-4 sm:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper text-ink"
          >
            <X size={20} />
          </button>
          <motion.figure
            className="flex max-h-full w-full max-w-5xl flex-col items-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {item.video ? (
              <video
                src={item.video}
                poster={item.image}
                controls
                autoPlay
                playsInline
                className={item.vertical ? "aspect-[9/16] h-[78vh] max-w-full rounded-xl bg-ink object-contain" : "max-h-[78vh] w-full rounded-xl bg-ink"}
              />
            ) : (
              <img src={item.image} alt={item.alt} className="max-h-[78vh] w-auto rounded-xl object-contain" />
            )}
            <figcaption className="mt-4 text-center text-paper">
              <span className="font-semibold">{contentHeading(item)}</span>
              {item.artist && item.title && <span className="text-paper/70"> · {item.title}</span>}
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
