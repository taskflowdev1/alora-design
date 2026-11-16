import * as React from "react";
import { X } from "react-feather";
import { cn } from "@/lib/ad";

export type StatusTone = "default" | "muted" | "attention";

const dot: Record<StatusTone, string> = {
  default: "bg-ink",
  muted: "bg-ink-faint",
  attention: "bg-brand",
};

/** Default status: a small dot centred on the text, then the text. */
export function Status({ tone = "default", children, className }: { tone?: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-body text-ink", className)}>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}

/** Soft pill, for the one status that needs attention. */
export function Pill({ tone = "attention", children, className }: { tone?: "attention" | "neutral"; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-item px-2 text-small font-medium",
        tone === "attention" ? "bg-brand-soft text-brand-soft-ink" : "bg-fill text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** A pressed filter chip shows the soft fill; nothing else changes. */
  selected?: boolean;
  onClick?: () => void;
  /** Shows an × that calls this. */
  onRemove?: () => void;
  size?: "default" | "sm";
}

/** Filter chip: no border. Removable when onRemove is set. */
export function Chip({ selected, onRemove, size = "default", className, children, onClick, ...props }: ChipProps) {
  const height = size === "sm" ? "h-item" : "h-control";
  if (onRemove) {
    return (
      <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-control bg-fill pl-3 pr-1 text-body text-ink", height, className)}>
        <span className="truncate">{children}</span>
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="grid size-[calc(var(--ad-control-h)-var(--ad-nest)*2-4px)] min-h-6 min-w-6 cursor-pointer place-items-center rounded-item text-ink-muted transition-[background-color,transform] duration-[220ms] ease-ad hover:bg-fill-hover active:scale-90"
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
        "inline-flex shrink-0 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-control px-3 text-body transition-[background-color,transform] duration-[220ms] ease-ad active:scale-[0.96] [&_svg]:size-4",
        height,
        selected ? "bg-fill-hover text-ink" : "bg-transparent text-ink-muted hover:bg-fill hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
