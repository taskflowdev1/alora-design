import type * as React from "react";
import { cn } from "@/lib/ad";

export interface StreamingTextProps {
  /** The answer so far. Paragraphs are split on blank lines. */
  text: string;
  /** Still arriving: the paragraph being written keeps room for `reserve` lines, so what is below never jumps. */
  streaming?: boolean;
  /** Lines to hold open for the paragraph in progress (and for the first one before any text arrives). */
  reserve?: number;
  /** Renders a source marker written as [n] in the text (a Citation); it appears as soon as its marker arrives. */
  cite?: (n: number) => React.ReactNode;
  className?: string;
}

/**
 * An answer that writes itself without moving the page: the paragraph in progress holds room for a few lines ahead of
 * the words, so the next line lands in space that is already there instead of pushing everything below it down, and
 * each new chunk fades in where it lands. A small pulsing dot marks where it is writing. When it finishes, the reserve
 * goes and the block keeps exactly the height of its text.
 */
export function StreamingText({ text, streaming, reserve = 3, cite, className }: StreamingTextProps) {
  const paras = text.split(/\n{2,}/);
  return (
    <div aria-live={streaming ? "off" : "polite"} aria-busy={streaming || undefined} className={cn("grid gap-2 text-body leading-relaxed text-ink", className)}>
      {paras.map((p, pi) => {
        const live = streaming && pi === paras.length - 1;
        // A source marker hugs the word before it ("pace[1]."), whatever spacing the model wrote.
        const words = (cite ? p.replace(/\s+(?=\[\d+\])/g, "") : p).split(cite ? /(\[\d+\]|\s+)/ : /(\s+)/).filter(Boolean);
        return (
          <div key={pi} style={live ? { minHeight: `${reserve * 1.625}em` } : undefined}>
            {words.map((w, i) => (
              <span key={i} className={cn(live && "animate-[ad-fade-in_220ms_var(--ad-ease)]")}>
                {cite && /^\[\d+\]$/.test(w) ? cite(Number(w.slice(1, -1))) : w}
              </span>
            ))}
            {live ? <span aria-hidden className="ml-0.5 inline-block size-2 animate-[ad-pulse_1.2s_ease-in-out_infinite] rounded-full bg-ink-muted align-middle" /> : null}
          </div>
        );
      })}
    </div>
  );
}
