"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { filtrosGaleria, galeria, type CategoriaGaleria } from "@content/galeria";
import { medios } from "@content/medios";
import { textos } from "@content/site";
import { Medio } from "./ui/Medio";
import { Revelar } from "./ui/Revelar";
import { EncabezadoSeccion } from "./ui/EncabezadoSeccion";

/**
 * Galería editorial con visor ampliado.
 *
 * El visor se maneja por completo con el teclado (flechas, Escape, Tab
 * atrapado dentro del diálogo) y devuelve el foco al elemento que lo abrió.
 */
export function Galeria() {
  const [filtro, setFiltro] = useState<CategoriaGaleria>("todo");
  const [abierto, setAbierto] = useState<number | null>(null);
  const origenFoco = useRef<HTMLElement | null>(null);

  const visibles = galeria.filter((g) => filtro === "todo" || g.categoria === filtro);
  const t = textos.galeria;

  const abrir = (indice: number, disparador: HTMLElement) => {
    origenFoco.current = disparador;
    setAbierto(indice);
  };

  const cerrar = useCallback(() => {
    setAbierto(null);
    origenFoco.current?.focus();
  }, []);

  const navegar = useCallback(
    (paso: number) => {
      setAbierto((actual) => {
        if (actual === null) return null;
        return (actual + paso + visibles.length) % visibles.length;
      });
    },
    [visibles.length],
  );

  return (
    <section id="galeria" className="seccion relative" aria-labelledby="galeria-titulo">
      <div className="marco">
        <EncabezadoSeccion
          tituloId="galeria-titulo"
          indice={t.indice}
          etiqueta={t.etiqueta}
          titulo={t.titulo}
          enfasis={t.tituloEnfasis}
          centrado
        />

        {/* --- Filtros --------------------------------------------------- */}
        <Revelar className="mt-12 flex flex-wrap justify-center gap-2.5" retraso={100}>
          {filtrosGaleria.map((f) => {
            const activo = filtro === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                aria-pressed={activo}
                className={`border px-4 py-2 font-sans text-[0.7rem] uppercase tracking-[0.14em] transition-colors duration-300 ${
                  activo
                    ? "border-oro bg-oro text-carbon"
                    : "border-[var(--borde-sutil)] text-marfil/65 hover:border-oro/50 hover:text-marfil"
                }`}
              >
                {f.etiqueta}
              </button>
            );
          })}
        </Revelar>

        {/* --- Mosaico ---------------------------------------------------- */}
        <ul className="mt-12 grid grid-flow-row-dense grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {visibles.map((item, i) => (
            <Revelar
              como="li"
              key={`${item.medio}-${filtro}`}
              retraso={(i % 6) * 70}
              className={i % 5 === 0 ? "lg:row-span-2" : ""}
            >
              <button
                type="button"
                onClick={(e) => abrir(i, e.currentTarget)}
                className="group relative block w-full overflow-hidden"
              >
                <span className="sr-only">Ampliar: {medios[item.medio].alt}</span>
                <span className="block transition-transform duration-[800ms] ease-[var(--ease-suave)] group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                  <Medio
                    clave={item.medio}
                    ratio={i % 5 === 0 ? "3/4" : "1/1"}
                    sizes="(min-width: 1024px) 32vw, 50vw"
                    compacto
                    className="w-full"
                  />
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-carbon/0 transition-colors duration-500 group-hover:bg-carbon/25"
                />
              </button>
            </Revelar>
          ))}
        </ul>
      </div>

      {abierto !== null && visibles[abierto] && (
        <Visor
          clave={visibles[abierto].medio}
          posicion={abierto + 1}
          total={visibles.length}
          onCerrar={cerrar}
          onNavegar={navegar}
        />
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Visor({
  clave,
  posicion,
  total,
  onCerrar,
  onNavegar,
}: {
  clave: keyof typeof medios;
  posicion: number;
  total: number;
  onCerrar: () => void;
  onNavegar: (paso: number) => void;
}) {
  const dialogo = useRef<HTMLDivElement>(null);
  const m = medios[clave];

  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCerrar();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavegar(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavegar(-1);
      } else if (e.key === "Tab" && dialogo.current) {
        const foco = dialogo.current.querySelectorAll<HTMLElement>("button");
        if (foco.length === 0) return;
        const primero = foco[0];
        const ultimo = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };

    document.addEventListener("keydown", alTeclado);
    dialogo.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.body.style.overflow = previo;
      document.removeEventListener("keydown", alTeclado);
    };
  }, [onCerrar, onNavegar]);

  return (
    <div
      ref={dialogo}
      role="dialog"
      aria-modal="true"
      aria-label={`Imagen ${posicion} de ${total}`}
      className="fixed inset-0 z-[80] flex flex-col bg-carbon/97 backdrop-blur-sm animate-[visor-aparece_0.3s_var(--ease-suave)_both]"
    >
      {/* Fondo: cerrar al tocar fuera de la imagen */}
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar la vista ampliada"
        className="absolute inset-0 cursor-zoom-out"
        tabIndex={-1}
      />

      <div className="marco relative flex items-center justify-between py-5">
        <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-marfil/60 tabular-nums">
          {String(posicion).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onCerrar}
          className="flex h-11 w-11 items-center justify-center text-marfil transition-colors hover:text-oro"
        >
          <span className="sr-only">Cerrar</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
        <figure className="max-h-full">
          {/* Respeta la proporción original de la imagen */}
          <Medio clave={clave} sizes="92vw" className="max-h-[72vh] w-auto" />
          <figcaption className="mt-4 text-center text-sm text-marfil-tenue">{m.alt}</figcaption>
        </figure>
      </div>

      <div className="marco relative flex items-center justify-center gap-3 pb-7">
        <Flecha direccion="anterior" onClick={() => onNavegar(-1)} />
        <Flecha direccion="siguiente" onClick={() => onNavegar(1)} />
      </div>

      <style>{`
        @keyframes visor-aparece {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Flecha({ direccion, onClick }: { direccion: "anterior" | "siguiente"; onClick: () => void }) {
  const anterior = direccion === "anterior";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center border border-[var(--borde-sutil)] text-marfil transition-colors hover:border-oro hover:text-oro"
    >
      <span className="sr-only">{anterior ? "Imagen anterior" : "Imagen siguiente"}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d={anterior ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
