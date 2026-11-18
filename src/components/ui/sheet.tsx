import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { overlayClass } from "@/components/ui/dialog";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Non-modal panes leave the page usable, so another row can be clicked. */
  modal?: boolean;
  /** Clicks inside elements matching this selector don't close a non-modal pane. */
  keepOpenOn?: string;
  className?: string;
}

/** Side pane for details and create forms on desktop. Floats with margin, eases in from the right. */
export function Sheet({ open, onOpenChange, title, children, footer, modal = true, keepOpenOn, className }: SheetProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      <D.Portal>
        {modal ? <D.Overlay className={overlayClass} /> : null}
        <D.Content
          aria-describedby={undefined}
          data-toast-avoid="side"
          onInteractOutside={(e) => {
            const t = e.target as HTMLElement | null;
            if (keepOpenOn && t?.closest(keepOpenOn)) e.preventDefault();
          }}
          className={cn(
            "fixed inset-2 z-50 flex flex-col rounded-sheet bg-surface text-ink shadow-dialog sm:inset-auto sm:bottom-3 sm:right-3 sm:top-3 sm:w-[min(440px,calc(100vw-24px))]",
            "data-[state=open]:animate-[ad-sheet-in_260ms_var(--ad-ease)] data-[state=closed]:animate-[ad-sheet-out_180ms_ease-in]",
            className,
          )}
        >
          <div className="flex min-h-control shrink-0 items-center justify-between gap-3 px-pad pt-pad">
            <D.Title className="min-w-0 truncate text-title font-semibold">{title}</D.Title>
            <D.Close asChild>
              <Button variant="ghost" icon aria-label="Close" className="-mr-1">
                <X />
              </Button>
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-pad py-3">{children}</div>
          {footer ? <div className="flex shrink-0 flex-wrap justify-end gap-gap px-pad pb-pad">{footer}</div> : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
