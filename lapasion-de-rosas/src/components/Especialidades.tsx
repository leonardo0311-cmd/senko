"use client";

import { ESPECIALIDADES, cartaVerificada } from "@content/menu";
import { useIdioma } from "@/lib/idioma";
import { Medio } from "./ui/Medio";

export function Especialidades() {
  const { t, pick } = useIdioma();
  const principal = ESPECIALIDADES.principal;

  return (
    <section className="section-dark" style={{ paddingBlock: 0 }}>
      <div className="wrap" style={{ paddingInline: 0, maxWidth: "none" }}>
        <div style={{ padding: "clamp(64px,10vw,120px) clamp(20px,4.4vw,72px) 0" }}>
          <div className="eyebrow reveal">{t("spec_eyebrow")}</div>
          <h2 className="fuego-title reveal" style={{ maxWidth: "16ch", marginTop: 16 }}>
            {t("spec_title")}
          </h2>
        </div>

        <div className="spec-grid" style={{ marginTop: 56 }}>
          <div className="spec-block reveal reveal-img" data-cursor="view">
            <Medio clave="especialidad" prioridad sizes="(min-width:900px) 60vw, 100vw" compacto />
            <div className="spec-scrim" />
            <div className="spec-text">
              <div className="eyebrow spec-eyebrow">{t("spec_block_eyebrow")}</div>
              <h3 className="spec-name">{pick(principal.n, principal.nEn)}</h3>
              <p className="spec-desc">{t("spec_desc")}</p>
              {/* La carta sí muestra los precios de ejemplo, pero con el aviso
                  naranja justo encima. Acá no hay aviso que los enmarque, así
                  que hasta que estén confirmados no se muestran. */}
              {cartaVerificada && <div className="spec-price">$ {principal.p}</div>}
            </div>
          </div>

          <div className="spec-side">
            {ESPECIALIDADES.secundarios.map((it) => (
              <div className="spec-mini reveal" key={it.n}>
                <div>
                  <div className="item-name">{pick(it.n, it.nEn)}</div>
                  <div className="item-tags">
                    {it.t.map((tag) => (
                      <span key={tag}>{t(`tag_${tag}`)}</span>
                    ))}
                  </div>
                </div>
                {cartaVerificada && <div className="item-price">$ {it.p}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
