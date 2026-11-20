import * as React from "react";
import { cn } from "@/lib/ad";

export interface ScrubPoint {
  label: string;
  value: number;
  /** How the value reads while scrubbed ("Rp 6,8 jt"). */
  display?: string;
}

export interface MobileScrubChartProps {
  /** What the number is ("Sales today"). While scrubbing it shows the point's label instead. */
  label: string;
  /** The resting number (the total). While scrubbing it shows the point's value instead. */
  value: React.ReactNode;
  data: ScrubPoint[];
  kind?: "line" | "bars";
  height?: number;
  /** Bars: the index drawn in the darker shade at rest (today). */
  current?: number;
  /** Label every nth point along the bottom (0: none). */
  labelEvery?: number;
  /**
   * Scrub only after a still press (200 ms), so a swipe that starts on the chart pages its carousel instead. On by
   * default inside a MobileKpiCarousel.
   */
  holdToScrub?: boolean;
  className?: string;
}

/** Set by MobileKpiCarousel: charts inside paged cards scrub only after a press-and-hold (Apple Health). */
export const ScrubHold = React.createContext(false);

/**
 * A chart you read with your finger: there is no hover on a phone, so drag across it and the number on top turns into
 * the point under the finger (its label and value), the line or bar under it darkens, and the rest steps back. Let go
 * and it returns to the total after a moment. It waits to see the gesture first: a sideways move (or a still press)
 * scrubs, a vertical one scrolls the page and leaves the number alone. Arrow keys step through the points too, and
 * keyboard focus shows the current point. Shades of the one accent; no axes, no grid lines.
 */
