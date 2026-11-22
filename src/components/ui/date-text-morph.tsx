import * as React from "react";
import { MONTHS, WEEKDAYS_3, addDays, cn, dayDiff } from "@/lib/ad";

const LEAVE_MS = 200;

const CSS = `
.ad-morph-glyph { position: absolute; left: 0; top: 0; white-space: pre; transition: transform 280ms cubic-bezier(0.65, 0, 0.35, 1); }
@keyframes ad-morph-in { from { opacity: 0; filter: blur(3px); translate: 0 0.16em; } }
@keyframes ad-morph-out { to { opacity: 0; filter: blur(3px); translate: 0 -0.16em; } }
.ad-morph-glyph[data-enter] { animation: ad-morph-in 220ms var(--ad-ease) 40ms backwards; }
.ad-morph-glyph[data-leaving] { animation: ad-morph-out ${LEAVE_MS}ms var(--ad-ease) forwards; pointer-events: none; }`;

interface Glyph {
  id: number;
  ch: string;
  x: number;
  enter?: boolean;
  leaving?: boolean;
}

/** "today", "tomorrow", "in 2 days", "3 days ago". */
function relativeDate(d: Date, now: Date) {
  const n = dayDiff(d, now);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** "Fri, 28 Nov". */
const absoluteDate = (d: Date) => `${WEEKDAYS_3[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** Each character's left edge inside `box`, in the box's own px (a scaled ancestor doesn't skew them). */
function measure(node: Text, box: HTMLElement, align: "start" | "center") {
  const rect = box.getBoundingClientRect();
  const scale = rect.width ? box.offsetWidth / rect.width : 1;
  const range = document.createRange();
  range.selectNodeContents(node);
  const whole = range.getBoundingClientRect();
  const offset = align === "center" ? (rect.width - whole.width) / 2 : 0;
  const text = node.data;
  const xs: number[] = [];
  for (let i = 0; i < text.length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    xs.push((range.getBoundingClientRect().left - whole.left + offset) * scale);
  }
  return xs;
}

export interface DateTextMorphProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** The date shown. Defaults to two days from now. */
  date?: Date;
  /** What "today" is, for the relative wording. */
  now?: Date;
  /** Which form shows: "relative" ("in 2 days") or "absolute" ("Fri, 28 Nov"). */
  mode?: "relative" | "absolute";
  defaultMode?: "relative" | "absolute";
  onModeChange?: (mode: "relative" | "absolute") => void;
  /** Where the text sits in the width reserved for its longer form. */
  align?: "start" | "center";
}

/**
 * A date you can click to read the other way. The letters the two forms share travel to their new places, and only the
 * rest fade, so "in 2 days" turns into "Fri, 28 Nov" instead of being swapped for it. Size it with `className`.
 */
export function DateTextMorph({ date, now, mode, defaultMode = "relative", onModeChange, align = "start", className, onClick, ...props }: DateTextMorphProps) {
  const [today] = React.useState(() => new Date());
  const base = now ?? today;
  const shown = date ?? addDays(base, 2);
  const [inner, setInner] = React.useState(defaultMode);
  const current = mode ?? inner;
  const relative = relativeDate(shown, base);
  const absolute = absoluteDate(shown);
  const text = current === "relative" ? relative : absolute;

  const boxRef = React.useRef<HTMLSpanElement>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);
  const [glyphs, setGlyphs] = React.useState<Glyph[]>([]);
  const nextId = React.useRef(1);
  const first = React.useRef(true);

  React.useLayoutEffect(() => {
    const box = boxRef.current;
    const node = measureRef.current?.firstChild;
    if (!box || !(node instanceof Text)) return;
    const place = (animateIn: boolean) => {
      const xs = measure(node, box, align);
      setGlyphs((prev) => {
        const pool = prev.filter((g) => !g.leaving);
        const used = new Set<number>();
        const out: Glyph[] = [];
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === " ") continue;
          // A letter both forms have travels from its nearest twin; the rest fade.
          let best: Glyph | undefined;
          for (const g of pool) {
            if (g.ch !== ch || used.has(g.id)) continue;
            if (!best || Math.abs(g.x - xs[i]) < Math.abs(best.x - xs[i])) best = g;
          }
          if (best) {
            used.add(best.id);
            // Keeps its enter flag: dropping it mid-way would cut that letter's fade short.
            out.push({ id: best.id, ch, x: xs[i], enter: best.enter });
          } else out.push({ id: nextId.current++, ch, x: xs[i], enter: animateIn });
        }
        // A re-measure (the observer's first call, a resize) must not cut short letters already on their way out.
        const gone = animateIn ? pool.filter((g) => !used.has(g.id)).map((g) => ({ ...g, enter: false, leaving: true })) : prev.filter((g) => g.leaving);
        return [...out, ...gone];
      });
    };
    place(!first.current);
    first.current = false;
    const timer = window.setTimeout(() => setGlyphs((prev) => prev.filter((g) => !g.leaving)), LEAVE_MS + 40);
    const ro = new ResizeObserver(() => place(false));
    ro.observe(box);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, [text, align]);

  return (
    <button
      type="button"
      aria-label={text}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const next = current === "relative" ? "absolute" : "relative";
        setInner(next);
        onModeChange?.(next);
      }}
      className={cn(
        "ad-press inline-block cursor-pointer select-none whitespace-nowrap rounded-item px-2 py-1 font-semibold tabular-nums text-ink hover:bg-fill focus-visible:bg-fill active:scale-[0.97]",
        className,
      )}
      {...props}
    >
      <style href="ad-date-text-morph" precedence="default">
        {CSS}
      </style>
      <span ref={boxRef} aria-hidden className="relative inline-grid">
        {/* Both forms sit here unseen, so the box always has the longer one's width and nothing beside it moves. */}
        <span className="invisible col-start-1 row-start-1 whitespace-pre">{relative}</span>
        <span className="invisible col-start-1 row-start-1 whitespace-pre">{absolute}</span>
        <span ref={measureRef} className="invisible col-start-1 row-start-1 justify-self-start whitespace-pre">
          {text}
        </span>
        {glyphs.map((g) => (
          <span key={g.id} className="ad-morph-glyph" data-enter={g.enter ? "" : undefined} data-leaving={g.leaving ? "" : undefined} style={{ transform: `translateX(${g.x.toFixed(2)}px)` }}>
            {g.ch}
          </span>
        ))}
      </span>
    </button>
  );
}
