"use client";

import { OCASIONES } from "@content/ocasiones";
import { useIdioma } from "@/lib/idioma";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { medir } from "@/lib/analitica";

/**
 * Las ocasiones. Cada una abre WhatsApp con el motivo ya escrito; si todavía
 * no hay número confirmado, lleva a la sección de reservas en vez de a un
 * enlace muerto.
 */
export function Ocasiones() {
  const { t, pick } = useIdioma();

  return (
    <section className="section opts" id="ocasiones">
      <div className="wrap opts-top">
        <div className="reveal">
          <div className="eyebrow">{t("opts_eyebrow")}</div>
          <h2 className="opts-title">{t("opts_title")}</h2>
          <p className="opts-text">{t("opts_text1")}</p>
          <p className="opts-text" style={{ marginTop: 14 }}>
            {t("opts_text2")}
          </p>
        </div>

        <div className="opts-list reveal">
          {OCASIONES.map((o, i) => {
            const motivo = pick(o.motivo, o.motivoEn);
            const wa = enlaceWhatsapp(t("wa_message_occasion", { occasion: motivo }));
            return (
              <div className="opt-row" key={o.id}>
                <div className="opt-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="opt-name">
                  {t(o.nombre)}
                  <span>{t(o.desc)}</span>
                  <a
                    className="opt-cta"
                    href={wa ?? "#reservas"}
                    {...(wa ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    data-cursor="link"
                    onClick={() =>
                      medir(wa ? "whatsapp_click" : "reserva_click", {
                        origen: "ocasion",
                        motivo: o.id,
                      })
                    }
                  >
                    {t("opt_cta")} →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
