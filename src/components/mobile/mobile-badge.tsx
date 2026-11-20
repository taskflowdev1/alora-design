import * as React from "react";
import { cn } from "@/lib/ad";

export interface CountBadgeProps {
  /** The count. 0 or less hides it (no "0" badge). */
  count?: number;
  /** Above this it reads "99+". */
  max?: number;
  /** A small dot instead of a number (something new, no count worth showing). */
  dot?: boolean;
  /** "ink" (default): high contrast on a surface. "soft": a quieter grey for counts that need no attention. */
  tone?: "ink" | "soft";
  className?: string;
  /** Read out with the count, e.g. "unread". */
  "aria-label"?: string;
}

/**
 * A count on a tab, an icon or a row: a pill as wide as its digits (one digit stays a circle), tabular figures, ink on
 * the surface (never the accent, never red). It pops in once when it appears and ticks when the count changes, so a new
 * order is felt without anything else moving. Hidden at 0.
 */
export function CountBadge({ count = 0, max = 99, dot, tone = "ink", className, ...aria }: CountBadgeProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const last = React.useRef(count);
  React.useEffect(() => {
    const prev = last.current;
    last.current = count;
    if (prev === count || !ref.current || count <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // First appearance grows in from small; a change ticks.
    if (prev <= 0) ref.current.animate([{ transform: "scale(0.6)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 200, easing: "cubic-bezier(0.32, 0.72, 0, 1)" });
    else ref.current.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(0.32, 0.72, 0, 1)" });
  }, [count]);
  if (!dot && count <= 0) return null;
  const toneClass = tone === "ink" ? "bg-on text-on-ink" : "bg-fill-strong text-ink";
  if (dot) return <span ref={ref} role="status" aria-label={aria["aria-label"] ?? "New"} data-shape="round" className={cn("inline-block size-[8px] shrink-0 rounded-full", toneClass, className)} />;
  const text = count > max ? `${max}+` : String(count);
  return (
    <span
      ref={ref}
      data-shape="round"
      aria-label={aria["aria-label"] ? `${count} ${aria["aria-label"]}` : undefined}
      className={cn("inline-grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full px-[5px] text-[11px] font-semibold leading-none tabular-nums", toneClass, className)}
    >
      {text}
    </span>
  );
}

/** Puts a CountBadge on the top right corner of an icon or avatar without changing its size. */
export function BadgeAnchor({ badge, children, className }: { badge: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-grid", className)}>
      {children}
      <span className="absolute -right-2 -top-1.5 flex">{badge}</span>
    </span>
  );
}
