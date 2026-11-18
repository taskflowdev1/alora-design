import * as React from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface CarouselProps {
  children: React.ReactNode[];
  /** Slides visible at once from sm up (phones always show one and a peek of the next). */
  perView?: number;
  /** Gap between slides in px. */
  gap?: number;
  /** Show the previous/next buttons. */
  arrows?: boolean;
  /** Show the dots. */
  dots?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Slides on native scroll snap: swipe, trackpad and arrow keys all work, and it never scrolls the page sideways.
 * Prev/next are ghost buttons beside the dots under it, never over the content; the current dot is a solid ink pill.
 */
export function Carousel({ children, perView = 1, gap = 12, arrows = true, dots = true, className, ...aria }: CarouselProps) {
  const track = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [pages, setPages] = React.useState(children.length);
  React.useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const first = el.firstElementChild as HTMLElement | null;
      const step = first ? first.offsetWidth + gap : el.clientWidth;
      const shown = Math.max(1, Math.round((el.clientWidth + gap) / step));
      setPages(Math.max(1, children.length - shown + 1));
      setIndex(Math.min(children.length - 1, Math.round(el.scrollLeft / step)));
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => (el.removeEventListener("scroll", measure), ro.disconnect());
  }, [children.length, gap]);
  const go = (i: number) => {
    const el = track.current;
    const target = el?.children[Math.max(0, Math.min(pages - 1, i))] as HTMLElement | undefined;
    if (el && target) el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };
  return (
    <section aria-roledescription="carousel" aria-label={aria["aria-label"]} className={cn("grid min-w-0 gap-3", className)}>
      <div
        ref={track}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(index + 1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(index - 1);
          }
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap, ["--per" as string]: perView, ["--gap" as string]: `${gap}px` }}
      >
        {children.map((c, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${children.length}`}
            className="min-w-0 shrink-0 snap-start basis-[calc(88%-var(--gap))] sm:basis-[calc((100%-var(--gap)*(var(--per)-1))/var(--per))]"
          >
            {c}
          </div>
        ))}
      </div>
      {arrows || dots ? (
        <div className="flex items-center justify-between gap-2">
          {dots ? (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === index || undefined}
                  onClick={() => go(i)}
                  className={cn("h-1.5 cursor-pointer rounded-full transition-[width,background-color] duration-[220ms] ease-ad", i === index ? "w-5 bg-on" : "w-1.5 bg-fill-strong hover:bg-ink-muted")}
                />
              ))}
            </div>
          ) : (
            <span />
          )}
          {arrows ? (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" icon aria-label="Previous" disabled={index === 0} onClick={() => go(index - 1)}>
                <ChevronLeft />
              </Button>
              <Button variant="ghost" size="sm" icon aria-label="Next" disabled={index >= pages - 1} onClick={() => go(index + 1)}>
                <ChevronRight />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
