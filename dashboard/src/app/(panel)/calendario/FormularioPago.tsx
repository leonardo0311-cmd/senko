"use client";

import { useActionState, useState } from "react";
import { accionRegistrarPago } from "./acciones";
import { Aviso, Campo, estiloBoton } from "@/components/ui";
import { aPesos, plata, porcentaje } from "@/lib/dinero";
import type { MetodoPago, MetodoPagoClave } from "@/lib/types";

/**
 * El monto se ingresa SIEMPRE a precio general. El recargo o descuento del
 * metodo se muestra en vivo y lo vuelve a calcular el servidor al guardar, asi
 * el panel y el bot nunca pueden discrepar.
 */
export default function FormularioPago({
  turnoId,
  metodos,
  restante,
  senaSugerida,
}: {
  turnoId: string;
  metodos: MetodoPago[];
  restante: number;
  senaSugerida: number;
}) {
  const [estado, accion, pendiente] = useActionState(accionRegistrarPago, null);
  const activos = metodos.filter((m) => m.activo);
  const [metodo, setMetodo] = useState<MetodoPagoClave>(activos[0]?.clave ?? "efectivo");
  const [monto, setMonto] = useState<string>(
    String(aPesos(Math.min(senaSugerida > 0 ? senaSugerida : restante, restante))),
  );

  const ajustePct = activos.find((m) => m.clave === metodo)?.ajustePct ?? 0;
  const base = Math.round(Number(monto.replace(",", ".")) * 100) || 0;
  const ajuste = Math.round((base * ajustePct) / 100);

  if (restante <= 0) {
    return (
      <p className="rounded-lg border border-ok/30 bg-ok-fondo px-3 py-2 text-sm font-medium text-ok">
        Este turno ya está pago por completo.
      </p>
    );
  }

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="turnoId" value={turnoId} />

      {estado?.error && <Aviso>{estado.error}</Aviso>}
      {estado?.ok && <Aviso tono="ok">{estado.ok}</Aviso>}

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Concepto">
          <select name="tipo" defaultValue={senaSugerida > 0 ? "sena" : "saldo"}>
            <option value="sena">Seña</option>
            <option value="saldo">Saldo</option>
            <option value="total">Pago total</option>
          </select>
        </Campo>

        <Campo etiqueta="Método">
          <select
            name="metodo"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value as MetodoPagoClave)}
          >
            {activos.map((m) => (
              <option key={m.clave} value={m.clave}>
                {m.etiqueta} ({porcentaje(m.ajustePct)})
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo
        etiqueta="Monto a precio general"
        ayuda={`Falta ${plata(restante)} a precio general.${
          senaSugerida > 0 ? ` Seña del servicio: ${plata(senaSugerida)}.` : ""
        }`}
      >
        <input
          name="monto"
          type="number"
          step="0.01"
          min="0"
          max={aPesos(restante)}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />
      </Campo>

      <div className="rounded-lg border border-borde bg-superficie-2 px-3 py-2 text-sm">
        <div className="flex justify-between text-tinta-2">
          <span>Precio general</span>
          <span className="tabular">{plata(base)}</span>
        </div>
        <div className="flex justify-between text-tinta-2">
          <span>
            Ajuste {porcentaje(ajustePct)}
          </span>
          <span className={`tabular ${ajuste > 0 ? "text-ok" : ajuste < 0 ? "text-aviso" : ""}`}>
            {ajuste > 0 ? "+" : ""}
            {plata(ajuste)}
          </span>
        </div>
        <div className="mt-1 flex justify-between border-t border-borde pt-1 font-semibold text-tinta-1">
          <span>Cobra</span>
          <span className="tabular">{plata(base + ajuste)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Estado">
          <select name="estado" defaultValue="confirmado">
            <option value="confirmado">Acreditado</option>
            <option value="pendiente">Por acreditar</option>
          </select>
        </Campo>
        <Campo etiqueta="Referencia">
          <input name="referencia" placeholder="Nº de operación" />
        </Campo>
      </div>

      <button type="submit" disabled={pendiente} className={`${estiloBoton()} w-full`}>
        {pendiente ? "Guardando…" : "Registrar pago"}
      </button>
    </form>
  );
}
