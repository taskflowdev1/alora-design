import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Shared helpers every Alora Design component may import. No React here: the hooks live in ad-hooks.ts.

// tailwind-merge that knows the Alora Design token names, so `rounded-card` overrides `rounded-control`.
const merge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["control", "item", "card", "sheet", "small"],
      text: ["small", "body", "title", "heading", "number"],
      spacing: ["control", "item", "row", "touch", "pad", "nest", "gap", "bubble", "bubble-sm"],
      shadow: ["card", "raised", "dialog", "sel", "thumb"],
      ease: ["ad", "ad-page"],
      animate: ["ad-pulse"],
    },
    // ad-press (base.css) is a transition: a later transition-* class replaces it, and it replaces an earlier one.
    classGroups: { transition: ["ad-press"] },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}

// Loading fills. In dark, fill sits too close to a surface at the pulse's low point, so it takes fill-strong. On a fill
// (an attention row, a filled square) pass onFill: the bar is fill-strong in both themes.
// The class names stay whole: Tailwind only generates the ones it can read in the source.
/** A pulsing block: thumbnails, checkboxes, chart bars. */
export const skeletonFill = (onFill?: boolean) => cn("animate-ad-pulse", onFill ? "bg-fill-strong" : "bg-fill dark:bg-fill-strong");
/** Loading text: keeps the text's exact box and draws one bar at letter height, so stacked lines keep their gap. */
export const skeletonText = (onFill?: boolean) => cn("ad-skel", onFill ? "after:bg-fill-strong" : "after:bg-fill dark:after:bg-fill-strong");
/** A removable chip inside a field. Surface, so it still reads when the field darkens or lightens on hover and focus. */
export const fieldChipClass =
  "inline-flex h-[calc(var(--ad-control-h)-var(--ad-nest)*2)] items-center gap-1 rounded-item bg-surface pl-bubble-sm pr-1 text-body text-ink shadow-sel";

/* ---------------------------------------------------------------- numbers */

/** The one locale for figures: "12.400.000", "48,2". Change it here and every component follows. */
export const LOCALE = "id-ID";

/** A figure in the house locale: `formatNumber(12400000)` = "12.400.000". */
export function formatNumber(n: number, options?: Intl.NumberFormatOptions) {
  return n.toLocaleString(LOCALE, options);
}

/** "Rp 12.400.000", with a no-break space so "Rp" never wraps away from its number in a narrow cell. */
export function formatRp(n: number) {
  return `Rp\u00a0${formatNumber(Math.round(n))}`;
}

export interface CompactOptions {
  /** Between the figure and its unit: a no-break space (default, for cards) or a plain space (chart axes). */
  space?: "nbsp" | " ";
  /**
   * "auto" (default): one decimal under 100, none from 100 up ("48,2 jt", "154 rb"); small values are rounded whole.
   * 1: always rounded to one decimal ("12,4 jt", "980 rb"); small values are printed as they are.
   */
  digits?: "auto" | 1;
}

/** Short Indonesian amounts: "48,2 jt", "1,2 M", "154 rb"; under 10.000 the full figure. */
export function formatCompact(n: number, { space = "nbsp", digits = "auto" }: CompactOptions = {}) {
  const gap = space === "nbsp" ? "\u00a0" : " ";
  const f = (v: number, unit: string) =>
    `${digits === 1 ? formatNumber(Math.round(v * 10) / 10) : formatNumber(v, { maximumFractionDigits: Math.abs(v) < 100 ? 1 : 0 })}${gap}${unit}`;
  const a = Math.abs(n);
  if (a >= 1e9) return f(n / 1e9, "M");
  if (a >= 1e6) return f(n / 1e6, "jt");
  if (a >= 1e4) return f(n / 1e3, "rb");
  return digits === 1 ? formatNumber(n) : formatNumber(Math.round(n));
}

/* ---------------------------------------------------------------- dates */

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** Weekday headers, Monday first, in three widths. */
export const WEEKDAYS_1 = ["M", "T", "W", "T", "F", "S", "S"];
export const WEEKDAYS_2 = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export const WEEKDAYS_3 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Local midnight of the same day. */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/** Local midnight `n` calendar days away (DST-safe: it counts days, not 24-hour steps). */
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Monday of the week `d` is in, at midnight. */
export const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/** Calendar days from `b` to `a`: 1 when `a` is tomorrow relative to `b`, -1 when it is yesterday. Times of day are ignored. */
export const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 864e5);

/**
 * The days of a Monday-first month grid for the month `view` is in, spilling into the months around it. `weeks` is 6
 * by default (42 days, so the grid never changes height between months) or "fit" for only the weeks the month touches.
 */
export function monthGrid(view: Date, weeks: number | "fit" = 6) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const n = weeks === "fit" ? Math.ceil((lead + new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()) / 7) : weeks;
  return Array.from({ length: n * 7 }, (_, i) => addDays(first, i - lead));
}

/** "7 Nov 2026". */
export function formatDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Today", "Yesterday", "Tomorrow", otherwise "7 Nov 2026". */
export function formatSmartDate(d: Date, now = new Date()) {
  const diff = dayDiff(d, now);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return formatDate(d);
}

/* ---------------------------------------------------------------- environment */

/** Phone safe areas. A frame (a phone mock-up) can set --ad-safe-* to stand in for the device's insets. */
export const SAFE_TOP = "var(--ad-safe-top, env(safe-area-inset-top, 0px))";
export const SAFE_BOTTOM = "var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px))";

/** True when the user asked for less motion. Safe to call on the server (false there). */
export const prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
