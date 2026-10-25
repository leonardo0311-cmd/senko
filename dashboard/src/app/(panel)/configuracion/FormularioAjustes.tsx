"use client";

import { useActionState } from "react";
import { accionGuardarAjustes } from "./acciones";
import { Aviso, Campo, estiloBoton } from "@/components/ui";
import type { ClaveAjuste } from "@/lib/repo/config";

export default function FormularioAjustes({
  ajustes,
}: {
  ajustes: Record<ClaveAjuste, string>;
}) {
  const [estado, accion, pendiente] = useActionState(accionGuardarAjustes, null);

  return (
    <form action={accion} className="space-y-3">
      {estado?.error && <Aviso>{estado.error}</Aviso>}
      {estado?.ok && <Aviso tono="ok">{estado.ok}</Aviso>}

      <Campo etiqueta="Nombre del negocio">
        <input name="negocio_nombre" defaultValue={ajustes.negocio_nombre} required />
      </Campo>

      <Campo etiqueta="Alias de transferencia" ayuda="El bot se lo manda al cliente para que señe.">
        <input name="transferencia_alias" defaultValue={ajustes.transferencia_alias} placeholder="mi.negocio.mp" />
      </Campo>

      <Campo etiqueta="CBU / CVU">
        <input name="transferencia_cbu" defaultValue={ajustes.transferencia_cbu} placeholder="Opcional" />
      </Campo>

      <Campo etiqueta="Titular de la cuenta">
        <input name="transferencia_titular" defaultValue={ajustes.transferencia_titular} placeholder="Opcional" />
      </Campo>

      <Campo
        etiqueta="La seña vence en (horas)"
        ayuda="Si no seña en ese plazo, el turno queda libre para otro cliente."
      >
        <input
          name="sena_horas_vencimiento"
          type="number"
          min="1"
          max="720"
          defaultValue={ajustes.sena_horas_vencimiento}
          required
        />
      </Campo>

      <button type="submit" disabled={pendiente} className={`${estiloBoton()} w-full`}>
        {pendiente ? "Guardando…" : "Guardar datos del negocio"}
      </button>
    </form>
  );
}
