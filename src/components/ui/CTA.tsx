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
  primary: "bg-brand text-canvas hover:bg-fg",
  ghost: "border border-fg/25 text-fg hover:border-fg hover:bg-fg hover:text-canvas",
  light: "bg-paper text-wine hover:bg-sand",
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
