import * as React from "react";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";

const STIFFNESS = 300;
const DAMPING = 32; // just under critical (34.6): a soft landing, no wobble
const RATIO = 53.98 / 85.6;
/** As shares of the width: a resting card's visible strip, the strip of a card waiting while one is out, the pocket. */
const PEEK = 0.094;
const TIGHT = 0.028;
const POCKET = 0.27;
const CLEAR = 0.02;
/** Past the top the card moves at this share of the finger. */
const RUBBER = 0.22;
/** Px per ms. */
const FLICK = 0.7;
/** How far the cards' layer reaches past the stage for their shadows (a phone's page gutter), and the fade at its cut. */
const BLEED = 16;
const CUT_FADE = 28;

/*
 * The cards keep their z-order the whole time and live behind the pocket: pulling one out reveals it from behind the
 * cards in front, and tucking it back slides it behind them again, so nothing ever swaps layers mid-flight. The cards'
 * layer fades out behind the middle of the pocket, so a card taller than the pocket never shows under it and its shadow
 * has no hard end beside the pocket.
 */
const CSS = `
.ad-wallet { container-type: inline-size; }
.ad-wallet-layer { position: absolute; inset: -${BLEED}px -${BLEED}px 0; pointer-events: none; }
.ad-wallet-card { top: ${BLEED}px; left: ${BLEED}px; right: ${BLEED}px; height: calc(100cqw * ${RATIO.toFixed(5)}); pointer-events: auto; touch-action: pan-x; cursor: grab; }
.ad-wallet-card:active { cursor: grabbing; }
.ad-wallet-face { isolation: isolate; color: var(--ad-side-ink); }
.ad-wallet-face[data-tone="graphite"] { background: linear-gradient(140deg in oklab, var(--ad-side-fill-strong), var(--ad-side)); }
.ad-wallet-face[data-tone="accent"] { background: linear-gradient(140deg in oklab, var(--ad-brand-6), var(--ad-brand-8)); }
/* Two more finishes from the same accent ramp: no colour outside black, white and the accent. */
.ad-wallet-face[data-tone="deep"] { background: linear-gradient(140deg in oklab, var(--ad-brand-8), var(--ad-brand-9, var(--ad-brand-8))); }
.ad-wallet-face[data-tone="ink"] { background: linear-gradient(140deg in oklab, var(--ad-side-fill), var(--ad-side)); }
/* grey-ok: a soft light across the card, and the keyboard focus fill on it */
.ad-wallet-sheen { background: linear-gradient(115deg in oklab, rgb(255 255 255 / 0.1), transparent 46%); }
.ad-wallet-focus { background: rgb(255 255 255 / 0.1); opacity: 0; } /* grey-ok */
.ad-wallet-card:focus-visible .ad-wallet-focus { opacity: 1; }
`;

export interface WalletCard {
  id: string;
  /** Shown on the strip that peeks out of the stack. */
  name: string;
  last4: string;
  holder: string;
  /** Printed as given, `MM/YY`. */
  expiry: string;
  /** Spent this month, in rupiah; the pocket shows it while the card is out. */
  spent: number;
  tone?: "graphite" | "accent" | "deep" | "ink";
}

const DEFAULT_CARDS: WalletCard[] = [
  { id: "ops", name: "Operasional", last4: "4410", holder: "RIZKY HARTONO", expiry: "08/29", spent: 18420000, tone: "graphite" },
  { id: "stok", name: "Belanja stok", last4: "0926", holder: "RUDI SANTOSO", expiry: "03/30", spent: 26750000, tone: "deep" },
  { id: "iklan", name: "Iklan", last4: "7312", holder: "DEWI LESTARI", expiry: "11/28", spent: 4310000, tone: "ink" },
  { id: "kemang", name: "Rimba Kemang", last4: "5581", holder: "RIZKY HARTONO", expiry: "06/31", spent: 2875000, tone: "accent" },
];

export interface CardWalletStackProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  cards?: WalletCard[];
  /** The pocket's title while every card is in. */
  label?: string;
  /** The id of a card that starts out of the pocket. */
  defaultOpen?: string | null;
  onOpenChange?: (id: string | null) => void;
}

