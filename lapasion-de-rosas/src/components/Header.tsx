"use client";

import { useEffect, useState } from "react";
import { navegacion } from "@content/site";
import { Logotipo } from "./ui/Logotipo";
import { useIdioma } from "@/lib/idioma";
import { medir } from "@/lib/analitica";

export function Header() {
  const { t, idioma, cambiar } = useIdioma();
  const [solido, setSolido] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const alScrollear = () => setSolido(window.scrollY > 60);
    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", abierto);
    return () => document.body.classList.remove("menu-open");
  }, [abierto]);

  // Escape cierra el panel móvil.
  useEffect(() => {
    if (!abierto) return;
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alTeclado);
    return () => document.removeEventListener("keydown", alTeclado);
  }, [abierto]);

  const otro = idioma === "es" ? "en" : "es";

  return (
    <header className={`site-header${solido ? " solid" : ""}`}>
      <a href="#inicio" className="brand" aria-label="La Pasión de Rosas">
        <Logotipo alto={72} />
      </a>

      <div className="header-right">
        <nav className={`main-nav${abierto ? " open" : ""}`} id="nav-principal">
          {navegacion.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setAbierto(false)}>
              {t(n.clave)}
            </a>
          ))}
          <a
            href="#reservas"
            className="btn header-cta"
            data-cursor="link"
            onClick={() => {
              setAbierto(false);
              medir("reserva_click", { origen: "header" });
            }}
          >
            {t("cta_book")}
          </a>
        </nav>

        <button
          type="button"
          className="lang-toggle"
          onClick={() => cambiar(otro)}
          aria-label={idioma === "es" ? "Switch to English" : "Cambiar a español"}
        >
          <BanderaDoble />
          <span>{otro.toUpperCase()}</span>
        </button>

        <button
          type="button"
          className="nav-toggle"
          aria-label={t("nav_toggle_aria")}
          aria-expanded={abierto}
          aria-controls="nav-principal"
          onClick={() => setAbierto((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

/** Mitad bandera argentina, mitad estadounidense: indica el cambio de idioma. */
function BanderaDoble() {
  return (
    <svg className="lang-flag" viewBox="0 0 40 26" aria-hidden focusable="false">
      <clipPath id="arg-clip">
        <rect x="0" y="0" width="20" height="26" />
      </clipPath>
      <g clipPath="url(#arg-clip)">
        <rect x="0" y="0" width="20" height="26" fill="#74ACDF" />
        <rect x="0" y="8.7" width="20" height="8.6" fill="#fff" />
        <circle cx="10" cy="13" r="2.5" fill="#F6B40E" stroke="#85340A" strokeWidth="0.35" />
      </g>
      <clipPath id="us-clip">
        <rect x="20" y="0" width="20" height="26" />
      </clipPath>
      <g clipPath="url(#us-clip)">
        <rect x="20" y="0" width="20" height="26" fill="#fff" />
        <g fill="#B22234">
          {[0, 4, 8, 12, 16, 20, 24].map((y) => (
            <rect key={y} x="20" y={y} width="20" height="2" />
          ))}
        </g>
        <rect x="20" y="0" width="9" height="12" fill="#3C3B6E" />
        <g fill="#fff">
          {[2.5, 5.5, 8.5].map((cy) =>
            [22.5, 25.5, 28.5].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.6" />),
          )}
        </g>
      </g>
      <line x1="20" y1="0" x2="20" y2="26" stroke="rgba(0,0,0,.22)" strokeWidth="0.6" />
    </svg>
  );
}
