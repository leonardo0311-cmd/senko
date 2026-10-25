"use client";

import { useActionState, useState } from "react";
import { accionCrearUsuario } from "./acciones";
import { Aviso, Campo, estiloBoton } from "@/components/ui";

export default function FormularioUsuario() {
  const [estado, accion, pendiente] = useActionState(accionCrearUsuario, null);
  const [abierto, setAbierto] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={`${estiloBoton(abierto ? "secundario" : "primario")} w-full`}
        aria-expanded={abierto}
      >
        {abierto ? "Cerrar" : "+ Nuevo profesional"}
      </button>

      {abierto && (
        <form action={accion} className="mt-4 space-y-3">
          {estado?.error && <Aviso>{estado.error}</Aviso>}
          {estado?.ok && <Aviso tono="ok">{estado.ok}</Aviso>}

          <Campo etiqueta="Nombre">
            <input name="nombre" required placeholder="Nombre y apellido" />
          </Campo>

          <Campo
            etiqueta="Ocupación"
            ayuda="Qué hace: peluquera, colorista, manicura, masajista…"
          >
            <input name="ocupacion" maxLength={60} placeholder="Colorista" />
          </Campo>

          <Campo etiqueta="Email" ayuda="Con este email entra al panel.">
            <input name="email" type="email" required placeholder="nombre@negocio.com" />
          </Campo>

          <Campo
            etiqueta="Contraseña inicial"
            ayuda="Mínimo 8 caracteres. Pasásela por privado; después se la puede cambiar."
          >
            <input name="password" type="text" required minLength={8} />
          </Campo>

          <Campo etiqueta="Teléfono">
            <input name="telefono" placeholder="Opcional" />
          </Campo>

          <Campo
            etiqueta="Rol"
            ayuda="El profesional ve su calendario, comenta y avisa demoras. El dueño ve y maneja todo."
          >
            <select name="rol" defaultValue="profesional">
              <option value="profesional">Profesional</option>
              <option value="dueno">Dueño</option>
            </select>
          </Campo>

          <button type="submit" disabled={pendiente} className={`${estiloBoton()} w-full`}>
            {pendiente ? "Creando…" : "Crear usuario"}
          </button>
        </form>
      )}
    </div>
  );
}
