import * as React from "react";
import { cn } from "@/lib/ad";
import { SlidingPill } from "@/components/ui/sliding-pill";

const IconOnly = React.createContext(false);

export interface MobileTabBarProps {
  children: React.ReactNode;
  /** Icons without labels (each tab keeps its label as its accessible name). */
  iconOnly?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Bottom tabs: a dark bar that floats with a margin above the home indicator, full rounding, in thumb reach. The active
 * tab is a pill that slides to the tab you tap (SlidingPill); the icon stays the same. Three to five tabs, each a real
 * destination. Leave one main action for the screen's action bar, not a floating button.
 */
export function MobileTabBar({ children, iconOnly = false, className, ...aria }: MobileTabBarProps) {
  return (
    <nav
      aria-label={aria["aria-label"] ?? "Tabs"}
      data-mobile-tab-bar
      className={cn(
        "ad-on-dark fixed bottom-[max(10px,var(--ad-safe-bottom,env(safe-area-inset-bottom,0px)))] z-40 flex touch-manipulation items-stretch rounded-sheet bg-side p-nest shadow-dialog",
        iconOnly ? "left-1/2 -translate-x-1/2 gap-1" : "inset-x-3 justify-around",
        className,
      )}
    >
      <SlidingPill selector='[aria-current="page"]' className="rounded-[calc(var(--ad-radius-sheet)-var(--ad-nest))] bg-fill-strong" />
      <IconOnly.Provider value={iconOnly}>{children}</IconOnly.Provider>
    </nav>
  );
}

export interface MobileTabProps {
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  label: string;
  active?: boolean;
  /** A small count on the icon (unread, to pack). */
  badge?: number;
  onClick?: () => void;
}

export function MobileTab({ icon: Icon, label, active, badge, onClick }: MobileTabProps) {
  const iconOnly = React.useContext(IconOnly);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        "group/tab relative flex cursor-pointer select-none flex-col items-center justify-center gap-0.5 rounded-[calc(var(--ad-radius-sheet)-var(--ad-nest))] transition-colors duration-[150ms] ease-ad [-webkit-tap-highlight-color:transparent]",
        iconOnly ? "size-[52px]" : "min-h-[52px] min-w-touch flex-1 px-1",
        active ? "text-ink" : "text-ink-muted",
      )}
    >
      {/* Haptic-style feedback without haptics: the icon dips while pressed and springs back. */}
      <span className="relative transition-transform duration-[180ms] ease-ad group-active/tab:scale-[0.86]">
        <Icon size={22} strokeWidth={1.75} />
        {badge ? (
          <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-on px-1 text-[10px] font-semibold leading-none tabular-nums text-on-ink">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      {iconOnly ? null : <span className={cn("text-[11px] leading-none", active && "font-medium")}>{label}</span>}
    </button>
  );
}
