import type { ReactNode } from "react";

export function Panel({
  titulo,
  descripcion,
  acciones,
  children,
  sinPadding = false,
}: {
  titulo?: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  children: ReactNode;
  sinPadding?: boolean;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-borde bg-superficie-1 shadow-xs">
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-borde px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {titulo && <h2 className="text-sm font-semibold text-tinta-1">{titulo}</h2>}
            {descripcion && (
              <p className="mt-0.5 text-xs leading-relaxed text-tinta-3">{descripcion}</p>
            )}
          </div>
          {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className={sinPadding ? "" : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

export function Kpi({
  etiqueta,
  valor,
  detalle,
  tono = "neutro",
  acento,
}: {
  etiqueta: string;
  valor: ReactNode;
  detalle?: ReactNode;
  tono?: "neutro" | "ok" | "aviso" | "grave";
  acento?: string;
}) {
  const colorValor =
    tono === "ok"
      ? "text-ok"
      : tono === "aviso"
        ? "text-aviso"
        : tono === "grave"
          ? "text-grave"
          : "text-tinta-1";
  return (
    <div className="relative overflow-hidden rounded-xl border border-borde bg-superficie-1 p-4 shadow-xs">
      {acento && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: acento }}
        />
      )}
      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-tinta-3">
        {etiqueta}
      </p>
      <p className={`tabular mt-1.5 text-2xl font-semibold tracking-tight ${colorValor}`}>
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs leading-relaxed text-tinta-3">{detalle}</p>}
    </div>
  );
}

const TONOS_CHIP: Record<string, string> = {
  neutro: "bg-neutro-fondo text-tinta-2",
  ok: "bg-ok-fondo text-ok",
  aviso: "bg-aviso-fondo text-aviso",
  grave: "bg-grave-fondo text-grave",
  acento: "bg-acento-suave text-acento",
};

export function Chip({
  children,
  tono = "neutro",
  titulo,
}: {
  children: ReactNode;
  tono?: keyof typeof TONOS_CHIP | string;
  titulo?: string;
}) {
  return (
    <span
      title={titulo}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap ${
        TONOS_CHIP[tono] ?? TONOS_CHIP.neutro
      }`}
    >
      {children}
    </span>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 py-8 text-center text-sm text-tinta-3">{children}</p>
  );
}

export function Boton({
  children,
  variante = "primario",
  tipo = "submit",
  nombre,
  valor,
  className = "",
  disabled,
  title,
}: {
  children: ReactNode;
  variante?: "primario" | "secundario" | "fantasma" | "peligro";
  tipo?: "submit" | "button" | "reset";
  nombre?: string;
  valor?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type={tipo}
      name={nombre}
      value={valor}
      disabled={disabled}
      title={title}
      className={`${estiloBoton(variante)} ${className}`}
    >
      {children}
    </button>
  );
}

export function estiloBoton(
  variante: "primario" | "secundario" | "fantasma" | "peligro" = "primario",
): string {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";
  if (variante === "primario") {
    return `${base} bg-acento text-white hover:brightness-110`;
  }
  if (variante === "secundario") {
    return `${base} border border-borde-fuerte bg-superficie-2 text-tinta-1 hover:bg-superficie-1`;
  }
  if (variante === "peligro") {
    return `${base} border border-grave/40 bg-grave-fondo text-grave hover:border-grave`;
  }
  return `${base} text-tinta-2 hover:bg-superficie-2 hover:text-tinta-1`;
}

export function Campo({
  etiqueta,
  children,
  ayuda,
  className = "",
}: {
  etiqueta: string;
  children: ReactNode;
  ayuda?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label>{etiqueta}</label>
      {children}
      {ayuda && <p className="mt-1 text-[0.7rem] leading-relaxed text-tinta-3">{ayuda}</p>}
    </div>
  );
}

export function Aviso({
  children,
  tono = "grave",
}: {
  children: ReactNode;
  tono?: "grave" | "ok" | "aviso";
}) {
  const clases =
    tono === "ok"
      ? "border-ok/30 bg-ok-fondo text-ok"
      : tono === "aviso"
        ? "border-aviso/30 bg-aviso-fondo text-aviso"
        : "border-grave/30 bg-grave-fondo text-grave";
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm font-medium ${clases}`} role="status">
      {children}
    </p>
  );
}

/** Contenedor con scroll horizontal para tablas anchas en celular. */
export function Scroll({ children }: { children: ReactNode }) {
  return <div className="-mx-px overflow-x-auto">{children}</div>;
}
