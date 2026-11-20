import * as React from "react";
import { prefersReducedMotion } from "./ad";

// Shared React hooks for Alora Design components. Installed with lib/ad.ts (the same registry item), so any component
// may import them without adding a dependency.

export interface EdgeFadeOptions {
  /** Which edges fade: "y" (top and bottom, default), "x" (start and end) or "both". */
  axis?: "x" | "y" | "both";
  /** Fade length in px. */
  size?: number;
  /** false switches the hook off (a list that is only mounted while its pop-up is open). */
  enabled?: boolean;
  /** Also re-measure when the first child resizes (content that grows without the box growing). */
  observeChild?: boolean;
}

/**
 * Fades a scroll box's edges only where more content hides past them, so a list never looks cut off and never fades
 * when it isn't scrolled. Writes `mask-image` on the element itself (no re-render per scroll).
 */
export function useEdgeFade(ref: React.RefObject<HTMLElement | null>, { axis = "y", size = 16, enabled = true, observeChild = true }: EdgeFadeOptions = {}) {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const rtl = axis !== "y" && getComputedStyle(el).direction === "rtl";
    const measure = () => {
      const ys = axis !== "x" ? [el.scrollTop > 1, el.scrollTop + el.clientHeight < el.scrollHeight - 1] : [false, false];
      // scrollLeft is negative in RTL; the absolute value is the distance from the start edge either way.
      const left = Math.abs(el.scrollLeft);
      const xs = axis !== "y" ? [left > 1, left + el.clientWidth < el.scrollWidth - 1] : [false, false];
      // grey-ok: mask stops, not paint
      const maskOf = (dir: string, [a, b]: boolean[]) => `linear-gradient(${dir}, ${a ? "transparent" : "#000"}, #000 ${size}px, #000 calc(100% - ${size}px), ${b ? "transparent" : "#000"})`;
      const parts = [ys.some(Boolean) && maskOf("to bottom", ys), xs.some(Boolean) && maskOf(rtl ? "to left" : "to right", xs)].filter(Boolean) as string[];
      const mask = parts.join(", ");
      el.style.maskImage = mask;
      el.style.setProperty("-webkit-mask-image", mask);
      el.style.maskComposite = parts.length > 1 ? "intersect" : "";
      el.style.setProperty("-webkit-mask-composite", parts.length > 1 ? "source-in" : "");
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (observeChild && el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
      el.style.maskImage = "";
      el.style.removeProperty("-webkit-mask-image");
      el.style.maskComposite = "";
      el.style.removeProperty("-webkit-mask-composite");
    };
  }, [ref, axis, size, enabled, observeChild]);
}

/** An element's width in whole px, kept current as it resizes; 0 until measured. Attach the returned ref. */
export function useElementWidth<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [w, setW] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setW(Math.round(el.getBoundingClientRect().width));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Scrolls a horizontal track so its chosen item sits in the middle (or as near as the ends allow) whenever `dep`
 * changes. Smooth unless the user asked for less motion; the page itself never scrolls.
 */
export function useCenterSelected(trackRef: React.RefObject<HTMLElement | null>, selector: string, dep: unknown) {
  React.useEffect(() => {
    const el = trackRef.current;
    const on = el?.querySelector<HTMLElement>(selector);
    if (!el || !on) return;
    el.scrollTo({ left: Math.max(0, on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [trackRef, selector, dep]);
}

export interface PopupOpenOptions {
  /** Controlled open state; leave out for uncontrolled. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A close that arrives this soon after opening is ignored (ms). */
  guard?: number;
}

/**
 * Open state for a pop-up anchored to a trigger (popover, menu, picker). A double click on the trigger would open and
 * at once close it, flashing the panel for one frame; a close within `guard` ms of opening is ignored, so the panel
 * stays open. Pass `force` to close anyway (a pick inside the panel).
 */
export function usePopupOpen({ open, defaultOpen = false, onOpenChange, guard = 300 }: PopupOpenOptions = {}) {
  const [inner, setInner] = React.useState(defaultOpen);
  const openedAt = React.useRef(-Infinity);
  const value = open ?? inner;
  const change = React.useRef(onOpenChange);
  change.current = onOpenChange;
  const controlled = open !== undefined;
  const setOpen = React.useCallback(
    (next: boolean, force = false) => {
      const now = performance.now();
      if (next) openedAt.current = now;
      else if (!force && now - openedAt.current < guard) return;
      if (!controlled) setInner(next);
      change.current?.(next);
    },
    [controlled, guard],
  );
  return [value, setOpen] as const;
}

/**
 * True for `ms` after `open` turns true: a backdrop or shade can ignore the second tap of the double tap that opened it.
 * Returns a function, so the check reads the time of the tap, not of the render.
 */
export function useJustOpened(open: boolean, ms = 350) {
  const at = React.useRef(-Infinity);
  const was = React.useRef(false);
  if (open && !was.current) at.current = typeof performance === "undefined" ? 0 : performance.now();
  was.current = open;
  return React.useCallback(() => performance.now() - at.current < ms, [ms]);
}

/**
 * A callback that fires once per tap: calls within `ms` of the last accepted one are dropped, so a double tap on a
 * button that pushes a screen, approves or pays never runs twice. The handler can change between renders.
 */
export function useDoubleTapGuard<A extends unknown[]>(handler: ((...args: A) => void) | undefined, ms = 400) {
  const fn = React.useRef(handler);
  fn.current = handler;
  const last = React.useRef(-Infinity);
  return React.useCallback(
    (...args: A) => {
      const now = performance.now();
      if (now - last.current < ms) return;
      last.current = now;
      fn.current?.(...args);
    },
    [ms],
  );
}
