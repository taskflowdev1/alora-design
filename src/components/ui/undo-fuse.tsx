import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

type Phase = "running" | "undone" | "leaving" | "gone";

const REWIND_MS = 280;
const UNDONE_HOLD_MS = 1000;
const LEAVE_MS = 180;
const FULL = "inset(0 0% 0 0)";
const EMPTY = "inset(0 100% 0 0)";

const CSS = `
.ad-undo { transition: opacity ${LEAVE_MS}ms var(--ad-ease), transform ${LEAVE_MS}ms var(--ad-ease); }
.ad-undo[data-phase="leaving"], .ad-undo[data-phase="gone"] { opacity: 0; transform: scale(0.97); pointer-events: none; }
.ad-undo-label { transition: opacity 140ms var(--ad-ease), filter 140ms var(--ad-ease); }
.ad-undo-label:not([data-on]) { opacity: 0; filter: blur(2px); }
.ad-undo-action { transition: opacity 140ms var(--ad-ease), transform 150ms var(--ad-ease), scale 150ms var(--ad-ease), background-color 150ms var(--ad-ease); }
.ad-undo[data-phase="undone"] .ad-undo-action { opacity: 0; transform: scale(0.96); pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  .ad-undo, .ad-undo[data-phase="leaving"], .ad-undo[data-phase="gone"] { transform: none; }
  .ad-undo-label:not([data-on]) { filter: none; }
  .ad-undo[data-phase="undone"] .ad-undo-action { transform: none; }
}`;

export interface UndoFuseProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string;
  /** Shown while the fill rewinds after Undo. */
  undoneLabel?: string;
  actionLabel?: string;
  /** How long the offer stays open, in ms. */
  duration?: number;
  /** Hold the drain from outside, for example until the pill has scrolled into the middle of the page. */
  paused?: boolean;
  onUndo?: () => void;
  /** The time ran out: commit the action. */
  onExpire?: () => void;
  /** The pill has finished leaving, after an undo or after expiring. */
  onClosed?: () => void;
}

/**
 * A pill offering Undo while its fill drains. Hover, focus, a held finger or scrolling it away all pause the drain; Undo
 * rewinds the fill to full. Mount it when the action happens; give it a new `key` to offer again.
 */
export function UndoFuse({
  label = "Order INV-20841 archived",
  undoneLabel = "Order restored",
  actionLabel = "Undo",
  duration = 6000,
  paused = false,
  onUndo,
  onExpire,
  onClosed,
  className,
  ...props
}: UndoFuseProps) {
  const [phase, setPhase] = React.useState<Phase>("running");
  const fillRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const anim = React.useRef<Animation | null>(null);
  const holds = React.useRef(new Set<string>());
  const timers = React.useRef<number[]>([]);
  const cb = React.useRef({ onExpire, onClosed });
  React.useEffect(() => {
    cb.current = { onExpire, onClosed };
  });

  const later = React.useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const leave = React.useCallback(() => {
    setPhase("leaving");
    later(() => {
      setPhase("gone");
      cb.current.onClosed?.();
    }, LEAVE_MS);
  }, [later]);

  const hold = React.useCallback((why: string, on: boolean) => {
    const set = holds.current;
    if (on) set.add(why);
    else set.delete(why);
    const a = anim.current;
    if (!a || a.playState === "finished") return;
    if (set.size) a.pause();
    else a.play();
  }, []);

  React.useEffect(() => {
    const el = fillRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    const list = timers.current;
    const a = el.animate([{ clipPath: FULL }, { clipPath: EMPTY }], { duration, easing: "linear", fill: "both" });
    anim.current = a;
    a.onfinish = () => {
      cb.current.onExpire?.();
      leave();
    };
    const io = new IntersectionObserver(([entry]) => hold("offscreen", !entry.isIntersecting));
    io.observe(root);
    const vis = () => hold("hidden", document.hidden);
    document.addEventListener("visibilitychange", vis);
    vis();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      a.onfinish = null;
      a.cancel();
      anim.current = null;
      list.forEach(window.clearTimeout);
    };
  }, [duration, hold, leave]);

  React.useEffect(() => hold("prop", paused), [paused, hold, duration]);

  const undo = () => {
    const a = anim.current;
    if (phase !== "running" || !a) return;
    const left = 1 - (a.effect?.getComputedTiming().progress ?? 0);
    a.onfinish = null;
    a.cancel();
    anim.current = null;
    setPhase("undone");
    onUndo?.();
    const el = fillRef.current;
    if (el && !prefersReducedMotion()) {
      el.animate([{ clipPath: `inset(0 ${((1 - left) * 100).toFixed(2)}% 0 0)` }, { clipPath: FULL }], { duration: REWIND_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });
    }
    later(leave, UNDONE_HOLD_MS);
  };

  const pointer = (e: React.PointerEvent, on: boolean) => {
    if (e.pointerType === "mouse") hold("hover", on);
  };

  return (
    <div
      ref={rootRef}
      role="status"
      data-phase={phase}
      onPointerEnter={(e) => pointer(e, true)}
      onPointerLeave={(e) => pointer(e, false)}
      onPointerDown={(e) => e.pointerType !== "mouse" && hold("touch", true)}
      onPointerUp={() => hold("touch", false)}
      onPointerCancel={() => hold("touch", false)}
      onFocus={() => hold("focus", true)}
      onBlur={() => hold("focus", false)}
      className={cn("ad-undo relative isolate flex h-12 w-full max-w-[400px] items-center overflow-hidden rounded-full bg-fill pl-5 pr-1.5 shadow-raised", className)}
      {...props}
    >
      <style href="ad-undo-fuse" precedence="default">
        {CSS}
      </style>
      <div ref={fillRef} aria-hidden className="absolute inset-0 -z-10 bg-fill-strong" />
      <span className="relative grid min-w-0 flex-1 text-body font-medium text-ink">
        <span data-on={phase === "undone" ? undefined : ""} aria-hidden={phase === "undone"} className="ad-undo-label col-start-1 row-start-1 truncate">
          {label}
        </span>
        <span data-on={phase === "undone" ? "" : undefined} aria-hidden={phase !== "undone"} className="ad-undo-label col-start-1 row-start-1 truncate">
          {undoneLabel}
        </span>
      </span>
      <button
        type="button"
        data-shape="round"
        tabIndex={phase === "running" ? undefined : -1}
        onClick={undo}
        className="ad-undo-action ml-3 h-9 shrink-0 cursor-pointer select-none rounded-full bg-on px-4 text-body font-medium text-on-ink hover:bg-ink-muted focus-visible:bg-ink-muted active:scale-[0.97]"
      >
        {actionLabel}
      </button>
    </div>
  );
}
