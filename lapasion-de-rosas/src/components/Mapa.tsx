"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { contacto, marca, siVerificado } from "@content/site";
import { useIdioma } from "@/lib/idioma";
import { medir } from "@/lib/analitica";

/** Respaldo: si el marco no dio señales en este tiempo, se da por perdido. */
const ESPERA_CARGA = 5000;

type Estado = "boton" | "probando" | "marco" | "falla";

/**
 * El mapa del local.
 *
 * Dos cosas que parecen rodeos y no lo son.
 *
 * No se carga solo. Un mapa incrustado de Google trae scripts y cookies de
 * terceros en cuanto se abre la página, y es de lo más pesado que puede llevar
 * una portada.
 *
 * Y antes de incrustarlo se comprueba que Google sea alcanzable. Un marco
 * bloqueado —por la política de seguridad de la página que lo contiene, por la
 * red, por un bloqueador— **igual dispara `load`**, porque carga la página de
 * error del navegador: esperar ese evento no sirve para saber si hay mapa, y
 * lo que queda es un rectángulo vacío. Si no es alcanzable se muestra la ficha
 * con la dirección, que es lo que esa persona necesita de todos modos.
 */
export function Mapa() {
  const { t, idioma } = useIdioma();
  const [estado, setEstado] = useState<Estado>("boton");
  const reloj = useRef<number | undefined>(undefined);

  const mapa = siVerificado(contacto.mapaUrl);
  const coord = siVerificado(contacto.coordenadas);
  const direccion = siVerificado(contacto.direccion);

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  /* Si la política de la página prohíbe el marco, el navegador lo avisa. */
  useEffect(() => {
    if (estado !== "marco") return;
    const alViolar = (e: SecurityPolicyViolationEvent) => {
      if (e.blockedURI.includes("google")) setEstado("falla");
    };
    document.addEventListener("securitypolicyviolation", alViolar);
    return () => document.removeEventListener("securitypolicyviolation", alViolar);
  }, [estado]);

  const incrustado =
    coord &&
    `https://maps.google.com/maps?q=${coord.lat},${coord.lng}` +
      `&z=17&hl=${idioma}&output=embed`;

  const pedir = useCallback(async () => {
    if (!incrustado) return;
    setEstado("probando");
    medir("mapa_visto", { origen: "lugar" });

    let alcanzable = true;
    try {
      // `no-cors` devuelve una respuesta opaca: no se puede leer, pero si la
      // red o la política la bloquean, rechaza. Es todo lo que hace falta.
      await fetch(incrustado, { mode: "no-cors", cache: "no-store" });
    } catch {
      alcanzable = false;
    }

    if (!alcanzable) {
      setEstado("falla");
      return;
    }
    setEstado("marco");
    reloj.current = window.setTimeout(
      () => setEstado((previo) => (previo === "marco" ? "falla" : previo)),
      ESPERA_CARGA,
    );
  }, [incrustado]);

  // Sin ficha confirmada no hay mapa: nunca se apunta a un lugar supuesto.
  if (!mapa || !coord || !incrustado) return null;

  return (
    <div
      className={`mapa reveal mapa-${estado}`}
      data-mapa-src={incrustado}
      data-mapa-titulo={t("mapa_titulo")}
      data-mapa-espera={ESPERA_CARGA}
    >
      {estado !== "marco" && (
        <button
          type="button"
          className="mapa-pedir"
          onClick={pedir}
          hidden={estado !== "boton"}
          disabled={estado !== "boton"}
        >
          <Aguja />
          <span className="mapa-pedir-titulo">{t("mapa_ver")}</span>
          <span className="mapa-pedir-nota">{t("mapa_aviso")}</span>
        </button>
      )}

      {/* La ficha se renderiza siempre y nace oculta: así la versión sin React
          (la página única) la tiene a mano para mostrarla cuando haga falta. */}
      <div className="mapa-ficha" hidden={estado !== "falla"}>
        <Aguja />
        <p className="mapa-ficha-dir">{direccion}</p>
        <p className="mapa-ficha-coord">
          {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
        </p>
        <p className="mapa-ficha-nota">{t("mapa_falla")}</p>
      </div>

      {estado === "marco" && (
        <iframe
          className="mapa-marco"
          src={incrustado}
          title={t("mapa_titulo")}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          onLoad={() => window.clearTimeout(reloj.current)}
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
