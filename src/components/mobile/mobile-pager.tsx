import * as React from "react";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

const SAFE_TOP = "var(--ad-safe-top, env(safe-area-inset-top, 0px))";
const SAFE_BOTTOM = "var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px))";

export interface PagerPage {
  key: string;
  /** The picture: a composed piece of the real UI works better than a stock illustration. */
  art: React.ReactNode;
  /** One short claim. No sentence under it. */
  title: string;
}

export interface MobileOnboardingPagerProps {
  pages: PagerPage[];
  /** Get started on the last page, and Skip. */
  onDone: () => void;
  doneLabel?: string;
  className?: string;
}

/**
 * First run: a few full-width pages you swipe through (native scroll snap, so a flick glides to the next page and the
 * edges give), each a picture and a one-line claim. The dots slide with the swipe; Next and Skip do the same without a
 * gesture, and the last page's button says Get started. Shown once; never on every launch.
 */
export function MobileOnboardingPager({ pages, onDone, doneLabel = "Get started", className }: MobileOnboardingPagerProps) {
  const track = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState(0);
  const at = Math.round(pos);
  const last = at === pages.length - 1;
  const go = (i: number) => {
    const el = track.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <div className={cn("flex h-full flex-col bg-page text-ink", className)} style={{ paddingTop: SAFE_TOP }}>
      <div className="flex h-[52px] shrink-0 items-center justify-end px-1.5">
        <button
          type="button"
          onClick={onDone}
          className={cn("h-touch cursor-pointer rounded-control px-3 text-[16px] text-ink transition-[background-color,opacity,transform] duration-[200ms] ease-ad focus-visible:bg-fill active:scale-[0.96]", last && "pointer-events-none opacity-0")}
          tabIndex={last ? -1 : 0}
        >
          Skip
        </button>
      </div>
      <div
        ref={track}
        aria-roledescription="carousel"
        onScroll={(e) => setPos(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth))}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((p, i) => (
          <section key={p.key} aria-roledescription="slide" aria-label={`${i + 1} of ${pages.length}`} className="grid w-full shrink-0 snap-center snap-always content-center justify-items-center gap-8 px-8">
            <div aria-hidden className="pointer-events-none grid w-full max-w-[300px] select-none" style={{ opacity: 1 - Math.min(1, Math.abs(pos - i)) * 0.6, transform: `translateX(${(i - pos) * 40}px)` }}>
              {p.art}
            </div>
            <h2 className="max-w-[300px] text-balance text-center text-[26px] font-semibold leading-tight">{p.title}</h2>
          </section>
        ))}
      </div>
      <div className="grid shrink-0 gap-3 px-pad pt-2" style={{ paddingBottom: `max(16px, ${SAFE_BOTTOM})` }}>
        <div className="flex justify-center">
          {pages.map((p, i) => {
            const near = Math.max(0, 1 - Math.abs(pos - i));
            return (
              <button key={p.key} type="button" aria-label={`Page ${i + 1}`} aria-current={i === at ? "true" : undefined} onClick={() => go(i)} className="grid size-touch cursor-pointer place-items-center rounded-control [-webkit-tap-highlight-color:transparent] focus-visible:bg-fill">
                {/* Width follows the swipe position, so the dot stretches between pages instead of jumping. */}
                <span className="h-[7px] rounded-full bg-ink" style={{ width: 7 + near * 13, opacity: 0.25 + near * 0.75 }} />
              </button>
            );
          })}
        </div>
        <Button variant={last ? "primary" : "secondary"} className="h-touch w-full text-[15px]" onClick={() => (last ? onDone() : go(at + 1))}>
          {last ? doneLabel : "Next"}
        </Button>
      </div>
    </div>
  );
}
