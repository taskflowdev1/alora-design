import * as React from "react";
import { createPortal } from "react-dom";
import { cn, SAFE_BOTTOM } from "@/lib/ad";
import { MobileLayer } from "./mobile-sheet";

const OFFSET = {
  "tab-bar": `calc(${SAFE_BOTTOM} + 84px)`,
  "tab-bar-fab": `calc(max(10px, ${SAFE_BOTTOM}) + 52px + 2 * var(--ad-nest) + 12px + 52px + 12px)`,
  "action-bar": `calc(${SAFE_BOTTOM} + 86px)`,
  none: `max(12px, ${SAFE_BOTTOM})`,
};

export interface MobileSnackbarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: React.ReactNode;
  /** One short action, usually Undo. */
  action?: { label: string; onClick: () => void };
  /** ms before it leaves on its own; paused while a finger is on it. */
  duration?: number;
  /** What it must stay above: the tab bar (default), a floating button over the tab bar, an action bar, or nothing. */
  above?: keyof typeof OFFSET;
  className?: string;
}

/**
 * Feedback after an action, on a phone: a dark bar that rises just above the tab bar (never over the buttons you
 * need next), says what happened in a few words, and offers Undo. It leaves after 4 s, or drag it down. Announced to
 * screen readers. While it leaves it keeps its words (an owner may clear them on close) and takes no taps.
 */
export function MobileSnackbar({ open, onOpenChange, message, action, duration = 4000, above = "tab-bar", className }: MobileSnackbarProps) {
  const layer = React.useContext(MobileLayer);
  const el = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(open);
  const drag = React.useRef<{ y: number; at: number; t: number; v: number } | null>(null);
  const timer = React.useRef(0);
  const last = React.useRef({ message, action });
  if (open) last.current = { message, action };
  const view = last.current;
  React.useEffect(() => {
    if (open) setShown(true);
  }, [open]);
  const latest = React.useRef(onOpenChange);
  latest.current = onOpenChange;
  React.useEffect(() => {
    if (!open) return;
    timer.current = window.setTimeout(() => latest.current(false), duration);
    return () => window.clearTimeout(timer.current);
  }, [open, duration, message]);
  if (!shown || typeof document === "undefined") return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-3 z-50 flex justify-center" style={{ bottom: OFFSET[above] }}>
      <div
        ref={el}
        role="status"
        aria-live="polite"
        onAnimationEnd={() => !open && setShown(false)}
        onPointerDown={(e) => {
          if (!open) return;
          window.clearTimeout(timer.current);
          drag.current = { y: e.clientY, at: 0, t: performance.now(), v: 0 };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current || !el.current) return;
          const dy = Math.max(0, e.clientY - drag.current.y);
          const now = performance.now();
          drag.current.v = drag.current.v * 0.4 + ((dy - drag.current.at) / Math.max(1, now - drag.current.t)) * 1000 * 0.6;
          drag.current.t = now;
          drag.current.at = dy;
          el.current.style.transform = `translateY(${dy}px)`;
          el.current.style.opacity = String(1 - Math.min(1, dy / 80));
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (!el.current) return;
          const v = d && performance.now() - d.t < 90 ? d.v : 0;
          if (d && (d.at > 28 || v > 500)) {
            el.current.style.setProperty("--ad-drag", `${d.at}px`);
            el.current.style.transform = "";
            return onOpenChange(false);
          }
          el.current.style.transform = "";
          el.current.style.opacity = "";
          timer.current = window.setTimeout(() => onOpenChange(false), duration);
        }}
        className={cn(
          "ad-on-dark flex min-h-touch w-full max-w-[480px] touch-none select-none items-center gap-3 rounded-[calc(var(--ad-radius-control)+6px)] bg-side-raised p-1.5 pl-4 text-[15px] text-side-ink shadow-dialog transition-[transform,opacity] duration-[200ms] ease-ad",
          open ? "pointer-events-auto animate-[ad-snack-in_260ms_var(--ad-ease-page)]" : "pointer-events-none animate-[ad-snack-out_200ms_ease-in_forwards]",
          className,
        )}
      >
        <style href="ad-snackbar" precedence="default">{`@keyframes ad-snack-in { from { transform: translateY(calc(100% + 24px)); opacity: 0; } } @keyframes ad-snack-out { from { transform: translateY(var(--ad-drag, 0px)); } to { transform: translateY(calc(var(--ad-drag, 0px) + 24px)); opacity: 0; } }`}</style>
        <span className="min-w-0 flex-1 truncate">{view.message}</span>
        {view.action ? (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => open && (view.action!.onClick(), onOpenChange(false))}
            className="h-touch shrink-0 cursor-pointer rounded-control bg-fill px-3.5 text-[15px] font-semibold text-ink ad-press focus-visible:bg-fill-strong active:scale-[0.97] data-pressed:scale-[0.97] [@media(hover:hover)]:hover:bg-fill-strong"
          >
            {view.action.label}
          </button>
        ) : null}
      </div>
    </div>,
    layer ?? document.body,
  );
}
