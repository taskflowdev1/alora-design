import * as React from "react";
import { cn } from "@/lib/ad";

export interface StreamingTextProps {
  /** The answer so far. Paragraphs are split on blank lines. */
  text: string;
  /** Still arriving: the paragraph being written keeps room for `reserve` lines, so what is below never jumps. */
  streaming?: boolean;
  /** Lines to hold open for the paragraph in progress (shown as skeleton lines before the first words arrive). */
  reserve?: number;
  /**
   * The whole answer, when it is known before it is shown (a replay, a cached answer, a template). Then the space it
   * will take shows as skeleton lines from the first frame, word for word where the text will land, so nothing moves
   * at all; `reserve` is not used.
   */
  final?: string;
  /** Renders a source marker written as [n] in the text (a Citation); it appears as soon as its marker arrives. */
  cite?: (n: number) => React.ReactNode;
  className?: string;
}

const MARK = /(\[\d+\])/;
// A source marker hugs the word before it ("pace[1]."), whatever spacing the model wrote.
const tidy = (s: string, cite: boolean) => (cite ? s.replace(/\s+(?=\[\d+\])/g, "") : s);

/** One word with any markers and punctuation stuck to it, kept on one line so a number never wraps away from its word. */
function Chunk({ chunk, cite }: { chunk: string; cite?: (n: number) => React.ReactNode }) {
  if (!cite || !MARK.test(chunk)) return <>{chunk}</>;
  return (
    <span className="whitespace-nowrap">
      {chunk
        .split(MARK)
        .filter(Boolean)
        .map((part, i) => (MARK.test(part) && /^\[\d+\]$/.test(part) ? <span key={i}>{cite(Number(part.slice(1, -1)))}</span> : <span key={i}>{part}</span>))}
    </span>
  );
}

const pulse = "animate-[ad-pulse_1.6s_ease-in-out_infinite]";

/** Skeleton lines: one text line each (1em bar in a 1.625em line), the last one shorter. */
function Lines({ n }: { n: number }) {
  return (
    <div aria-hidden className="grid">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={cn("my-[0.3125em] h-[1em] rounded-small bg-fill", pulse, i === n - 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}

/** The paragraph being written: its words, then skeleton lines for whatever is left of the room held open. */
function Writing({ reserve, children }: { reserve: number; children: React.ReactNode }) {
  const words = React.useRef<HTMLDivElement>(null);
  const [left, setLeft] = React.useState(reserve);
  const measure = React.useCallback(() => {
    const el = words.current;
    if (!el) return;
    const line = parseFloat(getComputedStyle(el).lineHeight) || 1;
    setLeft(Math.max(0, reserve - Math.round(el.offsetHeight / line)));
  }, [reserve]);
  // Re-measured as words arrive and when the width changes.
  React.useLayoutEffect(measure, [measure, children]);
  React.useLayoutEffect(() => {
    const ro = new ResizeObserver(measure);
    if (words.current) ro.observe(words.current);
    return () => ro.disconnect();
  }, [measure]);
  return (
    <div>
      <div ref={words}>{children}</div>
      {left ? <Lines n={left} /> : null}
    </div>
  );
}

/**
 * An answer that writes itself without moving the page. With `final`, the whole answer's shape is there from the first
 * frame as skeleton lines, and each word fades in exactly where its skeleton was. Without it, the paragraph in progress
 * holds `reserve` lines open, drawn as skeleton lines under the words, so the next line lands in space that is already
 * there. A source number never wraps away from its word. When it finishes, the block keeps exactly the height
 * of its text.
 */
export function StreamingText({ text, streaming, reserve = 3, final, cite, className }: StreamingTextProps) {
  const box = cn("grid gap-2 text-body leading-relaxed text-ink", className);
  const live = { "aria-live": streaming ? ("off" as const) : ("polite" as const), "aria-busy": streaming || undefined };

  if (final != null) {
    const all = tidy(final, !!cite);
    const shown = tidy(text, !!cite).length;
    let at = 0;
    return (
      <div {...live} className={box}>
        {all.split(/\n{2,}/).map((p, pi) => {
          const start = all.indexOf(p, at);
          at = start + p.length;
          const parts = p.split(/(\s+)/).filter(Boolean);
          // Everything up to the last chunk that has fully arrived is text; the rest is its own skeleton.
          let end = 0;
          let cut = 0;
          parts.forEach((w, i) => {
            end += w.length;
            if (start + end <= shown && !/^\s+$/.test(w)) cut = i + 1;
          });
          if (!streaming && shown >= all.length) cut = parts.length;
          return (
            <div key={pi}>
              {parts.slice(0, cut).map((w, i) => (
                <span key={i} className={cn(streaming && "animate-[ad-fade-in_220ms_var(--ad-ease)]")}>
                  <Chunk chunk={w} cite={cite} />
                </span>
              ))}
              {cut < parts.length ? (
                <span aria-hidden className={cn("rounded-small bg-fill text-transparent [box-decoration-break:clone] [-webkit-box-decoration-break:clone] [&_*]:invisible", pulse)}>
                  {parts.slice(cut).map((w, i) => (
                    <Chunk key={i} chunk={w} cite={cite} />
                  ))}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  const paras = text ? text.split(/\n{2,}/) : [];
  return (
    <div {...live} className={box}>
      {streaming && !paras.length ? <Lines n={reserve} /> : null}
      {paras.map((p, pi) => {
        const writing = streaming && pi === paras.length - 1;
        const words = tidy(p, !!cite)
          .split(/(\s+)/)
          .filter(Boolean)
          .map((w, i) => (
            <span key={i} className={cn(writing && "animate-[ad-fade-in_220ms_var(--ad-ease)]")}>
              <Chunk chunk={w} cite={cite} />
            </span>
          ));
        return writing ? <Writing key={pi} reserve={reserve}>{words}</Writing> : <div key={pi}>{words}</div>;
      })}
    </div>
  );
}
