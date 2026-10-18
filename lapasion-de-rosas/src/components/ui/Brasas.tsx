"use client";

import { useEffect, useRef } from "react";

/**
 * Las chispas suben por el calor.
 *
 * Son elementos con una animación CSS (no JavaScript por fotograma), así que
 * el trabajo queda en el compositor. Con `prefers-reduced-motion` no se crea
 * ninguna: queda la composición estática, que ya es una pieza en sí.
 */
export function Brasas({ className = "" }: { className?: string }) {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = caja.current;
    if (!box) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // En pantallas chicas, menos partículas.
    const total = window.matchMedia("(max-width: 760px)").matches ? 12 : 26;

    for (let i = 0; i < total; i++) {
      const e = document.createElement("div");
      e.className = "ember-particle";
      const tam = 2 + Math.random() * 5;
      e.style.width = `${tam}px`;
      e.style.height = `${tam}px`;
      e.style.left = `${Math.random() * 100}%`;
      e.style.setProperty("--drift", `${Math.random() * 80 - 40}px`);
      e.style.animationDuration = `${6 + Math.random() * 7}s`;
      e.style.animationDelay = `${Math.random() * 9}s`;
      box.appendChild(e);
    }

    return () => {
      box.replaceChildren();
    };
  }, []);

  return <div className={`embers ${className}`.trim()} ref={caja} aria-hidden />;
}
