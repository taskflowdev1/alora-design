import * as React from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router";
import { ArrowDownRight, ArrowUpRight } from "react-feather";
import { cn, formatCompact, formatNumber } from "@/lib/ad";
import { useEdgeFade, useMediaQuery } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/card";
import { MobileFab } from "@/components/mobile/mobile-action-bar";
import { MobileStatTile } from "@/components/mobile/mobile-stats";

export function useLoading() {
  const [params] = useSearchParams();
  return params.get("loading") === "1";
}

/** Names, ids and codes that a browser's page translation must leave alone. */
export const NoTranslate = ({ children }: { children: React.ReactNode }) => <span translate="no">{children}</span>;

export const useWide = (query = "(min-width: 1280px)") => useMediaQuery(query);

/** The page's one primary action: a button in the header row; where the tab bar shows, the floating button above it. */
export function PrimaryAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number | string }>; label: string; onClick: () => void }) {
  const docked = useWide("(min-width: 1024px)");
  return docked ? (
    <Button variant="primary" onClick={onClick}>
      <Icon />
      {label}
    </Button>
  ) : (
    createPortal(<MobileFab icon={Icon} label={label} iconOnly onClick={onClick} />, document.body)
  );
}

/** Rp as its small muted unit, on the number's baseline. */
export const Rp = ({ children }: { children: React.ReactNode }) => (
  <span className="whitespace-nowrap tabular-nums">
    <span className="mr-1 text-[0.8em] font-normal text-ink-muted">Rp</span>
    {children}
  </span>
);

export interface Metric {
  label: string;
  value: number;
  unit?: "Rp";
  delta?: { value: string; direction: "up" | "down" };
  primary?: boolean;
}

/**
 * A page's numbers, right under its header. Desktop: one row of metric cards. Phone: one row of small tiles you swipe,
 * each snapping to the page's edge with the next one peeking in, so they take one line instead of a screen.
 */
export function Metrics({ items, loading }: { items: Metric[]; loading?: boolean }) {
  const phone = useMediaQuery("(max-width: 767.98px)");
  const track = React.useRef<HTMLDivElement>(null);
  useEdgeFade(track, { axis: "x", size: 16, enabled: phone });
  if (!phone) {
    return (
      <div className="flex flex-wrap gap-4">
        {items.map((m) => (
          <MetricCard key={m.label} loading={loading} primary={m.primary} label={m.label} unit={m.unit} value={m.value} delta={m.delta} />
        ))}
      </div>
    );
  }
  return (
    <div ref={track} className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-gap overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
      {items.map((m) => (
        <MobileStatTile
          key={m.label}
          loading={loading}
          label={m.label}
          className={cn("shrink-0 snap-start", m.delta ? "w-[208px]" : m.unit ? "w-[152px]" : "w-[108px]")}
          value={
            <>
              {m.unit ? <Rp>{formatCompact(m.value)}</Rp> : formatNumber(m.value)}
              {m.delta ? (
                <span className="ml-2 inline-flex items-center gap-0.5 text-small font-medium text-ink-muted">
                  {m.delta.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {m.delta.value}
                </span>
              ) : null}
            </>
          }
        />
      ))}
    </div>
  );
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
    const right = el.getBoundingClientRect().right + (parseFloat(el.style.marginRight) || 0);
    setRoom(Math.max(0, Math.round(right - paneLeft + 12)));
  }, [open, wide, selector]);
  return room;
}
