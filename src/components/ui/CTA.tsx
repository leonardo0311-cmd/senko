import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Props = {
  to: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "light";
  className?: string;
  external?: boolean;
  icon?: ReactNode;
};

const styles = {
  primary: "bg-signal text-ink hover:bg-paper",
  ghost: "border border-paper/25 text-paper hover:border-paper hover:bg-paper hover:text-ink",
  light: "bg-paper text-ink hover:bg-signal",
};

export default function CTA({ to, children, variant = "primary", className, external, icon }: Props) {
  const cls = cn(
    "group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-6 py-3 text-[0.95rem] font-semibold transition-colors duration-300",
    styles[variant],
    className,
  );
  const inner = (
    <>
      <span>{children}</span>
      {icon ?? (
        <ArrowUpRight
          size={18}
          strokeWidth={2.2}
          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      )}
    </>
  );
  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  );
}
