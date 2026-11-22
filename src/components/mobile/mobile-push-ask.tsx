import * as React from "react";
import { Bell, BellOff, Download } from "react-feather";
import { cn } from "@/lib/ad";
import { useStandalone } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";

export type PushStatus = "ask" | "granted" | "blocked" | "needs-install" | "unsupported";

const IOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Where notifications stand on this device. `ask()` shows the browser's prompt, so call it straight from a tap (iOS
 * refuses anything else). On iPhone push exists only in the installed app, which reads as "needs-install".
 */
export function usePushPermission() {
  const standalone = useStandalone();
  const supported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  const [permission, setPermission] = React.useState<NotificationPermission>(() => (supported ? Notification.permission : "default"));
  const status: PushStatus = !supported ? (IOS() && !standalone ? "needs-install" : "unsupported") : permission === "granted" ? "granted" : permission === "denied" ? "blocked" : "ask";
  const ask = React.useCallback(async () => {
    if (!supported) return "default" as NotificationPermission;
    const p = await Notification.requestPermission();
    setPermission(p);
    return p;
  }, [supported]);
  return { status, ask };
}

export interface MobilePushAskProps {
  /** ask: the soft ask. blocked: how to turn it back on. needs-install: install first. Anything else renders closed. */
  status: PushStatus;
  /** What they get, in their words. */
  title?: string;
  /** Turn on. Run the real browser prompt from this tap. */
  onAllow?: () => void;
  /** Not now: hide it and ask again after a later success, never on the next load. */
  onLater?: () => void;
  /** blocked: open your how-to. needs-install: open the install sheet. */
  onFix?: () => void;
  className?: string;
}

/**
 * The ask before the ask. A browser's prompt can be refused once and then never shown again, so this card goes first,
 * at a moment the value is obvious. Only a yes here opens the real prompt. It closes in the flow, so the list moves up once.
 */
export function MobilePushAsk({ status, title = "Get new orders on this phone", onAllow, onLater, onFix, className }: MobilePushAskProps) {
  const open = status === "ask" || status === "blocked" || status === "needs-install";
  const last = React.useRef(status);
  if (open) last.current = status;
  const view = last.current;
  const Icon = view === "blocked" ? BellOff : view === "needs-install" ? Download : Bell;
  return (
    <div inert={!open || undefined} className="grid transition-[grid-template-rows,opacity] duration-[260ms] ease-ad motion-reduce:transition-none" style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}>
      <div className="min-h-0 overflow-hidden">
        <section className={cn("grid gap-3 rounded-card bg-surface p-pad shadow-card", className)}>
          <p className="flex items-start gap-3 text-[15px] font-medium text-ink">
            <Icon size={20} strokeWidth={1.75} className="mt-px shrink-0" />
            {view === "blocked" ? "Notifications are off in Settings" : view === "needs-install" ? "Install the app to get notifications" : title}
          </p>
          <div className="flex gap-gap [&>*]:h-touch [&>*]:flex-1 [&>*]:text-[15px]">
            {view === "ask" ? (
              <>
                <Button onClick={onLater}>Not now</Button>
                <Button variant="primary" onClick={onAllow}>Turn on</Button>
              </>
            ) : (
              <Button onClick={onFix}>{view === "blocked" ? "Show me how" : "Install"}</Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
