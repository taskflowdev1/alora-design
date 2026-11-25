import * as React from "react";
import { Plus } from "react-feather";
import { cn, formatRp } from "@/lib/ad";

/** How far the dot's centre sits inside its tag, so the tag opens around the dot and the dot stays in place. */
const DOT_INSET = 20;

const STYLES = `
.ad-hs-dot {
  position: absolute; left: 0; top: 0; translate: -50% -50%; width: 24px; height: 24px; display: grid; place-items: center;
  border-radius: 999px; corner-shape: round; background: var(--ad-thumb); color: var(--ad-side); box-shadow: var(--ad-shadow-raised); cursor: pointer;
  transition: scale 160ms var(--ad-ease);
}
.ad-hs-dot::after { content: ""; position: absolute; inset: -10px; border-radius: 999px; corner-shape: round; }
.ad-hs-dot::before {
  content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; corner-shape: round; background: var(--ad-thumb); opacity: 0; pointer-events: none;
  animation: ad-hs-pulse 2600ms cubic-bezier(0.2, 0.7, 0.3, 1) var(--hs-delay, 0ms) infinite;
}
.ad-hs[data-live="false"] .ad-hs-dot::before, .ad-hs[data-any="true"] .ad-hs-dot::before { animation: none; }
.ad-hs-dot svg { transition: rotate 220ms var(--ad-ease); }
.ad-hs-dot[aria-expanded="true"] svg { rotate: 45deg; }
.ad-hs-dot:focus-visible { background: var(--ad-fill-strong); color: var(--ad-ink); }
.ad-hs-dot:active { scale: 0.92; }
@media (hover: hover) { .ad-hs-dot:hover:not(:active) { scale: 1.12; } }
@keyframes ad-hs-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  62%, 100% { transform: scale(2.4); opacity: 0; }
}
.ad-hs-tag {
  --hs-at: ${DOT_INSET}px 50%;
  position: absolute; top: -26px; height: 52px; width: max-content; max-width: 240px; display: flex; flex-direction: column; justify-content: center;
  padding-inline: ${DOT_INSET * 2}px 14px; border-radius: var(--ad-radius-card); background: var(--ad-surface); color: var(--ad-ink);
  box-shadow: var(--ad-shadow-dialog); transform-origin: var(--hs-at); clip-path: circle(12px at var(--hs-at)); opacity: 0; scale: 0.96;
  visibility: hidden; pointer-events: none;
  transition: clip-path 170ms var(--ad-ease), opacity 120ms ease-out 50ms, scale 170ms var(--ad-ease), visibility 0s linear 170ms;
}
.ad-hs-tag[data-side="right"] { left: -${DOT_INSET}px; }
.ad-hs-tag[data-side="left"] { --hs-at: calc(100% - ${DOT_INSET}px) 50%; right: -${DOT_INSET}px; padding-inline: 14px ${DOT_INSET * 2}px; text-align: right; }
.ad-hs-tag[data-open="true"] {
  clip-path: circle(var(--hs-r, 280px) at var(--hs-at)); opacity: 1; scale: 1; visibility: visible; pointer-events: auto;
  transition: clip-path 260ms var(--ad-ease), opacity 70ms ease-out, scale 220ms var(--ad-ease), visibility 0s;
}
.ad-hs[data-snap="true"] .ad-hs-tag, .ad-hs[data-snap="true"] .ad-hs-dot svg { transition: none; }
`;

export interface Hotspot {
  id: string;
  /** Where the dot sits on the photo, in percent from the left. */
  x: number;
  /** Where the dot sits on the photo, in percent from the top. */
  y: number;
  name: string;
  /** In rupiah. */
  price: number;
}

export interface ProductHotspotsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  src: string;
  alt: string;
  spots: Hotspot[];
  /** The photo's width over its height. */
  ratio?: number;
  /** Fires with the spot that opened, or null when the tag closes. */
  onOpenChange?: (spot: Hotspot | null) => void;
}

