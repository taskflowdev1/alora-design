import * as React from "react";
import { cn } from "@/lib/ad";
import { MobileLayer } from "@/components/mobile/mobile-sheet";

export const PHONE = { w: 390, h: 844, top: 47, bottom: 34, keyboard: 291 };

/** The status bar: time on the left, signal, Wi-Fi and battery on the right, in the screen's ink. */
function StatusBar() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[70] flex items-center justify-between px-[30px] pt-1.5 text-ink" style={{ height: PHONE.top }}>
      <span className="text-[16px] font-semibold tabular-nums">9:41</span>
      <span className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0" />
          <path d="M4 6.9a6 6 0 0 1 8 0" />
          <path d="M6.5 9.5a2.4 2.4 0 0 1 3 0" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="16" height="9" rx="2" fill="currentColor" />
          <path d="M25 4.5v4a2 2 0 0 0 0-4Z" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

/** A plain on-screen keyboard (letters, shift, delete, space, return), only to show what sits above it. */
function Keyboard() {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const key = "grid h-[42px] place-items-center rounded-[6px] bg-surface text-[20px] text-ink shadow-thumb";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[65] grid content-start gap-[11px] bg-fill-strong px-[3px] pt-2" style={{ height: PHONE.keyboard }}>
      {rows.map((r, i) => (
        <div key={r} className="flex justify-center gap-[6px]" style={{ paddingInline: i === 1 ? 19 : 0 }}>
          {i === 2 ? <span className={cn(key, "w-[42px] bg-fill")}>⇧</span> : null}
          {[...r].map((c) => (
            <span key={c} className={cn(key, "w-[32px]")}>
              {c}
            </span>
          ))}
          {i === 2 ? <span className={cn(key, "w-[42px] bg-fill")}>⌫</span> : null}
        </div>
      ))}
      <div className="flex gap-[6px] px-[3px]">
        <span className={cn(key, "w-[88px] bg-fill text-[16px]")}>123</span>
        <span className={cn(key, "flex-1 text-[16px]")}>space</span>
        <span className={cn(key, "w-[88px] bg-fill text-[16px]")}>search</span>
      </div>
    </div>
  );
}

export interface PhoneFrameProps {
  children: React.ReactNode;
  /** Draws the keyboard and sets --ad-keyboard, so bars and sheets that avoid it can be seen doing so. */
  keyboard?: boolean;
  className?: string;
  /** Largest scale; the frame also shrinks to fit its column. */
  maxScale?: number;
}

/**
 * A 390 × 844 phone screen for the docs: continuous rounded corners, a status bar and a home indicator, and the safe
 * areas a real phone reports (47 px top, 34 px bottom) as `--ad-safe-top` / `--ad-safe-bottom`. It is the containing
 * block for fixed bars and the mount point for sheets (MobileLayer), so everything stays inside the screen. It scales
 * down to fit narrow columns, never up.
 */
export function PhoneFrame({ children, keyboard = false, className, maxScale = 1 }: PhoneFrameProps) {
  const box = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(maxScale);
  const [screen, setScreen] = React.useState<HTMLDivElement | null>(null);
  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(Math.min(maxScale, el.clientWidth / PHONE.w));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxScale]);
  return (
    <div ref={box} data-phone-frame className={cn("mx-auto w-full min-w-0 [contain:inline-size]", className)} style={{ maxWidth: PHONE.w * maxScale, height: PHONE.h * scale }}>
      <div
        ref={setScreen}
        data-phone-screen
        className="relative overflow-hidden bg-page text-ink shadow-dialog [corner-shape:superellipse(1.6)]"
        style={
          {
            width: PHONE.w,
            height: PHONE.h,
            borderRadius: 52,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
            "--ad-safe-top": `${PHONE.top}px`,
            "--ad-safe-bottom": `${PHONE.bottom}px`,
            "--ad-keyboard": keyboard ? `${PHONE.keyboard}px` : "0px",
          } as React.CSSProperties
        }
      >
        <StatusBar />
        <MobileLayer.Provider value={screen}>
          <div className="absolute inset-0">{screen ? children : null}</div>
        </MobileLayer.Provider>
        {keyboard ? <Keyboard /> : null}
        <span aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 z-[70] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink" />
      </div>
    </div>
  );
}
