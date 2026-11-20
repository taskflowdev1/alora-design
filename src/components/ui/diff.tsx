import type * as React from "react";
import { cn, formatNumber } from "@/lib/ad";

export interface DiffProps {
  /** The difference: expected minus actual, or this period minus the last. */
  value: number;
  /** Prefix such as "Rp". */
  unit?: string;
  /** Format the absolute value. Defaults to id-ID grouping. */
  format?: (abs: number) => string;
  /** Values within ± tolerance count as no difference. */
  tolerance?: number;
  /** Shown for no difference. */
  zero?: React.ReactNode;
  className?: string;
}

/** A difference: green or red only when there is one. No difference is plain grey. */
export function Diff({ value, unit, format = (n) => formatNumber(Math.round(n)), tolerance = 0, zero = "—", className }: DiffProps) {
  const none = Math.abs(value) <= tolerance;
  if (none) return <span className={cn("tabular-nums text-ink-muted", className)}>{zero}</span>;
  const up = value > 0;
  return (
    <span className={cn("whitespace-nowrap font-medium tabular-nums", up ? "text-success" : "text-danger", className)}>
      {up ? "+" : "−"}
      {unit ? `${unit} ` : ""}
      {format(Math.abs(value))}
    </span>
  );
}
