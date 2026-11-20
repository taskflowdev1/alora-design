import * as React from "react";
import { Bell } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";

export interface Notice {
  id: string;
  title: React.ReactNode;
  time: string;
  unread?: boolean;
  onOpen?: () => void;
}

/** Bell with an unread count; the list opens under it. The count is neutral (ink), never a loud red. */
export function NotificationBell({ notices, onMarkAllRead, className }: { notices: Notice[]; onMarkAllRead?: () => void; className?: string }) {
  const unread = notices.filter((n) => n.unread).length;
  return (
    <Popover
      align="end"
      className="w-80"
      trigger={
        <Tooltip content="Notifications">
          <Button variant="ghost" icon aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className={cn("relative", className)}>
            <Bell />
            {unread ? (
              // Pinned to the bell's top-right corner (the 16 px glyph sits in the middle), so it covers only the corner.
              <span className="absolute left-[calc(50%+3px)] top-[calc(50%-13px)] grid h-[14px] min-w-[14px] place-items-center rounded-full bg-on px-[3px] text-[10px] font-semibold leading-none tabular-nums text-on-ink">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Button>
        </Tooltip>
      }
    >
      <div className="flex min-h-item items-center justify-between gap-2 pb-1 pl-2">
        <span className="text-title font-semibold">Notifications</span>
        {unread && onMarkAllRead ? (
          <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
            Mark all read
          </Button>
        ) : null}
      </div>
      <div className="grid max-h-80 gap-px overflow-auto">
        {notices.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={n.onOpen}
            className="grid cursor-pointer grid-cols-[8px_minmax(0,1fr)] items-start gap-x-2.5 rounded-control px-2 py-2 text-left hover:bg-fill focus-visible:bg-fill"
          >
            <span className="grid h-5 place-items-center">
              {n.unread ? <span data-shape="round" className="size-1.5 rounded-full bg-ink" /> : null}
            </span>
            <span className="min-w-0">
              <span className={cn("block text-body leading-5", n.unread ? "text-ink" : "text-ink-muted")}>{n.title}</span>
              <span className="block text-small tabular-nums text-ink-muted">{n.time}</span>
            </span>
          </button>
        ))}
      </div>
    </Popover>
  );
}
