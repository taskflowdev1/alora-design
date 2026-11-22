import * as React from "react";
import { Plus, RotateCcw } from "react-feather";
import { cn, formatNumber, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

const CX = 160;
const CY = 150;
const R = 132;
/** The dial runs from -SWEEP to +SWEEP degrees around straight up. */
const SWEEP = 105;
/** The target sits at this point on the dial, so a day can run past it. */
const TARGET_AT = 0.8;
const STIFFNESS = 120;
const DAMPING = 12.5; // under-damped: the needle passes its mark by a few percent and comes back
const TREMBLE_HZ = 15;
const TREMBLE_AMP = 0.0065;
const TREMBLE_DECAY = 0.42;
const KICK = 0.55;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const polar = (t: number, r: number) => {
  const a = ((-SWEEP + SWEEP * 2 * t) * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)] as const;
};
const ARC = (() => {
  const [x0, y0] = polar(0, R);
  const [x1, y1] = polar(1, R);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 1 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
})();
const TICKS = Array.from({ length: 21 }, (_, i) => {
  const [x, y] = polar(i / 20, R - 19);
  return { id: i, x, y, major: i % 5 === 0 };
});

const CSS = `
.ad-gauge-needle { filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.28)); } /* grey-ok: the needle's cast shadow */
.ad-gauge-dial { touch-action: pan-y; }`;

export interface TargetGaugeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  label?: React.ReactNode;
  /** Controlled value; leave out to let the gauge keep its own. */
  value?: number;
  defaultValue?: number;
  target?: number;
  /** The sale amounts "New sale" walks through. */
  sales?: number[];
  format?: (value: number) => string;
  onValueChange?: (value: number) => void;
}

/**
 * A needle gauge against a target. The needle sweeps to the value, passes it slightly, settles with a small tremble
 * and kicks when a sale lands. Drag it and it pulls against its spring, then swings back to the real figure.
 */
