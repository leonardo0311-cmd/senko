import Image from "next/image";
import { marca } from "@content/site";

/**
 * Logotipo de la marca.
 *
 * Si hay un archivo oficial cargado en content/site.ts se usa tal cual, sin
 * redibujarlo. Mientras no lo haya, se compone el nombre tipográficamente
 * —nunca se inventa un isotipo.
 */
export function Logotipo({ className = "" }: { className?: string }) {
  if (marca.logo.archivo) {
    return (
      <Image
        src={marca.logo.archivo}
        alt={marca.logo.alt}
        width={marca.logo.ancho}
        height={marca.logo.alto}
        priority
        className={className}
      />
    );
  }

  return (
    <span className={`block text-center leading-none ${className}`}>
      <span className="block font-serif text-[0.9em] font-light tracking-[0.02em]">
        La Pasión
      </span>
      <span className="mt-[0.18em] block font-sans text-[0.235em] font-medium uppercase tracking-[0.42em] text-oro">
        de Rosas
      </span>
    </span>
  );
}

/** Versión en una línea, para el encabezado y el pie. */
export function LogotipoCompacto({ className = "" }: { className?: string }) {
  if (marca.logo.archivo) {
    return (
      <Image
        src={marca.logo.archivo}
        alt={marca.logo.alt}
        width={marca.logo.ancho}
        height={marca.logo.alto}
        priority
        className={className}
      />
    );
  }

  return (
    <span className={`font-serif text-[1.35rem] font-light leading-none tracking-[0.01em] ${className}`}>
      La Pasión <span className="text-oro">de Rosas</span>
    </span>
  );
}
