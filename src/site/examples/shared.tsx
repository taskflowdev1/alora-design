import * as React from "react";
import { useSearchParams } from "react-router";

export function useLoading() {
  const [params] = useSearchParams();
  return params.get("loading") === "1";
}

/** Names, ids and codes that a browser's page translation must leave alone. */
export const NoTranslate = ({ children }: { children: React.ReactNode }) => <span translate="no">{children}</span>;

export function useWide(query = "(min-width: 1280px)") {
  const [on, setOn] = React.useState(() => typeof matchMedia === "function" && matchMedia(query).matches);
  React.useEffect(() => {
    const m = matchMedia(query);
    const set = () => setOn(m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, [query]);
  return on;
}

/** The side pane starts under the site header (h-16, plus the h-11 tab row below lg), so search and the theme button stay usable. */
export const PANE_CLASS = "sm:top-[calc(4rem+2.75rem+0.75rem)] lg:top-[calc(4rem+0.75rem)]";

/**
 * Where there is room beside the open side pane (xl and up), the table's card ends where the pane starts, so the
 * selected row's money stays in view instead of under the pane.
 */
export function usePaneRoom(open: boolean, selector: string) {
  const wide = useWide();
  const [room, setRoom] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el || !open || !wide) return setRoom(0);
    const paneLeft = document.documentElement.clientWidth - 12 - 440;
    // Measured without the current margin, so a second open (another row) gives the same answer.
    const right = el.getBoundingClientRect().right + (parseFloat(el.style.marginRight) || 0);
    setRoom(Math.max(0, Math.round(right - paneLeft + 12)));
  }, [open, wide, selector]);
  return room;
}
