import * as React from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, MONTHS } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  /** "accent" for the one kind that matters (a promotion going live); the rest are neutral. */
  tone?: "neutral" | "accent";
}

const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export interface CalendarMonthProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  events: CalendarEvent[];
  today?: Date;
  /** Events shown per day before "+n". */
  max?: number;
  onEventClick?: (e: CalendarEvent) => void;
  className?: string;
}

/**
 * A month on one screen. Days are soft cells (no grid lines); events are small soft fills
 * with a dot, never a heavy coloured left border.
 */
export function CalendarMonth({ month, onMonthChange, events, today = new Date(), max = 2, onEventClick, className }: CalendarMonthProps) {
  const byDay = React.useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) m.set(key(e.date), [...(m.get(key(e.date)) ?? []), e]);
    return m;
  }, [events]);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const weeks = Math.ceil((((first.getDay() + 6) % 7) + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex h-control items-center gap-1">
        <h3 className="mr-auto text-title font-semibold">
          {MONTHS_LONG[month.getMonth()]} {month.getFullYear()}
        </h3>
        <Button variant="ghost" icon aria-label={MONTHS_LONG[(month.getMonth() + 11) % 12]} onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft />
        </Button>
        <Button variant="ghost" onClick={() => onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1))}>
          Today
        </Button>
        <Button variant="ghost" icon aria-label={MONTHS_LONG[(month.getMonth() + 1) % 12]} onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <span key={d} className="px-2 text-small text-ink-muted">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const list = byDay.get(key(d)) ?? [];
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = key(d) === key(today);
          return (
            <div key={key(d)} className={cn("grid min-h-24 min-w-0 content-start gap-0.5 rounded-control p-1", inMonth && "bg-fill")}>
              <span
                data-shape="round"
                className={cn(
                  "mb-0.5 grid size-6 place-items-center rounded-full text-small tabular-nums",
                  isToday ? "bg-on font-semibold text-on-ink" : inMonth ? "text-ink" : "text-ink-muted",
                )}
              >
                {d.getDate()}
              </span>
              {list.slice(0, max).map((e) => (
                <Tooltip key={e.id} content={`${e.title}, ${d.getDate()} ${MONTHS[d.getMonth()]}`}>
                  <button
                    type="button"
                    onClick={() => onEventClick?.(e)}
                    className={cn(
                      "flex h-6 min-w-0 cursor-pointer items-center gap-1.5 rounded-item px-1.5 text-left text-small transition-colors duration-[160ms]",
                      e.tone === "accent" ? "bg-brand-soft text-brand-soft-ink hover:bg-brand-soft/80 focus-visible:bg-brand-soft/80" : "bg-surface text-ink hover:bg-fill-strong focus-visible:bg-fill-strong",
                    )}
                  >
                    <span data-shape="round" className={cn("size-1.5 shrink-0 rounded-full", e.tone === "accent" ? "bg-brand" : "bg-ink-muted")} />
                    <span className="truncate">{e.title}</span>
                  </button>
                </Tooltip>
              ))}
              {list.length > max ? <span className="px-1.5 text-small text-ink-muted">+{list.length - max} more</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
