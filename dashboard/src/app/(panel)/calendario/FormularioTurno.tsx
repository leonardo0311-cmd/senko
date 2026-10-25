"use client";

import { useActionState, useState } from "react";
import { accionCrearTurno } from "./acciones";
import { Aviso, Campo, estiloBoton } from "@/components/ui";
import { plata } from "@/lib/dinero";
import { calcularSena } from "@/lib/precios";
import type { Servicio, Usuario } from "@/lib/types";

export default function FormularioTurno({
  profesionales,
  servicios,
  esDueno,
  fechaSugerida,
}: {
  profesionales: Usuario[];
  servicios: Servicio[];
  esDueno: boolean;
  fechaSugerida: string;
}) {
  const [estado, accion, pendiente] = useActionState(accionCrearTurno, null);
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? "");
  const [abierto, setAbierto] = useState(false);

  const servicio = servicios.find((s) => s.id === servicioId);

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={`${estiloBoton(abierto ? "secundario" : "primario")} w-full`}
        aria-expanded={abierto}
      >
        {abierto ? "Cerrar" : "+ Nuevo turno"}
      </button>

      {abierto && (
        <form action={accion} className="mt-4 space-y-3">
          {estado?.error && <Aviso>{estado.error}</Aviso>}
          {estado?.ok && <Aviso tono="ok">{estado.ok}</Aviso>}

          <Campo etiqueta="Cliente">
            <input name="clienteNombre" required placeholder="Nombre y apellido" />
          </Campo>

          <Campo
            etiqueta="WhatsApp"
            ayuda="Si el número ya existe se usa ese cliente; si no, se crea."
          >
            <input name="clienteTelefono" required placeholder="+54 9 11 ..." />
          </Campo>

          {esDueno && (
            <Campo etiqueta="Profesional">
              <select name="profesionalId" required defaultValue={profesionales[0]?.id ?? ""}>
                {profesionales.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Campo>
          )}

          <Campo etiqueta="Servicio">
            <select
              name="servicioId"
              required
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · {plata(s.precioBase)} · {s.duracionMin} min
                </option>
              ))}
            </select>
          </Campo>

          {servicio && (
            <p className="rounded-lg border border-borde bg-superficie-2 px-3 py-2 text-xs leading-relaxed text-tinta-2">
              Precio general <strong className="text-tinta-1">{plata(servicio.precioBase)}</strong>
              {" · "}
              seña{" "}
              <strong className="text-tinta-1">{plata(calcularSena(servicio))}</strong>
              {servicio.senaTipo === "porcentaje" ? ` (${servicio.senaValor}%)` : " (monto fijo)"}
              {" · "}
              dura {servicio.duracionMin} min
            </p>
          )}

          <Campo etiqueta="Día y hora">
            <input name="inicio" type="datetime-local" required defaultValue={fechaSugerida} />
          </Campo>

          <Campo etiqueta="Estado">
            <select name="estado" defaultValue="confirmado">
              <option value="confirmado">Confirmado</option>
              <option value="pendiente">Pendiente (falta la seña)</option>
            </select>
          </Campo>

          <Campo etiqueta="Notas">
            <textarea name="notas" rows={2} placeholder="Opcional" />
          </Campo>

          <button type="submit" disabled={pendiente} className={`${estiloBoton()} w-full`}>
            {pendiente ? "Creando…" : "Crear turno"}
          </button>
        </form>
      )}
    </div>
  );
}
