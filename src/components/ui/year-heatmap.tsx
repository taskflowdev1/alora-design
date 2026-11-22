import * as React from "react";
import { cn, formatNumber, MONTHS, startOfWeek, WEEKDAYS_3 } from "@/lib/ad";
import { useEdgeFade } from "@/lib/ad-hooks";
import { Card } from "@/components/ui/card";
import { RollingNumber } from "@/components/ui/number-dial";

export interface HeatDay {
  date: Date;
  value: number;
}

export interface YearHeatmapProps {
  /** One entry per day, oldest first. */
  days: HeatDay[];
  /** What the readout shows at rest, over the sum of all days. */
  label?: string;
  /** Before the number. */
  unit?: string;
  className?: string;
  "aria-label"?: string;
}

const CSS = `
.ad-yh-grid { display: grid; grid-template-rows: repeat(7, minmax(0, 1fr)); gap: 3px; }
.ad-yh-c {
  aspect-ratio: 1; border-radius: min(3px, var(--ad-radius-small)); background: var(--ad-fill); position: relative;
  transition: scale 130ms var(--ad-ease), box-shadow 130ms var(--ad-ease);
}
.ad-yh-c[data-l="1"] { background: var(--ad-brand-2); }
.ad-yh-c[data-l="2"] { background: var(--ad-brand-3); }
.ad-yh-c[data-l="3"] { background: var(--ad-brand-4); }
.ad-yh-c[data-l="4"] { background: var(--ad-brand-6); }
.ad-yh-c[data-l="5"] { background: var(--ad-brand-7); }
:where(.dark) .ad-yh-c[data-l="1"] { background: var(--ad-brand-9); }
:where(.dark) .ad-yh-c[data-l="2"] { background: var(--ad-brand-8); }
:where(.dark) .ad-yh-c[data-l="3"] { background: var(--ad-brand-7); }
:where(.dark) .ad-yh-c[data-l="4"] { background: var(--ad-brand-6); }
:where(.dark) .ad-yh-c[data-l="5"] { background: var(--ad-brand-5); }
.ad-yh-c[data-on="true"], :where(.dark) .ad-yh-c[data-on="true"] { background: var(--ad-ink); scale: 1.5; z-index: 1; box-shadow: 0 0 0 2px var(--ad-surface); }
@keyframes ad-yh-in { from { opacity: 0; scale: 0.4; } }
.ad-yh[data-in="false"] .ad-yh-c { opacity: 0; }
.ad-yh[data-in="true"] .ad-yh-c { animation: ad-yh-in 380ms var(--ad-ease) backwards; animation-delay: calc(var(--w) * 11ms + var(--d) * 7ms); }
@media (prefers-reduced-motion: reduce) {
  .ad-yh[data-in="false"] .ad-yh-c { opacity: 1; }
  .ad-yh[data-in="true"] .ad-yh-c { animation: none; }
  .ad-yh-c { transition: none; }
}`;

