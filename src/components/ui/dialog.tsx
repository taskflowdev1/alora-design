import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

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

export function Dialog({ open, onOpenChange, trigger, title, children, footer, className }: DialogProps) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <D.Trigger asChild>{trigger}</D.Trigger> : null}
      <D.Portal>
        <D.Overlay className={overlayClass} />
        <D.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-sheet bg-surface p-pad text-ink shadow-dialog",
            "data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_180ms_var(--ad-ease)]",
            className,
          )}
        >
          <div className="flex min-h-control items-center justify-between gap-3">
            <D.Title className="text-title font-semibold">{title}</D.Title>
            <D.Close asChild>
              <Button variant="ghost" icon aria-label="Close" className="-mr-1">
                <X />
              </Button>
            </D.Close>
          </div>
          {children}
          {footer ? <div className="flex flex-wrap justify-end gap-gap">{footer}</div> : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const DialogClose = D.Close;
