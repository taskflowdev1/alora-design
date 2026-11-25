import * as React from "react";
import { X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

const DIGITS = "0123456789".split("");

/** A count that rolls: each place is a 0–9 strip one line tall, so only the digits that changed move. */
function RollCount({ value }: { value: number }) {
  const places = String(value).split("");
  return (
    <span className="relative inline-flex tabular-nums">
      <span className="sr-only">{value}</span>
      {places.map((d, i) => (
        <span key={places.length - i} aria-hidden className="block h-[1lh] overflow-hidden">
          <span className="block transition-transform duration-[260ms] ease-ad motion-reduce:transition-none" style={{ transform: `translateY(calc(${d} * -1lh))` }}>
            {DIGITS.map((n) => (
              <span key={n} className="block h-[1lh]">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

const face = (on: boolean, away: string) =>
  cn("col-start-1 row-start-1 flex min-w-0 items-center gap-2 transition-[translate,opacity] duration-[240ms] ease-ad motion-reduce:transition-none", !on && cn("pointer-events-none opacity-0", away));

export interface BulkActionBarProps {
  /** How many rows are ticked. The bar is up while this is above zero or `done` is set. */
  count: number;
  /** What was ticked, after the count: "selected" by default. */
  label?: React.ReactNode;
  /** The bulk actions. Keep to one or two. */
  actions?: React.ReactNode;
  onClear?: () => void;
  /** The answer after an action ("3 orders shipped"): it rolls into the bar in place of the count, beside Undo. */
  done?: React.ReactNode;
  onUndo?: () => void;
  /** How long the answer and its Undo stay, in ms. A hover or keyboard focus holds them. */
  undoFor?: number;
  /** The answer's time ran out: clear `done` and the bar sinks. */
  onExpire?: () => void;
  className?: string;
}

/**
 * The floating bar over a list with ticked rows: it rises with the count rolling, carries the bulk actions, turns into
 * the answer with Undo, and sinks. It sits absolutely at the bottom of its positioned parent, so the list never moves.
 * In a `Card inset="nest"` its corners run concentric with the card's and the buttons' with its own.
 */
export function BulkActionBar({ count, label = "selected", actions, onClear, done, onUndo, undoFor = 6000, onExpire, className }: BulkActionBarProps) {
  const isDone = done != null;
  const up = count > 0 || isDone;
  const [lastCount, setLastCount] = React.useState(count);
  if (count > 0 && count !== lastCount) setLastCount(count);
  const lastDone = React.useRef(done);
  React.useLayoutEffect(() => {
    if (isDone) lastDone.current = done;
  });

  const root = React.useRef<HTMLDivElement>(null);
  const pick = React.useRef<HTMLDivElement>(null);
  const answer = React.useRef<HTMLDivElement>(null);
  const [held, setHeld] = React.useState(false);
  const expire = React.useRef(onExpire);
  React.useEffect(() => {
    expire.current = onExpire;
  });

  React.useEffect(() => {
    if (!isDone || held) return;
    const t = window.setTimeout(() => expire.current?.(), undoFor);
    return () => window.clearTimeout(t);
  }, [isDone, held, undoFor]);

  React.useLayoutEffect(() => {
    if (!root.current?.contains(document.activeElement)) return;
    if (isDone) answer.current?.querySelector("button")?.focus();
    else if (count > 0) pick.current?.querySelector<HTMLElement>("[data-variant=primary]")?.focus();
  }, [isDone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={root}
      role="region"
      aria-label="Bulk actions"
      inert={!up}
      data-toast-avoid
      style={{ "--ad-fill": "var(--ad-side-fill-strong)" } as React.CSSProperties}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHeld(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHeld(false)}
      onFocusCapture={(e) => e.target.matches(":focus-visible") && setHeld(true)}
      onBlurCapture={() => setHeld(false)}
      className={cn(
        "ad-on-dark absolute inset-x-nest bottom-nest z-20 grid overflow-hidden rounded-control bg-side-raised p-nest text-body text-side-ink shadow-dialog",
        "transition-[translate,opacity] duration-[260ms] ease-ad motion-reduce:transition-none",
        !up && "pointer-events-none translate-y-[calc(100%+16px)] opacity-0",
        className,
      )}
    >
      <div ref={pick} inert={isDone} className={face(!isDone, "-translate-y-full")}>
        <Tooltip content="Clear selection">
          <Button icon size="sm" variant="ghost" aria-label="Clear selection" onClick={onClear} className="rounded-item">
            <X />
          </Button>
        </Tooltip>
        <span aria-live="polite" className="flex min-w-0 flex-1 items-baseline gap-[0.3em] truncate font-medium">
          <RollCount value={lastCount} />
          <span className="truncate">{label}</span>
        </span>
        <div className="flex shrink-0 gap-gap [&_button]:rounded-item">{actions}</div>
      </div>
      <div ref={answer} inert={!isDone} className={face(isDone, "translate-y-full")}>
        <span role="status" className="min-w-0 flex-1 truncate pl-2 font-medium">
          {isDone ? done : lastDone.current}
        </span>
        <Button size="sm" variant="ghost" onClick={onUndo} className="rounded-item">
          Undo
        </Button>
      </div>
    </div>
  );
}
