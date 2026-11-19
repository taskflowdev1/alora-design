import { Check } from "react-feather";
import { cn } from "@/lib/ad";

export interface StepsProps {
  steps: string[];
  /** Index of the current step. Steps before it are done. Pass steps.length when all are done. */
  current: number;
  className?: string;
}

/**
 * Where an order (or any flow) is. Each step is a slim bar with its label under it:
 * done = accent shade with a check, current = half full, next = soft track. No connecting lines.
 */
export function Steps({ steps, current, className }: StepsProps) {
  return (
    <ol className={cn("grid gap-2", className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s} aria-current={now ? "step" : undefined} className="grid min-w-0 gap-1.5">
            <span className="h-1.5 overflow-hidden rounded-full bg-fill">
              <span
                className="block h-full w-full rounded-full bg-chart-1 transition-transform duration-[220ms] ease-ad"
                style={{ transform: `translateX(${done ? 0 : now ? -50 : -100}%)` }}
              />
            </span>
            <span className={cn("flex min-w-0 items-center gap-1 text-body", done || now ? "text-ink" : "text-ink-muted", now && "font-medium")}>
              {done ? <Check size={14} className="shrink-0 text-ink-muted" /> : null}
              <span className="truncate">{s}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