/**
 * A shoppable photo: pulsing dots that open into small price tags, each growing out of its own dot. One tag at a time;
 * a tap elsewhere or Escape closes it, and the arrow keys walk the dots.
 */
export function ProductHotspots({ src, alt, spots, ratio = 1, onOpenChange, className, ...props }: ProductHotspotsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState<string | null>(null);
  const [snap, setSnap] = React.useState(false);
  const [live, setLive] = React.useState(true);
  const [fit, setFit] = React.useState<Record<string, { side: "left" | "right"; r: number }>>({});

  const choose = React.useCallback(
    (id: string | null, instant = false) => {
      setSnap(instant);
      setOpen(id);
      onOpenChange?.(spots.find((s) => s.id === id) ?? null);
    },
    [onOpenChange, spots],
  );

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const W = root.clientWidth;
      const next: typeof fit = {};
      for (const s of spots) {
        const tag = root.querySelector<HTMLElement>(`[data-hs-tag="${CSS.escape(s.id)}"]`);
        if (!tag) continue;
        const w = tag.offsetWidth;
        const at = (s.x / 100) * W;
        const roomRight = W - at + DOT_INSET;
        const roomLeft = at + DOT_INSET;
        const side = w + 6 <= roomRight ? "right" : w + 6 <= roomLeft ? "left" : roomRight >= roomLeft ? "right" : "left";
        next[s.id] = { side, r: Math.ceil(Math.hypot(w, tag.offsetHeight)) + 32 };
      }
      setFit((old) => (JSON.stringify(old) === JSON.stringify(next) ? old : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [spots]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (open === null) return;
    const away = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.("[data-hs-spot]") || !rootRef.current?.contains(e.target as Node)) choose(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, choose]);

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === "Escape" && open !== null) {
      e.stopPropagation();
      choose(null, true);
      return;
    }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = spots[(i + step + spots.length) % spots.length];
    rootRef.current?.querySelector<HTMLElement>(`[data-hs-dot="${CSS.escape(next.id)}"]`)?.focus();
    if (open !== null) choose(next.id, true);
  };

  return (
    <div ref={rootRef} data-live={live} data-any={open !== null} data-snap={snap} className={cn("ad-hs relative w-full select-none", className)} {...props}>
      <style href="ad-product-hotspots" precedence="default">
        {STYLES}
      </style>
      <div className="overflow-hidden rounded-card bg-fill" style={{ aspectRatio: ratio }}>
        <img src={src} alt={alt} draggable={false} className="block size-full object-cover" />
      </div>
      {spots.map((s, i) => {
        const isOpen = open === s.id;
        const f = fit[s.id];
        const label = `${s.name}, ${formatRp(s.price)}`;
        return (
          <div key={s.id} data-hs-spot="" className="absolute size-0" style={{ left: `${s.x}%`, top: `${s.y}%`, zIndex: isOpen ? 2 : 1 }}>
            <div
              data-hs-tag={s.id}
              data-side={f?.side ?? (s.x > 55 ? "left" : "right")}
              data-open={isOpen}
              aria-hidden={!isOpen}
              style={{ "--hs-r": `${f?.r ?? 280}px` } as React.CSSProperties}
              className="ad-hs-tag"
            >
              <span className="truncate text-body font-medium leading-tight">{s.name}</span>
              <span className="text-body leading-tight tabular-nums text-ink-muted">{formatRp(s.price)}</span>
            </div>
            <button
              type="button"
              data-hs-dot={s.id}
              aria-expanded={isOpen}
              aria-label={label}
              onClick={() => choose(isOpen ? null : s.id)}
              onKeyDown={(e) => onKey(e, i)}
              style={{ "--hs-delay": `${i * 420}ms` } as React.CSSProperties}
              className="ad-hs-dot"
            >
              <Plus size={16} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
