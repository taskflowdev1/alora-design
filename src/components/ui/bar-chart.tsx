import * as React from "react";
import { cn } from "@/lib/ad";

export type Bar = { label: string; value: number; /** Shown on hover, e.g. "Rp 12,4 jt". */ display?: string };

export interface BarChartProps {
  data: Bar[];
  height?: number;
  /** Index to show in the darker shade (e.g. today). */
  current?: number;
  /** Label every nth bar along the bottom. */
  labelEvery?: number;
  /** Same boxes as the loaded chart, pulsing. */
  loading?: boolean;
  className?: string;
  "aria-label"?: string;
}

const pulse = "animate-[ad-pulse_1.6s_ease-in-out_infinite] bg-fill";

/** Slim bars in shades of the one accent, one shared bar radius. No gridlines, no axes. */
export function BarChart({ data, height = 140, current, labelEvery = 1, loading, className, ...aria }: BarChartProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const shown = hover;
  const strong = hover ?? current ?? null;
  return (
    <figure aria-label={aria["aria-label"]} className={cn("relative select-none", className)}>
      <div className="flex items-end justify-between gap-[3px]" style={{ height }} onPointerLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex h-full flex-1 cursor-default items-end justify-center" onPointerEnter={() => setHover(i)}>
            <div
              className={cn(
                "w-full max-w-2.5 rounded-small transition-[background-color,height] duration-[220ms] ease-ad",
                loading ? pulse : i === strong ? "bg-chart-1" : current != null ? "bg-chart-3" : "bg-chart-2",
              )}
              style={{ height: loading ? "40%" : `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-[3px] text-small text-ink-muted">
        {data.map((d, i) => (
          <span key={i} className="flex min-w-0 flex-1 justify-center whitespace-nowrap">
            {i % labelEvery === 0 ? <span className={cn(loading && cn(pulse, "rounded-small text-transparent"))}>{d.label}</span> : ""}
          </span>
        ))}
      </div>
      {!loading && shown != null && data[shown] ? (
        <figcaption
          className="pointer-events-none absolute top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-item bg-tip px-2 py-1 text-small tabular-nums text-tip-ink shadow-raised"
          style={{ left: `${((shown + 0.5) / data.length) * 100}%` }}
        >
          {data[shown].label} · {data[shown].display ?? data[shown].value.toLocaleString("id-ID")}
        </figcaption>
      ) : null}
    </figure>
  );
}

export interface BarListProps {
  data: { label: React.ReactNode; value: number; display?: string; key: string }[];
  /** Rows are filters for the list below them. */
  selected?: string | null;
  onSelect?: (key: string | null) => void;
  loading?: boolean;
  className?: string;
}

/** Horizontal slim bars with labels; clicking a row filters. */
export function BarList({ data, selected, onSelect, loading, className }: BarListProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className={cn("grid gap-px", className)}>
      {data.map((d) => {
        const on = selected === d.key;
        return (
          <li key={d.key}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect?.(on ? null : d.key)}
              className={cn(
                "grid h-row w-full cursor-pointer grid-cols-[minmax(80px,140px)_1fr_auto] items-center gap-3 rounded-item px-2.5 text-left text-body",
                on ? "bg-fill-strong" : "hover:bg-fill focus-visible:bg-fill",
              )}
            >
              <span className="truncate text-ink">
                <span className={cn(loading && cn(pulse, "rounded-small text-transparent"))}>{d.label}</span>
              </span>
              <span className={cn("h-2 rounded-small", loading ? pulse : "bg-fill")}>
                {loading ? null : <span className="block h-full rounded-small bg-chart-2" style={{ width: `${(d.value / max) * 100}%` }} />}
              </span>
              <span className={cn("tabular-nums text-ink", loading && cn(pulse, "rounded-small text-transparent"))}>{d.display ?? d.value.toLocaleString("id-ID")}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
