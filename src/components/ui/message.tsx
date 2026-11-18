import * as React from "react";
import { cn } from "@/lib/ad";
import { Avatar } from "@/components/ui/avatar";

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "soft" (the default, your own turns), "ink" (solid, for emphasis), "quote" (a replied-to message, quieter). */
  variant?: "soft" | "ink" | "quote";
  align?: "start" | "end";
  /** Emoji reactions under it (one of the two places emoji belong). */
  reactions?: React.ReactNode;
}

/** A chat bubble sized to its text: card radius, bubble padding, no border, no tail. */
export function Bubble({ variant = "soft", align = "start", reactions, className, children, ...props }: BubbleProps) {
  return (
    <div className={cn("grid max-w-[80%] gap-1", align === "end" ? "ml-auto justify-items-end" : "justify-items-start")}>
      <div
        className={cn(
          "w-fit rounded-card px-3.5 py-2 text-body leading-relaxed",
          variant === "soft" && "bg-fill text-ink",
          variant === "ink" && "bg-on text-on-ink",
          variant === "quote" && "bg-fill text-ink-muted",
          className,
        )}
        {...props}
      >
        {children}
      </div>
      {reactions}
    </div>
  );
}

/** Same-sender bubbles stack 4 px apart; groups sit further apart than bubbles inside them. */
export function BubbleGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-1", className)} {...props} />;
}

export interface MessageProps {
  /** Who wrote it: a person (avatar circle + name) or the agent (no bubble, text on the surface). */
  from: { name: string; avatar?: string; agent?: boolean };
  /** "Today, 14:05". Beside the name, muted. */
  time?: React.ReactNode;
  /** Your own message sits right in a soft bubble with no name. */
  mine?: boolean;
  /** A row of small actions under it (copy, retry); quiet until hovered. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * One turn in a conversation. People get a round avatar and name (T3 Code style: name and time on one line, no
 * caption stack); the agent's text sits on the surface without a bubble; your own turns are right-aligned bubbles.
 */
export function Message({ from, time, mine, actions, children, className }: MessageProps) {
  if (mine)
    return (
      <div className={cn("group grid gap-1", className)}>
        <Bubble align="end">{children}</Bubble>
        {actions ? <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity duration-[160ms] group-hover:opacity-100 group-focus-within:opacity-100">{actions}</div> : null}
      </div>
    );
  return (
    <div className={cn("group grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5", className)}>
      {from.agent ? <span aria-hidden className="mt-0.5 size-6" /> : <Avatar name={from.name} src={from.avatar} size="sm" className="mt-0.5" />}
      <div className="grid min-w-0 gap-1">
        <div className="flex min-w-0 items-baseline gap-2 text-body">
          <span className="truncate font-medium text-ink">{from.name}</span>
          {time != null ? <span className="shrink-0 text-small text-ink-muted">{time}</span> : null}
        </div>
        <div className="text-body leading-relaxed text-ink [&_p+p]:mt-2">{children}</div>
        {actions ? <div className="-ml-1.5 flex gap-0.5 opacity-0 transition-opacity duration-[160ms] group-hover:opacity-100 group-focus-within:opacity-100">{actions}</div> : null}
      </div>
    </div>
  );
}
