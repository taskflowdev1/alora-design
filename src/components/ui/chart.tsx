import * as React from "react";
import { cn, formatCompact } from "@/lib/ad";
import { useElementWidth } from "@/lib/ad-hooks";

/*
 * The chart system every chart shares: series colours (shades of the one accent, in a fixed order), the width hook,
 * clean ticks, short Indonesian numbers, one tooltip and one legend. Line and area charts are drawn here too
 * (`CartesianChart`); pie, radar and radial import the pieces. No dual axes, no borders around marks: a 2 px gap
 * in the surface colour separates touching marks and a 2 px surface ring sits around dots.
 */

/**
 * Series colours in fixed order (series n always gets series-n, whatever else is shown): one accent hue in lightness
 * steps far enough apart to tell neighbours apart, set per theme. Five at most; fold the rest into "Other".
 */
export const SERIES = ["var(--ad-series-1)", "var(--ad-series-2)", "var(--ad-series-3)", "var(--ad-series-4)", "var(--ad-series-5)"];
export const seriesColor = (i: number) => SERIES[i % SERIES.length];

export interface Series {
  key: string;
  label: string;
}

export type Datum = { label: string } & Record<string, number | string>;

/** "12,4 jt", "980 rb", "1,2 M": short Indonesian amounts for axes and tight places (one decimal, plain space). */
export function formatShort(n: number) {
  return formatCompact(n, { space: " ", digits: 1 });
}

/** Round tick values from 0 to at least `max`: 0 / 5 / 10 / 15, never 0 / 4.3 / 8.6. */
export function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6);
}

/** The element's content width, kept current; 0 until measured. The shared hook, under the name charts use. */
export const useWidth = useElementWidth;

/**
 * The one tooltip: a small card with a title and one row per series (colour key, label, value). Ink in light; in dark
 * the darkest step, below the card it floats over, never a white card.
 */
export function ChartTooltip({ title, rows, style, className, ref }: { title?: React.ReactNode; rows: { color?: string; label: React.ReactNode; value: React.ReactNode }[]; style?: React.CSSProperties; className?: string; ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} role="status" className={cn("pointer-events-none absolute z-10 grid min-w-28 gap-1 whitespace-nowrap rounded-item bg-tip px-2.5 py-2 text-small text-tip-ink shadow-raised", className)} style={style}>
      {title != null ? <div className="font-medium">{title}</div> : null}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          {r.color ? <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: r.color }} /> : null}
          <span className="flex-1 opacity-75">{r.label}</span>
          <span className="tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export interface ChartLegendProps {
  items: { label: React.ReactNode; color: string; value?: React.ReactNode }[];
  /** Linked highlight: the item being pointed at elsewhere; the others dim. */
  active?: number | null;
  /** Pointing at an item reports it, so the chart and a table can light up its series. */
  onActiveChange?: (index: number | null) => void;
  className?: string;
}

