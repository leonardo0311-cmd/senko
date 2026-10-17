import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variante = "principal" | "secundario" | "texto";

const base =
  "group relative inline-flex items-center justify-center gap-2.5 font-sans " +
  "text-[0.78rem] font-semibold uppercase tracking-[0.16em] " +
  "transition-colors duration-300 ease-[var(--ease-suave)] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variantes: Record<Variante, string> = {
  principal:
    "overflow-hidden bg-oro px-7 py-4 text-carbon hover:bg-marfil " +
    "shadow-[0_1px_0_rgba(240,233,223,0.08)]",
  secundario:
    "overflow-hidden border border-[var(--borde-sutil)] px-7 py-4 text-marfil " +
    "hover:border-oro/60 hover:text-oro",
  texto:
    "text-oro underline-offset-[6px] hover:text-marfil " +
    "decoration-oro/40 hover:decoration-marfil/60 underline",
};

/** Capa borgoña que se desplaza en hover sobre el botón secundario. */
function Velo() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 origin-bottom scale-y-0 bg-borgona
                 transition-transform duration-500 ease-[var(--ease-suave)]
                 group-hover:scale-y-100 motion-reduce:transition-none"
    />
  );
}

type BotonProps = {
  variante?: Variante;
  children: ReactNode;
} & ComponentPropsWithoutRef<"button">;

export function Boton({ variante = "principal", children, className = "", ...props }: BotonProps) {
  return (
    <button {...props} className={`${base} ${variantes[variante]} ${className}`}>
      {variante === "secundario" && <Velo />}
      <span className="relative">{children}</span>
    </button>
  );
}

type EnlaceProps = {
  variante?: Variante;
  href: string;
  children: ReactNode;
  externo?: boolean;
  className?: string;
  onClick?: () => void;
  "aria-label"?: string;
};

export function BotonEnlace({
  variante = "principal",
  href,
  children,
  externo,
  className = "",
  ...props
}: EnlaceProps) {
  const contenido = (
    <>
      {variante === "secundario" && <Velo />}
      <span className="relative">{children}</span>
    </>
  );
  const clases = `${base} ${variantes[variante]} ${className}`;

  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases} {...props}>
        {contenido}
      </a>
    );
  }

  return (
    <Link href={href} className={clases} {...props}>
      {contenido}
    </Link>
  );
}
