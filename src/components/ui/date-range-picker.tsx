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
  /** Show the presets and month in place, with the range above them, instead of behind a trigger. */
  inline?: boolean;
  className?: string;
}

const ROLL_CSS = `
@keyframes ad-drp-out { to { opacity: 0; transform: translateY(-70%); filter: blur(2px); } }
@keyframes ad-drp-in { from { opacity: 0; transform: translateY(70%); filter: blur(2px); } }`;

/** Text that rolls to its new value: only the part that changed moves, the shared start and end stay still. */
function RollText({ text }: { text: string }) {
  const [shown, setShown] = React.useState(text);
  const [from, setFrom] = React.useState<string | null>(null);
  if (text !== shown) {
    setShown(text);
    setFrom(shown);
  }
  if (from == null || from === text) return <span className="whitespace-pre">{text}</span>;
  const most = Math.min(from.length, text.length);
  let head = 0;
  while (head < most && from[head] === text[head]) head++;
  let tail = 0;
  while (tail < most - head && from[from.length - 1 - tail] === text[text.length - 1 - tail]) tail++;
  return (
    <span className="whitespace-pre">
      <span aria-hidden>{text.slice(0, head)}</span>
      <span aria-hidden className="relative inline-grid overflow-clip">
        <span key={text} style={{ animation: "ad-drp-in 240ms var(--ad-ease) both" }}>
          {text.slice(head, text.length - tail)}
        </span>
        <span key={from} className="absolute left-0 top-0" style={{ animation: "ad-drp-out 200ms var(--ad-ease) forwards" }} onAnimationEnd={() => setFrom(null)}>
          {from.slice(head, from.length - tail)}
        </span>
      </span>
      <span aria-hidden>{tail ? text.slice(-tail) : ""}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/**
 * Presets on the left, one month on the right. Click a start day, then an end day; one soft band follows the pointer
 * from the start, and a preset morphs it to the new range. The trigger names the preset when one matches, and its
 * text rolls to the new dates.
 */
export function DateRangePicker({ value, onValueChange, presets = DEFAULT_PRESETS, today = new Date(), inline, className }: DateRangePickerProps) {
  const [view, setView] = React.useState(() => new Date(value.to.getFullYear(), value.to.getMonth(), 1));
  const [anchor, setAnchor] = React.useState<Date | null>(null);
  const [hover, setHover] = React.useState<Date | null>(null);
  const [focus, setFocus] = React.useState<Date>(() => startOfDay(value.to));
  const grid = React.useRef<HTMLDivElement>(null);
  const moved = React.useRef(false);
  const [speed, setSpeed] = React.useState(260);
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
    setSpeed(0);
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

  const pick = (d: Date, ms = 200) => {
    setSpeed(ms);
    if (!anchor) {
      setAnchor(d);
      setHover(null);
      return;
    }
    const r = d < anchor ? { from: d, to: anchor } : { from: anchor, to: d };
    setAnchor(null);
    onValueChange(r);
    if (!inline) setOpen(false, true);
  };
  const choosePreset = (p: RangePreset) => {
    setSpeed(260);
    setAnchor(null);
    setHover(null);
    const r = p.range(today);
    onValueChange(r, p.key);
    if (inline) {
      setView(new Date(r.to.getFullYear(), r.to.getMonth(), 1));
      setFocus(startOfDay(r.to));
    } else setOpen(false, true);
  };

  const lo = startOfDay(shown.from);
  const hi = startOfDay(shown.to);
  const bands = Array.from({ length: Math.ceil(days.length / 7) }, (_, w) => {
    const week = days.slice(w * 7, w * 7 + 7);
    if (week[6] < lo) return { w, a: 7, b: 7 };
    if (week[0] > hi) return { w, a: 0, b: 0 };
    return { w, a: Math.max(0, week.findIndex((d) => d >= lo)), b: 7 - Math.max(0, [...week].reverse().findIndex((d) => d <= hi)) };
  });
  const viewKey = `${view.getFullYear()}-${view.getMonth()}`;
  const rowTop = (w: number) => `calc(var(--spacing) * 7 + 1px + ${w} * (var(--ad-item-h) + 1px))`;
  const cap = (day: Date, name: string) => {
    const i = days.findIndex((d) => sameDay(d, day));
    if (i < 0) return null;
    const col = i % 7;
    const row = Math.floor(i / 7);
    return (
      <span
        key={`${viewKey}-${name}`}
        aria-hidden
        className="pointer-events-none absolute left-0 grid h-item w-[calc(100%/7)] place-items-center transition-transform ease-ad"
        style={{ top: rowTop(0), transform: `translate(${col * 100}%, calc(${row * 100}% + ${row}px))`, transitionDuration: `${speed}ms` }}
      >
        <span className={cn("h-item rounded-control bg-on", inline ? "w-full" : "w-(--ad-item-h)")} />
      </span>
    );
  };

  const presetList = (
    <div className={cn("relative grid content-start gap-px", inline ? "sm:w-32 max-sm:grid-cols-4" : "sm:w-36")} role="listbox" aria-label="Presets">
      <SlidingPill selector='[aria-selected="true"]' className="rounded-control bg-fill-strong" />
      {presets.map((p) => (
        <button
          key={p.key}
          type="button"
          role="option"
          aria-selected={preset?.key === p.key}
          onClick={() => choosePreset(p)}
          className={cn(
            "relative flex h-item cursor-pointer items-center whitespace-nowrap rounded-control text-body ad-press active:scale-[0.97]",
            inline ? "px-2 max-sm:justify-center sm:px-2.5" : "px-2.5 text-left",
            preset?.key === p.key ? "text-ink" : "text-ink hover:bg-fill focus-visible:bg-fill",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  const month = (
    <div className="min-w-0 flex-1">
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
        className="relative mt-1 grid grid-cols-7 gap-y-px"
        role="grid"
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          const k = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key];
          if (k) {
            e.preventDefault();
            shift(k);
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick(focus, 0);
          } else if (e.key === "Escape" && inline && anchor) {
            e.preventDefault();
            setSpeed(0);
            setAnchor(null);
            setHover(null);
          }
        }}
      >
        {bands.map(({ w, a, b }) => (
          <span key={`${viewKey}-${w}`} aria-hidden className="pointer-events-none absolute inset-x-0 h-item" style={{ top: rowTop(w) }}>
            <span
              className="absolute inset-y-0 rounded-control bg-fill transition-[left,width] ease-ad"
              style={{ left: `${(a / 7) * 100}%`, width: `${((b - a) / 7) * 100}%`, transitionDuration: `${speed}ms` }}
            />
          </span>
        ))}
        {cap(shown.from, "from")}
        {sameDay(shown.from, shown.to) ? null : cap(shown.to, "to")}
        {WEEKDAYS_2.map((d) => (
          <span key={d} className="grid h-7 place-items-center text-small text-ink-muted">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const inMonth = d.getMonth() === view.getMonth();
          const edge = sameDay(d, shown.from) || sameDay(d, shown.to);
          return (
            <span key={d.toISOString()} className="relative grid h-item place-items-center">
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
                onPointerEnter={() => {
                  if (!anchor) return;
                  setSpeed(120);
                  setHover(d);
                }}
                className={cn(
                  "grid h-item cursor-pointer place-items-center rounded-control text-body tabular-nums ad-press active:scale-[0.97]",
                  inline ? "w-full" : "w-(--ad-item-h)",
                  edge ? "text-on-ink hover:bg-ink-muted focus-visible:bg-ink-muted" : "hover:bg-fill-strong focus-visible:bg-fill-strong",
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
  );

  if (inline)
    return (
      <div className={cn("grid min-w-0 gap-3", className)}>
        <style href="ad-date-range" precedence="default">
          {ROLL_CSS}
        </style>
        <div className="flex h-control items-center gap-2 text-title font-semibold tabular-nums text-ink">
          <Calendar size={16} className="shrink-0 text-ink-muted" />
          <RollText text={formatRange(value)} />
        </div>
        <div className="flex min-w-0 gap-pad max-sm:flex-col">
          {presetList}
          {month}
        </div>
      </div>
    );

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <style href="ad-date-range" precedence="default">
        {ROLL_CSS}
      </style>
      <P.Trigger data-ad-anchor="" {...press} className={cn(triggerClass, className)}>
        <Calendar size={16} className="shrink-0 text-ink-muted" />
        <span className="truncate">
          <RollText text={labelPreset ? labelPreset.label : formatRange(label)} />
        </span>
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content align="start" sideOffset={6} collisionPadding={8} onCloseAutoFocus={() => setHeld(null)} className={cn(dropdownSurface, "flex gap-nest max-sm:flex-col")}>
          {presetList}
          {month}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
