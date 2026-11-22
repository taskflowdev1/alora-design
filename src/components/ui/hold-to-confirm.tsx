import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

/** The fill's soft start, so a press answers at once, before the hold has made any progress. */
const SEED = 16;
const DRAIN = 0.075;
const UNDO_DRAIN = 0.11;

const CSS = `
.ad-htc { --hp: 0; --hr: 0px; --hx: 50%; --hy: 50%; touch-action: pan-y; -webkit-touch-callout: none; }
.ad-htc-fill { clip-path: circle(var(--hr) at var(--hx) var(--hy)); }
.ad-htc[data-calm] .ad-htc-fill { clip-path: none; opacity: var(--hp); }
.ad-htc-row { transition: transform 240ms var(--ad-ease); }
.ad-htc[data-state="done"] .ad-htc-row { transform: translateX(calc(var(--hold-shift, 0px) * -1)); }
.ad-htc-word { transition: opacity 180ms var(--ad-ease), filter 180ms var(--ad-ease); }
.ad-htc-word[data-word="done"] { opacity: 0; filter: blur(3px); }
.ad-htc[data-state="done"] .ad-htc-word[data-word="done"] { opacity: 1; filter: none; }
.ad-htc[data-state="done"] .ad-htc-word[data-word="hold"] { opacity: 0; filter: blur(3px); }`;

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

function Label({ label, doneLabel, detail, measure }: { label: string; doneLabel: string; detail?: string; measure?: React.Ref<HTMLSpanElement> }) {
  return (
    <span className="ad-htc-row inline-flex items-baseline justify-center gap-[0.35em] whitespace-nowrap">
      <span ref={measure} className="inline-grid justify-items-end">
        <span data-word="hold" className="ad-htc-word col-start-1 row-start-1">
          {label}
        </span>
        <span data-word="done" className="ad-htc-word col-start-1 row-start-1">
          {doneLabel}
        </span>
      </span>
      {detail && <span className="font-semibold tabular-nums">{detail}</span>}
    </span>
  );
}

export interface HoldToConfirmProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick"> {
  /** What holding does, in the resting button. */
  label?: string;
  /** The same words once it has happened. */
  doneLabel?: string;
  /** The figure it applies to, kept in place through the whole hold. */
  detail?: string;
  /** How long to hold, in ms. */
  duration?: number;
  /** Ms before a finished button drains back to rest; 0 keeps it finished. */
  resetAfter?: number;
  onConfirm?: () => void;
}

/**
 * A button for an action worth a second thought. Pressing fills it outward from the finger, letting go drains it back,
 * and holding to the end leaves it filled, with the verb turned to the past tense.
 */
