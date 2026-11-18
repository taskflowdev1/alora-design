import * as React from "react";
import { ArrowDown } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface MessageScrollerProps {
  children: React.ReactNode;
  /** Change this when a message arrives (its count or id): pinned to the bottom, the list follows it. */
  watch?: unknown;
  className?: string;
}

/**
 * A conversation's scroll area: it starts at the latest message, follows new ones while you're at the bottom, and
 * stays put when you've scrolled up to read, showing a "Latest" button instead. Short threads sit at the bottom.
 */
export function MessageScroller({ children, watch, className }: MessageScrollerProps) {
  const box = React.useRef<HTMLDivElement>(null);
  const pinned = React.useRef(true);
  const [away, setAway] = React.useState(false);
  const toBottom = (smooth?: boolean) => box.current?.scrollTo({ top: box.current.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  React.useLayoutEffect(() => {
    if (pinned.current) toBottom();
    else setAway(true);
  }, [watch]);
  return (
    <div className={cn("relative flex min-h-0 flex-col", className)}>
      <div
        ref={box}
        onScroll={(e) => {
          const el = e.currentTarget;
          const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          pinned.current = atEnd;
          setAway(!atEnd);
        }}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
      >
        <div className="mt-auto grid gap-5 py-1">{children}</div>
      </div>
      <div className={cn("pointer-events-none absolute inset-x-0 bottom-2 flex justify-center transition-[opacity,transform] duration-[220ms] ease-ad", away ? "opacity-100" : "translate-y-1 opacity-0")}>
        <Button size="sm" tabIndex={away ? 0 : -1} className="pointer-events-auto shadow-raised" onClick={() => toBottom(true)}>
          <ArrowDown />
          Latest
        </Button>
      </div>
    </div>
  );
}
