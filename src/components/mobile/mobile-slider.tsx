import * as React from "react";
import { cn } from "@/lib/ad";

export interface MobileSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** How the value reads ("20%", "Rp 50.000"). */
  format?: (v: number) => string;
  className?: string;
}

const THUMB = 28;

/**
 * A slider for a thumb, not a cursor: a 44 px tall track you can grab anywhere, a 28 px thumb, and while your finger
 * covers it the value floats above in a dark bubble so you can read it. The thumb follows the finger 1:1, then snaps to
 * the nearest step. Vertical drags still scroll the page. Arrow keys step, Page keys jump by ten steps.
 */
export function MobileSlider({ label, value, onValueChange, min, max, step = 1, format = String, className }: MobileSliderProps) {
  const track = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<number | null>(null);
  const id = React.useId();
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));
  const at = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    const usable = r.width - THUMB * (r.width / track.current!.offsetWidth);
    return min + Math.min(1, Math.max(0, (x - r.left - (THUMB / 2) * (r.width / track.current!.offsetWidth)) / usable)) * (max - min);
  };
  const shown = drag ?? value;
  const p = (shown - min) / (max - min || 1);
  return (
    <div className={cn("grid gap-1", className)}>
      <div className="flex items-center justify-between gap-3 px-1">
        <label id={id} className="text-[13px] text-ink-muted">
          {label}
        </label>
        <span className="text-[15px] font-medium tabular-nums text-ink">{format(snap(shown))}</span>
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-labelledby={id}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onKeyDown={(e) => {
          const big = step * 10;
          const d = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big }[e.key];
          if (e.key === "Home") onValueChange(min);
          else if (e.key === "End") onValueChange(max);
          else if (d) onValueChange(snap(value + d));
          else return;
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDrag(at(e.clientX));
        }}
        onPointerMove={(e) => drag != null && setDrag(at(e.clientX))}
        onPointerUp={() => {
          if (drag == null) return;
          onValueChange(snap(drag));
          setDrag(null);
        }}
        onPointerCancel={() => setDrag(null)}
        className="relative h-touch cursor-pointer touch-pan-y select-none outline-none [-webkit-tap-highlight-color:transparent]"
      >
        <span className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 overflow-hidden rounded-full bg-fill-strong">
          <span className="absolute inset-y-0 left-0 rounded-full bg-on" style={{ width: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${p})` }} />
        </span>
        <span
          aria-hidden
          data-shape="round"
          className={cn("absolute top-1/2 rounded-full bg-thumb shadow-thumb transition-transform duration-[150ms] ease-ad", drag != null && "scale-110")}
          style={{ width: THUMB, height: THUMB, left: `calc((100% - ${THUMB}px) * ${p})`, translate: "0 -50%" }}
        />
        {/* The finger hides the thumb: the value floats above it while dragging. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-full mb-1 -translate-x-1/2 whitespace-nowrap rounded-control bg-tip px-2.5 py-1.5 text-[15px] font-semibold tabular-nums text-tip-ink shadow-raised transition-[opacity,transform] duration-[150ms] ease-ad",
            drag != null ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          )}
          style={{ left: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${p})` }}
        >
          {format(snap(shown))}
        </span>
      </div>
    </div>
  );
}
