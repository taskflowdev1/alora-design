import * as React from "react";
import { Award, Lock, RotateCcw } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

const STIFFNESS = 190;
const DAMPING = 27.6;
const KEY_STEP = 0.25;
const REST_X = -0.45;
const REST_Y = -0.6;
/** The stamp: up a touch, down hard, then settling. The look changes at the moment of impact. */
const STAMP_MS = 470;
const IMPACT = 0.54;

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/** A continuous-corner square in the 0…1 box, for a clip-path. The rim and the face use the same curve. */
const SHAPE = (() => {
  const N = 120, P = 2 / 5;
  const axis = (v: number) => (0.5 + 0.5 * Math.sign(v) * Math.abs(v) ** P).toFixed(4);
  let d = "";
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    d += `${i ? "L" : "M"}${axis(Math.cos(a))} ${axis(Math.sin(a))}`;
  }
  return `${d}Z`;
})();

const CSS = `
.ad-fbadge { --fx: 0; --fy: 0; --lx: ${REST_X}; --ly: ${REST_Y}; --fon: 0; --fhue: 0; container-type: inline-size; touch-action: pan-y; }
.ad-fbadge-press { perspective: 900px; }
.ad-fbadge-turn { transform: rotateX(calc(var(--fy) * -16deg)) rotateY(calc(var(--fx) * 16deg)); }
.ad-fbadge-shadow {
  transform: translate(calc(var(--fx) * -3cqw), calc(var(--fy) * -2.4cqw + 4cqw));
  /* grey-ok: a soft contact shadow on whatever the badge sits on */
  background: rgb(0 0 0 / 0.5); border-radius: 30%; filter: blur(5cqw);
}
/* grey-ok: the struck metal, a deep violet to teal under the foil */
.ad-fbadge-metal { background: linear-gradient(135deg in oklab, oklch(0.36 0.07 292), oklch(0.26 0.05 250) 52%, oklch(0.33 0.06 195)); }
.ad-fbadge-light {
  left: -60%; top: -60%; width: 220%; height: 220%; pointer-events: none; mix-blend-mode: screen;
  opacity: calc(0.66 + var(--fon) * 0.32);
  transform: translate(calc(var(--lx) * 22.7%), calc(var(--ly) * 22.7%));
  mask-image: radial-gradient(closest-side, #000 16%, rgb(0 0 0 / 0.6) 48%, transparent 84%);
}
.ad-fbadge-foil {
  inset: 0;
  transform: translate(calc(var(--lx) * -22.7% + var(--fx) * -7%), calc(var(--ly) * -22.7% + var(--fy) * -7%));
  filter: hue-rotate(calc(var(--fhue) * 1deg));
  /* grey-ok: iridescent foil, kept inside sRGB so no stop clips into a hard streak */
  background:
    conic-gradient(from 40deg at 50% 50% in oklch, oklch(0.62 0.11 340), oklch(0.66 0.1 80), oklch(0.66 0.09 165), oklch(0.6 0.1 255), oklch(0.62 0.11 340)),
    repeating-linear-gradient(118deg in oklab, oklch(0.6 0.1 350) 0%, oklch(0.65 0.09 70) 6%, oklch(0.66 0.085 140) 12%, oklch(0.64 0.07 215) 18%, oklch(0.58 0.1 285) 24%, oklch(0.6 0.1 350) 30%);
  background-blend-mode: soft-light;
}
.ad-fbadge-foil::after {
  content: ""; position: absolute; inset: 0; mix-blend-mode: color-dodge; opacity: 0.5;
  /* grey-ok: the fine grating pressed into the foil */
  background: repeating-conic-gradient(from 0deg at 50% 50%, rgb(255 255 255 / 0.2) 0deg 0.7deg, transparent 0.7deg 3deg);
}
.ad-fbadge-glare {
  left: -50%; top: -50%; width: 200%; height: 200%; pointer-events: none; mix-blend-mode: soft-light;
  opacity: calc(0.36 + var(--fon) * 0.4);
  transform: translate(calc(var(--lx) * 25%), calc(var(--ly) * 25%));
  /* grey-ok: a white specular highlight, light rather than a UI grey */
  background: radial-gradient(closest-side, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0.3) 36%, transparent 70%);
}
/* grey-ok: the recessed face inside the foil rim, so the value stays readable with the light on it */
.ad-fbadge-well { background: linear-gradient(150deg, oklch(0.27 0.045 268 / 0.76), oklch(0.17 0.03 256 / 0.9)); box-shadow: inset 0 1.2cqw 3cqw rgb(0 0 0 / 0.5); }
.ad-fbadge-matte { background: var(--ad-fill-strong); transition: opacity 180ms var(--ad-ease); }
.ad-fbadge-matte-well { background: var(--ad-fill); }
.ad-fbadge[data-on="true"] .ad-fbadge-matte { opacity: 0; }
.ad-fbadge-ink { color: var(--ad-ink-muted); transition: color 180ms var(--ad-ease); }
.ad-fbadge[data-on="true"] .ad-fbadge-ink { color: var(--ad-side-ink); }
.ad-fbadge-swap { transition: opacity 180ms var(--ad-ease); }
.ad-fbadge-sweep {
  inset: -10% -60%; pointer-events: none; opacity: 0; mix-blend-mode: screen;
  /* grey-ok: one band of light across the foil when it is struck */
  background: linear-gradient(105deg, transparent 38%, rgb(255 255 255 / 0.62) 50%, transparent 62%);
}
.ad-fbadge[data-struck="true"] .ad-fbadge-sweep { animation: ad-fbadge-sweep 620ms cubic-bezier(0.2, 0.7, 0.3, 1) both; }
@keyframes ad-fbadge-sweep {
  0% { transform: translateX(-34%); opacity: 1; }
  80% { opacity: 0.9; }
  100% { transform: translateX(34%); opacity: 0; }
}
`;

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

