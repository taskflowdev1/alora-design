import * as React from "react";
import { cn, formatNumber, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

type Pt = { x: number; y: number };

const VIEW_W = 560;
const VIEW_H = 290;
const KEY_NUDGE = 10;
const SWEEP_MS = 520;
const BOWS = [26, -20, 32, -28, 18, -34, 24, -18, 30, -24, 20, -30];

/** Knots to start from: visit orders over the default stops that cross themselves a lot. */
const KNOTS = [
  [0, 5, 2, 8, 3, 9, 4, 1, 6, 7],
  [0, 3, 7, 1, 5, 9, 2, 6, 4, 8],
  [0, 6, 1, 4, 8, 2, 7, 3, 9, 5],
];

const DEFAULT_STOPS: Pt[] = [
  { x: 70, y: 146 },
  { x: 130, y: 58 },
  { x: 244, y: 36 },
  { x: 356, y: 62 },
  { x: 470, y: 42 },
  { x: 512, y: 146 },
  { x: 442, y: 240 },
  { x: 322, y: 196 },
  { x: 216, y: 254 },
  { x: 112, y: 232 },
];

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const loopLength = (order: number[], p: Pt[]) => order.reduce((sum, id, i) => sum + dist(p[id], p[order[(i + 1) % order.length]]), 0);
const edgesOf = (order: number[]) => order.map((id, i) => [id, order[(i + 1) % order.length]] as [number, number]);

interface Move {
  /** The two roads that get swapped for two shorter ones. */
  a: number;
  b: number;
  c: number;
  d: number;
  order: number[];
  length: number;
}

/** 2-opt, best move first: each step uncrosses one pair of roads, until no swap makes the loop shorter. */
function solve(start: number[], p: Pt[]): Move[] {
  const moves: Move[] = [];
  let order = [...start];
  const n = order.length;
  for (let guard = 0; guard < 40; guard++) {
    let best = 1e-6;
    let bi = -1;
    let bj = -1;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const [a, b, c, d] = [order[i], order[i + 1], order[j], order[(j + 1) % n]];
        const gain = dist(p[a], p[b]) + dist(p[c], p[d]) - dist(p[a], p[c]) - dist(p[b], p[d]);
        if (gain > best) {
          best = gain;
          bi = i;
          bj = j;
        }
      }
    }
    if (bi < 0) break;
    const [a, b, c, d] = [order[bi], order[bi + 1], order[bj], order[(bj + 1) % n]];
    order = [...order.slice(0, bi + 1), ...order.slice(bi + 1, bj + 1).reverse(), ...order.slice(bj + 1)];
    moves.push({ a, b, c, d, order, length: loopLength(order, p) });
  }
  return moves;
}

const CSS = `
.ad-route-map { container-type: inline-size; }
.ad-route-stop { transform: translate(calc(var(--x) * 1cqw - 50%), calc(var(--y) * 1cqw - 50%)); }
.ad-route-roll { height: 1.15em; overflow: hidden; display: block; }
.ad-route-col { display: block; }
.ad-route-comma, .ad-route-base { display: block; height: 1.15em; line-height: 1.15em; }
.ad-route-base { width: 0; overflow: hidden; }
.ad-route-col > span { display: block; height: 1.15em; line-height: 1.15em; }`;

/** On touch, the button answers across a full 44 px. */
const TOUCH = "relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-[44px] pointer-coarse:after:-translate-y-1/2";

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

/** An odometer: each digit is a strip of 0–9 and rolls on from the one to its right. Written straight to the DOM. */
function Roll({ api, digits, className }: { api: React.RefObject<((v: number) => void) | null>; digits: number; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const cols = ref.current ? [...ref.current.querySelectorAll<HTMLElement>("[data-col]")] : [];
    const text = ref.current?.querySelector<HTMLElement>("[data-text]");
    api.current = (v) => {
      const tenths = Math.max(0, v) * 10 + 1e-6;
      cols.forEach((el, c) => {
        const place = 10 ** (cols.length - 1 - c);
        const scaled = tenths / place;
        const whole = Math.floor(scaled);
        const frac = scaled - whole;
        const pos = (whole % 10) + (place === 1 ? frac : Math.max(0, (frac - 0.9) / 0.1));
        el.style.transform = `translateY(${(-pos * 100) / 11}%)`;
        // Leading zeros are blank, and take no width.
        const shown = whole > 0 || place <= 10;
        (el.parentElement as HTMLElement).style.display = shown ? "" : "none";
      });
      if (text) text.textContent = formatNumber(Math.round(tenths) / 10, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };
    return () => {
      api.current = null;
    };
  }, [api, digits]);
  const col = (key: number) => (
    <span key={key} className="ad-route-roll">
      <span data-col className="ad-route-col">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </span>
    </span>
  );
  return (
    <span ref={ref} className={cn("relative inline-flex items-baseline tabular-nums", className)}>
      <span data-text className="sr-only" />
      <span aria-hidden className="inline-flex items-start">
        {/* A zero-width letter gives the row a text baseline; clipped digit strips have none of their own. */}
        <span className="ad-route-base">{"\u200b"}</span>
        {Array.from({ length: digits - 1 }, (_, i) => col(i))}
        <span className="ad-route-comma">,</span>
        {col(digits)}
      </span>
    </span>
  );
}

