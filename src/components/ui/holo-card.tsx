import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

const STIFFNESS = 190;
const DAMPING = 27.6;
const KEY_STEP = 0.25;
/** Where the light rests, on the card's -1…1 axes: the upper left, like the page's one light source. */
const REST_X = -0.45;
const REST_Y = -0.6;

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/*
 * Everything moves through five numbers on the root (--hx/--hy tilt, --lx/--ly light, --hon how lit) and only touches
 * transform, opacity and filter. The light is an oversized masked layer that travels with the pointer; the foil inside
 * it travels back by the same amount, so the rainbow stays on the card and the mask alone decides where it shows.
 * 22.7% is half the card in units of the 220% light layer.
 *
 * The foil, glare and chip colours are image content, the one place outside the grey ramp (hence grey-ok).
 */
const CSS = `
.ad-holo { --hx: 0; --hy: 0; --lx: ${REST_X}; --ly: ${REST_Y}; --hon: 0; --hue: 0; perspective: 1000px; container-type: inline-size; touch-action: pan-y; }
.ad-holo[data-tone="holo"] {
  /* grey-ok: the card's printed base, a deep violet to teal under the foil */
  --holo-base: linear-gradient(128deg in oklab, oklch(0.31 0.05 288), oklch(0.235 0.04 252) 52%, oklch(0.29 0.05 200));
  --holo-ink: var(--ad-side-ink); --holo-rest: 0.42; --holo-gain: 0.5; --holo-sat: 1;
  --holo-floor: oklch(0.235 0.04 252); --holo-shade: 0.52; /* grey-ok: the base colour again, under the text */
}
.ad-holo[data-tone="graphite"] {
  --holo-base: linear-gradient(128deg in oklab, var(--ad-side-fill-strong), var(--ad-side) 58%, var(--ad-side-raised));
  --holo-ink: var(--ad-side-ink); --holo-rest: 0.16; --holo-gain: 0.46; --holo-sat: 0.28;
  --holo-floor: var(--ad-side); --holo-shade: 0.46;
}
.ad-holo[data-tone="accent"] {
  --holo-base: linear-gradient(128deg in oklab, var(--ad-brand-6), var(--ad-brand-8));
  --holo-ink: var(--ad-side-ink); --holo-rest: 0.14; --holo-gain: 0.34; --holo-sat: 0.7;
  --holo-floor: var(--ad-brand-8); --holo-shade: 0.7;
}
.ad-holo-card { transform: rotateX(calc(var(--hy) * -13deg)) rotateY(calc(var(--hx) * 13deg)); background: var(--holo-base); color: var(--holo-ink); isolation: isolate; }
.ad-holo-shadow { transform: translate(calc(var(--hx) * -2.6cqw), calc(var(--hy) * -2.2cqw + 2.4cqw)); }
.ad-holo-light {
  left: -60%; top: -60%; width: 220%; height: 220%; pointer-events: none; mix-blend-mode: screen;
  opacity: calc(var(--holo-rest) + var(--hon) * var(--holo-gain));
  transform: translate(calc(var(--lx) * 22.7%), calc(var(--ly) * 22.7%));
  mask-image: radial-gradient(closest-side, #000 14%, rgb(0 0 0 / 0.55) 46%, transparent 82%);
}
.ad-holo-foil {
  inset: 0;
  transform: translate(calc(var(--lx) * -22.7% + var(--hx) * -6%), calc(var(--ly) * -22.7% + var(--hy) * -6%));
  filter: hue-rotate(calc(var(--hue) * 1deg)) saturate(var(--holo-sat));
  /* grey-ok: iridescent foil. Chroma stays inside sRGB: a clipped stop shows as a hard streak across the card. */
  background:
    conic-gradient(from 20deg at -12% 118% in oklch, oklch(0.58 0.1 340), oklch(0.6 0.09 80), oklch(0.61 0.08 170), oklch(0.57 0.09 260), oklch(0.58 0.1 340)),
    repeating-linear-gradient(112deg in oklab, oklch(0.58 0.1 350) 0%, oklch(0.61 0.09 70) 7%, oklch(0.63 0.085 140) 14%, oklch(0.62 0.07 215) 21%, oklch(0.56 0.1 285) 28%, oklch(0.58 0.1 350) 35%);
  background-blend-mode: soft-light;
}
.ad-holo-foil::after {
  content: ""; position: absolute; inset: 0; mix-blend-mode: color-dodge; opacity: 0.55;
  transform: translate(calc(var(--hx) * 1.4%), calc(var(--hy) * 1.4%));
  /* grey-ok: the fine diffraction grating pressed into the foil */
  background:
    repeating-linear-gradient(62deg, rgb(255 255 255 / 0.2) 0 1px, transparent 1px 3px), /* grey-ok */
    repeating-linear-gradient(-58deg, rgb(255 255 255 / 0.16) 0 1px, transparent 1px 4px); /* grey-ok */
}
/* Shades the foil where the text sits, so the number stays readable with the light right on it. */
.ad-holo-shade { background: var(--holo-floor); pointer-events: none; mask-image: linear-gradient(to bottom, transparent 22%, rgb(0 0 0 / calc(var(--holo-shade) * 0.3)) 41%, rgb(0 0 0 / var(--holo-shade)) 60%); }
.ad-holo-glare {
  left: -50%; top: -50%; width: 200%; height: 200%; pointer-events: none; mix-blend-mode: soft-light;
  opacity: calc(0.34 + var(--hon) * 0.36);
  transform: translate(calc(var(--lx) * 25%), calc(var(--ly) * 25%));
  /* grey-ok: a white specular highlight, light rather than a UI grey */
  background: radial-gradient(closest-side, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0.32) 34%, transparent 68%);
}`;

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

