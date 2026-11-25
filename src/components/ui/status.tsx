import * as React from "react";
import { X } from "react-feather";
import { cn } from "@/lib/ad";
import { HoldLabel, SlidingPill } from "@/components/ui/sliding-pill";

export type StatusTone = "default" | "muted" | "attention";

const dot: Record<StatusTone, string> = {
  default: "bg-ink",
  muted: "bg-ink-muted",
  attention: "bg-brand",
};

/** Default status: a small dot centred on the text, then the text. For tables and detail rows. */
export function Status({ tone = "default", children, className }: { tone?: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap align-middle text-body text-ink", className)}>
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

/** Soft pill, small (h-6, about 20 px at the 13 px body), small bubble padding. */
export function Pill({ tone = "attention", dot: d, children, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-item px-bubble-sm align-middle text-small font-medium",
        tone === "attention" ? "bg-brand-soft text-brand-soft-ink" : "bg-fill text-ink",
        className,
      )}
    >
      {d ? <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot[d])} /> : null}
      {children}
    </span>
  );
}

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
  const sliding = React.useContext(InChipGroup);
  const height = size === "sm" ? "h-item" : "h-control";
  if (onRemove) {
    return (
      <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-control bg-fill pl-bubble pr-1.5 text-body text-ink", height, className)}>
        <span className="truncate">{children}</span>
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="relative grid size-[20px] shrink-0 cursor-pointer place-items-center rounded-item text-ink-muted ad-press after:absolute after:-inset-[2px] hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.97]"
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
        "relative inline-flex shrink-0 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-control px-bubble text-body ad-press active:scale-[0.97] [&_svg]:size-[16px]",
        height,
        selected
          ?
            cn(
              "font-medium text-ink",
              !sliding &&
                "bg-fill-strong focus-visible:brightness-[0.88] dark:focus-visible:brightness-[0.78]",
            )
          : "bg-transparent text-ink-muted hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink",
        className,
      )}
      {...props}
    >
      <HoldLabel>{children}</HoldLabel>
    </button>
  );
}

const InChipGroup = React.createContext(false);

/**
 * Chips where exactly one is on (All / Low stock / Out of stock): one grey pill slides from the old chip to the new one
 * instead of each chip painting its own. Put Chips with `selected` and `onClick` inside.
 */
export function ChipGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="group" className={cn("relative flex flex-wrap gap-1", className)} {...props}>
      <SlidingPill selector='[aria-pressed="true"]' className="rounded-control bg-fill-strong" />
      <InChipGroup.Provider value={true}>{children}</InChipGroup.Provider>
    </div>
  );
}
