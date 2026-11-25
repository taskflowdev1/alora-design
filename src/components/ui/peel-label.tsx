import * as React from "react";
import { RotateCcw } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

type Pt = readonly [number, number];

/** How far the corner has to travel, as a share of the label's diagonal, before the label comes free. */
const DETACH = 0.6;
const KEY_NUDGE = 8;

/*
 * The peel is a fold: the line halfway between the corner and the pointer. The label is clipped to the near side of that
 * line, and the part cut off is drawn again as the label's back, mirrored across it, so the corner lands exactly under
 * the pointer. Everything moves through clip-path, transform and a gradient that shades the roll of the paper.
 *
 * Carton, backing paper, label stock and printing are real objects, the same in both themes (hence grey-ok).
 */
const CSS = `
.ad-peel {
  container-type: inline-size; touch-action: pan-y;
  --peel-kraft: oklch(0.62 0.075 72); /* grey-ok: carton */
  --peel-kraft-deep: oklch(0.56 0.075 70); /* grey-ok: carton, the shaded side */
  --peel-tape: oklch(0.74 0.06 78 / 0.62); /* grey-ok: packing tape */
  --peel-liner: oklch(0.93 0.018 85); /* grey-ok: waxy backing paper */
  --peel-patch: oklch(0.885 0.022 85); /* grey-ok: where the glue sat */
  --peel-paper: oklch(0.985 0.006 90); /* grey-ok: label stock */
  --peel-ink: oklch(0.24 0.008 80); /* grey-ok: thermal print */
  --peel-soft: oklch(0.47 0.01 80); /* grey-ok: thermal print, lighter */
  --peel-back: oklch(0.9 0.016 86); /* grey-ok: the label's gummed back */
  --peel-lit: oklch(0.97 0.008 90); /* grey-ok: light on the roll of the paper */
  --peel-crease: oklch(0.76 0.02 84); /* grey-ok: shade inside the fold */
  --peel-cast: oklch(0.32 0.02 75 / 0.3); /* grey-ok: shadow on the paper */
}
.ad-peel-stage { background: radial-gradient(120% 90% at 22% 8% in oklab, var(--peel-kraft), var(--peel-kraft-deep)); }
.ad-peel-tape { background: var(--peel-tape); }
.ad-peel-liner { background: var(--peel-liner); }
.ad-peel-patch { background: var(--peel-patch); }
.ad-peel-face { background: var(--peel-paper); color: var(--peel-ink); }
.ad-peel-soft { color: var(--peel-soft); }
.ad-peel-bar { fill: var(--peel-ink); }
.ad-peel-flapwrap { filter: drop-shadow(0 1px 2px var(--peel-cast)) drop-shadow(-2px 3px 6px var(--peel-cast)); }
.ad-peel-flap { transform-origin: 0 0; }
.ad-peel-free { display: none; transform-origin: 50% 50%; box-shadow: var(--ad-shadow-card); transition: box-shadow 200ms var(--ad-ease); }
.ad-peel[data-phase="free"] .ad-peel-free, .ad-peel[data-phase="fly"] .ad-peel-free, .ad-peel[data-phase="stuck"] .ad-peel-free, .ad-peel[data-phase="return"] .ad-peel-free { display: block; }
.ad-peel[data-phase="free"] .ad-peel-free { box-shadow: var(--ad-shadow-dialog); cursor: grabbing; }
.ad-peel[data-phase="fly"] .ad-peel-free { box-shadow: var(--ad-shadow-dialog); }
.ad-peel[data-phase="stuck"] .ad-peel-free { cursor: grab; }
.ad-peel-free:focus-visible .ad-peel-face { background: var(--peel-liner); }
.ad-peel[data-phase="free"] .ad-peel-slot, .ad-peel[data-phase="fly"] .ad-peel-slot, .ad-peel[data-phase="stuck"] .ad-peel-slot, .ad-peel[data-phase="return"] .ad-peel-slot { visibility: hidden; }
.ad-peel-handle { touch-action: none; cursor: grab; }
.ad-peel-handle:active { cursor: grabbing; }`;

