import * as React from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { addDays, cn, formatDate, monthGrid, MONTHS_LONG, sameDay, startOfDay, WEEKDAYS_2 } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export interface CalendarProps {
  value: Date | null;
  onValueChange: (date: Date) => void;
  /** Pin "today" (for demos and tests). Today's number is bold. */
  today?: Date;
  /** Days before this can't be picked. */
  min?: Date;
  /** Move keyboard focus onto the grid when it mounts (inside a popover). */
  autoFocus?: boolean;
  className?: string;
}

/**
 * A month grid on its own: weeks start Monday, the chosen day is solid ink, arrow keys move by day and week,
 * Enter picks. Labels read "7 Nov 2026". The date picker opens this in a popover.
 */
export function Calendar({ value, onValueChange, today = new Date(), min, autoFocus, className }: CalendarProps) {
  const [view, setView] = React.useState(() => new Date((value ?? today).getFullYear(), (value ?? today).getMonth(), 1));
  const [focus, setFocus] = React.useState<Date>(value ?? today);
  const grid = React.useRef<HTMLDivElement>(null);
  const moved = React.useRef(false);

  const days = React.useMemo(() => monthGrid(view), [view]);

  React.useEffect(() => {
    if ((autoFocus && matchMedia("(pointer: fine)").matches) || moved.current) requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>('[data-focus="true"]')?.focus());
  }, [autoFocus, focus]);

  const shift = (n: number) => {
    moved.current = true;
    const d = addDays(focus, n);
    setFocus(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) setView(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const month = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));
  const blocked = (d: Date) => !!min && d < startOfDay(min);
  const prev = MONTHS_LONG[(view.getMonth() + 11) % 12];
  const next = MONTHS_LONG[(view.getMonth() + 1) % 12];

  return (
    <div className={cn("w-fit", className)}>
      <div className="flex items-center justify-between gap-2">
        <Tooltip content={prev}>
          <Button variant="ghost" size="sm" icon aria-label={prev} onClick={() => month(-1)}>
            <ChevronLeft />
          </Button>
        </Tooltip>
        <span className="text-body font-semibold">
          {MONTHS_LONG[view.getMonth()]} {view.getFullYear()}
        </span>
        <Tooltip content={next}>
          <Button variant="ghost" size="sm" icon aria-label={next} onClick={() => month(1)}>
            <ChevronRight />
          </Button>
        </Tooltip>
      </div>
      <div
        ref={grid}
        role="grid"
        className="mt-1 grid grid-cols-7 gap-px"
        onKeyDown={(e) => {
          const k = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
          if (k) {
            e.preventDefault();
            shift(k);
          } else if ((e.key === "Enter" || e.key === " ") && !blocked(focus)) {
            e.preventDefault();
            onValueChange(focus);
          }
        }}
      >
        {WEEKDAYS_2.map((d) => (
          <span key={d} className="grid h-7 place-items-center text-small text-ink-muted">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const inMonth = d.getMonth() === view.getMonth();
          const selected = value ? sameDay(d, value) : false;
          return (
            <button
              key={d.toISOString()}
              type="button"
              tabIndex={sameDay(d, focus) ? 0 : -1}
              data-focus={sameDay(d, focus)}
              aria-label={formatDate(d)}
              aria-pressed={selected}
              disabled={blocked(d)}
              onClick={() => {
                setFocus(d);
                onValueChange(d);
              }}
              className={cn(
                "grid size-item cursor-pointer place-items-center rounded-control text-body tabular-nums ad-press active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35",
                selected ? "bg-on text-on-ink hover:bg-ink-muted focus-visible:bg-ink-muted" : "hover:bg-fill focus-visible:bg-fill",
                !inMonth && !selected && "text-ink-muted",
                sameDay(d, today) && !selected && "font-semibold",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
