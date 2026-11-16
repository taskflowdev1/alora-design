import { cn } from "@/lib/ad";

/** A plain count. Grey, never a loud colour. */
export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-small bg-fill px-1.5 text-small tabular-nums text-ink-muted", className)}>
      {children}
    </span>
  );
}
