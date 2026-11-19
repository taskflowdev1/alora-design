import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface SaveBarProps {
  /** Shown while there are unsaved changes. */
  open: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  label?: string;
  /** Inside a card: in the flow right after the content, full width, label on the rows' inset. */
  inline?: boolean;
  className?: string;
}

/**
 * Sticky bar for unsaved changes on scrolling forms. Floats with margin
 * (never glued to the edge); bar radius = button radius + bar padding.
 * Toasts rise above it.
 */
export function SaveBar({ open, onSave, onDiscard, saving, label = "Unsaved changes", inline, className }: SaveBarProps) {
  if (!open) return null;
  return (
    <div className={cn(inline ? "flex" : "pointer-events-none sticky bottom-4 z-30 flex justify-center", className)}>
      <div
        data-toast-avoid
        role="region"
        aria-label={label}
        className={cn(
          "ad-on-dark pointer-events-auto flex animate-[ad-up_220ms_var(--ad-ease)] items-center gap-3 rounded-card bg-side p-nest text-side-ink shadow-dialog",
          inline ? "flex-1 justify-between px-2" : "pl-4",
        )}
      >
        <span className="whitespace-nowrap text-body">{label}</span>
        <div className="flex gap-1.5">
          <Button variant="ghost" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
          <Button variant="primary" onClick={onSave} disabled={saving} aria-busy={saving || undefined}>
            {/* Both labels share one cell, so "Saving…" never changes the button's width. */}
            <span className="inline-grid [&>*]:[grid-area:1/1]">
              <span className={cn(saving && "invisible")}>Save changes</span>
              <span className={cn(!saving && "invisible")}>Saving…</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
