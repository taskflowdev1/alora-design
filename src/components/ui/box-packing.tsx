import * as React from "react";
import { cn, formatNumber, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

type Size = readonly [number, number, number];

export interface PackItem {
  id: string;
  name: string;
  /** Width, depth and height in 10 cm cells. */
  size: Size;
  /** Accent shade, 3 (light) to 6 (deep). */
  shade: 3 | 4 | 5 | 6;
}

export interface PackCarton {
  name: string;
  /** Width, depth and height in 10 cm cells. */
  size: Size;
}

const DEFAULT_ITEMS: PackItem[] = [
  { id: "teko", name: "Teko tanah liat", size: [2, 2, 2], shade: 5 },
  { id: "piring", name: "Piring ceper", size: [3, 3, 1], shade: 3 },
  { id: "gelas", name: "Gelas kopi", size: [1, 1, 2], shade: 6 },
  { id: "mangkuk", name: "Mangkuk", size: [2, 2, 1], shade: 4 },
  { id: "toples", name: "Toples kaca", size: [2, 2, 2], shade: 3 },
  { id: "tatakan", name: "Tatakan", size: [2, 1, 1], shade: 6 },
];

const DEFAULT_CARTONS: PackCarton[] = [
  { name: "Small carton", size: [3, 3, 2] },
  { name: "Medium carton", size: [4, 3, 3] },
  { name: "Large carton", size: [5, 4, 3] },
];

const U = 28;
const CX = 0.866;
const SY = 0.5;
const VIEW_W = 380;
const VIEW_H = 300;
const CENTER_Y = 186;
const DROP_FROM = 2.6;
const GRAVITY = 44;
const RESTITUTION = 0.3;
/** How high the near walls stand, as a share of the carton. */
const FRONT = 0.5;

const iso = (x: number, y: number, z: number) => [(x - y) * CX * U, (x + y) * SY * U - z * U] as const;
const poly = (pts: (readonly [number, number, number])[]) =>
  pts
    .map(([x, y, z]) => {
      const [a, b] = iso(x, y, z);
      return `${a.toFixed(2)},${b.toFixed(2)}`;
    })
    .join(" ");

interface Placed {
  id: string;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

/** First fit, biggest item first, lowest and furthest back. Everything rests fully on the floor or on what's under it. */
function pack(items: PackItem[], [W, D, H]: Size): Placed[] | null {
  const grid = new Uint8Array(W * D * H);
  const cell = (x: number, y: number, z: number) => x + y * W + z * W * D;
  const free = (x: number, y: number, z: number, w: number, d: number, h: number) => {
    if (x + w > W || y + d > D || z + h > H) return false;
    for (let k = z; k < z + h; k++) for (let j = y; j < y + d; j++) for (let i = x; i < x + w; i++) if (grid[cell(i, j, k)]) return false;
    if (z === 0) return true;
    for (let j = y; j < y + d; j++) for (let i = x; i < x + w; i++) if (!grid[cell(i, j, z - 1)]) return false;
    return true;
  };
  const out: Placed[] = [];
  const sorted = [...items].sort((a, b) => b.size[0] * b.size[1] * b.size[2] - a.size[0] * a.size[1] * a.size[2] || b.size[0] * b.size[1] - a.size[0] * a.size[1]);
  for (const it of sorted) {
    const [sw, sd, h] = it.size;
    let spot: Placed | null = null;
    search: for (let z = 0; z <= H - h; z++) {
      for (let y = 0; y < D; y++) {
        for (let x = 0; x < W; x++) {
          for (const [w, d] of sw === sd ? [[sw, sd]] : [[sw, sd], [sd, sw]]) {
            if (free(x, y, z, w, d, h)) {
              spot = { id: it.id, x, y, z, w, d, h };
              break search;
            }
          }
        }
      }
    }
    if (!spot) return null;
    for (let k = spot.z; k < spot.z + h; k++) for (let j = spot.y; j < spot.y + spot.d; j++) for (let i = spot.x; i < spot.x + spot.w; i++) grid[cell(i, j, k)] = 1;
    out.push(spot);
  }
  return out;
}

/** Back to front: a box is painted before anything it sits behind, under, or to the far side of. */
function depthSort(items: Placed[]) {
  const behind = (a: Placed, b: Placed) => a.x + a.w <= b.x || a.y + a.d <= b.y || a.z + a.h <= b.z;
  const left = [...items];
  const out: Placed[] = [];
  while (left.length) {
    let i = left.findIndex((a) => left.every((b) => b === a || !behind(b, a) || behind(a, b)));
    if (i < 0) i = 0;
    out.push(left[i]);
    left.splice(i, 1);
  }
  return out;
}

function choose(items: PackItem[], cartons: PackCarton[]) {
  for (let i = 0; i < cartons.length; i++) {
    const placed = pack(items, cartons[i].size);
    if (placed) return { carton: i, placed };
  }
  // Too much for the largest carton: keep what fits, biggest first.
  const last = cartons.length - 1;
  const kept = [...items];
  while (kept.length) {
    kept.pop();
    const placed = pack(kept, cartons[last].size);
    if (placed) return { carton: last, placed };
  }
  return { carton: last, placed: [] as Placed[] };
}

const CSS = `
.ad-pack {
  --pack-kraft: oklch(0.66 0.075 72); /* grey-ok: carton */
  --pack-kraft-mid: oklch(0.59 0.075 70); /* grey-ok: carton, side in light */
  --pack-kraft-deep: oklch(0.5 0.07 68); /* grey-ok: carton, side in shade */
  --pack-kraft-in: oklch(0.42 0.055 66); /* grey-ok: inside of the box */
  --pack-kraft-floor: oklch(0.37 0.045 66); /* grey-ok: floor of the box */
  --pack-flap: oklch(0.72 0.07 74); /* grey-ok: the open flaps, catching the light */
}
.ad-pack-floor { fill: var(--pack-kraft-floor); }
.ad-pack-in { fill: var(--pack-kraft-in); }
.ad-pack-left { fill: var(--pack-kraft-mid); }
.ad-pack-right { fill: var(--pack-kraft-deep); }
.ad-pack-flap { fill: var(--pack-flap); }
.ad-pack-flap-side { fill: var(--pack-kraft); }
.ad-pack-bar { transform-origin: left; transition: transform 260ms var(--ad-ease); }`;

/** On touch, the button answers across a full 44 px. */
const TOUCH = "relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-[44px] pointer-coarse:after:-translate-y-1/2";

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

/** A block of three faces, in shades of the accent. */
const Block = React.memo(function Block({ w, d, h, shade }: { w: number; d: number; h: number; shade: number }) {
  const step = (n: number) => `var(--ad-brand-${Math.min(9, n)})`;
  return (
    <>
      <polygon points={poly([[0, d, 0], [w, d, 0], [w, d, h], [0, d, h]])} fill={step(shade + 1)} />
      <polygon points={poly([[w, 0, 0], [w, d, 0], [w, d, h], [w, 0, h]])} fill={step(shade + 2)} />
      <polygon points={poly([[0, 0, h], [w, 0, h], [w, d, h], [0, d, h]])} fill={step(shade)} />
    </>
  );
});

/** A product taken out: it lifts and fades where it stood, while the others close the gap. */
function Leaving({ item, spot, onDone }: { item: PackItem; spot: Placed; onDone: (id: string) => void }) {
  const ref = React.useRef<SVGGElement>(null);
  React.useLayoutEffect(() => {
    const a = ref.current?.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: `translateY(${-U * 1.1}px)`, opacity: 0 }], { duration: 200, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" });
    if (!a) return onDone(spot.id);
    a.onfinish = () => onDone(spot.id);
    return () => a.cancel();
  }, [onDone, spot.id]);
  const [x, y] = iso(spot.x, spot.y, spot.z);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
      <g ref={ref}>
        <Block w={spot.w} d={spot.d} h={spot.h} shade={item.shade} />
      </g>
    </g>
  );
}

