import * as React from "react";
import { Sun } from "react-feather";
import { MobileSwitchRow } from "./mobile-choice-rows";

/**
 * Keeps the screen on during long hands-busy work (stock counts, picking, a till). The browser drops the lock whenever
 * the app leaves the screen, so it is taken again on return. `supported` is false where the API is missing.
 */
export function useWakeLock() {
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;
  const [on, setOn] = React.useState(false);
  const lock = React.useRef<WakeLockSentinel | null>(null);
  const take = React.useCallback(async () => {
    if (!supported) return false;
    try {
      lock.current = await navigator.wakeLock.request("screen");
      return true;
    } catch {
      return false;
    }
  }, [supported]);
  const set = React.useCallback(
    async (next: boolean) => {
      if (next) setOn(await take());
      else {
        setOn(false);
        await lock.current?.release().catch(() => {});
        lock.current = null;
      }
    },
    [take],
  );
  React.useEffect(() => {
    if (!on) return;
    const back = () => document.visibilityState === "visible" && void take();
    document.addEventListener("visibilitychange", back);
    return () => document.removeEventListener("visibilitychange", back);
  }, [on, take]);
  React.useEffect(() => () => void lock.current?.release().catch(() => {}), []);
  return { supported, on, set };
}

/** The switch for it, as a settings row. Hide it where `supported` is false. */
export function MobileWakeLockRow({ checked, onCheckedChange, title = "Keep screen on" }: { checked: boolean; onCheckedChange: (on: boolean) => void; title?: string }) {
  return <MobileSwitchRow icon={Sun} title={title} checked={checked} onCheckedChange={onCheckedChange} />;
}
