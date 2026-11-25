import * as React from "react";
import { cn } from "@/lib/ad";
import { MobileSheet } from "./mobile-sheet";

export interface MobileAction {
  label: string;
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  onSelect: () => void;
  /** Cancel order, delete: the label turns the soft danger colour. Never the first row. */
  destructive?: boolean;
  disabled?: boolean;
}

export interface MobileActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the actions act on ("ORD-1043"). Short; no sentence. */
  title?: string;
  actions: MobileAction[];
  cancelLabel?: string;
  className?: string;
}

/**
 * A short list of actions for one thing, rising from the bottom in thumb reach: the actions on one card, Cancel on its
 * own card under it (the safest action is the easiest to hit). Rows are 56 px, icon then label; the backdrop, Esc and
 * Cancel all close it. Each card's corners follow the sheet radius, rows sit one nest gap inside, concentric. A pick
 * runs once: the sheet stops taking taps as it starts to close.
 */
export function MobileActionSheet({ open, onOpenChange, title, actions, cancelLabel = "Cancel", className }: MobileActionSheetProps) {
  const pick = (a: MobileAction) => {
    if (!open) return;
    onOpenChange(false);
    a.onSelect();
  };
  const row =
    "flex h-[56px] w-full cursor-pointer select-none items-center gap-3 rounded-[calc(var(--ad-radius-sheet)-var(--ad-nest))] px-[calc(var(--ad-pad)-var(--ad-nest))] text-[17px] transition-colors duration-[120ms] active:bg-fill active:duration-0 data-pressed:bg-fill data-pressed:duration-0 focus-visible:bg-fill disabled:pointer-events-none disabled:opacity-40 [@media(hover:hover)]:hover:bg-fill";
  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} surface={false} aria-label={title ?? "Actions"} className={className}>
      <div className="grid rounded-sheet bg-surface p-nest shadow-dialog">
        {title ? <p className="px-pad pb-1 pt-2 text-center text-[13px] text-ink-muted">{title}</p> : null}
        {actions.map((a) => (
          <button key={a.label} type="button" disabled={a.disabled} onClick={() => pick(a)} className={cn(row, a.destructive ? "text-danger" : "text-ink")}>
            {a.icon ? <a.icon size={20} strokeWidth={1.75} /> : null}
            {a.label}
          </button>
        ))}
      </div>
      <div className="grid rounded-sheet bg-surface p-nest shadow-dialog">
        <button type="button" onClick={() => onOpenChange(false)} className={cn(row, "justify-center font-semibold text-ink")}>
          {cancelLabel}
        </button>
      </div>
    </MobileSheet>
  );
}
