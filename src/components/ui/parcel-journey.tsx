import * as React from "react";
import { Pause, Play, RotateCcw } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

type Pt = readonly [number, number];

export interface ParcelStop {
  /** The hub's name, shown on the map. */
  place: string;
  /** What the scan there said, read together with the place: "Sorted in" + "Semarang". */
  scan: string;
  /** When it was scanned, as printed. */
  time: string;
  /** Where the hub sits on the map: x 0–640, y 28–192. */
  at: Pt;
  /** Points the road passes on the way here from the stop before. */
  via?: Pt[];
}

const VIEW_W = 640;
const VIEW_TOP = 28;
const VIEW_H = 164;
const SAMPLES = 16;
const HOLD_MS = 460;
const MS_PER_UNIT = 6.2;
const MAX_TILT = 16;

const DEFAULT_STOPS: ParcelStop[] = [
  { place: "Jakarta", scan: "Picked up in", time: "Mon, 09.12", at: [92, 66] },
  { place: "Cirebon", scan: "Sorted in", time: "Mon, 15.40", at: [226, 86], via: [[152, 84]] },
  { place: "Semarang", scan: "Sorted in", time: "Mon, 21.05", at: [338, 96], via: [[284, 102]] },
  { place: "Surabaya", scan: "Out of hub in", time: "Tue, 06.30", at: [476, 122], via: [[406, 116]] },
  { place: "Denpasar", scan: "Delivered in", time: "Tue, 16.48", at: [604, 152], via: [[530, 146], [574, 142]] },
];

/* A simplified drawing of Java, Madura and Bali. */
const JAVA: Pt[] = [
  [12, 74], [30, 58], [52, 52], [78, 46], [104, 44], [128, 50], [150, 54], [176, 52], [196, 60], [214, 70], [238, 74], [262, 78], [286, 82], [306, 80], [322, 72],
  [338, 60], [352, 58], [362, 70], [376, 84], [400, 90], [426, 92], [450, 96], [470, 100], [480, 110], [494, 120], [516, 122], [540, 126], [556, 134], [566, 150],
  [558, 170], [540, 164], [524, 176], [500, 178], [474, 174], [446, 170], [418, 168], [388, 164], [358, 158], [328, 154], [298, 150], [268, 146], [238, 140],
  [208, 134], [178, 128], [148, 122], [118, 116], [90, 112], [66, 106], [44, 102], [24, 96],
];
const MADURA: Pt[] = [[486, 92], [510, 84], [540, 82], [566, 84], [578, 92], [560, 100], [532, 102], [506, 104], [490, 102]];
const BALI: Pt[] = [[586, 138], [604, 130], [622, 136], [632, 148], [620, 160], [606, 170], [596, 160], [588, 150]];

type Seg = [Pt, Pt, Pt, Pt];

/** Catmull-Rom through the points, as cubic Béziers. */
function smooth(points: readonly Pt[], closed: boolean): Seg[] {
  const n = points.length;
  const at = (i: number) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  const segs: Seg[] = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    segs.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  return segs;
}

const n1 = (v: number) => v.toFixed(1);
const toPath = (segs: Seg[], closed: boolean) =>
  `M${n1(segs[0][0][0])} ${n1(segs[0][0][1])}` + segs.map(([, a, b, c]) => `C${n1(a[0])} ${n1(a[1])} ${n1(b[0])} ${n1(b[1])} ${n1(c[0])} ${n1(c[1])}`).join("") + (closed ? "Z" : "");

const LAND = [JAVA, MADURA, BALI].map((p) => toPath(smooth(p, true), true));

function bezier([a, b, c, d]: Seg, t: number): Pt {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [w[0] * a[0] + w[1] * b[0] + w[2] * c[0] + w[3] * d[0], w[0] * a[1] + w[1] * b[1] + w[2] * c[1] + w[3] * d[1]];
}

