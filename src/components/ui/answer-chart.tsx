import * as React from "react";
import { cn, formatCompact, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface AnswerChartDatum {
  id: string;
  /** Under the bar. */
  label: string;
  /** In the sentence, after the number: "on Monday". */
  phrase: string;
  value: number;
}

const DATA: AnswerChartDatum[] = [
  { id: "mon", label: "Mon", phrase: "on Monday", value: 4200000 },
  { id: "tue", label: "Tue", phrase: "on Tuesday", value: 6100000 },
  { id: "wed", label: "Wed", phrase: "on Wednesday", value: 3400000 },
  { id: "thu", label: "Thu", phrase: "on Thursday", value: 7800000 },
  { id: "fri", label: "Fri", phrase: "on Friday", value: 9200000 },
];

const CHART_H = 148;
const STEP = 100000;
const STIFFNESS = 260;
const DAMPING = 26; // a hair under critical: the bar arrives with weight and no visible wobble
const FALL_MS = 560;
const STAGGER_MS = 110;

const CSS = `
.ad-ac-bar { transform: translateY(calc((1 - var(--v, 0)) * 100%)); }
.ad-ac-tag { transform: translate(-50%, calc(var(--v, 0) * ${-CHART_H}px - 5px)); opacity: 0; transition: opacity 160ms var(--ad-ease); }
.ad-ac-col[data-in="true"] .ad-ac-tag { opacity: 1; }
.ad-ac-num { transition: color 150ms var(--ad-ease), background-color 150ms var(--ad-ease); }
.ad-ac-num[data-gone="true"] { color: var(--ad-ink-muted); }`;

const label = (n: number) => formatCompact(n, { digits: 1 });

export interface AnswerChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  /** The start of the sentence, before the first number. */
  intro?: string;
  /** One number per bar, in the order of the sentence. */
  data?: AnswerChartDatum[];
  /** A bar was dragged or stepped to a new value. */
  onValueChange?: (id: string, value: number) => void;
}

/**
 * An AI answer whose numbers fall out of the sentence, land on a baseline and grow into bars. The chart stays live: drag
 * a bar, or step it with the arrow keys, and its number in the sentence follows.
 */