interface Engine {
  untangle: () => void;
  tangle: () => void;
  dispose: () => void;
}

function attachRoute(
  map: HTMLElement,
  stops: Pt[],
  kmPerUnit: number,
  reduced: boolean,
  on: { order: (o: number[]) => void; phase: (p: "knot" | "busy" | "done") => void; roll: (km: number, saved: number) => void; done: (savedKm: number) => void },
): Engine {
  const paths = [...map.querySelectorAll<SVGPathElement>("[data-edge]")];
  const sweep = map.querySelector<SVGPathElement>("[data-sweep]")!;
  const dots = [...map.querySelectorAll<HTMLElement>("[data-stop]")];
  const p = stops.map((s) => ({ ...s }));
  let knot = 0;
  let order = [...KNOTS[0]].slice(0, p.length);
  if (order.length !== p.length) order = p.map((_, i) => i);
  let edges = edgesOf(order);
  let tension = 1;
  let worst = loopLength(order, p);
  let shown = worst;
  let raf = 0;
  let timeline: { from: [number, number][]; to: [number, number][]; start: number; dur: number; lenFrom: number; lenTo: number; tFrom: number; tTo: number; then: () => void } | null = null;
  let sweepT = -1;
  let last = 0;
  let dragging: { id: number; stop: number; dx: number; dy: number } | null = null;
  const ac = new AbortController();

  const edgePath = (ax: number, ay: number, bx: number, by: number, bow: number) => {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    return `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${(mx - (dy / len) * bow).toFixed(1)} ${(my + (dx / len) * bow).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
  };
  const paintEdges = (k = 1) => {
    paths.forEach((el, i) => {
      const bow = BOWS[i % BOWS.length] * tension;
      if (timeline) {
        const [fa, fb] = timeline.from[i];
        const [ta, tb] = timeline.to[i];
        const a = { x: p[fa].x + (p[ta].x - p[fa].x) * k, y: p[fa].y + (p[ta].y - p[fa].y) * k };
        const b = { x: p[fb].x + (p[tb].x - p[fb].x) * k, y: p[fb].y + (p[tb].y - p[fb].y) * k };
        el.setAttribute("d", edgePath(a.x, a.y, b.x, b.y, bow));
      } else {
        const [u, v] = edges[i];
        el.setAttribute("d", edgePath(p[u].x, p[u].y, p[v].x, p[v].y, bow));
      }
    });
  };
  const paintDots = () => {
    dots.forEach((el, i) => {
      el.style.setProperty("--x", ((p[i].x / VIEW_W) * 100).toFixed(3));
      el.style.setProperty("--y", ((p[i].y / VIEW_W) * 100).toFixed(3));
    });
  };
  const roll = (km: number) => {
    shown = km;
    // Mid-move the digits roll freely; at rest they land on whole tenths, and the two figures agree.
    const now = km * kmPerUnit;
    const was = worst * kmPerUnit;
    if (timeline) on.roll(now, Math.max(0, was - now));
    else {
      const a = Math.round(now * 10) / 10;
      on.roll(a, Math.max(0, Math.round(was * 10) / 10 - a));
    }
  };
  const paintSweep = (k: number) => {
    if (k < 0) {
      sweep.setAttribute("d", "");
      return;
    }
    // The accent travels round the finished loop from the depot, so the last move finishes the line.
    const pts = [...order, order[0]].map((id) => p[id]);
    const total = pts.slice(1).reduce((s, b, i) => s + dist(pts[i], b), 0);
    let left = total * k;
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length && left > 0; i++) {
      const seg = dist(pts[i - 1], pts[i]);
      const f = Math.min(1, left / (seg || 1));
      d += `L${(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f).toFixed(1)} ${(pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f).toFixed(1)}`;
      left -= seg;
    }
    sweep.setAttribute("d", d);
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(now - last, 50);
    last = now;
    if (timeline) {
      const raw = Math.min(1, (now - timeline.start) / timeline.dur);
      const k = raw < 0.5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2;
      tension = timeline.tFrom + (timeline.tTo - timeline.tFrom) * k;
      paintEdges(k);
      roll(timeline.lenFrom + (timeline.lenTo - timeline.lenFrom) * k);
      if (raw >= 1) {
        const { then } = timeline;
        timeline = null;
        then();
      }
    } else if (sweepT >= 0) {
      sweepT = Math.min(1, sweepT + dt / SWEEP_MS);
      paintSweep(1 - (1 - sweepT) ** 2);
      if (sweepT >= 1) {
        sweepT = -1;
        paintSweep(1);
      }
    }
    if (timeline || sweepT >= 0) kick();
  };
  function kick() {
    if (raf) return;
    raf = requestAnimationFrame(frame);
  }

  const finish = () => {
    roll(shown);
    on.phase("done");
    on.done(Math.max(0, worst - shown) * kmPerUnit);
    if (reduced) paintSweep(1);
    else {
      sweepT = 0;
      last = performance.now();
      kick();
    }
  };

  const untangle = () => {
    if (timeline) return;
    const moves = solve(order, p);
    paintSweep(-1);
    if (!moves.length) {
      tension = 0;
      paintEdges();
      finish();
      return;
    }
    if (reduced) {
      order = moves[moves.length - 1].order;
      edges = edgesOf(order);
      tension = 0;
      on.order(order);
      paintEdges();
      roll(loopLength(order, p));
      finish();
      return;
    }
    on.phase("busy");
    const each = Math.min(340, 2300 / moves.length);
    const step = (m: number) => {
      const move = moves[m];
      const before = edges.map((e) => [...e] as [number, number]);
      const after = before.map(([u, v]) => {
        if ((u === move.a && v === move.b) || (u === move.b && v === move.a)) return [move.a, move.c] as [number, number];
        if ((u === move.c && v === move.d) || (u === move.d && v === move.c)) return [move.b, move.d] as [number, number];
        return [u, v] as [number, number];
      });
      // Each edge keeps its direction, so the swap slides the two loose ends across.
      const from = before.map(([u, v], i) => (after[i][0] === u || after[i][1] === v ? ([u, v] as [number, number]) : ([v, u] as [number, number])));
      const lenFrom = loopLength(order, p);
      timeline = {
        from,
        to: after,
        start: performance.now(),
        dur: each,
        lenFrom,
        lenTo: move.length,
        tFrom: tension,
        tTo: 1 - (m + 1) / moves.length,
        then: () => {
          order = move.order;
          edges = after;
          on.order(order);
          if (m + 1 < moves.length) step(m + 1);
          else {
            tension = 0;
            paintEdges();
            finish();
          }
        },
      };
    };
    step(0);
    last = performance.now();
    kick();
  };

  const tangle = () => {
    if (timeline) return;
    paintSweep(-1);
    sweepT = -1;
    knot = (knot + 1) % KNOTS.length;
    let next = KNOTS[knot].filter((i) => i < p.length);
    if (next.length !== p.length) next = [...p.keys()].reverse();
    const nextEdges = edgesOf(next);
    if (reduced) {
      order = next;
      edges = nextEdges;
      tension = 1;
      on.order(order);
      paintEdges();
      worst = loopLength(order, p);
      roll(worst);
      on.phase("knot");
      return;
    }
    on.phase("busy");
    const lenTo = loopLength(next, p);
    worst = lenTo;
    timeline = {
      from: edges.map((e) => [...e] as [number, number]),
      to: nextEdges,
      start: performance.now(),
      dur: 300,
      lenFrom: loopLength(order, p),
      lenTo,
      tFrom: tension,
      tTo: 1,
      then: () => {
        order = next;
        edges = nextEdges;
        on.order(order);
        roll(lenTo);
        on.phase("knot");
      },
    };
    last = performance.now();
    kick();
  };

  const toView = (e: PointerEvent) => {
    const r = map.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * VIEW_W, y: ((e.clientY - r.top) / r.height) * VIEW_H };
  };
  const moved = () => {
    paintDots();
    paintEdges();
    paintSweep(-1);
    const len = loopLength(order, p);
    // Moving a stop is a new problem: what the route costs now is the figure to beat.
    worst = len;
    roll(len);
    on.phase("knot");
  };
  dots.forEach((el, stop) => {
    const opts = { signal: ac.signal };
    el.addEventListener("pointerdown", (e) => {
      if (e.button || timeline) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const at = toView(e);
      dragging = { id: e.pointerId, stop, dx: p[stop].x - at.x, dy: p[stop].y - at.y };
      el.focus({ preventScroll: true });
    }, opts);
    el.addEventListener("pointermove", (e) => {
      if (dragging?.id !== e.pointerId) return;
      const at = toView(e);
      p[stop].x = Math.max(14, Math.min(VIEW_W - 14, at.x + dragging.dx));
      p[stop].y = Math.max(14, Math.min(VIEW_H - 14, at.y + dragging.dy));
      moved();
    }, opts);
    const end = (e: PointerEvent) => {
      if (dragging?.id === e.pointerId) dragging = null;
    };
    el.addEventListener("pointerup", end, opts);
    el.addEventListener("pointercancel", end, opts);
    el.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!step || timeline) return;
      e.preventDefault();
      p[stop].x = Math.max(14, Math.min(VIEW_W - 14, p[stop].x + step[0] * KEY_NUDGE));
      p[stop].y = Math.max(14, Math.min(VIEW_H - 14, p[stop].y + step[1] * KEY_NUDGE));
      moved();
    }, opts);
  });

  paintDots();
  paintEdges();
  roll(worst);
  on.order(order);

  return {
    untangle,
    tangle,
    dispose: () => {
      ac.abort();
      cancelAnimationFrame(raf);
    },
  };
}

export interface RouteUntangleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The stops on a 560 × 290 map; the first is the depot. */
  stops?: { x: number; y: number }[];
  /** Kilometres per map unit, for the figures. */
  kmPerUnit?: number;
  /** Called when the loop has been untangled, with the kilometres saved. */
  onUntangle?: (savedKm: number) => void;
}

/**
 * A knot of delivery roads that untangles into a clean loop, one uncrossed pair at a time, while the distance rolls
 * down. Drag a stop (or focus it and use the arrow keys) to make a new problem, then untangle again.
 */
export function RouteUntangle({ stops = DEFAULT_STOPS, kmPerUnit = 0.034, onUntangle, className, ...props }: RouteUntangleProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const engine = React.useRef<Engine | null>(null);
  const untangled = React.useRef(onUntangle);
  React.useEffect(() => {
    untangled.current = onUntangle;
  });
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const [phase, setPhase] = React.useState<"knot" | "busy" | "done">("knot");
  const [order, setOrder] = React.useState<number[]>(() => stops.map((_, i) => i));
  const kmRoll = React.useRef<((v: number) => void) | null>(null);
  const savedRoll = React.useRef<((v: number) => void) | null>(null);

  React.useLayoutEffect(() => {
    if (!mapRef.current) return;
    const e = attachRoute(mapRef.current, stops, kmPerUnit, reduced, {
      order: setOrder,
      phase: setPhase,
      roll: (km, saved) => {
        kmRoll.current?.(km);
        savedRoll.current?.(saved);
      },
      done: (km) => untangled.current?.(km),
    });
    engine.current = e;
    return () => e.dispose();
  }, [stops, kmPerUnit, reduced]);

  const visit = (id: number) => order.indexOf(id);

  return (
    <div className={cn("grid w-full min-w-0 gap-3 rounded-card bg-surface p-pad shadow-card", className)} {...props}>
      <style href="ad-route-untangle" precedence="default">
        {CSS}
      </style>
      <div className="flex items-end justify-between gap-4">
        <span className="flex items-baseline gap-1.5 text-number font-semibold text-ink">
          <Roll api={kmRoll} digits={4} />
          <span className="text-body font-medium text-ink-muted">km</span>
        </span>
        <span className="flex items-baseline gap-1.5 text-body">
          <span className="text-ink-muted">Saved</span>
          <span className="flex items-baseline gap-1 font-semibold text-ink">
            <Roll api={savedRoll} digits={4} />
            km
          </span>
        </span>
      </div>

      <div ref={mapRef} className="ad-route-map relative aspect-[560/290] w-full select-none">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden className="absolute inset-0 size-full overflow-visible">
          {stops.map((_, slot) => (
            <path key={slot} data-edge fill="none" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-ink-muted" />
          ))}
          <path data-sweep fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-brand" />
        </svg>
        {stops.map((_, id) => {
          const n = visit(id);
          return (
            <button
              key={id}
              type="button"
              data-stop
              aria-label={id === 0 ? "Depot. Drag or use arrow keys to move it." : `Stop ${n}. Drag or use arrow keys to move it.`}
              className={cn(
                "ad-route-stop absolute left-0 top-0 grid size-[22px] cursor-grab touch-none select-none place-items-center rounded-full text-small font-semibold tabular-nums shadow-sel transition-colors duration-150 after:absolute after:-inset-[1px] after:rounded-full active:cursor-grabbing pointer-coarse:after:-inset-[11px]",
                id === 0 ? "bg-on text-on-ink hover:bg-ink-muted focus-visible:bg-ink-muted" : "bg-fill-strong text-ink hover:bg-sel focus-visible:bg-sel",
              )}
            >
              {id === 0 ? "" : n}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-body tabular-nums text-ink-muted">{stops.length - 1} stops</span>
        <Button
          variant={phase === "done" ? "secondary" : "primary"}
          disabled={phase === "busy"}
          className={cn("w-[116px]", TOUCH)}
          onClick={() => (phase === "done" ? engine.current?.tangle() : engine.current?.untangle())}
        >
          {phase === "done" ? "Tangle again" : phase === "busy" ? "Untangling…" : "Untangle"}
        </Button>
      </div>
    </div>
  );
}
