import * as React from "react";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";

const STIFFNESS = 240;
const DAMPING = 25;
const FLY_STIFFNESS = 130;
const FLY_DAMPING = 17;
/** How far a drag must go, as a share of the card's width, or how fast (px/s), to throw the card. */
const THROW_AT = 0.26;
const THROW_SPEED = 650;
/** The pile's resting tilts, per card, so the stack looks dropped rather than aligned. */
const TILTS = [-2.6, 2.2, -1.8, 2.4, -2, 1.6];

const CSS = `
.ad-stack { touch-action: pan-y; }
.ad-stack-card { grid-area: 1 / 1; transform-origin: 50% 50%; will-change: transform; }
.ad-stack-card[data-top="true"] { cursor: grab; }
.ad-stack[data-dragging="true"] .ad-stack-card[data-top="true"] { cursor: grabbing; }
.ad-stack-foot { transition: opacity 160ms var(--ad-ease); }
.ad-stack-card[data-top="false"] .ad-stack-foot { opacity: 0; }
.ad-stack:focus-visible .ad-stack-card[data-top="true"] { background: var(--ad-fill-strong); }
`;

interface Body {
  x: number;
  y: number;
  r: number;
  s: number;
  o: number;
  vx: number;
  vy: number;
  vr: number;
  vs: number;
  tx: number;
  ty: number;
  tr: number;
  ts: number;
  to: number;
  /** Thrown and not tucked yet: the direction, and when it left. */
  fly: number;
  flyAt: number;
}

/** Where a card rests at a depth in the pile. Below the third it waits, hidden, behind the others. */
const rest = (card: number, rank: number) => {
  const depth = Math.min(rank, 2);
  return { y: depth * 8, s: 1 - depth * 0.035, r: rank === 0 ? 0 : TILTS[card % TILTS.length] * (depth === 1 ? 1 : 1.25), o: rank <= 2 ? 1 : 0 };
};

