import * as React from "react";
import { cn, formatNumber, prefersReducedMotion } from "@/lib/ad";

const KEYFRAMES = `@keyframes ad-digit-in { from { opacity: 0; transform: translateY(calc(var(--ad-dir) * 0.55em)); filter: blur(var(--ad-blur, 0px)); } }
@keyframes ad-digit-out { to { opacity: 0; transform: translateY(calc(var(--ad-dir) * -0.55em)); filter: blur(var(--ad-blur, 0px)); } }`;

/** One digit slot: when its character changes, the old one leaves and the new one arrives in the direction of change. */
function Digit({ ch, dir, instant }: { ch: string; dir: 1 | -1; instant?: boolean }) {
  const [s, setS] = React.useState({ cur: ch, prev: null as string | null, n: 0, dir });
  // Derived during render (React's documented pattern): only a changed digit gets a new key, so only it animates.
  if (s.cur !== ch) setS({ cur: ch, prev: s.cur, n: s.n + 1, dir });
  return (
    <span className="relative inline-block" style={{ ["--ad-dir" as string]: s.dir }}>
      {s.prev != null && s.n > 0 && !instant ? (
        <span key={`o${s.n}`} aria-hidden className="absolute inset-0 animate-[ad-digit-out_160ms_var(--ad-ease)_forwards]">
          {s.prev}
        </span>
      ) : null}
      <span key={`i${s.n}`} className={cn("inline-block", s.n > 0 && !instant && "animate-[ad-digit-in_200ms_var(--ad-ease)]")}>
        {s.cur}
      </span>
    </span>
  );
}

export interface RollingNumberProps {
  value: number;
  /** Formats the value; each character gets its own slot, aligned from the right. Default: locale grouping. */
  format?: (n: number) => string;
  /** A 2 px motion blur on the rolling digits. Showcase pages only; product screens keep it off. */
  blur?: boolean;
  /** Swap digits without rolling (a change from the keyboard: key repeat would keep it rolling nonstop). */
  instant?: boolean;
  className?: string;
}

/**
 * A number that changes digit by digit: only the digits that changed roll, up when the value grows and down when it
 * shrinks. Tabular figures and overflow clipping keep the width and the line still.
 */
export function RollingNumber({ value, format = formatNumber, blur, instant, className }: RollingNumberProps) {
  const prev = React.useRef(value);
  const dir: 1 | -1 = value >= prev.current ? 1 : -1;
  // Changes closer together than the roll (a held arrow key, a fast wheel) swap at once instead of replaying it.
  const changedAt = React.useRef(-Infinity);
  const rapid = React.useRef(false);
  if (value !== prev.current) rapid.current = performance.now() - changedAt.current < 220;
  React.useEffect(() => {
    if (prev.current !== value) changedAt.current = performance.now();
    prev.current = value;
  }, [value]);
  const still = instant || rapid.current;
  // A plain space would collapse inside its own slot ("Rp1.896.000"), so it holds a non-breaking one.
  const chars = format(value)
    .split("")
    .map((c) => (c === " " ? "\u00a0" : c));
  return (
    <span className={cn("inline-flex overflow-hidden tabular-nums", className)} style={{ ["--ad-blur" as string]: blur ? "2px" : "0px" }}>
      <style href="ad-number-dial" precedence="default">
        {KEYFRAMES}
      </style>
      <span className="sr-only">{chars.join("")}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((c, i) => (
          // Keyed from the right, so 99 → 100 keeps the ones and tens slots and adds a hundreds slot.
          <Digit key={chars.length - i} ch={c} dir={dir} instant={still} />
        ))}
      </span>
    </span>
  );
}

/** The big number, as a value to click and as the field it turns into: one box, so nothing moves between them. */
const numberBox =
  "rounded-control px-nest text-[calc(var(--ad-text-number)*1.6)] font-semibold leading-[1.15] tabular-nums text-ink transition-colors duration-[150ms] ease-ad";

