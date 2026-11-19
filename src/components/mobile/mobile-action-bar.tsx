import * as React from "react";
import { cn } from "@/lib/ad";

/**
 * Tracks the on-screen keyboard and writes its height to `--ad-keyboard` on <html>, so bars and sheets can sit on top
 * of it (visualViewport). Call it once near the root of a phone app.
 */
export function useKeyboardInset() {
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--ad-keyboard", `${Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))}px`);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.removeProperty("--ad-keyboard");
    };
  }, []);
}

/**
 * The screen's one main action, pinned at the bottom in thumb reach instead of a floating button: a floating card with
 * full-width 44 px buttons (primary last, on the right). It rides on top of the keyboard when one is open and clears
 * the home indicator otherwise. Give the screen bottomInset="action-bar" so the last row stays visible.
 */
export function MobileActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-mobile-action-bar
      style={{ bottom: "max(10px, var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px)), calc(var(--ad-keyboard, 0px) + 8px))" }}
      className={cn(
        "fixed inset-x-3 z-30 flex gap-gap rounded-sheet bg-surface p-nest shadow-dialog transition-[bottom] duration-[250ms] ease-ad",
        "[&>*]:h-touch [&>*]:min-w-0 [&>*]:flex-1 [&>*]:rounded-[calc(var(--ad-radius-sheet)-var(--ad-nest))] [&>*]:text-[15px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
