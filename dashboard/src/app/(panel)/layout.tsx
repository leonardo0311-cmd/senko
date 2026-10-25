import Link from "next/link";
import { exigirSesion } from "@/lib/auth";
import { contarSinLeer } from "@/lib/repo/avisos";
import { obtenerAjuste } from "@/lib/repo/config";
import Nav, { type ItemNav } from "@/components/Nav";
import TemaToggle from "@/components/TemaToggle";
import { accionSalir } from "./acciones";

const ITEMS_DUENO: ItemNav[] = [
  { href: "/", etiqueta: "Resumen", icono: "◉" },
  { href: "/calendario", etiqueta: "Calendario", icono: "▦" },
  { href: "/clientes", etiqueta: "Clientes y gastos", icono: "◎" },
  { href: "/senas", etiqueta: "Señas", icono: "◈" },
  { href: "/pagos", etiqueta: "Pagos", icono: "≡" },
  { href: "/notificaciones", etiqueta: "Avisos", icono: "◔" },
  { href: "/usuarios", etiqueta: "Usuarios", icono: "◍" },
  { href: "/configuracion", etiqueta: "Configuración", icono: "⚙" },
];

const ITEMS_PROFESIONAL: ItemNav[] = [
  { href: "/calendario", etiqueta: "Mi calendario", icono: "▦" },
  { href: "/senas", etiqueta: "Señas", icono: "◈" },
  { href: "/notificaciones", etiqueta: "Avisos", icono: "◔" },
];

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const usuario = await exigirSesion();
  const negocio = obtenerAjuste("negocio_nombre");
  const sinLeer = contarSinLeer(usuario.id);
  const items = (usuario.rol === "dueno" ? ITEMS_DUENO : ITEMS_PROFESIONAL).map((item) =>
    item.href === "/notificaciones" && sinLeer > 0
      ? { ...item, insignia: sinLeer > 99 ? "99+" : String(sinLeer) }
      : item,
  );

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="border-b border-borde bg-superficie-1 p-3 lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 lg:p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-acento text-sm font-bold text-white">
              S
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-tinta-1">{negocio}</p>
              <p className="text-[0.7rem] text-tinta-3">Panel de turnos</p>
            </div>
          </div>
          <TemaToggle />
        </div>

        <Nav items={items} />

        <div className="mt-4 border-t border-borde pt-3 lg:mt-6">
          <p className="truncate text-sm font-medium text-tinta-1">{usuario.nombre}</p>
          <p className="mb-2 text-[0.7rem] text-tinta-3">
            {usuario.rol === "dueno" ? "Dueño · acceso total" : "Profesional"}
          </p>
          <form action={accionSalir}>
            <button
              type="submit"
              className="cursor-pointer text-xs font-semibold text-tinta-3 underline-offset-2 hover:text-grave hover:underline"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
