import * as React from "react";
import { Check } from "react-feather";
import { cn } from "@/lib/ad";

export interface MobileTimelineEvent {
  id: string;
  title: React.ReactNode;
  /** "Today, 14:05". Leave out for steps that haven't happened. */
  time?: React.ReactNode;
  /** One short line, only when it helps ("JNE · JX4410293"). */
  detail?: React.ReactNode;
  /** done: happened. now: where the order is. next: still to come (muted). */
  state: "done" | "now" | "next";
}

/**
 * An order's story, oldest first: what happened, when, and what is still to come. Done steps carry a small tick, the
 * current one a larger ink dot on a soft disc, the ones to come a muted dot and muted text. No rail line between them;
 * the column of marks and the spacing carry the order.
 */
export function MobileTimeline({ events, className }: { events: MobileTimelineEvent[]; className?: string }) {
  return (
    <ol className={cn("grid gap-1", className)}>
      {events.map((e) => (
        <li key={e.id} aria-current={e.state === "now" ? "step" : undefined} className="grid min-h-touch grid-cols-[28px_minmax(0,1fr)] items-start gap-x-3 py-1.5">
          <span aria-hidden className="grid h-[22px] place-items-center">
            {e.state === "done" ? (
              <span data-shape="round" className="grid size-[18px] place-items-center rounded-full bg-fill-strong text-ink">
                <Check size={12} strokeWidth={2.75} />
              </span>
            ) : e.state === "now" ? (
              <span data-shape="round" className="grid size-[22px] place-items-center rounded-full bg-fill-strong">
                <span data-shape="round" className="size-[10px] rounded-full bg-on" />
              </span>
            ) : (
              <span data-shape="round" className="size-[8px] rounded-full bg-fill-strong" />
            )}
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className={cn("text-[15px] leading-[22px]", e.state === "next" ? "text-ink-muted" : "text-ink", e.state === "now" && "font-medium")}>{e.title}</span>
            {e.time || e.detail ? (
              <span className="truncate text-[13px] text-ink-muted">
                {e.time}
                {e.time && e.detail ? " · " : ""}
                {e.detail}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
