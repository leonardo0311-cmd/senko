import { cn } from "../../lib/utils";

/**
 * Composición de luces de escenario (CSS puro, sin imágenes).
 * Se usa mientras no haya un video o foto propia para el hero.
 */
export default function StageLights({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_110%,rgb(117_29_40/0.55),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_0%,rgb(107_61_240/0.22),transparent_70%)]" />
      <div className="beam beam-a" />
      <div className="beam beam-b" />
      <div className="beam beam-c" />
      {/* humo */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(80%_60%_at_30%_100%,rgb(246_242_234/0.08),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}
