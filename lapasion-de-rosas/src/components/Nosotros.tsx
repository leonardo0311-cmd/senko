"use client";

import { useIdioma } from "@/lib/idioma";
import { Medio } from "./ui/Medio";

export function Nosotros() {
  const { t } = useIdioma();

  const meta = [
    { v: t("about_meta_1_value"), l: t("about_meta_1_label") },
    { v: t("about_meta_2_value"), l: t("about_meta_2_label") },
    { v: t("about_meta_3_value"), l: t("about_meta_3_label") },
  ];

  return (
    <section className="section section-light" id="nosotros">
      <div className="wrap about-grid">
        <div className="reveal">
          <div className="eyebrow">{t("about_eyebrow")}</div>
          {/* El título trae <br> y <em> del diccionario del propio sitio. */}
          <h2 className="about-title" dangerouslySetInnerHTML={{ __html: t("about_title") }} />
          <p className="about-text">{t("about_text")}</p>
          <div className="about-meta">
            {meta.map((m) => (
              <div key={m.l}>
                <b>{m.v}</b>
                <span>{m.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="about-media reveal reveal-img">
          <div className="ph-frame">
            <Medio clave="nosotros" prioridad sizes="(min-width:900px) 40vw, 100vw" />
          </div>
          <div className="about-tag">{t("about_tag")}</div>
        </div>
      </div>
    </section>
  );
}
