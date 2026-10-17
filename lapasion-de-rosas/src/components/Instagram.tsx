"use client";

import { FEED } from "@content/galeria";
import { redes, siVerificado } from "@content/site";
import { useIdioma } from "@/lib/idioma";
import { Medio } from "./ui/Medio";
import { medir } from "@/lib/analitica";

/** Si el perfil no está confirmado, la sección entera no se renderiza. */
export function Instagram() {
  const { t } = useIdioma();
  const ig = siVerificado(redes.instagram);
  if (!ig) return null;

  return (
    <section className="section section-light">
      <div className="wrap">
        <div className="ig-head reveal">
          <div>
            <div className="eyebrow">{t("ig_eyebrow")}</div>
            <h2 className="ig-title" dangerouslySetInnerHTML={{ __html: t("ig_title") }} />
          </div>
          <a
            href={ig.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-line"
            style={{ borderColor: "var(--ink)", color: "var(--ink)" }}
            data-cursor="link"
            onClick={() => medir("instagram_click", { origen: "grilla" })}
          >
            {t("ig_cta")}
          </a>
        </div>

        <div className="ig-grid reveal">
          {FEED.map((clave, i) => (
            <a
              key={`${clave}-${i}`}
              className="ig-tile"
              href={ig.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="view"
              aria-label={t("ig_alt")}
              onClick={() => medir("instagram_click", { origen: "mosaico" })}
            >
              <Medio clave={clave} sizes="(min-width:760px) 20vw, 33vw" compacto />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
