import * as React from "react";
import { cn } from "@/lib/ad";

export interface TimelineEvent {
  id: string;
  /** "14:05" or "Yesterday, 18:40". */
  time: string;
  title: React.ReactNode;
  /** One short line under the title, only when it helps. */
  detail?: React.ReactNode;
  /** A Feather icon, an Avatar or a MarketMark. Defaults to a dot. */
  media?: React.ReactNode;
}

/** What happened, newest first. Time on the left, a dot or icon, the event. Space between rows, no rail line. Rows are
 * read-only, so they have no hover fill. */
export function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  return (
    <ol className={cn("grid gap-1", className)}>
      {events.map((e) => (
        <li key={e.id} className="grid grid-cols-[auto_20px_minmax(0,1fr)] items-start gap-x-3 rounded-item px-2 py-1.5">
          <span className="w-[7.75rem] truncate pt-px text-small leading-5 tabular-nums text-ink-muted">{e.time}</span>
          <span className="grid h-5 place-items-center text-ink-muted [&_svg]:size-[16px]">
            {e.media ?? <span data-shape="round" className="size-1.5 rounded-full bg-ink-muted" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-body leading-5 text-ink">{e.title}</span>
            {e.detail ? <span className="block truncate text-small text-ink-muted">{e.detail}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
