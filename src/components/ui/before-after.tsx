import * as React from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";

const STIFFNESS = 340;
const DAMPING = 36; // just under critical: it arrives without a wobble
const KEY_STEP = 0.02;
const KEY_STEP_BIG = 0.1;

/*
 * One number (--v, 0 to 1) moves everything: the wipe, the knob, and the two pictures sliding a little in opposite
 * directions so they read as two layers rather than one image with a filter on half of it.
 */
const CSS = `
.ad-ba { --v: 0.5; --n: calc(var(--v) * 2 - 1); container-type: inline-size; touch-action: pan-y; }
.ad-ba-after { transform: translateX(calc(var(--n) * 1.5%)) scale(1.07); }
.ad-ba-before { transform: translate(calc(var(--n) * -1.5% - 0.7%), 0.5%) rotate(-0.5deg) scale(1.09); }
.ad-ba-clip { clip-path: inset(0 calc((1 - var(--v)) * 100%) 0 0); }
.ad-ba-edge { transform: translateX(calc(var(--v) * 100cqw)); }
/* grey-ok: the shadow the raw layer casts on the edited one */
.ad-ba-shade { background: linear-gradient(to right, rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.1) 38%, transparent); }
.ad-ba-tag { transition: opacity 180ms var(--ad-ease); }`;

export interface BeforeAfterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  /** The raw shot. */
  before: string;
  /** The edited shot. */
  after: string;
  /** What the picture shows. */
  alt: string;
  /** CSS filter for the raw side, when both sides are the same file. */
  beforeFilter?: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Where the wipe starts, 0 to 1. */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
}

/**
 * A draggable wipe between a raw and an edited product shot, with a slight parallax between them. Drag anywhere on the
 * picture, click to send the wipe there, use the arrow keys, or double-click to centre it.
 */
