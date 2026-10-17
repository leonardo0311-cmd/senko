"use client";

import { useEffect, useState } from "react";
import { marca, textos } from "@content/site";
import { Logotipo } from "./ui/Logotipo";
import { prefiereMenosMovimiento } from "@/lib/motion";

const CLAVE_SESION = "lpdr:intro-vista";
const DURACION = 1600;

/**
 * Introducción breve: logotipo, un filete dorado y una línea de texto.
 *
 * Reglas que respeta:
 *  - No se repite: una vez por sesión del navegador.
 *  - No bloquea: si la conexión es lenta o el visitante pide menos movimiento,
 *    no aparece y se va directo al contenido.
 *  - No atrapa el foco ni oculta la página de los lectores de pantalla:
 *    el contenido real ya está montado debajo.
 */
export function Preloader() {
  const [estado, setEstado] = useState<"oculto" | "visible" | "saliendo">("oculto");

  useEffect(() => {
    if (prefiereMenosMovimiento()) return;
    if (sessionStorage.getItem(CLAVE_SESION)) return;

    // En conexiones lentas o con ahorro de datos, priorizar el contenido.
    const conexion = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (conexion?.saveData) return;
    if (conexion?.effectiveType && /2g/.test(conexion.effectiveType)) return;

    sessionStorage.setItem(CLAVE_SESION, "1");
    setEstado("visible");

    const salida = window.setTimeout(() => setEstado("saliendo"), DURACION);
    const fin = window.setTimeout(() => setEstado("oculto"), DURACION + 900);

    return () => {
      window.clearTimeout(salida);
      window.clearTimeout(fin);
    };
  }, []);

  useEffect(() => {
    if (estado === "oculto") return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = estado === "visible" ? "hidden" : previo;
    return () => {
      document.body.style.overflow = previo;
    };
  }, [estado]);

  if (estado === "oculto") return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[90] grid place-items-center bg-carbon transition-[opacity,clip-path] duration-[900ms] ease-[var(--ease-editorial)] ${
        estado === "saliendo" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={
        estado === "saliendo"
          ? { clipPath: "inset(0 0 100% 0)" }
          : { clipPath: "inset(0 0 0 0)" }
      }
    >
      <div className="flex flex-col items-center gap-6 px-6">
        <div className="animate-[intro-logo_1.1s_var(--ease-suave)_both]">
          <Logotipo className="h-auto w-[min(17rem,70vw)] text-marfil" />
        </div>

        {/* Luz que recorre el filete */}
        <div className="relative h-px w-[min(14rem,56vw)] overflow-hidden bg-oro/20">
          <span className="absolute inset-y-0 w-1/3 animate-[intro-luz_1.5s_var(--ease-suave)_both] bg-gradient-to-r from-transparent via-oro to-transparent" />
        </div>

        <p className="animate-[intro-texto_1.2s_var(--ease-suave)_0.35s_both] font-sans text-[0.6875rem] uppercase tracking-[0.3em] text-marfil/60">
          {textos.preloader.linea}
        </p>
        <span className="sr-only">Cargando {marca.nombre}</span>
      </div>

      <style>{`
        @keyframes intro-logo {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes intro-luz {
          from { transform: translateX(-120%); }
          to   { transform: translateX(380%); }
        }
        @keyframes intro-texto {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
