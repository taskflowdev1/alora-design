import * as React from "react";
import { RotateCcw } from "react-feather";
import { cn, formatNumber } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

/** Between neighbouring cells as they empty or fill, so a big change runs along the row. */
const CELL_STAGGER = 26;

const CSS = `
.ad-battery-fill { transition: clip-path 220ms var(--ad-ease), background-color 220ms var(--ad-ease); }
.ad-battery[data-dragging="true"] .ad-battery-fill { transition-duration: 90ms, 220ms; transition-delay: 0ms !important; }
@keyframes ad-battery-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.42; } }
.ad-battery-fill[data-breathing="true"] { animation: ad-battery-breathe 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
.ad-battery[data-paused="true"] .ad-battery-fill { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .ad-battery-fill { transition: none; }
  .ad-battery-fill[data-breathing="true"] { animation: none; }
}`;

export interface StockBatteryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  product?: string;
  /** Controlled stock; leave out to let the battery keep its own. */
  value?: number;
  defaultValue?: number;
  /** A full battery, in units. */
  capacity?: number;
  /** At or below this the last cell breathes and Restock becomes the main action. */
  reorderAt?: number;
  /** How many cells the row is drawn with. */
  cells?: number;
  /** Units one press of Sell takes. */
  sellStep?: number;
  onValueChange?: (value: number) => void;
  onRestock?: () => void;
}

/**
 * Remaining stock as a row of rounded cells that drain one at a time. When reorder is due the last cell breathes.
 * Drag along the row or use the arrow keys to set the stock by hand.
 */
export function StockBattery({ product = "Gelas kopi tanah liat", value, defaultValue = 46, capacity = 120, reorderAt = 24, cells = 10, sellStep = 6, onValueChange, onRestock, className, ...props }: StockBatteryProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const stock = Math.max(0, Math.min(capacity, value ?? inner));
  const [start] = React.useState(stock);
  const [dragging, setDragging] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const row = React.useRef<HTMLDivElement>(null);
  const prev = React.useRef(stock);

  const perCell = capacity / cells;
  const due = stock > 0 && stock <= reorderAt;
  const out = stock === 0;
  const lastCell = Math.ceil(stock / perCell) - 1;
  const rising = stock > prev.current;
  // The run starts at the cell where the level was, so a small change never waits behind cells that stay as they are.
  const edge = Math.floor(prev.current / perCell);
  React.useEffect(() => {
    prev.current = stock;
  }, [stock]);

  React.useEffect(() => {
    const el = row.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const set = (next: number) => {
    const v = Math.max(0, Math.min(capacity, Math.round(next)));
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  const fromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    // Snap to a whole cell, so a drag always lands on a full one.
    set(Math.round(f * cells) * perCell);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const to = { ArrowLeft: stock - 1, ArrowDown: stock - 1, ArrowRight: stock + 1, ArrowUp: stock + 1, PageDown: stock - perCell, PageUp: stock + perCell, Home: 0, End: capacity }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    set(to);
  };

  return (
    <Card className={cn("grid min-w-0 gap-4", className)} {...props}>
      <style href="ad-stock-battery" precedence="default">
        {CSS}
      </style>
      <div className="flex items-baseline justify-between gap-3">
        <span translate="no" className="min-w-0 truncate text-title font-medium text-ink">
          {product}
        </span>
        <span className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
          <span className="text-[length:calc(var(--ad-text-number)*1.25)] font-semibold leading-none tracking-[-0.03em] text-ink">{formatNumber(stock)}</span>
          <span className="text-body text-ink-muted">left</span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div
          ref={row}
          role="slider"
          tabIndex={0}
          aria-label={`Stock of ${product}`}
          aria-valuemin={0}
          aria-valuemax={capacity}
          aria-valuenow={stock}
          aria-valuetext={`${formatNumber(stock)} left${due ? ", reorder due" : out ? ", out of stock" : ""}`}
          data-dragging={dragging}
          data-paused={paused}
          onKeyDown={onKey}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            fromPointer(e);
          }}
          onPointerMove={(e) => {
            if (dragging) fromPointer(e);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          className="ad-battery flex min-w-0 flex-1 cursor-ew-resize touch-pan-y select-none gap-1 rounded-control [&:focus-visible>span]:bg-fill-strong"
        >
          {Array.from({ length: cells }, (_, i) => {
            const away = Math.max(0, rising ? i - edge : edge - i);
            const f = Math.max(0, Math.min(1, (stock - i * perCell) / perCell));
            const breathing = due && i === lastCell;
            return (
              <span key={i} className="relative h-16 min-w-0 flex-1 overflow-hidden rounded-item bg-fill">
                <span
                  data-breathing={breathing}
                  className={cn("ad-battery-fill absolute inset-0 rounded-item", due ? (breathing ? "bg-danger" : "bg-chart-3") : "bg-chart-2")}
                  style={{ clipPath: `inset(0 ${((1 - f) * 100).toFixed(2)}% 0 0 round var(--ad-radius-item))`, transitionDelay: `${away * CELL_STAGGER}ms` }}
                />
              </span>
            );
          })}
        </div>
        <span aria-hidden className="h-6 w-1.5 shrink-0 rounded-small bg-fill" />
      </div>
      <div className="flex items-center gap-gap">
        <Button onClick={() => set(stock - sellStep)} disabled={out}>
          Sell {formatNumber(sellStep)}
        </Button>
        <Button
          variant={due || out ? "primary" : "secondary"}
          onClick={() => {
            set(capacity);
            onRestock?.();
          }}
          disabled={stock === capacity}
        >
          Restock
        </Button>
        <span className="flex-1" />
        <Tooltip content="Reset">
          <Button
            size="sm"
            variant="ghost"
            icon
            aria-label="Reset"
            onClick={() => set(start)}
            tabIndex={stock === start ? -1 : undefined}
            className={cn("text-ink-muted transition-[opacity,scale] duration-[160ms]", stock === start && "pointer-events-none opacity-0")}
          >
            <RotateCcw strokeWidth={1.75} />
          </Button>
        </Tooltip>
      </div>
    </Card>
  );
}
