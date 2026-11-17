import * as React from "react";
import { Popover as P } from "radix-ui";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "react-feather";
import { cn, MONTHS } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { dropdownSurface, triggerClass } from "@/components/ui/select";

export type DateRange = { from: Date; to: Date };
export type RangePreset = { key: string; label: string; range: (today: Date) => DateRange };

const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const add = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const same = (a: Date, b: Date) => day(a).getTime() === day(b).getTime();

export const DEFAULT_PRESETS: RangePreset[] = [
  { key: "today", label: "Today", range: (t) => ({ from: day(t), to: day(t) }) },
  { key: "yesterday", label: "Yesterday", range: (t) => ({ from: add(t, -1), to: add(t, -1) }) },
  { key: "7d", label: "Last 7 days", range: (t) => ({ from: add(t, -6), to: day(t) }) },
  { key: "30d", label: "Last 30 days", range: (t) => ({ from: add(t, -29), to: day(t) }) },
  { key: "month", label: "This month", range: (t) => ({ from: new Date(t.getFullYear(), t.getMonth(), 1), to: day(t) }) },
  {
    key: "last-month",
    label: "Last month",
    range: (t) => ({ from: new Date(t.getFullYear(), t.getMonth() - 1, 1), to: new Date(t.getFullYear(), t.getMonth(), 0) }),
  },
];

/** "3–9 Nov 2026", "28 Oct – 3 Nov 2026", "16 Nov 2026". */
export function formatRange({ from, to }: DateRange) {
  const d = (x: Date) => `${x.getDate()} ${MONTHS[x.getMonth()]}`;
  if (same(from, to)) return `${d(from)} ${from.getFullYear()}`;
  if (from.getFullYear() !== to.getFullYear()) return `${d(from)} ${from.getFullYear()} – ${d(to)} ${to.getFullYear()}`;
  if (from.getMonth() === to.getMonth()) return `${from.getDate()}–${d(to)} ${to.getFullYear()}`;
  return `${d(from)} – ${d(to)} ${to.getFullYear()}`;
}

export interface DateRangePickerProps {
  value: DateRange;
  onValueChange: (range: DateRange, preset?: string) => void;
  presets?: RangePreset[];
  /** Pin "today" (demos and tests). */
  today?: Date;
  className?: string;
}

/**
 * Presets on the left, one month on the right. Click a start day, then an end day;
 * the range previews under the pointer. The trigger names the preset when one matches.
 */
export function DateRangePicker({ value, onValueChange, presets = DEFAULT_PRESETS, today = new Date(), className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState(() => new Date(value.to.getFullYear(), value.to.getMonth(), 1));
  const [anchor, setAnchor] = React.useState<Date | null>(null);
  const [hover, setHover] = React.useState<Date | null>(null);
  const preset = presets.find((p) => {
    const r = p.range(today);
    return same(r.from, value.from) && same(r.to, value.to);
  });

  const days = React.useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = add(first, -((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => add(start, i));
  }, [view]);

  const shown: DateRange = anchor ? (hover ? (hover < anchor ? { from: hover, to: anchor } : { from: anchor, to: hover }) : { from: anchor, to: anchor }) : value;

  const pick = (d: Date) => {
    if (!anchor) {
      setAnchor(d);
      return;
    }
    const r = d < anchor ? { from: d, to: anchor } : { from: anchor, to: d };
    setAnchor(null);
    onValueChange(r);
    setOpen(false);
  };

  return (
    <P.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setAnchor(null);
        if (o) setView(new Date(value.to.getFullYear(), value.to.getMonth(), 1));
      }}
    >
      <P.Trigger className={cn(triggerClass, className)}>
        <Calendar size={16} className="shrink-0 text-ink-muted" />
        <span className="truncate">{preset ? preset.label : formatRange(value)}</span>
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content align="start" sideOffset={6} collisionPadding={8} className={cn(dropdownSurface, "flex gap-nest max-sm:flex-col")}>
          <div className="grid content-start gap-px sm:w-36" role="listbox" aria-label="Presets">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                role="option"
                aria-selected={preset?.key === p.key}
                onClick={() => {
                  onValueChange(p.range(today), p.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-item cursor-pointer items-center rounded-control px-2.5 text-left text-body transition-colors duration-[160ms]",
                  preset?.key === p.key ? "bg-fill-hover text-ink" : "text-ink hover:bg-fill",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" icon aria-label={MONTHS_LONG[(view.getMonth() + 11) % 12]} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
                <ChevronLeft />
              </Button>
              <span className="text-body font-semibold">
                {MONTHS_LONG[view.getMonth()]} {view.getFullYear()}
              </span>
              <Button variant="ghost" size="sm" icon aria-label={MONTHS_LONG[(view.getMonth() + 1) % 12]} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
                <ChevronRight />
              </Button>
            </div>
            <div className="mt-1 grid grid-cols-7 gap-y-px" role="grid" onPointerLeave={() => setHover(null)}>
              {DAYS.map((d) => (
                <span key={d} className="grid h-7 place-items-center text-small text-ink-muted">
                  {d}
                </span>
              ))}
              {days.map((d) => {
                const inMonth = d.getMonth() === view.getMonth();
                const start = same(d, shown.from);
                const end = same(d, shown.to);
                const inside = d > shown.from && d < shown.to;
                const edge = start || end;
                const col = (d.getDay() + 6) % 7;
                return (
                  <span
                    key={d.toISOString()}
                    className={cn(
                      "relative grid h-item place-items-center",
                      (inside || (edge && !same(shown.from, shown.to))) && "bg-fill-hover",
                      start && !end && "rounded-l-control",
                      end && !start && "rounded-r-control",
                      inside && col === 0 && "rounded-l-control",
                      inside && col === 6 && "rounded-r-control",
                    )}
                  >
                    <button
                      type="button"
                      aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`}
                      aria-pressed={edge}
                      onClick={() => pick(d)}
                      onPointerEnter={() => anchor && setHover(d)}
                      className={cn(
                        "grid size-item cursor-pointer place-items-center rounded-control text-body tabular-nums transition-[background-color,transform] duration-[160ms] ease-ad active:scale-90",
                        edge ? "bg-on text-on-ink" : "hover:bg-fill-strong",
                        !inMonth && !edge && "text-ink-faint",
                        same(d, today) && !edge && "font-semibold",
                      )}
                    >
                      {d.getDate()}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
