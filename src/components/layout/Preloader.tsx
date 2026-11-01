import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Logo from "../ui/Logo";
import Star from "../ui/Star";
import { brand } from "../../data/site";
import { markIntroDone } from "../../lib/intro";

/**
 * Entrada de la web original: el logo sobre papel crema y una cortina que se levanta.
 * Se ve cada vez que se entra o se recarga la página (no al navegar entre secciones).
 * Un toque o una tecla la saltean. Con "reducir movimiento" activado no aparece.
 */
export default function Preloader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(() => !reduce);

  useEffect(() => {
    if (!show) {
      markIntroDone();
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const close = () => setShow(false);
    const t = window.setTimeout(close, 1400);
    window.addEventListener("keydown", close);
    window.addEventListener("pointerdown", close);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", close);
      window.removeEventListener("pointerdown", close);
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="paper-texture fixed inset-0 z-[80] flex items-center justify-center bg-cream"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden="true"
        >
          <motion.div
            className="relative flex flex-col items-end text-wine"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Logo size="custom" className="h-[clamp(3.2rem,11vw,6.5rem)] w-auto" />
            <span className="mt-[0.6em] text-[clamp(0.62rem,1.7vw,1.05rem)] font-bold uppercase italic tracking-[0.02em]">
              {brand.tagline}
            </span>
            <motion.span
              className="absolute -right-9 -top-8 block text-wine sm:-right-11 sm:-top-9"
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 12 }}
            >
              <Star className="h-8 w-8 sm:h-10 sm:w-10" />
            </motion.span>
          </motion.div>

          <div className="absolute bottom-10 left-1/2 h-px w-[min(60vw,380px)] -translate-x-1/2 bg-wine/25">
            <motion.span
              className="block h-full w-full origin-left bg-wine"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
