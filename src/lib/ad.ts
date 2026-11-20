import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge that knows the Alora Design token names, so `rounded-card` overrides `rounded-control`.
const merge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["control", "item", "card", "sheet", "small"],
      text: ["small", "body", "title", "heading", "number"],
      spacing: ["control", "item", "row", "touch", "pad", "nest", "gap", "bubble", "bubble-sm"],
      shadow: ["card", "raised", "dialog", "sel", "thumb"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}

/** "7 Nov 2026". */
export function formatDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Today", "Yesterday", "Tomorrow", otherwise "7 Nov 2026". */
export function formatSmartDate(d: Date, now = new Date()) {
  const day = (x: Date) => Math.floor(new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime() / 864e5);
  const diff = day(d) - day(now);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return formatDate(d);
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Rp 12.400.000", with a no-break space so "Rp" never wraps away from its number in a narrow cell. */
export function formatRp(n: number) {
  return `Rp\u00a0${Math.round(n).toLocaleString("id-ID")}`;
}
