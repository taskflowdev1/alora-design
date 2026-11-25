import * as React from "react";
import { cn } from "@/lib/ad";
import { useCenterSelected, useEdgeFade } from "@/lib/ad-hooks";
import { HoldLabel, SlidingPill } from "@/components/ui/sliding-pill";

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
  useEdgeFade(track, { axis: "x", size: 24 });
  useCenterSelected(track, '[aria-pressed="true"]', value);
  return (
    <div
      ref={track}
      role="group"
      aria-label={aria["aria-label"]}
      className={cn("-mx-pad flex overflow-x-auto overscroll-x-contain px-pad [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
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
                "relative flex h-touch min-w-touch shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-control px-3.5 text-[15px] ad-press active:scale-[0.97] data-pressed:scale-[0.97]",
                on ? "font-medium text-ink focus-visible:bg-ink-muted focus-visible:text-surface" : "text-ink-muted focus-visible:bg-fill focus-visible:text-ink",
              )}
            >
              <HoldLabel>{o.label}</HoldLabel>
              {o.count != null ? <span className={cn("font-normal tabular-nums text-ink-muted", on && "in-focus-visible:text-surface")}>{o.count}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
