import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

type Phase = "idle" | "saving" | "done" | "failed";

const STIFFNESS = 420;
const DAMPING = 36;
const SPIN_MS = 780;
const FINISH_MS = 460;
const MIN_SAVING_MS = 1100;
const DONE_MS = 1900;
const SPIN_DASH = 11;

/* The mark is one path: a ring, then a short step inward, then the check. The visible dash rides along it. */
const R = 6.5;
const RING = 2 * Math.PI * R;
const STEP = Math.hypot(2.9 - 1.5, 8.2 - 8);
const CHECK = Math.hypot(6.2 - 2.9, 11.4 - 8.2) + Math.hypot(13.1 - 6.2, 4.4 - 11.4);
const TOTAL = RING + STEP + CHECK;
const MARK = `M1.5 8A${R} ${R} 0 1 1 14.5 8A${R} ${R} 0 1 1 1.5 8L2.9 8.2L6.2 11.4L13.1 4.4`;
const MARK_SIZE = 16;
const MARK_GAP = 6;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const CSS = `
.ad-save-text {
  position: absolute; left: 50%; top: 50%; white-space: nowrap; opacity: 0; pointer-events: none;
  transform: translate(calc(-50% + var(--sx, 0px)), -50%); filter: blur(2px);
  transition: opacity 130ms var(--ad-ease), filter 130ms var(--ad-ease);
}
.ad-save-text[data-on] { opacity: 1; filter: none; transition-delay: 90ms; }
.ad-save-mark { position: absolute; left: 50%; top: 50%; margin: -${MARK_SIZE / 2}px; opacity: 0; transition: opacity 120ms var(--ad-ease); }
.ad-save-mark[data-on] { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .ad-save-text { filter: none; transition: opacity 120ms linear; }
  .ad-save-text[data-on] { filter: none; transition-delay: 0ms; }
}`;

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

export interface SaveMorphProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick"> {
  label?: string;
  doneLabel?: string;
  failLabel?: string;
  /** The save. Return a promise and the spinner runs until it settles; a rejection comes back as `failLabel`. */
  onSave?: () => void | Promise<unknown>;
  /** The size of the button. */
  size?: "default" | "lg";
}

/**
 * A save button that narrows into a spinner, then widens back as the spinning arc runs on into a check. The labels are
 * pinned in place and the button's edge reveals them, so no word ever slides. Its box never changes size.
 */
