import * as React from "react";
import { Dialog as D } from "radix-ui";
import { cn } from "@/lib/ad";
import { MobileLayer } from "./mobile-sheet";
import { MobileAlert } from "./mobile-alert";

const SAFE_TOP = "var(--ad-safe-top, env(safe-area-inset-top, 0px))";
const SAFE_BOTTOM = "var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px))";

export interface MobileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Save: may return a promise; the button keeps its label and ignores taps until it settles, then the modal closes. */
  onSave: () => void | Promise<unknown>;
  saveLabel?: string;
  /** Unsaved changes: Cancel asks before throwing them away, and Save is on. */
  dirty?: boolean;
  /** The question Cancel asks when dirty. */
  discardTitle?: string;
  children: React.ReactNode;
}

/**
 * A focused task that needs the whole screen (edit a product, a new customer): it rises from the bottom over
 * everything, with Cancel on the left, the title in the middle and Save on the right, in thumb-friendly 44 px targets.
 * With unsaved changes, Cancel (and Esc) ask first. The body scrolls on its own and stays clear of the keyboard.
 */
export function MobileModal({ open, onOpenChange, title, onSave, saveLabel = "Save", dirty = false, discardTitle = "Discard your changes?", children }: MobileModalProps) {
  const layer = React.useContext(MobileLayer);
  const [ask, setAsk] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const leave = () => (dirty ? setAsk(true) : onOpenChange(false));
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };
  const bar =
    "h-touch shrink-0 cursor-pointer rounded-control px-3 text-[16px] transition-[background-color,transform,opacity] duration-[150ms] ease-ad active:scale-[0.96] [-webkit-tap-highlight-color:transparent] disabled:pointer-events-none";
  return (
    <>
      <D.Root open={open} onOpenChange={(o) => (o ? onOpenChange(true) : leave())} modal={!layer}>
        <D.Portal container={layer ?? undefined}>
          <D.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className="ad-m-modal fixed inset-0 z-50 flex flex-col bg-page text-ink outline-none data-[state=closed]:animate-[ad-modal-out_240ms_cubic-bezier(0.32,0.72,0,1)_forwards] data-[state=open]:animate-[ad-modal-in_300ms_cubic-bezier(0.32,0.72,0,1)]"
          >
            <style href="ad-mobile-modal" precedence="default">{`@keyframes ad-modal-in { from { transform: translateY(100%); } } @keyframes ad-modal-out { to { transform: translateY(100%); } } @keyframes ad-saving { 50% { opacity: 0.55; } } @media (prefers-reduced-motion: reduce) { .ad-m-modal { animation-name: ad-fade-in !important; } .ad-m-modal[data-state=closed] { animation-name: ad-fade-out !important; } }`}</style>
            <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-1.5" style={{ paddingTop: SAFE_TOP }}>
              <div className="flex h-[52px] items-center">
                <button type="button" onClick={leave} className={cn(bar, "text-ink")}>
                  Cancel
                </button>
              </div>
              <D.Title className="max-w-[52vw] truncate text-[17px] font-semibold">{title}</D.Title>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={save}
                  disabled={!dirty}
                  aria-busy={saving || undefined}
                  className={cn(bar, "bg-brand px-4 font-semibold text-brand-ink disabled:bg-fill disabled:text-ink-muted", saving && "pointer-events-none animate-[ad-saving_900ms_ease-in-out_infinite]")}
                >
                  {saveLabel}
                </button>
              </div>
            </header>
            <div
              data-scroll
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-pad pt-2 [scrollbar-width:none]"
              style={{ paddingBottom: `calc(max(${SAFE_BOTTOM}, var(--ad-keyboard, 0px)) + 24px)` }}
            >
              {children}
            </div>
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
