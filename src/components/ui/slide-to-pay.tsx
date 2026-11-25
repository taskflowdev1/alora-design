import * as React from "react";
import { ChevronsRight } from "react-feather";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";

const STIFFNESS = 420;
const DAMPING = 38;
/** How far the thumb must be on a slow release, and on a flick, as a share of the track. */
const COMMIT_AT = 0.88;
const FLICK_FROM = 0.45;
/** A flick, in track lengths per second. */
const FLICK_SPEED = 1.6;
const KEY_STEP = 0.1;
/** Past either end the thumb moves at this share of the finger, up to `RUBBER_MAX` of the track. */
const RUBBER = 0.18;
const RUBBER_MAX = 0.03;

const CSS = `
.ad-slide { --h: 56px; --p: 0; --reach: calc(100% - var(--h)); container-type: inline-size; touch-action: pan-y; }
.ad-slide-track { left: 0; transition: left 280ms var(--ad-ease); }
.ad-slide[data-phase="done"] .ad-slide-track { left: calc(100% - var(--h)); }
.ad-slide-band {
  opacity: min(1, calc(var(--p) * 14));
  clip-path: inset(0 calc(var(--reach) - min(var(--p), 1) * var(--reach)) 0 0 round 0 var(--ad-radius-card) var(--ad-radius-card) 0);
  transition: opacity 160ms var(--ad-ease);
}
.ad-slide[data-phase="done"] .ad-slide-band { opacity: 0; }
.ad-slide-lit { clip-path: inset(0 calc(var(--reach) - min(var(--p), 1) * var(--reach)) 0 0); }
.ad-slide[data-phase="paying"] .ad-slide-lit { animation: ad-pulse 1.6s ease-in-out infinite; }
.ad-slide-thumb {
  top: var(--ad-nest); left: var(--ad-nest);
  width: calc(var(--h) - var(--ad-nest) * 2); height: calc(var(--h) - var(--ad-nest) * 2);
  translate: calc(var(--p) * (100cqw - var(--h))) 0;
  cursor: grab; touch-action: pan-y;
}
.ad-slide-thumb:active { cursor: grabbing; }
.ad-slide[data-phase="paying"] .ad-slide-thumb { cursor: default; }
.ad-slide[data-phase="done"] .ad-slide-thumb { background-color: transparent; cursor: default; }
.ad-slide-arrow { transition: opacity 140ms var(--ad-ease), scale 140ms var(--ad-ease), filter 140ms var(--ad-ease), translate 180ms var(--ad-ease); }
.ad-slide[data-phase="done"] .ad-slide-arrow { opacity: 0; scale: 0.8; filter: blur(2px); }
@media (hover: hover) {
  .ad-slide[data-phase="idle"] .ad-slide-thumb:hover .ad-slide-arrow { translate: 2px 0; }
}
.ad-slide-check path { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 80ms linear; }
.ad-slide[data-phase="done"] .ad-slide-check path { stroke-dashoffset: 0; transition: stroke-dashoffset 240ms var(--ad-ease) 140ms; }
@media (prefers-reduced-motion: reduce) {
  .ad-slide-track, .ad-slide-band, .ad-slide-arrow, .ad-slide-check path { transition: none !important; }
}`;

type Phase = "idle" | "paying" | "done";

export interface SlideToPayProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The amount in rupiah, wiped from dim to bright as the thumb travels. */
  amount?: number;
  /** Runs when the slide commits. Return a promise to hold the end of the track until it settles; a rejection springs the thumb back. */
  onConfirm?: () => void | Promise<unknown>;
  /** Milliseconds the finished state stays before the track opens again; `false` keeps it. */
  resetAfter?: number | false;
  disabled?: boolean;
}

/**
 * A payment you confirm by dragging. The thumb wipes the amount from dim to bright; a release short of the end springs
 * back with the speed it had, and the end of the track closes around the thumb into a check. Enter or Space pays from
 * the keyboard, the arrow keys preview the slide.
 */
