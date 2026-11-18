import * as React from "react";
import { cn } from "@/lib/ad";
import { ChartLegend, ChartTooltip, formatShort, niceTicks, seriesColor, useWidth, type Datum, type Series } from "@/components/ui/chart";

export interface RadarChartProps {
  /** One row per spoke (`label`), one number per series. */
  data: Datum[];
  series: Series[];
  /** Height in px; the web fills the width up to this. */
  size?: number;
  /** Rings in the web (faint, never dashed). */
  rings?: number;
  /** Polygon wash, 0 to 0.4. */
  fill?: number;
  format?: (n: number) => string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Several measures of a few things at once (shops across speed, rating, returns…). Five to eight spokes, two or three
 * series. A faint web, 2 px outlines with a soft wash, dots with a surface ring; hover a spoke for every series' value.
 */
export function RadarChart({ data, series, size = 240, rings = 4, fill = 0.14, format = formatShort, className, ...aria }: RadarChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = React.useState<number | null>(null);
  const n = data.length;
  const max = niceTicks(Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0))), rings).at(-1)!;
  const w = Math.max(1, width);
  const cx = w / 2;
  const cy = size / 2;
  const R = Math.max(10, Math.min(w / 2 - 56, size / 2 - 22));
  const pt = (i: number, v: number): [number, number] => {
    const a = (i / n) * Math.PI * 2;
    return [cx + R * (v / max) * Math.sin(a), cy - R * (v / max) * Math.cos(a)];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <figure aria-label={aria["aria-label"]} className={cn("grid min-w-0 gap-3", className)}>
      <div ref={ref} className="relative min-w-0" style={{ height: size }}>
        {width > 0 ? (
          <svg width={w} height={size} role="img" aria-label={aria["aria-label"]} className="block overflow-visible" onPointerLeave={() => setHover(null)}>
            {Array.from({ length: rings }, (_, r) => (
              <polygon key={r} points={poly(data.map(() => (max * (r + 1)) / rings))} fill="none" stroke="var(--ad-fill)" strokeWidth={1} />
            ))}
            {data.map((_, i) => {
              const [x, y] = pt(i, max);
              return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--ad-fill)" strokeWidth={1} />;
            })}
            {series.map((s, si) => (
              <polygon key={s.key} points={poly(data.map((d) => Number(d[s.key]) || 0))} fill={seriesColor(si)} fillOpacity={fill} stroke={seriesColor(si)} strokeWidth={2} strokeLinejoin="round" />
            ))}
            {series.map((s, si) =>
              data.map((d, i) => {
                const [x, y] = pt(i, Number(d[s.key]) || 0);
                return <circle key={`${s.key}${i}`} cx={x} cy={y} r={hover === i ? 4.5 : 3.5} fill={seriesColor(si)} stroke="var(--ad-surface)" strokeWidth={2} />;
              }),
            )}
            {data.map((d, i) => {
              const [x, y] = pt(i, max * 1.12);
              const a = (i / n) * Math.PI * 2;
              const anchor = Math.abs(Math.sin(a)) < 0.2 ? "middle" : Math.sin(a) > 0 ? "start" : "end";
              const [hx, hy] = pt(i, max * 0.5);
              return (
                <g key={d.label} onPointerEnter={() => setHover(i)} tabIndex={0} onFocus={() => setHover(i)} onBlur={() => setHover(null)} className="cursor-default outline-none">
                  <circle cx={hx} cy={hy} r={R * 0.5} fill="transparent" />
                  <text x={x} y={y} dy="0.32em" textAnchor={anchor} className={cn("text-[11px]", hover === i ? "fill-ink" : "fill-ink-muted")}>
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : null}
        {hover != null ? (
          <ChartTooltip
            title={data[hover].label}
            rows={series.map((s, si) => ({ color: series.length > 1 ? seriesColor(si) : undefined, label: s.label, value: format(Number(data[hover][s.key]) || 0) }))}
            style={{ left: 0, top: 0 }}
          />
        ) : null}
      </div>
      {series.length > 1 ? <ChartLegend items={series.map((s, si) => ({ label: s.label, color: seriesColor(si) }))} className="justify-center" /> : null}
    </figure>
  );
}