/**
 * The tilt: a spring in rAF that only runs while something is moving and the card is on screen. A mouse aims the card
 * directly; a finger turns it from where it was, 1:1, so a tap doesn't move it; arrow keys step it with no animation.
 */
function attachTilt(el: HTMLElement) {
  let x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0;
  let glow = 0, targetGlow = 0;
  let raf = 0, last = 0;
  let onScreen = true, hovering = false, keyFocus = false;
  let drag: { id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null = null;
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => el.addEventListener(type, fn, { signal: ac.signal });

  const paint = () => {
    const s = el.style;
    s.setProperty("--hx", x.toFixed(4));
    s.setProperty("--hy", y.toFixed(4));
    s.setProperty("--lx", (REST_X + (x - REST_X) * glow).toFixed(4));
    s.setProperty("--ly", (REST_Y + (y - REST_Y) * glow).toFixed(4));
    s.setProperty("--hon", glow.toFixed(4));
    s.setProperty("--hue", (34 * x - 24 * y).toFixed(2));
  };

  const frame = (t: number) => {
    raf = 0;
    const dt = Math.min(Math.max(t - last, 1) / 1000, 1 / 30);
    last = t;
    if (drag) {
      vx = (tx - x) / dt;
      vy = (ty - y) / dt;
      x = tx;
      y = ty;
    } else {
      vx += (STIFFNESS * (tx - x) - DAMPING * vx) * dt;
      vy += (STIFFNESS * (ty - y) - DAMPING * vy) * dt;
      x += vx * dt;
      y += vy * dt;
    }
    glow += (targetGlow - glow) * (1 - Math.exp(-dt / 0.12));
    const settled = Math.abs(tx - x) < 0.001 && Math.abs(ty - y) < 0.001 && Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01 && Math.abs(targetGlow - glow) < 0.003;
    if (settled) {
      x = tx;
      y = ty;
      vx = vy = 0;
      glow = targetGlow;
    }
    paint();
    if (!settled) raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    if (raf || !onScreen) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const rest = () => {
    tx = ty = 0;
    targetGlow = hovering || keyFocus ? 1 : 0;
    kick();
  };
  const aim = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
    ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1);
    targetGlow = 1;
    kick();
  };

  on("pointerenter", (e) => {
    if (e.pointerType === "touch") return;
    hovering = true;
    aim(e);
  });
  on("pointerleave", (e) => {
    if (e.pointerType === "touch") return;
    hovering = false;
    rest();
  });
  on("pointerdown", (e) => {
    if (e.pointerType === "touch") drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: x, oy: y, moved: false };
  });
  on("pointermove", (e) => {
    if (drag?.id === e.pointerId) {
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      const r = el.getBoundingClientRect();
      tx = clamp(drag.ox + dx / (r.width / 2));
      ty = clamp(drag.oy + dy / (r.height / 2));
      targetGlow = 1;
      kick();
    } else if (hovering) aim(e);
  });
  const release = (e: PointerEvent) => {
    if (drag?.id !== e.pointerId) return;
    drag = null;
    rest();
  };
  on("pointerup", release);
  on("pointercancel", release);

  on("focus", () => {
    keyFocus = el.matches(":focus-visible");
    if (keyFocus) rest();
  });
  on("blur", () => {
    keyFocus = false;
    rest();
  });
  on("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!step && e.key !== "Home") return;
    e.preventDefault();
    keyFocus = true;
    x = tx = step ? clamp(tx + step[0] * KEY_STEP) : 0;
    y = ty = step ? clamp(ty + step[1] * KEY_STEP) : 0;
    vx = vy = 0;
    glow = targetGlow = 1;
    paint();
  });

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) return;
    cancelAnimationFrame(raf);
    raf = 0;
    x = y = tx = ty = vx = vy = 0;
    glow = targetGlow = keyFocus ? 1 : 0;
    paint();
  });
  io.observe(el);

  return () => {
    ac.abort();
    io.disconnect();
    cancelAnimationFrame(raf);
    for (const k of ["--hx", "--hy", "--lx", "--ly", "--hon", "--hue"]) el.style.removeProperty(k);
  };
}

