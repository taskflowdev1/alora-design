import * as React from "react";
import { cn } from "@/lib/ad";
import { SlidingPill } from "@/components/ui/sliding-pill";

export interface FilterChipOption<T extends string = string> {
  value: T;
  label: string;
  /** A count after the label, muted ("To pack 12"). */
  count?: number;
}

export interface MobileFilterChipsProps<T extends string> {
  value: T | null;
  onValueChange: (value: T) => void;
  options: FilterChipOption<T>[];
  "aria-label": string;
  className?: string;
}

/**
 * Quick filters in one row that scrolls sideways (no wrapping, no scrollbar). One chip is on: a grey pill slides to the
 * chip you tap, the row scrolls it into view, and the edges fade only on the side that has more. 44 px chips.
 */
export function MobileFilterChips<T extends string>({ value, onValueChange, options, className, ...aria }: MobileFilterChipsProps<T>) {
  const track = React.useRef<HTMLDivElement>(null);
  const [fade, setFade] = React.useState({ l: false, r: false });
  const measure = React.useCallback(() => {
    const el = track.current;
    if (!el) return;
    const l = el.scrollLeft > 2;
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setFade((f) => (f.l === l && f.r === r ? f : { l, r }));
  }, []);
  React.useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [measure]);
  // Bring the chosen chip into view (centre it when it can be), without moving the page.
  React.useEffect(() => {
    const el = track.current;
    const on = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !on) return;
    const left = on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [value]);
  const mask = `linear-gradient(to right, ${fade.l ? "transparent" : "#000"}, #000 24px, #000 calc(100% - 24px), ${fade.r ? "transparent" : "#000"})`; // grey-ok: mask stops, not paint
  return (
    <div
      ref={track}
      role="group"
      aria-label={aria["aria-label"]}
      onScroll={measure}
      className={cn("-mx-pad flex overflow-x-auto overscroll-x-contain px-pad [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <div className="relative flex shrink-0 gap-1">
        <SlidingPill selector='[aria-pressed="true"]' className="rounded-control bg-fill-strong" />
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onValueChange(o.value)}
              className={cn(
                "relative flex h-touch min-w-touch shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-control px-3.5 text-[15px] [-webkit-tap-highlight-color:transparent] transition-[color,transform] duration-[150ms] ease-ad active:scale-[0.96]",
                on ? "font-medium text-ink" : "text-ink-muted",
              )}
            >
              {/* Bold and regular take the same width, so nothing shifts when the choice moves. */}
              <span className="ad-hold">
                <span aria-hidden>{o.label}</span>
                <span>{o.label}</span>
              </span>
              {o.count != null ? <span className="font-normal tabular-nums text-ink-muted">{o.count}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
