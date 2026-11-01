import { brand } from "../../data/site";
import { wordmark } from "../../data/logo";
import { cn } from "../../lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = {
  sm: "h-[22px] w-auto",
  md: "h-8 w-auto",
  lg: "h-[clamp(2.5rem,6vw,5rem)] w-auto",
  xl: "h-auto w-full",
};

/** Logotipo RINDE vectorizado desde el archivo original. Toma el color del texto (currentColor). */
export default function Logo({ className, size = "md" }: Props) {
  return (
    <svg
      viewBox={`0 0 ${wordmark.width} ${wordmark.height}`}
      role="img"
      aria-label={`${brand.name}. ${brand.tagline}`}
      className={cn("block shrink-0", sizes[size], className)}
    >
      <path fill="currentColor" fillRule="evenodd" d={wordmark.d} />
    </svg>
  );
}