export function HoldToConfirm({
  label = "Hold to pay",
  doneLabel = "Paid",
  detail = "Rp 1.250.000",
  duration = 1200,
  resetAfter = 2800,
  onConfirm,
  disabled,
  className,
  ...props
}: HoldToConfirmProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);
  const [done, setDone] = React.useState(false);
  const calm = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const confirm = React.useRef(onConfirm);
  confirm.current = onConfirm;
  const live = React.useRef({ duration, resetAfter, disabled });
  live.current = { duration, resetAfter, disabled };
  const ctl = React.useRef<{ start: (x: number, y: number) => void; release: () => void; finish: () => void } | null>(null);

  // The row re-centres on the shorter word by half the difference, so "Rp …" glides instead of jumping.
  React.useLayoutEffect(() => {
    const el = ref.current;
    const box = measureRef.current;
    if (!el || !box) return;
    const [hold, finished] = [box.querySelector<HTMLElement>('[data-word="hold"]'), box.querySelector<HTMLElement>('[data-word="done"]')];
    if (!hold || !finished) return;
    const set = () => el.style.setProperty("--hold-shift", `${((hold.offsetWidth - finished.offsetWidth) / 2).toFixed(1)}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(box);
    return () => ro.disconnect();
  }, [label, doneLabel]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let p = 0, raf = 0, last = 0, maxR = 0, seeded = false;
    let mode: "idle" | "hold" | "drain" | "done" = "idle";
    let timer = 0;

    const paint = () => {
      const r = maxR * p + SEED * Math.min(1, p / 0.05);
      el.style.setProperty("--hr", `${r.toFixed(2)}px`);
      el.style.setProperty("--hp", p.toFixed(4));
    };
    const finish = () => {
      p = 1;
      mode = "done";
      paint();
      setDone(true);
      confirm.current?.();
      if (live.current.resetAfter > 0) {
        timer = window.setTimeout(() => {
          setDone(false);
          mode = "drain";
          seeded = true;
          kick();
        }, live.current.resetAfter);
      }
    };
    const frame = (t: number) => {
      raf = 0;
      const dt = Math.max(t - last, 1) / 1000;
      last = t;
      if (mode === "hold") {
        // Capped, so a stalled tab can never complete a hold the person didn't sit through.
        p += Math.min(dt, 1 / 20) / (live.current.duration / 1000);
        if (p >= 1) return finish();
      } else if (mode === "drain") {
        p *= Math.exp(-dt / (seeded ? UNDO_DRAIN : DRAIN));
        if (p < 0.004) {
          p = 0;
          mode = "idle";
          seeded = false;
          paint();
          return;
        }
      } else return;
      paint();
      raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const start = (x: number, y: number) => {
      if (mode === "done" || live.current.disabled) return;
      const r = el.getBoundingClientRect();
      // From a finger the fill grows out of the touch; keyboard presses grow from the middle.
      const ox = Number.isNaN(x) ? r.width / 2 : x - r.left;
      const oy = Number.isNaN(y) ? r.height / 2 : y - r.top;
      if (mode === "idle") {
        el.style.setProperty("--hx", `${ox.toFixed(1)}px`);
        el.style.setProperty("--hy", `${oy.toFixed(1)}px`);
        maxR = Math.hypot(Math.max(ox, r.width - ox), Math.max(oy, r.height - oy));
      }
      mode = "hold";
      kick();
    };
    const release = () => {
      if (mode !== "hold") return;
      mode = "drain";
      kick();
    };
    // A click with no pointer behind it (a screen reader's activate) can't hold, so it confirms outright.
    const finishNow = () => {
      if (mode === "done" || live.current.disabled) return;
      const r = el.getBoundingClientRect();
      maxR = Math.hypot(r.width, r.height);
      finish();
    };
    ctl.current = { start, release, finish: finishNow };
    paint();
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      ctl.current = null;
    };
  }, []);

  const keyHeld = React.useRef(false);

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={done ? [doneLabel, detail].filter(Boolean).join(" ") : [label, detail].filter(Boolean).join(" ")}
      data-state={done ? "done" : "idle"}
      data-calm={calm ? "" : undefined}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        ctl.current?.start(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        // Sliding well off the button is the way out of a hold.
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left - 32 || e.clientX > r.right + 32 || e.clientY < r.top - 32 || e.clientY > r.bottom + 32) ctl.current?.release();
      }}
      onPointerUp={() => ctl.current?.release()}
      onPointerCancel={() => ctl.current?.release()}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key !== " " && e.key !== "Enter") return;
        e.preventDefault();
        if (e.repeat || keyHeld.current) return;
        keyHeld.current = true;
        ctl.current?.start(NaN, NaN);
      }}
      onKeyUp={(e) => {
        if (e.key !== " " && e.key !== "Enter") return;
        keyHeld.current = false;
        ctl.current?.release();
      }}
      onBlur={() => {
        keyHeld.current = false;
        ctl.current?.release();
      }}
      onClick={(e) => {
        if (e.detail === 0 && !keyHeld.current) ctl.current?.finish();
      }}
      className={cn(
        "ad-htc ad-press relative block h-[56px] w-[360px] max-w-full cursor-pointer select-none overflow-hidden rounded-control bg-fill text-title font-medium text-ink hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.98] disabled:cursor-default disabled:text-ink-muted disabled:hover:bg-fill data-[state=done]:cursor-default data-[state=done]:active:scale-100",
        className,
      )}
      {...props}
    >
      <style href="ad-hold-to-confirm" precedence="default">
        {CSS}
      </style>
      <span aria-hidden className="absolute inset-0 grid place-items-center">
        <Label label={label} doneLabel={doneLabel} detail={detail} measure={measureRef} />
      </span>
      <span aria-hidden className="ad-htc-fill absolute inset-0 grid place-items-center bg-brand text-brand-ink">
        <Label label={label} doneLabel={doneLabel} detail={detail} />
      </span>
      <span role="status" className="sr-only">
        {done ? [doneLabel, detail].filter(Boolean).join(" ") : ""}
      </span>
    </button>
  );
}