export function SlideToPay({ amount = 1250000, onConfirm, resetAfter = 2600, disabled, className, ...props }: SlideToPayProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const [phase, setPhaseState] = React.useState<Phase>("idle");
  const live = React.useRef({ phase: "idle" as Phase, pos: 0, vel: 0, raf: 0, timer: 0, alive: true });
  const drag = React.useRef<{ id: number; startX: number; startPos: number; reach: number; lastX: number; lastT: number; speed: number; moved: boolean } | null>(null);
  const money = formatRp(amount);

  React.useEffect(() => {
    const m = live.current;
    m.alive = true;
    return () => {
      m.alive = false;
      cancelAnimationFrame(m.raf);
      clearTimeout(m.timer);
    };
  }, []);

  const setPhase = (next: Phase) => {
    live.current.phase = next;
    setPhaseState(next);
  };
  const paint = () => root.current?.style.setProperty("--p", live.current.pos.toFixed(4));

  /** Springs the thumb to `to`, carrying `velocity` (track lengths per second). Resolves when it lands. */
  const springTo = (to: number, velocity = 0) =>
    new Promise<void>((resolve) => {
      const m = live.current;
      cancelAnimationFrame(m.raf);
      if (prefersReducedMotion()) {
        m.pos = to;
        m.vel = 0;
        paint();
        resolve();
        return;
      }
      m.vel = velocity;
      let last = performance.now();
      const step = (t: number) => {
        const dt = Math.min(Math.max(t - last, 1) / 1000, 1 / 30);
        last = t;
        m.vel += (STIFFNESS * (to - m.pos) - DAMPING * m.vel) * dt;
        m.pos += m.vel * dt;
        if (Math.abs(to - m.pos) < 0.001 && Math.abs(m.vel) < 0.01) {
          m.pos = to;
          m.vel = 0;
          paint();
          resolve();
          return;
        }
        paint();
        m.raf = requestAnimationFrame(step);
      };
      m.raf = requestAnimationFrame(step);
    });

  const reset = () => {
    setPhase("idle");
    void springTo(0);
  };

  const commit = async (velocity = 0) => {
    const m = live.current;
    if (m.phase !== "idle" || disabled) return;
    setPhase("paying");
    const arrived = springTo(1, velocity);
    try {
      await Promise.all([onConfirm?.(), arrived]);
    } catch {
      if (m.alive) reset();
      return;
    }
    if (!m.alive) return;
    setPhase("done");
    if (resetAfter !== false) m.timer = window.setTimeout(reset, resetAfter);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const m = live.current;
    if (m.phase !== "idle" || disabled || e.button !== 0) return;
    const r = root.current!.getBoundingClientRect();
    cancelAnimationFrame(m.raf);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, startX: e.clientX, startPos: m.pos, reach: Math.max(1, r.width - r.height), lastX: e.clientX, lastT: e.timeStamp, speed: 0, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (d?.id !== e.pointerId) return;
    if (!d.moved && Math.abs(e.clientX - d.startX) < 3) return;
    d.moved = true;
    const raw = d.startPos + (e.clientX - d.startX) / d.reach;
    live.current.pos = raw > 1 ? 1 + Math.min((raw - 1) * RUBBER, RUBBER_MAX) : raw < 0 ? Math.max(raw * RUBBER, -RUBBER_MAX) : raw;
    paint();
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) {
      d.speed = d.speed * 0.6 + (((e.clientX - d.lastX) / d.reach / dt) * 1000) * 0.4;
      d.lastX = e.clientX;
      d.lastT = e.timeStamp;
    }
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (d?.id !== e.pointerId) return;
    drag.current = null;
    const m = live.current;
    const speed = e.timeStamp - d.lastT > 90 ? 0 : d.speed;
    if (e.type === "pointerup" && d.moved && (m.pos >= COMMIT_AT || (speed > FLICK_SPEED && m.pos > FLICK_FROM))) {
      void commit(speed);
    } else if (e.type === "pointerup" && !d.moved) {
      m.pos = 0.07;
      paint();
      void springTo(0, -0.4);
    } else {
      void springTo(0, speed);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const m = live.current;
    if (m.phase !== "idle" || disabled || e.altKey || e.ctrlKey || e.metaKey) return;
    const to = { ArrowRight: m.pos + KEY_STEP, ArrowLeft: m.pos - KEY_STEP, Home: 0, End: 1, Escape: 0 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    cancelAnimationFrame(m.raf);
    m.pos = Math.max(0, Math.min(1, to));
    m.vel = 0;
    paint();
  };

  return (
    <div
      ref={root}
      data-phase={phase}
      aria-busy={phase === "paying" || undefined}
      className={cn("ad-slide relative h-[56px] w-full min-w-0 select-none", disabled && "opacity-45", className)}
      {...props}
    >
      <style href="ad-slide-to-pay" precedence="default">
        {CSS}
      </style>
      <div aria-hidden className="ad-slide-track absolute inset-y-0 right-0 rounded-card bg-fill" />
      <div aria-hidden className="ad-slide-band absolute inset-0 rounded-card bg-fill-strong" />
      <span aria-hidden className="absolute inset-0 grid place-items-center text-title font-semibold tabular-nums text-ink-muted">
        {money}
      </span>
      <span aria-hidden className="ad-slide-lit absolute inset-0 grid place-items-center text-title font-semibold tabular-nums text-ink">
        {money}
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-label={phase === "done" ? `Paid ${money}` : `Pay ${money}`}
        aria-disabled={phase !== "idle" || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        onClick={(e) => e.detail === 0 && void commit()}
        className="ad-slide-thumb ad-press absolute grid select-none place-items-center rounded-control bg-brand text-brand-ink hover:bg-brand-hover focus-visible:bg-brand-hover active:scale-[0.97]"
      >
        <ChevronsRight size={16} strokeWidth={1.75} aria-hidden className="ad-slide-arrow col-start-1 row-start-1" />
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="ad-slide-check col-start-1 row-start-1 text-success">
          <path pathLength={1} d="M4 12.5 9 17.5 20 6.5" />
        </svg>
      </button>
      <span role="status" className="sr-only">
        {phase === "done" ? `Paid ${money}` : ""}
      </span>
    </div>
  );
}