/** The tilt: a spring in rAF, running only while something moves and the badge is on screen. */
function attachTilt(el: HTMLElement) {
  let x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0, glow = 0, targetGlow = 0;
  let raf = 0, last = 0, onScreen = true, hovering = false, keyFocus = false;
  let drag: { id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null = null;
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => el.addEventListener(type, fn, { signal: ac.signal });

  const paint = () => {
    const s = el.style;
    s.setProperty("--fx", x.toFixed(4));
    s.setProperty("--fy", y.toFixed(4));
    s.setProperty("--lx", (REST_X + (x - REST_X) * glow).toFixed(4));
    s.setProperty("--ly", (REST_Y + (y - REST_Y) * glow).toFixed(4));
    s.setProperty("--fon", glow.toFixed(4));
    s.setProperty("--fhue", (38 * x - 26 * y).toFixed(2));
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
    if (!step) return;
    e.preventDefault();
    keyFocus = true;
    x = tx = clamp(tx + step[0] * KEY_STEP);
    y = ty = clamp(ty + step[1] * KEY_STEP);
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
    for (const k of ["--fx", "--fy", "--lx", "--ly", "--fon", "--fhue"]) el.style.removeProperty(k);
  };
}

export interface FoilBadgeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The milestone, big in the middle. */
  value?: string;
  label?: string;
  /** The action that claims it. */
  claimLabel?: string;
  defaultUnlocked?: boolean;
  /** Fires when the badge is stamped in, and with false when it's reset. */
  onUnlockedChange?: (unlocked: boolean) => void;
}

/**
 * A sales milestone struck as a foil plaque with a crisp rim. Locked it is matte; claimed, it lifts, comes down hard and the foil appears
 * at the moment of impact, with one band of light across it. It then turns in 3D toward the pointer, a finger or the
 * arrow keys.
 */
