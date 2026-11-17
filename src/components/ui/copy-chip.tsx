import * as React from "react";
import { Check, Copy } from "react-feather";
import { cn } from "@/lib/ad";

/** An id or code that copies on click. The icon turns into a check for a moment; nothing moves. */
export function CopyChip({ value, children, onCopied, className }: { value: string; children?: React.ReactNode; onCopied?: () => void; className?: string }) {
  const [done, setDone] = React.useState(false);
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  return (
    <button
      type="button"
      aria-label={`Copy ${value}`}
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard?.writeText(value);
        setDone(true);
        onCopied?.();
        window.clearTimeout(t.current);
        t.current = window.setTimeout(() => setDone(false), 1400);
      }}
      className={cn(
        "inline-flex h-6 max-w-full shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-item bg-fill px-bubble-sm text-small font-medium tabular-nums text-ink",
        "transition-[background-color,transform] duration-[160ms] ease-ad hover:bg-fill-hover active:scale-[0.96]",
        className,
      )}
    >
      <span className="truncate">{children ?? value}</span>
      <span className="relative grid size-3.5 shrink-0 place-items-center text-ink-muted">
        <Copy size={13} className={cn("absolute transition-opacity duration-[160ms]", done && "opacity-0")} />
        <Check size={13} className={cn("absolute transition-opacity duration-[160ms]", !done && "opacity-0")} />
      </span>
    </button>
  );
}