function Chip() {
  const id = React.useId();
  return (
    <svg viewBox="0 0 40 30" aria-hidden className="block h-auto w-[11.5cqw]">
      <defs>
        {/* grey-ok: the chip's champagne metal is artwork */}
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0dfb2" />{/* grey-ok */}
          <stop offset="0.5" stopColor="#c9a968" />{/* grey-ok */}
          <stop offset="1" stopColor="#ecd8a4" />{/* grey-ok */}
        </linearGradient>
      </defs>
      <rect width="40" height="30" rx="6" fill={`url(#${id})`} />
      {/* grey-ok: the contact pads' engraving */}
      <path d="M0 10h12M0 20h12M28 10h12M28 20h12M12 0v7a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V0M12 30v-7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7M12 10v10M28 10v10" fill="none" stroke="#8c7340" strokeWidth="1" />
    </svg>
  );
}

const Contactless = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden className="block size-[6cqw]">
    <path d="M6 9.2a5 5 0 0 1 0 5.6M9.8 6.8a9.6 9.6 0 0 1 0 10.4M13.6 4.4a14.2 14.2 0 0 1 0 15.2M17.4 2a18.8 18.8 0 0 1 0 20" />
  </svg>
);

/** A made-up network: three rising slanted bars. */
const NetworkMark = () => (
  <svg viewBox="0 0 36 24" fill="currentColor" aria-hidden className="block h-auto w-[10cqw] shrink-0">
    <path d="M1 23 6 13h6L7 23zM11 23 19 7h6L17 23zM21 23 32 1h3.2L25 23z" />
  </svg>
);

export interface HoloCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The name on the card, as printed. */
  holder?: string;
  /** The last four digits; the rest of the number is always masked. */
  last4?: string;
  /** Printed as given, `MM/YY`. */
  expiry?: string;
  /** The finish: iridescent foil, quiet graphite, or the theme's accent. */
  tone?: "holo" | "graphite" | "accent";
  /** Tilt toward the pointer, a finger or the arrow keys. Off, or under reduced motion, it rests with a soft sheen. */
  interactive?: boolean;
}

/**
 * A payment card at ISO proportions (85.6 × 53.98) with a holographic foil. It turns in 3D toward the pointer inside a
 * box that never changes size, so nothing around it moves. Type scales with its width: set the width with `className`.
 */
export function HoloCard({ holder = "RIZKY HARTONO", last4 = "4410", expiry = "08/29", tone = "holo", interactive = true, className, ...props }: HoloCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const tilts = interactive && !reduced;
  React.useEffect(() => (tilts && ref.current ? attachTilt(ref.current) : undefined), [tilts]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Card ending in ${last4}, ${holder}, expires ${expiry}`}
      translate="no"
      tabIndex={tilts ? 0 : undefined}
      data-tone={tone}
      className={cn("ad-holo relative aspect-[85.6/53.98] w-[380px] max-w-full shrink-0 select-none", className)}
      {...props}
    >
      <style href="ad-holo-card" precedence="default">
        {CSS}
      </style>
      <div aria-hidden className="ad-holo-shadow absolute inset-[6%] rounded-card shadow-dialog" />
      <div aria-hidden className="ad-holo-card absolute inset-0 overflow-hidden rounded-card shadow-raised">
        <div className="ad-holo-light absolute">
          <div className="ad-holo-foil absolute" />
        </div>
        <div className="ad-holo-glare absolute" />
        <div className="ad-holo-shade absolute inset-0" />
        <div className="relative grid h-full grid-rows-[auto_1fr_auto_auto] p-[6.4cqw]">
          <div className="flex items-center justify-between">
            <Chip />
            <Contactless />
          </div>
          <span />
          <p className="flex justify-between whitespace-nowrap text-[6.1cqw] font-medium leading-none tabular-nums">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span>{last4}</span>
          </p>
          <div className="mt-[5cqw] flex items-end gap-[5cqw] text-[3.7cqw] font-medium leading-none tabular-nums">
            <span className="min-w-0 flex-1 truncate">{holder}</span>
            <span className="shrink-0">{expiry}</span>
            <NetworkMark />
          </div>
        </div>
      </div>
    </div>
  );
}