export function FoilBadge({ value = "Rp 100 jt", label = "Sales in November", claimLabel = "Claim badge", defaultUnlocked = false, onUnlockedChange, className, ...props }: FoilBadgeProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const pressRef = React.useRef<HTMLDivElement>(null);
  const shadowRef = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef(0);
  const [on, setOn] = React.useState(defaultUnlocked);
  const [struck, setStruck] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const clipId = `ad-fbadge-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  React.useEffect(() => (!reduced && rootRef.current ? attachTilt(rootRef.current) : undefined), [reduced]);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const claim = () => {
    if (on || busy) return;
    if (prefersReducedMotion()) {
      setOn(true);
      onUnlockedChange?.(true);
      return;
    }
    setBusy(true);
    pressRef.current?.animate(
      [
        { transform: "translateY(0) scale(1) rotate(0deg)", easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
        { transform: "translateY(-3px) scale(1.07) rotate(-4deg)", offset: 0.3, easing: "cubic-bezier(0.6, 0, 0.9, 0.4)" },
        { transform: "translateY(0) scale(0.965) rotate(0deg)", offset: IMPACT, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
        { transform: "translateY(0) scale(1) rotate(0deg)" },
      ],
      { duration: STAMP_MS },
    );
    shadowRef.current?.animate(
      [
        { opacity: 1, scale: 1 },
        { opacity: 0.45, scale: 1.1, offset: 0.3 },
        { opacity: 1, scale: 0.94, offset: IMPACT },
        { opacity: 1, scale: 1 },
      ],
      { duration: STAMP_MS },
    );
    timer.current = window.setTimeout(() => {
      setOn(true);
      setStruck(true);
      setBusy(false);
      onUnlockedChange?.(true);
    }, STAMP_MS * IMPACT);
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setBusy(false);
    setStruck(false);
    setOn(false);
    onUnlockedChange?.(false);
  };

  return (
    <div className={cn("grid w-full justify-items-center gap-6", className)} {...props}>
      <style href="ad-foil-badge" precedence="default">
        {CSS}
      </style>
      <svg aria-hidden width="0" height="0" className="absolute">
        <clipPath id={clipId} clipPathUnits="objectBoundingBox">
          <path d={SHAPE} />
        </clipPath>
      </svg>
      <div
        ref={rootRef}
        role="img"
        aria-label={`${value}, ${label}, ${on ? "unlocked" : "locked"}`}
        translate="no"
        tabIndex={reduced ? undefined : 0}
        data-on={on}
        data-struck={struck}
        onClick={claim}
        className={cn("ad-fbadge relative aspect-square w-full max-w-[260px] select-none", !on && "cursor-pointer")}
      >
        <div ref={shadowRef} aria-hidden className="ad-fbadge-shadow absolute inset-[8%]" />
        <div ref={pressRef} className="ad-fbadge-press absolute inset-0">
          <div aria-hidden className="ad-fbadge-turn absolute inset-0" style={{ clipPath: `url(#${clipId})` }}>
            <div className="ad-fbadge-metal absolute inset-0 overflow-hidden">
              <div className="ad-fbadge-light absolute">
                <div className="ad-fbadge-foil absolute" />
              </div>
              <div className="ad-fbadge-glare absolute" />
              <div className="ad-fbadge-sweep absolute" />
            </div>
            <div className="ad-fbadge-well absolute inset-[5.5%]" style={{ clipPath: `url(#${clipId})` }} />
            <div className="ad-fbadge-matte absolute inset-0">
              <div className="ad-fbadge-matte-well absolute inset-[5.5%]" style={{ clipPath: `url(#${clipId})` }} />
            </div>
            <div className="ad-fbadge-ink absolute inset-[5.5%] grid content-center justify-items-center gap-[3cqw] text-center">
              <span className="relative block size-[16px]">
                <Lock size={16} strokeWidth={1.75} className={cn("ad-fbadge-swap absolute inset-0", on && "opacity-0")} />
                <Award size={16} strokeWidth={1.75} className={cn("ad-fbadge-swap absolute inset-0", !on && "opacity-0")} />
              </span>
              <span className="whitespace-nowrap text-[length:clamp(26px,13cqw,36px)] font-semibold leading-none tracking-[-0.03em] tabular-nums">{value}</span>
              <span className="max-w-[80%] text-[length:clamp(13px,4.6cqw,14px)] font-medium leading-tight">{label}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid h-control place-items-center">
        {on ? (
          <Button variant="ghost" icon aria-label="Lock the badge again" onClick={reset}>
            <RotateCcw strokeWidth={1.75} />
          </Button>
        ) : (
          <Button variant="primary" onClick={claim} disabled={busy}>
            {claimLabel}
          </Button>
        )}
      </div>
      <span aria-live="polite" className="sr-only">
        {on ? `${label}: ${value}, unlocked` : ""}
      </span>
    </div>
  );
}