type Body = { x: number; y: number; z: number; vx: number; vy: number; vz: number; falling: boolean };

/** The carton's walls resize on a spring and the items travel to their new spots, all written straight to the SVG. */
function useStage(svg: React.RefObject<SVGSVGElement | null>, placed: Placed[], size: Size, reduced: boolean) {
  const bodies = React.useRef(new Map<string, Body>());
  const box = React.useRef({ w: size[0], d: size[1], h: size[2], vw: 0, vd: 0, vh: 0 });
  const target = React.useRef({ placed, size });
  const raf = React.useRef(0);
  const last = React.useRef(0);
  const frame = React.useRef<(t: number) => void>(() => {});

  const paintBox = React.useCallback(() => {
    const el = svg.current;
    if (!el) return;
    const { w: W, d: D, h: H } = box.current;
    const set = (name: string, pts: (readonly [number, number, number])[]) => el.querySelector(`[data-wall="${name}"]`)?.setAttribute("points", poly(pts));
    set("floor", [[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]]);
    // Cut like a shelf-ready carton: the near walls are low and the sides slope up to the back, so the contents show.
    const F = H * FRONT;
    set("back-l", [[0, 0, 0], [0, D, 0], [0, D, F], [0, 0, H]]);
    set("back-r", [[0, 0, 0], [W, 0, 0], [W, 0, F], [0, 0, H]]);
    set("front-l", [[0, D, 0], [W, D, 0], [W, D, F], [0, D, F]]);
    set("front-r", [[W, 0, 0], [W, D, 0], [W, D, F], [W, 0, F]]);
    set("flap-bl", [[0, 0, H], [0, D, F], [-0.72, D, F + 0.5], [-0.72, 0, H + 0.5]]);
    set("flap-br", [[0, 0, H], [W, 0, F], [W, -0.72, F + 0.5], [0, -0.72, H + 0.5]]);
    set("flap-fl", [[0, D, F], [W, D, F], [W, D + 0.62, F - 0.42], [0, D + 0.62, F - 0.42]]);
    set("flap-fr", [[W, 0, F], [W, D, F], [W + 0.62, D, F - 0.42], [W + 0.62, 0, F - 0.42]]);
    const [cx, cy] = iso(W / 2, D / 2, 0);
    el.querySelector("[data-world]")?.setAttribute("transform", `translate(${(VIEW_W / 2 - cx).toFixed(2)} ${(CENTER_Y - cy + (H * U) / 2).toFixed(2)})`);
  }, [svg]);

  const paintItem = React.useCallback(
    (id: string, b: Body) => {
      const [x, y] = iso(b.x, b.y, b.z);
      svg.current?.querySelector(`[data-item="${id}"]`)?.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    },
    [svg],
  );

  React.useLayoutEffect(() => {
    frame.current = (now: number) => {
      raf.current = 0;
      const dt = Math.min(now - last.current, 34) / 1000;
      last.current = now;
      let moving = false;
      const b = box.current;
      const [tw, td, th] = target.current.size;
      b.vw += (240 * (tw - b.w) - 28 * b.vw) * dt;
      b.vd += (240 * (td - b.d) - 28 * b.vd) * dt;
      b.vh += (240 * (th - b.h) - 28 * b.vh) * dt;
      b.w += b.vw * dt;
      b.d += b.vd * dt;
      b.h += b.vh * dt;
      if (Math.abs(tw - b.w) + Math.abs(td - b.d) + Math.abs(th - b.h) > 0.004 || Math.abs(b.vw) + Math.abs(b.vd) + Math.abs(b.vh) > 0.02) moving = true;
      else {
        b.w = tw;
        b.d = td;
        b.h = th;
        b.vw = b.vd = b.vh = 0;
      }
      paintBox();
      for (const p of target.current.placed) {
        const o = bodies.current.get(p.id);
        if (!o) continue;
        o.vx += (220 * (p.x - o.x) - 28 * o.vx) * dt;
        o.vy += (220 * (p.y - o.y) - 28 * o.vy) * dt;
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        if (o.falling) {
          // Falls, lands, and comes up once a little before it stops.
          o.vz -= GRAVITY * dt;
          o.z += o.vz * dt;
          if (o.z <= p.z) {
            o.z = p.z;
            if (Math.abs(o.vz) < 2.2) {
              o.vz = 0;
              o.falling = false;
            } else o.vz = -o.vz * RESTITUTION;
          }
        } else {
          o.vz += (260 * (p.z - o.z) - 30 * o.vz) * dt;
          o.z += o.vz * dt;
        }
        const still = !o.falling && Math.abs(p.x - o.x) + Math.abs(p.y - o.y) + Math.abs(p.z - o.z) < 0.004 && Math.abs(o.vx) + Math.abs(o.vy) + Math.abs(o.vz) < 0.02;
        if (still) {
          o.x = p.x;
          o.y = p.y;
          o.z = p.z;
          o.vx = o.vy = o.vz = 0;
        } else moving = true;
        paintItem(p.id, o);
      }
      if (moving) raf.current = requestAnimationFrame((t) => frame.current(t));
    };
  }, [paintBox, paintItem]);

  React.useLayoutEffect(() => {
    target.current = { placed, size };
    for (const p of placed) {
      if (!bodies.current.has(p.id)) {
        const start = !reduced && last.current > 0;
        bodies.current.set(p.id, { x: p.x, y: p.y, z: start ? size[2] + DROP_FROM : p.z, vx: 0, vy: 0, vz: start ? -1.2 : 0, falling: start });
      }
      paintItem(p.id, bodies.current.get(p.id)!);
    }
    if (!reduced && last.current > 0) {
      for (const p of placed) {
        if (bodies.current.get(p.id)?.falling) svg.current?.querySelector(`[data-item="${p.id}"]`)?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: "ease-out" });
      }
    }
    for (const id of [...bodies.current.keys()]) if (!placed.some((p) => p.id === id)) bodies.current.delete(id);
    if (reduced || !last.current) {
      const b = box.current;
      b.w = size[0];
      b.d = size[1];
      b.h = size[2];
      b.vw = b.vd = b.vh = 0;
      for (const p of placed) {
        const o = bodies.current.get(p.id)!;
        Object.assign(o, { x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, falling: false });
        paintItem(p.id, o);
      }
      paintBox();
      last.current = last.current || 1;
      return;
    }
    if (!raf.current) {
      last.current = performance.now();
      raf.current = requestAnimationFrame((t) => frame.current(t));
    }
  }, [placed, size, reduced, paintBox, paintItem, svg]);

  React.useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    },
    [],
  );
}

