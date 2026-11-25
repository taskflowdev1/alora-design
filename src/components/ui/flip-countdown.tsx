import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

const FLIP_MS = 560;
const FLIP_FINAL_MS = 250;
const RIFFLE_MS = 110;
const LOOP_HOLD_MS = 1600;

const CSS = `
.ad-flip { container-type: inline-size; --t: 0; }
.ad-flip-row { display: flex; align-items: center; justify-content: center; gap: 1.1cqw; transform: scale(calc(1 + var(--t) * 0.035)); transition: transform 280ms var(--ad-ease); }
.ad-flip-pair { display: flex; gap: 1.1cqw; }
.ad-flip-slot { transform: translateX(calc(var(--i) * var(--t) * -0.42cqw)); transition: transform 280ms var(--ad-ease); }
.ad-flip-card { position: relative; width: 12.4cqw; height: 18cqw; perspective: 44cqw; font-size: 13.4cqw; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; color: var(--ad-ink); }
.ad-flip-half { position: absolute; left: 0; right: 0; height: calc(50% - 0.5px); overflow: hidden; background: var(--ad-fill); backface-visibility: hidden; }
.ad-flip-half[data-side="top"] { top: 0; border-radius: var(--ad-radius-card) var(--ad-radius-card) 0 0; transform-origin: 50% calc(100% + 0.5px); }
.ad-flip-half[data-side="bottom"] { bottom: 0; border-radius: 0 0 var(--ad-radius-card) var(--ad-radius-card); transform-origin: 50% -0.5px; }
.ad-flip-glyph { position: absolute; left: 0; right: 0; height: 18cqw; display: grid; place-items: center; }
.ad-flip-half[data-side="top"] .ad-flip-glyph { top: 0; }
.ad-flip-half[data-side="bottom"] .ad-flip-glyph { bottom: 0; }
.ad-flip-shade { position: absolute; inset: 0; background: var(--ad-page); opacity: 0; pointer-events: none; }
.ad-flip-fall { z-index: 2; animation: ad-flip-fall calc(var(--flip) * 0.44) cubic-bezier(0.55, 0.05, 0.85, 0.3) both; }
.ad-flip-fall .ad-flip-shade { animation: ad-flip-dim calc(var(--flip) * 0.44) ease-in both; }
.ad-flip-land { z-index: 2; animation: ad-flip-land calc(var(--flip) * 0.56) linear calc(var(--flip) * 0.44) both; }
.ad-flip-land .ad-flip-shade { animation: ad-flip-lift calc(var(--flip) * 0.4) ease-out calc(var(--flip) * 0.44) both; }
.ad-flip-under .ad-flip-shade { animation: ad-flip-cast var(--flip) ease-out both; }
.ad-flip-dot { width: 1.5cqw; height: 1.5cqw; border-radius: 50%; corner-shape: round; background: var(--ad-ink-muted); }
@keyframes ad-flip-fall { to { transform: rotateX(-90deg); } }
@keyframes ad-flip-land {
  0% { transform: rotateX(90deg); animation-timing-function: cubic-bezier(0.4, 0, 0.9, 0.6); }
  58% { transform: rotateX(-7deg); animation-timing-function: ease-out; }
  78% { transform: rotateX(3deg); animation-timing-function: ease-in-out; }
  91% { transform: rotateX(-1deg); animation-timing-function: ease-in-out; }
  100% { transform: rotateX(0deg); }
}
@keyframes ad-flip-dim { to { opacity: 0.55; } }
@keyframes ad-flip-lift { from { opacity: 0.5; } to { opacity: 0; } }
@keyframes ad-flip-cast { 0%, 30% { opacity: 0.42; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .ad-flip-row, .ad-flip-slot { transform: none; transition: none; }
}`;

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

const Glyph = ({ side, children, className }: { side: "top" | "bottom"; children: string; className?: string }) => (
  <span data-side={side} className={cn("ad-flip-half", className)}>
    <span className="ad-flip-glyph">{children}</span>
    <span className="ad-flip-shade" />
  </span>
);

