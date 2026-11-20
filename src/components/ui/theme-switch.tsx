import * as React from "react";
import { flushSync } from "react-dom";
import { Monitor, Moon, Sun } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Segmented } from "@/components/ui/segmented";

export type ThemeChoice = "system" | "light" | "dark";

// During the switch: no page transitions (every colour swaps at once), and the root's view-transition snapshots don't
// crossfade, so the only motion is the new theme's circle growing over the area that changes.
// The switch's own track sits outside the circle (`live`): its old picture is dropped and its live one shows at once, so
// the pill slides as usual instead of showing in two places while the circle passes.
const CSS = `.ad-theme-switch::view-transition-old(root), .ad-theme-switch::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
.ad-theme-switch::view-transition-group(ad-theme-live), .ad-theme-switch::view-transition-new(ad-theme-live) { animation: none; }
.ad-theme-switch::view-transition-old(ad-theme-live) { display: none; }`;

type VT = { ready: Promise<void>; finished: Promise<void>; skipTransition?: () => void };
type DocVT = Document & { startViewTransition?: (cb: () => void) => VT };
type Box = { left: number; top: number; right: number; bottom: number };

// One reveal at a time: a newer switch finishes the running one and owns the cleanup, so an older switch ending late
// can't take the `.ad-theme-switch` class (or the live name) away from it mid-reveal.
let running: VT | null = null;
let generation = 0;

/** The part of `within` that changes: when the switch itself sits inside it, the other children (the switch keeps its theme). */
function changedBox(within: Element | null | undefined, live: HTMLElement | null | undefined): Box {
  if (!within) return { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  const whole = within.getBoundingClientRect();
  if (!live || !within.contains(live) || within === live) return whole;
  let box: Box | null = null;
  for (const child of Array.from(within.children)) {
    if (child.contains(live) || child instanceof HTMLStyleElement) continue;
    const b = child.getBoundingClientRect();
    if (!b.width || !b.height) continue;
    box = box ? { left: Math.min(box.left, b.left), top: Math.min(box.top, b.top), right: Math.max(box.right, b.right), bottom: Math.max(box.bottom, b.bottom) } : b;
  }
  return box ?? whole;
}

/**
 * Applies a theme change so it spreads from a point: the new theme is revealed by a circle centred on `origin` (the
 * option you tapped) with the View Transitions API, over 500 ms at an even pace with soft ends. Pass `within` when only part
 * of the page changes (a preview box): the circle then starts at the box's nearest edge and ends at its far corner, so the
 * whole 500 ms is spent crossing the box at an even speed instead of crossing the gap first. `live` (the control you
 * pressed) skips the circle and shows its new state at once, so its own motion plays normally. A second pick during a
 * reveal finishes the first at once and starts its own, so the last pick always wins and nothing goes blank. Without the
 * API, or with reduced motion, it swaps instantly. Either way every CSS transition is off for the frames of the switch
 * (`.ad-theme-switch` on <html>).
 */
export function switchTheme(
  apply: () => void,
  origin?: { x: number; y: number },
  { within, live }: { within?: Element | null; live?: HTMLElement | null } = {},
) {
  const root = document.documentElement;
  const mine = ++generation;
  running?.skipTransition?.();
  running = null;
  const done = () =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (mine === generation) root.classList.remove("ad-theme-switch");
      }),
    );
  root.classList.add("ad-theme-switch");
  const doc = document as DocVT;
  if (!doc.startViewTransition || !origin || prefersReducedMotion()) {
    if (live) live.style.viewTransitionName = "";
    flushSync(apply);
    void getComputedStyle(root).backgroundColor;
    return done();
  }
  if (live) live.style.viewTransitionName = "ad-theme-live";
  const b = changedBox(within, live);
  const t = doc.startViewTransition(() => flushSync(apply));
  running = t;
  const { x, y } = origin;
  // From the nearest point of the box (0 when the origin is inside it) to its farthest corner.
  const r0 = Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
  const r1 = Math.hypot(Math.max(x - b.left, b.right - x), Math.max(y - b.top, b.bottom - y));
  t.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(${r0}px at ${x}px ${y}px)`, `circle(${r1}px at ${x}px ${y}px)`] },
        // Nearly linear in radius, so the area it covers grows evenly (a circle's area speeds up on its own); the
        // gentle start and end keep the edges soft. A strong ease-out covered the box in the first 60 % and then idled.
        { duration: 500, easing: "cubic-bezier(0.25, 0.25, 0.75, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
  t.finished
    .catch(() => {})
    .finally(() => {
      if (mine !== generation) return;
      running = null;
      if (live) live.style.viewTransitionName = "";
      done();
    });
}

export interface ThemeSwitchProps {
  value: ThemeChoice;
  /** Called inside the transition: set the theme synchronously here (state, class or URL). */
  onValueChange: (value: ThemeChoice) => void;
  /** Leave out "system" for a two-way switch. */
  system?: boolean;
  /** Icons only, with the names as accessible labels. */
  iconOnly?: boolean;
  /** When the switch themes only part of the page (a preview), that part: the circle crosses just it (minus the switch). */
  within?: React.RefObject<Element | null>;
  className?: string;
}

/**
 * System / Light / Dark on the segmented track. Picking one spreads the new theme out from that option, so you see what
 * caused the change; nothing else animates while it happens.
 */
export function ThemeSwitch({ value, onValueChange, system = true, iconOnly, within, className }: ThemeSwitchProps) {
  const point = React.useRef<{ x: number; y: number } | null>(null);
  const host = React.useRef<HTMLDivElement>(null);
  // During a reveal the browser hit-tests every pointer event to <html> (the snapshots cover the page), so a second pick
  // would be lost. Route a press on <html> that falls on one of our options to that option, so the last pick wins.
  React.useEffect(() => {
    const root = document.documentElement;
    const under = (e: MouseEvent) => {
      if (e.target !== root || !root.classList.contains("ad-theme-switch")) return null;
      return Array.from(host.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? []).find((el) => {
        const b = el.getBoundingClientRect();
        return e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
      });
    };
    const down = (e: PointerEvent) => {
      if (under(e)) point.current = { x: e.clientX, y: e.clientY };
    };
    const click = (e: MouseEvent) => under(e)?.click();
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("click", click, true);
    };
  }, []);
  const opts: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
    ...(system ? [{ value: "system" as const, label: "System", icon: Monitor }] : []),
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];
  return (
    <div
      ref={host}
      className={cn("inline-flex", className)}
      onPointerDownCapture={(e) => (point.current = { x: e.clientX, y: e.clientY })}
      onKeyDownCapture={() => (point.current = null)}
    >
      <style href="ad-theme-switch" precedence="default">
        {CSS}
      </style>
      <Segmented
        aria-label="Theme"
        value={value}
        options={opts.map((o) => ({
          value: o.value,
          "aria-label": iconOnly ? o.label : undefined,
          label: (
            <span className="inline-flex items-center gap-1.5 [&_svg]:size-[16px]">
              <o.icon />
              {iconOnly ? null : o.label}
            </span>
          ),
        }))}
        onValueChange={(v) => {
          // From the keyboard the change spreads from the focused option instead of the pointer.
          let o = point.current;
          if (!o && document.activeElement instanceof HTMLElement) {
            const b = document.activeElement.getBoundingClientRect();
            o = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
          }
          point.current = null;
          switchTheme(() => onValueChange(v), o ?? undefined, { within: within?.current, live: host.current });
        }}
      />
    </div>
  );
}
