"use client";

import { useEffect, useRef } from "react";
import { useIdioma } from "@/lib/idioma";
import { Medio } from "./ui/Medio";

/**
 * Las brasas suben por el calor.
 *
 * Son 26 elementos con una animación CSS (no JavaScript por fotograma), así
 * que el trabajo queda en el compositor. Con `prefers-reduced-motion` no se
 * crea ninguna: queda la composición estática, que ya es una pieza en sí.
 */
function Brasas() {
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

  return <div className="embers" ref={caja} aria-hidden />;
}

export function Fuego() {
  const { t } = useIdioma();

  return (
    <section className="fuego">
      <div className="fuego-media">
        <Medio clave="fuego" prioridad sizes="100vw" className="h-full w-full" compacto />
      </div>
      <div className="fuego-scrim" />
      <Brasas />
      <MarcaRosa />

      <div className="wrap fuego-inner">
        <div className="eyebrow reveal">{t("fuego_eyebrow")}</div>
        <h2 className="fuego-title reveal">{t("fuego_title")}</h2>
        <p className="fuego-sub reveal">{t("fuego_sub")}</p>
      </div>
    </section>
  );
}

/** Filigrana: un pétalo, guiño al nombre de la casa. */
function MarcaRosa() {
  return (
    <svg
      className="fuego-mark"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.7"
      aria-hidden
      focusable="false"
    >
      <path d="M24 3c8 6.4 12 12.9 12 19.5C36 31 30.6 37.2 24 46c-6.6-8.8-12-15-12-23.5C12 15.9 16 9.4 24 3Z" />
      <path d="M24 11.5c4.1 3.9 6.2 7.9 6.2 11.9 0 5.3-2.8 9-6.2 14.6-3.4-5.6-6.2-9.3-6.2-14.6 0-4 2.1-8 6.2-11.9Z" />
      <path d="M24 3v43" opacity="0.5" />
    </svg>
  );
}
