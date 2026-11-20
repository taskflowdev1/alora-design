import * as React from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, MONTHS, MONTHS_LONG, monthGrid, WEEKDAYS_3 } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  /** "accent" for the one kind that matters (a promotion going live); the rest are neutral. */
  tone?: "neutral" | "accent";
}

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
  const days = monthGrid(month, "fit");
  const prev = MONTHS_LONG[(month.getMonth() + 11) % 12];
  const next = MONTHS_LONG[(month.getMonth() + 1) % 12];

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex h-control items-center gap-1">
        <h3 className="mr-auto text-title font-semibold">
          {MONTHS_LONG[month.getMonth()]} {month.getFullYear()}
        </h3>
        <Tooltip content={prev}>
          <Button variant="ghost" icon aria-label={prev} onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <ChevronLeft />
          </Button>
        </Tooltip>
        <Button variant="ghost" onClick={() => onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1))}>
          Today
        </Button>
        <Tooltip content={next}>
          <Button variant="ghost" icon aria-label={next} onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <ChevronRight />
          </Button>
        </Tooltip>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS_3.map((d) => (
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
                  <EventPill event={e} onClick={() => onEventClick?.(e)} wrap={list.length === 1} />
                </Tooltip>
              ))}
              {list.length > max ? (
                // The day's full list, so the hidden events can be reached.
                <Popover
                  className="grid w-56 gap-1"
                  trigger={
                    <button
                      type="button"
                      data-ad-anchor=""
                      aria-label={`${list.length - max} more on ${d.getDate()} ${MONTHS[d.getMonth()]}`}
                      className="flex h-[24px] cursor-pointer items-center whitespace-nowrap rounded-item px-1.5 text-left text-small text-ink-muted hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong focus-visible:text-ink data-[state=open]:bg-fill-strong data-[state=open]:text-ink"
                    >
                      +{list.length - max}
                      <span className="max-sm:hidden">&nbsp;more</span>
                    </button>
                  }
                >
                  <p className="px-1.5 pb-1 text-small text-ink-muted">
                    {d.getDate()} {MONTHS[d.getMonth()]}
                  </p>
                  {list.map((e) => (
                    <EventPill key={e.id} event={e} onClick={() => onEventClick?.(e)} full />
                  ))}
                </Popover>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One event: a soft pill with a dot. Below sm the day cell is too narrow for a title, so only the dot shows. `wrap` lets
 * a day's only event take two lines rather than cut its title short.
 */
function EventPill({ event: e, onClick, full, wrap, ...props }: { event: CalendarEvent; onClick: () => void; full?: boolean; wrap?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      onClick={onClick}
      aria-label={full ? undefined : e.title}
      className={cn(
        "flex min-w-0 cursor-pointer gap-1.5 rounded-item px-1.5 text-left text-small",
        wrap ? "min-h-[24px] items-start py-[3px] leading-[18px] max-sm:h-[24px] max-sm:items-center max-sm:py-0" : "h-[24px] items-center",
        !full && "max-sm:justify-center max-sm:px-0",
        e.tone === "accent"
          ? "bg-brand-soft text-brand-soft-ink hover:bg-brand-soft/80 focus-visible:bg-brand-soft/80"
          : full
            ? "bg-fill text-ink hover:bg-fill-strong focus-visible:bg-fill-strong"
            : "bg-surface text-ink hover:bg-fill-strong focus-visible:bg-fill-strong",
      )}
    >
      <span className={cn("flex shrink-0 items-center", wrap && "h-[18px]")}>
        <span data-shape="round" className={cn("size-1.5 rounded-full", e.tone === "accent" ? "bg-brand" : "bg-ink-muted")} />
      </span>
      <span className={cn(wrap ? "line-clamp-2 break-words" : "truncate", !full && "max-sm:sr-only")}>{e.title}</span>
    </button>
  );
}
