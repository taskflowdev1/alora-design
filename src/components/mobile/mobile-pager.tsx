import * as React from "react";
import { cn, prefersReducedMotion, SAFE_BOTTOM, SAFE_TOP } from "@/lib/ad";
import { Button } from "@/components/ui/button";

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
  // The swipe position drives the art and the dots straight on the DOM, every frame; React only hears the page change.
  const arts = React.useRef<(HTMLDivElement | null)[]>([]);
  const dots = React.useRef<(HTMLSpanElement | null)[]>([]);
  const [at, setAt] = React.useState(0);
  const last = at === pages.length - 1;
  const paint = React.useCallback((pos: number) => {
    arts.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = String(1 - Math.min(1, Math.abs(pos - i)) * 0.6);
      el.style.transform = `translateX(${(i - pos) * 40}px)`;
    });
    dots.current.forEach((el, i) => {
      if (!el) return;
      // Width follows the swipe position, so the dot stretches between pages instead of jumping.
      const near = Math.max(0, 1 - Math.abs(pos - i));
      el.style.width = `${7 + near * 13}px`;
      el.style.opacity = String(0.25 + near * 0.75);
    });
  }, []);
  React.useLayoutEffect(() => paint(0), [paint, pages.length]);
  const go = (i: number) => {
    const el = track.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };
  return (
    <div className={cn("flex h-full flex-col bg-page text-ink", className)} style={{ paddingTop: SAFE_TOP }}>
      <div className="flex h-[52px] shrink-0 items-center justify-end px-1.5">
        <button
          type="button"
          onClick={onDone}
          className={cn("h-touch cursor-pointer rounded-control px-3 text-[16px] text-ink transition-[background-color,opacity,scale] duration-[200ms] ease-ad focus-visible:bg-fill active:scale-[0.97] data-pressed:scale-[0.97]", last && "pointer-events-none opacity-0")}
          tabIndex={last ? -1 : 0}
        >
          Skip
        </button>
      </div>
      <div
        ref={track}
        aria-roledescription="carousel"
        onScroll={(e) => {
          const pos = e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth);
          paint(pos);
          setAt(Math.round(pos));
        }}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((p, i) => (
          <section key={p.key} aria-roledescription="slide" aria-label={`${i + 1} of ${pages.length}`} className="grid w-full shrink-0 snap-center snap-always content-center justify-items-center gap-8 px-8">
            <div ref={(el) => void (arts.current[i] = el)} aria-hidden className="pointer-events-none grid w-full max-w-[300px] select-none">
              {p.art}
            </div>
            <h2 className="max-w-[300px] text-balance text-center text-[26px] font-semibold leading-tight">{p.title}</h2>
          </section>
        ))}
      </div>
      <div className="grid shrink-0 gap-3 px-pad pt-2" style={{ paddingBottom: `max(16px, ${SAFE_BOTTOM})` }}>
        <div className="flex justify-center">
          {pages.map((p, i) => (
            <button key={p.key} type="button" aria-label={`Page ${i + 1}`} aria-current={i === at ? "true" : undefined} onClick={() => go(i)} className="grid size-touch cursor-pointer place-items-center rounded-control focus-visible:bg-fill">
              <span ref={(el) => void (dots.current[i] = el)} className="h-[7px] w-[7px] rounded-full bg-ink opacity-25" />
            </button>
          ))}
        </div>
        <Button variant={last ? "primary" : "secondary"} className="h-touch w-full text-[15px]" onClick={() => (last ? onDone() : go(at + 1))}>
          {last ? doneLabel : "Next"}
        </Button>
      </div>
    </div>
  );
}
