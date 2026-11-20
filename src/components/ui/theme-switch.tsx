import * as React from "react";
import { flushSync } from "react-dom";
import { Monitor, Moon, Sun } from "react-feather";
import { cn } from "@/lib/ad";
import { Segmented } from "@/components/ui/segmented";

export type ThemeChoice = "system" | "light" | "dark";

// During the switch: no page transitions (every colour swaps at once), and the root's view-transition snapshots don't
// crossfade, so the only motion is the new theme's circle growing out of the option you picked.
const CSS = `.ad-theme-switch::view-transition-old(root), .ad-theme-switch::view-transition-new(root) { animation: none; mix-blend-mode: normal; }`;

type VT = { ready: Promise<void>; finished: Promise<void> };
type DocVT = Document & { startViewTransition?: (cb: () => void) => VT };

/**
 * Applies a theme change so it spreads from a point: the new theme is revealed by a circle growing from `origin` (the
 * option you tapped) with the View Transitions API, under 300 ms. Without the API, or with reduced motion, it swaps
 * instantly. Either way every CSS transition is off for the frames of the switch (`.ad-theme-switch` on <html>).
 */
export function switchTheme(apply: () => void, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  const done = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("ad-theme-switch")));
  root.classList.add("ad-theme-switch");
  const doc = document as DocVT;
  if (!doc.startViewTransition || !origin || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    flushSync(apply);
    void getComputedStyle(root).backgroundColor;
    return done();
  }
  const t = doc.startViewTransition(() => flushSync(apply));
  const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
  t.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 280, easing: "cubic-bezier(0.32, 0.72, 0, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
  t.finished.finally(done);
}

export interface ThemeSwitchProps {
  value: ThemeChoice;
  /** Called inside the transition: set the theme synchronously here (state, class or URL). */
  onValueChange: (value: ThemeChoice) => void;
  /** Leave out "system" for a two-way switch. */
  system?: boolean;
  /** Icons only, with the names as accessible labels. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * System / Light / Dark on the segmented track. Picking one spreads the new theme out from that option, so you see what
 * caused the change; nothing else animates while it happens.
 */
export function ThemeSwitch({ value, onValueChange, system = true, iconOnly, className }: ThemeSwitchProps) {
  const point = React.useRef<{ x: number; y: number } | null>(null);
  const opts: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
    ...(system ? [{ value: "system" as const, label: "System", icon: Monitor }] : []),
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];
  return (
    <div
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
          switchTheme(() => onValueChange(v), o ?? undefined);
        }}
      />
    </div>
  );
}