/** Scales about the middle so the tilt stays balanced; the % term keeps each print's bottom edge where `y` puts it. */
const place = (x: number, y: number, r: number, s: number) =>
  `translate3d(${x.toFixed(2)}px, calc(${y.toFixed(2)}px + ${((1 - s) * 50).toFixed(3)}%), 0) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;

const paintCard = (el: HTMLElement, b: Body) => {
  el.style.transform = place(b.x, b.y, b.r, b.s);
  el.style.opacity = b.o.toFixed(3);
};

/**
 * The pile, in one rAF spring loop that only runs while a card is moving and the pile is on screen. A thrown card flies
 * out on top of the others, then drops behind them part way and springs back in, so it visibly tucks under the pile.
 */
function attachStack(root: HTMLElement, cards: HTMLElement[], onTop: (index: number) => void) {
  const n = cards.length;
  let order = cards.map((_, i) => i);
  const bodies: Body[] = cards.map((_, i) => {
    const t = rest(i, i);
    return { x: 0, y: t.y, r: t.r, s: t.s, o: t.o, vx: 0, vy: 0, vr: 0, vs: 0, tx: 0, ty: t.y, tr: t.r, ts: t.s, to: t.o, fly: 0, flyAt: 0 };
  });
  let raf = 0, last = 0, onScreen = true;
  let drag: { id: number; sx: number; sy: number; moved: boolean; samples: { t: number; x: number }[] } | null = null;
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => root.addEventListener(type, fn, { signal: ac.signal });

  const layer = () => {
    order.forEach((c, rank) => {
      const b = bodies[c];
      cards[c].style.zIndex = String(b.fly ? n + 2 : n - rank);
      cards[c].dataset.top = String(rank === 0);
      cards[c].setAttribute("aria-hidden", String(rank !== 0));
    });
  };
  const aim = (c: number) => {
    const b = bodies[c];
    if (b.fly) return;
    const t = rest(c, order.indexOf(c));
    b.tx = 0;
    b.ty = t.y;
    b.tr = t.r;
    b.ts = t.s;
    b.to = t.o;
  };
  const snapAll = () => {
    for (let c = 0; c < n; c++) {
      const b = bodies[c];
      b.fly = 0;
      aim(c);
      b.x = b.tx;
      b.y = b.ty;
      b.r = b.tr;
      b.s = b.ts;
      b.o = b.to;
      b.vx = b.vy = b.vr = b.vs = 0;
      paintCard(cards[c], b);
    }
    layer();
  };

  const frame = (t: number) => {
    raf = 0;
    const dt = Math.min(Math.max(t - last, 1) / 1000, 1 / 30);
    last = t;
    let busy = false;
    const sub = dt / 2;
    for (let c = 0; c < n; c++) {
      const b = bodies[c];
      const dragged = drag && order[0] === c;
      if (b.fly && (Math.abs(b.x) > Math.abs(b.tx) * 0.72 || t - b.flyAt > 300)) {
        b.fly = 0;
        aim(c);
        layer();
      }
      if (dragged) {
        b.s += (b.ts - b.s) * (1 - Math.exp(-dt / 0.05));
        paintCard(cards[c], b);
        busy = true;
        continue;
      }
      const k = b.fly ? FLY_STIFFNESS : STIFFNESS;
      const d = b.fly ? FLY_DAMPING : DAMPING;
      for (let i = 0; i < 2; i++) {
        b.vx += (k * (b.tx - b.x) - d * b.vx) * sub;
        b.vy += (k * (b.ty - b.y) - d * b.vy) * sub;
        b.vr += (k * (b.tr - b.r) - d * b.vr) * sub;
        b.vs += (k * (b.ts - b.s) - d * b.vs) * sub;
        b.x += b.vx * sub;
        b.y += b.vy * sub;
        b.r += b.vr * sub;
        b.s += b.vs * sub;
      }
      b.o += (b.to - b.o) * (1 - Math.exp(-dt / 0.07));
      const settled = !b.fly && Math.abs(b.tx - b.x) < 0.3 && Math.abs(b.ty - b.y) < 0.3 && Math.abs(b.tr - b.r) < 0.05 && Math.abs(b.ts - b.s) < 0.001 && Math.abs(b.vx) < 3 && Math.abs(b.vy) < 3 && Math.abs(b.to - b.o) < 0.01;
      if (settled) {
        b.x = b.tx;
        b.y = b.ty;
        b.r = b.tr;
        b.s = b.ts;
        b.o = b.to;
        b.vx = b.vy = b.vr = b.vs = 0;
      } else busy = true;
      paintCard(cards[c], b);
    }
    if (busy) raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (raf || !onScreen) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  /** Moves the top card to the back of the order and tells the caller who's on top now. */
  const rotate = (by: 1 | -1) => {
    order = by === 1 ? [...order.slice(1), order[0]] : [order[n - 1], ...order.slice(0, n - 1)];
    onTop(order[0]);
  };

  const toss = (dir: number, speed = 0) => {
    if (n < 2) return;
    if (prefersReducedMotion() || !onScreen) {
      rotate(1);
      snapAll();
      return;
    }
    const c = order[0];
    const b = bodies[c];
    const W = root.clientWidth;
    b.fly = dir;
    b.flyAt = performance.now();
    b.tx = dir * W * 0.86;
    b.ty = -W * 0.05;
    b.tr = dir * 15;
    b.ts = 1;
    b.to = 1;
    b.vx = Math.max(-2400, Math.min(2400, speed || dir * 900));
    rotate(1);
    for (let i = 0; i < n; i++) aim(i);
    layer();
    kick();
  };

  on("pointerdown", (e) => {
    if (e.button !== 0 || drag) return;
    const c = order[0];
    if (!cards[c].contains(e.target as Node) || bodies[c].fly) return;
    drag = { id: e.pointerId, sx: e.clientX - bodies[c].x, sy: e.clientY - bodies[c].y / 0.35, moved: false, samples: [{ t: e.timeStamp, x: e.clientX }] };
    root.setPointerCapture(e.pointerId);
    root.dataset.dragging = "true";
    bodies[c].ts = 0.985;
    kick();
  });
  on("pointermove", (e) => {
    if (drag?.id !== e.pointerId) return;
    const b = bodies[order[0]];
    const dx = e.clientX - drag.sx;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx - b.x, e.clientY - drag.sy - b.y / 0.35) < 4) return;
    drag.moved = true;
    b.x = dx;
    b.y = (e.clientY - drag.sy) * 0.35;
    b.r = (dx / root.clientWidth) * 15;
    drag.samples.push({ t: e.timeStamp, x: e.clientX });
    if (drag.samples.length > 6) drag.samples.shift();
    kick();
  });
  const release = (e: PointerEvent) => {
    if (drag?.id !== e.pointerId) return;
    const { moved, samples } = drag;
    drag = null;
    delete root.dataset.dragging;
    const c = order[0];
    const b = bodies[c];
    const first = samples.find((s) => e.timeStamp - s.t < 110) ?? samples[0];
    const span = Math.max(e.timeStamp - first.t, 1);
    const speed = ((samples[samples.length - 1].x - first.x) / span) * 1000;
    b.vx = speed;
    b.vr = (speed / root.clientWidth) * 6;
    const far = Math.abs(b.x) > root.clientWidth * THROW_AT;
    if (e.type === "pointerup" && !moved) toss(1);
    else if (e.type === "pointerup" && (far || Math.abs(speed) > THROW_SPEED)) toss(Math.sign(far ? b.x : speed), speed);
    else if (prefersReducedMotion()) snapAll();
    else {
      aim(c);
      kick();
    }
  };
  on("pointerup", release);
  on("pointercancel", release);

  on("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toss(1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      rotate(1);
      snapAll();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      rotate(-1);
      snapAll();
    } else if (e.key === "Home") {
      e.preventDefault();
      order = cards.map((_, i) => i);
      onTop(0);
      snapAll();
    }
  });

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) return;
    cancelAnimationFrame(raf);
    raf = 0;
    drag = null;
    delete root.dataset.dragging;
    snapAll();
  });
  io.observe(root);
  snapAll();

  return () => {
    ac.abort();
    io.disconnect();
    cancelAnimationFrame(raf);
  };
}

export interface StackPhoto {
  id: string;
  src: string;
  alt: string;
  name: string;
  /** In rupiah. */
  price: number;
}

export interface PhotoStackProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  photos: StackPhoto[];
  /** Fires with the photo that came to the top. */
  onChange?: (photo: StackPhoto, index: number) => void;
}

/**
 * A pile of product prints. Swipe the top one and it flies off with a tilt, then tucks under the pile while the next
 * rises. A click, Enter or Space throws it too; the arrow keys step through at once.
 */
export function PhotoStack({ photos, onChange, className, ...props }: PhotoStackProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const changeRef = React.useRef(onChange);
  const photosRef = React.useRef(photos);
  const [top, setTop] = React.useState(0);
  React.useEffect(() => {
    changeRef.current = onChange;
    photosRef.current = photos;
  });
  const ids = photos.map((p) => p.id).join("|");

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLElement>("[data-stack-card]")];
    return attachStack(root, cards, (i) => {
      setTop(i);
      changeRef.current?.(photosRef.current[i], i);
    });
  }, [ids]);

  const current = photos[top] ?? photos[0];

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="carousel"
      aria-label="Product photos"
      tabIndex={0}
      className={cn("ad-stack grid w-full grid-cols-1 select-none px-2 pb-[26px] pt-[4.5px]", className)}
      {...props}
    >
      <style href="ad-photo-stack" precedence="default">
        {CSS}
      </style>
      {photos.map((p, i) => {
        const t = rest(i, i);
        return (
          <div
            key={p.id}
            data-stack-card=""
            data-top={i === 0}
            aria-hidden={i !== 0}
            className="ad-stack-card grid grid-cols-1 rounded-card bg-fill p-[calc(var(--ad-nest)*2)] shadow-raised"
            style={{ transform: place(0, t.y, t.r, t.s), opacity: t.o, zIndex: photos.length - i }}
          >
            <div className="aspect-[4/5] overflow-hidden rounded-item bg-fill-strong">
              <img src={p.src} alt={p.alt} draggable={false} className="pointer-events-none block size-full object-cover" />
            </div>
            <div className="ad-stack-foot flex items-baseline justify-between gap-4 px-[calc(var(--ad-nest)*2)] pt-[calc(var(--ad-nest)*2)] text-body">
              <span className="min-w-0 truncate font-medium">{p.name}</span>
              <span className="shrink-0 tabular-nums text-ink-muted">{formatRp(p.price)}</span>
            </div>
          </div>
        );
      })}
      <span aria-live="polite" className="sr-only">
        {current ? `${current.name}, ${formatRp(current.price)}` : ""}
      </span>
    </div>
  );
}