/** Legend: a colour dot beside each name; the text stays in ink, never the series colour. Present from two series up. */
export function ChartLegend({ items, active, onActiveChange, className }: ChartLegendProps) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-small text-ink-muted", className)}>
      {items.map((it, i) => (
        <li
          key={i}
          onPointerEnter={onActiveChange && (() => onActiveChange(i))}
          onPointerLeave={onActiveChange && (() => onActiveChange(null))}
          // The item pointed at turns ink; the others dim their dot only, so every name and value stays readable.
          className={cn(
            "inline-flex items-center gap-1.5 transition-colors duration-[160ms] ease-ad [&>[data-dot]]:transition-opacity [&>[data-dot]]:duration-[160ms]",
            active != null && (active === i ? "text-ink" : "[&>[data-dot]]:opacity-45 [&>[data-value]]:text-ink-muted"),
          )}
        >
          <span aria-hidden data-dot className="size-2 shrink-0 rounded-full" style={{ background: it.color }} />
          {it.label}
          {it.value != null ? (
            <span data-value className="tabular-nums text-ink">
              {it.value}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export interface CartesianChartProps {
  data: Datum[];
  series: Series[];
  kind?: "line" | "area";
  height?: number;
  /** Smooth curves (monotone, never overshooting) or straight segments. */
  curve?: "smooth" | "linear";
  /** Faint horizontal gridlines at the ticks. Off by default: charts run end to end, with nothing ruled across them. */
  grid?: boolean;
  /** Value ticks on the left. Off by default: the tooltip and the headline carry the values. */
  axis?: boolean;
  /** Dots at every point (the last point always gets one). */
  dots?: boolean;
  /** Area only: stack the series on top of each other. */
  stacked?: boolean;
  /** Area only: wash strength, 0 to 0.4. */
  fill?: number;
  /** Label every nth x value. 0 = pick from the width. */
  labelEvery?: number;
  /** The legend in a row above the chart (from two series up). Off when the card's header carries it. */
  legend?: boolean;
  format?: (n: number) => string;
  /** Linked highlight (brushing): the point index shown from outside, e.g. while a table row is hovered. */
  active?: number | null;
  /** Hovering or arrowing to a point reports its index (null on leave), so a table can light up the matching row. */
  onActiveChange?: (index: number | null) => void;
  /** Linked highlight: the series key to emphasise; the others dim. */
  activeSeries?: string | null;
  /** Hovering a line or its legend item reports its key. */
  onActiveSeriesChange?: (key: string | null) => void;
  className?: string;
  "aria-label"?: string;
}

/** Monotone cubic path (Fritsch-Carlson): smooth, and never bulges past a data point. */
function monotone(pts: [number, number][]) {
  const n = pts.length;
  if (n < 3) return pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
  const m = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / dx[i]);
  const t = pts.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i])));
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h} ${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h} ${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]} ${pts[i + 1][1]}`;
  }
  return d;
}
const linear = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

/**
 * Line and area charts on one value axis. 2 px lines with round ends, an end dot with a surface ring, ticks and
 * gridlines only when asked for, a crosshair with one tooltip for every series on hover, tap or arrow keys (kept inside the plot), and
 * a legend in a row above from two series up.
 */
export function CartesianChart({ data, series, kind = "line", height = 200, curve = "smooth", grid = false, axis = false, dots = false, stacked = false, fill = 0.14, labelEvery = 0, legend = true, format = formatShort, active, onActiveChange, activeSeries, onActiveSeriesChange, className, ...aria }: CartesianChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [own, setOwn] = React.useState<number | null>(null);
  // Controlled when `active` is passed (linked to a table), otherwise its own.
  const hover = active !== undefined ? active : own;
  const setHover = (next: number | null | ((v: number | null) => number | null)) => {
    const v = typeof next === "function" ? next(hover) : next;
    setOwn(v);
    if (v !== hover) onActiveChange?.(v);
  };
  const dim = (key: string) => activeSeries != null && activeSeries !== key;
  const area = kind === "area";
  const stack = area && stacked;
  const val = (d: Datum, k: string) => Number(d[k]) || 0;
  const tops = data.map((d) => series.reduce<number[]>((acc, s) => [...acc, (stack ? (acc[acc.length - 1] ?? 0) : 0) + val(d, s.key)], []));
  const max = Math.max(1, ...tops.flat());
  const ticks = niceTicks(max, height < 160 ? 3 : 4);
  const top = ticks[ticks.length - 1];
  const left = axis ? Math.max(28, Math.max(...ticks.map((t) => format(t).length)) * 6.4 + 10) : 4;
  const pad = { t: 8, r: 8, b: 24, l: left };
  const iw = Math.max(1, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (data.length < 2 ? iw / 2 : (i * iw) / (data.length - 1));
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const every = labelEvery || Math.max(1, Math.ceil((data.length * 52) / Math.max(1, iw)));
  const path = curve === "smooth" ? monotone : linear;
  const lines = series.map((_s, si) => data.map((_, i) => [x(i), y(tops[i][si])] as [number, number]));
  const bases = series.map((_, si) => data.map((_, i) => [x(i), y(stack && si ? tops[i][si - 1] : 0)] as [number, number]));
  const pick = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect();
    const i = Math.round(((clientX - r.left - pad.l) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const h = hover != null ? data[hover] : null;
  const last = data.length - 1;
  // The tooltip sits beside the crosshair on the side with room, and always inside the plot: never over the value axis.
  // It moves by transform (no layout shift per pointer move) and only ever widens during a sweep, so its far edge
  // doesn't jitter as values of different lengths go by.
  const tip = React.useRef<HTMLDivElement>(null);
  const widest = React.useRef(0);
  React.useLayoutEffect(() => {
    const el = tip.current;
    if (!el || hover == null) {
      widest.current = 0;
      return;
    }
    widest.current = Math.max(widest.current, el.offsetWidth);
    el.style.minWidth = `${widest.current}px`;
    const w = widest.current;
    const px = x(hover);
    const lo = pad.l + 4;
    const hi = width - pad.r - w;
    const right = px + 12;
    const left = px - 12 - w;
    const at = px > width / 2 ? (left >= lo ? left : right <= hi ? right : left) : right <= hi ? right : left >= lo ? left : right;
    el.style.transform = `translateX(${Math.max(lo, Math.min(hi, at))}px)`;
  });
  const legendRow =
    legend && series.length > 1 ? (
      <ChartLegend
        items={series.map((s, si) => ({ label: s.label, color: seriesColor(si) }))}
        active={activeSeries != null ? series.findIndex((s) => s.key === activeSeries) : null}
        onActiveChange={onActiveSeriesChange && ((i) => onActiveSeriesChange(i == null ? null : series[i].key))}
        className={cn(axis && "pl-1")}
      />
    ) : null;
  return (
    <figure aria-label={aria["aria-label"]} className={cn("grid min-w-0 content-start gap-3", className)}>
      {legendRow}
      <div ref={ref} className="relative min-w-0" style={{ height }}>
        {width > 0 ? (
          <svg
            width={width}
            height={height}
            tabIndex={0}
            role="img"
            aria-label={aria["aria-label"]}
            className="block touch-pan-y overflow-visible"
            onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
            onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
            // A finger lifting is not leaving: on touch the tooltip stays until you tap elsewhere.
            onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
            // Keyboard focus shows the crosshair at the latest point at once, so focus is visible before any arrow key.
            onFocus={(e) => hover == null && e.currentTarget.matches(":focus-visible") && setHover(last)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              setHover((v) => Math.max(0, Math.min(last, (v ?? (e.key === "ArrowLeft" ? last + 1 : -1)) + (e.key === "ArrowLeft" ? -1 : 1))));
            }}
          >
            {ticks.map((t) => (
              <g key={t}>
                {grid ? <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--ad-fill)" strokeWidth={1} shapeRendering="crispEdges" /> : null}
                {axis ? (
                  <text x={pad.l - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-small tabular-nums">
                    {format(t)}
                  </text>
                ) : null}
              </g>
            ))}
            {data.map((d, i) =>
              i % every === 0 || (i === last && last % every > every / 2) ? (
                <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="fill-ink-muted text-small">
                  {d.label}
                </text>
              ) : null,
            )}
            {hover != null ? <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--ad-fill-strong)" strokeWidth={1} shapeRendering="crispEdges" /> : null}
            {area
              ? series.map((s, si) => {
                  const up = path(lines[si]);
                  const down = path([...bases[si]].reverse()).replace(/^M/, "L");
                  return <path key={s.key} d={`${up}${down}Z`} fill={seriesColor(si)} fillOpacity={(stack ? Math.min(0.5, fill * 2.2) : fill) * (dim(s.key) ? 0.35 : 1)} className="transition-[fill-opacity] duration-[160ms] ease-ad" />;
                })
              : null}
            {series.map((s, si) => (
              <path key={s.key} d={path(lines[si])} fill="none" stroke={seriesColor(si)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={dim(s.key) ? 0.25 : 1} className="transition-[stroke-opacity] duration-[160ms] ease-ad" />
            ))}
            {onActiveSeriesChange
              ? series.map((s, si) => (
                  // A wide invisible stroke over each line, so pointing near a line picks its series.
                  <path key={`hit-${s.key}`} d={path(lines[si])} fill="none" stroke="transparent" strokeWidth={14} onPointerEnter={() => onActiveSeriesChange(s.key)} onPointerLeave={() => onActiveSeriesChange(null)} />
                ))
              : null}
            {series.map((s, si) =>
              lines[si].map(([px, py], i) =>
                dots || i === last || i === hover ? (
                  <circle key={`${s.key}${i}`} cx={px} cy={py} r={i === hover ? 4.5 : 4} fill={seriesColor(si)} stroke="var(--ad-surface)" strokeWidth={2} opacity={dim(s.key) ? 0.25 : 1} className="pointer-events-none" />
                ) : null,
              ),
            )}
          </svg>
        ) : null}
        {h && hover != null ? (
          <ChartTooltip
            ref={tip}
            title={h.label}
            rows={series.map((s, si) => ({ color: series.length > 1 ? seriesColor(si) : undefined, label: s.label, value: format(val(h, s.key)) }))}
            style={{ top: pad.t, left: 0, transform: `translateX(${x(hover) + 12}px)` }}
          />
        ) : null}
      </div>
    </figure>
  );
}
