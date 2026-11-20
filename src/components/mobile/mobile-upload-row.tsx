import * as React from "react";
import { Check, RotateCw, X } from "react-feather";
import { cn } from "@/lib/ad";

export interface MobileUploadRowProps {
  name: string;
  /** "2,4 MB". */
  size?: string;
  /** 0 to 1. */
  progress: number;
  state: "uploading" | "done" | "failed";
  /** A thumbnail (Thumb or img). */
  media?: React.ReactNode;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

/**
 * One file going up (a delivery photo, an invoice): its picture and name, a slim bar that fills at the speed of the
 * upload (linear, it shows progress), and one action at the right: cancel while it runs, retry if it failed. Done
 * swaps the bar for a tick and the size. A failed row says so in words, not red.
 */
export function MobileUploadRow({ name, size, progress, state, media, onCancel, onRetry, className }: MobileUploadRowProps) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return (
    <div role="listitem" className={cn("flex min-h-[60px] min-w-0 items-center gap-3 rounded-item px-[calc(var(--ad-pad)-var(--ad-nest))] py-2", className)}>
      {media ? <span className="shrink-0">{media}</span> : null}
      <span className="grid min-w-0 flex-1 gap-1.5">
        <span className="flex min-w-0 items-baseline justify-between gap-2">
          {/* Long names cut in the middle, so the end that tells files apart ("…_0412.jpg") stays. */}
          <span className="flex min-w-0 text-[15px] text-ink" title={name}>
            <span className="truncate">{name.length > 12 ? name.slice(0, -8) : name}</span>
            {name.length > 12 ? <span className="shrink-0 whitespace-pre">{name.slice(-8)}</span> : null}
          </span>
          <span className="shrink-0 text-[13px] tabular-nums text-ink-muted">{state === "uploading" ? `${pct}%` : state === "failed" ? "Didn't upload" : size}</span>
        </span>
        <span
          role="progressbar"
          aria-label={`${name} upload`}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn("h-[4px] overflow-hidden rounded-full bg-fill-strong transition-opacity duration-[200ms]", state === "done" && "opacity-0")}
        >
          <span className="block h-full rounded-full bg-on transition-[width] duration-[200ms] ease-linear" style={{ width: `${pct}%` }} />
        </span>
      </span>
      {state === "done" ? (
        <span className="grid size-touch shrink-0 place-items-center text-ink" aria-label="Uploaded">
          <Check size={20} strokeWidth={2} />
        </span>
      ) : (
        <button
          type="button"
          aria-label={state === "failed" ? `Retry ${name}` : `Cancel ${name}`}
          onClick={state === "failed" ? onRetry : onCancel}
          className="grid size-touch shrink-0 cursor-pointer place-items-center rounded-control text-ink ad-press focus-visible:bg-fill active:scale-[0.92] data-pressed:scale-[0.92] active:bg-fill data-pressed:bg-fill"
        >
          {state === "failed" ? <RotateCw size={20} strokeWidth={1.75} /> : <X size={20} strokeWidth={1.75} />}
        </button>
      )}
    </div>
  );
}
