"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERIODOS, type Periodo } from "@/lib/fechas";

export default function SelectorPeriodo({ actual }: { actual: Periodo }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  function elegir(periodo: Periodo) {
    const siguientes = new URLSearchParams(params.toString());
    siguientes.set("periodo", periodo);
    router.push(`${ruta}?${siguientes.toString()}`);
  }

  return (
    <div
      role="group"
      aria-label="Período"
      className="flex flex-wrap gap-1 rounded-lg border border-borde bg-superficie-1 p-1"
    >
      {PERIODOS.map((p) => (
        <button
          key={p.clave}
          type="button"
          onClick={() => elegir(p.clave)}
          aria-pressed={actual === p.clave}
          className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            actual === p.clave
              ? "bg-acento text-white"
              : "text-tinta-2 hover:bg-superficie-2 hover:text-tinta-1"
          }`}
        >
          {p.etiqueta}
        </button>
      ))}
    </div>
  );
}