interface Geometry {
  stage: number;
  rest: number[];
  restPocket: number;
  /** Where each card goes when card `k` is out. */
  openY: (k: number, i: number) => number;
  openPocket: number;
}

/** The stage's height over its width: a whole card, the waiting strips above the pocket, the pocket. */
const stageRatio = (n: number) => RATIO + CLEAR + Math.max(0, n - 1) * TIGHT + POCKET;

function geometry(w: number, n: number): Geometry {
  const pocketH = w * POCKET;
  const peek = w * PEEK;
  const tight = w * TIGHT;
  const stage = w * stageRatio(n);
  // Resting, the stack sits a little above the middle of the room it keeps for a card that's out.
  const restTop = Math.max(0, (stage - (n * peek + pocketH)) * 0.36);
  const openPocket = stage - pocketH;
  return {
    stage,
    rest: Array.from({ length: n }, (_, i) => restTop + i * peek),
    restPocket: restTop + n * peek,
    openPocket,
    openY: (k, i) => {
      if (i === k) return 0;
      const rank = i < k ? i : i - 1;
      return openPocket - (n - 1 - rank) * tight;
    },
  };
}

/** A made-up network: three rising slanted bars. */
const NetworkMark = () => (
  <svg viewBox="0 0 36 24" fill="currentColor" aria-hidden className="block h-auto w-[9cqw] shrink-0">
    <path d="M1 23 6 13h6L7 23zM11 23 19 7h6L17 23zM21 23 32 1h3.2L25 23z" />
  </svg>
);

/**
 * Company cards resting in a pocket. Drag one up and it comes out on a spring while the others close the gap; flick it
 * down and it tucks back. A tap, Enter or Space does the same, the arrow keys move between cards and Esc puts it away.
 */