/** On touch, the button answers across a full 44 px. */
const TOUCH = "relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-[44px] pointer-coarse:after:-translate-y-1/2";

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

/** Keeps the part of a polygon on one side of a line (Sutherland–Hodgman, one edge). */
function clipPoly(poly: Pt[], side: (x: number, y: number) => number, sign: 1 | -1) {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = side(a[0], a[1]) * sign;
    const db = side(b[0], b[1]) * sign;
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) {
      const k = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
    }
  }
  return out;
}
const toClip = (poly: Pt[]) => (poly.length ? `polygon(${poly.map(([x, y]) => `${x.toFixed(2)}px ${y.toFixed(2)}px`).join(",")})` : "polygon(0 0)");

type Phase = "rest" | "peel" | "auto" | "free" | "fly" | "stuck" | "return";

function attachPeel(root: HTMLElement, reduced: boolean, on: { placed: (p: boolean) => void; stick: (at: { x: number; y: number }) => void }) {
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const slot = q("[data-slot]");
  const front = q("[data-front]");
  const shade = q("[data-shade]");
  const flap = q("[data-flap]");
  const handle = q("[data-handle]");
  const free = q("[data-free]");
  const ac = new AbortController();
  const opts = { signal: ac.signal };

  let W = 1, H = 1, sw = 1, sh = 1, ox = 0, oy = 0;
  let phase: Phase = "rest";
  let px = 0, py = 0, vx = 0, vy = 0, restX = 0, restY = 0, hover = false;
  let fx = 0, fy = 0, fr = 0, fs = 1, vfx = 0, vfy = 0, vfs = 0, tfx = 0, tfy = 0, tfr = 0, tfs = 1;
  let autoT = 0, autoX = 0, autoY = 0;
  let stuckAt: { x: number; y: number } | null = null;
  let dragId: number | null = null;
  let grabX = 0, grabY = 0, lastPX = 0, lastT = 0;
  let raf = 0, last = 0;

  const setPhase = (p: Phase) => {
    phase = p;
    root.dataset.phase = p;
    free.tabIndex = p === "stuck" ? 0 : -1;
    handle.style.visibility = p === "rest" || p === "peel" ? "" : "hidden";
    on.placed(p !== "rest" && p !== "peel");
  };

  const measure = () => {
    W = slot.offsetWidth || 1;
    H = slot.offsetHeight || 1;
    ox = slot.offsetLeft;
    oy = slot.offsetTop;
    sw = root.clientWidth || 1;
    sh = root.clientHeight || 1;
    const lift = reduced ? 0 : hover ? 0.19 : 0.095;
    restX = -W * lift;
    restY = -H * lift * 1.15;
  };

  const paintPeel = () => {
    const d = Math.hypot(px, py);
    if (d < 0.5) {
      front.style.clipPath = "none";
      flap.style.clipPath = "polygon(0 0)";
      shade.style.background = "none";
      return;
    }
    const nx = px / d;
    const ny = py / d;
    const mx = W + px / 2;
    const my = H + py / 2;
    const side = (x: number, y: number) => (x - mx) * nx + (y - my) * ny;
    const rect: Pt[] = [[0, 0], [W, 0], [W, H], [0, H]];
    front.style.clipPath = toClip(clipPoly(rect, side, 1));
    flap.style.clipPath = toClip(clipPoly(rect, side, -1));
    const dot = 2 * (mx * nx + my * ny);
    flap.style.transform = `matrix(${1 - 2 * nx * nx},${-2 * nx * ny},${-2 * nx * ny},${1 - 2 * ny * ny},${dot * nx},${dot * ny})`;
    const deg = (Math.atan2(nx, -ny) * 180) / Math.PI;
    const len = Math.abs(W * nx) + Math.abs(H * ny);
    const f = (mx - W / 2) * nx + (my - H / 2) * ny + len / 2;
    const band = Math.max(8, Math.min(34, d * 0.32));
    flap.style.background = `linear-gradient(${deg.toFixed(1)}deg, var(--peel-back) ${(f - band * 1.9).toFixed(1)}px, var(--peel-lit) ${(f - band * 0.8).toFixed(1)}px, var(--peel-crease) ${f.toFixed(1)}px)`;
    shade.style.background = `linear-gradient(${deg.toFixed(1)}deg, transparent ${f.toFixed(1)}px, var(--peel-cast) ${f.toFixed(1)}px, transparent ${(f + band * 1.2).toFixed(1)}px)`;
  };
  const paintFree = () => {
    free.style.transform = `translate3d(${fx.toFixed(2)}px, ${fy.toFixed(2)}px, 0) rotate(${fr.toFixed(2)}deg) scale(${fs.toFixed(4)})`;
  };

  const clampCenter = (cx: number, cy: number) => {
    const mx = W / 2 + 6;
    const my = H / 2 + 6;
    return [Math.max(mx, Math.min(sw - mx, cx)), Math.max(my, Math.min(sh - my, cy))] as const;
  };

  const stick = () => {
    const cx = ox + W / 2 + tfx;
    const cy = oy + H / 2 + tfy;
    stuckAt = { x: cx / sw, y: cy / sh };
    tfs = 1;
    tfr = fr * 0.7;
    setPhase("stuck");
    on.stick(stuckAt);
    kick();
  };

  const detach = (carried: boolean) => {
    fx = px * 0.28;
    fy = py * 0.28;
    fr = Math.max(-7, Math.min(7, (px / W) * 9));
    fs = 1;
    vfx = vfy = vfs = 0;
    tfs = 1.045;
    tfr = fr * 0.5;
    grabX = W * 0.22;
    grabY = H * 0.2;
    setPhase(carried ? "free" : "fly");
    if (!reduced) {
      free.firstElementChild?.animate([{ transform: "perspective(700px) rotateX(46deg) rotateZ(-3deg)", opacity: 0.4 }, { transform: "perspective(700px) rotateX(0) rotateZ(0)", opacity: 1 }], {
        duration: 240,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      });
    }
  };

  const toStage = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    const k = r.width / sw || 1;
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k] as const;
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(Math.max(now - last, 1), 34) / 1000;
    last = now;
    let moving: boolean;

    if (phase === "rest") {
      vx += (320 * (restX - px) - 30 * vx) * dt;
      vy += (320 * (restY - py) - 30 * vy) * dt;
      px += vx * dt;
      py += vy * dt;
      moving = Math.abs(restX - px) > 0.08 || Math.abs(restY - py) > 0.08 || Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5;
      if (!moving) {
        px = restX;
        py = restY;
        vx = vy = 0;
      }
      paintPeel();
    } else if (phase === "auto") {
      autoT = Math.min(1, autoT + dt / 0.4);
      const k = autoT < 0.5 ? 2 * autoT * autoT : 1 - (-2 * autoT + 2) ** 2 / 2;
      px = autoX + (-W * 0.66 - autoX) * k;
      py = autoY + (-H * 0.74 - autoY) * k;
      paintPeel();
      moving = true;
      if (autoT >= 1) {
        detach(false);
        const [cx, cy] = clampCenter(sw * 0.725, sh * 0.54);
        tfx = cx - ox - W / 2;
        tfy = cy - oy - H / 2;
        tfr = 3.2;
      }
    } else if (phase === "free") {
      const k = 1 - Math.exp(-dt / 0.028);
      fx += (tfx - fx) * k;
      fy += (tfy - fy) * k;
      fr += (tfr - fr) * (1 - Math.exp(-dt / 0.07));
      fs += (tfs - fs) * (1 - Math.exp(-dt / 0.07));
      tfr *= Math.exp(-dt / 0.14);
      paintFree();
      moving = true;
    } else {
      const K = phase === "return" ? 300 : 460;
      const C = phase === "return" ? 32 : 30;
      vfx += (K * (tfx - fx) - C * vfx) * dt;
      vfy += (K * (tfy - fy) - C * vfy) * dt;
      vfs += (620 * (tfs - fs) - 30 * vfs) * dt;
      fx += vfx * dt;
      fy += vfy * dt;
      fs += vfs * dt;
      fr += (tfr - fr) * (1 - Math.exp(-dt / 0.09));
      paintFree();
      const settled = Math.abs(tfx - fx) < 0.15 && Math.abs(tfy - fy) < 0.15 && Math.abs(tfs - fs) < 0.002 && Math.abs(vfx) < 2 && Math.abs(vfy) < 2 && Math.abs(vfs) < 0.05;
      moving = !settled;
      if (settled) {
        fx = tfx;
        fy = tfy;
        fs = tfs;
        fr = tfr;
        paintFree();
        if (phase === "fly") stick();
        else if (phase === "return") {
          setPhase("rest");
          px = py = vx = vy = 0;
          paintPeel();
          moving = true;
        }
      }
    }
    if (moving) kick();
  };
  function kick() {
    if (raf) return;
    if (!last || performance.now() - last > 100) last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const peelFrom = (e: PointerEvent) => {
    const [sx, sy] = toStage(e);
    let dx = sx - ox - W;
    let dy = sy - oy - H;
    dx = -Math.abs(dx);
    dy = -Math.abs(dy);
    const diag = Math.hypot(W, H);
    if (Math.hypot(dx, dy) < 6) {
      dx = Math.min(dx, -6);
      dy = Math.min(dy, -6);
    }
    return { dx, dy, diag };
  };

  handle.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button || (phase !== "rest" && phase !== "peel")) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      dragId = e.pointerId;
      setPhase("peel");
      cancelAnimationFrame(raf);
      raf = 0;
      const { dx, dy } = peelFrom(e);
      px = dx;
      py = dy;
      vx = vy = 0;
      lastPX = px;
      lastT = e.timeStamp;
      paintPeel();
    },
    opts,
  );
  handle.addEventListener(
    "pointermove",
    (e) => {
      if (dragId !== e.pointerId || phase !== "peel") return;
      const { dx, dy, diag } = peelFrom(e);
      const elapsed = Math.max(1, e.timeStamp - lastT) / 1000;
      vx = (dx - lastPX) / elapsed;
      vy = (dy - py) / elapsed;
      lastPX = dx;
      lastT = e.timeStamp;
      px = dx;
      py = dy;
      paintPeel();
      if (Math.hypot(px, py) > diag * DETACH) {
        detach(true);
        free.setPointerCapture(e.pointerId);
        follow(e);
        kick();
      }
    },
    opts,
  );
  const handleUp = (e: PointerEvent) => {
    if (dragId !== e.pointerId || phase !== "peel") return;
    dragId = null;
    setPhase("rest");
    kick();
  };
  handle.addEventListener("pointerup", handleUp, opts);
  handle.addEventListener("pointercancel", handleUp, opts);
  handle.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "touch" || phase !== "rest") return;
    hover = true;
    measure();
    kick();
  }, opts);
  handle.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "touch") return;
    hover = false;
    measure();
    if (phase === "rest") kick();
  }, opts);
  handle.addEventListener("click", (e) => {
    if (e.detail !== 0 || phase !== "rest") return;
    autoPeel();
  }, opts);

  /** While carried, the pointer holds the label by a spot near its lower right. */
  function follow(e: PointerEvent) {
    const [sx, sy] = toStage(e);
    const cx = sx - grabX;
    const cy = sy - grabY;
    tfx = cx - ox - W / 2;
    tfy = cy - oy - H / 2;
    const speed = e.movementX || 0;
    tfr = Math.max(-8, Math.min(8, tfr + speed * 0.09));
  }

  free.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button || phase !== "stuck") return;
      e.preventDefault();
      free.setPointerCapture(e.pointerId);
      dragId = e.pointerId;
      const [sx, sy] = toStage(e);
      grabX = sx - (ox + W / 2 + fx);
      grabY = sy - (oy + H / 2 + fy);
      tfs = 1.045;
      setPhase("free");
      follow(e);
      kick();
    },
    opts,
  );
  free.addEventListener(
    "pointermove",
    (e) => {
      if (dragId === e.pointerId && phase === "free") follow(e);
    },
    opts,
  );
  const drop = (e: PointerEvent) => {
    if (dragId !== e.pointerId || phase !== "free") return;
    dragId = null;
    const [cx, cy] = clampCenter(ox + W / 2 + tfx, oy + H / 2 + tfy);
    tfx = cx - ox - W / 2;
    tfy = cy - oy - H / 2;
    if (reduced) {
      fx = tfx;
      fy = tfy;
      fs = 1;
    }
    vfs = -1.1;
    stick();
  };
  free.addEventListener("pointerup", drop, opts);
  free.addEventListener("pointercancel", drop, opts);
  free.addEventListener(
    "keydown",
    (e) => {
      if (phase !== "stuck") return;
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!step) return;
      e.preventDefault();
      const [cx, cy] = clampCenter(ox + W / 2 + fx + step[0] * KEY_NUDGE, oy + H / 2 + fy + step[1] * KEY_NUDGE);
      fx = tfx = cx - ox - W / 2;
      fy = tfy = cy - oy - H / 2;
      vfx = vfy = 0;
      stuckAt = { x: cx / sw, y: cy / sh };
      on.stick(stuckAt);
      paintFree();
    },
    opts,
  );

  function autoPeel() {
    if (reduced) {
      detach(false);
      const [cx, cy] = clampCenter(sw * 0.725, sh * 0.54);
      fx = tfx = cx - ox - W / 2;
      fy = tfy = cy - oy - H / 2;
      fr = tfr = 3.2;
      fs = tfs = 1;
      paintFree();
      stick();
      free.focus({ preventScroll: true });
      return;
    }
    autoT = 0;
    autoX = px;
    autoY = py;
    setPhase("auto");
    handle.style.visibility = "hidden";
    kick();
  }

  const ro = new ResizeObserver(() => {
    measure();
    if (phase === "rest") {
      px = restX;
      py = restY;
      paintPeel();
    } else if (stuckAt && phase === "stuck") {
      const [cx, cy] = clampCenter(stuckAt.x * sw, stuckAt.y * sh);
      fx = tfx = cx - ox - W / 2;
      fy = tfy = cy - oy - H / 2;
      paintFree();
    }
  });
  ro.observe(root);
  measure();
  px = restX;
  py = restY;
  grabX = W * 0.22;
  grabY = H * 0.2;
  setPhase("rest");
  paintPeel();

  return {
    reset: () => {
      if (phase === "rest") return;
      dragId = null;
      stuckAt = null;
      if (reduced || phase === "peel" || phase === "auto") {
        fx = fy = fr = 0;
        fs = 1;
        setPhase("rest");
        px = restX;
        py = restY;
        vx = vy = 0;
        paintPeel();
        return;
      }
      tfx = tfy = tfr = 0;
      tfs = 1;
      setPhase("return");
      kick();
    },
    dispose: () => {
      ac.abort();
      ro.disconnect();
      cancelAnimationFrame(raf);
    },
  };
}

