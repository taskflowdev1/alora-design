import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

const TAU = Math.PI * 2;
/** Friction: a constant drag plus one that grows with speed, so a hard flick sheds speed fast and the end is slow. */
const DRAG = 1.4;
const VISCOUS = 0.42;
const MAX_SPIN = 26;
/** Below this (rad/s) a release is a nudge: the wheel coasts but it doesn't count as a spin. */
const MIN_FLICK = 5;
/** Half the angle over which a peg pushes the pointer aside. */
const PEG_REACH = 0.1;
const FLAP_MAX = 19;
const FLAP_K = 1700;
const FLAP_C = 34;

const SIZE = 400;
const C = SIZE / 2;
const RIM = 192;
const FACE = 178;

const CSS = `
.ad-wheel { touch-action: pan-y; }
.ad-wheel-disc { will-change: transform; cursor: grab; }
.ad-wheel[data-dragging="true"] .ad-wheel-disc { cursor: grabbing; }
.ad-wheel-wedge { fill: var(--wedge); transition: fill 240ms var(--ad-ease); }
.ad-wheel-label { fill: var(--ad-ink); transition: fill 240ms var(--ad-ease); }
.ad-wheel-slice[data-win="true"] .ad-wheel-wedge { fill: var(--ad-brand); }
.ad-wheel-slice[data-win="true"] .ad-wheel-label { fill: var(--ad-brand-ink); }
.ad-wheel-hub { transition: scale 150ms var(--ad-ease), background-color 200ms var(--ad-ease), color 200ms var(--ad-ease); }
.ad-wheel-hub:active { scale: 0.96; }
.ad-wheel-hub-text { grid-area: 1 / 1; transition: opacity 180ms var(--ad-ease); }
`;

export interface WheelPrize {
  id: string;
  label: string;
}

const DEFAULT_PRIZES: WheelPrize[] = [
  { id: "d10", label: "Diskon 10%" },
  { id: "ship", label: "Gratis ongkir" },
  { id: "again-1", label: "Coba lagi" },
  { id: "rp50", label: "Rp 50.000" },
  { id: "d25", label: "Diskon 25%" },
  { id: "cup", label: "Gelas kopi" },
  { id: "again-2", label: "Coba lagi" },
  { id: "rp100", label: "Rp 100.000" },
];

const polar = (r: number, a: number) => [C + r * Math.sin(a), C - r * Math.cos(a)] as const;

