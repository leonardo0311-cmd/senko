"use client";

import { useActionState, useState } from "react";
import { accionGuardarServicio } from "./acciones";
import { Aviso, Campo, estiloBoton } from "@/components/ui";
import { aPesos, plata } from "@/lib/dinero";
import { calcularSena } from "@/lib/precios";
import type { Servicio } from "@/lib/types";

export default function FormularioServicio({ servicio }: { servicio?: Servicio }) {
  const [estado, accion, pendiente] = useActionState(accionGuardarServicio, null);
  const esNuevo = !servicio;

  const [precio, setPrecio] = useState(String(servicio ? aPesos(servicio.precioBase) : ""));
  const [senaTipo, setSenaTipo] = useState<"porcentaje" | "fijo">(
    servicio?.senaTipo ?? "porcentaje",
  );
  const [senaValor, setSenaValor] = useState(
    String(
      servicio
        ? servicio.senaTipo === "porcentaje"
          ? servicio.senaValor
          : aPesos(servicio.senaValor)
        : 30,
    ),
  );

  const precioBase = Math.round(Number(precio.replace(",", ".")) * 100) || 0;
  const valorNumero = Number(senaValor.replace(",", ".")) || 0;
  const senaCalculada = calcularSena({
    precioBase,
    senaTipo,
    senaValor: senaTipo === "porcentaje" ? valorNumero : Math.round(valorNumero * 100),
  });

  return (
    <form action={accion} className="space-y-3">
      {servicio && <input type="hidden" name="servicioId" value={servicio.id} />}
      {estado?.error && <Aviso>{estado.error}</Aviso>}
      {estado?.ok && <Aviso tono="ok">{estado.ok}</Aviso>}

      <Campo etiqueta="Nombre del servicio">
        <input name="nombre" defaultValue={servicio?.nombre} required placeholder="Corte y peinado" />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Precio general" ayuda="Sin recargos ni descuentos.">
          <input
            name="precio"
            type="number"
            step="1"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </Campo>
        <Campo etiqueta="Duración (min)">
          <input
            name="duracion"
            type="number"
            step="5"
            min="5"
            max="600"
            defaultValue={servicio?.duracionMin ?? 60}
            required
          />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Seña">
          <select
            name="senaTipo"
            value={senaTipo}
            onChange={(e) => setSenaTipo(e.target.value as "porcentaje" | "fijo")}
          >
            <option value="porcentaje">Porcentaje del precio</option>
            <option value="fijo">Monto fijo</option>
          </select>
        </Campo>
        <Campo etiqueta={senaTipo === "porcentaje" ? "Porcentaje" : "Monto"}>
          <input
            name="senaValor"
            type="number"
            step={senaTipo === "porcentaje" ? "1" : "1"}
            min="0"
            max={senaTipo === "porcentaje" ? 100 : undefined}
            value={senaValor}
            onChange={(e) => setSenaValor(e.target.value)}
            required
          />
        </Campo>
      </div>

      <p className="rounded-lg border border-borde bg-superficie-2 px-3 py-2 text-xs leading-relaxed text-tinta-2">
        El bot le va a pedir una seña de{" "}
        <strong className="text-tinta-1">{plata(senaCalculada)}</strong> para reservar, y el saldo
        queda en <strong className="text-tinta-1">{plata(Math.max(precioBase - senaCalculada, 0))}</strong>{" "}
        a precio general. Al cobrarlos se les aplica el ajuste del método que use el cliente.
      </p>

      {servicio && (
        <label
          className="flex cursor-pointer items-center gap-2 text-xs font-semibold normal-case tracking-normal text-tinta-2"
          style={{ marginBottom: 0 }}
        >
          <input type="checkbox" name="activo" defaultChecked={servicio.activo} />
          Activo (el bot lo ofrece)
        </label>
      )}

      <button type="submit" disabled={pendiente} className={`${estiloBoton()} w-full`}>
        {pendiente ? "Guardando…" : esNuevo ? "Agregar servicio" : "Guardar cambios"}
      </button>
    </form>
  );
}
