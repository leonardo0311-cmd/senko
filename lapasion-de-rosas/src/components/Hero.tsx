"use client";

import { videoPortada } from "@content/medios";
import { useIdioma } from "@/lib/idioma";
import { Medio } from "./ui/Medio";
import { medir } from "@/lib/analitica";

export function Hero() {
  const { t } = useIdioma();

  return (
    <section className="hero" id="inicio">
      <div className="hero-media">
        <div className="media-fill">
          {videoPortada ? (
            <video
              className="ph h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              tabIndex={-1}
            >
              <source src={videoPortada} type="video/mp4" />
            </video>
          ) : (
            <Medio clave="hero" prioridad sizes="100vw" className="h-full w-full" compacto />
          )}
        </div>
      </div>
      <div className="hero-scrim" />

      <div className="hero-inner">
        <div className="hero-eyebrow">{t("hero_eyebrow")}</div>
        <h1>
          {t("hero_name_1")}
          <br />
          <em>{t("hero_name_2")}</em>
        </h1>
        <div className="hero-sub">{t("hero_sub")}</div>
        <p className="hero-quote">{t("hero_quote")}</p>
        <div className="hero-ctas">
          <a
            href="#reservas"
            className="btn btn-fill"
            data-cursor="link"
            onClick={() => medir("reserva_click", { origen: "hero" })}
          >
            {t("cta_book")}
          </a>
          <a href="#carta" className="btn btn-line" data-cursor="link">
            {t("cta_view_menu")}
          </a>
        </div>
      </div>

      <div className="scroll-cue" aria-hidden>
        <span>{t("hero_scroll")}</span>
        <span className="line" />
      </div>
    </section>
  );
}
