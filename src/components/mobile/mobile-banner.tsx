import * as React from "react";
import { cn } from "@/lib/ad";

/** True while the device has a network connection (navigator.onLine, kept live). */
export function useOnline() {
  const [online, setOnline] = React.useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => (window.removeEventListener("online", on), window.removeEventListener("offline", off));
  }, []);
  return online;
}

export interface MobileBannerProps {
  /** Shown or not; it slides open and closed so the content under it moves once, smoothly. */
  open: boolean;
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;
  /** One plain sentence: what is happening ("You're offline. Changes save on this phone and sync later."). */
  children: React.ReactNode;
  /** One short action (Retry, Turn on). */
  action?: { label: string; onClick: () => void };
  /** neutral (default): a grey card. info: a soft accent card, for news worth a look. */
  tone?: "neutral" | "info";
  className?: string;
}

/**
 * A screen-wide state above the content (offline, sync paused, a new version): a soft card with the icon on the first
 * line, one plain sentence and at most one action. Never red, never over the content: it slides open in the flow and
 * the content moves down with it. Announced to screen readers.
 */
export function MobileBanner({ open, icon: Icon, children, action, tone = "neutral", className }: MobileBannerProps) {
  return (
    <div className="grid transition-[grid-template-rows,opacity] duration-[240ms] ease-ad motion-reduce:transition-none" style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}>
      <div className="min-h-0 overflow-hidden" aria-hidden={!open}>
        <div role="status" className={cn("flex items-start gap-3 rounded-card p-3 pl-3.5", tone === "info" ? "bg-brand-soft text-brand-soft-ink" : "bg-fill-strong text-ink", className)}>
          {Icon ? <Icon size={20} strokeWidth={1.75} className="mt-[1px] shrink-0" /> : null}
          <p className="min-w-0 flex-1 py-px text-[15px] leading-[20px]">{children}</p>
          {action ? (
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={action.onClick}
              className="group/act -my-3 -mr-1.5 grid h-touch shrink-0 cursor-pointer place-items-center self-center px-0.5 text-[15px] font-semibold outline-none transition-transform duration-[150ms] ease-ad active:scale-[0.95] [-webkit-tap-highlight-color:transparent]"
            >
              {/* It looks like a button: a small pill (32 px) in a 44 px hit area. */}
              <span className="flex h-[32px] items-center rounded-control bg-surface px-3 transition-colors duration-[150ms] ease-ad group-focus-visible/act:bg-fill">{action.label}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
