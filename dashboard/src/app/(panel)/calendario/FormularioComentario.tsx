"use client";

import { useActionState, useRef, useState } from "react";
import {
  accionAvisarAusencia,
  accionAvisarDemora,
  accionComentar,
} from "./acciones";
import { Aviso, Campo, estiloBoton } from "@/components/ui";

const DEMORAS = [10, 15, 20, 30, 45, 60];

/**
 * Lo único que un profesional puede hacer sobre su turno: dejar un comentario
 * y avisarle al dueño que el cliente se retrasa o no vino.
 */
export default function FormularioComentario({
  turnoId,
  esDueno,
}: {
  turnoId: string;
  esDueno: boolean;
}) {
  const [coment, accionComent, comentando] = useActionState(accionComentar, null);
  const [demora, accionDemora, avisando] = useActionState(accionAvisarDemora, null);
  const [ausencia, accionAusente, avisandoAusencia] = useActionState(accionAvisarAusencia, null);

  const [minutos, setMinutos] = useState(15);
  const [abierto, setAbierto] = useState<"demora" | "ausencia" | null>(null);
  const campoTexto = useRef<HTMLTextAreaElement>(null);

  if (coment?.ok && campoTexto.current) campoTexto.current.value = "";

  return (
    <div className="space-y-4">
      <form action={accionComent} className="space-y-2">
        <input type="hidden" name="turnoId" value={turnoId} />
        {coment?.error && <Aviso>{coment.error}</Aviso>}
        {coment?.ok && <Aviso tono="ok">{coment.ok}</Aviso>}
        <Campo
          etiqueta="Comentario"
          ayuda={
            esDueno
              ? "Queda en el historial del turno."
              : "Queda en el turno y le llega al dueño como aviso."
          }
        >
          <textarea
            ref={campoTexto}
            name="texto"
            rows={2}
            required
            minLength={2}
            maxLength={600}
            placeholder="El cliente pidió cambiar el color…"
          />
        </Campo>
        <button type="submit" disabled={comentando} className={`${estiloBoton()} w-full`}>
          {comentando ? "Guardando…" : "Agregar comentario"}
        </button>
      </form>

      <div className="border-t border-borde pt-3">
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
          Avisarle al dueño
        </p>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setAbierto(abierto === "demora" ? null : "demora")}
            aria-expanded={abierto === "demora"}
            className={estiloBoton(abierto === "demora" ? "primario" : "secundario")}
          >
            ◷ Se retrasa
          </button>
          <button
            type="button"
            onClick={() => setAbierto(abierto === "ausencia" ? null : "ausencia")}
            aria-expanded={abierto === "ausencia"}
            className={estiloBoton(abierto === "ausencia" ? "primario" : "secundario")}
          >
            ✕ No vino
          </button>
        </div>

        {abierto === "demora" && (
          <form action={accionDemora} className="mt-3 space-y-2">
            <input type="hidden" name="turnoId" value={turnoId} />
            {demora?.error && <Aviso>{demora.error}</Aviso>}
            {demora?.ok && <Aviso tono="ok">{demora.ok}</Aviso>}

            <Campo etiqueta="Cuánto se retrasa">
              <div className="flex flex-wrap gap-1">
                {DEMORAS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutos(m)}
                    aria-pressed={minutos === m}
                    className={`tabular cursor-pointer rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                      minutos === m
                        ? "bg-acento text-white"
                        : "bg-superficie-2 text-tinta-2 hover:text-tinta-1"
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <input type="hidden" name="minutos" value={minutos} />
            </Campo>

            <Campo etiqueta="Nota (opcional)">
              <input name="nota" maxLength={400} placeholder="Avisó por WhatsApp" />
            </Campo>

            <button type="submit" disabled={avisando} className={`${estiloBoton()} w-full`}>
              {avisando ? "Avisando…" : `Avisar demora de ${minutos} min`}
            </button>
          </form>
        )}

        {abierto === "ausencia" && (
          <form action={accionAusente} className="mt-3 space-y-2">
            <input type="hidden" name="turnoId" value={turnoId} />
            {ausencia?.error && <Aviso>{ausencia.error}</Aviso>}
            {ausencia?.ok && <Aviso tono="ok">{ausencia.ok}</Aviso>}

            <Campo
              etiqueta="Nota (opcional)"
              ayuda="El turno no cambia de estado: eso lo decide el dueño."
            >
              <input name="nota" maxLength={400} placeholder="Esperé 20 minutos" />
            </Campo>

            <button
              type="submit"
              disabled={avisandoAusencia}
              className={`${estiloBoton("peligro")} w-full`}
            >
              {avisandoAusencia ? "Avisando…" : "Avisar que no vino"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
