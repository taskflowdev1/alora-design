import * as React from "react";
import { RotateCcw } from "react-feather";
import { cn, formatCompact, formatNumber, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

const STIFFNESS = 130;
const DAMPING = 15.5;
const STROKE = 17;
const RADII = [84, 62, 40];
const SHADES = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3"];
const DOTS = ["bg-chart-1", "bg-chart-2", "bg-chart-3"];
/** Stagger of the first sweep, outer ring first. */
const SWEEP_DELAY = 70;
/** How far "Close the day" runs each ring past its goal. */
const PAST = [1.06, 1.12, 1.03];
const FILLS = ["fill-chart-1", "fill-chart-2", "fill-chart-3"];

export interface GoalRing {
  id: string;
  label: string;
  value: number;
  goal: number;
  /** What one press adds. */
  step: number;
  /** Shown beside the label. */
  format?: (value: number) => string;
}

const DEFAULT_RINGS: GoalRing[] = [
  { id: "sales", label: "Sales", value: 31400000, goal: 48000000, step: 5200000, format: (v) => `Rp\u00a0${formatCompact(v)}` },
  { id: "orders", label: "Orders", value: 212, goal: 320, step: 38 },
  { id: "packed", label: "Packed", value: 176, goal: 212, step: 21 },
];

/** The stretch of a ring just ahead of its head: the lap's shadow stays on the ring and never spills into the gaps. */
const aheadOf = (r: number) => {
  const outer = r + STROKE / 2;
  const inner = r - STROKE / 2;
  const a = (32 * Math.PI) / 180;
  const at = (l: number) => `${(100 + l * Math.sin(a)).toFixed(3)} ${(100 - l * Math.cos(a)).toFixed(3)}`;
  return `M100 ${100 - outer}A${outer} ${outer} 0 0 1 ${at(outer)}L${at(inner)}A${inner} ${inner} 0 0 0 100 ${100 - inner}Z`;
};

export interface GoalRingsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Up to three, outermost first. */
  rings?: GoalRing[];
  /** Label of the button that closes every ring. */
  actionLabel?: string;
  onRingChange?: (id: string, value: number) => void;
}

/**
 * Three concentric targets. They sweep closed when they come into view; a ring that passes its goal laps itself, its
 * rounded head riding over the start with a soft shadow. Press a row to add to it.
 */
