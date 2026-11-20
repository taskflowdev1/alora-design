import { ChevronLeft, ChevronRight } from "react-feather";
import { addDays, cn, MONTHS, MONTHS_LONG, startOfDay, startOfWeek } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export type Period = "day" | "week" | "month";

function startOf(d: Date, p: Period) {
  if (p === "day") return startOfDay(d);
  if (p === "month") return new Date(d.getFullYear(), d.getMonth(), 1);
  return startOfWeek(d);
}

export function stepPeriod(d: Date, p: Period, n: number) {
  const s = startOf(d, p);
  if (p === "day") return addDays(s, n);
  if (p === "week") return addDays(s, 7 * n);
  return new Date(s.getFullYear(), s.getMonth() + n, 1);
}

/** "7 Nov 2026", "2–8 Nov", "28 Oct – 3 Nov", "November 2026". */
export function periodLabel(d: Date, p: Period) {
  const s = startOf(d, p);
  if (p === "day") return `${s.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  if (p === "month") return `${MONTHS_LONG[s.getMonth()]} ${s.getFullYear()}`;
  const e = addDays(s, 6);
  return s.getMonth() === e.getMonth()
    ? `${s.getDate()}–${e.getDate()} ${MONTHS[e.getMonth()]}`
    : `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]}`;
}

export interface PeriodStepperProps {
  value: Date;
  period: Period;
  onValueChange: (date: Date) => void;
  /** Disable stepping past this date (usually today). */
  max?: Date;
  className?: string;
}

/**
 * ‹ period › where each arrow says what it steps to. The arrows are ghost buttons and the period is plain text between
 * them, so nothing that does nothing looks like a button.
 */
export function PeriodStepper({ value, period, onValueChange, max, className }: PeriodStepperProps) {
  const prev = stepPeriod(value, period, -1);
  const next = stepPeriod(value, period, 1);
  const nextDisabled = max ? next > max : false;
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Tooltip content={periodLabel(prev, period)}>
        <Button variant="ghost" icon aria-label={`Previous: ${periodLabel(prev, period)}`} onClick={() => onValueChange(prev)}>
          <ChevronLeft />
        </Button>
      </Tooltip>
      <span className="inline-flex h-control min-w-32 items-center justify-center px-1 text-body tabular-nums text-ink">
        {periodLabel(value, period)}
      </span>
      <Tooltip content={nextDisabled ? "No later period" : periodLabel(next, period)}>
        <span>
          <Button variant="ghost" icon aria-label={`Next: ${periodLabel(next, period)}`} disabled={nextDisabled} onClick={() => onValueChange(next)}>
            <ChevronRight />
          </Button>
        </span>
      </Tooltip>
    </div>
  );
}