export function MobileScrubChart({ label, value, data, kind = "line", height = 120, current, labelEvery = 0, holdToScrub, className }: MobileScrubChartProps) {
  const hold = useHold(holdToScrub);
  const box = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(320);
  const [at, setAt] = React.useState<number | null>(null);
  const heldRef = React.useRef(false);
  const timer = React.useRef(0);
  const holdTimer = React.useRef(0);
  const start = React.useRef<{ x: number; y: number } | null>(null);
  const gid = React.useId();
  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.offsetWidth));
    ro.observe(el);
    setW(el.offsetWidth);
    return () => (ro.disconnect(), window.clearTimeout(timer.current), window.clearTimeout(holdTimer.current));
  }, []);
  // In hold mode the page may pan sideways, so once a hold has started scrubbing, stop the pan by hand.
  React.useEffect(() => {
    const el = box.current;
    if (!el || !hold) return;
    const stop = (e: TouchEvent) => heldRef.current && e.cancelable && e.preventDefault();
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  }, [hold]);
  const index = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    return Math.max(0, Math.min(data.length - 1, kind === "bars" ? Math.floor(x * data.length) : Math.round(x * (data.length - 1))));
  };
  const begin = (clientX: number) => {
    window.clearTimeout(timer.current);
    heldRef.current = true;
    setAt(index(clientX));
  };
  const release = () => {
    window.clearTimeout(holdTimer.current);
    start.current = null;
    if (!heldRef.current) return;
    heldRef.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAt(null), 1200);
  };
  const p = at != null ? data[at] : null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = kind === "line" ? Math.min(...data.map((d) => d.value)) : 0;
  const pad = 4;
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(" ");
  return (
    <figure className={cn("grid gap-2", className)}>
      <figcaption className="grid gap-1" aria-live="polite">
        <span className="text-[13px] text-ink-muted">{p ? p.label : label}</span>
        <span className="text-[24px] font-semibold leading-tight tabular-nums text-ink">{p ? (p.display ?? p.value.toLocaleString("id-ID")) : value}</span>
      </figcaption>
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label={`${label}, drag to read`}
        aria-valuemin={0}
        aria-valuemax={data.length - 1}
        aria-valuenow={at ?? undefined}
        aria-valuetext={p ? `${p.label}: ${p.display ?? p.value}` : undefined}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          // A mouse can't be scrolling: scrub at once. A finger might be starting a scroll: wait and see.
          if (e.pointerType === "mouse") return begin(e.clientX);
          const x0 = e.clientX;
          start.current = { x: x0, y: e.clientY };
          window.clearTimeout(holdTimer.current);
          holdTimer.current = window.setTimeout(() => start.current && begin(x0), hold ? 200 : 150);
        }}
        onPointerMove={(e) => {
          if (heldRef.current) return setAt(index(e.clientX));
          const s0 = start.current;
          if (!s0) return;
          const dx = e.clientX - s0.x;
          const dy = e.clientY - s0.y;
          if (!hold && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
            window.clearTimeout(holdTimer.current);
            begin(e.clientX);
          } else if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
            // Moved before it scrubbed: a scroll or a page swipe, not ours.
            window.clearTimeout(holdTimer.current);
            start.current = null;
          }
        }}
        onPointerUp={release}
        onPointerCancel={() => {
          // The browser took the gesture (a scroll): drop the reading at once, no lingering number.
          window.clearTimeout(holdTimer.current);
          start.current = null;
          heldRef.current = false;
          setAt(null);
        }}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && setAt((a) => a ?? current ?? data.length - 1)}
        onBlur={() => setAt(null)}
        onKeyDown={(e) => {
          const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          setAt((a) => Math.max(0, Math.min(data.length - 1, (a ?? (d > 0 ? -1 : data.length)) + d)));
        }}
        className={cn("relative cursor-pointer select-none outline-none [-webkit-tap-highlight-color:transparent]", hold ? "touch-manipulation" : "touch-pan-y")}
        style={{ height }}
      >
        {kind === "line" ? (
          <svg aria-hidden width={w} height={height} className="block overflow-visible">
            <defs>
              <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--ad-chart-1)" stopOpacity="0.2" />
                <stop offset="1" stopColor="var(--ad-chart-1)" stopOpacity="0" />
              </linearGradient>
              <clipPath id={`${gid}-l`}>
                <rect x="0" y="-10" width={at != null ? x(at) : w} height={height + 20} />
              </clipPath>
            </defs>
            <path d={`${line} L${x(data.length - 1)} ${height} L${x(0)} ${height} Z`} fill={`url(#${gid})`} clipPath={`url(#${gid}-l)`} />
            <path d={line} fill="none" stroke={at != null ? "var(--ad-chart-3)" : "var(--ad-chart-1)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {at != null ? (
              <>
                <path d={line} fill="none" stroke="var(--ad-chart-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" clipPath={`url(#${gid}-l)`} />
                <circle cx={x(at)} cy={y(data[at].value)} r="5" fill="var(--ad-chart-1)" />
              </>
            ) : null}
          </svg>
        ) : (
          <div aria-hidden className="flex h-full items-end gap-[3px]">
            {data.map((d, i) => (
              <span key={i} className="flex h-full flex-1 items-end justify-center">
                <span
                  className={cn(
                    "w-full max-w-[10px] rounded-small transition-[background-color] duration-[120ms] ease-ad",
                    at != null ? (i === at ? "bg-chart-1" : "bg-chart-3") : i === current ? "bg-chart-1" : current != null ? "bg-chart-3" : "bg-chart-2",
                  )}
                  style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
                />
              </span>
            ))}
          </div>
        )}
      </div>
      {labelEvery ? (
        <div aria-hidden className="flex justify-between gap-[3px] text-[12px] tabular-nums text-ink-muted">
          {data.map((d, i) => (
            <span key={i} className={cn("flex min-w-0 flex-1 whitespace-nowrap", kind === "bars" ? "justify-center" : i === 0 ? "justify-start" : i === data.length - 1 ? "justify-end" : "justify-center")}>
              {i % labelEvery === 0 ? d.label : ""}
            </span>
          ))}
        </div>
      ) : null}
    </figure>
  );
}

function useHold(own: boolean | undefined) {
  const inCarousel = React.useContext(ScrubHold);
  return own ?? inCarousel;
}
