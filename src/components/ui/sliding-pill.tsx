import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

export interface SlidingPillProps {
  /**
   * CSS selector for the selected option inside the parent, e.g. `[aria-checked="true"]`, `[data-state="active"]`,
   * `[aria-current="page"]`. The parent must be positioned (`relative`); options that should sit above the pill need
   * `relative` too.
   */
  selector: string;
  /** Fill and radius of the pill: `bg-sel shadow-sel rounded-item` in a track, `bg-fill-strong rounded-control` on a surface. */
  className?: string;
}

type Box = { x: number; y: number; w: number; h: number };
const KEYS = ["x", "y", "w", "h"] as const;
// Attributes that mark the chosen option across our components and Radix. The pill's own style is never watched.
const WATCH = ["aria-checked", "aria-selected", "aria-current", "aria-pressed", "data-state", "data-active", "class"];
// Spring (mass 1): stiff enough to land in about 250 ms, damped just under critical so it settles without a wobble.
const K = 520;
const C = 2 * Math.sqrt(K) * 0.9;

/** Layout box of `el` relative to `host`, ignoring transforms (a pressed option's scale never moves the pill). */
function boxIn(el: HTMLElement, host: HTMLElement): Box | null {
  if (!el.offsetWidth || !el.offsetHeight) return null;
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== host) {
    x += n.offsetLeft;
    y += n.offsetTop;
    const p = n.offsetParent as HTMLElement | null;
    if (p && p !== host) {
      x -= p.scrollLeft;
      y -= p.scrollTop;
    }
    n = p;
  }
  return n === host ? { x, y, w: el.offsetWidth, h: el.offsetHeight } : null;
}

/**
 * The selected fill of a one-of-N picker (segmented, tabs, single toggle group, nav, pagination…). When the choice
 * changes it slides from the old option to the new one on a spring; a second change mid-flight carries the current
 * speed into the new target, so it never restarts or jumps. The first paint, resizes and font loads place it without
 * motion, and keyboard changes and reduced motion place it instantly. Measured with offsetLeft/offsetTop, so it also holds in RTL.
 */
export function SlidingPill({ selector, className }: SlidingPillProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const pill = ref.current;
    const host = pill?.parentElement;
    if (!pill || !host) return;
    let cur: Box | null = null;
    let target: Box | null = null;
    let active: HTMLElement | null = null;
    const vel: Box = { x: 0, y: 0, w: 0, h: 0 };
    let raf = 0;
    let last = 0;
    // Keyboard changes land instantly (key repeat would outrun any slide); pointer changes slide.
    let keyAt = -Infinity;
    const onKey = () => (keyAt = performance.now());

    const paint = (b: Box | null) => {
      if (!b) {
        pill.style.opacity = "0";
        return;
      }
      pill.style.opacity = "";
      pill.style.width = `${b.w}px`;
      pill.style.height = `${b.h}px`;
      pill.style.transform = `translate(${b.x}px, ${b.y}px)`;
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      KEYS.forEach((k) => (vel[k] = 0));
    };
    const tick = (now: number) => {
      if (!cur || !target) return stop();
      // At most 25 ms per frame: a long frame (the change that moved the choice also restyled the page, as a theme
      // switch does) would otherwise jump the pill half way in one step. 60 Hz frames run in real time.
      let dt = Math.min(0.025, (now - last) / 1000);
      last = now;
      // Small fixed steps keep the spring stable on slow frames.
      while (dt > 0) {
        const h = Math.min(dt, 1 / 240);
        for (const k of KEYS) {
          vel[k] += (-K * (cur[k] - target[k]) - C * vel[k]) * h;
          cur[k] += vel[k] * h;
        }
        dt -= h;
      }
      if (KEYS.every((k) => Math.abs(cur![k] - target![k]) < 0.25 && Math.abs(vel[k]) < 4)) {
        cur = { ...target };
        paint(cur);
        return stop();
      }
      paint(cur);
      raf = requestAnimationFrame(tick);
    };
    const ro = new ResizeObserver(() => measure());
    const measure = () => {
      const el = host.querySelector<HTMLElement>(selector);
      const moved = el !== active;
      if (moved) {
        active = el;
        ro.disconnect();
        ro.observe(host);
        if (el) ro.observe(el);
      }
      target = el ? boxIn(el, host) : null;
      if (!target) {
        stop();
        cur = null;
        return paint(null);
      }
      // Slide only when the choice changed (or is already sliding); a first paint, resize or font load just places it.
      if (!cur || prefersReducedMotion() || (!moved && !raf) || (moved && performance.now() - keyAt < 300)) {
        stop();
        cur = { ...target };
        return paint(cur);
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    // Keyboard focus on the chosen option darkens the pill a little (data-focus): a selected item has no further hover
    // step, so without this a keyboard user tabbing onto it would see nothing change.
    const focus = () => {
      const el = host.querySelector<HTMLElement>(selector);
      pill.toggleAttribute("data-focus", !!el && el.matches(":focus-visible"));
    };
    measure();
    focus();
    const mo = new MutationObserver((records) => {
      if (records.some((r) => r.target !== pill)) {
        measure();
        focus();
      }
    });
    mo.observe(host, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: WATCH });
    host.addEventListener("keydown", onKey);
    host.addEventListener("focusin", focus);
    host.addEventListener("focusout", focus);
    const fonts = document.fonts;
    fonts?.addEventListener?.("loadingdone", measure);
    fonts?.ready.then(measure).catch(() => {});
    return () => {
      stop();
      ro.disconnect();
      mo.disconnect();
      host.removeEventListener("keydown", onKey);
      host.removeEventListener("focusin", focus);
      host.removeEventListener("focusout", focus);
      fonts?.removeEventListener?.("loadingdone", measure);
    };
  }, [selector]);
  // The focus notch lands at once (data-[focus]:duration-0) and fades out when focus leaves.
  return (
    <span
      ref={ref}
      aria-hidden
      data-sliding-pill
      className={cn(
        "pointer-events-none absolute left-0 top-0 transition-[filter] duration-[150ms] ease-ad data-[focus]:brightness-[0.88] data-[focus]:duration-0 dark:data-[focus]:brightness-[0.78]",
        className,
      )}
    />
  );
}

/**
 * A label laid out twice in one cell, the hidden copy at medium weight, so an option turning medium when chosen never
 * changes its width or moves its neighbours (and the pill under it). Uses `.ad-hold` from the theme.
 */
export function HoldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="ad-hold">
      <span aria-hidden>{children}</span>
      <span>{children}</span>
    </span>
  );
}
