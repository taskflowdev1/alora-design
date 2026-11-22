import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

type Phase = "burning" | "shipped" | "late";

const FUSE_H = 56;
const WAVE = 7;
const KEY_STEP = 60;
const MAX_SPARKS = 140;

/* The spark's colours are fire, not UI (hence grey-ok). */
const SPARK = ["oklch(0.97 0.06 95)", "oklch(0.86 0.16 80)", "oklch(0.72 0.2 50)"]; // grey-ok: fire
const EMBER = "oklch(0.72 0.19 52)"; // grey-ok: the glowing tip of the cord

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

/** The cord's gentle wave across the box. */
const fusePath = (w: number) => {
  const y = FUSE_H / 2;
  const x0 = 8;
  const x1 = Math.max(x0 + 1, w - 8);
  const span = x1 - x0;
  const waves = Math.max(2, Math.round(span / 120));
  const step = span / (waves * 2);
  let d = `M${x0} ${y}`;
  for (let i = 0; i < waves * 2; i++) {
    const a = x0 + step * i;
    const dir = i % 2 ? 1 : -1;
    d += `C${(a + step * 0.4).toFixed(1)} ${y + dir * WAVE} ${(a + step * 0.6).toFixed(1)} ${y + dir * WAVE} ${(a + step).toFixed(1)} ${y}`;
  }
  return d;
};

const formatLeft = (s: number) => {
  const n = Math.max(0, Math.ceil(s));
  if (n >= 3600) return `${Math.floor(n / 3600)} h ${Math.floor((n % 3600) / 60)} min`;
  if (n >= 60) return `${Math.ceil(n / 60)} min`;
  return `${n} s`;
};

export interface SlaFuseProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  order?: string;
  item?: string;
  /** The whole window, in seconds: a full fuse. */
  total?: number;
  /** Seconds left when it starts. */
  remaining?: number;
  /** How many seconds of the deadline pass per real second; 1 is real time. */
  speed?: number;
  /** Hold the clock from outside; the spark keeps burning in place. */
  paused?: boolean;
  actionLabel?: string;
  shippedLabel?: string;
  /** The button after shipping: lights the fuse again where it stopped. */
  reopenLabel?: string;
  lateLabel?: string;
  onShip?: () => void;
  onReopen?: () => void;
  onLate?: () => void;
}

/**
 * An order's deadline as a burning fuse. The cord shortens toward the end and the spark at its tip grows brighter as time
 * runs out. Drag the fuse or use the arrow keys to scrub it; shipping puts the spark out where it stands.
 */
