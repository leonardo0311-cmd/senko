"use client";

import { redes, siVerificado } from "@content/site";
import { medir } from "@/lib/analitica";

/** Enlace al perfil oficial. No se renderiza si el perfil no está confirmado. */
export function EnlaceInstagram({
  origen,
  className = "",
}: {
  origen: string;
  className?: string;
}) {
  const instagram = siVerificado(redes.instagram);
  if (!instagram) return null;

  return (
    <a
      href={instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => medir("instagram_click", { origen })}
      className={`group inline-flex items-center gap-3 font-sans text-[0.75rem] uppercase tracking-[0.16em] text-marfil transition-colors hover:text-oro ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
      @{instagram.usuario}
      <span
        aria-hidden
        className="inline-block transition-transform duration-400 ease-[var(--ease-suave)] group-hover:translate-x-1 motion-reduce:transition-none"
      >
        →
      </span>
    </a>
  );
}
