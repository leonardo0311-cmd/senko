import { brand } from "../../data/site";
import { cn } from "../../lib/utils";

type Props = {
  className?: string;
  /** Muestra la bajada "Entertainment Marketing" debajo del logotipo. */
  lockup?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  /** Color del punto final. Por defecto, naranja señal. */
  dotClassName?: string;
};

const sizes = {
  sm: "text-[1.35rem]",
  md: "text-[1.9rem]",
  lg: "text-[clamp(3rem,7vw,6rem)]",
  xl: "text-[clamp(4.5rem,19vw,20rem)]",
};

/**
 * Logotipo RINDE. Si `brand.logoSrc` apunta a un archivo real, se usa esa imagen.
 * Si no, se compone el logotipo tipográfico respetando el lockup original.
 */
export default function Logo({ className, lockup = false, size = "md", dotClassName = "text-signal" }: Props) {
  if (brand.logoSrc) {
    return <img src={brand.logoSrc} alt={`${brand.name} — ${brand.tagline}`} className={cn("h-auto w-auto", className)} />;
  }

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className={cn("font-sans font-extrabold tracking-[-0.055em] leading-[0.82]", sizes[size])}>
        {brand.wordmark.slice(0, -1)}
        <span className={dotClassName}>.</span>
      </span>
      {lockup && (
        <span className="mt-[0.35em] self-end font-mono text-[0.26em] font-medium uppercase tracking-[0.14em] opacity-80">
          {brand.tagline}
        </span>
      )}
    </span>
  );
}