export function AnswerChart({ intro = "Rimba Kemang sold", data = DATA, onValueChange, className, ...props }: AnswerChartProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const numEls = React.useRef<Record<string, HTMLElement | null>>({});
  const colEls = React.useRef<Record<string, HTMLElement | null>>({});
  const tagEls = React.useRef<Record<string, HTMLElement | null>>({});
  const timers = React.useRef<number[]>([]);
  const flights = React.useRef(new Set<Animation>());
  const landedRef = React.useRef<Record<string, boolean>>({});
  const leftRef = React.useRef<Record<string, boolean>>({});
  const raf = React.useRef(0);
  const last = React.useRef(0);
  const onScreen = React.useRef(true);
  const spring = React.useRef<Record<string, { x: number; v: number; to: number }>>({});
  const scale = React.useMemo(() => Math.max(...data.map((d) => d.value)) * 1.18, [data]);

  const [values, setValues] = React.useState(() => Object.fromEntries(data.map((d) => [d.id, d.value])) as Record<string, number>);
  const [gone, setGone] = React.useState<Record<string, boolean>>({});
  const [landed, setLanded] = React.useState<Record<string, boolean>>({});
  const [hot, setHot] = React.useState<string | null>(null);
  const [drag, setDrag] = React.useState<string | null>(null);
  const live = data.every((d) => landed[d.id]);
  const started = data.some((d) => gone[d.id]);

  const paint = React.useCallback((id: string, x: number) => {
    colEls.current[id]?.style.setProperty("--v", x.toFixed(4));
  }, []);

  const frame = React.useCallback((t: number) => {
    raf.current = 0;
    const dt = Math.min(Math.max(t - last.current, 1) / 1000, 1 / 30);
    last.current = t;
    let moving = false;
    for (const [id, s] of Object.entries(spring.current)) {
      s.v += (STIFFNESS * (s.to - s.x) - DAMPING * s.v) * dt;
      s.x += s.v * dt;
      if (Math.abs(s.to - s.x) < 0.001 && Math.abs(s.v) < 0.01) {
        s.x = s.to;
        s.v = 0;
      } else moving = true;
      paint(id, s.x);
    }
    if (moving) raf.current = requestAnimationFrame(frame);
  }, [paint]);

  const kick = React.useCallback(() => {
    if (raf.current || !onScreen.current) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(frame);
  }, [frame]);

  const aim = React.useCallback((id: string, to: number, instant = false) => {
    const s = (spring.current[id] ??= { x: 0, v: 0, to: 0 });
    s.to = to;
    if (instant || prefersReducedMotion() || !onScreen.current) {
      s.x = to;
      s.v = 0;
      paint(id, to);
      return;
    }
    kick();
  }, [kick, paint]);

  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting;
      if (entry.isIntersecting) return;
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      for (const [id, s] of Object.entries(spring.current)) {
        s.x = s.to;
        s.v = 0;
        paint(id, s.x);
      }
    });
    io.observe(el);
    const running = flights.current;
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf.current);
      for (const t of timers.current) clearTimeout(t);
      for (const an of running) an.cancel();
    };
  }, [paint]);

  const arrive = React.useCallback((d: AnswerChartDatum, value: number) => {
    landedRef.current = { ...landedRef.current, [d.id]: true };
    setLanded(landedRef.current);
    aim(d.id, value / scale);
  }, [aim, scale]);

  const drop = React.useCallback((d: AnswerChartDatum) => {
    if (leftRef.current[d.id]) return;
    leftRef.current = { ...leftRef.current, [d.id]: true };
    const host = root.current;
    const from = numEls.current[d.id];
    const col = colEls.current[d.id];
    const tag = tagEls.current[d.id];
    setGone((g) => ({ ...g, [d.id]: true }));
    if (!host || !from || !col || !tag || prefersReducedMotion()) {
      arrive(d, d.value);
      return;
    }
    const box = host.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const c = col.getBoundingClientRect();
    const clone = document.createElement("span");
    clone.setAttribute("aria-hidden", "true");
    clone.textContent = label(d.value);
    clone.className = "absolute left-0 top-0 z-10 origin-center whitespace-nowrap text-body font-semibold tabular-nums text-ink";
    host.append(clone);
    const w = clone.offsetWidth;
    const h = clone.offsetHeight;
    const x0 = a.left - box.left + a.width / 2 - w / 2;
    const y0 = a.top - box.top + a.height / 2 - h / 2;
    const x1 = c.left - box.left + c.width / 2 - w / 2;
    const y1 = c.bottom - box.top - h - 5;
    const frames: Keyframe[] = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      // Across at an easy pace, down under gravity, after a small hop off the line.
      const ex = 1 - Math.pow(1 - t, 2);
      const hop = 12 * Math.sin(Math.min(1, t / 0.32) * Math.PI);
      const y = y0 + (y1 - y0) * t * t - hop;
      const spin = Math.sin(t * Math.PI) * (x1 >= x0 ? 5 : -5);
      frames.push({ offset: t, transform: `translate(${(x0 + (x1 - x0) * ex).toFixed(2)}px, ${y.toFixed(2)}px) rotate(${spin.toFixed(2)}deg)` });
    }
    const an = clone.animate(frames, { duration: FALL_MS, easing: "linear", fill: "both" });
    flights.current.add(an);
    an.oncancel = () => {
      flights.current.delete(an);
      clone.remove();
    };
    an.onfinish = () => {
      flights.current.delete(an);
      clone.remove();
      arrive(d, d.value);
    };
  }, [arrive]);

  const run = () => {
    data.filter((d) => !gone[d.id]).forEach((d, i) => {
      if (prefersReducedMotion()) drop(d);
      else timers.current.push(window.setTimeout(() => drop(d), i * STAGGER_MS));
    });
  };

  const reset = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    for (const an of [...flights.current]) an.cancel();
    leftRef.current = {};
    landedRef.current = {};
    setLanded({});
    setGone({});
    setDrag(null);
    setValues(Object.fromEntries(data.map((d) => [d.id, d.value])));
    for (const d of data) aim(d.id, 0);
  };

  const setValue = (d: AnswerChartDatum, raw: number, instant: boolean) => {
    const next = Math.max(STEP, Math.min(Math.floor(scale / STEP) * STEP, Math.round(raw / STEP) * STEP));
    aim(d.id, next / scale, instant);
    if (values[d.id] === next) return;
    onValueChange?.(d.id, next);
    setValues((v) => ({ ...v, [d.id]: next }));
  };

  const fromPointer = (d: AnswerChartDatum, e: React.PointerEvent) => {
    const r = colEls.current[d.id]?.getBoundingClientRect();
    if (r) setValue(d, ((r.bottom - e.clientY) / r.height) * scale, true);
  };

  const keys = (d: AnswerChartDatum, e: React.KeyboardEvent) => {
    const v = values[d.id];
    const to = { ArrowUp: v + STEP, ArrowRight: v + STEP, ArrowDown: v - STEP, ArrowLeft: v - STEP, PageUp: v + STEP * 10, PageDown: v - STEP * 10, Home: STEP, End: scale }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    setValue(d, to, true);
  };

  const busy = started && !live;

  return (
    <div ref={root} className={cn("relative grid w-full gap-gap", className)} {...props}>
      <style href="ad-answer-chart" precedence="default">
        {CSS}
      </style>

      <div className="grid gap-5 rounded-card bg-surface p-pad shadow-card">
        <p className="text-pretty text-title leading-[1.65] text-ink">
          {intro}{" "}
          {data.map((d, i) => (
            <React.Fragment key={d.id}>
              <button
                ref={(el) => {
                  numEls.current[d.id] = el;
                }}
                type="button"
                data-gone={!!gone[d.id]}
                aria-label={`${formatRp(values[d.id])} ${d.phrase}`}
                onClick={() => drop(d)}
                onPointerEnter={() => setHot(d.id)}
                onPointerLeave={() => setHot(null)}
                onFocus={() => setHot(d.id)}
                onBlur={() => setHot(null)}
                className={cn(
                  "ad-ac-num -mx-1 inline-block cursor-pointer select-none whitespace-nowrap rounded-small px-1 font-semibold tabular-nums",
                  hot === d.id ? "bg-fill" : "focus-visible:bg-fill",
                )}
              >
                Rp&nbsp;{label(values[d.id])}
              </button>{" "}
              {d.phrase}
              {i < data.length - 2 ? ", " : i === data.length - 2 ? " and " : "."}
            </React.Fragment>
          ))}
        </p>

        <div className="flex gap-2 pt-6" onPointerLeave={() => !drag && setHot(null)}>
          {data.map((d) => {
            const on = !!landed[d.id];
            const strong = hot === d.id || drag === d.id;
            return (
              <div key={d.id} className="grid min-w-0 flex-1 justify-items-center gap-2">
                <div
                  ref={(el) => {
                    colEls.current[d.id] = el;
                  }}
                  data-in={on}
                  role={live ? "slider" : undefined}
                  tabIndex={live ? 0 : undefined}
                  aria-label={live ? d.phrase : undefined}
                  aria-orientation={live ? "vertical" : undefined}
                  aria-valuemin={live ? STEP : undefined}
                  aria-valuemax={live ? Math.floor(scale / STEP) * STEP : undefined}
                  aria-valuenow={live ? values[d.id] : undefined}
                  aria-valuetext={live ? formatRp(values[d.id]) : undefined}
                  onKeyDown={live ? (e) => keys(d, e) : undefined}
                  onPointerEnter={() => setHot(d.id)}
                  onFocus={() => setHot(d.id)}
                  onBlur={() => setHot(null)}
                  onPointerDown={(e) => {
                    if (!live) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setDrag(d.id);
                    // A finger may be starting a scroll: touch sets the value where it lifts, a mouse drags.
                    if (e.pointerType !== "touch") fromPointer(d, e);
                  }}
                  onPointerMove={(e) => {
                    if (drag === d.id && e.pointerType !== "touch") fromPointer(d, e);
                  }}
                  onPointerUp={(e) => {
                    if (drag === d.id && e.pointerType === "touch") fromPointer(d, e);
                    setDrag(null);
                  }}
                  onPointerCancel={() => setDrag(null)}
                  style={{ height: CHART_H, touchAction: "pan-y" }}
                  className={cn("ad-ac-col relative w-full max-w-[52px] select-none rounded-item", live && "cursor-ns-resize")}
                >
                  <div className={cn("absolute inset-0 overflow-hidden rounded-item transition-[background-color] duration-150 ease-ad", strong && live ? "bg-fill-strong" : "bg-fill")}>
                    <div className={cn("ad-ac-bar absolute inset-0 rounded-item transition-[background-color] duration-150 ease-ad", strong ? "bg-chart-1" : "bg-chart-2")} />
                  </div>
                  <span
                    ref={(el) => {
                      tagEls.current[d.id] = el;
                    }}
                    aria-hidden
                    className="ad-ac-tag pointer-events-none absolute bottom-0 left-1/2 whitespace-nowrap text-body font-semibold tabular-nums text-ink"
                  >
                    {label(values[d.id])}
                  </span>
                </div>
                <span className="text-small text-ink-muted">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant={live ? "ghost" : "primary"} size="sm" disabled={busy} onClick={live ? reset : run}>
          <span className="inline-grid">
            {["Chart it", "Charting…", "Reset"].map((t, i) => {
              const at = busy ? 1 : live ? 2 : 0;
              return (
                <span key={t} aria-hidden={i !== at} className={cn("col-start-1 row-start-1 text-center", i !== at && "invisible")}>
                  {t}
                </span>
              );
            })}
          </span>
        </Button>
      </div>
    </div>
  );
}
