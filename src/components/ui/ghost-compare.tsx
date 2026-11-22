import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "react-feather";
import { cn, formatNumber, prefersReducedMotion, WEEKDAYS_3 } from "@/lib/ad";

const IN_MS = 280;
const OUT_MS = 200;
/** Under this a press counts as a tap, which latches the comparison open instead of holding it. */
const TAP_MS = 220;
/** How much of the sweep each bar's own fade takes; the rest is the left-to-right stagger. */
const BAR_SHARE = 0.62;

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export interface GhostCompareProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "value"> {
  label?: React.ReactNode;
  /** This period, one number per bar. */
  current?: number[];
  /** Last period, same length. */
  previous?: number[];
  /** One label per bar. */
  labels?: string[];
  /** Index of the bar in the stronger shade (today). */
  today?: number;
  /** The pill at rest, before the comparison is showing. */
  hint?: string;
  /** Shown small before the total. */
  unit?: string;
  /** Called when the comparison shows or hides. */
  onCompareChange?: (comparing: boolean) => void;
}

/**
 * This period's bars, with last period's waiting behind them. Hold the card (or tap it, or press Enter) and the old
 * bars fade in as this week's narrow to make room, while the delta pill counts up with them. Letting go puts it back.
 */
export function GhostCompare({
  label = "Sales this week",
  current = [38200000, 41600000, 35900000, 47100000, 52300000, 61800000, 48240000],
  previous = [34100000, 39800000, 37600000, 41200000, 46900000, 55400000, 44100000],
  labels = WEEKDAYS_3,
  today = 6,
  hint = "Hold for last week",
  unit = "Rp",
  onCompareChange,
  className,
  ...props
}: GhostCompareProps) {
  const [on, setOn] = React.useState(false);
  const root = React.useRef<HTMLButtonElement>(null);
  const pillNumber = React.useRef<HTMLSpanElement>(null);
  const bars = React.useRef<(HTMLSpanElement | null)[]>([]);
  const ghosts = React.useRef<(HTMLSpanElement | null)[]>([]);
  const anim = React.useRef({ p: 0, raf: 0, last: 0 });
  const press = React.useRef({ at: 0, was: false, active: false });
  const hintBox = React.useRef<HTMLSpanElement>(null);
  const deltaBox = React.useRef<HTMLSpanElement>(null);
  const [pillWidths, setPillWidths] = React.useState<[number, number] | null>(null);

  const totalNow = current.reduce((a, b) => a + b, 0);
  const totalThen = previous.reduce((a, b) => a + b, 0);
  const delta = totalThen ? ((totalNow - totalThen) / totalThen) * 100 : 0;
  const max = Math.max(1, ...current, ...previous);
  const up = delta >= 0;

  const paint = React.useCallback(() => {
    const p = anim.current.p;
    const n = current.length;
    for (let i = 0; i < n; i++) {
      const start = n > 1 ? (i / (n - 1)) * (1 - BAR_SHARE) : 0;
      const own = easeOut(clamp01((p - start) / BAR_SHARE));
      const ghost = ghosts.current[i];
      if (ghost) {
        ghost.style.opacity = own.toFixed(3);
        ghost.style.transform = `scaleY(${(0.94 + own * 0.06).toFixed(4)})`;
      }
      const bar = bars.current[i];
      if (bar) bar.style.transform = `scaleX(${(1 - own * 0.44).toFixed(4)})`;
    }
    if (pillNumber.current) pillNumber.current.textContent = `${formatNumber(Math.abs(delta) * easeOut(p), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    root.current?.style.setProperty("--ghost", p.toFixed(3));
  }, [current.length, delta]);

  React.useLayoutEffect(paint, [paint]);

  React.useLayoutEffect(() => {
    const measure = () => {
      if (hintBox.current && deltaBox.current) setPillWidths([hintBox.current.offsetWidth, deltaBox.current.offsetWidth]);
    };
    measure();
    let live = true;
    void document.fonts?.ready.then(() => live && measure());
    return () => {
      live = false;
    };
  }, [hint, delta]);

  React.useEffect(() => {
    const a = anim.current;
    const to = on ? 1 : 0;
    cancelAnimationFrame(a.raf);
    a.raf = 0;
    if (prefersReducedMotion()) {
      a.p = to;
      paint();
      return;
    }
    a.last = performance.now();
    const frame = (t: number) => {
      const dt = Math.max(t - a.last, 0);
      a.last = t;
      const step = dt / (on ? IN_MS : OUT_MS);
      a.p = on ? Math.min(1, a.p + step) : Math.max(0, a.p - step);
      paint();
      a.raf = a.p === to ? 0 : requestAnimationFrame(frame);
    };
    a.raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(a.raf);
      a.raf = 0;
    };
  }, [on, paint]);

  const change = (next: boolean) => {
    setOn(next);
    if (next !== on) onCompareChange?.(next);
  };

  const release = (cancelled = false) => {
    const pr = press.current;
    if (!pr.active) return;
    pr.active = false;
    // A press the browser took over for scrolling changes nothing.
    if (cancelled) change(pr.was);
    else change(performance.now() - pr.at < TAP_MS ? !pr.was : false);
  };

  return (
    <button
      ref={root}
      type="button"
      aria-pressed={on}
      aria-label={`${typeof label === "string" ? label : "Sales"}: ${unit} ${formatNumber(totalNow)}, ${up ? "up" : "down"} ${formatNumber(Math.abs(delta), { maximumFractionDigits: 1 })}% on last period`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        press.current = { at: performance.now(), was: on, active: true };
        e.currentTarget.setPointerCapture(e.pointerId);
        change(true);
      }}
      onPointerUp={() => release()}
      onPointerCancel={() => release(true)}
      onLostPointerCapture={() => release()}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        // Enter and Space arrive as a click with no pointer behind it.
        if (e.detail === 0) change(!on);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && on) change(false);
      }}
      className={cn(
        "grid w-full min-w-0 cursor-pointer touch-pan-y select-none gap-4 rounded-card bg-surface p-pad text-left shadow-card transition-[translate,scale,box-shadow,background-color] duration-[150ms] ease-ad [-webkit-touch-callout:none] hover:-translate-y-0.5 hover:shadow-raised focus-visible:bg-fill active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      <span className="@container grid min-w-0 gap-1">
        <span className="flex min-h-6 items-center justify-between gap-3">
          <span className="truncate text-body text-ink-muted">{label}</span>
          <span
            data-shape="round"
            style={{ width: pillWidths ? pillWidths[on ? 1 : 0] : undefined }}
            className={cn("relative block h-6 shrink-0 overflow-hidden rounded-full text-small font-medium tabular-nums transition-[width,background-color,color] duration-[220ms] ease-ad motion-reduce:transition-none", on ? "bg-brand-soft text-brand-soft-ink" : "bg-fill text-ink-muted")}
          >
            <span ref={hintBox} className={cn("absolute right-0 top-0 inline-flex h-full items-center whitespace-nowrap px-bubble-sm transition-[opacity,translate] duration-[200ms] ease-ad", on ? "-translate-y-1 opacity-0" : "opacity-100")}>
              {hint}
            </span>
            <span ref={deltaBox} className={cn("absolute right-0 top-0 inline-flex h-full items-center gap-0.5 whitespace-nowrap px-bubble-sm transition-[opacity,translate] duration-[200ms] ease-ad", on ? "opacity-100" : "translate-y-1 opacity-0")}>
              {up ? <ArrowUpRight size={14} strokeWidth={1.75} /> : <ArrowDownRight size={14} strokeWidth={1.75} />}
              <span className="inline-grid justify-items-end">
                <span className="invisible col-start-1 row-start-1">{formatNumber(Math.abs(delta), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
                <span ref={pillNumber} className="col-start-1 row-start-1">
                  0,0%
                </span>
              </span>
            </span>
          </span>
        </span>
        <span className="block whitespace-nowrap font-semibold leading-none tracking-[-0.035em] text-ink tabular-nums" style={{ fontSize: "min(52px, 11.5cqi)" }}>
          {unit ? <span className="mr-[0.22em] text-[length:0.34em] font-medium tracking-normal text-ink-muted">{unit}</span> : null}
          {formatNumber(totalNow)}
        </span>
      </span>
      <span aria-hidden className="grid gap-2">
        <span className="flex h-[150px] items-end gap-[clamp(4px,1.6cqi,10px)]">
          {current.map((v, i) => (
            <span key={labels[i] ?? i} className="relative flex h-full min-w-0 flex-1 items-end justify-center">
              <span
                ref={(el) => {
                  ghosts.current[i] = el;
                }}
                className="absolute inset-x-0 bottom-0 origin-bottom rounded-item bg-fill-strong opacity-0"
                style={{ height: `${Math.max(3, ((previous[i] ?? 0) / max) * 100)}%` }}
              />
              <span
                ref={(el) => {
                  bars.current[i] = el;
                }}
                className={cn("relative w-full origin-bottom rounded-item", i === today ? "bg-chart-1" : "bg-chart-3")}
                style={{ height: `${Math.max(3, (v / max) * 100)}%` }}
              />
            </span>
          ))}
        </span>
        <span className="flex gap-[clamp(4px,1.6cqi,10px)] text-small text-ink-muted">
          {current.map((_, i) => (
            <span key={labels[i] ?? i} className={cn("min-w-0 flex-1 truncate text-center", i === today && "font-medium text-ink")}>
              {labels[i]}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
