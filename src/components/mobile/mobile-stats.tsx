import * as React from "react";
import { ChevronRight } from "react-feather";
import { cn, prefersReducedMotion, skeletonText } from "@/lib/ad";
import { ScrubHold } from "./mobile-scrub-chart";


export interface MobileStatTileProps {
  label: string;
  value: React.ReactNode;
  /** The tile opens more (a report, a filtered list): it presses and shows a chevron. */
  onClick?: () => void;
  /** The same box with pulsing text, so nothing moves when the number lands. */
  loading?: boolean;
  className?: string;
}

/**
 * One number on a phone: a plain grey label and the number under it (24 px, semibold, tabular). No icon, no caption,
 * no colour. Tiles in a MobileStatGrid share one height. A tile that opens something presses like a row.
 */
export function MobileStatTile({ label, value, onClick, loading, className }: MobileStatTileProps) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-1 text-[13px] text-ink-muted">
        <span className="truncate">{label}</span>
        {onClick ? <ChevronRight size={16} className="-mr-1 shrink-0" /> : null}
      </span>
      <span className={cn("w-fit max-w-full truncate text-[24px] font-semibold leading-tight tabular-nums text-ink", loading && skeletonText())}>{value}</span>
    </>
  );
  const box = cn("grid min-w-0 content-between gap-1 rounded-card bg-surface p-pad text-left shadow-card", className);
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(box, "cursor-pointer touch-manipulation ad-press focus-visible:bg-fill active:scale-[0.97] data-pressed:scale-[0.97]")}
    >
      {body}
    </button>
  ) : (
    <div className={box}>{body}</div>
  );
}

/** Stat tiles two to a row with the standard gap; every tile in a row the same height. */
export function MobileStatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid auto-rows-fr grid-cols-2 gap-gap", className)}>{children}</div>;
}

export interface MobileKpiCardProps {
  label: string;
  value: React.ReactNode;
  /** One chart (a scrub chart, a sparkline). */
  children?: React.ReactNode;
  className?: string;
}

/** A card in a KPI carousel: label, number, and at most one chart. */
export function MobileKpiCard({ label, value, children, className }: MobileKpiCardProps) {
  return (
    <section className={cn("grid content-start gap-1 rounded-card bg-surface p-pad shadow-card", className)}>
      <h3 className="text-[13px] font-normal text-ink-muted">{label}</h3>
      <p className="text-[24px] font-semibold leading-tight tabular-nums text-ink">{value}</p>
      {children ? <div className="pt-2">{children}</div> : null}
    </section>
  );
}

/**
 * A few KPI cards you swipe through: each card snaps into place (native scroll snap, so a flick glides), the next one
 * peeks in at the edge so it's clear there is more, and the dots under it say where you are. Tapping a dot goes to its
 * card (the swipe always has a tap twin). Cards hold their own content (MobileKpiCard or a scrub chart card). A
 * scrub chart inside a card reads only after a press-and-hold, so a swipe that starts on it still pages.
 */
export function MobileKpiCarousel({ children, className, ...aria }: { children: React.ReactNode; className?: string; "aria-label": string }) {
  const track = React.useRef<HTMLDivElement>(null);
  const items = React.Children.toArray(children);
  const [at, setAt] = React.useState(0);
  const step = () => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    const second = el?.children[1] as HTMLElement | undefined;
    return first && second ? second.offsetLeft - first.offsetLeft : (el?.clientWidth ?? 1);
  };
  const go = (i: number) => track.current?.scrollTo({ left: i * step(), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  return (
    <section aria-roledescription="carousel" aria-label={aria["aria-label"]} className={cn("grid", className)}>
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 ? items.length - 1 : Math.round(el.scrollLeft / step());
          if (i !== at) setAt(i);
        }}
        className="-mx-pad flex snap-x snap-mandatory gap-gap overflow-x-auto overscroll-x-contain scroll-px-pad px-pad py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ScrubHold.Provider value={true}>
          {items.map((c, i) => (
            <div key={i} aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}`} className="w-[86%] shrink-0 snap-start [&>*]:h-full">
              {c}
            </div>
          ))}
        </ScrubHold.Provider>
      </div>
      {/* 44 px dots (they are targets), pulled up so the row reads as part of the cards. */}
      <div className="-mb-2 -mt-1 flex justify-center">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Card ${i + 1}`}
            aria-current={i === at ? "true" : undefined}
            onClick={() => go(i)}
            className="group/dot grid size-touch cursor-pointer place-items-center rounded-control focus-visible:bg-fill"
          >
            <span className={cn("h-[6px] rounded-full transition-[width,background-color] duration-[220ms] ease-ad", i === at ? "w-[18px] bg-ink" : "w-[6px] bg-fill-strong")} />
          </button>
        ))}
      </div>
    </section>
  );
}
