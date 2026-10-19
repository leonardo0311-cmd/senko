"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GALERIA } from "@content/galeria";
import { hayMediosGenerados } from "@content/medios";
import { useIdioma } from "@/lib/idioma";
import { Medio } from "./ui/Medio";

export function Galeria() {
  const { t, pick } = useIdioma();
  const [abierta, setAbierta] = useState<number | null>(null);
  const origen = useRef<HTMLElement | null>(null);

  const abrir = (i: number, el: HTMLElement) => {
    origen.current = el;
    setAbierta(i);
  };

  const cerrar = useCallback(() => {
    setAbierta(null);
    origen.current?.focus();
  }, []);

  return (
    <section className="section section-light" id="galeria">
      <div className="wrap">
        <div className="reveal">
          <div className="eyebrow">{t("gal_eyebrow")}</div>
          <h2 className="menu-title" dangerouslySetInnerHTML={{ __html: t("gal_title") }} />
        </div>

        {hayMediosGenerados && (
          <p className="aviso reveal" role="note">
            <b>{t("media_generada_label")}</b>
            <span>{t("media_generada_text")}</span>
          </p>
        )}

        <div className="gallery reveal">
          {GALERIA.map((g, i) => {
            const cap = pick(g.cap, g.capEn);
            return (
              <button
                type="button"
                key={g.medio}
                className={`g-item ${g.cls}`}
                data-cursor="view"
                onClick={(e) => abrir(i, e.currentTarget)}
              >
                <span className="visually-hidden">{cap}</span>
                <Medio clave={g.medio} sizes="(min-width:820px) 40vw, 50vw" compacto />
                <span className="g-scrim" aria-hidden />
                <span className="g-cap" aria-hidden>
                  {cap}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {abierta !== null && <Visor indice={abierta} onCerrar={cerrar} onMover={setAbierta} />}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Visor({
  indice,
  onCerrar,
  onMover,
}: {
  indice: number;
  onCerrar: () => void;
  onMover: (i: number) => void;
}) {
  const { t, pick } = useIdioma();
  const caja = useRef<HTMLDivElement>(null);
  const item = GALERIA[indice];

  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCerrar();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onMover((indice + 1) % GALERIA.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onMover((indice - 1 + GALERIA.length) % GALERIA.length);
      } else if (e.key === "Tab" && caja.current) {
        // El diálogo tiene un solo botón: el foco no se va a ningún lado.
        e.preventDefault();
        caja.current.querySelector<HTMLElement>("button")?.focus();
      }
    };

    document.addEventListener("keydown", alTeclado);
    caja.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.body.style.overflow = previo;
      document.removeEventListener("keydown", alTeclado);
    };
  }, [indice, onCerrar, onMover]);

  return (
    <div
      className="lightbox"
      ref={caja}
      role="dialog"
      aria-modal="true"
      aria-label={`${indice + 1} / ${GALERIA.length}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <button type="button" className="lightbox-close" onClick={onCerrar}>
        {t("lightbox_close")}
      </button>
      <figure className="lightbox-fig" style={{ margin: 0, position: "relative", aspectRatio: "3/2" }}>
        <Medio clave={item.medio} sizes="92vw" />
      </figure>
      <div className="lightbox-cap">{pick(item.cap, item.capEn)}</div>
    </div>
  );
}
