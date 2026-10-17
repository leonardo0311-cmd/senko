"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { I18N, tituloDocumento, type Idioma } from "@content/i18n";

type Ctx = {
  idioma: Idioma;
  cambiar: (i: Idioma) => void;
  /** Traduce una clave. Acepta reemplazos: t("results_found_many", { n: 4 }) */
  t: (clave: string, vars?: Record<string, string | number>) => string;
  /** Elige entre un par de campos según el idioma activo. */
  pick: <T>(es: T, en: T | undefined) => T;
};

const IdiomaCtx = createContext<Ctx | null>(null);

const CLAVE = "lpdr_lang";

export function ProveedorIdioma({ children }: { children: ReactNode }) {
  // Siempre arranca en español: así el HTML que se renderiza en el servidor
  // coincide con el primer render del cliente y Google indexa la versión ES.
  const [idioma, setIdioma] = useState<Idioma>("es");

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado === "es" || guardado === "en") setIdioma(guardado);
    } catch {
      /* navegación privada o almacenamiento bloqueado: seguimos en español */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = idioma === "en" ? "en" : "es-AR";
    document.title = tituloDocumento[idioma];
  }, [idioma]);

  const cambiar = useCallback((i: Idioma) => {
    setIdioma(i);
    try {
      localStorage.setItem(CLAVE, i);
    } catch {
      /* si no se puede guardar, el cambio vale igual para esta visita */
    }
  }, []);

  const valor = useMemo<Ctx>(() => {
    const t = (clave: string, vars?: Record<string, string | number>) => {
      let texto = I18N[idioma][clave] ?? I18N.es[clave] ?? clave;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          texto = texto.replaceAll(`{${k}}`, String(v));
        }
      }
      return texto;
    };
    const pick = <T,>(es: T, en: T | undefined): T => (idioma === "en" && en !== undefined ? en : es);
    return { idioma, cambiar, t, pick };
  }, [idioma, cambiar]);

  return <IdiomaCtx.Provider value={valor}>{children}</IdiomaCtx.Provider>;
}

export function useIdioma(): Ctx {
  const ctx = useContext(IdiomaCtx);
  if (!ctx) throw new Error("useIdioma debe usarse dentro de <ProveedorIdioma>");
  return ctx;
}
