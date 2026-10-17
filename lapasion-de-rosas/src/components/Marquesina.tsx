"use client";

import { useIdioma } from "@/lib/idioma";

/** Cinta en movimiento. El texto se repite para que el bucle no tenga costura. */
export function Marquesina() {
  const { t } = useIdioma();
  const texto = t("marquee");

  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track">
        {[0, 1, 2, 3].map((i) => (
          // El texto viene del diccionario del propio sitio, no de una fuente externa.
          <span key={i} dangerouslySetInnerHTML={{ __html: texto }} />
        ))}
      </div>
    </div>
  );
}
