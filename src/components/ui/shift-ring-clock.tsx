import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

const DAY = 1440;
const SIZE = 320;
const C = SIZE / 2;
const R = 126;
const RING = 32;

const CSS = `
.ad-shift { container-type: inline-size; }
.ad-shift-hit { pointer-events: stroke; touch-action: none; cursor: grab; }
.ad-shift-handle { touch-action: none; cursor: grab; outline: none; }
.ad-shift[data-dragging] .ad-shift-hit, .ad-shift[data-dragging] .ad-shift-handle { cursor: grabbing; }
/* grey-ok: the handle's soft shadow on the ring */
.ad-shift-knob { fill: var(--ad-thumb); filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.38)); transition: fill 120ms var(--ad-ease); }
.ad-shift-handle:focus-visible .ad-shift-knob { fill: var(--ad-fill-strong); }
.ad-shift-strip { transition: transform 240ms var(--ad-ease); }
.ad-shift-tens { transition: width 180ms var(--ad-ease), opacity 180ms var(--ad-ease); }`;

const mod = (m: number) => ((m % DAY) + DAY) % DAY;
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (m: number) => `${pad(Math.floor(mod(m) / 60))}:${pad(mod(m) % 60)}`;
const at = (m: number, r: number) => {
  const a = (m / DAY) * 2 * Math.PI - Math.PI / 2;
  return { x: C + Math.cos(a) * r, y: C + Math.sin(a) * r };
};
const arcGap = (a: number, b: number) => {
  const d = Math.abs(mod(a) - mod(b));
  return Math.min(d, DAY - d);
};

