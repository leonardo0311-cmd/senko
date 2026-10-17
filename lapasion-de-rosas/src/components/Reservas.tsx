"use client";

import { redes, siVerificado } from "@content/site";
import { useIdioma } from "@/lib/idioma";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { Medio } from "./ui/Medio";
import { medir } from "@/lib/analitica";

export function Reservas() {
  const { t } = useIdioma();
  const wa = enlaceWhatsapp(t("wa_message"));
  const ig = siVerificado(redes.instagram);

  // Sin WhatsApp confirmado, el botón lleva a Instagram; si tampoco hay
  // Instagram, no se dibuja un botón que no va a ninguna parte.
  const destino = wa ?? ig?.url ?? null;

  return (
    <section className="reservas" id="reservas">
      <div className="reservas-media">
        <Medio clave="reservas" sizes="100vw" className="h-full w-full" compacto />
      </div>
      <div className="reservas-scrim" />

      <div className="wrap reservas-inner">
        <h2 className="res-title reveal" dangerouslySetInnerHTML={{ __html: t("res_title") }} />
        <p className="res-sub reveal">{t("res_sub")}</p>

        {destino ? (
          <a
            href={destino}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-fill reveal"
            data-cursor="link"
            onClick={() => medir(wa ? "whatsapp_click" : "instagram_click", { origen: "reservas" })}
          >
            {t("cta_book")}
          </a>
        ) : (
          <p className="aviso reveal" style={{ maxWidth: "46ch" }} role="note">
            <b>{t("pending_label")}</b>
            <span>{t("pending_contact")}</span>
          </p>
        )}
      </div>
    </section>
  );
}
