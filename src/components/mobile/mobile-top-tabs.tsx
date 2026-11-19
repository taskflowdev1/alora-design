import * as React from "react";
import { cn } from "@/lib/ad";
import { SlidingPill } from "@/components/ui/sliding-pill";

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
 * MobileTabPager so the content under it can be swiped too; the two stay in step.
 */
export function MobileTopTabs<T extends string>({ value, onValueChange, tabs, className, ...aria }: MobileTopTabsProps<T>) {
  const track = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = track.current;
    const on = el?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!el || !on) return;
    el.scrollTo({ left: Math.max(0, on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [value]);
  return (
    <div ref={track} className={cn("-mx-pad overflow-x-auto overscroll-x-contain px-pad [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <div
        role="tablist"
        aria-label={aria["aria-label"]}
        className="relative flex w-max min-w-full rounded-control bg-track p-nest"
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
        <SlidingPill selector='[aria-selected="true"]' className="rounded-[calc(var(--ad-radius-control)-var(--ad-nest))] bg-sel shadow-sel" />
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
                "relative flex h-touch min-w-touch flex-1 shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--ad-radius-control)-var(--ad-nest))] px-3.5 text-[15px] [-webkit-tap-highlight-color:transparent] transition-[color,transform] duration-[150ms] ease-ad active:scale-[0.96]",
                on ? "font-medium text-ink" : "text-ink-muted",
              )}
            >
              <span className="ad-hold">
                <span aria-hidden>{t.label}</span>
                <span>{t.label}</span>
              </span>
              {t.count != null ? <span className="font-normal tabular-nums text-ink-muted">{t.count}</span> : null}
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
 * flick glides to the next page), and picking a tab scrolls its page in. The screen still scrolls up and down.
 */
export function MobileTabPager<T extends string>({ value, onValueChange, pages, className }: MobileTabPagerProps<T>) {
  const track = React.useRef<HTMLDivElement>(null);
  const settle = React.useRef(0);
  const own = React.useRef(false);
  const index = pages.findIndex((p) => p.value === value);
  React.useEffect(() => {
    const el = track.current;
    if (!el || own.current) return void (own.current = false);
    el.scrollTo({ left: index * el.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [index]);
  return (
    <div
      ref={track}
      onScroll={(e) => {
        const el = e.currentTarget;
        window.clearTimeout(settle.current);
        settle.current = window.setTimeout(() => {
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
