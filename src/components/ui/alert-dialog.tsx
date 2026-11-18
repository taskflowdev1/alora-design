import * as React from "react";
import { AlertDialog as AD } from "radix-ui";
import { cn } from "@/lib/ad";
import { buttonClass } from "@/components/ui/button";
import { overlayClass } from "@/components/ui/dialog";

export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  /** The question, plainly: "Cancel 3 orders?" */
  title: React.ReactNode;
  /** One sentence on what happens, only if the title can't say it. */
  children?: React.ReactNode;
  /** The action's label: says what it does ("Cancel orders"), never "OK". */
  action: React.ReactNode;
  onAction: () => void;
  /** Label of the way out. */
  cancel?: React.ReactNode;
  className?: string;
}

/**
 * A confirm that must be answered: no close button, Escape or the way out cancels, focus starts on the way out. The
 * action is a solid ink button (not red: negatives stay quiet), buttons bottom right, concentric with the dialog.
 */
export function AlertDialog({ open, onOpenChange, trigger, title, children, action, onAction, cancel = "Keep", className }: AlertDialogProps) {
  return (
    <AD.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <AD.Trigger asChild>{trigger}</AD.Trigger> : null}
      <AD.Portal>
        <AD.Overlay className={overlayClass} />
        <AD.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-[min(400px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 gap-3 rounded-sheet bg-surface p-pad text-ink shadow-dialog",
            "data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_140ms_ease-in]",
            className,
          )}
        >
          <AD.Title className="pt-1 text-title font-semibold">{title}</AD.Title>
          {children ? <AD.Description className="text-body leading-relaxed text-ink-muted">{children}</AD.Description> : <AD.Description className="sr-only">{title}</AD.Description>}
          <div className="mt-2 flex flex-wrap justify-end gap-gap">
            <AD.Cancel className={buttonClass({ variant: "ghost" })}>{cancel}</AD.Cancel>
            <AD.Action className={cn(buttonClass({ variant: "secondary" }), "bg-on text-on-ink hover:bg-on focus-visible:bg-on")} onClick={onAction}>
              {action}
            </AD.Action>
          </div>
        </AD.Content>
      </AD.Portal>
    </AD.Root>
  );
}
