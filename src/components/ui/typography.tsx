import * as React from "react";
import { cn } from "@/lib/ad";

/*
 * The type scale as components, one family throughout (no serif, no italic accents). Headings 600; body 13 px; labels
 * grey and regular; numbers tabular in columns; the big number is bold already, so it doesn't need to be huge.
 * Sizes follow the font-size setting (--ad-text-*).
 */

export function H1({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn("text-[calc(var(--ad-text-heading)*1.35)] font-semibold leading-tight tracking-[-0.015em] text-ink", className)} {...p} />;
}
export function H2({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-heading font-semibold tracking-[-0.01em] text-ink", className)} {...p} />;
}
export function H3({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-title font-semibold text-ink", className)} {...p} />;
}
export function H4({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h4 className={cn("text-body font-semibold text-ink", className)} {...p} />;
}
export function P({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body leading-relaxed text-ink", className)} {...p} />;
}
/** Secondary text and labels: grey, regular weight. */
export function Muted({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body text-ink-muted", className)} {...p} />;
}
export function Small({ className, ...p }: React.HTMLAttributes<HTMLElement>) {
  return <small className={cn("text-small text-ink-muted", className)} {...p} />;
}
/** The one big number style: bold, number size, tabular. */
export function Num({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("text-number font-semibold tabular-nums tracking-[-0.01em] text-ink", className)} {...p} />;
}
/** Inline code: the only place the mono face appears outside code blocks. */
export function InlineCode({ className, ...p }: React.HTMLAttributes<HTMLElement>) {
  return <code className={cn("rounded-small bg-fill px-1 py-0.5 font-mono text-[0.92em] text-ink", className)} {...p} />;
}
/** A list with soft dots, not bullets of a different colour. */
export function List({ className, ...p }: React.HTMLAttributes<HTMLUListElement>) {
  return (
  <ul className={cn("grid gap-1.5 text-body text-ink [&>li]:relative [&>li]:pl-4 [&>li]:before:absolute [&>li]:before:left-1 [&>li]:before:top-[0.62em] [&>li]:before:size-1 [&>li]:before:rounded-full [&>li]:before:bg-ink-faint", className)} {...p} />
  );
}
/** A quote on a soft card (no rule down its side). */
export function Quote({ className, ...p }: React.HTMLAttributes<HTMLQuoteElement>) {
  return <blockquote className={cn("rounded-card bg-fill px-pad py-3 text-body leading-relaxed text-ink", className)} {...p} />;
}
