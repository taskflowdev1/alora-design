import type { ComponentType } from "react";
import { cn } from "@/lib/ad";

// The phone tab bar moved to the Mobile set: src/components/mobile/mobile-tab-bar.tsx (install name mobile-tab-bar).
// These names stay so existing imports and `bottom-nav` installs keep working.
export { MobileTabBar as BottomNav, MobileTab as BottomNavItem } from "../mobile/mobile-tab-bar";

/**
 * A floating main action. Kept for existing screens; new phone screens put their one main action in MobileActionBar
 * (pinned at the bottom, above the keyboard) instead.
 */
export function Fab({ icon: Icon, label, onClick }: { icon: ComponentType<{ size?: number | string }>; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-4 z-40 grid size-12 cursor-pointer place-items-center rounded-card bg-brand text-brand-ink shadow-dialog",
        "transition-[transform,background-color] duration-[150ms] ease-ad hover:bg-brand-hover focus-visible:bg-brand-hover active:scale-[0.97]",
      )}
    >
      <Icon size={20} />
    </button>
  );
}
