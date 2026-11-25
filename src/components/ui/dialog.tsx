import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Buttons, bottom right. Their radius + the dialog padding = the dialog radius. */
  footer?: React.ReactNode;
  className?: string;
}

export const overlayClass =
  "fixed inset-0 z-50 bg-overlay data-[state=open]:animate-[ad-fade-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-fade-out_180ms_var(--ad-ease)]";

const FIELD = "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])";

/**
 * Focus return for a dialog opened from state rather than a Radix Trigger (a toolbar button, a shortcut, a row):
 * Radix only restores focus to its own Trigger, so without this focus falls to the page body on close. Pass the result
 * to `onCloseAutoFocus`.
 */
export function useReturnFocus(open: boolean) {
  const back = React.useRef<HTMLElement | null>(null);
  const was = React.useRef(false);
  if (open && !was.current && typeof document !== "undefined") back.current = document.activeElement as HTMLElement | null;
  was.current = open;
  return React.useCallback((e: Event) => {
    const el = back.current;
    back.current = null;
    if (!el || !el.isConnected || el === document.body) return;
    e.preventDefault();
    el.focus({ preventScroll: true });
  }, []);
}

/**
 * Opening focus: with a mouse or trackpad, the first field (so typing starts at once); otherwise the dialog itself, so
 * no tooltip pops on the close button and a phone keyboard doesn't cover the form before it is read.
 */
function openFocus(e: Event) {
  e.preventDefault();
  const box = e.currentTarget as HTMLElement | null;
  const field = typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches ? box?.querySelector<HTMLElement>(FIELD) : null;
  (field ?? box)?.focus({ preventScroll: true });
}

export function Dialog({ open, onOpenChange, trigger, title, children, footer, className }: DialogProps) {
  const returnFocus = useReturnFocus(!!open);
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <D.Trigger asChild>{trigger}</D.Trigger> : null}
      <D.Portal>
        <D.Overlay className={overlayClass} />
        <D.Content
          aria-describedby={undefined}
          onOpenAutoFocus={openFocus}
          onCloseAutoFocus={trigger ? undefined : returnFocus}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-sheet bg-surface p-pad text-ink shadow-dialog outline-none",
            "data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_180ms_var(--ad-ease)]",
            className,
          )}
        >
          <div className="flex min-h-control items-center justify-between gap-3">
            <D.Title className="text-title font-semibold">{title}</D.Title>
            <Tooltip content="Close">
              <D.Close asChild>
                <Button variant="ghost" icon aria-label="Close" className="-mr-1">
                  <X />
                </Button>
              </D.Close>
            </Tooltip>
          </div>
          {children}
          {footer ? <div className="flex flex-wrap justify-end gap-gap">{footer}</div> : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const DialogClose = D.Close;