function Barcode({ code }: { code: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; x < 120; i++) {
    const c = code.charCodeAt(i % code.length) + i * 7;
    const w = 1 + (c % 3);
    bars.push({ x, w });
    x += w + 1 + ((c >> 2) % 3);
  }
  return (
    <svg viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden className="block h-[7.2cqw] w-full">
      {bars.filter((b) => b.x + b.w <= 120).map((b) => (
        <rect key={b.x} x={b.x} width={b.w} height="24" className="ad-peel-bar" />
      ))}
    </svg>
  );
}

function LabelFace({ from, to, address, tracking, weight }: Required<Pick<PeelLabelProps, "from" | "to" | "address" | "tracking" | "weight">>) {
  return (
    <div translate="no" className="ad-peel-face absolute inset-0 grid grid-rows-[auto_1fr_auto] gap-[1.3cqw] overflow-hidden rounded-item p-[2.6cqw] leading-[1.2]">
      <div className="flex items-baseline justify-between gap-[2cqw] text-[2.5cqw]">
        <span className="ad-peel-soft truncate">{from}</span>
        <span className="ad-peel-soft shrink-0 tabular-nums">{weight}</span>
      </div>
      <div className="grid content-start gap-[0.5cqw]">
        <span className="truncate text-[3.9cqw] font-semibold">{to}</span>
        <span className="line-clamp-2 text-[2.6cqw]">{address}</span>
      </div>
      <div className="grid gap-[0.8cqw]">
        <Barcode code={tracking} />
        <span className="text-center text-[2.3cqw] font-medium tabular-nums">{tracking}</span>
      </div>
    </div>
  );
}

