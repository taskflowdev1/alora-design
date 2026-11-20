import * as React from "react";
import { ArrowRight, Check } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface ProposedChangeRow {
  id: string;
  /** What changes: "Gelas kopi tanah liat · price". */
  label: React.ReactNode;
  from: React.ReactNode;
  to: React.ReactNode;
}

export interface ProposedChangeProps {
  /** A question: "Update 3 prices?" */
  title: React.ReactNode;
  changes: ProposedChangeRow[];
  /** "pending" asks; "applied" shows it done with Undo; "dismissed" shows it was left alone (Undo asks again). */
  state?: "pending" | "applying" | "applied" | "dismissed";
  onApply: () => void;
  onDismiss: () => void;
  onUndo?: () => void;
  applyLabel?: string;
  /** "touch": 44 px buttons that share the row, 15 px rows, for phones. */
  size?: "default" | "touch";
  className?: string;
}

/**
 * An agent may suggest anything, but it asks before it changes your data: the exact before → after per row, then Apply
 * (the one accent) or Not now. While applying the button keeps its width and says so; once applied the card says what
 * happened and offers Undo instead of a second confirm.
 */
// The card is the track; its rows and quiet buttons are the raised step on it (sel: white in light, fill-strong in dark),
// so in dark they sit above the card instead of reading as holes. Hover and focus take the next step: fill-strong in
// light, a notch lighter in dark.
const onFill = "bg-sel hover:bg-fill-strong focus-visible:bg-fill-strong dark:hover:bg-sel dark:focus-visible:bg-sel dark:hover:brightness-[1.25] dark:focus-visible:brightness-[1.25]";

export function ProposedChange({ title, changes, state = "pending", onApply, onDismiss, onUndo, applyLabel = "Apply", size = "default", className }: ProposedChangeProps) {
  const settled = state === "applied" || state === "dismissed";
  const touch = size === "touch" ? "h-touch flex-1 text-[15px]" : undefined;
  return (
    <section aria-label="Proposed change" className={cn("grid gap-2 rounded-card bg-track p-[calc(var(--ad-nest)*3)]", className)}>
      <h4 className="px-1 text-body font-medium text-ink">{title}</h4>
      <ul className="grid gap-px">
        {changes.map((c) => (
          <li key={c.id} className={cn("grid min-h-item grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-item bg-sel px-2.5 py-1.5", size === "touch" ? "min-h-touch text-[15px]" : "text-body")}>
            <span className="min-w-0 truncate text-ink">{c.label}</span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <span className={cn("text-ink-muted", state === "applied" && "line-through")}>{c.from}</span>
              <ArrowRight size={14} className="text-ink-muted" aria-label="to" />
              <span className={cn("font-medium text-ink", state === "dismissed" && "font-normal text-ink-muted")}>{c.to}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex min-h-control items-center justify-end gap-gap">
        {settled ? (
          <span role="status" className="mr-auto inline-flex animate-[ad-fade-in_160ms_var(--ad-ease)] items-center gap-1.5 px-1 text-body text-ink-muted">
            {state === "applied" ? <Check size={16} /> : null}
            {state === "applied" ? `Applied ${changes.length === 1 ? "1 change" : `${changes.length} changes`}` : "Left as it was"}
          </span>
        ) : null}
        {settled && onUndo ? (
          <Button variant="secondary" onClick={onUndo} className={cn(onFill, touch && "h-touch text-[15px]")}>
            Undo
          </Button>
        ) : null}
        {settled ? null : (
          <>
            <Button variant="secondary" onClick={onDismiss} disabled={state === "applying"} className={cn(onFill, touch)}>
              Not now
            </Button>
            <Button variant="primary" onClick={() => state === "pending" && onApply()} aria-busy={state === "applying" || undefined} className={touch}>
              {/* Both labels share one cell, so the button keeps its width when it says Applying…. */}
              <span className="inline-grid justify-items-center">
                <span aria-hidden className="invisible [grid-area:1/1]">
                  {applyLabel}
                </span>
                <span aria-hidden className="invisible [grid-area:1/1]">
                  Applying…
                </span>
                <span className="[grid-area:1/1]">{state === "applying" ? "Applying…" : applyLabel}</span>
              </span>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
