import * as React from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { cn, MONTHS } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "./mobile-sheet";
import { MobileFilterChips } from "./mobile-chip-row";

export interface DateRange {
  from: Date;
  to: Date;
}

const FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const day0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** "17 – 23 Nov", "28 Oct – 3 Nov", "17 Nov" (one day), with the year only when it isn't the current one. */
export function formatRange(r: DateRange, now = new Date()) {
  const y = (d: Date) => (d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : "");
  if (same(r.from, r.to)) return `${r.from.getDate()} ${MONTHS[r.from.getMonth()]}${y(r.from)}`;
  if (r.from.getMonth() === r.to.getMonth() && r.from.getFullYear() === r.to.getFullYear()) return `${r.from.getDate()} – ${r.to.getDate()} ${MONTHS[r.to.getMonth()]}${y(r.to)}`;
  return `${r.from.getDate()} ${MONTHS[r.from.getMonth()]}${y(r.from)} – ${r.to.getDate()} ${MONTHS[r.to.getMonth()]}${y(r.to)}`;
}

export interface MobileDateRangeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  value: DateRange;
  onValueChange: (value: DateRange) => void;
  /** Today (pinned in demos). Later days can't be picked. */
  today?: Date;
}

type Preset = "today" | "7d" | "30d" | "month";

/**
 * A date range on a phone: quick ranges on top, then one month. Tap a start day, then an end day; the days between
 * fill as one soft band with rounded ends, the two ends in ink. Swipe the month sideways (or use the arrows) to move:
 * the month follows the finger, and lets go to the next one past 48 px or on a flick, or springs back.
 * The sheet edits a draft; the button names the range it will show. Future days are off.
 */