/** The road, walked into a table of points by distance, so the parcel moves at a true speed along it. */
function buildRoute(stops: ParcelStop[]) {
  const pts: Pt[] = [];
  const hubAt: number[] = [];
  stops.forEach((s, i) => {
    if (i && s.via) pts.push(...s.via);
    hubAt.push(pts.length);
    pts.push(s.at);
  });
  const segs = smooth(pts, false);
  const xs = [pts[0][0]];
  const ys = [pts[0][1]];
  const ss = [0];
  const hubS = [0];
  segs.forEach((seg, si) => {
    for (let k = 1; k <= SAMPLES; k++) {
      const [x, y] = bezier(seg, k / SAMPLES);
      ss.push(ss[ss.length - 1] + Math.hypot(x - xs[xs.length - 1], y - ys[ys.length - 1]));
      xs.push(x);
      ys.push(y);
    }
    const hub = hubAt.indexOf(si + 1);
    if (hub > 0) hubS[hub] = ss[ss.length - 1];
  });
  return { d: toPath(segs, false), xs, ys, ss, hubS, length: ss[ss.length - 1] };
}
type Route = ReturnType<typeof buildRoute>;

function indexAt(r: Route, s: number) {
  let lo = 0;
  let hi = r.ss.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (r.ss[mid] <= s) lo = mid;
    else hi = mid;
  }
  return lo;
}

function pointAt(r: Route, s: number) {
  const i = indexAt(r, s);
  const j = Math.min(i + 1, r.ss.length - 1);
  const span = r.ss[j] - r.ss[i] || 1;
  const k = Math.max(0, Math.min(1, (s - r.ss[i]) / span));
  const a = Math.min(i, r.ss.length - 2);
  return { x: r.xs[i] + (r.xs[j] - r.xs[i]) * k, y: r.ys[i] + (r.ys[j] - r.ys[i]) * k, angle: (Math.atan2(r.ys[a + 1] - r.ys[a], r.xs[a + 1] - r.xs[a]) * 180) / Math.PI };
}

