import * as React from "react";
import { Minus, Plus } from "react-feather";
import { cn, formatNumber, prefersReducedMotion } from "@/lib/ad";

/** How far the pill can stretch to one side, in px. The root reserves this room, so nothing around it moves. */
const REACH = 56;
const STIFFNESS = 420;
const DAMPING = 34; // just under critical: the band lands with the faintest give, no wobble
const DEAD_ZONE = 0.12;
const MAX_RATE = 34;
const NUDGE = 300;

/** The gap between the band and every fill inside it, on each side. Fills take the band's radius minus this. */
const INSET = 8;
const PRESS = 1.5;

const CSS = `
@property --ad-rubber-press { syntax: "<length>"; inherits: true; initial-value: 0px; }
.ad-rubber { --pull: 0; --el: 0px; --er: 0px; --sy: 0px; }
/* A real box, not a clip, so its corners take the same corner-shape as the fills inside it. */
.ad-rubber-band { inset: var(--sy) calc(var(--er) * -1) var(--sy) calc(var(--el) * -1); border-radius: var(--ad-radius-card); }
.ad-rubber-minus { transform: translateX(calc(var(--el) * -1)); }
.ad-rubber-plus { transform: translateX(var(--er)); }
.ad-rubber-value { transform: translateX(calc(var(--pull) * 0.62px)); touch-action: pan-y; cursor: ew-resize; }
/* Only the fill and the press ease: the pull itself has to follow the finger with no lag. */
.ad-rubber-hit { --ad-rubber-press: 0px; transition: --ad-rubber-press 150ms var(--ad-ease); }
.ad-rubber-hit:active:not(:disabled) { --ad-rubber-press: ${PRESS}px; }
/* Follows the band as it thins, and a press draws it in on all four sides, so the gap stays even and the arcs share a centre. */
.ad-rubber-fill {
  position: absolute; pointer-events: none;
  inset: calc(var(--sy) + var(--ad-rubber-press)) var(--ad-rubber-press);
  border-radius: max(0px, calc(var(--ad-radius-card) - ${INSET}px - var(--ad-rubber-press)));
  transition: background-color 150ms var(--ad-ease);
}
@media (hover: hover) { .ad-rubber-hit:hover:not(:disabled) > .ad-rubber-fill { background: var(--ad-fill-strong); } }
.ad-rubber-hit:focus-visible > .ad-rubber-fill, .ad-rubber-hit:active:not(:disabled) > .ad-rubber-fill { background: var(--ad-fill-strong); }
.ad-rubber-hit > svg { position: relative; transition: scale 150ms var(--ad-ease); }
.ad-rubber-hit:active:not(:disabled) > svg { scale: 0.88; }
@media (prefers-reduced-motion: reduce) { .ad-rubber-hit, .ad-rubber-fill, .ad-rubber-hit > svg { transition: none; } }
@keyframes ad-rubber-digit { from { opacity: 0.6; transform: translateY(calc(var(--dir, 1) * 0.2em)); filter: blur(1px); } }
.ad-rubber-digit { display: inline-block; animation: ad-rubber-digit 90ms var(--ad-ease); }`;

const stretch = (dx: number) => {
  const a = Math.abs(dx);
  return Math.sign(dx) * REACH * (1 - 1 / ((a * 0.62) / REACH + 1));
};
/** The finger distance that gives a stretch: `stretch` backwards. */
const unstretch = (s: number) => {
  const k = Math.min(Math.abs(s) / REACH, 0.98);
  return (Math.sign(s) * (REACH / 0.62) * k) / (1 - k);
};

export interface RubberBandStepperProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** The accessible name of the number. */
  label?: string;
}

/**
 * A stepper you can also pull. Dragging the number sideways stretches the pill, the further the pull the faster it
 * counts, and letting go snaps it back. The buttons and the arrow keys step it one at a time.
 */
