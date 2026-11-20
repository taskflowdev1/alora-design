import * as React from "react";
import { cn, SAFE_BOTTOM, SAFE_TOP } from "@/lib/ad";

export interface MobileIndexedListProps<T> {
  /** Sections in order; each letter gets a sticky heading. */
  sections: { letter: string; items: T[] }[];
  renderItem: (item: T) => React.ReactNode;
  /** Bottom room for the scrubber (the tab bar's height). */
  bottomInset?: number;
  className?: string;
}

/**
 * A long A–Z list (customers, suppliers): letter headings stick under the nav bar, and a strip of letters on the right
 * edge jumps there. Slide a finger down the strip to scrub: the list follows letter by letter and the letter under the
 * finger shows large beside it (the finger covers the strip). Tapping a letter jumps too; arrow keys step. The strip is
 * one 44 px wide target. Put it inside a MobileScreen; letters with no names are left out of the strip.
 */
export function MobileIndexedList<T>({ sections, renderItem, bottomInset = 96, className }: MobileIndexedListProps<T>) {
  const root = React.useRef<HTMLDivElement>(null);
  const strip = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState<string | null>(null);
  const [scrubbing, setScrubbing] = React.useState(false);
  /** The bubble's centre, in the strip's own px (the drawn letter it stands for). */
  const [bubbleY, setBubbleY] = React.useState(0);
  // Keyboard focus shows the bubble with the current letter (a fill over the whole 44 px column would be a grey bar).
  const [kb, setKb] = React.useState(false);
  const letters = sections.map((s) => s.letter);
  const jump = (letter: string) => {
    setActive(letter);
    const head = root.current?.querySelector<HTMLElement>(`[data-index-letter="${letter}"]`);
    const scroller = root.current?.closest<HTMLElement>("[data-mobile-screen]");
    if (!head || !scroller) return;
    // The heading lands just under the sticky nav bar.
    const bar = scroller.querySelector("header")?.offsetHeight ?? 0;
    const y = head.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    const k = scroller.offsetHeight / scroller.getBoundingClientRect().height || 1;
    scroller.scrollTop += y * k - bar;
  };
  /** The letters sit as a centred group in a taller strip: map the finger onto the drawn letters, not the strip. */
  const spanAt = (i: number) => strip.current!.children[i] as HTMLElement;
  const show = (i: number) => {
    const el = spanAt(i);
    setBubbleY(el.offsetTop + el.offsetHeight / 2);
  };
  const pick = (clientY: number) => {
    const first = spanAt(0).getBoundingClientRect();
    const last = spanAt(letters.length - 1).getBoundingClientRect();
    const each = (last.bottom - first.top) / letters.length;
    const i = Math.max(0, Math.min(letters.length - 1, Math.floor((clientY - first.top) / each)));
    show(i);
    if (letters[i] !== active) jump(letters[i]);
  };
  return (
    <div ref={root} className={cn("relative", className)}>
      {sections.map((s) => (
        <section key={s.letter} aria-label={s.letter} className="grid">
          <h2 data-index-letter={s.letter} className="sticky z-10 bg-page px-pad py-1.5 pr-[52px] text-[13px] font-semibold text-ink-muted" style={{ top: `calc(${SAFE_TOP} + 44px)` }}>
            {s.letter}
          </h2>
          <div role="list" className="grid pl-nest pr-[48px]">
            {s.items.map((it, i) => (
              <React.Fragment key={i}>{renderItem(it)}</React.Fragment>
            ))}
          </div>
        </section>
      ))}
      <div
        ref={strip}
        role="slider"
        tabIndex={0}
        aria-label="Jump to letter"
        aria-valuemin={0}
        aria-valuemax={letters.length - 1}
        aria-valuenow={Math.max(0, letters.indexOf(active ?? letters[0]))}
        aria-valuetext={active ?? letters[0]}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setScrubbing(true);
          pick(e.clientY);
        }}
        onPointerMove={(e) => scrubbing && pick(e.clientY)}
        onFocus={(e) => {
          if (!e.currentTarget.matches(":focus-visible")) return;
          setKb(true);
          show(Math.max(0, letters.indexOf(active ?? letters[0])));
          if (!active) setActive(letters[0]);
        }}
        onBlur={() => setKb(false)}
        onPointerUp={() => setScrubbing(false)}
        onPointerCancel={() => setScrubbing(false)}
        onKeyDown={(e) => {
          const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          const i = Math.max(0, Math.min(letters.length - 1, letters.indexOf(active ?? letters[0]) + d));
          show(i);
          jump(letters[i]);
        }}
        className="fixed right-0 z-20 flex w-touch cursor-pointer touch-none select-none flex-col items-center justify-center outline-none"
        style={{ top: `calc(${SAFE_TOP} + 96px)`, bottom: `calc(${SAFE_BOTTOM} + ${bottomInset}px)` }}
      >
        {letters.map((l) => (
          <span
            key={l}
            className={cn(
              "grid min-h-0 w-full flex-1 place-items-center text-[11px] font-semibold leading-none transition-[color,scale] duration-[100ms] ease-ad",
              (scrubbing || kb) && l === active ? "scale-125 text-ink" : "text-ink-muted",
            )}
            style={{ maxHeight: 22 }}
          >
            {l}
          </span>
        ))}
        {/* The finger covers the strip: the letter it is on floats large to its left. */}
        <span
          aria-hidden
          data-shape="round"
          className={cn(
            "pointer-events-none absolute right-[52px] grid size-[56px] place-items-center rounded-full bg-tip text-[26px] font-semibold text-tip-ink shadow-raised transition-[opacity,scale] duration-[120ms] ease-ad",
            (scrubbing || kb) && active ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
          style={{ top: bubbleY - 28 }}
        >
          {active}
        </span>
      </div>
    </div>
  );
}
