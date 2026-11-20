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
function Keyboard({ returnKey }: { returnKey: string }) {
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
        <span className={cn(key, "w-[88px] bg-fill text-[16px]")}>{returnKey}</span>
      </div>
    </div>
  );
}

// Touch press feedback. CSS :active is unreliable under a finger: iOS Safari applies it only where a touch listener
// exists, Chrome waits to see whether the touch becomes a scroll, and either way a quick tap ends it before a 150 ms
// press has drawn. One document-level tracker sets `data-pressed` on the pressed control instead: shown 50 ms after
// touch-down (so a scroll that starts on a row doesn't flash it), at once on a quick release, kept at least 120 ms, and
// dropped as soon as the finger moves or the browser takes the gesture. Components pair each `active:` class with a
// `data-pressed:` twin. It only sets an attribute: no click is synthesised, so nothing can fire twice.
const PRESSABLE = "button, a[href], label, summary, [role=button], [role=tab], [role=option], [role=radio], [role=menuitem], [role=menuitemradio], [role=checkbox], [role=switch], [role=link]";
let pressInstalled = false;

function installPressFeedback() {
  if (pressInstalled || typeof document === "undefined") return;
  pressInstalled = true;
  let el: HTMLElement | null = null;
  let x = 0;
  let y = 0;
  let showTimer = 0;
  let shownAt = 0;
  const show = () => {
    if (!el) return;
    el.setAttribute("data-pressed", "");
    shownAt = performance.now();
  };
  const clear = () => {
    window.clearTimeout(showTimer);
    el?.removeAttribute("data-pressed");
    el = null;
  };
  const opts = { capture: true, passive: true } as const;
  document.addEventListener(
    "pointerdown",
    (e) => {
      clear();
      if (e.pointerType === "mouse" || !e.isPrimary) return;
      const t = (e.target as Element | null)?.closest?.<HTMLElement>(PRESSABLE);
      if (!t || t.matches(":disabled, [aria-disabled=true], [data-disabled]")) return;
      el = t;
      x = e.clientX;
      y = e.clientY;
      showTimer = window.setTimeout(show, 50);
    },
    opts,
  );
  document.addEventListener("pointermove", (e) => el && e.isPrimary && Math.hypot(e.clientX - x, e.clientY - y) > 10 && clear(), opts);
  document.addEventListener("pointercancel", clear, opts);
  document.addEventListener("scroll", clear, opts);
  document.addEventListener(
    "pointerup",
    (e) => {
      if (!el || !e.isPrimary) return;
      window.clearTimeout(showTimer);
      if (!el.hasAttribute("data-pressed")) show();
      const held = el;
      el = null;
      // A second press on the same control before this runs keeps its own state.
      window.setTimeout(() => el !== held && held.removeAttribute("data-pressed"), Math.max(0, 120 - (performance.now() - shownAt)));
    },
    opts,
  );
}

/** Installs the touch press tracker once per page (idempotent). PhoneFrame calls it; so does any full-screen phone app. */
export function usePressFeedback() {
  React.useEffect(installPressFeedback, []);
}

interface PhoneFrameProps {
  children: React.ReactNode;
  /** Draws the keyboard and sets --ad-keyboard, so bars and sheets that avoid it can be seen doing so. */
  keyboard?: boolean;
  /** The keyboard's return key, as the focused field would set it (enterkeyhint). */
  returnKey?: "return" | "send" | "search" | "done" | "go";
  className?: string;
  /** Largest scale; the frame also shrinks to fit its column. */
  maxScale?: number;
  /**
   * No frame at all: the app fills its parent with the device's own safe areas and keyboard, and overlays mount on
   * <body> (a phone viewing the app full screen). The element tree stays the same, so switching it on a resize keeps the
   * app (and its stack) mounted.
   */
  bare?: boolean;
}

/**
 * A 390 × 844 phone screen for the docs: continuous rounded corners, a status bar and a home indicator, and the safe
 * areas a real phone reports (47 px top, 34 px bottom) as `--ad-safe-top` / `--ad-safe-bottom`. It is the containing
 * block for fixed bars and the mount point for sheets (MobileLayer), so everything stays inside the screen. It scales
 * down to fit narrow columns, never up. `bare` drops the frame and keeps only the app.
 */
export function PhoneFrame({ children, keyboard = false, returnKey = "return", className, maxScale = 1, bare = false }: PhoneFrameProps) {
  usePressFeedback();
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
    <div
      ref={box}
      data-phone-frame={bare ? undefined : ""}
      className={bare ? "contents" : cn("mx-auto w-full min-w-0 [contain:inline-size]", className)}
      style={bare ? undefined : { maxWidth: PHONE.w * maxScale, height: PHONE.h * scale }}
    >
      <div
        ref={setScreen}
        data-phone-screen={bare ? undefined : ""}
        className={bare ? "contents" : "relative overflow-hidden bg-page text-ink shadow-dialog [corner-shape:superellipse(1.6)]"}
        style={
          bare ? undefined : {
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
        {bare ? null : <StatusBar />}
        <MobileLayer.Provider value={bare ? null : screen}>
          <div className="absolute inset-0">{screen ? children : null}</div>
        </MobileLayer.Provider>
        {keyboard && !bare ? <Keyboard returnKey={returnKey} /> : null}
        {bare ? null : <span aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 z-[70] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink" />}
      </div>
    </div>
  );
}
