import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

const THROW_DEG = 32;
/** The two wells the lever rests in. */
const WELL = 680;
const DRAG = 6;
/** The throw's push, which lets go once the lever is past the midpoint. */
const DRIVE = 270;
/** A thick patch of extra drag around the midpoint: the lever slows into it and hesitates before falling through. */
const MID_DRAG = 80;
const MID_WIDTH = 0.22;
const RECOIL = 0.2;
/** Px of sideways drag from one stop to the other. */
const TRAVEL = 136;

const CSS = `
.ad-lever { --lv: -1; touch-action: pan-y; -webkit-touch-callout: none; }
.ad-lever-arm { rotate: calc(var(--lv) * ${THROW_DEG}deg); transform-origin: 50% 100%; }
.ad-lever-rod { clip-path: polygon(24% 0, 76% 0, 100% 100%, 0 100%); background: linear-gradient(90deg, var(--ad-ink-muted), var(--ad-ink) 44%, var(--ad-ink-muted)); }
.ad-lever-grip { background: radial-gradient(circle at 36% 28%, var(--ad-ink), var(--ad-ink-muted) 92%); transition: scale 150ms var(--ad-ease), filter 150ms var(--ad-ease); }
.ad-lever-glint {
  /* grey-ok: the highlight on the polished ball, light rather than a UI grey */
  background: radial-gradient(circle at 34% 26%, rgb(255 255 255 / 0.6), transparent 34%);
}
.ad-lever:active .ad-lever-grip { scale: 0.97; }
@media (hover: hover) { .ad-lever:hover .ad-lever-grip { filter: brightness(1.05); } }
.ad-lever:focus-visible .ad-lever-plate { background: var(--ad-fill-strong); }
.ad-lever:focus-visible .ad-lever-slot { background: var(--ad-ink-muted); }`;

export interface LeverToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "value" | "defaultValue" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** The word on the left, for off. */
  offLabel?: string;
  /** The word on the right, for on. */
  onLabel?: string;
}

