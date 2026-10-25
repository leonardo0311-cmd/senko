import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { obtenerAjuste } from "@/lib/repo/config";
import FormularioLogin from "./FormularioLogin";

export const metadata = { title: "Ingresar · Senko" };

export default async function PaginaLogin() {
  const usuario = await usuarioActual();
  if (usuario) redirect(usuario.rol === "dueno" ? "/" : "/calendario");

  const negocio = obtenerAjuste("negocio_nombre");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-superficie-0 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-acento text-lg font-bold text-white">
            S
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-tinta-1">{negocio}</h1>
          <p className="mt-1 text-sm text-tinta-3">Panel de turnos y cobros</p>
        </div>

        <div className="rounded-xl border border-borde bg-superficie-1 p-5 shadow-xs">
          <FormularioLogin />
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-tinta-3">
          Si no tenés usuario, pedíselo al dueño del negocio.
        </p>
      </div>
    </main>
  );
}
