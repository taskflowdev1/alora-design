import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface SaveBarProps {
  /** Shown while there are unsaved changes. */
  open: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
  label?: string;
  className?: string;
}

/**
 * Sticky bar for unsaved changes on scrolling forms. Floats with margin
 * (never glued to the edge); bar radius = button radius + bar padding.
 * Toasts rise above it.
 */
export function SaveBar({ open, onSave, onDiscard, saving, label = "Unsaved changes", className }: SaveBarProps) {
  if (!open) return null;
  return (
    <div className={cn("pointer-events-none sticky bottom-4 z-30 flex justify-center", className)}>
      <div
        data-toast-avoid
        role="region"
        aria-label={label}
        className="ad-on-dark pointer-events-auto flex animate-[ad-up_220ms_var(--ad-ease)] items-center gap-3 rounded-card bg-side p-nest pl-4 text-side-ink shadow-dialog"
      >
        <span className="whitespace-nowrap text-body">{label}</span>
        <div className="flex gap-1.5">
          <Button variant="ghost" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
          <Button variant="primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
