import * as React from "react";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";

const SWEEP = 270;
const START_ANGLE = -135;
/** How strongly a dragged knob sticks to its notches: 0 follows the finger, 1 stops dead on each one. */
const HOLD = 0.62;
/** The pull of the nearest notch, in notches/s². */
const DETENT = 420;
const GLIDE_DRAG = 2.4;
const CATCH_DRAG = 24;
const STOP = 620;
const MAX_FLICK = 42;

const CSS = `
.ad-knob-dial { container-type: inline-size; }
.ad-knob-hit { --k: ${START_ANGLE}; touch-action: none; cursor: grab; -webkit-touch-callout: none; }
.ad-knob-hit:active { cursor: grabbing; }
.ad-knob-rotor { rotate: calc(var(--k) * 1deg); }
.ad-knob-grip { background: repeating-conic-gradient(var(--ad-fill-strong) 0 2.5deg, var(--ad-fill) 2.5deg 5deg); }
.ad-knob-cap { background: radial-gradient(circle at 34% 24%, var(--ad-fill-strong), var(--ad-fill) 68%); transition: filter 150ms var(--ad-ease); }
@media (hover: hover) { .ad-knob-hit:hover .ad-knob-cap { filter: brightness(1.06); } }
.ad-knob-hit:focus-visible .ad-knob-cap { background: var(--ad-fill-strong); }
.ad-knob-sheen {
  mix-blend-mode: soft-light;
  /* grey-ok: light falling on the turned metal, fixed while the knob spins under it */
  background: conic-gradient(from 305deg, transparent, rgb(255 255 255 / 0.5) 42deg, transparent 96deg, transparent 182deg, rgb(255 255 255 / 0.24) 224deg, transparent 276deg);
}`;

const rubber = (x: number) => (x * 0.7) / (x + 0.7);

/**
 * The knob's physics, in notch units. A sine well sits on every notch, so a flick coasts over them, visibly catching on
 * each, until it no longer has the speed to climb the next one. Everything is painted through one CSS variable.
 */
function attachKnob(hit: HTMLElement, opts: { notches: number; start: number; onNotch: (n: number) => void }) {
  const { notches, onNotch } = opts;
  const perNotch = SWEEP / notches;
  let u = opts.start, v = 0, shownNotch = opts.start;
  let raf = 0, last = 0, onScreen = true;
  let drag: { id: number; raw: number; angle: number; samples: { t: number; raw: number }[] } | null = null;
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => hit.addEventListener(type, fn, { signal: ac.signal });

  const clampNotch = (n: number) => Math.max(0, Math.min(notches, n));
  const paint = () => {
    hit.style.setProperty("--k", (START_ANGLE + u * perNotch).toFixed(2));
    const n = clampNotch(Math.round(u));
    if (n !== shownNotch) {
      shownNotch = n;
      onNotch(n);
    }
  };
  const shape = (raw: number) => {
    if (raw < 0) return -rubber(-raw);
    if (raw > notches) return notches + rubber(raw - notches);
    return raw - (HOLD * Math.sin(2 * Math.PI * raw)) / (2 * Math.PI);
  };

  const frame = (t: number) => {
    raf = 0;
    const dt = Math.min(Math.max(t - last, 1) / 1000, 0.25);
    last = t;
    const steps = Math.ceil(dt * 240);
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      let f = (-DETENT * Math.sin(2 * Math.PI * u)) / (2 * Math.PI) - (GLIDE_DRAG + CATCH_DRAG * Math.exp(-((v / 4) ** 2))) * v;
      if (u < 0) f += -STOP * u - 12 * v;
      if (u > notches) f += -STOP * (u - notches) - 12 * v;
      v += f * h;
      u += v * h;
    }
    const near = clampNotch(Math.round(u));
    const settled = Math.abs(u - near) < 0.004 && Math.abs(v) < 0.04;
    if (settled) {
      u = near;
      v = 0;
    }
    paint();
    if (!settled) raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (raf || !onScreen) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const pointerAngle = (e: PointerEvent) => {
    const r = hit.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    return { angle: (Math.atan2(y, x) * 180) / Math.PI, far: Math.hypot(x, y) > 10 };
  };

  on("pointerdown", (e) => {
    if (e.button !== 0) return;
    hit.setPointerCapture(e.pointerId);
    stop();
    v = 0;
    drag = { id: e.pointerId, raw: u, angle: pointerAngle(e).angle, samples: [{ t: e.timeStamp, raw: u }] };
  });
  on("pointermove", (e) => {
    if (drag?.id !== e.pointerId) return;
    const { angle, far } = pointerAngle(e);
    if (!far) return;
    let delta = angle - drag.angle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    drag.angle = angle;
    drag.raw = Math.max(-1.5, Math.min(notches + 1.5, drag.raw + delta / perNotch));
    drag.samples.push({ t: e.timeStamp, raw: drag.raw });
    while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 90) drag.samples.shift();
    u = prefersReducedMotion() ? clampNotch(Math.round(drag.raw)) : shape(drag.raw);
    paint();
  });
  const release = (e: PointerEvent) => {
    if (drag?.id !== e.pointerId) return;
    const first = drag.samples[0];
    const end = drag.samples[drag.samples.length - 1];
    const span = (end.t - first.t) / 1000;
    const idle = e.timeStamp - end.t > 70;
    drag = null;
    if (prefersReducedMotion()) {
      u = clampNotch(Math.round(u));
      v = 0;
      paint();
      return;
    }
    v = span > 0.008 && !idle ? Math.max(-MAX_FLICK, Math.min(MAX_FLICK, (end.raw - first.raw) / span)) : 0;
    kick();
  };
  on("pointerup", release);
  on("pointercancel", release);

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen || drag) return;
    stop();
    u = clampNotch(Math.round(u));
    v = 0;
    paint();
  });
  io.observe(hit);

  return {
    /** Jump to a notch with no animation: keys and controlled values. */
    set(n: number) {
      stop();
      drag = null;
      u = n;
      v = 0;
      shownNotch = n;
      hit.style.setProperty("--k", (START_ANGLE + u * perNotch).toFixed(2));
    },
    notch: () => shownNotch,
    destroy() {
      ac.abort();
      io.disconnect();
      stop();
    },
  };
}

