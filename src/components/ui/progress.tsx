import { cn } from "@/lib/ad";

/** Slim progress bar, neutral. Say what is happening next to it, not in it. */
export function Progress({ value, max = 100, className, "aria-label": label }: { value: number; max?: number; className?: string; "aria-label"?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} className={cn("h-1.5 w-full overflow-hidden rounded-small bg-fill", className)}>
      <div className="h-full w-full rounded-small bg-on transition-transform duration-[220ms] ease-ad" style={{ transform: `translateX(${pct - 100}%)` }} />
    </div>
  );
}
