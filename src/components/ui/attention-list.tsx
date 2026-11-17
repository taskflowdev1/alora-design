import * as React from "react";
import { cn } from "@/lib/ad";

/** Items that need attention. Each is its own soft card; no lines between them. */
export function AttentionList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("grid gap-1.5", className)}>{children}</ul>;
}

export interface AttentionItemProps {
  /** A Thumb or Avatar. */
  media?: React.ReactNode;
  title: React.ReactNode;
  /** One short fact, e.g. "2 left". */
  meta?: React.ReactNode;
  /** The value that matters, right-aligned. */
  value?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
}

/** Left and right insets match: the media's gap to the edge is the value's gap to the edge. */
export function AttentionItem({ media, title, meta, value, action, onClick }: AttentionItemProps) {
  return (
    <li
      onClick={onClick}
      className={cn(
        "flex min-h-[calc(var(--ad-row-h)+8px)] items-center gap-3 rounded-item bg-fill px-2.5 py-1.5 transition-colors duration-[160ms]",
        action && "pr-1.5",
        onClick && "cursor-pointer hover:bg-fill-hover",
      )}
    >
      {media}
      <div className="min-w-0 flex-1">
        <p className="truncate text-body text-ink">{title}</p>
        {meta ? <p className="truncate text-small text-ink-muted">{meta}</p> : null}
      </div>
      {value ? <span className="shrink-0 tabular-nums text-body font-medium text-ink">{value}</span> : null}
      {action ? <span className="shrink-0 [&_button]:rounded-small">{action}</span> : null}
    </li>
  );
}
