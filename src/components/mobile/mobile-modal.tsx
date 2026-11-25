import * as React from "react";
import { Dialog as D } from "radix-ui";
import { cn, SAFE_BOTTOM, SAFE_TOP } from "@/lib/ad";
import { MobileLayer, useReturnFocus } from "./mobile-sheet";
import { MobileAlert } from "./mobile-alert";
import { MobileActionBar } from "./mobile-action-bar";

export interface MobileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /**
   * Save: may return a promise; the button keeps its label and ignores taps until it settles, then the modal closes.
   * Return `false` (or resolve to it) to stay open, after showing the error and focusing the first invalid field.
   */
  onSave: () => void | false | Promise<unknown>;
  saveLabel?: string;
  /** Unsaved changes: Cancel asks before throwing them away. With none, Save just closes. */
  dirty?: boolean;
  /** The question Cancel asks when dirty. */
  discardTitle?: string;
  /**
   * Where Save sits. "bottom" (default): a full-width button pinned above the keyboard, in thumb reach, for a form that
   * fits one screen. "top": a text button in the bar's right, only for long forms that scroll a lot.
   */
  savePlacement?: "bottom" | "top";
  children: React.ReactNode;
  className?: string;
}

/**
 * A focused task that needs the whole screen (edit a product, a new customer): it rises from the bottom over
 * everything, with Cancel on the left of the 44 px bar and the title in the middle. Save is the screen's main action,
 * so it sits at the bottom in thumb reach (a pinned bar that rides the keyboard). It is never pre-disabled: with
 * nothing changed it just closes, and an invalid form says what's wrong when you press it. Enter in a field saves.
 * With unsaved changes, Cancel (and Esc) ask first. The body scrolls on its own and stays clear of the bar and
 * keyboard. Focus moves into it on open and back to where it was on close.
 */
export function MobileModal({
  open,
  onOpenChange,
  title,
  onSave,
  saveLabel = "Save",
  dirty = false,
  discardTitle = "Discard your changes?",
  savePlacement = "bottom",
  children,
  className,
}: MobileModalProps) {
  const layer = React.useContext(MobileLayer);
  const [ask, setAsk] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const content = React.useRef<HTMLDivElement>(null);
  const restoreFocus = useReturnFocus(open);
  const isOpen = React.useRef(open);
  isOpen.current = open;
  const leave = () => isOpen.current && (dirty ? setAsk(true) : onOpenChange(false));
  const save = async () => {
    if (saving || !isOpen.current) return;
    if (!dirty) return onOpenChange(false);
    setSaving(true);
    try {
      if ((await onSave()) !== false) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };
  const bar =
    "h-touch shrink-0 cursor-pointer truncate rounded-control px-2.5 text-[16px] ad-press focus-visible:bg-fill active:scale-[0.97] data-pressed:scale-[0.97] disabled:pointer-events-none";
  const bottom = savePlacement === "bottom";
  return (
    <>
      <D.Root open={open} onOpenChange={(o) => (o ? onOpenChange(true) : leave())} modal={!layer}>
        <D.Portal container={layer ?? undefined}>
          <D.Content
            ref={content}
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              content.current?.focus({ preventScroll: true });
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              restoreFocus();
            }}
            onInteractOutside={(e) => e.preventDefault()}
            className={cn(
              "ad-m-modal fixed inset-0 z-50 flex flex-col bg-page text-ink outline-none data-[state=closed]:animate-[ad-modal-out_240ms_var(--ad-ease-page)_forwards] data-[state=open]:animate-[ad-modal-in_300ms_var(--ad-ease-page)]",
              className,
            )}
          >
            <style href="ad-mobile-modal" precedence="default">{`@keyframes ad-modal-in { from { transform: translateY(100%); } } @keyframes ad-modal-out { to { transform: translateY(100%); } } @keyframes ad-saving { 50% { opacity: 0.55; } } @media (prefers-reduced-motion: reduce) { .ad-m-modal { animation-name: ad-fade-in !important; } .ad-m-modal[data-state=closed] { animation-name: ad-fade-out !important; } }`}</style>
            <form
              className="contents"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <header className="grid shrink-0 grid-cols-[minmax(88px,1fr)_auto_minmax(88px,1fr)] items-center px-1.5" style={{ paddingTop: SAFE_TOP, height: `calc(${SAFE_TOP} + 44px)` }}>
                <div className="flex min-w-0 items-center">
                  <button type="button" onClick={leave} className={cn(bar, "text-ink")}>
                    Cancel
                  </button>
                </div>
                <D.Title className="min-w-0 max-w-full truncate text-center text-[17px] font-semibold">{title}</D.Title>
                <div className="flex min-w-0 justify-end">
                  {bottom ? null : (
                    <button
                      type="submit"
                      aria-busy={saving || undefined}
                      className={cn(bar, "font-semibold text-ink", saving && "pointer-events-none animate-[ad-saving_900ms_ease-in-out_infinite]")}
                    >
                      {saveLabel}
                    </button>
                  )}
                </div>
              </header>
              <div
                data-scroll
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-pad pt-2 [scrollbar-width:none]"
                style={{ paddingBottom: `calc(max(${SAFE_BOTTOM}, var(--ad-keyboard, 0px)) + ${bottom ? 88 : 24}px)` }}
              >
                {children}
              </div>
              {bottom ? (
                <MobileActionBar>
                  <button
                    type="submit"
                    aria-busy={saving || undefined}
                    className={cn(
                      "cursor-pointer bg-brand font-semibold text-brand-ink ad-press focus-visible:bg-brand-hover active:scale-[0.97] data-pressed:scale-[0.97] [@media(hover:hover)]:hover:bg-brand-hover",
                      saving && "pointer-events-none animate-[ad-saving_900ms_ease-in-out_infinite]",
                    )}
                  >
                    {saveLabel}
                  </button>
                </MobileActionBar>
              ) : null}
            </form>
          </D.Content>
        </D.Portal>
      </D.Root>
      <MobileAlert
        open={ask}
        onOpenChange={setAsk}
        title={discardTitle}
        actions={[
          { label: "Keep editing", tone: "cancel" },
          { label: "Discard", tone: "danger", onSelect: () => onOpenChange(false) },
        ]}
      />
    </>
  );
}
