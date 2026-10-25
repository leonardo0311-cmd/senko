"use client";

import { useActionState } from "react";
import { accionIngresar } from "./acciones";
import { Aviso, Campo, estiloBoton } from "@/components/ui";

export default function FormularioLogin() {
  const [estado, accion, pendiente] = useActionState(accionIngresar, null);

  return (
    <form action={accion} className="space-y-4">
      {estado?.error && <Aviso>{estado.error}</Aviso>}

      <Campo etiqueta="Email">
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="vos@negocio.com"
        />
      </Campo>

      <Campo etiqueta="Contraseña">
        <input name="password" type="password" autoComplete="current-password" required />
      </Campo>

      <button type="submit" disabled={pendiente} className={`${estiloBoton()} w-full`}>
        {pendiente ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
