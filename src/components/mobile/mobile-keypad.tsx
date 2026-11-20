import * as React from "react";
import { Delete } from "react-feather";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "./mobile-sheet";

export interface MobileAmountKeypadProps {
  value: number;
  onValueChange: (value: number) => void;
  /** Above the amount, muted ("Price", "Cash received"). */
  label?: string;
  /** Largest amount it takes. */
  max?: number;
  /** One-tap amounts above the keys ("Exact", Rp 50.000…). */
  quick?: { label: string; value: number }[];
  className?: string;
}

const key =
  "grid h-[52px] cursor-pointer touch-manipulation select-none place-items-center rounded-control bg-fill text-[24px] font-medium tabular-nums text-ink ad-press focus-visible:bg-fill-strong active:scale-[0.97] data-pressed:scale-[0.97] active:bg-fill-strong data-pressed:bg-fill-strong";

/**
 * Money on a phone without the system keyboard: the amount in rupiah, formatted as you type (Rp 125.000), over a
 * 3 × 4 pad with a 000 key (prices end in thousands). Delete removes one digit; hold it to clear. Keys dip when pressed.
 * After a one-tap amount the first digit starts a new amount, as typing into a selected field does. A key that would
 * pass `max` shakes the amount once instead of doing nothing. A hardware keyboard works too (digits, Backspace) while
 * the pad has focus.
 */
export function MobileAmountKeypad({ value, onValueChange, label, max = 999_999_999, quick, className }: MobileAmountKeypadProps) {
  const hold = React.useRef(0);
  const fresh = React.useRef(false);
  const amount = React.useRef<HTMLOutputElement>(null);
  const refuse = () =>
    !prefersReducedMotion() &&
    amount.current?.animate([{ translate: "0" }, { translate: "-6px" }, { translate: "5px" }, { translate: "-3px" }, { translate: "2px" }, { translate: "0" }], { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  const press = (k: string) => {
    const replace = fresh.current && /^\d$/.test(k);
    fresh.current = false;
    if (k === "del") return onValueChange(Math.floor(value / 10));
    const next = Number(replace ? k : `${value || ""}${k}`);
    if (next <= max) onValueChange(next);
    else refuse();
  };
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "del"];
  return (
    <div
      role="group"
      aria-label={label ?? "Amount"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) press(e.key);
        else if (e.key === "Backspace") press("del");
        else return;
        e.preventDefault();
      }}
      className={cn("group/pad grid gap-3 outline-none", className)}
    >
      <div className="grid justify-items-center gap-1 py-2">
        {label ? <span className="text-[13px] text-ink-muted">{label}</span> : null}
        {/* The amount takes typed digits while the pad has keyboard focus: its line shows a fill then. */}
        <output ref={amount} aria-live="polite" className={cn("flex items-center rounded-control px-3 text-[32px] font-semibold leading-tight tabular-nums transition-colors duration-[150ms] ease-ad group-focus-visible/pad:bg-fill", value ? "text-ink" : "text-ink-muted")}>
          {formatRp(value)}
          <span aria-hidden className="ml-0.5 h-8 w-[2px] animate-[ad-pulse_1s_steps(1)_infinite] rounded-full bg-ink" />
        </output>
      </div>
      {quick?.length ? (
        <div className="flex gap-gap">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                fresh.current = true;
                onValueChange(q.value);
              }}
              className={cn(
                "h-touch min-w-0 flex-1 cursor-pointer truncate rounded-control px-2 text-[15px] tabular-nums ad-press active:scale-[0.97] data-pressed:scale-[0.97]",
                value === q.value ? "bg-fill-strong font-medium text-ink focus-visible:bg-ink-muted focus-visible:text-surface" : "bg-fill text-ink focus-visible:bg-fill-strong",
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-gap">
        {keys.map((k) =>
          k === "del" ? (
            <button
              key={k}
              type="button"
              aria-label="Delete, hold to clear"
              onClick={() => press("del")}
              onPointerDown={() => {
                window.clearTimeout(hold.current);
                hold.current = window.setTimeout(() => onValueChange(0), 550);
              }}
              onPointerUp={() => window.clearTimeout(hold.current)}
              onPointerLeave={() => window.clearTimeout(hold.current)}
              onContextMenu={(e) => e.preventDefault()}
              className={cn(key, "bg-transparent")}
            >
              <Delete size={24} strokeWidth={1.75} />
            </button>
          ) : (
            <button key={k} type="button" onClick={() => press(k)} className={cn(key, k === "000" && "text-[20px]")}>
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export interface MobileAmountSheetProps extends MobileAmountKeypadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** The button label; default "Done". */
  doneLabel?: string;
}

/** The keypad in a bottom sheet, editing a draft: Done keeps the amount, closing any other way leaves it as it was. */
export function MobileAmountSheet({ open, onOpenChange, title, value, onValueChange, doneLabel = "Done", className, ...pad }: MobileAmountSheetProps) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className={className}
      footer={
        <Button variant="primary" onClick={() => (onValueChange(draft), onOpenChange(false))}>
          {doneLabel}
        </Button>
      }
    >
      <MobileAmountKeypad value={draft} onValueChange={setDraft} {...pad} />
    </MobileSheet>
  );
}
