import * as React from "react";
import { cn } from "@/lib/ad";
import { ChartLegend, ChartTooltip, formatShort, seriesColor } from "@/components/ui/chart";

export interface PieSlice {
  key: string;
  label: string;
  value: number;
}

export interface PieChartProps {
  data: PieSlice[];
  /** Outer size in px. */
  size?: number;
  /** Ring thickness as a share of the radius: 1 = a full pie, about 0.3 = a donut. */
  thickness?: number;
  /** The total (or any figure) in the middle of a donut. */
  center?: React.ReactNode;
  /** Legend beside (wide) or under the chart. */
  legend?: "side" | "bottom" | "none";
  format?: (n: number) => string;
  className?: string;
  "aria-label"?: string;
}

const TAU = Math.PI * 2;
function arc(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) => `${(cx + r * Math.sin(a)).toFixed(2)} ${(cy - r * Math.cos(a)).toFixed(2)}`;
  const big = a1 - a0 > Math.PI ? 1 : 0;
  if (r0 <= 0) return `M${cx} ${cy}L${p(r1, a0)}A${r1} ${r1} 0 ${big} 1 ${p(r1, a1)}Z`;
  return `M${p(r1, a0)}A${r1} ${r1} 0 ${big} 1 ${p(r1, a1)}L${p(r0, a1)}A${r0} ${r0} 0 ${big} 0 ${p(r0, a0)}Z`;
}

/**
 * Parts of one whole, five at most (fold the rest into "Other"). Slices in accent shades, largest first from 12
 * o'clock, a 2 px surface gap between them, the legend carries names and shares (text never wears the slice colour).
 * Hover or focus a slice for its amount.
 */
export function PieChart({ data, size = 168, thickness = 0.32, center, legend = "side", format = formatShort, className, ...aria }: PieChartProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r1 = size / 2;
  const r0 = thickness >= 1 ? 0 : r1 * (1 - thickness);
  const gap = data.length > 1 ? 2 / r1 : 0;
  let at = 0;
  const slices = data.map((d, i) => {
    const a0 = at;
    at += (d.value / total) * TAU;
    return { ...d, i, a0: a0 + gap / 2, a1: Math.max(a0 + gap / 2 + 0.001, at - gap / 2) };
  });
  const h = hover != null ? slices[hover] : null;
  const share = (v: number) => `${Math.round((v / total) * 100)}%`;
  return (
    <figure aria-label={aria["aria-label"]} className={cn("flex min-w-0 items-center gap-x-6 gap-y-4", legend === "side" ? "flex-wrap" : "flex-col", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={aria["aria-label"]} className="block overflow-visible" onPointerLeave={() => setHover(null)}>
          {slices.map((s) => (
            <path
              key={s.key}
              d={arc(r1, r1, r0, hover === s.i ? r1 + 3 : r1, s.a0, s.a1)}
              fill={seriesColor(s.i)}
              stroke="var(--ad-surface)"
              strokeWidth={r0 ? 0 : 2}
              tabIndex={0}
              aria-label={`${s.label} ${format(s.value)}, ${share(s.value)}`}
              onPointerEnter={() => setHover(s.i)}
              onFocus={() => setHover(s.i)}
              onBlur={() => setHover(null)}
              className="cursor-default outline-none transition-[d] duration-[220ms] ease-ad"
            />
          ))}
        </svg>
        {r0 && center != null && !h ? <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center}</div> : null}
        {h ? (
          r0 ? (
            <div className="pointer-events-none absolute inset-0 grid place-content-center justify-items-center gap-0.5 text-center">
              <span className="text-small text-ink-muted">{h.label}</span>
              <span className="text-title font-semibold tabular-nums text-ink">{format(h.value)}</span>
            </div>
          ) : (
            <ChartTooltip rows={[{ color: seriesColor(h.i), label: h.label, value: `${format(h.value)} · ${share(h.value)}` }]} style={{ left: "50%", top: -8, transform: "translate(-50%, -100%)" }} />
          )
        ) : null}
      </div>
      {legend !== "none" ? (
        legend === "side" ? (
          <ul className="grid min-w-0 flex-1 gap-1 text-body">
            {slices.map((s) => (
              <li key={s.key} onPointerEnter={() => setHover(s.i)} onPointerLeave={() => setHover(null)} className={cn("flex min-w-0 items-center gap-2 rounded-small px-1.5 py-0.5 transition-colors duration-[160ms]", hover === s.i && "bg-fill")}>
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: seriesColor(s.i) }} />
                <span className="min-w-0 flex-1 truncate text-ink-muted">{s.label}</span>
                <span className="tabular-nums text-ink">{share(s.value)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ChartLegend items={slices.map((s) => ({ label: s.label, color: seriesColor(s.i), value: share(s.value) }))} className="justify-center" />
        )
      ) : null}
    </figure>
  );
}