export interface BoxPackingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
  /** The products, each with its size in 10 cm cells. */
  items?: PackItem[];
  /** Smallest first. The first one everything fits in is picked. */
  cartons?: PackCarton[];
  /** Ids in the box at the start. */
  defaultValue?: string[];
  /** Called when the contents change, with the carton picked for them. */
  onChange?: (ids: string[], carton: PackCarton) => void;
}

/**
 * An open carton in isometric. Tap a product and it drops in, lands with one small bounce and nests against the others;
 * the fill level picks the carton, which grows or shrinks around them.
 */
export function BoxPacking({ items = DEFAULT_ITEMS, cartons = DEFAULT_CARTONS, defaultValue = ["teko", "gelas", "mangkuk"], onChange, className, ...props }: BoxPackingProps) {
  const svg = React.useRef<SVGSVGElement>(null);
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const [ids, setIds] = React.useState(defaultValue);
  const inBox = React.useMemo(() => items.filter((i) => ids.includes(i.id)), [items, ids]);
  const { carton, placed } = React.useMemo(() => choose(inBox, cartons), [inBox, cartons]);
  const size = cartons[carton].size;
  useStage(svg, placed, size, reduced);
  const sorted = React.useMemo(() => depthSort(placed), [placed]);
  const [leaving, setLeaving] = React.useState<Placed[]>([]);
  const left = React.useCallback((id: string) => setLeaving((old) => old.filter((p) => p.id !== id)), []);

  const volume = placed.reduce((sum, p) => sum + p.w * p.d * p.h, 0);
  const capacity = size[0] * size[1] * size[2];
  const fill = capacity ? volume / capacity : 0;
  const percent = Math.round(fill * 100);
  const dims = `${size[0] * 10} × ${size[1] * 10} × ${size[2] * 10} cm`;

  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id];
    if (!reduced) setLeaving((old) => [...old.filter((p) => p.id !== id), ...placed.filter((p) => p.id === id && !next.includes(id))]);
    setIds(next);
    const nextItems = items.filter((i) => next.includes(i.id));
    onChange?.(next, cartons[choose(nextItems, cartons).carton]);
  };
  const empty = () => {
    if (!reduced) setLeaving(placed);
    setIds([]);
    onChange?.([], cartons[0]);
  };

  return (
    <div className={cn("ad-pack grid w-full min-w-0 gap-3 rounded-card bg-surface p-pad shadow-card", className)} {...props}>
      <style href="ad-box-packing" precedence="default">
        {CSS}
      </style>
      <div className="flex items-baseline justify-between gap-3">
        <div aria-live="polite" className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="text-title font-semibold text-ink">{cartons[carton].name}</span>
          <span className="text-body tabular-nums text-ink-muted">{dims}</span>
        </div>
        <span className="shrink-0 text-title font-semibold tabular-nums text-ink">{formatNumber(percent)}%</span>
      </div>
      <div role="progressbar" aria-label="Carton filled" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-[5px] overflow-hidden rounded-full bg-fill">
        <div className="ad-pack-bar h-full rounded-full bg-brand" style={{ transform: `scaleX(${fill})` }} />
      </div>

      <svg ref={svg} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={`${cartons[carton].name}, ${percent}% full, holding ${inBox.map((i) => i.name).join(", ") || "nothing"}`} className="mx-auto block h-auto w-full max-w-[420px] overflow-visible">
        <g data-world>
          <polygon data-wall="flap-bl" className="ad-pack-flap-side" />
          <polygon data-wall="flap-br" className="ad-pack-flap" />
          <polygon data-wall="floor" className="ad-pack-floor" />
          <polygon data-wall="back-l" className="ad-pack-in" />
          <polygon data-wall="back-r" className="ad-pack-floor" />
          {sorted.map((p) => {
            const it = items.find((i) => i.id === p.id)!;
            return (
              <g key={p.id} data-item={p.id}>
                <Block w={p.w} d={p.d} h={p.h} shade={it.shade} />
              </g>
            );
          })}
          {leaving
            .filter((p) => !ids.includes(p.id))
            .map((p) => (
              <Leaving key={p.id} item={items.find((i) => i.id === p.id)!} spot={p} onDone={left} />
            ))}
          <polygon data-wall="front-l" className="ad-pack-left" />
          <polygon data-wall="front-r" className="ad-pack-right" />
          <polygon data-wall="flap-fl" className="ad-pack-flap" />
          <polygon data-wall="flap-fr" className="ad-pack-flap-side" />
        </g>
      </svg>

      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((it) => {
          const on = ids.includes(it.id);
          return (
            <button
              key={it.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(it.id)}
              translate="no"
              className={cn(
                "ad-press inline-flex h-item cursor-pointer select-none items-center gap-1.5 rounded-control px-bubble text-body font-medium active:scale-[0.97] pointer-coarse:h-[44px]",
                on ? "bg-fill-strong text-ink" : "bg-fill text-ink-muted hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong focus-visible:text-ink",
              )}
            >
              <span aria-hidden className={cn("size-[7px] rounded-full", !on && "opacity-0")} style={{ background: `var(--ad-brand-${it.shade})` }} />
              {it.name}
            </button>
          );
        })}
        <Button variant="ghost" size="sm" className={cn("ml-auto", TOUCH, !ids.length && "invisible")} tabIndex={ids.length ? undefined : -1} onClick={empty}>
          Empty
        </Button>
      </div>
    </div>
  );
}
