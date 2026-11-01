import { motion, type Variants } from "framer-motion";
import { cn } from "../../lib/utils";
import { useIntroDone } from "../../lib/intro";

export type Segment = { text: string; accent?: boolean };

type Props = {
  lines: Segment[][];
  className?: string;
  as?: "h1" | "h2" | "h3";
  delay?: number;
  /** Animar al montar (hero) o al entrar en pantalla. */
  onMount?: boolean;
};

const line: Variants = {
  hidden: { y: "105%" },
  show: (i: number) => ({ y: 0, transition: { duration: 0.9, delay: i, ease: [0.16, 1, 0.3, 1] } }),
};

/**
 * Titular que aparece línea por línea, con palabras de acento en serif itálica.
 * El disparador es el titular completo (no cada línea), porque las líneas arrancan ocultas por la máscara.
 */
export default function MaskText({ lines, className, as = "h2", delay = 0, onMount = false }: Props) {
  const Tag = motion[as];
  const introDone = useIntroDone();
  const label = lines.map((l) => l.map((s) => s.text).join("")).join(" ");
  return (
    <Tag
      className={cn("display", className)}
      aria-label={label}
      initial="hidden"
      {...(onMount ? { animate: introDone ? "show" : "hidden" } : { whileInView: "show", viewport: { once: true, margin: "0px 0px -8% 0px" } })}
    >
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]" aria-hidden="true">
          <motion.span className="block" variants={line} custom={delay + i * 0.09}>
            {l.map((seg, j) =>
              seg.accent ? (
                <span key={j} className="accent text-[1.08em] text-brand-soft">
                  {seg.text}
                </span>
              ) : (
                <span key={j}>{seg.text}</span>
              ),
            )}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** Atajo: título + acento en dos líneas. */
export function titleLines(title: string, accent?: string): Segment[][] {
  return accent ? [[{ text: title }], [{ text: accent, accent: true }]] : [[{ text: title }]];
}
