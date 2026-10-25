"use client";

import { useActionState, useState } from "react";
import { accionGuardarMetodos } from "./acciones";
import { Aviso, Campo, estiloBoton } from "@/components/ui";
import { plata, porcentaje } from "@/lib/dinero";
import { calcularCobro } from "@/lib/precios";
import { METODOS_ORDEN, type MetodoPago, type MetodoPagoClave } from "@/lib/types";
import { COLOR_METODO } from "@/components/graficos";

/**
 * Los porcentajes del negocio. Se ve en vivo cuanto queda un servicio de
 * ejemplo con cada metodo, para no tener que hacer la cuenta a mano.
 */
export default function FormularioMetodos({
  metodos,
  precioEjemplo,
}: {
  metodos: MetodoPago[];
  precioEjemplo: number;
}) {
  const [estado, accion, pendiente] = useActionState(accionGuardarMetodos, null);

  const inicial = Object.fromEntries(
    metodos.map((m) => [m.clave, { ajuste: String(m.ajustePct), activo: m.activo }]),
  ) as Record<MetodoPagoClave, { ajuste: string; activo: boolean }>;

  const [valores, setValores] = useState(inicial);
  const [ejemplo, setEjemplo] = useState(String(Math.round(precioEjemplo / 100)));

  const baseEjemplo = Math.round(Number(ejemplo.replace(",", ".")) * 100) || 0;

  return (
    <form action={accion} className="space-y-4">
      {estado?.error && <Aviso>{estado.error}</Aviso>}
      {estado?.ok && <Aviso tono="ok">{estado.ok}</Aviso>}

      <div className="space-y-3">
        {METODOS_ORDEN.map((clave) => {
          const metodo = metodos.find((m) => m.clave === clave);
          if (!metodo) return null;
          const pct = Number(valores[clave]?.ajuste.replace(",", ".") ?? 0) || 0;
          const cobro = calcularCobro(baseEjemplo, pct);

          return (
            <div
              key={clave}
              className="rounded-lg border border-borde bg-superficie-2 p-3"
            >
              <div className="flex flex-wrap items-end gap-3">
                <span
                  aria-hidden
                  className="mb-2 size-3 shrink-0 rounded-sm"
                  style={{ background: COLOR_METODO[clave] }}
                />

                <Campo etiqueta="Nombre" className="min-w-[180px] flex-1">
                  <input
                    name={`etiqueta_${clave}`}
                    defaultValue={metodo.etiqueta}
                    required
                  />
                </Campo>

                <Campo
                  etiqueta="Ajuste %"
                  className="w-28"
                  ayuda={pct > 0 ? "recargo" : pct < 0 ? "descuento" : "sin ajuste"}
                >
                  <input
                    name={`ajuste_${clave}`}
                    type="number"
                    step="0.5"
                    min={-100}
                    max={100}
                    value={valores[clave]?.ajuste ?? "0"}
                    onChange={(e) =>
                      setValores((v) => ({
                        ...v,
                        [clave]: { ...v[clave], ajuste: e.target.value },
                      }))
                    }
                    required
                  />
                </Campo>

                <label
                  className="mb-2 flex cursor-pointer items-center gap-2 text-xs font-semibold normal-case tracking-normal text-tinta-2"
                  style={{ marginBottom: "0.5rem" }}
                >
                  <input
                    type="checkbox"
                    name={`activo_${clave}`}
                    defaultChecked={metodo.activo}
                    onChange={(e) =>
                      setValores((v) => ({
                        ...v,
                        [clave]: { ...v[clave], activo: e.target.checked },
                      }))
                    }
                  />
                  Activo
                </label>

                <div className="mb-1.5 ml-auto text-right">
                  <p className="text-[0.7rem] uppercase tracking-wide text-tinta-3">
                    Queda en
                  </p>
                  <p className="tabular text-base font-semibold text-tinta-1">
                    {plata(cobro.total)}
                  </p>
                  <p
                    className={`tabular text-[0.7rem] ${
                      cobro.ajusteMonto > 0
                        ? "text-ok"
                        : cobro.ajusteMonto < 0
                          ? "text-aviso"
                          : "text-tinta-3"
                    }`}
                  >
                    {cobro.ajusteMonto > 0 ? "+" : ""}
                    {plata(cobro.ajusteMonto)} · {porcentaje(pct)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-borde pt-3">
        <Campo
          etiqueta="Precio de prueba"
          className="w-40"
          ayuda="Solo para ver las cuentas. No se guarda."
        >
          <input
            type="number"
            step="1"
            min="0"
            value={ejemplo}
            onChange={(e) => setEjemplo(e.target.value)}
          />
        </Campo>

        <button type="submit" disabled={pendiente} className={estiloBoton()}>
          {pendiente ? "Guardando…" : "Guardar porcentajes"}
        </button>
      </div>

      <p className="text-xs leading-relaxed text-tinta-3">
        Los pagos ya registrados conservan el porcentaje con el que se cobraron, así que cambiar
        esto no reescribe el historial: se aplica a partir del próximo pago.
      </p>
    </form>
  );
}
