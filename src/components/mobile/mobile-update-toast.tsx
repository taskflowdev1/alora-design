import * as React from "react";
import { cn, SAFE_BOTTOM } from "@/lib/ad";
import { MobileStateButton } from "./mobile-state-button";

/**
 * Watches the service worker for a new version. `ready` turns true once one is installed and waiting; `reload()` tells
 * it to take over (your worker handles `{ type: "SKIP_WAITING" }`) and reloads when it has. It also checks for a new
 * version each time the app comes back to the foreground, since a home screen app can stay open for days.
 */
export function useAppUpdate() {
  const [waiting, setWaiting] = React.useState<ServiceWorker | null>(null);
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let reg: ServiceWorkerRegistration | undefined;
    let gone = false;
    const watch = (sw: ServiceWorker | null) => {
      sw?.addEventListener("statechange", () => {
        if (!gone && sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
      });
    };
    const found = () => watch(reg?.installing ?? null);
    const wake = () => document.visibilityState === "visible" && void reg?.update().catch(() => {});
    void navigator.serviceWorker.getRegistration().then((r) => {
      if (!r || gone) return;
      reg = r;
      if (r.waiting && navigator.serviceWorker.controller) setWaiting(r.waiting);
      watch(r.installing);
      r.addEventListener("updatefound", found);
    });
    document.addEventListener("visibilitychange", wake);
    return () => {
      gone = true;
      reg?.removeEventListener("updatefound", found);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);
  const reload = React.useCallback(() => {
    if (!waiting) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, [waiting]);
  return { ready: !!waiting, reload };
}

const OFFSET = { "tab-bar": `calc(${SAFE_BOTTOM} + 84px)`, "action-bar": `calc(${SAFE_BOTTOM} + 86px)`, none: `max(12px, ${SAFE_BOTTOM})` };

export interface MobileUpdateToastProps {
  open: boolean;
  /** Reload into the new version. The button stays busy until the page goes. */
  onReload: () => void;
  /** Later: it stays out of the way until the next launch. */
  onLater: () => void;
  busy?: boolean;
  message?: React.ReactNode;
  /** What it must stay above. */
  above?: keyof typeof OFFSET;
  className?: string;
}

/**
 * "A new version is ready", above the tab bar. It never reloads by itself, because someone may be halfway through an
 * order. Reload works in place; Later leaves until the next launch.
 */
export function MobileUpdateToast({ open, onReload, onLater, busy = false, message = "New version ready", above = "tab-bar", className }: MobileUpdateToastProps) {
  return (
    <div
      role="status"
      aria-hidden={!open}
      inert={!open || undefined}
      style={{ bottom: OFFSET[above] }}
      className={cn(
        "ad-on-dark fixed inset-x-3 z-50 flex items-center gap-1 rounded-[calc(var(--ad-radius-control)+6px)] bg-side-raised p-1.5 pl-4 text-[15px] text-side-ink shadow-dialog transition-[transform,opacity] duration-[260ms] ease-ad-page motion-reduce:transition-none",
        open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+24px)] opacity-0",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate">{message}</span>
      <button type="button" onClick={onLater} disabled={busy} className="h-touch shrink-0 cursor-pointer rounded-control px-3 text-[15px] text-side-muted ad-press focus-visible:bg-side-fill active:scale-[0.97] data-pressed:scale-[0.97] disabled:opacity-45 [@media(hover:hover)]:hover:bg-side-fill">
        Later
      </button>
      <MobileStateButton variant="primary" state={busy ? "busy" : "idle"} busyLabel="Reloading" onClick={onReload} className="shrink-0">
        Reload
      </MobileStateButton>
    </div>
  );
}