export function MobileDateRangeSheet({ open, onOpenChange, title = "Dates", value, onValueChange, today = new Date() }: MobileDateRangeSheetProps) {
  const t0 = day0(today);
  const [from, setFrom] = React.useState<Date>(value.from);
  const [to, setTo] = React.useState<Date | null>(value.to);
  const [month, setMonth] = React.useState(() => new Date(value.to.getFullYear(), value.to.getMonth(), 1));
  const [dir, setDir] = React.useState(0);
  React.useEffect(() => {
    if (!open) return;
    setFrom(value.from);
    setTo(value.to);
    setMonth(new Date(value.to.getFullYear(), value.to.getMonth(), 1));
  }, [open, value]);
  const presets: Record<Preset, DateRange> = {
    today: { from: t0, to: t0 },
    "7d": { from: addDays(t0, -6), to: t0 },
    "30d": { from: addDays(t0, -29), to: t0 },
    month: { from: new Date(t0.getFullYear(), t0.getMonth(), 1), to: t0 },
  };
  const preset = (Object.keys(presets) as Preset[]).find((k) => to && same(presets[k].from, from) && same(presets[k].to, to)) ?? null;
  const go = (n: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + n, 1);
    if (n > 0 && next > t0) return;
    setDir(n);
    setMonth(next);
  };
  // With a range picked, a tap starts over; while picking the end, a day before the start becomes the new start.
  const tap = (d: Date) => {
    if (to || d < from) {
      setFrom(d);
      setTo(null);
    } else setTo(d);
  };
  // Monday-first grid with blanks before the 1st.
  const first = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array.from({ length: first }, () => null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  while (cells.length % 7) cells.push(null);
  const end = to ?? from;
  const swipe = React.useRef<{ x: number; y: number; t: number; lock: "" | "x" | "y"; dx: number; moved: boolean } | null>(null);
  const grid = React.useRef<HTMLDivElement>(null);
  const swiped = React.useRef(false);
  const moveGrid = (x: number, ms = 0, fade = false) => {
    const el = grid.current;
    if (!el) return;
    el.style.transition = ms ? `transform ${ms}ms var(--ad-ease), opacity ${ms}ms var(--ad-ease)` : "none";
    el.style.transform = x ? `translateX(${x}px)` : "";
    el.style.opacity = fade ? "0" : "";
  };
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= t0;
  const nav = "grid size-touch shrink-0 cursor-pointer place-items-center rounded-control text-ink transition-[background-color,transform] duration-[150ms] ease-ad focus-visible:bg-fill active:scale-[0.92] disabled:pointer-events-none disabled:opacity-30 [-webkit-tap-highlight-color:transparent]";
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <Button variant="primary" disabled={!to} onClick={() => to && (onValueChange({ from, to }), onOpenChange(false))}>
          {to ? `Show ${formatRange({ from, to }, today)}` : "Pick the last day"}
        </Button>
      }
    >
      <div className="grid gap-3">
        <MobileFilterChips<Preset>
          aria-label="Quick ranges"
          value={preset}
          onValueChange={(k) => {
            setFrom(presets[k].from);
            setTo(presets[k].to);
            setMonth(new Date(presets[k].to.getFullYear(), presets[k].to.getMonth(), 1));
          }}
          options={[
            { value: "today", label: "Today" },
            { value: "7d", label: "7 days" },
            { value: "30d", label: "30 days" },
            { value: "month", label: "This month" },
          ]}
        />
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Previous month" className={nav} onClick={() => go(-1)}>
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
          <span aria-live="polite" className="text-[15px] font-semibold">
            {FULL[month.getMonth()]} {month.getFullYear()}
          </span>
          <button type="button" aria-label="Next month" className={nav} disabled={!canNext} onClick={() => go(1)}>
            <ChevronRight size={22} strokeWidth={1.75} />
          </button>
        </div>
        <div
          className="grid touch-pan-y select-none"
          onPointerDown={(e) => ((swiped.current = false), (swipe.current = { x: e.clientX, y: e.clientY, t: performance.now(), lock: "", dx: 0, moved: false }))}
          onPointerMove={(e) => {
            const s = swipe.current;
            if (!s) return;
            const dx = e.clientX - s.x;
            const dy = e.clientY - s.y;
            if (!s.lock) {
              if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
              s.lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
              if (s.lock === "x") e.currentTarget.setPointerCapture(e.pointerId);
            }
            if (s.lock !== "x") return;
            s.moved = true;
            // Towards a month that can't be shown (the future), it only gives a little.
            s.dx = dx < 0 && !canNext ? dx * 0.25 : dx;
            moveGrid(s.dx);
          }}
          onPointerUp={() => {
            const s = swipe.current;
            swipe.current = null;
            if (!s || s.lock !== "x") return;
            swiped.current = true;
            const flick = Math.abs(s.dx) / Math.max(1, performance.now() - s.t) > 0.5;
            const n = s.dx < 0 ? 1 : -1;
            if ((Math.abs(s.dx) > 48 || (flick && Math.abs(s.dx) > 16)) && (n < 0 || canNext)) {
              // Out the way it went; the next month comes in from the other side.
              moveGrid(n * -(grid.current?.offsetWidth ?? 320) * 0.5, 140, true);
              window.setTimeout(() => (moveGrid(0), go(n)), 140);
            } else moveGrid(0, 240);
          }}
          onPointerCancel={() => ((swipe.current = null), moveGrid(0, 240))}
          onClickCapture={(e) => {
            // The click that ends a swipe is not a tap on a day.
            if (swiped.current) e.stopPropagation();
            swiped.current = false;
          }}
        >
          <div aria-hidden className="grid grid-cols-7 pb-1 text-center text-[13px] text-ink-muted">
            {DAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div
            ref={grid}
            key={`${month.getFullYear()}-${month.getMonth()}`}
            role="grid"
            aria-label={`${FULL[month.getMonth()]} ${month.getFullYear()}`}
            className="ad-range-grid grid grid-cols-7 gap-y-1"
            style={{ animation: dir ? `ad-range-${dir > 0 ? "next" : "prev"} 220ms var(--ad-ease)` : undefined }}
          >
            <style href="ad-date-range" precedence="default">{`@keyframes ad-range-next { from { opacity: 0; transform: translateX(24px); } } @keyframes ad-range-prev { from { opacity: 0; transform: translateX(-24px); } } @media (prefers-reduced-motion: reduce) { .ad-range-grid { animation: none !important; } }`}</style>
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const col = i % 7;
              const isFrom = same(d, from);
              const isTo = same(d, end);
              const inside = d >= from && d <= end;
              const band = inside && !same(from, end);
              const roundL = isFrom || col === 0 || d.getDate() === 1;
              const roundR = isTo || col === 6 || d.getDate() === count;
              const future = d > t0;
              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  aria-selected={inside}
                  aria-label={`${d.getDate()} ${FULL[d.getMonth()]}`}
                  disabled={future}
                  onClick={() => tap(d)}
                  className="group/day relative grid h-touch cursor-pointer place-items-center text-[16px] tabular-nums outline-none [-webkit-tap-highlight-color:transparent] disabled:cursor-default disabled:text-ink-muted disabled:opacity-40"
                >
                  {band ? <span aria-hidden className={cn("absolute inset-y-0 inset-x-0 bg-fill", roundL && "left-[3px] rounded-l-control", roundR && "right-[3px] rounded-r-control")} /> : null}
                  <span
                    className={cn(
                      "relative grid size-[40px] place-items-center rounded-control transition-[background-color,transform] duration-[150ms] ease-ad group-active/day:scale-[0.92]",
                      isFrom || (to && isTo) ? "bg-on font-semibold text-on-ink group-focus-visible/day:bg-ink-muted" : cn(same(d, t0) ? "font-semibold text-ink" : "text-ink", "group-focus-visible/day:bg-fill-strong"),
                    )}
                  >
                    {d.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </MobileSheet>
  );
}
