import * as React from "react";
import { cn } from "@/lib/ad";

export interface ResizableProps {
  /** Two panes, left/right (or top/bottom). */
  children: [React.ReactNode, React.ReactNode];
  direction?: "horizontal" | "vertical";
  /** First pane's share, 0 to 100. */
  defaultSize?: number;
  min?: number;
  max?: number;
  onResize?: (size: number) => void;
  className?: string;
}

/**
 * Two panes with a handle between them: drag it, or focus it and use the arrow keys (Home/End jump to the limits).
 * The handle is a small grip in the gap, not a line; it shows the hover fill while you hold it.
 */
export function Resizable({ children, direction = "horizontal", defaultSize = 50, min = 20, max = 80, onResize, className }: ResizableProps) {
  const [size, setSize] = React.useState(defaultSize);
  const [dragging, setDragging] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);
  const h = direction === "horizontal";
  const set = (v: number) => {
    const n = Math.round(Math.min(max, Math.max(min, v)) * 10) / 10;
    setSize(n);
    onResize?.(n);
  };
  const fromPointer = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    set(h ? ((e.clientX - r.left) / r.width) * 100 : ((e.clientY - r.top) / r.height) * 100);
  };
  return (
    <div ref={box} className={cn("flex min-h-0 min-w-0", h ? "flex-row" : "flex-col", dragging && "select-none", className)}>
      <div className="min-h-0 min-w-0 overflow-hidden" style={{ flexBasis: `${size}%`, flexGrow: 0, flexShrink: 0 }}>
        {children[0]}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-orientation={h ? "vertical" : "horizontal"}
        aria-valuenow={size}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label="Resize"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }}
        onPointerMove={(e) => dragging && fromPointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 2;
          const k = { ArrowLeft: -step, ArrowUp: -step, ArrowRight: step, ArrowDown: step }[e.key];
          if (k) {
            e.preventDefault();
            set(size + k);
          }
          if (e.key === "Home") {
            e.preventDefault();
            set(min);
          }
          if (e.key === "End") {
            e.preventDefault();
            set(max);
          }
        }}
        className={cn(
          "group relative z-10 grid shrink-0 touch-none place-items-center rounded-full transition-colors duration-[160ms] ease-ad hover:bg-fill focus-visible:bg-fill",
          h ? "w-3 cursor-col-resize" : "h-3 cursor-row-resize",
          dragging && "bg-fill",
        )}
      >
        <span aria-hidden className={cn("rounded-full bg-fill-strong transition-colors duration-[160ms] group-hover:bg-ink-faint", dragging && "bg-ink-faint", h ? "h-8 w-1" : "h-1 w-8")} />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children[1]}</div>
    </div>
  );
}
