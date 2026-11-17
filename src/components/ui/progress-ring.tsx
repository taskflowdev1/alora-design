import * as React from "react";
import { cn } from "@/lib/ad";

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  /** Centre text. Defaults to the percentage; pass null for none. */
  label?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** Circular progress in the accent shade on a soft track, round caps. */
export function ProgressRing({ value, max = 100, size = 48, thickness = 5, label, className, ...aria }: ProgressRingProps) {
  const pct = Math.min(1, Math.max(0, value / max));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span
      role="progressbar"
      aria-label={aria["aria-label"]}
      aria-valuenow={value}
      aria-valuemax={max}
      data-shape="round"
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ad-fill)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ad-chart-1)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          className="transition-[stroke-dasharray] duration-[220ms] ease-ad"
        />
      </svg>
      {label === null ? null : (
        <span className={cn("relative font-semibold tabular-nums text-ink", size >= 64 ? "text-title" : "text-small")}>{label ?? `${Math.round(pct * 100)}%`}</span>
      )}
    </span>
  );
}
