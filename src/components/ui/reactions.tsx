import * as React from "react";
import { cn } from "@/lib/ad";
import { RollingNumber } from "@/components/ui/number-dial";

export interface Reaction {
  emoji: string;
  count: number;
  /** You reacted with it. */
  mine?: boolean;
  /** Who reacted, for the accessible name: "Dewi, Rudi". */
  who?: string;
}

export interface ReactionsProps {
  items: Reaction[];
  /**
   * Save a toggle. The pill flips and its count rolls at once; if this rejects, it flips back and `onError` runs.
   */
  onToggle: (emoji: string, on: boolean) => Promise<void> | void;
  onError?: (emoji: string, error: unknown) => void;
  className?: string;
}

/**
 * Emoji reactions under a message, updated optimistically: a tap shows the result immediately (your pill rises onto the
 * track, the count rolls only the digit that changed) and saves in the background, rolling back if the save fails.
 * Your own reactions are the raised pill on the track; the rest sit quietly on it.
 */
export function Reactions({ items, onToggle, onError, className }: ReactionsProps) {
  const [pending, setPending] = React.useState<Record<string, boolean>>({});
  const shown = items.map((r) => {
    const p = pending[r.emoji];
    if (p === undefined || p === !!r.mine) return r;
    return { ...r, mine: p, count: r.count + (p ? 1 : -1) };
  });
  return (
    <div role="group" aria-label="Reactions" className={cn("inline-flex w-fit flex-wrap items-center gap-0.5 rounded-control bg-track p-nest", className)}>
      {shown.map((r) => (
        <button
          key={r.emoji}
          type="button"
          aria-pressed={!!r.mine}
          aria-label={`${r.emoji} ${r.count}${r.who ? `: ${r.who}` : ""}`}
          onClick={async () => {
            const on = !r.mine;
            setPending((p) => ({ ...p, [r.emoji]: on }));
            try {
              await onToggle(r.emoji, on);
            } catch (e) {
              onError?.(r.emoji, e);
            } finally {
              setPending(({ [r.emoji]: _, ...rest }) => rest);
            }
          }}
          className={cn(
            "relative inline-flex h-6 cursor-pointer select-none items-center gap-1 rounded-item px-bubble-sm text-small tabular-nums transition-[background-color,box-shadow,transform,scale,filter] duration-[150ms] ease-ad after:absolute after:-inset-y-[3px] after:inset-x-0 active:scale-[0.97]",
            r.mine
              ? "bg-sel font-medium text-ink shadow-sel hover:brightness-[0.94] dark:hover:brightness-[0.85] focus-visible:brightness-[0.88] dark:focus-visible:brightness-[0.78]"
              : "text-ink-muted hover:bg-fill-strong focus-visible:bg-fill-strong",
          )}
        >
          <span aria-hidden>{r.emoji}</span>
          <RollingNumber value={r.count} format={String} />
        </button>
      ))}
    </div>
  );
}