/** One digit on a strip of 0–9 that rolls to its place. */
function Roll({ digit }: { digit: number }) {
  return (
    <span className="inline-block h-[1em] overflow-hidden leading-none">
      <span className="ad-shift-strip block" style={{ transform: `translateY(${-digit * 10}%)` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="block h-[1em] leading-none">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

export interface ShiftValue {
  /** Minutes after midnight, 0–1439. */
  start: number;
  /** Minutes after midnight, 0–1439. Earlier than `start` means the shift runs past midnight. */
  end: number;
}

export interface ShiftRingClockProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  value?: ShiftValue;
  defaultValue?: ShiftValue;
  onValueChange?: (value: ShiftValue) => void;
  /** Minutes between snap points. */
  step?: number;
  /** The shortest shift, in minutes. */
  minLength?: number;
  /** The longest shift, in minutes. */
  maxLength?: number;
}

/**
 * A 24-hour dial for setting a shift. Drag either end, or the arc itself to move the whole shift; it wraps past
 * midnight, an end pushed into the other carries it along, and the hours roll at the centre.
 */
export function ShiftRingClock({
  value,
  defaultValue = { start: 22 * 60, end: 6 * 60 },
  onValueChange,
  step = 15,
  minLength = 60,
  maxLength = 23 * 60,
  className,
  ...props
}: ShiftRingClockProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const shift = value ?? inner;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const arcRef = React.useRef<SVGCircleElement>(null);
  const startRef = React.useRef<SVGGElement>(null);
  const endRef = React.useRef<SVGGElement>(null);
  const [dragging, setDragging] = React.useState(false);
  // The live, unsnapped ends while a hand is on the dial. `start` and `end` may run past a day; paint wraps them.
  const pos = React.useRef({ s: shift.start, e: shift.start + mod(shift.end - shift.start) });
  const drag = React.useRef<{ id: number; part: "start" | "end" | "move"; angle: number } | null>(null);
  const raf = React.useRef(0);
  // True while a released handle eases onto its snap point, so the new value doesn't jump it there first.
  const settling = React.useRef(false);

  const paint = React.useCallback((s: number, e: number) => {
    const len = e - s;
    arcRef.current?.setAttribute("stroke-dasharray", `${len.toFixed(2)} ${DAY}`);
    arcRef.current?.setAttribute("transform", `rotate(${(s / 4 - 90).toFixed(3)} ${C} ${C})`);
    const a = at(s, R);
    const b = at(e, R);
    startRef.current?.setAttribute("transform", `translate(${a.x.toFixed(2)} ${a.y.toFixed(2)})`);
    endRef.current?.setAttribute("transform", `translate(${b.x.toFixed(2)} ${b.y.toFixed(2)})`);
  }, []);

  const live = React.useRef({ shift, step, minLength, maxLength, onValueChange });
  live.current = { shift, step, minLength, maxLength, onValueChange };
  const emit = React.useCallback((s: number, e: number) => {
    const { shift, step, onValueChange } = live.current;
    const snappedStart = Math.round(s / step) * step;
    const length = Math.round((e - s) / step) * step;
    const next = { start: mod(snappedStart), end: mod(snappedStart + length) };
    if (next.start === shift.start && next.end === shift.end) return;
    live.current.shift = next;
    setInner(next);
    onValueChange?.(next);
  }, []);

  React.useLayoutEffect(() => {
    if (drag.current || settling.current) return;
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    const s = shift.start;
    const e = s + (mod(shift.end - shift.start) || DAY);
    pos.current = { s, e };
    paint(s, e);
  }, [shift.start, shift.end, paint]);

  React.useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const pointerMinutes = (e: React.PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    return mod(((Math.atan2(y, x) * 180) / Math.PI + 90) * 4);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    const tagged = target.closest<SVGElement>("[data-part]")?.dataset.part as "start" | "end" | "ring" | undefined;
    if (e.button !== 0 || !tagged) return;
    const m = pointerMinutes(e);
    const { s, e: end } = pos.current;
    let part: "start" | "end" | "move";
    if (tagged === "start" || tagged === "end") part = tagged;
    else {
      const toStart = arcGap(m, s);
      const toEnd = arcGap(m, end);
      const inside = mod(m - s) <= end - s;
      // Near an end grabs that end, anywhere else on the arc carries the whole shift.
      if (Math.min(toStart, toEnd) < 45) part = toStart < toEnd ? "start" : "end";
      else if (inside) part = "move";
      else part = toStart < toEnd ? "start" : "end";
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    settling.current = false;
    drag.current = { id: e.pointerId, part, angle: m };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (d?.id !== e.pointerId) return;
    const m = pointerMinutes(e);
    let delta = m - d.angle;
    if (delta > DAY / 2) delta -= DAY;
    if (delta < -DAY / 2) delta += DAY;
    d.angle = m;
    const { minLength, maxLength } = live.current;
    let { s, e: end } = pos.current;
    if (d.part === "move") {
      s += delta;
      end += delta;
    } else if (d.part === "end") {
      end += delta;
      // Pushed into its other end, it carries that end along.
      if (end - s < minLength) s = end - minLength;
      if (end - s > maxLength) s = end - maxLength;
    } else {
      s += delta;
      if (end - s < minLength) end = s + minLength;
      if (end - s > maxLength) end = s + maxLength;
    }
    pos.current = { s, e: end };
    paint(s, end);
    emit(s, end);
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    const { step } = live.current;
    const { s, e: end } = pos.current;
    const toS = Math.round(s / step) * step;
    const toE = toS + Math.round((end - s) / step) * step;
    if (prefersReducedMotion()) {
      pos.current = { s: toS, e: toE };
      paint(toS, toE);
      emit(toS, toE);
      return;
    }
    settling.current = true;
    emit(toS, toE);
    // The last few degrees ease onto the snap point.
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 180);
      const ease = 1 - (1 - k) ** 3;
      const ns = s + (toS - s) * ease;
      const ne = end + (toE - end) * ease;
      pos.current = { s: ns, e: ne };
      paint(ns, ne);
      if (k >= 1) settling.current = false;
      raf.current = k < 1 ? requestAnimationFrame(tick) : 0;
    };
    raf.current = requestAnimationFrame(tick);
  };

  const onHandleKey = (part: "start" | "end") => (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const { step, minLength, maxLength } = live.current;
    const by = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 60, PageDown: -60 }[e.key];
    if (by === undefined) return;
    e.preventDefault();
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    settling.current = false;
    // A key press during the settle starts from where the handle is going, on the grid.
    const from = live.current.shift;
    let s = from.start;
    let end = s + (mod(from.end - from.start) || DAY);
    if (part === "start") {
      s += by;
      if (end - s < minLength) end = s + minLength;
      if (end - s > maxLength) end = s + maxLength;
    } else {
      end += by;
      if (end - s < minLength) s = end - minLength;
      if (end - s > maxLength) s = end - maxLength;
    }
    pos.current = { s, e: end };
    paint(s, end);
    emit(s, end);
  };

  const length = mod(shift.end - shift.start) || DAY;
  const hours = Math.floor(length / 60);
  const minutes = length % 60;
  const overnight = shift.end <= shift.start;
  const a = at(shift.start, R);
  const b = at(shift.start + length, R);

  return (
    <div ref={rootRef} data-dragging={dragging ? "" : undefined} className={cn("ad-shift relative aspect-square w-[340px] max-w-full select-none", className)} {...props}>
      <style href="ad-shift-ring-clock" precedence="default">
        {CSS}
      </style>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--ad-fill)" strokeWidth={RING} />
        {Array.from({ length: 24 }, (_, h) => {
          const m = h * 60;
          const big = h % 6 === 0;
          const inShift = mod(m - shift.start) <= length;
          const p = at(m, R - RING / 2 - 6);
          const q = at(m, R - RING / 2 - (big ? 13 : 10));
          return <line key={`h-${h}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={inShift ? "var(--ad-ink-muted)" : "var(--ad-fill-strong)"} strokeWidth={big ? 2 : 1.5} strokeLinecap="round" />;
        })}
        {[0, 6, 12, 18].map((h) => {
          const p = at(h * 60, R - RING / 2 - 26);
          return (
            <text key={`label-${h}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="var(--ad-ink-muted)" className="tabular-nums">
              {pad(h)}
            </text>
          );
        })}
        <circle
          ref={arcRef}
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="var(--ad-brand)"
          strokeWidth={RING}
          strokeLinecap="round"
          pathLength={DAY}
          strokeDasharray={`${length} ${DAY}`}
          transform={`rotate(${shift.start / 4 - 90} ${C} ${C})`}
        />
        <circle data-part="ring" className="ad-shift-hit" cx={C} cy={C} r={R} fill="none" stroke="transparent" strokeWidth={RING + 22} />
        <g
          ref={startRef}
          data-part="start"
          role="slider"
          tabIndex={0}
          aria-label="Shift start"
          aria-valuemin={0}
          aria-valuemax={DAY - 1}
          aria-valuenow={shift.start}
          aria-valuetext={clock(shift.start)}
          onKeyDown={onHandleKey("start")}
          className="ad-shift-handle"
          transform={`translate(${a.x} ${a.y})`}
        >
          <circle r={22} fill="transparent" />
          <circle r={12} className="ad-shift-knob" />
        </g>
        <g
          ref={endRef}
          data-part="end"
          role="slider"
          tabIndex={0}
          aria-label="Shift end"
          aria-valuemin={0}
          aria-valuemax={DAY - 1}
          aria-valuenow={shift.end}
          aria-valuetext={clock(shift.end)}
          onKeyDown={onHandleKey("end")}
          className="ad-shift-handle"
          transform={`translate(${b.x} ${b.y})`}
        >
          <circle r={22} fill="transparent" />
          <circle r={12} className="ad-shift-knob" />
          <circle r={4} fill="var(--ad-brand)" />
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-content-center justify-items-center gap-[2.4cqw]">
        <span className="sr-only">{`${hours} hours ${minutes} minutes, ${clock(shift.start)} to ${clock(shift.end)}`}</span>
        {/* Bottom-aligned, not on the baseline: a clipped inline-block's baseline is its bottom edge, which skews the digits. */}
        <span aria-hidden className="inline-flex items-end text-[11.5cqw] font-semibold leading-none tabular-nums text-ink">
          <span className="ad-shift-tens inline-flex h-[1em] overflow-hidden" style={{ width: hours >= 10 ? "1ch" : 0, opacity: hours >= 10 ? 1 : 0 }}>
            <Roll digit={Math.floor(hours / 10)} />
          </span>
          <Roll digit={hours % 10} />
          <span className="mb-[0.1em] ml-[0.12em] mr-[0.34em] text-[0.46em] font-medium leading-none text-ink-muted">h</span>
          <Roll digit={Math.floor(minutes / 10)} />
          <Roll digit={minutes % 10} />
          <span className="mb-[0.1em] ml-[0.12em] text-[0.46em] font-medium leading-none text-ink-muted">m</span>
        </span>
        <span aria-hidden className="relative text-[4.6cqw] font-medium tabular-nums text-ink-muted">
          {clock(shift.start)} – {clock(shift.end)}
          {overnight && <span className="absolute left-full top-0 ml-[0.3em] text-[0.74em] leading-none">+1</span>}
        </span>
      </div>
    </div>
  );
}
