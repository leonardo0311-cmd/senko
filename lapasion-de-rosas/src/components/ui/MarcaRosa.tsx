/**
 * Marca gráfica inspirada en un pétalo de rosa.
 * Se usa como separador, firma y filigrana. No reemplaza al logotipo oficial.
 */
export function MarcaRosa({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
      stroke="currentColor"
      strokeWidth="0.9"
    >
      <path d="M24 5c7 5.6 10.5 11.3 10.5 17.1C34.5 29.6 29.8 35 24 43c-5.8-8-10.5-13.4-10.5-20.9C13.5 16.3 17 10.6 24 5Z" />
      <path d="M24 12.5c3.6 3.4 5.4 6.9 5.4 10.4 0 4.6-2.4 7.9-5.4 12.8-3-4.9-5.4-8.2-5.4-12.8 0-3.5 1.8-7 5.4-10.4Z" />
      <path d="M24 5v38" opacity="0.45" />
    </svg>
  );
}

/** Separador editorial: filete, pétalo, filete. */
export function Separador({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden>
      <span className="filete flex-1" />
      <MarcaRosa className="h-4 w-4 shrink-0 text-oro/55" />
      <span className="filete flex-1" />
    </div>
  );
}
