import * as React from "react";
import { Dialog as D } from "radix-ui";
import { cn } from "@/lib/ad";

/**
 * Where phone overlays (sheets, action sheets, snackbars) mount. An app leaves it empty and they go to <body>; a phone
 * frame on a docs page passes its screen element so they stay inside the frame.
 */
export const MobileLayer = React.createContext<HTMLElement | null>(null);

/** A resting height: a fraction of the screen (0.5, 0.92) or "fit" (as tall as its content, up to 88 %). */
export type Detent = number | "fit";

export interface MobileSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  /** The title row; it is also a drag handle. Without one, pass aria-label. */
  title?: React.ReactNode;
  "aria-label"?: string;
  /** Heights it rests at, smallest first. Default ["fit"]. */
  detents?: Detent[];
  /** Which detent it opens at (index into detents). Default 0. */
  initialDetent?: number;
  children?: React.ReactNode;
  /** Full-width buttons pinned at the bottom of the sheet. */
  footer?: React.ReactNode;
  /** false: no card, no handle; the children draw their own groups (action sheets). */
  surface?: boolean;
  className?: string;
}

const SAFE_TOP = "var(--ad-safe-top, env(safe-area-inset-top, 0px))";
const SAFE_BOTTOM = "var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px))";
// Critically damped spring (no wobble) that starts from the release speed, so a throw carries on into the settle.
const W = 20;
// Closing settles about 25 % faster than opening (exits are quicker than entrances).
const W_CLOSE = 26;
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The phone's bottom sheet. It floats with a margin and full rounding, rises from the bottom and rests at its detents.
 * Drag the handle, the title row, or the content when it is scrolled to its top: it follows the finger 1:1, stretches
 * against a rubber band past the top detent (its bottom stays put), and on release a flick steps to the next detent
 * the way it was thrown, a slow drag settles on the nearest one, and a flick down from the smallest one closes it. Every move is a spring that keeps the release speed and can be grabbed again mid-flight.
 * Esc, the backdrop and a Close button close it too (the gesture is never the only way). It sits above the keyboard
 * (`--ad-keyboard`) and the home indicator, and contains its own scroll.
 */