export function SlaFuse({
  order = "INV-20841",
  item = "Gelas kopi tanah liat × 2",
  total = 2700,
  remaining = 2340,
  speed = 1,
  paused = false,
  actionLabel = "Ship order",
  shippedLabel = "Shipped",
  reopenLabel = "Reopen",
  lateLabel = "Late",
  onShip,
  onReopen,
  onLate,
  className,
  ...props
}: SlaFuseProps) {
  const [phase, setPhase] = React.useState<Phase>(remaining > 0 ? "burning" : "late");
  const [text, setText] = React.useState(() => formatLeft(remaining));
  const [width, setWidth] = React.useState(0);
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const cordRef = React.useRef<SVGPathElement>(null);
  const liveRef = React.useRef<SVGPathElement>(null);
  const cb = React.useRef({ onLate });
  React.useEffect(() => {
    cb.current = { onLate };
  });
  const sim = React.useRef({
    left: remaining,
    phase: (remaining > 0 ? "burning" : "late") as Phase,
    dragging: false,
    paused,
    onScreen: true,
    raf: 0,
    last: 0,
    carry: 0,
    puff: 0,
    sparks: [] as { x: number; y: number; vx: number; vy: number; life: number; max: number; c: number; r: number }[],
    kick: () => {},
  });

  React.useEffect(() => {
    sim.current.paused = paused;
  }, [paused]);

  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const set = () => setWidth(Math.round(el.clientWidth));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    const m = sim.current;
    const canvas = canvasRef.current;
    const cord = cordRef.current;
    const live = liveRef.current;
    const box = boxRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !cord || !live || !box || !ctx || !width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const PADY = 44;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round((FUSE_H + PADY * 2) * dpr);
    const length = cord.getTotalLength();

    const draw = (dt: number) => {
      const frac = Math.max(0, Math.min(1, m.left / total));
      const burned = (1 - frac) * length;
      live.style.strokeDasharray = `${Math.max(0, length - burned).toFixed(2)} ${(length + 1).toFixed(2)}`;
      live.style.strokeDashoffset = (-burned).toFixed(2);
      const tip = cord.getPointAtLength(burned);
      const urgency = 1 - frac;
      const heat = 0.3 + urgency * urgency * 0.7;

      ctx.setTransform(dpr, 0, 0, dpr, 0, PADY * dpr);
      ctx.clearRect(0, -PADY, width, FUSE_H + PADY * 2);

      if (m.phase === "burning") {
        // The last few px of cord glow where the fire is eating it.
        const back = cord.getPointAtLength(Math.max(0, burned - 12));
        ctx.strokeStyle = EMBER;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(back.x, back.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (!reduced && dt > 0) {
          m.carry += dt * (26 + heat * 130);
          while (m.carry >= 1 && m.sparks.length < MAX_SPARKS) {
            m.carry -= 1;
            const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.5;
            const v = (34 + Math.random() * 74) * (0.7 + heat * 0.9);
            const max = 0.22 + Math.random() * (0.26 + heat * 0.34);
            m.sparks.push({ x: tip.x, y: tip.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max, c: Math.floor(Math.random() * 3), r: 0.6 + Math.random() * (0.6 + heat * 0.7) });
          }
          m.carry = Math.min(m.carry, 1);
        }
      }

      for (let i = m.sparks.length - 1; i >= 0; i--) {
        const p = m.sparks[i];
        p.life -= dt;
        if (p.life <= 0) {
          m.sparks.splice(i, 1);
          continue;
        }
        p.vy += 150 * dt;
        p.vx *= Math.exp(-1.6 * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = p.life / p.max;
        ctx.globalAlpha = Math.min(1, k * 1.5);
        ctx.strokeStyle = SPARK[p.c];
        ctx.lineWidth = p.r * (0.5 + k * 0.7);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.024, p.y - p.vy * 0.024);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (m.phase === "burning") {
        const flicker = reduced ? 1 : 0.9 + Math.random() * 0.18;
        const glow = (10 + heat * 24) * flicker;
        const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, glow);
        g.addColorStop(0, "oklch(0.88 0.16 82 / 0.95)"); // grey-ok: the spark's light
        g.addColorStop(0.28, `oklch(0.76 0.19 58 / ${(0.28 + heat * 0.42).toFixed(2)})`); // grey-ok: the spark's light
        g.addColorStop(1, "oklch(0.7 0.2 45 / 0)"); // grey-ok: the spark's light
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, glow, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = SPARK[0];
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, (1.7 + heat * 1.5) * flicker, 0, Math.PI * 2);
        ctx.fill();
      } else if (m.puff > 0) {
        m.puff = Math.max(0, m.puff - dt / 0.26);
        const r = 5 + (1 - m.puff) * 15;
        const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, r);
        g.addColorStop(0, `oklch(0.84 0.14 80 / ${(m.puff * 0.75).toFixed(2)})`); // grey-ok: the spark's last light
        g.addColorStop(1, "oklch(0.7 0.2 45 / 0)"); // grey-ok: the spark's last light
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (t: number) => {
      m.raf = 0;
      const dt = Math.min(Math.max(t - m.last, 1) / 1000, 1 / 20);
      m.last = t;
      if (m.phase === "burning" && !m.dragging && !m.paused) {
        m.left -= dt * speed;
        if (m.left <= 0) {
          m.left = 0;
          m.phase = "late";
          m.puff = 1;
          setPhase("late");
          cb.current.onLate?.();
        }
      }
      setText(formatLeft(m.left));
      box.setAttribute("aria-valuenow", String(Math.round(total - m.left)));
      box.setAttribute("aria-valuetext", `${formatLeft(m.left)} left`);
      draw(dt);
      if ((m.phase === "burning" || m.sparks.length > 0 || m.puff > 0) && m.onScreen) m.raf = requestAnimationFrame(frame);
    };
    m.kick = () => {
      if (m.raf || !m.onScreen) return;
      m.last = performance.now();
      m.raf = requestAnimationFrame(frame);
    };
    draw(0);
    m.kick();

    const io = new IntersectionObserver(([entry]) => {
      m.onScreen = entry.isIntersecting;
      if (m.onScreen) m.kick();
      else {
        cancelAnimationFrame(m.raf);
        m.raf = 0;
      }
    });
    io.observe(box);
    return () => {
      io.disconnect();
      cancelAnimationFrame(m.raf);
      m.raf = 0;
    };
  }, [width, total, speed, reduced]);

  const seek = (clientX: number) => {
    const m = sim.current;
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - r.left - 8) / Math.max(1, r.width - 16)));
    setLeft((1 - f) * total);
    m.kick();
  };
  const setLeft = (value: number) => {
    const m = sim.current;
    m.left = Math.max(0, Math.min(total, value));
    if (m.phase === "shipped") return;
    const next: Phase = m.left <= 0 ? "late" : "burning";
    if (next !== m.phase) {
      if (next === "late") {
        m.puff = 1;
        cb.current.onLate?.();
      }
      m.phase = next;
      setPhase(next);
    }
    setText(formatLeft(m.left));
    m.kick();
  };

  const ship = () => {
    const m = sim.current;
    if (m.phase === "shipped") return;
    m.phase = "shipped";
    m.puff = 1;
    setPhase("shipped");
    onShip?.();
    m.kick();
  };

  const reopen = () => {
    const m = sim.current;
    const next: Phase = m.left > 0 ? "burning" : "late";
    m.phase = next;
    m.puff = 0;
    setPhase(next);
    onReopen?.();
    m.kick();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (phase === "shipped") return;
    const m = sim.current;
    const next = { ArrowLeft: m.left + KEY_STEP, ArrowDown: m.left + KEY_STEP, ArrowRight: m.left - KEY_STEP, ArrowUp: m.left - KEY_STEP, Home: total, End: 0 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setLeft(next);
  };

  const d = width ? fusePath(width) : "";
  const urgent = phase === "burning" && sim.current.left / total < 0.2;

  return (
    <div className={cn("grid w-full max-w-[520px] gap-3 rounded-card bg-surface p-pad shadow-card", className)} {...props}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="truncate text-title font-semibold text-ink">{order}</span>
        <span className={cn("shrink-0 text-heading font-semibold tabular-nums", phase === "late" || urgent ? "text-danger" : "text-ink")}>
          {phase === "shipped" ? (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden data-shape="round" className="size-2 rounded-full bg-success" />
              {shippedLabel}
            </span>
          ) : phase === "late" ? (
            lateLabel
          ) : (
            text
          )}
        </span>
      </div>
      <div
        ref={boxRef}
        role="slider"
        tabIndex={phase === "shipped" ? -1 : 0}
        aria-label={`Time left on ${order}`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.round(total - remaining)}
        aria-valuetext={`${text} left`}
        aria-disabled={phase === "shipped" || undefined}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          if (phase === "shipped") return;
          e.currentTarget.setPointerCapture(e.pointerId);
          sim.current.dragging = true;
          seek(e.clientX);
        }}
        onPointerMove={(e) => sim.current.dragging && seek(e.clientX)}
        onPointerUp={() => {
          sim.current.dragging = false;
          sim.current.kick();
        }}
        onPointerCancel={() => {
          sim.current.dragging = false;
        }}
        className={cn("relative touch-pan-y select-none rounded-control focus-visible:bg-fill", phase === "shipped" ? "cursor-default" : "cursor-ew-resize")}
        style={{ height: FUSE_H }}
      >
        <svg aria-hidden className="absolute inset-0 size-full overflow-visible" fill="none">
          <path ref={cordRef} d={d} stroke="var(--ad-fill)" strokeWidth="3" strokeLinecap="round" />
          <path ref={liveRef} d={d} stroke="var(--ad-ink-muted)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-[-44px]" style={{ width: "100%", height: FUSE_H + 88 }} />
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="min-w-0 truncate text-body text-ink-muted">{item}</span>
        <Button variant={phase === "shipped" ? "secondary" : "primary"} onClick={phase === "shipped" ? reopen : ship}>
          {/* Both labels hold the width, so the button doesn't change size between them. */}
          <span className="grid justify-items-center">
            <span className={cn("col-start-1 row-start-1", phase === "shipped" && "invisible")}>{actionLabel}</span>
            <span className={cn("col-start-1 row-start-1", phase !== "shipped" && "invisible")}>{reopenLabel}</span>
          </span>
        </Button>
      </div>
    </div>
  );
}
