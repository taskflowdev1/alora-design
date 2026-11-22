import * as React from "react";
import { cn } from "@/lib/ad";
import { CountBadge } from "./mobile-badge";

/**
 * Keeps the count on the installed app's icon (Badging API). 0 clears it. Browsers without it ignore this, and iOS shows
 * the count only once notifications are allowed.
 */
export function useAppBadge(count: number) {
  React.useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (!nav.setAppBadge) return;
    void (count > 0 ? nav.setAppBadge(count) : nav.clearAppBadge?.())?.catch(() => {});
  }, [count]);
}

export interface MobileAppIconProps {
  /** The artwork, drawn edge to edge. */
  children: React.ReactNode;
  /** The name under the icon. */
  label?: string;
  count?: number;
  /** Width and height in px. */
  size?: number;
  className?: string;
}

/** The app as it sits on the home screen: a continuous-corner icon, its count and its name. */
export function MobileAppIcon({ children, label, count = 0, size = 60, className }: MobileAppIconProps) {
  return (
    <span className={cn("inline-grid justify-items-center gap-1.5", className)} style={{ width: size + 12 }}>
      <span className="relative block" style={{ width: size, height: size }}>
        <span className="block size-full overflow-hidden shadow-card [corner-shape:superellipse(1.6)]" style={{ borderRadius: size * 0.27 }}>
          {children}
        </span>
        <CountBadge count={count} className="absolute -right-1.5 -top-1.5" aria-label="to pack" />
      </span>
      {label ? <span className="max-w-full truncate text-[12px] text-ink">{label}</span> : null}
    </span>
  );
}
