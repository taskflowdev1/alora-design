import * as React from "react";
import { Popover as P } from "radix-ui";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "react-feather";
import { SlidingPill } from "@/components/ui/sliding-pill";
import { addDays, cn, formatDate, MONTHS, MONTHS_LONG, monthGrid, sameDay, startOfDay, WEEKDAYS_2 } from "@/lib/ad";
import { usePopupOpen, usePressOpen } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";
import { dropdownSurface, triggerClass } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";

export type DateRange = { from: Date; to: Date };
export type RangePreset = { key: string; label: string; range: (today: Date) => DateRange };

export const DEFAULT_PRESETS: RangePreset[] = [
  { key: "today", label: "Today", range: (t) => ({ from: startOfDay(t), to: startOfDay(t) }) },
  { key: "yesterday", label: "Yesterday", range: (t) => ({ from: addDays(t, -1), to: addDays(t, -1) }) },
  { key: "7d", label: "Last 7 days", range: (t) => ({ from: addDays(t, -6), to: startOfDay(t) }) },
  { key: "30d", label: "Last 30 days", range: (t) => ({ from: addDays(t, -29), to: startOfDay(t) }) },
  { key: "month", label: "This month", range: (t) => ({ from: new Date(t.getFullYear(), t.getMonth(), 1), to: startOfDay(t) }) },
  {
    key: "last-month",
    label: "Last month",
    range: (t) => ({ from: new Date(t.getFullYear(), t.getMonth() - 1, 1), to: new Date(t.getFullYear(), t.getMonth(), 0) }),
  },
];

