import * as React from "react";
import { cn } from "@/lib/ad";

/**
 * Copies text and resolves only once it is really on the clipboard, so the check never shows for a write the browser
 * refused (http, an iframe without permission). Falls back to the older selection copy where the async API is missing
 * or refuses.
 */
function copyText(text: string) {
  const legacy = () => {
    const back = document.activeElement as HTMLElement | null;
    const t = document.createElement("textarea");
    t.value = text;
    t.setAttribute("readonly", "");
    t.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.append(t);
    t.select();
    const ok = document.execCommand("copy");
    t.remove();
    back?.focus({ preventScroll: true });
    return ok ? Promise.resolve() : Promise.reject(new Error("Copy failed"));
  };
  return navigator.clipboard?.writeText ? navigator.clipboard.writeText(text).catch(legacy) : legacy();
}

/** How long the confirmation stays before the icon morphs back. */
const CONFIRM = 1500;

/** Copies on demand and holds `done` for a moment. A refused write never confirms. */
function useCopy(value: string, onCopied?: () => void) {
  const [done, setDone] = React.useState(false);
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  const copy = () =>
    copyText(value).then(
      () => {
        setDone(true);
        onCopied?.();
        window.clearTimeout(t.current);
        t.current = window.setTimeout(() => setDone(false), CONFIRM);
      },
      () => {},
    );
  return { done, copy };
}

const STROKE = "transition-[stroke-dashoffset,opacity] ease-ad motion-reduce:transition-none";

/** The copy icon's two sheets retract along their own strokes while the confirmation draws itself, and back. */
function CopyMorph({ done, size }: { done: boolean; size: number }) {
  const sheet = cn(STROKE, "duration-[180ms]", done ? "opacity-0 [stroke-dashoffset:1]" : "opacity-100 [stroke-dashoffset:0] delay-[90ms]");
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="9" y="9" width="13" height="13" rx="2" pathLength={1} strokeDasharray="1 1" className={sheet} />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" pathLength={1} strokeDasharray="1 1" className={sheet} />
      <path
        d="M4 12.5 9.5 18 20 6.5"
        pathLength={1}
        strokeDasharray="1 1"
        className={cn(STROKE, "duration-[240ms]", done ? "opacity-100 [stroke-dashoffset:0] delay-[110ms]" : "opacity-0 [stroke-dashoffset:1]")}
      />
    </svg>
  );
}

/** An id or code that copies on click. The icon morphs into a confirmation for a moment; nothing moves. */
export function CopyChip({ value, children, onCopied, className }: { value: string; children?: React.ReactNode; onCopied?: () => void; className?: string }) {
  const { done, copy } = useCopy(value, onCopied);
  return (
    <button
      type="button"
      aria-label={`Copy ${value}`}
      onClick={(e) => {
        e.stopPropagation();
        void copy();
      }}
      className={cn(
        "inline-flex h-[24px] max-w-full shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-item bg-fill px-bubble-sm text-small font-medium tabular-nums text-ink",
        "ad-press hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.97]",
        className,
      )}
    >
      <span translate="no" className="truncate">
        {children ?? value}
      </span>
      <span className="grid size-[14px] shrink-0 place-items-center text-ink-muted">
        <CopyMorph done={done} size={14} />
      </span>
    </button>
  );
}

/** Digits read in groups ("8808 1234 5678"); anything else (an invoice number) is already readable and stays whole. */
const groupsOf = (value: string, size: number) => (/^\d+$/.test(value) && size > 0 ? (value.match(new RegExp(`\\d{1,${size}}`, "g")) ?? [value]) : [value]);

export interface CopyFieldProps {
  /** The exact text that is copied, with no spaces. */
  value: string;
  /** What the number is: "Virtual account BCA". */
  label: React.ReactNode;
  /** Digits per group when showing an all-digit value. 0 shows it whole. */
  group?: number;
  onCopied?: () => void;
  className?: string;
}

/**
 * A number someone has to read out or paste elsewhere: a virtual account, an invoice. The whole field is the button;
 * the number is grouped for reading but copies clean, and the icon morphs into a confirmation in place, then back.
 */
export function CopyField({ value, label, group = 4, onCopied, className }: CopyFieldProps) {
  const { done, copy } = useCopy(value, onCopied);
  return (
    <button
      type="button"
      aria-label={`Copy ${typeof label === "string" ? `${label} ` : ""}${value}`}
      onClick={(e) => {
        e.stopPropagation();
        void copy();
      }}
      className={cn(
        "flex w-full min-w-0 cursor-pointer select-none items-center justify-between gap-3 rounded-control bg-fill py-2.5 pl-3 pr-3.5 text-left",
        "ad-press hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.985]",
        className,
      )}
    >
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate text-small text-ink-muted">{label}</span>
        <span translate="no" className="flex min-w-0 gap-[0.42em] truncate text-title font-semibold tabular-nums text-ink">
          {groupsOf(value, group).map((g, i) => (
            <span key={i}>{g}</span>
          ))}
        </span>
      </span>
      <span className="grid size-[16px] shrink-0 place-items-center text-ink-muted">
        <CopyMorph done={done} size={16} />
      </span>
      <span className="sr-only" aria-live="polite">
        {done ? "Copied" : ""}
      </span>
    </button>
  );
}
