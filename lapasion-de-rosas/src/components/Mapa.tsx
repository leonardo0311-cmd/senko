"use client";

import { useEffect, useState } from "react";
import { contacto, marca, siVerificado } from "@content/site";
import { useIdioma } from "@/lib/idioma";
import { medir } from "@/lib/analitica";

/**
 * El mapa del local.
 *
 * Se muestra directo: no hay nada que tocar ni que esperar.
 *
 * El marco va con `loading="lazy"`, así que el navegador no lo trae hasta que
 * la sección está por entrar en pantalla: el mapa aparece puesto, pero no le
 * cuesta nada a la portada.
 *
 * Y hay una ficha de respaldo, porque el marco puede no cargar nunca: la
 * política de seguridad de la página que lo contiene puede prohibirlo, o la
 * red puede bloquearlo. Un marco bloqueado **igual dispara `load`** —carga la
 * página de error del navegador—, así que ese evento no sirve para saberlo. Lo
 * que se hace es comprobar que Google sea alcanzable apenas abre la página, no
 * al llegar a la sección: cuando alguien baja hasta acá, ya está decidido.
 */
export function Mapa() {
  const { t, idioma } = useIdioma();
  const [falla, setFalla] = useState(false);

  const mapa = siVerificado(contacto.mapaUrl);
  const coord = siVerificado(contacto.coordenadas);
  const direccion = siVerificado(contacto.direccion);

  const incrustado = coord
    ? `https://maps.google.com/maps?q=${coord.lat},${coord.lng}&z=17&hl=${idioma}&output=embed`
    : null;

  /* Si la red lo bloquea, la petición rechaza y se sabe antes de llegar. */
  useEffect(() => {
    if (!incrustado) return;
    let vivo = true;
    fetch(incrustado, { mode: "no-cors", cache: "no-store" }).catch(() => {
      if (vivo) setFalla(true);
    });
    return () => {
      vivo = false;
    };
  }, [incrustado]);

  /* Si la política de la página lo prohíbe, el navegador lo avisa. */
  useEffect(() => {
    const alViolar = (e: SecurityPolicyViolationEvent) => {
      if (e.blockedURI.includes("google")) setFalla(true);
    };
    document.addEventListener("securitypolicyviolation", alViolar);
    return () => document.removeEventListener("securitypolicyviolation", alViolar);
  }, []);

  // Sin ficha confirmada no hay mapa: nunca se apunta a un lugar supuesto.
  if (!mapa || !coord || !incrustado) return null;

  return (
    <div
      className={`mapa reveal${falla ? " mapa-falla" : ""}`}
      data-mapa-src={incrustado}
      data-mapa-titulo={t("mapa_titulo")}
    >
      {/* La ficha se renderiza siempre y nace oculta: así la versión sin React
          (la página única) la tiene a mano para mostrarla si hace falta. */}
      <div className="mapa-ficha" hidden={!falla}>
        <Aguja />
        <p className="mapa-ficha-dir">{direccion}</p>
        <p className="mapa-ficha-coord">
          {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
        </p>
        <p className="mapa-ficha-nota">{t("mapa_falla")}</p>
      </div>

      {!falla && (
        <iframe
          className="mapa-marco"
          src={incrustado}
          title={t("mapa_titulo")}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
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
