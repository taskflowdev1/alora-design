import * as React from "react";
import { cn } from "@/lib/ad";
import { ChartTooltip, seriesColor } from "@/components/ui/chart";

export interface RadialBar {
  key: string;
  label: string;
  value: number;
  /** The goal for this ring; the track is the rest of the way. */
  max: number;
  display?: string;
}

export interface RadialChartProps {
  data: RadialBar[];
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  /** Gap between rings in px. */
  gap?: number;
  /** How far round a full ring goes: 360 = full circle, 270 = an open gauge. */
  sweep?: number;
  /** In the middle (one ring: its figure). */
  center?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Progress toward goals as rings (target per shop, a quota). Round-capped arcs in accent shades on a soft track of
 * the same width, outer ring first; the legend lists each ring's share. One ring with a big figure in the middle is
 * the gauge.
 */
export function RadialChart({ data, size = 168, thickness = 10, gap = 6, sweep = 270, center, className, ...aria }: RadialChartProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const c = size / 2;
  const start = -sweep / 2;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (r: number, a0: number, a1: number) => {
    const p = (a: number) => `${(c + r * Math.sin(rad(a))).toFixed(2)} ${(c - r * Math.cos(rad(a))).toFixed(2)}`;
    if (a1 - a0 >= 359.99) return `M${p(0)}A${r} ${r} 0 1 1 ${p(180)}A${r} ${r} 0 1 1 ${p(359.99)}`;
    return `M${p(a0)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)}`;
  };
  const pct = (d: RadialBar) => Math.max(0, Math.min(1, d.value / (d.max || 1)));
  const h = hover != null ? data[hover] : null;
  return (
    <figure aria-label={aria["aria-label"]} className={cn("flex min-w-0 flex-wrap items-center gap-x-6 gap-y-4", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={aria["aria-label"]} className="block" onPointerLeave={() => setHover(null)}>
          {data.map((d, i) => {
            const r = c - thickness / 2 - i * (thickness + gap);
            if (r <= thickness / 2) return null;
            return (
              <g key={d.key} onPointerEnter={() => setHover(i)} tabIndex={0} onFocus={() => setHover(i)} onBlur={() => setHover(null)} className="outline-none" aria-label={`${d.label} ${Math.round(pct(d) * 100)}%`}>
                <path d={arcPath(r, start, start + sweep)} fill="none" stroke="var(--ad-fill)" strokeWidth={thickness} strokeLinecap="round" />
                {pct(d) > 0 ? (
                  <path d={arcPath(r, start, start + Math.max(0.5, sweep * pct(d)))} fill="none" stroke={seriesColor(i)} strokeWidth={hover === i ? thickness + 2 : thickness} strokeLinecap="round" className="transition-[stroke-width] duration-[160ms]" />
                ) : null}
              </g>
            );
          })}
        </svg>
        {center != null ? <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{center}</div> : null}
        {h ? <ChartTooltip rows={[{ color: seriesColor(hover!), label: h.label, value: h.display ?? `${Math.round(pct(h) * 100)}%` }]} style={{ left: "50%", top: -8, transform: "translate(-50%, -100%)" }} /> : null}
      </div>
      {data.length > 1 ? (
        <ul className="grid min-w-0 flex-1 gap-1 text-body">
          {data.map((d, i) => (
            <li key={d.key} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} className={cn("flex min-w-0 items-center gap-2 rounded-small px-1.5 py-0.5 transition-colors duration-[160ms]", hover === i && "bg-fill")}>
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: seriesColor(i) }} />
              <span className="min-w-0 flex-1 truncate text-ink-muted">{d.label}</span>
              <span className="tabular-nums text-ink">{Math.round(pct(d) * 100)}%</span>
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