export function SaveMorph({ label = "Save changes", doneLabel = "Saved", failLabel = "Try again", onSave, size = "default", className, disabled, ...props }: SaveMorphProps) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const doneRef = React.useRef<HTMLSpanElement>(null);
  const timers = React.useRef<number[]>([]);
  const run = React.useRef(0);
  const live = React.useRef({ phase, w: 0, v: 0, full: 0, h: 0, radius: 0, rot: 0, finish: 0, raf: 0, last: 0, onScreen: true, reduced, kick: () => {} });
  live.current.phase = phase;
  live.current.reduced = reduced;

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const clearLater = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  React.useLayoutEffect(() => {
    const l = live.current;
    const root = rootRef.current;
    const btn = btnRef.current;
    if (!root || !btn) return;

    const checkX = () => -((doneRef.current?.offsetWidth ?? 0) + MARK_GAP) / 2;
    const paintMark = () => {
      const f = easeInOut(l.finish);
      const dash = SPIN_DASH + (CHECK - SPIN_DASH) * f;
      const start = (TOTAL - CHECK) * f;
      pathRef.current?.setAttribute("stroke-dasharray", `${dash.toFixed(3)} ${TOTAL.toFixed(3)}`);
      pathRef.current?.setAttribute("stroke-dashoffset", (-start).toFixed(3));
      if (svgRef.current) svgRef.current.style.transform = `translateX(${(checkX() * f).toFixed(2)}px) rotate(${l.rot.toFixed(2)}deg)`;
    };
    const paint = () => {
      btn.style.width = `${l.w.toFixed(2)}px`;
      // The corners round off with the narrowing, so the button arrives as a true circle.
      const k = l.full > l.h ? Math.max(0, Math.min(1, (l.full - l.w) / (l.full - l.h))) : 0;
      btn.style.borderRadius = k > 0 ? `${(l.radius + (l.h / 2 - l.radius) * k).toFixed(2)}px` : "";
      if (k > 0.5) btn.dataset.shape = "round";
      else delete btn.dataset.shape;
      paintMark();
    };
    const measure = () => {
      l.full = root.offsetWidth;
      l.h = root.offsetHeight;
      if (!btn.style.borderRadius) l.radius = parseFloat(getComputedStyle(btn).borderTopLeftRadius) || 0;
    };
    const targetW = () => (l.phase === "saving" && !l.reduced ? l.h : l.full);

    const frame = (t: number) => {
      l.raf = 0;
      const dt = Math.min(Math.max(t - l.last, 1) / 1000, 1 / 30);
      l.last = t;
      const to = targetW();
      l.v += (STIFFNESS * (to - l.w) - DAMPING * l.v) * dt;
      l.w += l.v * dt;
      const sized = Math.abs(to - l.w) < 0.1 && Math.abs(l.v) < 1;
      if (sized) {
        l.w = to;
        l.v = 0;
      }
      let turning = false;
      if (l.phase === "saving") {
        l.rot += (dt * 1000 * 360) / SPIN_MS;
        turning = true;
      } else if (l.phase === "done" && l.finish < 1) {
        // The arc keeps its speed, then slows onto a whole turn while the dash runs into the check.
        const before = easeInOut(l.finish);
        l.finish = Math.min(1, l.finish + (dt * 1000) / FINISH_MS);
        const after = easeInOut(l.finish);
        const left = 360 - (((l.rot % 360) + 360) % 360);
        l.rot += left * (before === 1 ? 1 : (after - before) / (1 - before));
        if (l.finish === 1) l.rot = 0;
        turning = true;
      }
      paint();
      if ((!sized || turning) && l.onScreen) l.raf = requestAnimationFrame(frame);
    };
    l.kick = () => {
      measure();
      if (l.reduced || !l.w) {
        l.w = targetW();
        l.v = 0;
        paint();
        return;
      }
      if (l.raf || !l.onScreen) return;
      l.last = performance.now();
      l.raf = requestAnimationFrame(frame);
    };
    l.kick();
    const ro = new ResizeObserver(() => {
      measure();
      if (l.phase !== "saving") {
        l.w = l.full;
        l.v = 0;
      }
      paint();
    });
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      l.onScreen = entry.isIntersecting;
      if (l.onScreen) l.kick();
      else {
        cancelAnimationFrame(l.raf);
        l.raf = 0;
      }
    });
    io.observe(root);
    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(l.raf);
      l.raf = 0;
    };
  }, []);

  React.useLayoutEffect(() => {
    const l = live.current;
    if (phase === "saving") {
      l.finish = 0;
    } else if (phase === "idle" || phase === "failed") {
      l.finish = 0;
      l.rot = 0;
    } else if (phase === "done" && l.reduced) {
      l.finish = 1;
      l.rot = 0;
    }
    l.kick();
  }, [phase, reduced]);

  React.useEffect(
    () => () => {
      run.current++;
      timers.current.forEach(window.clearTimeout);
    },
    [],
  );

  const press = () => {
    if (disabled || phase === "saving") return;
    clearLater();
    if (phase === "done") {
      setPhase("idle");
      return;
    }
    const id = ++run.current;
    setPhase("saving");
    const started = performance.now();
    const settle = (next: Phase) => {
      if (run.current !== id) return;
      later(
        () => {
          if (run.current !== id) return;
          setPhase(next);
          if (next === "done") later(() => run.current === id && setPhase("idle"), DONE_MS);
        },
        Math.max(0, MIN_SAVING_MS - (performance.now() - started)),
      );
    };
    let result: void | Promise<unknown>;
    try {
      result = onSave?.();
    } catch {
      settle("failed");
      return;
    }
    Promise.resolve(result).then(
      () => settle("done"),
      () => settle("failed"),
    );
  };

  const lg = size === "lg";
  const on = (p: boolean) => (p ? { "data-on": "" } : {});
  const shift = (MARK_SIZE + MARK_GAP) / 2;
  const spoken = phase === "saving" ? "Saving" : phase === "done" ? doneLabel : phase === "failed" ? failLabel : label;

  return (
    <span ref={rootRef} className={cn("relative inline-grid shrink-0 align-middle font-medium", lg ? "h-11 text-title" : "h-control text-body", className)}>
      <style href="ad-save-morph" precedence="default">
        {CSS}
      </style>
      {/* The widest label sets the box, so the button returns to exactly this width. */}
      <span aria-hidden className={cn("invisible col-start-1 row-start-1 flex items-center whitespace-nowrap", lg ? "px-6" : "px-3.5")}>
        {label}
      </span>
      <span aria-hidden className={cn("invisible col-start-1 row-start-1 flex items-center whitespace-nowrap", lg ? "px-6" : "px-3.5")}>
        <span style={{ width: MARK_SIZE + MARK_GAP }} />
        {doneLabel}
      </span>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-busy={phase === "saving"}
        aria-label={spoken}
        onClick={press}
        className="ad-press absolute left-1/2 top-0 h-full w-full -translate-x-1/2 cursor-pointer select-none overflow-hidden rounded-control bg-brand text-brand-ink hover:bg-brand-hover focus-visible:bg-brand-hover active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45"
        {...props}
      >
        <span aria-hidden {...on(phase === "idle")} className="ad-save-text">
          {label}
        </span>
        <span aria-hidden {...on(phase === "failed")} className="ad-save-text">
          {failLabel}
        </span>
        <span ref={doneRef} aria-hidden {...on(phase === "done")} className="ad-save-text" style={{ "--sx": `${shift}px` } as React.CSSProperties}>
          {doneLabel}
        </span>
        <svg
          ref={svgRef}
          aria-hidden
          {...on(phase === "saving" || phase === "done")}
          viewBox="0 0 16 16"
          width={MARK_SIZE}
          height={MARK_SIZE}
          fill="none"
          className="ad-save-mark"
        >
          <path ref={pathRef} d={MARK} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${SPIN_DASH} ${TOTAL}`} />
        </svg>
      </button>
      <span role="status" className="sr-only">
        {phase === "saving" ? "Saving" : phase === "done" ? doneLabel : phase === "failed" ? failLabel : ""}
      </span>
    </span>
  );
}