export function CardWalletStack({ cards = DEFAULT_CARDS, label = "Rimba Kemang", defaultOpen = null, onOpenChange, className, ...props }: CardWalletStackProps) {
  const n = cards.length;
  const [openId, setOpenId] = React.useState<string | null>(defaultOpen);
  const [focusId, setFocusId] = React.useState(cards[0]?.id);
  const openIndex = cards.findIndex((c) => c.id === openId);

  const stage = React.useRef<HTMLDivElement>(null);
  const layer = React.useRef<HTMLDivElement>(null);
  const pocket = React.useRef<HTMLDivElement>(null);
  const els = React.useRef<(HTMLButtonElement | null)[]>([]);
  const m = React.useRef({
    geo: null as Geometry | null,
    y: [] as number[],
    v: [] as number[],
    py: 0,
    pv: 0,
    open: -1,
    raf: 0,
    onScreen: true,
    drag: null as null | { id: number; i: number; sy: number; y0: number; travel: number; moved: boolean; lastY: number; lastT: number; vy: number; pull: number },
  });

  const paint = React.useCallback(() => {
    const a = m.current;
    const g = a.geo;
    if (!g) return;
    a.y.forEach((y, i) => {
      const el = els.current[i];
      if (el) el.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
    });
    if (pocket.current) pocket.current.style.transform = `translate3d(0,${a.py.toFixed(2)}px,0)`;
    // Fade the cards out behind the middle of the pocket, wherever it is now.
    if (layer.current) {
      const cut = a.py + (g.stage - g.openPocket) / 2 + BLEED;
      layer.current.style.maskImage = `linear-gradient(to bottom, #000 ${(cut - CUT_FADE).toFixed(1)}px, transparent ${cut.toFixed(1)}px)`;
    }
  }, []);

  /** Where everything is headed: `pull` is how far card `k` is out, 0 to 1. */
  const targets = React.useCallback((k: number, pull: number) => {
    const g = m.current.geo!;
    const to = g.rest.map((r, i) => (k < 0 ? r : r + (g.openY(k, i) - r) * pull));
    return { to, pocket: g.restPocket + (g.openPocket - g.restPocket) * (k < 0 ? 0 : pull) };
  }, []);

  const run = React.useCallback(() => {
    const a = m.current;
    if (a.raf || !a.onScreen || !a.geo) return;
    let last = performance.now();
    const frame = (t: number) => {
      a.raf = 0;
      const dt = Math.min(Math.max(t - last, 1) / 1000, 1 / 30);
      last = t;
      const d = a.drag;
      const { to, pocket: toPocket } = d?.moved ? targets(d.i, d.pull) : targets(a.open, 1);
      let busy = false;
      const step = (pos: number, vel: number, target: number) => {
        const nv = vel + (STIFFNESS * (target - pos) - DAMPING * vel) * dt;
        const np = pos + nv * dt;
        if (Math.abs(target - np) < 0.15 && Math.abs(nv) < 2) return [target, 0];
        busy = true;
        return [np, nv];
      };
      a.y.forEach((y, i) => {
        if (d?.moved && d.i === i) return;
        [a.y[i], a.v[i]] = step(y, a.v[i], to[i]);
      });
      [a.py, a.pv] = step(a.py, a.pv, toPocket);
      paint();
      if (busy || d?.moved) a.raf = requestAnimationFrame(frame);
    };
    a.raf = requestAnimationFrame(frame);
  }, [paint, targets]);

  /** Jumps everything to where it belongs (first layout, a resize, reduced motion). */
  const place = React.useCallback(() => {
    const a = m.current;
    if (!a.geo) return;
    const { to, pocket: p } = targets(a.open, 1);
    a.y = to.slice();
    a.v = to.map(() => 0);
    a.py = p;
    a.pv = 0;
    paint();
  }, [paint, targets]);

  React.useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const a = m.current;
    const measure = () => {
      const w = el.clientWidth;
      if (!w) return;
      a.geo = geometry(w, n);
      a.open = cards.findIndex((c) => c.id === openId);
      cancelAnimationFrame(a.raf);
      a.raf = 0;
      place();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      a.onScreen = entry.isIntersecting;
      if (a.onScreen) return;
      cancelAnimationFrame(a.raf);
      a.raf = 0;
      if (!a.drag) place();
    });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(a.raf);
      a.raf = 0;
    };
    // Geometry only depends on the count; the open card is read when it changes below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, place]);

  const setOpen = (i: number) => {
    const a = m.current;
    a.open = i;
    const id = i < 0 ? null : cards[i].id;
    if (id !== openId) {
      setOpenId(id);
      onOpenChange?.(id);
    }
    if (prefersReducedMotion()) {
      cancelAnimationFrame(a.raf);
      a.raf = 0;
      place();
    } else run();
  };

  const onPointerDown = (i: number) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const a = m.current;
    if (!a.geo) return;
    // Only the card that's out, or any card while none is, can be dragged; a waiting card just takes a tap.
    const draggable = a.open === i || a.open < 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    // A travel of 0 marks a press that can only end as a tap.
    const travel = draggable ? Math.max(a.geo.rest[i], a.geo.rest[n - 1] * 0.6, 1) : 0;
    a.drag = { id: e.pointerId, i, sy: e.clientY, y0: a.y[i], travel, moved: false, lastY: e.clientY, lastT: e.timeStamp, vy: 0, pull: a.open === i ? 1 : 0 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const a = m.current;
    const d = a.drag;
    if (d?.id !== e.pointerId || !d.travel) return;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.abs(dy) < 4) return;
    d.moved = true;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) {
      d.vy = d.vy * 0.6 + ((e.clientY - d.lastY) / dt) * 0.4;
      d.lastY = e.clientY;
      d.lastT = e.timeStamp;
    }
    const isOut = a.open === d.i;
    const home = isOut ? 0 : a.geo!.rest[d.i];
    const raw = d.y0 + dy;
    if (isOut) {
      // Out: down follows the finger and starts tucking it back; up is a rubber band.
      a.y[d.i] = raw < home ? home + (raw - home) * RUBBER : raw;
      d.pull = 1 - Math.max(0, Math.min(1, (raw - home) / d.travel));
    } else {
      // In: up follows the finger, past the top on a rubber band; down barely gives.
      a.y[d.i] = raw > home ? home + (raw - home) * RUBBER : raw < 0 ? raw * RUBBER : raw;
      d.pull = Math.max(0, Math.min(1, (home - raw) / d.travel));
    }
    paint();
    run();
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const a = m.current;
    const d = a.drag;
    if (d?.id !== e.pointerId) return;
    a.drag = null;
    if (e.type !== "pointerup") {
      if (d.moved) run();
      return;
    }
    if (!d.moved) {
      setFocusId(cards[d.i].id);
      setOpen(a.open === d.i ? -1 : d.i);
      return;
    }
    const vy = e.timeStamp - d.lastT > 90 ? 0 : d.vy;
    a.v[d.i] = vy * 1000;
    const isOut = a.open === d.i;
    const stays = isOut ? !(vy > FLICK || d.pull < 0.62) : vy < -FLICK || d.pull > 0.38;
    setOpen(isOut ? (stays ? d.i : -1) : stays ? d.i : -1);
  };

  const onKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape" && m.current.open >= 0) {
      e.preventDefault();
      setOpen(-1);
      return;
    }
    const to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(n - 1, to));
    setFocusId(cards[next].id);
    els.current[next]?.focus();
  };

  const out = openIndex >= 0 ? cards[openIndex] : null;
  const total = cards.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className={cn("ad-wallet w-full min-w-0", className)} {...props}>
      <style href="ad-card-wallet-stack" precedence="default">
        {CSS}
      </style>
      <div ref={stage} className="relative" style={{ height: `calc(100cqw * ${stageRatio(n).toFixed(5)})` }} role="group" aria-label="Cards">
        <div ref={layer} className="ad-wallet-layer">
          {cards.map((c, i) => (
            <button
              key={c.id}
              ref={(el) => {
                els.current[i] = el;
              }}
              type="button"
              tabIndex={(focusId ?? cards[0]?.id) === c.id ? 0 : -1}
              aria-expanded={openId === c.id}
              aria-label={`${c.name}, card ending in ${c.last4}`}
              translate="no"
              onPointerDown={onPointerDown(i)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onKeyDown={onKeyDown(i)}
              onFocus={() => setFocusId(c.id)}
              // A pointer already acted on release; only the keyboard and assistive tech click with detail 0.
              onClick={(e) => e.detail === 0 && setOpen(m.current.open === i ? -1 : i)}
              className="ad-wallet-card absolute block select-none text-left"
              style={{ zIndex: i + 1 }}
            >
              <span data-tone={c.tone ?? "graphite"} className="ad-wallet-face ad-press relative grid size-full grid-rows-[auto_1fr_auto_auto] overflow-hidden rounded-card px-[4.6cqw] pb-[4.6cqw] pt-[3.1cqw] shadow-raised active:scale-[0.99]">
                <span aria-hidden className="ad-wallet-sheen pointer-events-none absolute inset-0 -z-10" />
                <span aria-hidden className="ad-wallet-focus pointer-events-none absolute inset-0 -z-10" />
                <span className="flex items-center justify-between gap-3 text-[3.9cqw] font-medium leading-none tabular-nums">
                  <span className="min-w-0 truncate">{c.name}</span>
                  <span className="shrink-0">•• {c.last4}</span>
                </span>
                <span />
                <span className="flex justify-between whitespace-nowrap text-[5.6cqw] font-medium leading-none tabular-nums">
                  <span>••••</span>
                  <span>••••</span>
                  <span>••••</span>
                  <span>{c.last4}</span>
                </span>
                <span className="mt-[4.4cqw] flex items-end gap-[4cqw] text-[3.4cqw] font-medium leading-none tabular-nums">
                  <span className="min-w-0 flex-1 truncate">{c.holder}</span>
                  <span className="shrink-0">{c.expiry}</span>
                  <NetworkMark />
                </span>
              </span>
            </button>
          ))}
        </div>
        <div ref={pocket} className="absolute inset-x-0 top-0 z-20 grid h-[27cqw] content-between rounded-card bg-surface p-[4.6cqw] shadow-raised">
          <span translate="no" className="min-w-0 truncate text-body text-ink-muted">
            {out ? out.name : label}
          </span>
          <span className="whitespace-nowrap text-heading font-semibold tabular-nums tracking-[-0.02em] text-ink">{formatRp(out ? out.spent : total)}</span>
        </div>
      </div>
    </div>
  );
}
