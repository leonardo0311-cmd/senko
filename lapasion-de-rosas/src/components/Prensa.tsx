"use client";

import { PRENSA, prensaVerificada } from "@content/site";
import { useIdioma } from "@/lib/idioma";
import { medir } from "@/lib/analitica";

/**
 * Lo que se dijo de la casa.
 *
 * Cada fila enlaza a la nota en el sitio del medio: acá no se reproduce el
 * texto ajeno ni se le pone palabras a nadie. Mientras los enlaces no estén
 * verificados uno por uno, la sección lo dice en el aviso.
 */
export function Prensa() {
  const { t } = useIdioma();
  if (PRENSA.length === 0) return null;

  return (
    <section className="section" id="prensa">
      <div className="wrap">
        <div className="menu-head reveal">
          <div>
            <div className="eyebrow">{t("prensa_eyebrow")}</div>
            <h2 className="menu-title">{t("prensa_title")}</h2>
          </div>
          <p className="menu-note">{t("prensa_note")}</p>
        </div>

        {!prensaVerificada && (
          <p className="aviso reveal" role="note">
            <b>{t("prensa_pending_label")}</b>
            <span>{t("prensa_pending_text")}</span>
          </p>
        )}

        <ul className="prensa-lista reveal">
          {PRENSA.map((nota) => (
            <li key={nota.url}>
              <a
                href={nota.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => medir("prensa_click", { medio: nota.medio })}
              >
                <span className="prensa-medio">{nota.medio}</span>
                <span className="prensa-titulo">{nota.titulo}</span>
                <span className="prensa-ir" aria-hidden>
                  {t("prensa_leer")} ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