export interface PeelLabelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The sender, printed small at the top. */
  from?: string;
  /** The recipient, the biggest thing on the label. */
  to?: string;
  address?: string;
  /** The tracking number under the barcode. */
  tracking?: string;
  weight?: string;
  /** Called when the label lands, with its centre as 0–1 of the box. */
  onStick?: (at: { x: number; y: number }) => void;
}

/**
 * A shipping label on its backing, on a carton. Drag the corner and the paper curls off under your finger; past about
 * half way it comes free and sticks where you drop it. Enter on the corner peels and places it; arrow keys then nudge it.
 */
export function PeelLabel({ from = "Rimba Kemang, Jakarta", to = "Sari Wulandari", address = "Jl. Kaliurang Km 5 No. 14, Sleman, Yogyakarta 55281", tracking = "RK-2041-8836", weight = "1,2 kg", onStick, className, ...props }: PeelLabelProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const engine = React.useRef<ReturnType<typeof attachPeel> | null>(null);
  const stickFn = React.useRef(onStick);
  React.useEffect(() => {
    stickFn.current = onStick;
  });
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const [placed, setPlaced] = React.useState(false);

  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const e = attachPeel(ref.current, reduced, { placed: setPlaced, stick: (at) => stickFn.current?.(at) });
    engine.current = e;
    return () => e.dispose();
  }, [reduced]);

  const face = <LabelFace from={from} to={to} address={address} tracking={tracking} weight={weight} />;

  return (
    <div className={cn("grid w-full min-w-0 gap-3", className)} {...props}>
      <style href="ad-peel-label" precedence="default">
        {CSS}
      </style>
      <div ref={ref} className="ad-peel ad-peel-stage relative aspect-[16/11] w-full select-none overflow-hidden rounded-card shadow-card">
        <div aria-hidden className="ad-peel-tape absolute inset-y-0 left-[71%] w-[13%]" />
        <div aria-hidden className="ad-peel-liner absolute left-[5.5%] top-[50%] aspect-[1/0.74] w-[54%] -translate-y-1/2 rounded-control shadow-card" />
        <div aria-hidden className="ad-peel-patch absolute left-[7.5%] top-[50%] aspect-[1/0.74] w-[50%] -translate-y-1/2 rounded-item" />

        <div data-slot aria-hidden className="ad-peel-slot absolute left-[7.5%] top-[50%] -mt-[18.5%] aspect-[1/0.74] w-[50%]">
          <div data-front className="absolute inset-0 rounded-item">
            {face}
            <div data-shade className="pointer-events-none absolute inset-0 rounded-item" />
          </div>
          <div className="ad-peel-flapwrap pointer-events-none absolute inset-0">
            <div data-flap className="ad-peel-flap absolute inset-0 rounded-item" />
          </div>
        </div>

        <div
          data-free
          role="button"
          tabIndex={-1}
          aria-label={`Label for ${to}. Arrow keys move it.`}
          className="ad-peel-free absolute left-[7.5%] top-[50%] -mt-[18.5%] aspect-[1/0.74] w-[50%] rounded-item"
        >
          <div className="absolute inset-0 rounded-item">{face}</div>
        </div>

        <button
          type="button"
          data-handle
          aria-label="Peel the label off and stick it on the box"
          className="ad-peel-handle absolute left-[57.5%] top-[50%] mt-[18.5%] size-[44px] -translate-x-[62%] -translate-y-[62%] rounded-full"
        />
      </div>
      <div className="flex h-item justify-end">
        <Button variant="ghost" size="sm" onClick={() => engine.current?.reset()} className={cn(TOUCH, !placed && "invisible")} tabIndex={placed ? undefined : -1}>
          <RotateCcw strokeWidth={1.75} />
          Put it back
        </Button>
      </div>
    </div>
  );
}