function nearestS(r: Route, x: number, y: number) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < r.xs.length; i++) {
    const d = (r.xs[i] - x) ** 2 + (r.ys[i] - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return r.ss[best];
}

const CSS = `
.ad-parcel-map { container-type: inline-size; touch-action: pan-y; --px: 0; --py: 0; --pa: 0; --pb: 0; --gx: 0; --gy: 0; }
.ad-parcel-body { transform: translate(calc(var(--px) * 1cqw - 50%), calc(var(--py) * 1cqw - 80% + var(--pb) * 1px)) rotate(calc(var(--pa) * 1deg)); }
.ad-parcel-ghost { transform: translate(calc(var(--gx) * 1cqw - 50%), calc(var(--gy) * 1cqw - 50%)); opacity: 0; transition: opacity 120ms var(--ad-ease); }
@media (hover: hover) { .ad-parcel-map[data-hover] .ad-parcel-ghost { opacity: 1; } }
.ad-parcel-swap { animation: ad-parcel-swap 200ms var(--ad-ease); }
@keyframes ad-parcel-swap { from { opacity: 0; transform: translateY(3px); filter: blur(2px); } }
@container (max-width: 430px) { .ad-parcel-name:not([data-now]) { opacity: 0; } }`;

/** On touch, the button answers across a full 44 px. */
const TOUCH = "relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-[44px] pointer-coarse:after:-translate-y-1/2";

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

type Status = "paused" | "playing" | "done";

/** The trip, driven in rAF through a few CSS variables. It only runs while something moves and the map is on screen. */
function attachJourney(map: HTMLElement, route: Route, reduced: boolean, autoPlay: boolean, on: { at: (i: number) => void; status: (s: Status) => void }) {
  const ridden = map.querySelector<SVGPathElement>("[data-ridden]")!;
  const parcel = map.querySelector<HTMLElement>("[data-parcel]")!;
  const pulses = [...map.querySelectorAll<HTMLElement>("[data-pulse]")];
  const end = route.hubS.length - 1;
  let s = reduced ? route.length : 0;
  let mode: "idle" | "ride" | "hold" | "scrub" | "settle" = "idle";
  let from = 0, to = 0, t = 0, dur = 0, hold = 0, scrubTo = 0, clock = 0;
  let at = -1, raf = 0, last = 0, onScreen = false, started = false;
  let scrubId: number | null = null;
  const ac = new AbortController();

  const atOf = (v: number) => {
    let i = 0;
    for (let h = 1; h <= end; h++) if (route.hubS[h] <= v + 0.5) i = h;
    return i;
  };
  const scanned = (i: number, pulse: boolean) => {
    if (i === at) return;
    const forward = i > at;
    at = i;
    on.at(i);
    if (!pulse || !forward || reduced || i === 0) return;
    pulses[i]?.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0.5 },
        { transform: "translate(-50%, -50%) scale(3)", opacity: 0 },
      ],
      { duration: 560, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
    parcel.firstElementChild?.animate([{ transform: "scale(1)" }, { transform: "scale(0.93, 0.96)", offset: 0.4 }, { transform: "scale(1)" }], { duration: 260, easing: "ease-out" });
  };
  const setStatus = () => on.status(mode === "ride" || mode === "hold" ? "playing" : at === end ? "done" : "paused");

  const paint = () => {
    const p = pointAt(route, s);
    const st = map.style;
    st.setProperty("--px", ((p.x / VIEW_W) * 100).toFixed(3));
    st.setProperty("--py", (((p.y - VIEW_TOP) / VIEW_W) * 100).toFixed(3));
    st.setProperty("--pa", Math.max(-MAX_TILT, Math.min(MAX_TILT, p.angle)).toFixed(2));
    st.setProperty("--pb", mode === "ride" ? (Math.sin(clock / 62) * 0.7).toFixed(2) : "0");
    const i = indexAt(route, s);
    let d = `M${n1(route.xs[0])} ${n1(route.ys[0])}`;
    for (let k = 1; k <= i; k++) d += `L${n1(route.xs[k])} ${n1(route.ys[k])}`;
    ridden.setAttribute("d", `${d}L${n1(p.x)} ${n1(p.y)}`);
  };

  const startLeg = (hub: number) => {
    from = s;
    to = hub;
    t = 0;
    dur = reduced ? 0 : Math.max(520, (route.hubS[hub] - from) * MS_PER_UNIT);
    mode = "ride";
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(now - last, 50);
    last = now;
    clock += dt;
    if (mode === "ride") {
      t = dur ? Math.min(1, t + dt / dur) : 1;
      // Eases in and out of every hub, like a truck pulling up.
      const k = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      s = from + (route.hubS[to] - from) * k;
      if (t >= 1) {
        s = route.hubS[to];
        scanned(to, true);
        if (to === end) mode = "idle";
        else {
          mode = "hold";
          hold = reduced ? 900 : HOLD_MS;
        }
        setStatus();
      }
    } else if (mode === "hold") {
      hold -= dt;
      if (hold <= 0) startLeg(to + 1);
    } else if (mode === "scrub") {
      s += (scrubTo - s) * (1 - Math.exp(-dt / 40));
      scanned(atOf(s), true);
    } else if (mode === "settle") {
      t = Math.min(1, t + dt / 240);
      s = from + (route.hubS[to] - from) * (1 - (1 - t) ** 3);
      if (t >= 1) {
        s = route.hubS[to];
        mode = "idle";
        scanned(to, true);
        setStatus();
      }
    }
    paint();
    if (mode !== "idle") kick();
  };
  function kick() {
    if (raf || !onScreen) return;
    if (!last) last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const play = () => {
    started = true;
    if (at === end) {
      s = 0;
      at = -1;
      scanned(0, false);
      paint();
    }
    startLeg(at + 1);
    setStatus();
    last = performance.now();
    kick();
  };
  const stop = () => {
    // Pausing lets the parcel finish rolling to the nearest hub, so it never rests between scans.
    from = s;
    to = nearestHub(s);
    t = 0;
    mode = reduced ? "idle" : "settle";
    if (reduced) {
      s = route.hubS[to];
      scanned(to, false);
      paint();
      setStatus();
    } else {
      setStatus();
      last = performance.now();
      kick();
    }
  };
  const nearestHub = (v: number) => route.hubS.reduce((b, h, i) => (Math.abs(h - v) < Math.abs(route.hubS[b] - v) ? i : b), 0);

  const toMap = (e: PointerEvent) => {
    const r = map.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * VIEW_W, ((e.clientY - r.top) / r.height) * VIEW_H + VIEW_TOP] as const;
  };

  map.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button) return;
      started = true;
      scrubId = e.pointerId;
      map.setPointerCapture(e.pointerId);
      const [x, y] = toMap(e);
      scrubTo = nearestS(route, x, y);
      if (reduced) {
        s = scrubTo;
        scanned(atOf(s), false);
        paint();
      }
      mode = "scrub";
      on.status(at === end ? "done" : "paused");
      last = performance.now();
      kick();
    },
    { signal: ac.signal },
  );
  map.addEventListener(
    "pointermove",
    (e) => {
      const [x, y] = toMap(e);
      if (e.pointerType === "mouse") {
        const g = pointAt(route, nearestS(route, x, y));
        map.style.setProperty("--gx", ((g.x / VIEW_W) * 100).toFixed(3));
        map.style.setProperty("--gy", (((g.y - VIEW_TOP) / VIEW_W) * 100).toFixed(3));
        map.dataset.hover = "";
      }
      if (scrubId !== e.pointerId) return;
      scrubTo = nearestS(route, x, y);
      if (reduced) {
        s = scrubTo;
        scanned(atOf(s), false);
        paint();
      }
    },
    { signal: ac.signal },
  );
  map.addEventListener("pointerleave", () => delete map.dataset.hover, { signal: ac.signal });
  const release = (e: PointerEvent) => {
    if (scrubId !== e.pointerId) return;
    scrubId = null;
    s = reduced ? scrubTo : s;
    stop();
  };
  map.addEventListener("pointerup", release, { signal: ac.signal });
  map.addEventListener("pointercancel", release, { signal: ac.signal });
  map.addEventListener(
    "keydown",
    (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const base = mode === "ride" || mode === "hold" ? atOf(s) : at;
      const next = { ArrowLeft: base - 1, ArrowDown: base - 1, ArrowRight: base + 1, ArrowUp: base + 1, Home: 0, End: end }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      started = true;
      cancelAnimationFrame(raf);
      raf = 0;
      mode = "idle";
      // From the keyboard the parcel jumps straight to the scan (motion.no-keyboard-animation).
      s = route.hubS[Math.max(0, Math.min(end, next))];
      scanned(atOf(s), false);
      paint();
      setStatus();
    },
    { signal: ac.signal },
  );

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (!onScreen) {
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      if (autoPlay && !reduced && !started && entry.intersectionRatio >= 0.45) play();
      else if (mode !== "idle") {
        last = performance.now();
        kick();
      }
    },
    { threshold: [0, 0.45] },
  );
  io.observe(map);

  scanned(atOf(s), false);
  paint();
  setStatus();

  return {
    toggle: () => (mode === "ride" || mode === "hold" ? stop() : play()),
    dispose: () => {
      ac.abort();
      io.disconnect();
      cancelAnimationFrame(raf);
    },
  };
}