const dateText = (d: Date) => `${WEEKDAYS_3[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const weekOf = (d: Date, first: Date) => Math.round((startOfWeek(d).getTime() - first.getTime()) / (7 * 864e5));

/**
 * A year of daily figures as rounded cells in accent shades, sweeping in the first time it is seen. Hover or arrow to
 * a day and its date and amount change in the fixed readout above, so nothing floats or jumps. Arrows move by day and
 * week, Home and End go to the first and last day, Escape returns to the year's total.
 */
export function YearHeatmap({ days, label = "Sales this year", unit = "Rp", className, "aria-label": ariaLabel }: YearHeatmapProps) {
  const [active, setActive] = React.useState<number | null>(null);
  const [seen, setSeen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  useEdgeFade(scroller, { axis: "x" });

  const { cells, weeks, months, total } = React.useMemo(() => {
    const first = startOfWeek(days[0]?.date ?? new Date());
    const sorted = days
      .map((d) => d.value)
      .filter((v) => v > 0)
      .sort((a, b) => a - b);
    const cut = [0.2, 0.45, 0.7, 0.9].map((q) => sorted[Math.floor(sorted.length * q)] ?? 0);
    const cells = days.map((d) => ({
      ...d,
      week: weekOf(d.date, first),
      dow: (d.date.getDay() + 6) % 7,
      level: d.value <= 0 ? 0 : 1 + cut.filter((c) => d.value >= c).length,
    }));
    const months: { name: string; week: number }[] = [];
    for (const c of cells) {
      if (c.date.getDate() === 1 || (!months.length && c.date.getDate() < 8)) months.push({ name: MONTHS[c.date.getMonth()], week: c.dow === 0 ? c.week : c.week + 1 });
    }
    return { cells, weeks: (cells.at(-1)?.week ?? 0) + 1, months, total: days.reduce((s, d) => s + d.value, 0) };
  }, [days]);

  // The sweep plays once, when the map is really on screen. A phone starts at the newest days.
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    const s = scroller.current;
    if (s) s.scrollLeft = s.scrollWidth;
    return () => io.disconnect();
  }, []);

  const day = active != null ? cells[active] : null;
  const shown = day ? day.value : total;

  const move = (e: React.KeyboardEvent) => {
    const from = active ?? cells.length - 1;
    const by: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1, PageUp: -28, PageDown: 28 };
    let to: number | null = null;
    if (e.key in by) to = active == null ? from : from + by[e.key];
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = cells.length - 1;
    else if (e.key === "Escape") return setActive(null);
    if (to == null) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(cells.length - 1, to));
    setActive(next);
    // Keep the day in view where the map scrolls sideways.
    const s = scroller.current;
    const cell = s?.querySelector<HTMLElement>(`[data-i="${next}"]`);
    if (s && cell) {
      const box = s.getBoundingClientRect();
      const c = cell.getBoundingClientRect();
      if (c.left < box.left + 16) s.scrollLeft -= box.left + 16 - c.left;
      else if (c.right > box.right - 16) s.scrollLeft += c.right - box.right + 16;
    }
  };

  const fromEvent = (e: React.PointerEvent) => {
    const i = (e.target as HTMLElement).closest<HTMLElement>("[data-i]")?.dataset.i;
    if (i != null) setActive(Number(i));
  };

  return (
    <Card className={cn("grid min-w-0 gap-3", className)}>
      <style href="ad-year-heatmap" precedence="default">
        {CSS}
      </style>
      {/* The readout: always this one place and this one height. */}
      <div className="grid min-w-0 gap-0.5">
        <span className="truncate text-body tabular-nums text-ink-muted">{day ? dateText(day.date) : label}</span>
        <span className="flex h-[34px] items-baseline text-[28px] font-semibold leading-[1.2] tracking-[-0.03em] text-ink tabular-nums">
          <span className="mr-[0.22em] text-[length:0.42em] font-medium tracking-normal text-ink-muted">{unit}</span>
          <RollingNumber value={Math.round(shown)} format={(n) => formatNumber(n)} />
        </span>
      </div>
      <div ref={scroller} className="min-w-0 overflow-x-auto overflow-y-hidden py-1 [scrollbar-width:none]">
        <div ref={root} data-in={seen} className="ad-yh grid min-w-[640px] gap-1.5">
          <div aria-hidden className="grid text-small text-ink-muted" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`, columnGap: 3 }}>
            {months.map((m) => (
              <span key={`${m.name}-${m.week}`} className="whitespace-nowrap" style={{ gridColumnStart: Math.min(m.week + 1, weeks), gridRowStart: 1 }}>
                {m.name}
              </span>
            ))}
          </div>
          <div
            role="slider"
            tabIndex={0}
            aria-label={ariaLabel ?? label}
            aria-valuemin={0}
            aria-valuemax={Math.max(0, cells.length - 1)}
            aria-valuenow={active ?? cells.length - 1}
            aria-valuetext={day ? `${dateText(day.date)}, ${unit} ${formatNumber(day.value)}` : `${label}, ${unit} ${formatNumber(total)}`}
            className="ad-yh-grid cursor-default rounded-small outline-none"
            style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
            onPointerOver={fromEvent}
            onPointerDown={fromEvent}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse" && document.activeElement !== e.currentTarget) setActive(null);
            }}
            onKeyDown={move}
            onFocus={(e) => {
              if (e.currentTarget.matches(":focus-visible")) setActive((a) => a ?? cells.length - 1);
            }}
            onBlur={() => setActive(null)}
          >
            {cells.map((c, i) => (
              <span
                key={i}
                data-i={i}
                data-l={c.level}
                data-on={active === i}
                className="ad-yh-c"
                style={{ gridColumn: c.week + 1, gridRow: c.dow + 1, ["--w" as string]: c.week, ["--d" as string]: c.dow }}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