/** "3–9 Nov 2026", "28 Oct – 3 Nov 2026", "16 Nov 2026". */
export function formatRange({ from, to }: DateRange) {
  const d = (x: Date) => `${x.getDate()} ${MONTHS[x.getMonth()]}`;
  if (sameDay(from, to)) return `${d(from)} ${from.getFullYear()}`;
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
  const [view, setView] = React.useState(() => new Date(value.to.getFullYear(), value.to.getMonth(), 1));
  const [anchor, setAnchor] = React.useState<Date | null>(null);
  const [hover, setHover] = React.useState<Date | null>(null);
  // Keyboard: one day is the Tab stop; arrows move it by day and week (across months), Enter or Space picks it.
  const [focus, setFocus] = React.useState<Date>(() => startOfDay(value.to));
  const grid = React.useRef<HTMLDivElement>(null);
  const moved = React.useRef(false);
  // The trigger keeps the range it had when the panel opened until the panel has finished leaving: a longer label
  // would grow the trigger and drag the fading panel sideways with it.
  const [held, setHeld] = React.useState<DateRange | null>(null);
  const [open, setOpen] = usePopupOpen({
    onOpenChange: (o) => {
      setAnchor(null);
      moved.current = false;
      if (o) {
        setHeld(value);
        setView(new Date(value.to.getFullYear(), value.to.getMonth(), 1));
        setFocus(startOfDay(value.to));
      }
    },
  });
  const press = usePressOpen(open, setOpen);
  const label = held ?? value;
  React.useEffect(() => {
    if (moved.current) requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>('[data-focus="true"]')?.focus());
  }, [focus]);
  const shift = (n: number) => {
    moved.current = true;
    const d = addDays(focus, n);
    setFocus(d);
    if (anchor) setHover(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) setView(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const presetOf = (r: DateRange) =>
    presets.find((p) => {
      const x = p.range(today);
      return sameDay(x.from, r.from) && sameDay(x.to, r.to);
    });
  const preset = presetOf(value);
  const labelPreset = presetOf(label);

  const days = React.useMemo(() => monthGrid(view), [view]);
  const prev = MONTHS_LONG[(view.getMonth() + 11) % 12];
  const next = MONTHS_LONG[(view.getMonth() + 1) % 12];

  const shown: DateRange = anchor ? (hover ? (hover < anchor ? { from: hover, to: anchor } : { from: anchor, to: hover }) : { from: anchor, to: anchor }) : value;

  const pick = (d: Date) => {
    if (!anchor) {
      setAnchor(d);
      return;
    }
    const r = d < anchor ? { from: d, to: anchor } : { from: anchor, to: d };
    setAnchor(null);
    onValueChange(r);
    setOpen(false, true);
  };

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger data-ad-anchor="" {...press} className={cn(triggerClass, className)}>
        <Calendar size={16} className="shrink-0 text-ink-muted" />
        <span className="truncate">{labelPreset ? labelPreset.label : formatRange(label)}</span>
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content align="start" sideOffset={6} collisionPadding={8} onCloseAutoFocus={() => setHeld(null)} className={cn(dropdownSurface, "flex gap-nest max-sm:flex-col")}>
          <div className="relative grid content-start gap-px sm:w-36" role="listbox" aria-label="Presets">
            <SlidingPill selector='[aria-selected="true"]' className="rounded-control bg-fill-strong" />
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                role="option"
                aria-selected={preset?.key === p.key}
                onClick={() => {
                  onValueChange(p.range(today), p.key);
                  setOpen(false, true);
                }}
                className={cn(
                  "relative flex h-item cursor-pointer items-center rounded-control px-2.5 text-left text-body",
                  preset?.key === p.key ? "text-ink" : "text-ink hover:bg-fill focus-visible:bg-fill",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Tooltip content={prev}>
                <Button variant="ghost" size="sm" icon aria-label={prev} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
                  <ChevronLeft />
                </Button>
              </Tooltip>
              <span className="text-body font-semibold">
                {MONTHS_LONG[view.getMonth()]} {view.getFullYear()}
              </span>
              <Tooltip content={next}>
                <Button variant="ghost" size="sm" icon aria-label={next} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
                  <ChevronRight />
                </Button>
              </Tooltip>
            </div>
            <div
              ref={grid}
              className="mt-1 grid grid-cols-7 gap-y-px"
              role="grid"
              onPointerLeave={() => setHover(null)}
              onKeyDown={(e) => {
                const k = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key];
                if (k) {
                  e.preventDefault();
                  shift(k);
                } else if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  pick(focus);
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
                const start = sameDay(d, shown.from);
                const end = sameDay(d, shown.to);
                const inside = d > shown.from && d < shown.to;
                const edge = start || end;
                const col = (d.getDay() + 6) % 7;
                return (
                  <span
                    key={d.toISOString()}
                    className={cn(
                      "relative grid h-item place-items-center",
                      // The band is fill, so a day inside it still shows the fill-strong hover.
                      (inside || (edge && !sameDay(shown.from, shown.to))) && "bg-fill",
                      start && !end && "rounded-l-control",
                      end && !start && "rounded-r-control",
                      inside && col === 0 && "rounded-l-control",
                      inside && col === 6 && "rounded-r-control",
                    )}
                  >
                    <button
                      type="button"
                      aria-label={formatDate(d)}
                      aria-pressed={edge}
                      tabIndex={sameDay(d, focus) ? 0 : -1}
                      data-focus={sameDay(d, focus)}
                      onClick={() => {
                        setFocus(startOfDay(d));
                        pick(d);
                      }}
                      onPointerEnter={() => anchor && setHover(d)}
                      className={cn(
                        "grid size-item cursor-pointer place-items-center rounded-control text-body tabular-nums ad-press active:scale-[0.97]",
                        // The ends darken a notch on hover and focus too, like the Calendar's chosen day.
                        edge ? "bg-on text-on-ink hover:bg-ink-muted focus-visible:bg-ink-muted" : "hover:bg-fill-strong focus-visible:bg-fill-strong",
                        !inMonth && !edge && "text-ink-muted",
                        sameDay(d, today) && !edge && "font-semibold",
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
