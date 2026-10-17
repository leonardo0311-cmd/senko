"use client";

import { useEffect, useState } from "react";
import { navegacion, textos } from "@content/site";
import { LogotipoCompacto } from "./ui/Logotipo";
import { NavegacionMovil } from "./NavegacionMovil";
import { medir } from "@/lib/analitica";

/**
 * Encabezado fijo. Transparente sobre la portada; al desplazarse se vuelve
 * una barra oscura con desenfoque, sin perder presencia el logotipo.
 */
export function Header() {
  const [desplazado, setDesplazado] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<string>("");

  useEffect(() => {
    let pendiente = false;
    const alScrollear = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        setDesplazado(window.scrollY > 24);
        pendiente = false;
      });
    };

    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  // Marca la sección visible en la navegación.
  useEffect(() => {
    const secciones = navegacion
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => el !== null);
    if (secciones.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setSeccionActiva(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5] },
    );

    secciones.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-[var(--ease-suave)] ${
        desplazado
          ? "border-b border-[var(--borde-tenue)] bg-carbon/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
      style={{ height: "var(--alto-header)" }}
    >
      <div className="marco flex h-full items-center justify-between gap-6">
        <a
          href="#inicio"
          className="shrink-0 text-marfil transition-opacity hover:opacity-80"
          aria-label="La Pasión de Rosas — Inicio"
        >
          <LogotipoCompacto />
        </a>

        <nav aria-label="Navegación principal" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {navegacion.map((item) => {
              const activo = seccionActiva === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={activo ? "true" : undefined}
                    className="group relative block py-2 font-sans text-[0.75rem] uppercase tracking-[0.15em] text-marfil/70 transition-colors hover:text-marfil"
                  >
                    {item.etiqueta}
                    <span
                      aria-hidden
                      className={`absolute -bottom-0.5 left-0 h-px bg-oro transition-[width] duration-400 ease-[var(--ease-suave)] ${
                        activo ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#reservas"
            onClick={() => medir("reserva_click", { origen: "header" })}
            className="hidden items-center border border-oro/45 px-5 py-2.5 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-oro transition-colors duration-300 hover:bg-oro hover:text-carbon sm:inline-flex"
          >
            {textos.hero.ctaPrimario}
          </a>
          <NavegacionMovil seccionActiva={seccionActiva} />
        </div>
      </div>
    </header>
  );
}