function wedgePath(a0: number, a1: number) {
  const [x0, y0] = polar(FACE, a0);
  const [x1, y1] = polar(FACE, a1);
  return `M${C} ${C}L${x0.toFixed(2)} ${y0.toFixed(2)}A${FACE} ${FACE} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
}

/** How far a spin of `v` rad/s travels before it stops, for a constant drag `a`. */
const travel = (v: number, a: number) => v / VISCOUS - (a / (VISCOUS * VISCOUS)) * Math.log(1 + (VISCOUS * v) / a);

/** The constant drag that makes a spin of `v` stop after exactly `dist` radians. */
function dragFor(v: number, dist: number) {
  let lo = 0.05, hi = 60;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (travel(v, mid) > dist) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

interface Spin {
  from: number;
  dir: number;
  v: number;
  a: number;
  T: number;
  at: number;
  /** The prize index it lands on, or -1 for a nudge that doesn't count. */
  prize: number;
}

/**
 * The wheel's motion. A spin is a closed-form curve (the drag is solved at release so it stops exactly inside the
 * chosen wedge), so it is frame-rate independent and can't drift. The pointer is its own stiff spring, pushed aside by
 * each peg as it passes.
 */
function attachWheel(root: HTMLElement, disc: HTMLElement, flap: SVGElement, count: number, pick: () => number, onGrab: () => void, onSpin: () => void, onLand: (i: number) => void) {
  const step = TAU / count;
  let angle = 0, spin: Spin | null = null;
  let flapAt = 0, flapV = 0;
  let raf = 0, last = 0, onScreen = true;
  let drag: { id: number; prev: number; px: number; py: number; touch: boolean; samples: { t: number; a: number }[] } | null = null;
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => root.addEventListener(type, fn, { signal: ac.signal });

  const paint = () => {
    disc.style.transform = `rotate(${angle.toFixed(4)}rad)`;
    flap.style.transform = `rotate(${flapAt.toFixed(2)}deg)`;
  };

  /** The signed angle from the pointer to the nearest peg. */
  const pegOffset = () => {
    const m = ((angle % step) + step) % step;
    return m > step / 2 ? m - step : m;
  };

  const land = (i: number) => {
    spin = null;
    if (i >= 0) onLand(i);
  };

  const frame = (t: number) => {
    raf = 0;
    const dt = Math.min(Math.max(t - last, 1) / 1000, 1 / 30);
    last = t;
    let dir = 0;
    if (spin) {
      const s = spin;
      const e = Math.max(0, Math.min((t - s.at) / 1000, s.T));
      const A = s.a / VISCOUS;
      angle = s.from + s.dir * (((s.v + A) * (1 - Math.exp(-VISCOUS * e))) / VISCOUS - A * e);
      dir = s.dir;
      if (e >= s.T) land(s.prize);
    } else if (drag && drag.samples.length > 1) {
      const a = drag.samples[drag.samples.length - 1].a - drag.samples[drag.samples.length - 2].a;
      dir = Math.sign(a);
    }
    const off = pegOffset();
    const ride = Math.abs(off) < PEG_REACH && dir ? ((off * dir + PEG_REACH) / (2 * PEG_REACH)) * FLAP_MAX * -dir : 0;
    const sub = dt / 4;
    for (let i = 0; i < 4; i++) {
      flapV += (FLAP_K * (ride - flapAt) - FLAP_C * flapV) * sub;
      flapAt += flapV * sub;
    }
    const quiet = !spin && !drag && Math.abs(flapAt) < 0.05 && Math.abs(flapV) < 0.5;
    if (quiet) flapAt = flapV = 0;
    paint();
    if (!quiet) raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (raf || !onScreen) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  /** The wheel's rotation that puts a point inside wedge `i` under the pointer, nearest to `near`. */
  const restFor = (i: number, near: number) => {
    const jitter = (Math.random() - 0.5) * step * 0.5;
    const base = -((i + 0.5) * step + jitter);
    return base + Math.round((near - base) / TAU) * TAU;
  };

  const start = (signed: number, counts: boolean, forced?: number) => {
    const dir = Math.sign(signed) || 1;
    const v = Math.min(Math.abs(signed), MAX_SPIN);
    if (!counts) {
      if (prefersReducedMotion() || v < 0.05) return;
      spin = { from: angle, dir, v, a: DRAG, T: Math.log(1 + (VISCOUS * v) / DRAG) / VISCOUS, at: performance.now(), prize: -1 };
      kick();
      return;
    }
    onSpin();
    const natural = angle + dir * travel(v, DRAG);
    const naturalIndex = ((Math.floor(((-natural % TAU) + TAU) / step) % count) + count) % count;
    const picked = forced ?? pick();
    const i = picked < 0 ? naturalIndex : picked;
    let stop = restFor(i, natural);
    if ((stop - angle) * dir < 1.2) stop += dir * TAU;
    if (prefersReducedMotion() || !onScreen) {
      angle = stop;
      paint();
      land(i);
      return;
    }
    const dist = Math.abs(stop - angle);
    const a = dragFor(v, dist);
    spin = { from: angle, dir, v, a, T: Math.log(1 + (VISCOUS * v) / a) / VISCOUS, at: performance.now(), prize: i };
    kick();
  };

  const pointAngle = (e: PointerEvent) => {
    const r = disc.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };

  disc.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      disc.setPointerCapture(e.pointerId);
      // A hand on the wheel stops it, and whatever it had landed on no longer stands.
      spin = null;
      onGrab();
      drag = { id: e.pointerId, prev: pointAngle(e), px: e.clientX, py: e.clientY, touch: e.pointerType === "touch", samples: [{ t: e.timeStamp, a: angle }] };
      root.dataset.dragging = "true";
      kick();
    },
    { signal: ac.signal },
  );
  disc.addEventListener(
    "pointermove",
    (e) => {
      if (drag?.id !== e.pointerId) return;
      let delta: number;
      if (drag.touch) {
        // The page keeps vertical swipes, so on touch a sideways drag turns the wheel: right above the middle, left below it.
        const r = disc.getBoundingClientRect();
        const above = e.clientY < r.top + r.height / 2 ? 1 : -1;
        delta = ((e.clientX - drag.px) / (r.width / 2)) * above;
      } else {
        const a = pointAngle(e);
        delta = a - drag.prev;
        if (delta > Math.PI) delta -= TAU;
        else if (delta < -Math.PI) delta += TAU;
        drag.prev = a;
      }
      drag.px = e.clientX;
      drag.py = e.clientY;
      angle += delta;
      drag.samples.push({ t: e.timeStamp, a: angle });
      if (drag.samples.length > 8) drag.samples.shift();
      kick();
    },
    { signal: ac.signal },
  );
  const release = (e: PointerEvent) => {
    if (drag?.id !== e.pointerId) return;
    const { samples } = drag;
    drag = null;
    delete root.dataset.dragging;
    const lastSample = samples[samples.length - 1];
    const first = samples.find((s) => e.timeStamp - s.t < 120) ?? lastSample;
    const span = (lastSample.t - first.t) / 1000;
    // A pointer that stopped before letting go has no speed left.
    const stale = e.timeStamp - lastSample.t > 90;
    const v = span > 0.008 && !stale ? (lastSample.a - first.a) / span : 0;
    if (e.type === "pointerup" && Math.abs(v) >= MIN_FLICK) start(v, true);
    else start(v, false);
    kick();
  };
  disc.addEventListener("pointerup", release, { signal: ac.signal });
  disc.addEventListener("pointercancel", release, { signal: ac.signal });

  on("dragstart", (e) => e.preventDefault());

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen || !spin) return;
    // Off screen a spin finishes at once, so the result is never left hanging.
    cancelAnimationFrame(raf);
    raf = 0;
    const s = spin;
    const A = s.a / VISCOUS;
    angle = s.from + s.dir * (((s.v + A) * (1 - Math.exp(-VISCOUS * s.T))) / VISCOUS - A * s.T);
    flapAt = flapV = 0;
    paint();
    land(s.prize);
  });
  io.observe(root);
  paint();

  return {
    spin: (forced?: number) => start(15 + Math.random() * 5, true, forced),
    destroy: () => {
      ac.abort();
      io.disconnect();
      cancelAnimationFrame(raf);
    },
  };
}

export interface SpinWheelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  prizes?: WheelPrize[];
  /** A prize id decided elsewhere (say, on the server). Left out, the wheel lands wherever the flick takes it. */
  winner?: string;
  spinLabel?: string;
  onResult?: (prize: WheelPrize) => void;
}

/**
 * A prize wheel with real weight. Flick it (or press the hub): its speed comes from your hand, the pointer chatters
 * over the pegs and it slows to a stop inside a wedge, which takes the accent. A slow push just turns it.
 */
export function SpinWheel({ prizes = DEFAULT_PRIZES, winner, spinLabel = "Spin", onResult, className, ...props }: SpinWheelProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const discRef = React.useRef<HTMLDivElement>(null);
  const flapRef = React.useRef<SVGGElement>(null);
  const engine = React.useRef<ReturnType<typeof attachWheel> | null>(null);
  const latest = React.useRef({ prizes, winner, onResult });
  const [won, setWon] = React.useState<number | null>(null);
  const [spinning, setSpinning] = React.useState(false);
  React.useEffect(() => {
    latest.current = { prizes, winner, onResult };
  });
  const ids = prizes.map((p) => p.id).join("|");

  React.useEffect(() => {
    if (!rootRef.current || !discRef.current || !flapRef.current) return;
    const count = ids.split("|").length;
    const e = attachWheel(
      rootRef.current,
      discRef.current,
      flapRef.current,
      count,
      () => (latest.current.winner ? latest.current.prizes.findIndex((p) => p.id === latest.current.winner) : -1),
      () => {
        setWon(null);
        setSpinning(false);
      },
      () => {
        setWon(null);
        setSpinning(true);
      },
      (i) => {
        setWon(i);
        setSpinning(false);
        latest.current.onResult?.(latest.current.prizes[i]);
      },
    );
    engine.current = e;
    return () => {
      e.destroy();
      engine.current = null;
    };
  }, [ids]);

  const step = TAU / prizes.length;
  const prize = won === null ? null : prizes[won];

  return (
    <div ref={rootRef} className={cn("ad-wheel relative aspect-square w-full select-none", className)} {...props}>
      <style href="ad-spin-wheel" precedence="default">
        {CSS}
      </style>
      <div className="absolute inset-[2%] rounded-full shadow-raised" />
      <div ref={discRef} aria-hidden className="ad-wheel-disc absolute inset-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block size-full">
          <circle cx={C} cy={C} r={RIM} fill="var(--ad-surface)" />
          {prizes.map((p, i) => {
            const a0 = i * step;
            const mid = a0 + step / 2;
            return (
              <g key={p.id} className="ad-wheel-slice" data-win={won === i}>
                <path d={wedgePath(a0, a0 + step)} className="ad-wheel-wedge" style={{ "--wedge": i % 2 ? "var(--ad-fill-strong)" : "var(--ad-fill)" } as React.CSSProperties} />
                <text
                  transform={`rotate(${(mid * 180) / Math.PI - 90} ${C} ${C})`}
                  x={C + FACE - 14}
                  y={C}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize="15"
                  fontWeight="500"
                  className="ad-wheel-label tabular-nums"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
          {prizes.map((p, i) => {
            const [x, y] = polar(RIM - 7, i * step);
            return <circle key={p.id} cx={x} cy={y} r="4" fill="var(--ad-ink-muted)" />;
          })}
        </svg>
      </div>
      {/* The pointer: pivots near its top, its tip rides over the pegs. */}
      <svg viewBox="0 0 40 56" aria-hidden className="pointer-events-none absolute left-1/2 top-[-1.5%] z-10 w-[9%] -translate-x-1/2 overflow-visible">
        <g ref={flapRef} style={{ transformOrigin: "20px 8px" }}>
          <path d="M13 2h14a5 5 0 0 1 4.9 6L22.6 50.5a2.7 2.7 0 0 1-5.2 0L8.1 8A5 5 0 0 1 13 2Z" fill="var(--ad-on)" />
        </g>
      </svg>
      <button
        type="button"
        aria-label={prize ? `Won ${prize.label}. Spin again` : spinLabel}
        disabled={spinning}
        onClick={() => {
          const forced = winner ? prizes.findIndex((p) => p.id === winner) : -1;
          engine.current?.spin(forced >= 0 ? forced : undefined);
        }}
        className={cn(
          "ad-wheel-hub absolute left-1/2 top-1/2 z-10 grid aspect-square w-[27%] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full px-2 text-center font-semibold leading-tight shadow-raised disabled:cursor-default",
          prize ? "bg-surface text-ink hover:bg-fill focus-visible:bg-fill" : "bg-brand text-brand-ink hover:bg-brand-hover focus-visible:bg-brand-hover",
        )}
      >
        <span className={cn("ad-wheel-hub-text text-title", prize && "opacity-0")}>{spinLabel}</span>
        <span className={cn("ad-wheel-hub-text text-body", !prize && "opacity-0")}>{prize?.label}</span>
      </button>
      <span aria-live="polite" className="sr-only">
        {prize ? `Landed on ${prize.label}` : ""}
      </span>
    </div>
  );
}