export interface DetentKnobProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** The distance between two notches. */
  step?: number;
  /** The value at the knob's centre and at the two ends of its scale. */
  format?: (value: number) => string;
  /** The accessible name of the dial. */
  label?: string;
  /** The item the value applies to, on the row under the dial. Leave out with `price` to hide the row. */
  product?: string;
  /** The full price: the row shows it reduced by the value, read as a percentage. */
  price?: number;
}

/** A weighted dial that clicks between notches, keeps spinning after a flick and settles on the nearest value. */
export function DetentKnob({
  value,
  defaultValue = 20,
  onValueChange,
  min = 0,
  max = 60,
  step = 5,
  format = (v) => `${v}%`,
  label = "Discount",
  product = "Gelas kopi tanah liat",
  price = 85000,
  className,
  ...props
}: DetentKnobProps) {
  const notches = Math.max(1, Math.round((max - min) / step));
  const toNotch = (v: number) => Math.max(0, Math.min(notches, Math.round((v - min) / step)));
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const notch = toNotch(current);
  const hitRef = React.useRef<HTMLDivElement>(null);
  const ctl = React.useRef<ReturnType<typeof attachKnob>>(null);
  const change = React.useRef(onValueChange);
  change.current = onValueChange;
  const [startAngle] = React.useState(() => START_ANGLE + (notch * SWEEP) / notches);
  const live = React.useRef({ min, step, notch });
  live.current = { min, step, notch };

  React.useEffect(() => {
    const el = hitRef.current;
    if (!el) return;
    const c = attachKnob(el, {
      notches,
      start: live.current.notch,
      onNotch: (n) => {
        const next = live.current.min + n * live.current.step;
        setInner(next);
        change.current?.(next);
      },
    });
    ctl.current = c;
    return () => {
      c.destroy();
      ctl.current = null;
    };
  }, [notches]);

  React.useEffect(() => {
    if (ctl.current && ctl.current.notch() !== notch) ctl.current.set(notch);
  }, [notch]);

  const keyTo = (n: number) => {
    const next = Math.max(0, Math.min(notches, n));
    if (next === notch) return;
    ctl.current?.set(next);
    const v = min + next * step;
    setInner(v);
    onValueChange?.(v);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const to = {
      ArrowRight: notch + 1,
      ArrowUp: notch + 1,
      ArrowLeft: notch - 1,
      ArrowDown: notch - 1,
      PageUp: notch + 3,
      PageDown: notch - 3,
      Home: 0,
      End: notches,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    keyTo(to);
  };

  const shownValue = min + notch * step;
  const reduced = price !== undefined ? Math.round(price * (1 - shownValue / 100)) : 0;

  return (
    <div className={cn("grid w-[320px] max-w-full select-none justify-items-center gap-5", className)} {...props}>
      <style href="ad-detent-knob" precedence="default">
        {CSS}
      </style>
      <div className="ad-knob-dial relative aspect-square w-full max-w-[280px]">
        <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 size-full">
          {Array.from({ length: notches + 1 }, (_, i) => {
            const a = ((START_ANGLE + (i * SWEEP) / notches - 90) * Math.PI) / 180;
            const on = i <= notch;
            const here = i === notch;
            const inner = here ? 83 : 87;
            return (
              <line
                key={`notch-${min + i * step}`}
                x1={100 + Math.cos(a) * inner}
                y1={100 + Math.sin(a) * inner}
                x2={100 + Math.cos(a) * 95}
                y2={100 + Math.sin(a) * 95}
                stroke={here ? "var(--ad-brand)" : on ? "var(--ad-ink-muted)" : "var(--ad-fill-strong)"}
                strokeWidth={here ? 3 : 2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <span aria-hidden className="absolute bottom-[5%] left-[9%] text-small tabular-nums text-ink-muted">
          {format(min)}
        </span>
        <span aria-hidden className="absolute bottom-[5%] right-[9%] text-small tabular-nums text-ink-muted">
          {format(max)}
        </span>
        <div
          ref={hitRef}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={shownValue}
          aria-valuetext={format(shownValue)}
          onKeyDown={onKeyDown}
          style={{ "--k": startAngle } as React.CSSProperties}
          className="ad-knob-hit ad-press absolute inset-[15%] rounded-full active:scale-[0.98]"
        >
          <div className="ad-knob-rotor ad-knob-grip absolute inset-0 rounded-full shadow-raised" />
          <div className="ad-knob-cap absolute inset-[7%] rounded-full shadow-card">
            <div className="ad-knob-sheen absolute inset-0 rounded-full" />
          </div>
          <div className="ad-knob-rotor pointer-events-none absolute inset-[7%]">
            <span className="absolute left-1/2 top-[7%] h-[11%] w-[3.5%] -translate-x-1/2 rounded-full bg-ink" />
          </div>
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-[13cqw] font-semibold leading-none tabular-nums text-ink">{format(shownValue)}</span>
        </div>
      </div>
      {product !== undefined && price !== undefined && (
        <div className="flex w-full items-baseline justify-between gap-4 text-body">
          <span className="min-w-0 truncate text-ink-muted">{product}</span>
          <span className="shrink-0 text-title font-semibold tabular-nums text-ink">{formatRp(reduced)}</span>
        </div>
      )}
    </div>
  );
}