export function GoalRings({ rings = DEFAULT_RINGS, actionLabel = "Close the day", onRingChange, className, ...props }: GoalRingsProps) {
  const shownRings = React.useMemo(() => rings.slice(0, 3), [rings]);
  const initial = React.useMemo(() => Object.fromEntries(shownRings.map((r) => [r.id, r.value])), [shownRings]);
  const [values, setValues] = React.useState(initial);
  const [active, setActive] = React.useState(shownRings[0]?.id);
  const dirty = shownRings.some((r) => values[r.id] !== initial[r.id]);

  const uid = React.useId();
  const svg = React.useRef<SVGSVGElement>(null);
  const arcs = React.useRef<(SVGCircleElement | null)[]>([]);
  const heads = React.useRef<(SVGGElement | null)[]>([]);
  const center = React.useRef<HTMLSpanElement>(null);
  const motion = React.useRef(shownRings.map(() => ({ pos: 0, vel: 0, to: 0, wait: 0 })));
  const loop = React.useRef({ raf: 0, last: 0, onScreen: true, started: false });
  const activeIndex = Math.max(0, shownRings.findIndex((r) => r.id === active));
  const activeRef = React.useRef(activeIndex);
  activeRef.current = activeIndex;

  const paint = React.useCallback(() => {
    motion.current.forEach((m, i) => {
      const p = Math.max(0, m.pos);
      const arc = arcs.current[i];
      if (arc) {
        arc.style.strokeDasharray = `${Math.min(1, p).toFixed(4)} 1`;
        arc.style.opacity = p > 0.002 ? "1" : "0";
      }
      const head = heads.current[i];
      if (head) {
        head.setAttribute("transform", `rotate(${(p * 360).toFixed(2)} 100 100)`);
        head.style.opacity = Math.min(1, Math.max(0, (p - 0.965) / 0.03)).toFixed(3);
      }
    });
    const m = motion.current[activeRef.current];
    if (center.current && m) center.current.textContent = `${formatNumber(Math.round(Math.max(0, m.pos) * 100))}%`;
  }, []);

  const run = React.useCallback(() => {
    const l = loop.current;
    if (l.raf || !l.onScreen) return;
    l.last = performance.now();
    const frame = (t: number) => {
      l.raf = 0;
      const dt = Math.min(Math.max(t - l.last, 1) / 1000, 1 / 30);
      l.last = t;
      let moving = false;
      for (const m of motion.current) {
        if (m.wait > 0) {
          m.wait -= dt * 1000;
          moving = true;
          continue;
        }
        m.vel += (STIFFNESS * (m.to - m.pos) - DAMPING * m.vel) * dt;
        m.pos += m.vel * dt;
        if (Math.abs(m.to - m.pos) < 0.0006 && Math.abs(m.vel) < 0.004) {
          m.pos = m.to;
          m.vel = 0;
        } else moving = true;
      }
      paint();
      if (moving) l.raf = requestAnimationFrame(frame);
    };
    l.raf = requestAnimationFrame(frame);
  }, [paint]);

  React.useEffect(() => {
    const l = loop.current;
    shownRings.forEach((r, i) => {
      const m = motion.current[i];
      if (m) m.to = (values[r.id] ?? 0) / r.goal;
    });
    if (prefersReducedMotion()) {
      for (const m of motion.current) {
        m.pos = m.to;
        m.vel = 0;
      }
      l.started = true;
      paint();
      return;
    }
    if (l.started) run();
  }, [values, shownRings, paint, run]);

  React.useEffect(paint, [active, paint]);

  React.useEffect(() => {
    const l = loop.current;
    const el = svg.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        l.onScreen = entry.isIntersecting;
        if (!l.onScreen) {
          cancelAnimationFrame(l.raf);
          l.raf = 0;
          if (l.started) {
            for (const m of motion.current) {
              m.pos = m.to;
              m.vel = 0;
              m.wait = 0;
            }
            paint();
          }
          return;
        }
        if (!l.started) {
          l.started = true;
          motion.current.forEach((m, i) => {
            m.wait = i * SWEEP_DELAY;
          });
          if (prefersReducedMotion()) {
            for (const m of motion.current) m.pos = m.to;
            paint();
          } else run();
        } else run();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(l.raf);
      l.raf = 0;
    };
  }, [paint, run]);

  const setRing = (r: GoalRing, value: number) => {
    setActive(r.id);
    setValues((v) => ({ ...v, [r.id]: value }));
    onRingChange?.(r.id, value);
  };
  const closeAll = () => {
    const next = { ...values };
    shownRings.forEach((r, i) => {
      next[r.id] = Math.max(next[r.id] ?? 0, Math.round(r.goal * (PAST[i] ?? 1.05)));
      onRingChange?.(r.id, next[r.id]);
    });
    setValues(next);
  };

  return (
    <Card className={cn("@container grid min-w-0 gap-4", className)} {...props}>
      <div className="grid items-center gap-4 @[26rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative mx-auto aspect-square w-full max-w-[230px]">
          <svg ref={svg} viewBox="0 0 200 200" aria-hidden className="block size-full">
            <defs>
              <radialGradient id={`${uid}-lap`}>
                <stop offset="0.6" stopColor="#000" stopOpacity={0.46} />{/* grey-ok: the shadow where a ring laps itself */}
                <stop offset="1" stopColor="#000" stopOpacity={0} />{/* grey-ok */}
              </radialGradient>
            </defs>
            {shownRings.map((r, i) => {
              const radius = RADII[i];
              return (
                <g key={r.id}>
                  <circle cx={100} cy={100} r={radius} fill="none" strokeWidth={STROKE} className="stroke-fill" />
                  <circle
                    ref={(el) => {
                      arcs.current[i] = el;
                    }}
                    cx={100}
                    cy={100}
                    r={radius}
                    fill="none"
                    pathLength={1}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                    className={SHADES[i]}
                    style={{ strokeDasharray: "0 1", opacity: 0 }}
                  />
                  <g
                    ref={(el) => {
                      heads.current[i] = el;
                    }}
                    data-head
                    style={{ opacity: 0 }}
                  >
                    <clipPath id={`${uid}-ahead-${i}`}>
                      <path d={aheadOf(radius)} />
                    </clipPath>
                    <g clipPath={`url(#${uid}-ahead-${i})`}>
                      <circle cx={101.8} cy={100 - radius} r={STROKE / 2 + 3.6} fill={`url(#${uid}-lap)`} />
                    </g>
                    <circle cx={100} cy={100 - radius} r={STROKE / 2} className={FILLS[i]} />
                  </g>
                </g>
              );
            })}
          </svg>
          <span ref={center} className="absolute inset-0 grid place-items-center text-title font-semibold text-ink tabular-nums" />
        </div>
        <div className="grid gap-px">
          {shownRings.map((r, i) => {
            const v = values[r.id] ?? 0;
            const met = v >= r.goal;
            const text = r.format ? r.format(v) : formatNumber(v);
            return (
              <button
                key={r.id}
                type="button"
                aria-label={`${r.label}: ${text} of ${r.format ? r.format(r.goal) : formatNumber(r.goal)}. Add more`}
                onClick={() => setRing(r, v + r.step)}
                className={cn("ad-press flex h-row min-w-0 cursor-pointer select-none items-center gap-2.5 rounded-item px-2 text-left text-body hover:bg-fill focus-visible:bg-fill active:scale-[0.99]", active === r.id && "bg-fill")}
              >
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOTS[i])} />
                <span className="min-w-0 flex-1 truncate text-ink-muted">{r.label}</span>
                {met ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-success" /> : null}
                <span className="shrink-0 font-medium text-ink tabular-nums">{text}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-gap">
        <span />
        <Button variant="primary" onClick={closeAll}>
          {actionLabel}
        </Button>
        <span className="flex justify-end">
          <Tooltip content="Reset">
            <Button
              size="sm"
              variant="ghost"
              icon
              aria-label="Reset"
              onClick={() => {
                setValues(initial);
                setActive(shownRings[0]?.id);
              }}
              tabIndex={dirty ? undefined : -1}
              className={cn("text-ink-muted transition-[opacity,scale] duration-[160ms]", !dirty && "pointer-events-none opacity-0")}
            >
              <RotateCcw strokeWidth={1.75} />
            </Button>
          </Tooltip>
        </span>
      </div>
    </Card>
  );
}
