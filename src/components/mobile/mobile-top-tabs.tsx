import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { useCenterSelected } from "@/lib/ad-hooks";

/** The pager tells its tabs how far it is scrolled (page index, fractional), so the pill can ride along mid-swipe. */
const PROGRESS = "ad-tab-progress";
const hub = (el: HTMLElement | null) => el?.closest<HTMLElement>("[data-mobile-screen]") ?? (typeof document === "undefined" ? null : document);

export interface TopTab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface MobileTopTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  tabs: TopTab<T>[];
  "aria-label": string;
  className?: string;
}

/**
 * Tabs at the top of a phone screen when there are more than a segmented control holds: one track that scrolls
 * sideways, a raised pill that slides to the tab you pick (and the track scrolls it into view). Pair it with
 * MobileTabPager so the content under it can be swiped too; the two stay in step, and while you swipe the pages the
 * pill moves with your finger, between the two tabs, then lands when the page settles.
 */
export function MobileTopTabs<T extends string>({ value, onValueChange, tabs, className, ...aria }: MobileTopTabsProps<T>) {
  const track = React.useRef<HTMLDivElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const [rects, setRects] = React.useState<{ left: number; width: number }[]>([]);
  const [drag, setDrag] = React.useState<number | null>(null);
  const index = Math.max(0, tabs.findIndex((t) => t.value === value));
  const labels = tabs.map((t) => `${t.label}${t.count ?? ""}`).join("|");
  React.useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => setRects([...el.querySelectorAll<HTMLElement>("[data-tab]")].map((b) => ({ left: b.offsetLeft, width: b.offsetWidth })));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [labels]);
  React.useEffect(() => {
    const h = hub(track.current);
    if (!h) return;
    const on = (e: Event) => setDrag((e as CustomEvent<number | null>).detail);
    h.addEventListener(PROGRESS, on);
    return () => h.removeEventListener(PROGRESS, on);
  }, []);
  const p = Math.max(0, Math.min(tabs.length - 1, drag ?? index));
  const a = rects[Math.floor(p)];
  const b = rects[Math.ceil(p)] ?? a;
  const f = p - Math.floor(p);
  const pill = a ? { left: a.left + (b.left - a.left) * f, width: a.width + (b.width - a.width) * f } : null;
  useCenterSelected(track, '[aria-selected="true"]', value);
  return (
    <div ref={track} className={cn("-mx-pad overflow-x-auto overscroll-x-contain px-pad [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <div
        ref={list}
        role="tablist"
        aria-label={aria["aria-label"]}
        className="group/tl relative flex w-max min-w-full rounded-control bg-track p-nest"
        onKeyDown={(e) => {
          const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          const i = tabs.findIndex((t) => t.value === value);
          const next = tabs[(i + d + tabs.length) % tabs.length];
          onValueChange(next.value);
          (e.currentTarget.querySelector(`[data-tab="${next.value}"]`) as HTMLElement | null)?.focus();
        }}
      >
        {pill ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-nest rounded-[calc(var(--ad-radius-control)-var(--ad-nest))] bg-sel shadow-sel group-has-[:focus-visible]/tl:bg-ink-muted motion-reduce:transition-none"
            style={{ left: pill.left, width: pill.width, transition: drag != null ? "none" : "left 300ms var(--ad-ease), width 300ms var(--ad-ease)" }}
          />
        ) : null}
        {tabs.map((t) => {
          const on = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              data-tab={t.value}
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onValueChange(t.value)}
              className={cn(
                "relative flex h-touch min-w-touch flex-1 shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--ad-radius-control)-var(--ad-nest))] px-3.5 text-[15px] ad-press active:scale-[0.97] data-pressed:scale-[0.97]",
                on ? "font-medium text-ink focus-visible:text-surface" : "text-ink-muted",
              )}
            >
              <span className="ad-hold">
                <span aria-hidden>{t.label}</span>
                <span>{t.label}</span>
              </span>
              {t.count != null ? <span className={cn("font-normal tabular-nums text-ink-muted", on && "in-focus-visible:text-surface")}>{t.count}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface MobileTabPagerProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  pages: { value: T; content: React.ReactNode }[];
  className?: string;
}

/**
 * The content under top tabs, one page per tab, side by side: swipe sideways to change tab (native scroll snap, so a
 * flick glides to the next page), and picking a tab scrolls its page in. The screen still scrolls up and down. Only a
 * swipe drives the tabs' pill; a scroll the pager runs itself (after a tap on a tab) leaves the pill to its own slide.
 */
export function MobileTabPager<T extends string>({ value, onValueChange, pages, className }: MobileTabPagerProps<T>) {
  const track = React.useRef<HTMLDivElement>(null);
  const settle = React.useRef(0);
  const own = React.useRef(false);
  const auto = React.useRef(false);
  const index = pages.findIndex((p) => p.value === value);
  React.useEffect(() => {
    const el = track.current;
    if (!el || own.current) return void (own.current = false);
    const left = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) < 1) return;
    auto.current = true;
    el.scrollTo({ left, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [index]);
  const mine = () => void (auto.current = false);
  return (
    <div
      ref={track}
      onPointerDown={mine}
      onTouchStart={mine}
      onWheel={mine}
      onScroll={(e) => {
        const el = e.currentTarget;
        if (!auto.current) hub(el)?.dispatchEvent(new CustomEvent(PROGRESS, { detail: el.scrollLeft / el.clientWidth }));
        window.clearTimeout(settle.current);
        settle.current = window.setTimeout(() => {
          if (auto.current) return void (auto.current = false);
          hub(el)?.dispatchEvent(new CustomEvent(PROGRESS, { detail: null }));
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (pages[i] && i !== index) {
            own.current = true;
            onValueChange(pages[i].value);
          }
        }, 90);
      }}
      className={cn("flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
    >
      {pages.map((p) => (
        <div key={p.value} role="tabpanel" aria-hidden={p.value !== value} className="w-full shrink-0 snap-start snap-always">
          {p.content}
        </div>
      ))}
    </div>
  );
}