/** One digit. When the target is more than one step away it riffles through the digits between, as a real board does. */
function Flap({ value, flipMs, index, calm }: { value: string; flipMs: number; index: number; calm: boolean }) {
  const [state, setState] = React.useState({ cur: value, prev: value, n: 0 });
  const riffling = state.cur !== value;

  const step = React.useCallback(() => {
    setState((s) => {
      if (s.cur === value) return s.prev === s.cur ? s : { ...s, prev: s.cur };
      const next = String((Number(s.cur) + 9) % 10);
      return { cur: next, prev: s.cur, n: s.n + 1 };
    });
  }, [value]);

  React.useEffect(() => {
    if (calm) {
      setState((s) => (s.cur === value && s.prev === value ? s : { cur: value, prev: value, n: s.n }));
      return;
    }
    if (state.cur !== value && state.prev === state.cur) step();
  }, [value, calm, state.cur, state.prev, step]);

  const flipping = !calm && state.prev !== state.cur;
  const dist = (Number(state.cur) - Number(value) + 10) % 10;
  const ms = riffling && dist > 0 ? RIFFLE_MS : flipMs;

  return (
    <span className="ad-flip-slot block" style={{ "--i": index } as React.CSSProperties}>
      <span className="ad-flip-card block" style={{ "--flip": `${ms}ms` } as React.CSSProperties}>
        <Glyph side="top">{state.cur}</Glyph>
        <Glyph key={`u${state.n}`} side="bottom" className={flipping ? "ad-flip-under" : undefined}>
          {flipping ? state.prev : state.cur}
        </Glyph>
        {flipping && (
          <React.Fragment key={state.n}>
            <Glyph side="top" className="ad-flip-fall">
              {state.prev}
            </Glyph>
            <span onAnimationEnd={(e) => e.animationName === "ad-flip-land" && step()}>
              <Glyph side="bottom" className="ad-flip-land">
                {state.cur}
              </Glyph>
            </span>
          </React.Fragment>
        )}
      </span>
    </span>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export interface FlipCountdownHandle {
  /** Jump to this many seconds left; the flaps riffle over to it. */
  setSeconds: (seconds: number) => void;
}

export interface FlipCountdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Seconds on the clock when it starts. Ignored with `endsAt`. */
  seconds?: number;
  /** A real deadline. Without one, the clock counts `seconds` and holds while off screen. */
  endsAt?: Date | number;
  /** Start over after reaching zero. */
  loop?: boolean;
  onComplete?: () => void;
  ref?: React.Ref<FlipCountdownHandle>;
}

/**
 * A promo timer on weighted split flaps. In the final ten seconds the digits pull closer together and the flaps turn
 * faster. Set the width with `className`; the digits scale with it.
 */
export function FlipCountdown({ seconds = 24, endsAt, loop = false, onComplete, ref, className, ...props }: FlipCountdownProps) {
  const until = endsAt === undefined ? null : Number(endsAt);
  const remainingAt = React.useCallback((now: number) => (until === null ? seconds : Math.max(0, Math.ceil((until - now) / 1000))), [until, seconds]);
  const [left, setLeft] = React.useState(() => remainingAt(Date.now()));
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  });
  const leftRef = React.useRef(left);
  React.useEffect(() => {
    leftRef.current = left;
  }, [left]);

  React.useImperativeHandle(ref, () => ({ setSeconds: (s) => setLeft(Math.max(0, Math.round(s))) }), []);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let timer = 0;
    let onScreen = true;
    const stop = () => {
      window.clearTimeout(timer);
      timer = 0;
    };
    const tick = () => {
      timer = 0;
      if (until !== null) setLeft(remainingAt(Date.now()));
      else if (leftRef.current > 0) setLeft((n) => Math.max(0, n - 1));
      schedule();
    };
    const schedule = () => {
      if (timer || !onScreen || document.hidden) return;
      const delay = until === null ? 1000 : 1000 - (Date.now() % 1000) + 10;
      timer = window.setTimeout(tick, delay);
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) schedule();
      else stop();
    });
    io.observe(el);
    const vis = () => (document.hidden ? stop() : schedule());
    document.addEventListener("visibilitychange", vis);
    schedule();
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [until, remainingAt]);

  React.useEffect(() => {
    if (left > 0) return;
    onCompleteRef.current?.();
    if (!loop) return;
    const id = window.setTimeout(() => setLeft(remainingAt(Date.now()) || seconds), LOOP_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [left, loop, seconds, remainingAt]);

  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const urgency = left > 0 && left <= 10 ? (11 - left) / 10 : 0;
  const flipMs = Math.round(FLIP_MS + (FLIP_FINAL_MS - FLIP_MS) * urgency);
  const digits = `${pad(h)}${pad(m)}${pad(s)}`;
  const flap = (i: number) => <Flap value={digits[i]} flipMs={flipMs} index={i < 3 ? i - 3 : i - 2} calm={reduced} />;

  return (
    <div
      ref={rootRef}
      role="timer"
      aria-label={`${h} hours ${m} minutes ${s} seconds left`}
      translate="no"
      className={cn("ad-flip w-full max-w-[640px] select-none", className)}
      style={{ "--t": urgency } as React.CSSProperties}
      {...props}
    >
      <style href="ad-flip-countdown" precedence="default">
        {CSS}
      </style>
      <div aria-hidden className="ad-flip-row">
        <span className="ad-flip-pair">
          {flap(0)}
          {flap(1)}
        </span>
        <span className="grid gap-[2.4cqw] px-[0.5cqw]">
          <span className="ad-flip-dot" />
          <span className="ad-flip-dot" />
        </span>
        <span className="ad-flip-pair">
          {flap(2)}
          {flap(3)}
        </span>
        <span className="grid gap-[2.4cqw] px-[0.5cqw]">
          <span className="ad-flip-dot" />
          <span className="ad-flip-dot" />
        </span>
        <span className="ad-flip-pair">
          {flap(4)}
          {flap(5)}
        </span>
      </div>
    </div>
  );
}
