import * as React from "react";
import { cn } from "@/lib/ad";
import { SlidingPill } from "@/components/ui/sliding-pill";

export interface SegmentedProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: React.ReactNode; "aria-label"?: string }[];
  /** "touch": 44 px options and 15 px labels for phones; with `className="w-full"` the options share the width. */
  size?: "default" | "touch";
  className?: string;
  "aria-label"?: string;
}

/** The label twice in one cell, the hidden copy at medium weight, so turning medium never changes the width. */
const hold = (label: React.ReactNode) => (
  <span className="ad-hold">
    <span aria-hidden>{label}</span>
    <span>{label}</span>
  </span>
);

/**
 * Raised pill on a grey track: the track sits at the control radius, the sliding pill (sel + shadow-sel, a soft drop, no
 * edge or ring) one nest gap inside it, concentric; a new choice slides the pill over on a spring (SlidingPill), and keyboard focus darkens it a notch. Active text is ink and medium, the rest muted and regular.
 */
export function Segmented<T extends string>({ value, onValueChange, options, size = "default", className, ...aria }: SegmentedProps<T>) {
  const touch = size === "touch";
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const index = options.findIndex((o) => o.value === value);

  const move = (dir: 1 | -1) => {
    const next = (index + dir + options.length) % options.length;
    onValueChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={aria["aria-label"]}
      className={cn("relative inline-flex shrink-0 items-stretch rounded-control bg-track p-nest", touch ? "h-[calc(var(--ad-touch-h)+var(--ad-nest)*2)] touch-manipulation" : "h-control", className)}
      onKeyDown={(e) => {
        const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (dir) {
          e.preventDefault();
          move(dir);
        }
      }}
    >
      <SlidingPill selector='[aria-checked="true"]' className="rounded-item bg-sel shadow-sel" />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o["aria-label"]}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onValueChange(o.value)}
          className={cn(
            "relative z-10 inline-flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-item px-bubble transition-[color,transform] duration-[150ms] ease-ad active:scale-[0.97] [&_svg]:size-[16px]",
            touch ? "min-w-touch flex-1 text-[15px]" : "text-body",
            o.value === value ? "font-medium text-ink" : "text-ink-muted focus-visible:text-ink [@media(hover:hover)]:hover:text-ink",
          )}
        >
          {hold(o.label)}
        </button>
      ))}
    </div>
  );
}
