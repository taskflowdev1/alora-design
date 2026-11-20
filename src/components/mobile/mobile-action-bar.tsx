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

const BAR_BOTTOM = "max(10px, var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px)), calc(var(--ad-keyboard, 0px) + 8px))";

/**
 * Content scrolls under a floating bar: this fades it into the page from the screen's bottom edge to 16 px above the
 * bar, so no row peeks out below the bar or under the home indicator. No blur.
 */
export function MobileBarScrim({ height, className }: { height: string; className?: string }) {
  return <div aria-hidden className={cn("pointer-events-none fixed inset-x-0 bottom-0 bg-linear-to-t from-page from-60% to-transparent", className)} style={{ height }} />;
}

/**
 * The main action of a form or detail screen, pinned at the bottom in thumb reach: a floating card with full-width 44 px
 * buttons (at most one accent, primary last on the right; one secondary may share the bar). List screens with a main
 * action use MobileFab instead. It rides on top of the keyboard when one is open and clears the home indicator
 * otherwise. Buttons keep the control radius like every other button on the screen; the card is that radius plus its
 * inset, so the corners stay concentric. Give the screen bottomInset="action-bar" so the last row stays visible.
 */
export function MobileActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      <MobileBarScrim className="z-[29] transition-[height] duration-[250ms] ease-ad" height={`calc(${BAR_BOTTOM} + 44px + 2 * var(--ad-nest) + 16px)`} />
      <div
        data-mobile-action-bar
        style={{ bottom: BAR_BOTTOM }}
        className={cn(
          "fixed inset-x-3 z-30 flex gap-gap rounded-[calc(var(--ad-radius-control)+var(--ad-nest))] bg-surface p-nest shadow-dialog transition-[bottom] duration-[250ms] ease-ad",
          "[&>*]:h-touch [&>*]:min-w-0 [&>*]:flex-1 [&>*]:rounded-control [&>*]:text-[15px]",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}

export interface MobileFabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  /** Short verb + noun ("New product"). Shown beside the icon; with `iconOnly`, it is the accessible name. */
  label: string;
  iconOnly?: boolean;
  /** What it floats above: the tab bar (default) or nothing (a pushed list screen). */
  above?: "tab-bar" | "none";
}

/**
 * The main action of a list screen (New product, New customer): a floating accent button at the bottom right, in thumb
 * reach, above the tab bar. One per screen, and only where creating is the main job; forms and detail screens pin
 * their action in a MobileActionBar instead. Give the screen bottomInset="tab-bar-fab" so the last row clears it.
 */
export function MobileFab({ icon: Icon, label, iconOnly = false, above = "tab-bar", className, ...props }: MobileFabProps) {
  const safe = "max(10px, var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px)))";
  return (
    <button
      type="button"
      aria-label={iconOnly ? label : undefined}
      data-mobile-fab
      style={{ bottom: above === "tab-bar" ? `calc(${safe} + 52px + 2 * var(--ad-nest) + 12px)` : safe }}
      className={cn(
        "fixed right-3 z-30 flex h-[52px] cursor-pointer select-none items-center justify-center gap-2 rounded-sheet bg-brand font-medium text-brand-ink shadow-dialog transition-[background-color,transform] duration-[150ms] ease-ad focus-visible:bg-brand-hover active:scale-[0.96] [-webkit-tap-highlight-color:transparent] [@media(hover:hover)]:hover:bg-brand-hover",
        iconOnly ? "w-[52px]" : "pl-4 pr-5 text-[15px]",
        className,
      )}
      {...props}
    >
      <Icon size={20} strokeWidth={2} />
      {iconOnly ? null : label}
    </button>
  );
}
