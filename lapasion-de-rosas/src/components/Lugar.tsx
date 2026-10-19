"use client";

import { contacto, siVerificado } from "@content/site";
import { useIdioma } from "@/lib/idioma";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { Medio } from "./ui/Medio";
import { Mapa } from "./Mapa";
import { medir } from "@/lib/analitica";

/**
 * Dónde estamos.
 *
 * La dirección exacta, el mapa y los horarios sólo se publican cuando están
 * confirmados en content/site.ts. Mientras tanto se muestra la localidad y se
 * invita a escribir: nunca una dirección inventada.
 */
export function Lugar() {
  const { t } = useIdioma();
  const direccion = siVerificado(contacto.direccion);
  const mapa = siVerificado(contacto.mapaUrl);
  const horarios = siVerificado(contacto.horarios);
  const wa = enlaceWhatsapp(t("wa_message"));

  return (
    <section className="section section-light" id="lugar">
      <div className="wrap">
        <div className="reveal">
          <div className="eyebrow">{t("suc_eyebrow")}</div>
          <h2 className="menu-title" dangerouslySetInnerHTML={{ __html: t("suc_title") }} />
          <p className="opts-text" style={{ marginTop: 18, color: "var(--stone-dim)" }}>
            {t("suc_sub")}
          </p>
        </div>

        <div className="loc-list reveal">
          <div className="loc-row">
            <div className="loc-photo" data-cursor="view">
              <Medio clave="fachada" sizes="(min-width:860px) 26vw, 100vw" compacto />
            </div>

            <div>
              <div className="loc-num">01</div>
              <h3 className="loc-name">Ezeiza</h3>
              <p className="loc-addr">{direccion ?? t("loc_pending_addr")}</p>
              <p className="loc-addr">
                {horarios && horarios.length > 0 ? horarios.join(" · ") : t("loc_pending_hours")}
              </p>
            </div>

            <div className="loc-actions">
              {mapa && (
                <a
                  href={mapa}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => medir("como_llegar_click", { origen: "lugar" })}
                >
                  {t("loc_map")} <span aria-hidden>↗</span>
                </a>
              )}
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => medir("whatsapp_click", { origen: "lugar" })}
                >
                  {t("loc_whatsapp")} <span aria-hidden>↗</span>
                </a>
              )}
              <a
                href={wa ?? "#reservas"}
                {...(wa ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="btn btn-line"
                data-cursor="link"
                onClick={() => medir("reserva_click", { origen: "lugar" })}
              >
                {t("loc_book")}
              </a>
            </div>
          </div>
        </div>

        <Mapa />
      </div>
    </section>
  );
}
