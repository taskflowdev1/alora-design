import * as React from "react";
import { Dialog as D } from "radix-ui";
import { cn } from "@/lib/ad";
import { useJustOpened } from "@/lib/ad-hooks";
import { MobileLayer, useReturnFocus } from "./mobile-sheet";

export interface MobileAlertAction {
  label: string;
  onSelect?: () => void;
  /** cancel: the safe way out (soft). primary: the one key action (accent). danger: destructive (soft red, never loud). */
  tone?: "cancel" | "default" | "primary" | "danger";
}

export interface MobileAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A question that names the thing: "Discard the changes to Gelas kopi?" */
  title: string;
  /** One short line, only when the title can't carry it. */
  message?: React.ReactNode;
  /** Two sit side by side (safe one first); three or more stack. */
  actions: MobileAlertAction[];
  className?: string;
}

/**
 * Ask before something that can't be undone: a small card in the middle of the screen over a dimmed backdrop, the
 * question as the title, and 44 px buttons. It eases in from 96 % (no bounce). Esc and the backdrop count as the
 * cancel action. Use it for confirmations only; feedback after the fact is a snackbar. Focus moves into it on open and
 * back on close; a double tap neither closes it at once nor runs an action twice.
 */
export function MobileAlert({ open, onOpenChange, title, message, actions, className }: MobileAlertProps) {
  const layer = React.useContext(MobileLayer);
  const early = useJustOpened(open);
  const restoreFocus = useReturnFocus(open);
  const content = React.useRef<HTMLDivElement>(null);
  const tone = {
    cancel: "bg-fill text-ink [@media(hover:hover)]:hover:bg-fill-strong",
    default: "bg-fill text-ink [@media(hover:hover)]:hover:bg-fill-strong",
    primary: "bg-brand text-brand-ink [@media(hover:hover)]:hover:bg-brand-hover",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <D.Root open={open} onOpenChange={(o) => (o || !early()) && onOpenChange(o)} modal={!layer}>
      <D.Portal container={layer ?? undefined}>
        <D.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-[ad-fade-out_160ms_var(--ad-ease)_forwards] data-[state=open]:animate-[ad-fade-in_200ms_var(--ad-ease)]" />
        <D.Content
          ref={content}
          role="alertdialog"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            content.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            restoreFocus();
          }}
          onInteractOutside={(e) => ((layer && e.target instanceof Node && !layer.contains(e.target)) || early(e.detail.originalEvent.timeStamp)) && e.preventDefault()}
          className={cn(
            "ad-m-alert fixed left-1/2 top-1/2 z-50 grid w-[min(300px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-sheet bg-raised p-pad text-center text-ink shadow-dialog outline-none data-[state=closed]:pointer-events-none data-[state=closed]:animate-[ad-alert-out_150ms_var(--ad-ease)_forwards] data-[state=open]:animate-[ad-alert-in_220ms_var(--ad-ease)]",
            className,
          )}
        >
          <style href="ad-mobile-alert" precedence="default">{`@keyframes ad-alert-in { from { opacity: 0; scale: 0.96; } } @keyframes ad-alert-out { to { opacity: 0; scale: 0.98; } } @media (prefers-reduced-motion: reduce) { [role=alertdialog].ad-m-alert { animation-name: ad-fade-in !important; } }`}</style>
          <div className="grid gap-1.5 px-1 pt-2">
            <D.Title className="text-[17px] font-semibold leading-snug">{title}</D.Title>
            {message ? <p className="text-[15px] text-ink-muted">{message}</p> : null}
          </div>
          <div className={cn("grid gap-gap", actions.length === 2 && "grid-cols-2")}>
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  if (!open) return;
                  onOpenChange(false);
                  a.onSelect?.();
                }}
                className={cn(
                  "h-touch cursor-pointer truncate rounded-[calc(var(--ad-radius-sheet)-var(--ad-pad))] px-3 text-[15px] font-medium ad-press focus-visible:brightness-90 active:scale-[0.97] data-pressed:scale-[0.97]",
                  tone[a.tone ?? "default"],
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