export function TargetGauge({ label = "Today’s target", value, defaultValue = 31400000, target = 48000000, sales = [1250000, 420000, 2750000, 890000, 3100000], format = formatRp, onValueChange, className, ...props }: TargetGaugeProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const shown = value ?? inner;
  const [start] = React.useState(shown);
  const saleIndex = React.useRef(0);
  const max = target / TARGET_AT;
  const reached = shown >= target;
  // The count and percent are written per frame; React renders only their first value, or a change would flash the end.
  const [firstAmount] = React.useState(() => format(shown));
  const [firstPct] = React.useState(() => `${formatNumber(Math.round((shown / target) * 100))}%`);

  const needle = React.useRef<SVGGElement>(null);
  const arc = React.useRef<SVGPathElement>(null);
  const amount = React.useRef<HTMLSpanElement>(null);
  const percent = React.useRef<HTMLSpanElement>(null);
  const dial = React.useRef<SVGSVGElement>(null);
  const live = React.useRef({ pos: 0, vel: 0, to: 0, count: shown, countTo: shown, raf: 0, last: 0, trembleAt: -1, dragging: false, onScreen: true, started: false });
  const fmt = React.useRef(format);
  fmt.current = format;
  const targetRef = React.useRef(target);
  targetRef.current = target;

  const paint = React.useCallback((t = performance.now()) => {
    const m = live.current;
    const age = m.trembleAt < 0 ? -1 : (t - m.trembleAt) / 1000;
    const tremble = age < 0 ? 0 : TREMBLE_AMP * Math.exp(-age / TREMBLE_DECAY) * Math.sin(age * TREMBLE_HZ * Math.PI * 2);
    const p = Math.max(-0.015, Math.min(1.015, m.pos + tremble));
    needle.current?.setAttribute("transform", `rotate(${(-SWEEP + SWEEP * 2 * p).toFixed(3)} ${CX} ${CY})`);
    const a = arc.current;
    if (a) {
      const f = clamp01(p);
      a.style.strokeDasharray = `${f.toFixed(4)} 1`;
      a.style.opacity = f > 0.002 ? "1" : "0";
    }
    if (amount.current) amount.current.textContent = fmt.current(Math.round(m.count));
    if (percent.current) percent.current.textContent = `${formatNumber(Math.round((m.count / targetRef.current) * 100))}%`;
  }, []);

  const run = React.useCallback(() => {
    const m = live.current;
    if (m.raf || !m.onScreen) return;
    m.last = performance.now();
    const frame = (t: number) => {
      m.raf = 0;
      const dt = Math.min(Math.max(t - m.last, 1) / 1000, 1 / 30);
      m.last = t;
      if (!m.dragging) {
        const before = m.vel;
        m.vel += (STIFFNESS * (m.to - m.pos) - DAMPING * m.vel) * dt;
        m.pos += m.vel * dt;
        // The tremble starts where the needle turns around at the top of its overshoot.
        if (m.trembleAt < 0 && before !== 0 && Math.sign(before) !== Math.sign(m.vel)) m.trembleAt = t;
      }
      m.count += (m.countTo - m.count) * (1 - Math.exp(-dt / 0.09));
      if (Math.abs(m.countTo - m.count) < 1) m.count = m.countTo;
      const trembling = m.trembleAt >= 0 && t - m.trembleAt < 1400;
      const moving = m.dragging || Math.abs(m.to - m.pos) > 0.0006 || Math.abs(m.vel) > 0.004 || m.count !== m.countTo;
      if (!moving && !trembling) {
        m.pos = m.to;
        m.vel = 0;
        m.trembleAt = -1;
        paint(t);
        return;
      }
      paint(t);
      m.raf = requestAnimationFrame(frame);
    };
    m.raf = requestAnimationFrame(frame);
  }, [paint]);

  // Every value change retargets the spring; the first one in view sweeps up from zero.
  React.useEffect(() => {
    const m = live.current;
    m.to = clamp01(shown / max);
    m.countTo = shown;
    if (prefersReducedMotion()) {
      m.pos = m.to;
      m.vel = 0;
      m.count = shown;
      m.trembleAt = -1;
      m.started = true;
      paint();
      return;
    }
    if (!m.started) {
      m.count = shown;
      paint();
      return;
    }
    if (!m.onScreen) {
      m.pos = m.to;
      m.vel = 0;
      m.count = shown;
      m.trembleAt = -1;
      paint();
      return;
    }
    m.trembleAt = -1;
    run();
  }, [shown, max, paint, run]);

  React.useEffect(() => {
    const m = live.current;
    const el = dial.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      m.onScreen = entry.isIntersecting;
      if (!m.onScreen) {
        cancelAnimationFrame(m.raf);
        m.raf = 0;
        if (m.started) {
          m.pos = m.to;
          m.vel = 0;
          m.count = m.countTo;
          m.trembleAt = -1;
          paint();
        }
        return;
      }
      if (!m.started) {
        m.started = true;
        if (!prefersReducedMotion()) run();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(m.raf);
      m.raf = 0;
    };
  }, [paint, run]);

  const set = (next: number) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const sale = () => {
    const m = live.current;
    const amt = sales[saleIndex.current % sales.length] ?? 0;
    saleIndex.current += 1;
    if (!prefersReducedMotion()) m.vel += KICK;
    set(Math.min(max, shown + amt));
  };

  const pointerT = (e: React.PointerEvent) => {
    const r = dial.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320 - CX;
    const y = ((e.clientY - r.top) / r.height) * 204 - CY;
    const deg = (Math.atan2(x, -y) * 180) / Math.PI;
    return clamp01((deg + SWEEP) / (SWEEP * 2));
  };

  const drag = {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      if (prefersReducedMotion()) return;
      const m = live.current;
      e.currentTarget.setPointerCapture(e.pointerId);
      m.dragging = true;
      m.trembleAt = -1;
      m.vel = 0;
      m.pos = pointerT(e);
      paint();
      run();
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      const m = live.current;
      if (!m.dragging) return;
      const next = pointerT(e);
      m.vel = (next - m.pos) * 40;
      m.pos = next;
    },
    onPointerUp: () => {
      const m = live.current;
      if (!m.dragging) return;
      m.dragging = false;
      run();
    },
    onPointerCancel: () => {
      const m = live.current;
      m.dragging = false;
      run();
    },
  };

  const [tx0, ty0] = polar(TARGET_AT, R - 11);
  const [tx1, ty1] = polar(TARGET_AT, R + 11);

  return (
    <Card className={cn("grid min-w-0 gap-3", className)} {...props}>
      <style href="ad-target-gauge" precedence="default">
        {CSS}
      </style>
      <div className="flex items-center justify-between gap-3 text-body">
        <span className="truncate text-ink-muted">{label}</span>
        <span ref={percent} className="font-medium tabular-nums text-ink">
          {firstPct}
        </span>
      </div>
      <svg
        ref={dial}
        viewBox="0 0 320 204"
        role="meter"
        aria-label={typeof label === "string" ? label : "Target"}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(shown, target)}
        aria-valuetext={`${format(shown)} of ${format(target)}`}
        className="ad-gauge-dial block h-auto w-full cursor-grab select-none active:cursor-grabbing"
        {...drag}
      >
        <path d={ARC} fill="none" strokeWidth={14} strokeLinecap="round" className="stroke-fill" />
        <path ref={arc} d={ARC} fill="none" pathLength={1} strokeWidth={14} strokeLinecap="round" className="stroke-chart-1" style={{ strokeDasharray: "0 1", opacity: 0 }} />
        {TICKS.map((t) => (
          <circle key={t.id} cx={t.x} cy={t.y} r={t.major ? 2.4 : 1.4} className={t.major ? "fill-ink-muted" : "fill-fill-strong"} />
        ))}
        <line x1={tx0} y1={ty0} x2={tx1} y2={ty1} strokeWidth={3} strokeLinecap="round" className={cn("transition-[stroke] duration-[220ms]", reached ? "stroke-success" : "stroke-ink")} />
        <g ref={needle} transform={`rotate(${-SWEEP} ${CX} ${CY})`} className="ad-gauge-needle">
          <path d={`M${CX - 4.5} ${CY}Q${CX - 2} ${CY - 52} ${CX - 0.9} ${CY - (R - 30)}a0.9 0.9 0 0 1 1.8 0Q${CX + 2} ${CY - 52} ${CX + 4.5} ${CY}Z`} className="fill-ink" />
          <circle cx={CX} cy={CY} r={10} className="fill-ink" />
          <circle cx={CX} cy={CY} r={3.25} className="fill-surface" />
        </g>
      </svg>
      <div className="-mt-3 flex flex-wrap items-baseline justify-center gap-x-2 tabular-nums">
        <span ref={amount} className="text-heading font-semibold text-ink">
          {firstAmount}
        </span>
        <span className="text-body text-ink-muted">of {format(target)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-gap">
        <span />
        <Button variant="primary" onClick={sale} disabled={shown >= max}>
          <Plus strokeWidth={1.75} />
          New sale
        </Button>
        <span className="flex justify-end">
          <Tooltip content="Reset">
            <Button
              size="sm"
              variant="ghost"
              icon
              aria-label="Reset"
              onClick={() => {
                saleIndex.current = 0;
                set(start);
              }}
              tabIndex={shown === start ? -1 : undefined}
              className={cn("text-ink-muted transition-[opacity,scale] duration-[160ms]", shown === start && "pointer-events-none opacity-0")}
            >
              <RotateCcw strokeWidth={1.75} />
            </Button>
          </Tooltip>
        </span>
      </div>
    </Card>
  );
}
