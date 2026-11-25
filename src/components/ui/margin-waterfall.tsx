import * as React from "react";
import { cn, formatNumber } from "@/lib/ad";
import { Card } from "@/components/ui/card";
import { RollingNumber } from "@/components/ui/number-dial";
import { Segmented } from "@/components/ui/segmented";

export interface WaterfallStep {
  id: string;
  /** The full name, shown in the readout: "Marketplace fees". */
  label: string;
  /** The short one under its bar: "Fees". */
  short?: string;
  /** What this step takes off, as a positive amount. */
  value: number;
}

export interface WaterfallPeriod {
  id: string;
  label: string;
  revenue: number;
  steps: WaterfallStep[];
}

export interface MarginWaterfallProps {
  /** Every period must list the same steps in the same order, so the bars can morph between them. */
  periods: WaterfallPeriod[];
  defaultPeriod?: string;
  revenueLabel?: string;
  profitLabel?: string;
  unit?: string;
  onPeriodChange?: (id: string) => void;
  className?: string;
}

const CSS = `
.ad-wf-bar {
  position: absolute; left: 0; right: 0; border-radius: var(--ad-radius-small);
  transition: top 460ms var(--ad-ease), height 460ms var(--ad-ease), opacity 160ms var(--ad-ease), clip-path 420ms var(--ad-ease);
  transition-delay: 0ms, 0ms, 0ms, calc(var(--i) * 110ms);
}
.ad-wf[data-in="false"] .ad-wf-bar { clip-path: inset(0 0 100% 0 round var(--ad-radius-small)); }
.ad-wf[data-in="false"] .ad-wf-bar[data-kind="total"] { clip-path: inset(100% 0 0 0 round var(--ad-radius-small)); }
.ad-wf[data-in="true"] .ad-wf-bar { clip-path: inset(0 0 0 0 round var(--ad-radius-small)); }
@media (prefers-reduced-motion: reduce) {
  .ad-wf-bar { transition: none; }
  .ad-wf[data-in="false"] .ad-wf-bar, .ad-wf[data-in="false"] .ad-wf-bar[data-kind="total"] { clip-path: none; }
}`;

const pctText = (n: number) => `${formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/**
 * From revenue down to profit: one bar for the money in, one step down for each cost, one bar for what is left. Hover
 * or arrow to a step for its amount and share in the fixed readout; switching period morphs the bars and rolls the
 * figures.
 */
export function MarginWaterfall({ periods, defaultPeriod, revenueLabel = "Revenue", profitLabel = "Profit", unit = "Rp", onPeriodChange, className }: MarginWaterfallProps) {
  const [periodId, setPeriodId] = React.useState(defaultPeriod ?? periods[0]?.id);
  const [active, setActive] = React.useState<number | null>(null);
  const [cursor, setCursor] = React.useState(0);
  const [seen, setSeen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const bars = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const period = periods.find((p) => p.id === periodId) ?? periods[0];
  const top = Math.max(...periods.map((p) => p.revenue), 1);
  const spent = period.steps.reduce((s, x) => s + x.value, 0);
  const profit = period.revenue - spent;

  let level = period.revenue;
  const columns = [
    { id: "revenue", label: revenueLabel, short: revenueLabel, value: period.revenue, from: period.revenue, to: 0, kind: "total" as const },
    ...period.steps.map((s) => {
      const from = level;
      level -= s.value;
      return { id: s.id, label: s.label, short: s.short ?? s.label, value: s.value, from, to: level, kind: "step" as const };
    }),
    { id: "profit", label: profitLabel, short: profitLabel, value: profit, from: Math.max(profit, 0), to: 0, kind: "total" as const },
  ];
  const restIndex = columns.length - 1;
  const shown = columns[active ?? restIndex];
  const share = period.revenue ? (shown.value / period.revenue) * 100 : 0;

  const focusBar = (i: number) => {
    const next = Math.max(0, Math.min(columns.length - 1, i));
    setCursor(next);
    setActive(next);
    bars.current[next]?.focus();
  };

  return (
    <Card className={cn("grid min-w-0 gap-4", className)}>
      <style href="ad-margin-waterfall" precedence="default">
        {CSS}
      </style>
      <div className="grid min-w-0 gap-1">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="min-w-0 truncate text-body text-ink-muted">{shown.label}</span>
          <Segmented
            aria-label="Period"
            value={period.id}
            options={periods.map((p) => ({ value: p.id, label: p.label }))}
            onValueChange={(id) => {
              setPeriodId(id);
              onPeriodChange?.(id);
            }}
          />
        </div>
        <div aria-live="polite" className="flex h-[38px] min-w-0 items-baseline gap-2 tabular-nums">
          <span className="flex items-baseline text-[30px] font-semibold leading-[1.2] tracking-[-0.03em] text-ink">
            <span className="mr-[0.22em] text-[length:0.42em] font-medium tracking-normal text-ink-muted">{unit}</span>
            <RollingNumber value={Math.round(shown.value)} format={(n) => formatNumber(n)} />
          </span>
          <RollingNumber value={Math.round(share * 10) / 10} format={pctText} className="text-body text-ink-muted" />
        </div>
      </div>
      <div
        ref={root}
        data-in={seen}
        className="ad-wf grid min-w-0 gap-1 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse" && !root.current?.contains(document.activeElement)) setActive(null);
        }}
      >
        {columns.map((c, i) => {
          const dim = active != null && active !== i;
          return (
            <button
              key={c.id}
              ref={(el) => {
                bars.current[i] = el;
              }}
              type="button"
              tabIndex={cursor === i ? 0 : -1}
              aria-label={`${c.label}, ${unit} ${formatNumber(Math.round(c.value))}, ${pctText(period.revenue ? (c.value / period.revenue) * 100 : 0)}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => {
                setCursor(i);
                setActive(i);
              }}
              onBlur={() => setActive(null)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  focusBar(i + 1);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  focusBar(i - 1);
                } else if (e.key === "Home") {
                  e.preventDefault();
                  focusBar(0);
                } else if (e.key === "End") {
                  e.preventDefault();
                  focusBar(columns.length - 1);
                }
              }}
              className="group grid min-w-0 cursor-default gap-2 rounded-item outline-none"
            >
              <span className="relative block h-[176px] rounded-small">
                <span
                  data-kind={c.kind}
                  className={cn("ad-wf-bar", c.kind === "total" ? "bg-chart-1" : "bg-brand-3 dark:bg-brand-7", dim && "opacity-40")}
                  style={{
                    top: `${(1 - c.from / top) * 100}%`,
                    height: `${Math.max(((c.from - c.to) / top) * 100, 1)}%`,
                    ["--i" as string]: i,
                  }}
                />
              </span>
              <span className={cn("truncate text-center text-small transition-colors duration-[150ms] ease-ad", active === i ? "font-medium text-ink" : "text-ink-muted")}>{c.short}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
