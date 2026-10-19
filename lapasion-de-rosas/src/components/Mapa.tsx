"use client";

import { useState } from "react";
import { contacto, marca, siVerificado } from "@content/site";
import { useIdioma } from "@/lib/idioma";
import { medir } from "@/lib/analitica";

/**
 * El mapa del local.
 *
 * No se carga solo. Un mapa incrustado de Google trae scripts y cookies de
 * terceros en cuanto se abre la página, y es de lo más pesado que puede tener
 * una portada: se carga cuando alguien lo pide. Hasta entonces hay un botón y
 * el enlace directo a la ficha, que funciona igual sin JavaScript.
 */
export function Mapa() {
  const { t, idioma } = useIdioma();
  const [cargado, setCargado] = useState(false);
  const mapa = siVerificado(contacto.mapaUrl);
  const coord = siVerificado(contacto.coordenadas);

  // Sin ficha confirmada no hay mapa: nunca se apunta a un lugar supuesto.
  if (!mapa || !coord) return null;

  const incrustado =
    `https://maps.google.com/maps?q=${coord.lat},${coord.lng}` +
    `&z=17&hl=${idioma}&output=embed`;

  return (
    /* La URL del mapa viaja en el marcado para que la versión sin React
       (la página única) pueda cargarlo con el mismo clic. */
    <div className="mapa reveal" data-mapa-src={incrustado} data-mapa-titulo={t("mapa_titulo")}>
      {cargado ? (
        <iframe
          className="mapa-marco"
          src={incrustado}
          title={t("mapa_titulo")}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="mapa-pedir"
          onClick={() => {
            setCargado(true);
            medir("mapa_visto", { origen: "lugar" });
          }}
        >
          <Aguja />
          <span className="mapa-pedir-titulo">{t("mapa_ver")}</span>
          <span className="mapa-pedir-nota">{t("mapa_aviso")}</span>
        </button>
      )}

      <a
        className="mapa-abrir"
        href={mapa}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => medir("como_llegar_click", { origen: "mapa" })}
      >
        {t("mapa_abrir")} <span aria-hidden>↗</span>
      </a>

      <span className="visually-hidden">{marca.nombre}</span>
    </div>
  );
}

/** Una aguja de mapa, del mismo trazo fino que el resto del sitio. */
function Aguja() {
  return (
    <svg
      className="mapa-aguja"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      aria-hidden
      focusable="false"
    >
      <path d="M12 21.5c4.2-5.1 6.3-8.8 6.3-11.3A6.3 6.3 0 0 0 5.7 10.2c0 2.5 2.1 6.2 6.3 11.3Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}
