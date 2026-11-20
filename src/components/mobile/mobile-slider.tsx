import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

export interface MobileSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** How the value reads ("20%", "Rp 50.000"); the same prop name as the desktop Slider. */
  display?: (v: number) => string;
  /** @deprecated Use `display` (the desktop Slider's name). */
  format?: (v: number) => string;
  className?: string;
}

const THUMB = 28;

/**
 * A slider for a thumb, not a cursor: a 44 px tall track and a 28 px thumb. The value reads in the label row above the
 * track (where the finger doesn't cover it) and updates live while you drag. Touching the thumb grabs it at once;
 * touching the track elsewhere waits for a sideways move (a vertical one scrolls the page and leaves the thumb alone),
 * and a plain tap there glides the thumb to it (150 ms). The thumb follows the finger 1:1, then settles on the nearest
 * step. Arrow keys step, Page keys jump by ten steps; keyboard focus shows as a fill behind the track.
 */
export function MobileSlider({ label, value, onValueChange, min, max, step = 1, display, format, className }: MobileSliderProps) {
  const show = display ?? format ?? String;
  const track = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<number | null>(null);
  const press = React.useRef<{ x: number; y: number; id: number } | null>(null);
  const id = React.useId();
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));
  const at = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    const usable = r.width - THUMB * (r.width / track.current!.offsetWidth);
    return min + Math.min(1, Math.max(0, (x - r.left - (THUMB / 2) * (r.width / track.current!.offsetWidth)) / usable)) * (max - min);
  };
  const shown = drag ?? value;
  // Under the finger the thumb follows 1:1; a tap, a key or the settle after a drag glides instead of jumping.
  const glide = (prop: string) => (drag == null && !prefersReducedMotion() ? `${prop} 150ms var(--ad-ease)` : `${prop} 0s`);
  const p = (shown - min) / (max - min || 1);
  return (
    <div className={cn("grid gap-1", className)}>
      <div className="flex items-center justify-between gap-3 px-1">
        <label id={id} className="text-[13px] text-ink-muted">
          {label}
        </label>
        <span className="text-[15px] font-medium tabular-nums text-ink">{show(snap(shown))}</span>
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-labelledby={id}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={show(value)}
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
          const el = e.currentTarget;
          const r = el.getBoundingClientRect();
          const k = r.width / el.offsetWidth;
          const thumbX = r.left + (THUMB / 2 + (el.offsetWidth - THUMB) * p) * k;
          // On the thumb (or with a mouse): grab now. Elsewhere on the track: wait to see which way the finger goes.
          if (e.pointerType === "mouse" || Math.abs(e.clientX - thumbX) <= 22 * k) {
            el.setPointerCapture(e.pointerId);
            setDrag(at(e.clientX));
          } else press.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        }}
        onPointerMove={(e) => {
          if (drag != null) return setDrag(at(e.clientX));
          const s = press.current;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(dy)) {
            press.current = null;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrag(at(e.clientX));
          } else if (Math.abs(dy) > 4) press.current = null;
        }}
        onPointerUp={(e) => {
          // A plain tap on the track (no move): the thumb jumps there.
          if (press.current) {
            press.current = null;
            return onValueChange(snap(at(e.clientX)));
          }
          if (drag == null) return;
          onValueChange(snap(drag));
          setDrag(null);
        }}
        onPointerCancel={() => ((press.current = null), setDrag(null))}
        className="group/slider relative h-touch cursor-pointer touch-pan-y select-none rounded-control outline-none transition-colors duration-[150ms] focus-visible:bg-fill"
      >
        <span className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 overflow-hidden rounded-full bg-fill-strong">
          <span className="absolute inset-y-0 left-0 rounded-full bg-on" style={{ width: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${p})`, transition: glide("width") }} />
        </span>
        <span
          aria-hidden
          data-shape="round"
          // A real drop under the thumb (shadow-raised): on a white card in light mode the thin halo alone left it nearly
          // invisible. Keyboard focus grows it like a grab does.
          className={cn("absolute top-1/2 rounded-full bg-thumb shadow-raised group-focus-visible/slider:scale-110", drag != null && "scale-110")}
          style={{ width: THUMB, height: THUMB, left: `calc((100% - ${THUMB}px) * ${p})`, translate: "0 -50%", transition: `scale 150ms var(--ad-ease), ${glide("left")}` }}
        />
      </div>
    </div>
  );
}
