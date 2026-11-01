import { cn } from "../../lib/utils";

export default function SectionLabel({ children, index, className }: { children: string; index?: string; className?: string }) {
  return (
    <p className={cn("label flex items-center gap-3 text-muted", className)}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
      {index && <span className="text-subtle">{index}</span>}
      <span>{children}</span>
    </p>
  );
}
