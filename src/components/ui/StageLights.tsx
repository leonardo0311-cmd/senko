import { cn } from "../../lib/utils";

/**
 * Composición de luces de escenario (CSS puro, sin imágenes).
 * Se usa mientras no haya un video o foto propia para el hero.
 */
export default function StageLights({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_110%,rgb(117_29_40/0.16),transparent_60%)]" />
      <div className="beam beam-a" />
      <div className="beam beam-b" />
      <div className="beam beam-c" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-canvas to-transparent" />
    </div>
  );
}