export interface NumberDialProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** A labelled long tick every this many values. */
  majorEvery?: number;
  /** Pixels between two values on the ruler. */
  spacing?: number;
  /** Muted word after the number ("days", "pcs"). */
  unit?: React.ReactNode;
  /** Motion blur on the rolling digits (showcase only). */
  blur?: boolean;
  /** Called once per whole value the ruler passes, for a tick sound or haptic in a showcase. */
  onTick?: (value: number) => void;
  className?: string;
  "aria-label"?: string;
}

/**
 * Pick a whole number by dragging a ruler. The whole width drags (1:1 under the pointer), a flick glides and slows to
 * a stop, it always settles on a whole value, and the number above is the biggest thing on the card, rolling only the
 * digit that changed. Keyboard: arrows step, Page Up/Down jump a major tick, Home/End, and typing digits sets it.
 * Click the number to type one: the ruler glides there and the digits roll on the way.
 */
export function NumberDial({ value, onValueChange, min = 0, max = 100, majorEvery = 10, spacing = 9, unit, blur, onTick, className, ...aria }: NumberDialProps) {
  const strip = React.useRef<HTMLDivElement>(null);
  const box = React.useRef<HTMLDivElement>(null);
  const pos = React.useRef(value);
  const shown = React.useRef(value);
  const raf = React.useRef(0);
  const drag = React.useRef<{ x: number; t: number; v: number; raw: number } | null>(null);
  const typed = React.useRef({ s: "", t: 0 });
  // Changes from the keyboard swap the digits at once; a drag or wheel goes back to rolling.
  const [keyed, setKeyed] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const cb = React.useRef({ onValueChange, onTick });
  cb.current = { onValueChange, onTick };

  const clamp = React.useCallback((n: number) => Math.min(max, Math.max(min, n)), [min, max]);
  // Draws the ruler at pos (fractional), and reports each whole value it passes (not while it follows an outside change).
  const paint = React.useCallback((report = true) => {
    const el = strip.current;
    const w = box.current?.clientWidth ?? 0;
    if (el) el.style.transform = `translateX(${w / 2 - (pos.current - min) * spacing - spacing / 2}px)`;
    const whole = clamp(Math.round(pos.current));
    if (report && whole !== shown.current) {
      shown.current = whole;
      cb.current.onTick?.(whole);
      cb.current.onValueChange(whole);
    }
  }, [clamp, min, spacing]);

  /** Glide to `target` with a critically damped spring that starts at velocity v (values per second): no overshoot. */
  const settle = React.useCallback(
    (target: number, v = 0, report = true) => {
      cancelAnimationFrame(raf.current);
      if (prefersReducedMotion()) {
        pos.current = target;
        return paint(report);
      }
      const x0 = pos.current - target;
      const w = 9; // stiffness: about 0.5 s to settle from rest
      const t0 = performance.now();
      const step = (now: number) => {
        const t = (now - t0) / 1000;
        const x = (x0 + (v + w * x0) * t) * Math.exp(-w * t);
        pos.current = target + x;
        paint(report);
        if (Math.abs(x) > 0.002 || t < 0.05) raf.current = requestAnimationFrame(step);
        else {
          pos.current = target;
          paint(report);
        }
      };
      raf.current = requestAnimationFrame(step);
    },
    [paint],
  );

  // An outside change (or a key) moves the ruler to the new value.
  React.useLayoutEffect(() => {
    if (drag.current || value === shown.current) return paint(false);
    shown.current = value;
    settle(value, 0, false);
  }, [value, paint, settle]);
  React.useLayoutEffect(() => {
    const ro = new ResizeObserver(() => paint(false));
    if (box.current) ro.observe(box.current);
    return () => (ro.disconnect(), cancelAnimationFrame(raf.current));
  }, [paint]);

  const set = (n: number) => {
    const v = clamp(Math.round(n));
    cancelAnimationFrame(raf.current);
    // Keys jump: keyboard changes never animate the ruler.
    pos.current = v;
    paint();
  };

  // Typing a value: the number turns into a field in place; Enter or leaving it sends the ruler gliding there, the
  // digits rolling through every value it passes. Esc puts it back.
  const [draft, setDraft] = React.useState<string | null>(null);
  const commit = () => {
    if (draft == null) return;
    setDraft(null);
    const n = Number(draft);
    if (draft === "" || !Number.isFinite(n)) return;
    setKeyed(false);
    settle(clamp(Math.round(n)), 0, true);
  };

  const ticks = [];
  for (let n = min; n <= max; n++) {
    const major = (n - min) % majorEvery === 0;
    ticks.push(
      <span key={n} className="relative flex h-full shrink-0 justify-center" style={{ width: spacing }}>
        <span className={cn("mt-2 w-px rounded-full", major ? "h-5 bg-ink-muted" : "h-3 bg-fill-strong")} />
        {major ? <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-small tabular-nums text-ink-muted">{n}</span> : null}
      </span>,
    );
  }

  return (
    <div className={cn("grid select-none gap-2", className)}>
      <div className="flex items-baseline justify-center gap-1.5">
        {draft == null ? (
          <button
            type="button"
            aria-label={`${aria["aria-label"] ?? "Value"}: type a number`}
            onClick={() => setDraft(String(value))}
            className={cn(numberBox, "cursor-text hover:bg-fill focus-visible:bg-fill")}
          >
            <RollingNumber value={value} format={String} blur={blur} instant={keyed} />
          </button>
        ) : (
          <input
            autoFocus
            inputMode="numeric"
            aria-label={aria["aria-label"] ?? "Value"}
            value={draft}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, String(max).length))}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              else if (e.key === "Escape") setDraft(null);
            }}
            onBlur={commit}
            className={cn(numberBox, "bg-fill text-center outline-none")}
            style={{ width: `calc(${Math.max(draft.length, 1)}ch + 2 * var(--ad-nest))` }}
          />
        )}
        {unit ? <span className="text-body text-ink-muted">{unit}</span> : null}
      </div>
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label={aria["aria-label"]}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={unit && typeof unit === "string" ? `${value} ${unit}` : undefined}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          setKeyed(false);
          cancelAnimationFrame(raf.current);
          drag.current = { x: e.clientX, t: performance.now(), v: 0, raw: pos.current };
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const now = performance.now();
          const dv = -(e.clientX - d.x) / spacing;
          // Past either end the ruler pulls harder the further it goes (rubber band), then springs back on release.
          const raw = (d.raw += dv);
          const over = raw < min ? raw - min : raw > max ? raw - max : 0;
          pos.current = over ? (over < 0 ? min : max) + over / (1 + Math.abs(over) / 3) : raw;
          const dt = Math.max(1, now - d.t) / 1000;
          d.v = d.v * 0.6 + (dv / dt) * 0.4;
          d.x = e.clientX;
          d.t = now;
          paint();
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          setDragging(false);
          if (!d) return;
          // A pause before letting go kills the glide.
          const v = performance.now() - d.t > 80 ? 0 : d.v;
          settle(clamp(Math.round(pos.current + v / 9)), v);
        }}
        onPointerCancel={() => ((drag.current = null), setDragging(false), settle(clamp(Math.round(pos.current))))}
        onKeyDown={(e) => {
          if (!keyed) setKeyed(true);
          const k = e.key;
          const by = k === "ArrowRight" || k === "ArrowUp" ? 1 : k === "ArrowLeft" || k === "ArrowDown" ? -1 : k === "PageUp" ? majorEvery : k === "PageDown" ? -majorEvery : 0;
          if (by) set(value + by);
          else if (k === "Home") set(min);
          else if (k === "End") set(max);
          else if (/^[0-9]$/.test(k)) {
            const now = performance.now();
            typed.current = { s: (now - typed.current.t < 900 ? typed.current.s : "") + k, t: now };
            set(Number(typed.current.s));
          } else return;
          e.preventDefault();
        }}
        className={cn(
          "relative h-14 cursor-grab touch-none overflow-hidden rounded-control transition-colors duration-[150ms] ease-ad hover:bg-fill focus-visible:bg-fill",
          dragging && "cursor-grabbing bg-fill",
        )}
        style={{ maskImage: "linear-gradient(90deg, transparent, #000 18% 82%, transparent)" }}
      >
        <div ref={strip} className="absolute inset-y-0 left-0 flex">
          {ticks}
        </div>
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-1 h-7 w-0.5 -translate-x-1/2 rounded-full bg-ink" />
      </div>
    </div>
  );
}