export function BeforeAfter({
  before,
  after,
  alt,
  beforeFilter,
  beforeLabel = "Raw",
  afterLabel = "Edited",
  defaultValue = 0.5,
  onValueChange,
  className,
  ...props
}: BeforeAfterProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const sim = React.useRef({ x: defaultValue, v: 0, to: defaultValue, raf: 0, last: 0, id: -1, onScreen: true });
  const change = React.useRef(onValueChange);
  change.current = onValueChange;
  const [value, setValue] = React.useState(defaultValue);
  const [held, setHeld] = React.useState(false);

  const paint = React.useCallback((x: number) => {
    root.current?.style.setProperty("--v", x.toFixed(4));
    setValue((old) => (Math.abs(old - x) >= 0.005 || x === 0 || x === 1 ? x : old));
  }, []);

  const frame = React.useCallback((t: number) => {
    const s = sim.current;
    s.raf = 0;
    const dt = Math.min(Math.max(t - s.last, 1) / 1000, 1 / 30);
    s.last = t;
    s.v += (STIFFNESS * (s.to - s.x) - DAMPING * s.v) * dt;
    s.x += s.v * dt;
    const done = Math.abs(s.to - s.x) < 0.0006 && Math.abs(s.v) < 0.006;
    if (done) {
      s.x = s.to;
      s.v = 0;
    }
    paint(s.x);
    if (!done) s.raf = requestAnimationFrame(frame);
  }, [paint]);

  const glide = React.useCallback((to: number) => {
    const s = sim.current;
    s.to = Math.max(0, Math.min(1, to));
    change.current?.(s.to);
    if (prefersReducedMotion() || !s.onScreen) {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.x = s.to;
      s.v = 0;
      paint(s.x);
      return;
    }
    if (!s.raf) {
      s.last = performance.now();
      s.raf = requestAnimationFrame(frame);
    }
  }, [frame, paint]);

  const jump = React.useCallback((to: number) => {
    const s = sim.current;
    cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.x = s.to = Math.max(0, Math.min(1, to));
    s.v = 0;
    paint(s.x);
    change.current?.(s.x);
  }, [paint]);

  React.useEffect(() => {
    const el = root.current;
    const s = sim.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      s.onScreen = entry.isIntersecting;
      if (entry.isIntersecting || !s.raf) return;
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.x = s.to;
      s.v = 0;
      paint(s.x);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(s.raf);
    };
  }, [paint]);

  const at = (e: React.PointerEvent) => {
    const r = root.current?.getBoundingClientRect();
    return r ? (e.clientX - r.left) / r.width : 0.5;
  };

  const onKey = (e: React.KeyboardEvent) => {
    const s = sim.current;
    const step = e.shiftKey ? KEY_STEP_BIG : KEY_STEP;
    const to = { ArrowLeft: s.to - step, ArrowDown: s.to - step, ArrowRight: s.to + step, ArrowUp: s.to + step, PageDown: s.to - KEY_STEP_BIG, PageUp: s.to + KEY_STEP_BIG, Home: 0, End: 1, Enter: 0.5 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    jump(to);
  };

  return (
    <div
      ref={root}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        sim.current.id = e.pointerId;
        setHeld(true);
        if (e.pointerType === "touch") return; // a finger may be starting a scroll: it takes hold once it moves sideways
        glide(at(e));
      }}
      onPointerMove={(e) => {
        if (sim.current.id === e.pointerId) jump(at(e));
      }}
      onPointerUp={(e) => {
        if (sim.current.id !== e.pointerId) return;
        sim.current.id = -1;
        setHeld(false);
        if (e.pointerType === "touch") glide(at(e));
      }}
      onPointerCancel={() => {
        sim.current.id = -1;
        setHeld(false);
      }}
      onDoubleClick={() => glide(0.5)}
      style={{ "--v": defaultValue } as React.CSSProperties}
      className={cn("ad-ba relative aspect-[4/3] w-full cursor-ew-resize touch-pan-y overflow-hidden rounded-card bg-fill shadow-raised select-none", className)}
      {...props}
    >
      <style href="ad-before-after" precedence="default">
        {CSS}
      </style>

      <img src={after} alt={`${alt}, ${afterLabel.toLowerCase()}`} draggable={false} className="ad-ba-after pointer-events-none absolute inset-0 size-full object-cover" />
      <div className="ad-ba-clip pointer-events-none absolute inset-0 overflow-hidden">
        <img src={before} alt={`${alt}, ${beforeLabel.toLowerCase()}`} draggable={false} style={{ filter: beforeFilter }} className="ad-ba-before absolute inset-0 size-full object-cover" />
      </div>

      <span aria-hidden className={cn("ad-ba-tag pointer-events-none absolute left-3 top-3 rounded-item bg-surface px-bubble-sm py-1 text-small font-medium text-ink shadow-sel", value < 0.16 && "opacity-0")}>
        {beforeLabel}
      </span>
      <span aria-hidden className={cn("ad-ba-tag pointer-events-none absolute right-3 top-3 rounded-item bg-surface px-bubble-sm py-1 text-small font-medium text-ink shadow-sel", value > 0.84 && "opacity-0")}>
        {afterLabel}
      </span>

      <div aria-hidden className="ad-ba-edge pointer-events-none absolute inset-y-0 left-0 w-0">
        <div className="ad-ba-shade absolute inset-y-0 left-0 w-9" />
      </div>
      <div className="ad-ba-edge pointer-events-none absolute inset-y-0 left-0 w-0">
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${beforeLabel} and ${afterLabel.toLowerCase()} comparison`}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(value * 100)}
          aria-valuetext={`${Math.round(value * 100)}% ${beforeLabel.toLowerCase()}`}
          onKeyDown={onKey}
          className={cn(
            "ad-press pointer-events-auto absolute left-0 top-1/2 flex size-[44px] -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-surface text-ink shadow-raised hover:bg-fill focus-visible:bg-fill-strong",
            held && "scale-[0.94]",
          )}
        >
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden className="-mr-0.5" />
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden className="-ml-0.5" />
        </div>
      </div>
    </div>
  );
}
