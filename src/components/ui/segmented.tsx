import * as React from "react";
import { cn } from "@/lib/ad";

export interface SegmentedProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: React.ReactNode; "aria-label"?: string }[];
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
 * edge or ring) one nest gap inside it, concentric. Active text is ink and medium, the rest muted and regular.
 */
export function Segmented<T extends string>({ value, onValueChange, options, className, ...aria }: SegmentedProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = React.useState<{ x: number; w: number } | null>(null);
  const index = options.findIndex((o) => o.value === value);
  const animate = React.useRef(false);

  React.useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[index];
      if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    refs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [index, options.length]);
  React.useEffect(() => {
    if (pill) animate.current = true;
  }, [pill]);

  const move = (dir: 1 | -1) => {
    const next = (index + dir + options.length) % options.length;
    onValueChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={aria["aria-label"]}
      className={cn("relative inline-flex h-control shrink-0 items-stretch rounded-control bg-track p-nest", className)}
      onKeyDown={(e) => {
        const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (dir) {
          e.preventDefault();
          move(dir);
        }
      }}
    >
      {pill ? (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-nest top-nest left-0 rounded-item bg-sel shadow-sel",
            animate.current && "transition-[transform,width] duration-[220ms] ease-ad",
          )}
          style={{ width: pill.w, transform: `translateX(${pill.x}px)` }}
        />
      ) : null}
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
            "relative z-10 inline-flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-item px-bubble text-body transition-[color,transform] duration-[150ms] ease-ad active:scale-[0.97] [&_svg]:size-4",
            o.value === value ? "font-medium text-ink focus-visible:bg-fill-strong" : "text-ink-muted hover:text-ink focus-visible:text-ink",
          )}
        >
          {hold(o.label)}
        </button>
      ))}
    </div>
  );
}
