import * as React from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export interface CarouselProps {
  children: React.ReactNode[];
  /** Slides fully visible at once from sm up, plus a 24 px peek of the next (phones show one and a wider peek). */
  perView?: number;
  /** Gap between slides in px. */
  gap?: number;
  /** Let the next slide peek in (24 px from sm up). Off: whole slides only, flush with both edges. */
  peek?: boolean;
  /** Show the previous/next buttons. */
  arrows?: boolean;
  /** Show the dots. */
  dots?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** Fades an edge of the track only where a slide is cut by it, so a slide that is fully in view never looks dirty. */
function edgeFade({ start, end }: { start: boolean; end: boolean }): React.CSSProperties {
  if (!start && !end) return {};
  const mask = `linear-gradient(90deg, ${start ? "transparent" : "#000"}, #000 16px, #000 calc(100% - 16px), ${end ? "transparent" : "#000"})`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

/** The most an edge pull ever shows (px): enough to feel the end, never a visible hole beside the last slide. */
const EDGE_PULL = 20;
/** The fastest a release may keep moving outward (px/s), so a hard throw can't carry the pull past EDGE_PULL. */
const EDGE_THROW = 120;
/** How far an edge pull shows for a pull of x px: it gets harder the further you go and never passes EDGE_PULL. */
const band = (x: number) => Math.sign(x) * (1 - 1 / ((Math.abs(x) * 0.55) / EDGE_PULL + 1)) * EDGE_PULL;

/**
 * Slides on native scroll snap: swipe, trackpad and arrow keys all work, and it never scrolls the page sideways. A mouse
 * can drag it too. Pulling past either end (mouse drag or trackpad) gives a few px of firm resistance, then springs back
 * without crossing the edge. Prev/next are ghost buttons beside the dots under it, never over the
 * content; the current dot is a solid ink pill.
 */
export function Carousel({ children, perView = 1, gap = 12, peek = true, arrows = true, dots = true, className, ...aria }: CarouselProps) {
  const track = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [pages, setPages] = React.useState(children.length);
  const [edges, setEdges] = React.useState({ start: false, end: false });
  const pull = React.useRef({ over: 0, shown: 0, raf: 0, timer: 0, drag: null as null | { x: number; left: number; t: number; v: number; moved: boolean } });
  const show = (px: number) => {
    pull.current.shown = px;
    track.current?.style.setProperty("--ad-pull", `${px}px`);
  };
  /** Spring the pull back to 0 from its current offset, starting at velocity v px/s (critically damped: no wobble). */
  const release = (v = 0) => {
    const p = pull.current;
    cancelAnimationFrame(p.raf);
    p.over = 0;
    const x0 = p.shown;
    if (!x0) return;
    if (prefersReducedMotion()) return show(0);
    const w = 22;
    const out = Math.sign(x0) * Math.min(EDGE_THROW, Math.max(0, v * Math.sign(x0)));
    const t0 = performance.now();
    const step = (now: number) => {
      const t = (now - t0) / 1000;
      const x = (x0 + (out + w * x0) * t) * Math.exp(-w * t);
      show(Math.abs(x) < 0.3 ? 0 : x);
      if (Math.abs(x) >= 0.3) p.raf = requestAnimationFrame(step);
    };
    p.raf = requestAnimationFrame(step);
  };
  React.useEffect(() => {
    const p = pull.current;
    return () => (cancelAnimationFrame(p.raf), window.clearTimeout(p.timer));
  }, []);
  React.useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const first = el.firstElementChild as HTMLElement | null;
      const step = first ? first.offsetWidth + gap : el.clientWidth;
      const shown = Math.max(1, Math.round((el.clientWidth + gap) / step));
      setPages(Math.max(1, children.length - shown + 1));
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
      const pagesNow = Math.max(1, children.length - shown + 1);
      setIndex(atEnd ? pagesNow - 1 : Math.min(pagesNow - 1, Math.round(el.scrollLeft / step)));
      const a = el.scrollLeft;
      const b = a + el.clientWidth;
      const slides = Array.from(el.children as HTMLCollectionOf<HTMLElement>, (c) => [c.offsetLeft - el.offsetLeft, c.offsetLeft - el.offsetLeft + c.offsetWidth]);
      const start = slides.some(([l, r]) => l < a - 1 && r > a + 1);
      const end = slides.some(([l, r]) => l < b - 1 && r > b + 1);
      setEdges((p) => (p.start === start && p.end === end ? p : { start, end }));
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
    if (el && target) el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: prefersReducedMotion() ? "instant" : "smooth" });
  };
  return (
    <section aria-roledescription="carousel" aria-label={aria["aria-label"]} className={cn("grid min-w-0 gap-3", className)}>
      <div
        ref={track}
        tabIndex={0}
        onWheel={(e) => {
          const el = e.currentTarget;
          if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
          const max = el.scrollWidth - el.clientWidth;
          const p = pull.current;
          const atStart = el.scrollLeft <= 0 && e.deltaX < 0;
          const atEnd = el.scrollLeft >= max - 1 && e.deltaX > 0;
          if (!atStart && !atEnd && !p.over) return;
          cancelAnimationFrame(p.raf);
          p.over = Math.max(atEnd || p.over < 0 ? -Infinity : 0, Math.min(atStart || p.over > 0 ? Infinity : 0, p.over - e.deltaX));
          show(band(p.over));
          window.clearTimeout(p.timer);
          p.timer = window.setTimeout(() => release(), 120);
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0) return;
          const el = e.currentTarget;
          cancelAnimationFrame(pull.current.raf);
          pull.current.drag = { x: e.clientX, left: el.scrollLeft, t: performance.now(), v: 0, moved: false };
          el.setPointerCapture(e.pointerId);
          el.style.scrollSnapType = "none";
        }}
        onPointerMove={(e) => {
          const d = pull.current.drag;
          if (!d) return;
          const el = e.currentTarget;
          const now = performance.now();
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4) d.moved = true;
          d.v = d.v * 0.6 + ((e.movementX || 0) / Math.max(1, now - d.t)) * 1000 * 0.4;
          d.t = now;
          const want = d.left - dx;
          const max = el.scrollWidth - el.clientWidth;
          el.scrollLeft = Math.max(0, Math.min(max, want));
          show(want < 0 ? band(-want) : want > max ? band(max - want) : 0);
        }}
        onPointerUp={(e) => {
          const d = pull.current.drag;
          pull.current.drag = null;
          if (!d) return;
          const el = e.currentTarget;
          el.style.scrollSnapType = "";
          const v = performance.now() - d.t > 80 ? 0 : d.v;
          if (pull.current.shown) release(v);
          else {
            const first = el.firstElementChild as HTMLElement | null;
            const stepW = first ? first.offsetWidth + gap : el.clientWidth;
            go(Math.round((el.scrollLeft - v * 0.15) / stepW));
          }
          if (d.moved) {
            el.addEventListener("click", (c) => (c.stopPropagation(), c.preventDefault()), { capture: true, once: true });
          }
        }}
        onPointerCancel={(e) => {
          pull.current.drag = null;
          e.currentTarget.style.scrollSnapType = "";
          release();
        }}
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
        className="flex cursor-grab snap-x snap-mandatory overflow-x-auto rounded-card transition-colors duration-[150ms] ease-ad focus-visible:bg-fill overscroll-x-contain [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        style={{ gap, ["--per" as string]: perView, ["--gap" as string]: `${gap}px`, ...edgeFade(edges) }}
      >
        {children.map((c, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${children.length}`}
            className={cn(
              "min-w-0 shrink-0 snap-start [translate:var(--ad-pull,0px)_0] [&_img]:pointer-events-none",
              peek
                ? "basis-[calc(88%-var(--gap))] sm:basis-[calc((100%-24px-var(--gap)*var(--per))/var(--per))]"
                : "basis-full sm:basis-[calc((100%-var(--gap)*(var(--per)-1))/var(--per))]",
            )}
          >
            {c}
          </div>
        ))}
      </div>
      {arrows || dots ? (
        <div className="flex items-center justify-between gap-2">
          {dots ? (
            <div className="-mx-[9.5px] flex items-center">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === index || undefined}
                  onClick={() => go(i)}
                  className="group/dot grid h-[24px] min-w-[24px] cursor-pointer place-items-center px-[9px]"
                >
                  <span
                    data-shape="round"
                    className={cn(
                      "h-1.5 rounded-full transition-[width,background-color] duration-[220ms] ease-ad",
                      i === index ? "w-5 bg-on group-focus-visible/dot:bg-ink-muted" : "w-1.5 bg-fill-strong group-hover/dot:bg-ink-muted group-focus-visible/dot:bg-ink-muted",
                    )}
                  />
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          {arrows ? (
            <div className="flex gap-1">
              <Tooltip content={index === 0 ? "Already at the start" : "Previous"}>
                <span>
                  <Button variant="ghost" size="sm" icon aria-label="Previous" disabled={index === 0} onClick={() => go(index - 1)}>
                    <ChevronLeft />
                  </Button>
                </span>
              </Tooltip>
              <Tooltip content={index >= pages - 1 ? "Already at the end" : "Next"}>
                <span>
                  <Button variant="ghost" size="sm" icon aria-label="Next" disabled={index >= pages - 1} onClick={() => go(index + 1)}>
                    <ChevronRight />
                  </Button>
                </span>
              </Tooltip>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
