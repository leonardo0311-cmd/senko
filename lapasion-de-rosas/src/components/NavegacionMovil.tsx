"use client";

import { useEffect, useRef, useState } from "react";
import { navegacion, textos } from "@content/site";
import { Separador } from "./ui/MarcaRosa";
import { medir } from "@/lib/analitica";

/**
 * Menú de pantalla completa para celulares y tablets.
 * Atrapa el foco mientras está abierto y se cierra con Escape.
 */
export function NavegacionMovil({ seccionActiva }: { seccionActiva: string }) {
  const [abierto, setAbierto] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        disparador.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;

      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alTeclado);
    panel.current?.querySelector<HTMLElement>("a")?.focus();

    return () => {
      document.body.style.overflow = previo;
      document.removeEventListener("keydown", alTeclado);
    };
  }, [abierto]);

  return (
    <>
      <button
        ref={disparador}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        className="relative z-[61] -mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
      >
        <span className="sr-only">{abierto ? "Cerrar menú" : "Abrir menú"}</span>
        <span
          aria-hidden
          className={`block h-px w-6 bg-marfil transition-transform duration-300 ease-[var(--ease-suave)] ${
            abierto ? "translate-y-[3px] rotate-45" : ""
          }`}
        />
        <span
          aria-hidden
          className={`block h-px w-6 bg-marfil transition-transform duration-300 ease-[var(--ease-suave)] ${
            abierto ? "-translate-y-[3px] -rotate-45" : ""
          }`}
        />
      </button>

      <div
        id="menu-movil"
        ref={panel}
        role="dialog"
        aria-modal={abierto}
        aria-label="Menú de navegación"
        inert={!abierto}
        className={`fixed inset-0 z-[60] flex flex-col bg-carbon transition-[opacity,visibility] duration-400 ease-[var(--ease-suave)] lg:hidden ${
          abierto ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(70% 55% at 85% 100%, rgba(80,29,44,0.5) 0%, transparent 65%)",
          }}
        />

        <nav
          aria-label="Navegación principal (móvil)"
          className="relative flex flex-1 flex-col justify-center px-[var(--marco)] pb-10 pt-[var(--alto-header)]"
        >
          <ul className="flex flex-col gap-1">
            {navegacion.map((item, i) => (
              <li
                key={item.id}
                style={{ transitionDelay: abierto ? `${120 + i * 55}ms` : "0ms" }}
                className={`transition-[opacity,transform] duration-500 ease-[var(--ease-suave)] motion-reduce:transition-none ${
                  abierto ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                }`}
              >
                <a
                  href={`#${item.id}`}
                  onClick={() => setAbierto(false)}
                  aria-current={seccionActiva === item.id ? "true" : undefined}
                  className="flex items-baseline gap-4 border-b border-[var(--borde-tenue)] py-4 font-serif text-[clamp(1.9rem,8vw,2.75rem)] font-light leading-tight text-marfil transition-colors hover:text-oro"
                >
                  <span className="font-sans text-[0.625rem] tracking-[0.2em] text-oro/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.etiqueta}
                </a>
              </li>
            ))}
          </ul>

          <Separador className="my-8" />

          <a
            href="#reservas"
            onClick={() => {
              setAbierto(false);
              medir("reserva_click", { origen: "menu_movil" });
            }}
            className={`inline-flex items-center justify-center bg-oro px-7 py-4 font-sans text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-carbon transition-[opacity,transform] duration-500 ease-[var(--ease-suave)] motion-reduce:transition-none ${
              abierto ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: abierto ? "460ms" : "0ms" }}
          >
            {textos.hero.ctaPrimario}
          </a>
        </nav>
      </div>
    </>
  );
}
