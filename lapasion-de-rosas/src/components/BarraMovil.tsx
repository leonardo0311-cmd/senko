"use client";

import { useIdioma } from "@/lib/idioma";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { medir } from "@/lib/analitica";

/** Barra fija de reserva, sólo en celulares. */
export function BarraMovil() {
  const { t } = useIdioma();
  const wa = enlaceWhatsapp(t("wa_message"));

  return (
    <div className="mobile-bar">
      <a
        href={wa ?? "#reservas"}
        {...(wa ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={() => medir(wa ? "whatsapp_click" : "reserva_click", { origen: "barra_movil" })}
      >
        {t("mobile_book")}
      </a>
    </div>
  );
}
