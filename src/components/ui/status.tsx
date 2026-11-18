import * as React from "react";
import { X } from "react-feather";
import { cn } from "@/lib/ad";

/*
 * One padding scale for every bubble: pills, chips, filter bubbles, segments and tabs.
 *   --ad-bubble-x     (12 px at the default padding) for control-height bubbles
 *   --ad-bubble-x-sm  (8 px) for small 24 px pills
 * Siblings in one row never look different.
 */

export type StatusTone = "default" | "muted" | "attention";

const dot: Record<StatusTone, string> = {
  default: "bg-ink",
  muted: "bg-ink-faint",
  attention: "bg-brand",
};

/** Default status: a small dot centred on the text, then the text. For tables and detail rows. */
export function Status({ tone = "default", children, className }: { tone?: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-body text-ink", className)}>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}

export interface PillProps {
  /** "attention" is the one status worth colour; "neutral" sits beside it with the same box. */
  tone?: "attention" | "neutral";
  /** A status dot inside the pill, for neutral pills next to an attention pill. */
  dot?: StatusTone;
  children: React.ReactNode;
  className?: string;
}

/** Soft pill, 24 px, small bubble padding. */
export function Pill({ tone = "attention", dot: d, children, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-item px-bubble-sm text-small font-medium",
        tone === "attention" ? "bg-brand-soft text-brand-soft-ink" : "bg-fill text-ink",
        className,
      )}
    >
      {d ? <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot[d])} /> : null}
      {children}
    </span>
  );
}

/** The label twice in one cell, the hidden copy at medium weight, so turning medium never changes the width. */
const hold = (label: React.ReactNode) => (
  <span className="ad-hold">
    <span aria-hidden>{label}</span>
    <span>{label}</span>
  </span>
);

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** A pressed filter chip shows the grey pill (fill-strong) with its label in ink and medium; nothing moves. */
  selected?: boolean;
  onClick?: () => void;
  /** Shows an × that calls this. */
  onRemove?: () => void;
  size?: "default" | "sm";
}

/** Filter chip: no border. Removable when onRemove is set. Same bubble padding as segments and tabs. */
export function Chip({ selected, onRemove, size = "default", className, children, onClick, ...props }: ChipProps) {
  const height = size === "sm" ? "h-item" : "h-control";
  if (onRemove) {
    return (
      <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-control bg-fill pl-bubble pr-1.5 text-body text-ink", height, className)}>
        <span className="truncate">{children}</span>
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-item text-ink-muted transition-[background-color,transform] duration-[220ms] ease-ad hover:bg-fill-hover active:scale-90"
        >
          <X size={14} />
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-control px-bubble text-body transition-[background-color,transform] duration-[220ms] ease-ad active:scale-[0.96] [&_svg]:size-4",
        height,
        selected ? "bg-fill-strong font-medium text-ink" : "bg-fill/0 text-ink-muted hover:bg-fill hover:text-ink",
        className,
      )}
      {...props}
    >
      {hold(children)}
    </button>
  );
}
