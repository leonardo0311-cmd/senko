import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

const fmt = new Intl.NumberFormat("es-AR");

/** Número que cuenta desde 0 al entrar en pantalla. Los lectores de pantalla leen sólo el valor final. */
export default function CountUp({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setV(to);
      return;
    }
    const c = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (n) => setV(Math.round(n)) });
    return () => c.stop();
  }, [inView, reduce, to, duration]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {fmt.format(v)}
      </span>
      <span className="sr-only">{fmt.format(to)}</span>
    </>
  );
}
