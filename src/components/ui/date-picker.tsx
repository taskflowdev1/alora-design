import * as React from "react";
import { Popover as P } from "radix-ui";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "react-feather";
import { cn, formatDate, formatSmartDate } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { triggerClass } from "@/components/ui/select";

const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export interface DatePickerProps {
  value: Date | null;
  onValueChange: (date: Date) => void;
  placeholder?: string;
  /** "Today, Yesterday…" in the trigger where they apply. */
  smart?: boolean;
  /** Pin "today" (for demos and tests). */
  today?: Date;
  className?: string;
}

/** Dates read "7 Nov 2026" when shown and when chosen. Never 07/11/2026. */
export function DatePicker({ value, onValueChange, placeholder = "Pick a date", smart = true, today = new Date(), className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState(() => new Date((value ?? today).getFullYear(), (value ?? today).getMonth(), 1));
  const [focus, setFocus] = React.useState<Date>(value ?? today);
  const grid = React.useRef<HTMLDivElement>(null);

  const days = React.useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [view]);

  React.useEffect(() => {
    if (open) requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>('[data-focus="true"]')?.focus());
  }, [open, focus]);

  const shift = (n: number) => {
    const d = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate() + n);
    setFocus(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) setView(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const month = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <P.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          const d = value ?? today;
          setFocus(d);
          setView(new Date(d.getFullYear(), d.getMonth(), 1));
        }
      }}
    >
      <P.Trigger className={cn(triggerClass, className)}>
        <Calendar size={16} className="shrink-0 text-ink-muted" />
        {value ? <span className="truncate">{smart ? formatSmartDate(value, today) : formatDate(value)}</span> : <span className="text-ink-faint">{placeholder}</span>}
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "z-50 rounded-card bg-raised p-nest text-ink shadow-raised",
            "origin-(--radix-popover-content-transform-origin) data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_120ms_ease-in]",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" icon aria-label={`${MONTHS_LONG[(view.getMonth() + 11) % 12]}`} onClick={() => month(-1)}>
              <ChevronLeft />
            </Button>
            <span className="text-body font-semibold">
              {MONTHS_LONG[view.getMonth()]} {view.getFullYear()}
            </span>
            <Button variant="ghost" size="sm" icon aria-label={`${MONTHS_LONG[(view.getMonth() + 1) % 12]}`} onClick={() => month(1)}>
              <ChevronRight />
            </Button>
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
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onValueChange(focus);
                setOpen(false);
              }
            }}
          >
            {DAYS.map((d) => (
              <span key={d} className="grid h-7 place-items-center text-small text-ink-muted">
                {d}
              </span>
            ))}
            {days.map((d) => {
              const inMonth = d.getMonth() === view.getMonth();
              const selected = value ? same(d, value) : false;
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  tabIndex={same(d, focus) ? 0 : -1}
                  data-focus={same(d, focus)}
                  aria-label={formatDate(d)}
                  aria-pressed={selected}
                  onClick={() => {
                    onValueChange(d);
                    setOpen(false);
                  }}
                  className={cn(
                    "grid size-item cursor-pointer place-items-center rounded-control text-body tabular-nums transition-[background-color,transform] duration-[160ms] ease-ad active:scale-90",
                    selected ? "bg-on text-on-ink" : "hover:bg-fill focus-visible:bg-fill",
                    !inMonth && !selected && "text-ink-faint",
                    same(d, today) && !selected && "font-semibold",
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