export function MobileSheet({
  open: openProp,
  onOpenChange,
  trigger,
  title,
  detents = ["fit"],
  initialDetent = 0,
  children,
  footer,
  surface = true,
  className,
  ...aria
}: MobileSheetProps) {
  const layer = React.useContext(MobileLayer);
  const [own, setOwn] = React.useState(false);
  const open = openProp ?? own;
  const setOpen = React.useCallback((o: boolean) => (onOpenChange ? onOpenChange(o) : setOwn(o)), [onOpenChange]);
  const [mounted, setMounted] = React.useState(open);
  const sheet = React.useRef<HTMLDivElement>(null);
  const shade = React.useRef<HTMLDivElement>(null);
  const s = React.useRef({ y: 0, v: 0, t: 0, from: 0, on: false, raf: 0, stops: [0], closed: 600, flingV: 0, full: 0 });

  /**
   * y = how far below fully open. Between the detents the sheet changes height (its bottom and footer stay put, the
   * list inside scrolls); below the smallest detent it slides down whole; above the tallest it rides the rubber band.
   */
  const place = (y: number) => {
    const st = s.current;
    st.y = y;
    const el = sheet.current;
    if (el) {
      const low = st.stops[st.stops.length - 1];
      // Past the top the sheet stretches (bottom anchored, as native sheets do) instead of lifting off its rest.
      if (st.full && (st.stops.length > 1 || y < 0)) el.style.height = `${st.full - Math.min(y, low)}px`;
      else if (st.full) el.style.height = heightCss.current ?? "";
      el.style.maxHeight = y < 0 ? "none" : "";
      const shift = y > low ? y - low : 0;
      el.style.transform = `translate3d(0, ${shift}px, 0)`;
    }
    if (shade.current) {
      const top = s.current.stops[s.current.stops.length - 1];
      shade.current.style.opacity = String(Math.max(0, Math.min(1, 1 - (y - top) / Math.max(1, s.current.closed - top))));
    }
  };
  const animate = (to: number, v: number, done?: () => void, w = W) => {
    const st = s.current;
    cancelAnimationFrame(st.raf);
    if (reduced()) {
      place(to);
      return done?.();
    }
    const y0 = st.y - to;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = (now - t0) / 1000;
      const d = (y0 + (v + w * y0) * t) * Math.exp(-w * t);
      if (Math.abs(d) < 0.5 && t > 0.05) {
        place(to);
        return done?.();
      }
      place(to + d);
      st.raf = requestAnimationFrame(step);
    };
    st.raf = requestAnimationFrame(step);
  };
  /** Detent offsets (translateY from fully open), largest sheet first. */
  const measure = () => {
    const el = sheet.current;
    if (!el) return;
    const screen = layer?.clientHeight ?? window.innerHeight;
    // Measure at the tallest detent's own height (the CSS one), then put the sheet back where it was.
    el.style.height = heightCss.current ?? "";
    el.style.maxHeight = "";
    const full = el.offsetHeight;
    s.current.full = full;
    // The frame or app sets --ad-safe-top in px; on a device env() is used for layout and 0 is close enough here.
    const room = screen - (parseFloat(getComputedStyle(el).getPropertyValue("--ad-safe-top")) || 0) - 8;
    const heights = detents.map((d) => (d === "fit" ? full : Math.min(full, d * room)));
    s.current.stops = heights.map((h) => Math.max(0, full - h)).sort((a, b) => a - b);
    s.current.closed = full + 32;
    place(s.current.y);
  };

  /** Rise to the opening detent: from below the screen on first show, from wherever it is when re-opened mid-close. */
  const rise = (fresh: boolean) => {
    measure();
    const st = s.current;
    if (fresh) place(st.closed);
    animate(st.stops[Math.max(0, st.stops.length - 1 - initialDetent)], 0);
  };
  const riseRef = React.useRef(rise);
  riseRef.current = rise;
  // The portal attaches the sheet a frame after it mounts; start rising when the element exists.
  const attach = React.useCallback((el: HTMLDivElement | null) => {
    sheet.current = el;
    if (el) riseRef.current(true);
  }, []);
  React.useEffect(() => {
    if (open) {
      if (mounted && sheet.current) rise(false);
      else setMounted(true);
    } else if (mounted) animate(s.current.closed, s.current.flingV, () => setMounted(false), W_CLOSE);
    s.current.flingV = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  React.useEffect(() => () => cancelAnimationFrame(s.current.raf), []);

  // A closing sheet can't be grabbed: catching it mid-close would leave it on screen while its owner thinks it's shut.
  const begin = (clientY: number) => {
    const st = s.current;
    if (!open) return false;
    cancelAnimationFrame(st.raf);
    measure();
    Object.assign(st, { from: clientY - st.y, t: performance.now(), v: 0, on: true });
    return true;
  };
  const follow = (clientY: number) => {
    const st = s.current;
    if (!st.on) return;
    const raw = clientY - st.from;
    const top = st.stops[0];
    // Past the tallest detent the sheet pulls harder the further it goes.
    const y = raw >= top ? raw : top - (1 - 1 / (((top - raw) * 0.55) / 120 + 1)) * 120;
    const now = performance.now();
    st.v = st.v * 0.4 + ((y - st.y) / Math.max(1, now - st.t)) * 1000 * 0.6;
    st.t = now;
    place(y);
  };
  const release = () => {
    const st = s.current;
    if (!st.on) return;
    st.on = false;
    // A pause before letting go is no throw.
    const v = performance.now() - st.t > 90 ? 0 : st.v;
    const lowest = st.stops[st.stops.length - 1];
    // Project the throw about as far as UIKit does (v × 0.4 s), so a short flick still changes detent.
    const aim = st.y + v * 0.4;
    if (aim > lowest + 72 || (v > 900 && st.y > lowest - 8)) {
      st.flingV = v;
      return setOpen(false);
    }
    let to = st.stops.reduce((a, b) => (Math.abs(b - aim) < Math.abs(a - aim) ? b : a), st.stops[0]);
    // A real flick always moves one detent the way it was thrown, from the detent nearest where it was let go.
    if (Math.abs(v) > 500) {
      const here = st.stops.reduce((a, b) => (Math.abs(b - st.y) < Math.abs(a - st.y) ? b : a), st.stops[0]);
      const i = st.stops.indexOf(here);
      const next = st.stops[Math.max(0, Math.min(st.stops.length - 1, i + (v > 0 ? 1 : -1)))];
      if (v > 0 ? next > to : next < to) to = next;
    }
    animate(to, v);
  };
  const grab = {
    onPointerDown: (e: React.PointerEvent) => {
      if (begin(e.clientY)) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => follow(e.clientY),
    onPointerUp: release,
    onPointerCancel: () => {
      if (!s.current.on) return;
      s.current.on = false;
      animate(s.current.stops.reduce((a, b) => (Math.abs(b - s.current.y) < Math.abs(a - s.current.y) ? b : a)), 0);
    },
  };
  // Pulling the content down when it is already at its top drags the sheet (iOS and Material sheets do). The blocking
  // touchmove listener exists only while the content sits at its top, so scrolling a long list never waits on it.
  const fns = React.useRef({ begin, follow, release });
  fns.current = { begin, follow, release };
  const body = React.useRef<HTMLDivElement | null>(null);
  const bodyRef = React.useCallback((el: HTMLDivElement | null) => {
    const old = body.current as (HTMLDivElement & { _adOff?: () => void }) | null;
    old?._adOff?.();
    body.current = el;
    if (!el) return;
    let start: { x: number; y: number } | null = null;
    let dragging = false;
    let armed = false;
    const onStart = (e: TouchEvent) => {
      start = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
      dragging = false;
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0];
      const dy = t.clientY - start.y;
      if (!dragging && el.scrollTop <= 0 && dy > 6 && Math.abs(dy) > Math.abs(t.clientX - start.x)) dragging = fns.current.begin(t.clientY - dy);
      if (!dragging) return;
      e.preventDefault();
      fns.current.follow(t.clientY);
    };
    const onEnd = () => {
      if (dragging) fns.current.release();
      dragging = false;
      start = null;
      arm();
    };
    const arm = () => {
      const top = el.scrollTop <= 0;
      if (top && !armed) el.addEventListener("touchmove", onMove, { passive: false });
      if (!top && armed && !dragging) el.removeEventListener("touchmove", onMove);
      armed = top || (armed && dragging);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    el.addEventListener("scroll", arm, { passive: true });
    arm();
    (el as HTMLDivElement & { _adOff?: () => void })._adOff = () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      el.removeEventListener("scroll", arm);
      el.removeEventListener("touchmove", onMove);
    };
  }, []);

  const tallest = detents.reduce<number>((m, d) => (d === "fit" ? m : Math.max(m, d)), 0);
  const fit = detents.includes("fit");
  const heightCss = React.useRef<string | undefined>(undefined);
  heightCss.current = fit || !tallest ? undefined : `calc((100% - ${SAFE_TOP} - 8px - max(8px, ${SAFE_BOTTOM})) * ${tallest})`;
  return (
    <D.Root open={mounted} onOpenChange={(o) => !o && setOpen(false)} modal={!layer}>
      {trigger ? <D.Trigger asChild>{trigger}</D.Trigger> : null}
      <D.Portal container={layer ?? undefined}>
        <div ref={shade} aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-overlay opacity-0" />
        <D.Content
          ref={attach}
          aria-describedby={undefined}
          aria-label={title ? undefined : aria["aria-label"]}
          onOpenAutoFocus={(e) => {
            // No keyboard popping up on open (touch): focus the sheet itself.
            e.preventDefault();
            sheet.current?.focus({ preventScroll: true });
          }}
          onInteractOutside={(e) => layer && e.preventDefault()}
          style={{
            ["--ad-sheet-top" as string]: `calc(${SAFE_TOP} + 8px)`,
            transform: "translate3d(0, 120%, 0)",
            height: heightCss.current,
            maxHeight: `calc(100% - ${SAFE_TOP} - 16px - max(8px, ${SAFE_BOTTOM}, var(--ad-keyboard, 0px)))`,
            bottom: `max(8px, ${SAFE_BOTTOM}, calc(var(--ad-keyboard, 0px) + 8px))`,
          }}
          className={cn(
            "fixed inset-x-2 z-50 mx-auto flex max-w-[520px] flex-col text-ink outline-none will-change-transform",
            surface ? "rounded-sheet bg-surface shadow-dialog" : "gap-2",
            className,
          )}
        >
          {surface ? (
            <>
              {/* 24 px of strip, with a hit area that reaches 34 px under the title's top edge (it is a handle too). */}
              <div {...grab} className="relative z-10 -mb-[10px] flex h-[34px] shrink-0 cursor-grab touch-none justify-center pt-[14px] active:cursor-grabbing">
                <span aria-hidden className="h-[5px] w-9 rounded-full bg-fill-strong" />
              </div>
              {title ? (
                <D.Title {...grab} className="shrink-0 cursor-grab touch-none px-pad pb-2 pt-2 text-[17px] font-semibold active:cursor-grabbing">
                  {title}
                </D.Title>
              ) : (
                <D.Title className="sr-only">{aria["aria-label"]}</D.Title>
              )}
              <div ref={bodyRef} className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-pad", !footer && "pb-pad")}>
                {children}
              </div>
              {footer ? <div className="grid shrink-0 gap-2 p-pad [&>*]:h-touch [&>*]:w-full [&>*]:text-[15px]">{footer}</div> : null}
            </>
          ) : (
            <>
              <D.Title className="sr-only">{title ?? aria["aria-label"]}</D.Title>
              {children}
            </>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const MobileSheetClose = D.Close;