const ParcelGlyph = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden className="block drop-shadow-sm">
    <path d="M12 2.6 21 7.6 12 12.6 3 7.6Z" className="fill-ink" />
    <path d="M3 7.6 12 12.6V22L3 17Z" className="fill-ink-muted" />
    <path d="M21 7.6 12 12.6V22L21 17Z" className="fill-fill-strong" />
    <path d="M7.2 5.3 16.2 10.3 16.2 13 18.3 11.8 18.3 9 9.3 4.1Z" className="fill-brand" />
  </svg>
);

export interface ParcelJourneyProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The hubs in order, each with its scan. Their `at` points sit on the map, x 0–640 and y 28–192. */
  stops?: ParcelStop[];
  /** The tracking number, as printed. */
  tracking?: string;
  /** Ride the route once when it first scrolls into view. */
  autoPlay?: boolean;
  /** Called when the parcel reaches the last stop. */
  onArrive?: () => void;
}

/**
 * A parcel riding its route across the map, pausing at each scan. Press or drag anywhere on the map to scrub the whole
 * trip (it settles on the nearest hub); arrow keys, Home and End step through the scans.
 */
export function ParcelJourney({ stops = DEFAULT_STOPS, tracking = "RK-2041-8836", autoPlay = true, onArrive, className, ...props }: ParcelJourneyProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const engine = React.useRef<ReturnType<typeof attachJourney> | null>(null);
  const arrive = React.useRef(onArrive);
  React.useEffect(() => {
    arrive.current = onArrive;
  });
  const route = React.useMemo(() => buildRoute(stops), [stops]);
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const [at, setAt] = React.useState(0);
  const [status, setStatus] = React.useState<Status>("paused");
  const lastStatus = React.useRef<Status>("paused");
  const end = stops.length - 1;

  React.useLayoutEffect(() => {
    if (!mapRef.current) return;
    const e = attachJourney(mapRef.current, route, reduced, autoPlay, {
      at: setAt,
      status: (s) => {
        if (s === "done" && lastStatus.current === "playing") arrive.current?.();
        lastStatus.current = s;
        setStatus(s);
      },
    });
    engine.current = e;
    return () => e.dispose();
  }, [route, reduced, autoPlay]);

  const stop = stops[Math.min(at, end)];
  const done = status === "done";
  const Icon = status === "playing" ? Pause : done ? RotateCcw : Play;

  return (
    <div className={cn("grid w-full min-w-0 gap-3 rounded-card bg-surface p-pad shadow-card", className)} {...props}>
      <style href="ad-parcel-journey" precedence="default">
        {CSS}
      </style>
      <div className="flex min-h-control items-center justify-between gap-3">
        <p key={at} aria-live="polite" className="ad-parcel-swap flex min-w-0 items-center gap-2 text-title font-semibold text-ink">
          {done && <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-success" />}
          <span className="truncate">
            {stop.scan} <span translate="no">{stop.place}</span>
          </span>
        </p>
        <span key={`t${at}`} className="ad-parcel-swap shrink-0 text-body tabular-nums text-ink-muted">
          {stop.time}
        </span>
      </div>

      <div
        ref={mapRef}
        role="slider"
        tabIndex={0}
        aria-label="Parcel trip"
        aria-valuemin={0}
        aria-valuemax={end}
        aria-valuenow={at}
        aria-valuetext={`${stop.scan} ${stop.place}, ${stop.time}`}
        className="ad-parcel-map group relative cursor-grab select-none overflow-hidden rounded-item transition-colors duration-150 focus-visible:bg-fill active:cursor-grabbing"
      >
        <svg viewBox={`0 ${VIEW_TOP} ${VIEW_W} ${VIEW_H}`} aria-hidden className="block h-auto w-full">
          {LAND.map((d) => (
            <path key={d} d={d} className="fill-fill transition-colors duration-150 group-focus-visible:fill-fill-strong" />
          ))}
          <path d={route.d} fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 6" vectorEffect="non-scaling-stroke" className="stroke-ink-muted" />
          <path data-ridden fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-brand" />
        </svg>
        {stops.map((h, i) => {
          const reached = i <= at;
          const x = (h.at[0] / VIEW_W) * 100;
          const y = ((h.at[1] - VIEW_TOP) / VIEW_H) * 100;
          const nearEnd = h.at[0] > VIEW_W - 72;
          return (
            <React.Fragment key={h.place}>
              <span data-pulse aria-hidden className="pointer-events-none absolute size-[12px] rounded-full bg-brand opacity-0" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }} />
              <span aria-hidden className={cn("pointer-events-none absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full", reached ? "bg-brand" : "bg-ink-muted")} style={{ left: `${x}%`, top: `${y}%` }} />
              <span
                aria-hidden
                translate="no"
                data-now={i === at ? "" : undefined}
                className={cn("ad-parcel-name pointer-events-none absolute whitespace-nowrap pt-[9px] text-small font-medium", i === at ? "text-ink" : "text-ink-muted")}
                style={{ left: `${x}%`, top: `${y}%`, transform: `translateX(${nearEnd ? "-82%" : "-50%"})` }}
              >
                {h.place}
              </span>
            </React.Fragment>
          );
        })}
        <span aria-hidden className="ad-parcel-ghost pointer-events-none absolute left-0 top-0 size-[9px] rounded-full bg-ink" />
        <span data-parcel aria-hidden className="ad-parcel-body pointer-events-none absolute left-0 top-0">
          <span className="block origin-bottom">
            <ParcelGlyph />
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span translate="no" className="truncate text-body tabular-nums text-ink-muted">
          {tracking}
        </span>
        <Button variant="ghost" size="sm" className={cn("w-[92px]", TOUCH)} onClick={() => engine.current?.toggle()}>
          <Icon strokeWidth={1.75} />
          {status === "playing" ? "Pause" : done ? "Replay" : "Play"}
        </Button>
      </div>
    </div>
  );
}
