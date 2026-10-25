"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type ItemNav = { href: string; etiqueta: string; icono: string };

export default function Nav({ items }: { items: ItemNav[] }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  const activo = (href: string) =>
    href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg border border-borde-fuerte bg-superficie-2 px-3 py-2 text-sm font-semibold text-tinta-1 lg:hidden"
      >
        <span>
          {items.find((i) => activo(i.href))?.etiqueta ?? "Menú"}
        </span>
        <span aria-hidden className="text-tinta-3">{abierto ? "▲" : "▼"}</span>
      </button>

      <nav
        aria-label="Secciones"
        className={`${abierto ? "block" : "hidden"} space-y-0.5 lg:block`}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setAbierto(false)}
            aria-current={activo(item.href) ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activo(item.href)
                ? "bg-acento-suave text-acento"
                : "text-tinta-2 hover:bg-superficie-2 hover:text-tinta-1"
            }`}
          >
            <span aria-hidden className="w-4 text-center text-base leading-none">
              {item.icono}
            </span>
            {item.etiqueta}
          </Link>
        ))}
      </nav>
    </>
  );
}
