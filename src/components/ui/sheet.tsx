import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { overlayClass, useReturnFocus } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";

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
  // The pane is opened by state, not by a Radix trigger, so Radix has nowhere to return focus: remember what had it.
  const returnFocus = useReturnFocus(open);
  const body = React.useRef<HTMLDivElement>(null);
  const pane = React.useRef<HTMLDivElement>(null);
  return (
    <D.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      <D.Portal>
        {modal ? <D.Overlay className={overlayClass} /> : null}
        <D.Content
          ref={pane}
          aria-describedby={undefined}
          data-toast-avoid="side"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // With a mouse, a create form starts in its first field; otherwise the pane itself takes focus (not the
            // Close button, whose tooltip would pop up on every open). Phones never get a keyboard thrown up.
            const field = typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches
              ? body.current?.querySelector<HTMLElement>("input:not([type=hidden]):not(:disabled), textarea:not(:disabled), select:not(:disabled)")
              : null;
            (field ?? pane.current)?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={returnFocus}
          onInteractOutside={(e) => {
            const t = e.target as HTMLElement | null;
            if (keepOpenOn && t?.closest(keepOpenOn)) e.preventDefault();
          }}
          className={cn(
            "fixed inset-2 z-50 flex flex-col rounded-sheet bg-surface text-ink shadow-dialog sm:inset-auto sm:bottom-3 sm:right-3 sm:top-3 sm:w-[min(440px,calc(100vw-24px))]",
            "data-[state=open]:animate-[ad-sheet-in_260ms_var(--ad-ease)] data-[state=closed]:animate-[ad-sheet-out_210ms_ease-in]",
            className,
          )}
        >
          <div className="flex min-h-control shrink-0 items-center justify-between gap-3 px-pad pt-pad">
            <D.Title className="min-w-0 truncate text-title font-semibold">{title}</D.Title>
            <Tooltip content="Close">
              <D.Close asChild>
                <Button variant="ghost" icon aria-label="Close" className="-mr-1">
                  <X />
                </Button>
              </D.Close>
            </Tooltip>
          </div>
          <div ref={body} className="min-h-0 flex-1 overflow-auto px-pad py-3">
            {children}
          </div>
          {footer ? <div className="flex shrink-0 flex-wrap justify-end gap-gap px-pad pb-pad">{footer}</div> : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