/** A chunky lever: it throws across with momentum, hesitates at the midpoint and lands with a small recoil. */
export function LeverToggle({ checked, defaultChecked = false, onCheckedChange, offLabel = "Closed", onLabel = "Open", disabled, className, style, ...props }: LeverToggleProps) {
  const [inner, setInner] = React.useState(defaultChecked);
  const value = checked ?? inner;
  // Which side the lever is on right now; it flips at the midpoint, before the throw has landed.
  const [side, setSide] = React.useState(value);
  const ref = React.useRef<HTMLButtonElement>(null);
  const change = React.useRef(onCheckedChange);
  change.current = onCheckedChange;
  const live = React.useRef({ disabled, value });
  live.current = { disabled, value };
  const ctl = React.useRef<{ to: (on: boolean, animate: boolean) => void; target: () => boolean } | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = live.current.value ? 1 : -1, v = 0, dir = x;
    let raf = 0, last = 0, onScreen = true, committed = live.current.value, shown = committed;
    let drag: { id: number; start: number; from: number; moved: boolean; samples: { t: number; x: number }[] } | null = null;

    const paint = () => {
      el.style.setProperty("--lv", x.toFixed(4));
      const now = Math.abs(x) < 0.02 ? shown : x > 0;
      if (now !== shown) {
        shown = now;
        setSide(now);
      }
    };
    const commit = (on: boolean) => {
      if (on === committed) return;
      committed = on;
      setInner(on);
      change.current?.(on);
    };
    const frame = (t: number) => {
      raf = 0;
      // Real elapsed time in small steps: on a slow device the throw drops frames instead of going into slow motion.
      const dt = Math.min(Math.max(t - last, 1) / 1000, 0.25);
      last = t;
      const steps = Math.ceil(dt * 480);
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        let f = WELL * x * (1 - x * x) - (DRAG + MID_DRAG * Math.exp(-((x / MID_WIDTH) ** 2))) * v;
        if (x * dir < 0.2) f += DRIVE * dir;
        v += f * h;
        x += v * h;
        if (x >= 1) {
          x = 1;
          if (v > 0) {
            if (dir > 0) commit(true);
            v = v < 0.6 ? 0 : -RECOIL * v;
          }
        } else if (x <= -1) {
          x = -1;
          if (v < 0) {
            if (dir < 0) commit(false);
            v = v > -0.6 ? 0 : -RECOIL * v;
          }
        }
      }
      const settled = Math.abs(x - dir) < 0.002 && Math.abs(v) < 0.02;
      if (settled) {
        x = dir;
        v = 0;
        commit(dir > 0);
      }
      paint();
      if (!settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (raf) return;
      if (!onScreen) {
        x = dir;
        v = 0;
        commit(dir > 0);
        paint();
        return;
      }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const to = (on: boolean, animate: boolean) => {
      dir = on ? 1 : -1;
      if (!animate || prefersReducedMotion()) {
        cancelAnimationFrame(raf);
        raf = 0;
        x = dir;
        v = 0;
        commit(on);
        paint();
        return;
      }
      kick();
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || live.current.disabled) return;
      el.setPointerCapture(e.pointerId);
      cancelAnimationFrame(raf);
      raf = 0;
      v = 0;
      drag = { id: e.pointerId, start: e.clientX, from: x, moved: false, samples: [{ t: e.timeStamp, x }] };
    };
    const move = (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      const dx = e.clientX - drag.start;
      if (!drag.moved && Math.abs(dx) < 4) return;
      drag.moved = true;
      x = Math.max(-1, Math.min(1, drag.from + (dx / TRAVEL) * 2));
      drag.samples.push({ t: e.timeStamp, x });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 90) drag.samples.shift();
      paint();
    };
    const up = (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      const d = drag;
      drag = null;
      if (e.type === "pointercancel" && !d.moved) return kick();
      if (!d.moved) return to(dir < 0, true);
      const first = d.samples[0];
      const end = d.samples[d.samples.length - 1];
      const span = (end.t - first.t) / 1000;
      v = span > 0.008 && e.timeStamp - end.t < 70 ? Math.max(-14, Math.min(14, (end.x - first.x) / span)) : 0;
      // It goes where it is heading: a flick past the middle carries, a slow drag falls back to the nearer side.
      const heading = x + v * 0.09;
      to(heading === 0 ? dir > 0 : heading > 0, true);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen || !raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
      x = dir;
      v = 0;
      commit(dir > 0);
      paint();
    });
    io.observe(el);
    ctl.current = { to, target: () => dir > 0 };
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      io.disconnect();
      cancelAnimationFrame(raf);
      ctl.current = null;
    };
  }, []);

  // A value set from outside throws the lever too.
  React.useEffect(() => {
    if (ctl.current && ctl.current.target() !== value) ctl.current.to(value, true);
  }, [value]);

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={`${onLabel} or ${offLabel}`}
      disabled={disabled}
      style={{ "--lv": value ? 1 : -1, ...style } as React.CSSProperties}
      onClick={(e) => {
        // Pointers are handled on press and release; a click with no pointer is Space, Enter or a screen reader.
        if (e.detail === 0) ctl.current?.to(!ctl.current.target(), true);
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        ctl.current?.to(e.key === "ArrowRight", false);
      }}
      className={cn("ad-lever relative block h-[232px] w-[320px] max-w-full cursor-grab select-none rounded-card active:cursor-grabbing disabled:cursor-default", className)}
      {...props}
    >
      <style href="ad-lever-toggle" precedence="default">
        {CSS}
      </style>
      <span aria-hidden className={cn("absolute left-0 top-0 text-title font-medium transition-colors duration-150", side ? "text-ink-muted" : "text-ink")}>
        {offLabel}
      </span>
      <span aria-hidden className={cn("absolute right-0 top-0 inline-flex items-center gap-2 text-title font-medium transition-colors duration-150", side ? "text-ink" : "text-ink-muted")}>
        <span className={cn("size-1.5 rounded-full bg-success transition-opacity duration-150", side ? "opacity-100" : "opacity-0")} />
        {onLabel}
      </span>
      <span aria-hidden className="ad-lever-plate absolute bottom-0 left-1/2 h-[64px] w-[216px] max-w-full -translate-x-1/2 rounded-card bg-fill transition-colors duration-150">
        <span className="ad-lever-slot absolute left-1/2 top-1/2 h-3 w-[160px] max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fill-strong transition-colors duration-150" />
      </span>
      <span aria-hidden className="ad-lever-arm absolute bottom-[32px] left-1/2 -ml-[13px] block h-[150px] w-[26px]">
        <span className="ad-lever-rod absolute inset-x-0 bottom-0 top-[30px] block" />
        <span className="ad-lever-grip absolute left-1/2 top-0 -ml-[31px] block size-[62px] rounded-full shadow-raised">
          <span className="ad-lever-glint absolute inset-0 block rounded-full" />
        </span>
      </span>
      <span aria-hidden className="absolute bottom-[14px] left-1/2 -ml-[18px] block size-[36px] rounded-full bg-fill-strong shadow-card" />
    </button>
  );
}