export function RubberBandStepper({ value, defaultValue = 12, onValueChange, min = 0, max = 999, step = 1, label = "Quantity", className, ...props }: RubberBandStepperProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const numRef = React.useRef<HTMLDivElement>(null);
  const [dir, setDir] = React.useState(1);
  const live = React.useRef({ current, min, max, step, onValueChange });
  live.current = { current, min, max, step, onValueChange };
  const nudge = React.useRef<(direction: number) => void>(() => {});

  const commit = React.useCallback((next: number) => {
    const { current, min, max, onValueChange } = live.current;
    const v = Math.max(min, Math.min(max, next));
    if (v === current) return false;
    setDir(v > current ? 1 : -1);
    live.current.current = v;
    setInner(v);
    onValueChange?.(v);
    return true;
  }, []);

  React.useEffect(() => {
    const root = rootRef.current;
    const num = numRef.current;
    if (!root || !num) return;
    let pull = 0, vel = 0, raf = 0, last = 0, acc = 0, onScreen = true;
    let drag: { id: number; x: number; dx: number } | null = null;

    const paint = () => {
      const s = root.style;
      s.setProperty("--pull", pull.toFixed(2));
      s.setProperty("--er", `${Math.max(pull, 0).toFixed(2)}px`);
      s.setProperty("--el", `${Math.max(-pull, 0).toFixed(2)}px`);
      s.setProperty("--sy", `${((Math.abs(pull) / REACH) * 3).toFixed(2)}px`);
    };
    const frame = (t: number) => {
      raf = 0;
      // Real elapsed time, so a slow device counts and springs at the same speed, only with fewer frames.
      const dt = Math.min(Math.max(t - last, 1) / 1000, 0.1);
      last = t;
      if (drag) {
        const next = stretch(drag.dx);
        vel = (next - pull) / dt;
        pull = next;
        // The further the pull, the faster it counts.
        const force = Math.abs(pull) / REACH;
        if (force > DEAD_ZONE) {
          const k = (force - DEAD_ZONE) / (1 - DEAD_ZONE);
          acc += (1.5 + MAX_RATE * k ** 2.2) * dt;
          while (acc >= 1) {
            acc -= 1;
            commit(live.current.current + Math.sign(pull) * live.current.step);
          }
        } else acc = 0.72; // Crossing into the pull counts almost at once.
        paint();
        raf = requestAnimationFrame(frame);
        return;
      }
      const steps = Math.ceil(dt * 240);
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        vel += (-STIFFNESS * pull - DAMPING * vel) * h;
        pull += vel * h;
      }
      const settled = Math.abs(pull) < 0.05 && Math.abs(vel) < 2;
      if (settled) {
        pull = 0;
        vel = 0;
      }
      paint();
      if (!settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (raf || !onScreen) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      num.setPointerCapture(e.pointerId);
      // Caught mid-spring, the drag picks the band up where it is.
      const held = unstretch(pull);
      drag = { id: e.pointerId, x: e.clientX - held, dx: held };
      acc = 0.72;
      if (!prefersReducedMotion()) kick();
    };
    const move = (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      drag.dx = e.clientX - drag.x;
      if (prefersReducedMotion()) {
        // No stretch: the distance alone sets the count.
        const steps = Math.trunc(drag.dx / 14);
        if (steps !== 0) {
          drag.x += steps * 14;
          commit(live.current.current + steps * live.current.step);
        }
      }
    };
    const up = (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      drag = null;
      kick();
    };
    num.addEventListener("pointerdown", down);
    num.addEventListener("pointermove", move);
    num.addEventListener("pointerup", up);
    num.addEventListener("pointercancel", up);
    nudge.current = (direction) => {
      if (prefersReducedMotion()) return;
      vel += direction * NUDGE;
      kick();
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) return;
      cancelAnimationFrame(raf);
      raf = 0;
      drag = null;
      pull = vel = 0;
      paint();
    });
    io.observe(root);
    return () => {
      num.removeEventListener("pointerdown", down);
      num.removeEventListener("pointermove", move);
      num.removeEventListener("pointerup", up);
      num.removeEventListener("pointercancel", up);
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [commit]);

  const stepBy = (direction: number) => {
    if (commit(live.current.current + direction * step)) nudge.current(direction);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const to = {
      ArrowRight: current + step,
      ArrowUp: current + step,
      ArrowLeft: current - step,
      ArrowDown: current - step,
      PageUp: current + step * 10,
      PageDown: current - step * 10,
      Home: min,
      End: max,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    commit(to);
  };

  const text = formatNumber(current);
  const chars = [...text];
  const button = "ad-rubber-hit relative grid size-[44px] shrink-0 cursor-pointer place-items-center text-ink disabled:cursor-default disabled:text-ink-muted";

  return (
    <div ref={rootRef} className={cn("ad-rubber relative flex max-w-full select-none justify-center", className)} style={{ paddingInline: REACH }} {...props}>
      <style href="ad-rubber-band-stepper" precedence="default">
        {CSS}
      </style>
      <div className="relative flex h-[60px] w-[184px] shrink-0 items-center justify-between" style={{ paddingInline: INSET }}>
        <div aria-hidden className="ad-rubber-band pointer-events-none absolute bg-fill" />
        <div className="ad-rubber-minus relative">
          <button type="button" tabIndex={-1} aria-label={`Decrease ${label.toLowerCase()}`} disabled={current <= min} onClick={() => stepBy(-1)} className={button}>
            <span aria-hidden className="ad-rubber-fill" />
            <Minus size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div
          ref={numRef}
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          onKeyDown={onKeyDown}
          style={{ "--dir": dir } as React.CSSProperties}
          className="ad-rubber-value ad-rubber-hit relative flex h-[44px] min-w-[56px] items-center justify-center px-1 text-[26px] font-semibold leading-none tabular-nums text-ink"
        >
          <span aria-hidden className="ad-rubber-fill" />
          {chars.map((ch, i) => (
            <span key={`${chars.length - i}:${ch}`} className="ad-rubber-digit relative">
              {ch}
            </span>
          ))}
        </div>
        <div className="ad-rubber-plus relative">
          <button type="button" tabIndex={-1} aria-label={`Increase ${label.toLowerCase()}`} disabled={current >= max} onClick={() => stepBy(1)} className={button}>
            <span aria-hidden className="ad-rubber-fill" />
            <Plus size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
