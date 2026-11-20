import * as React from "react";
import { Check, Copy } from "react-feather";
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
        copyText(value).then(
          () => {
            setDone(true);
            onCopied?.();
            window.clearTimeout(t.current);
            t.current = window.setTimeout(() => setDone(false), 1400);
          },
          () => {},
        );
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
      <span className="relative grid size-[14px] shrink-0 place-items-center text-ink-muted">
        {/* The icons cross over: the outgoing one shrinks and blurs as it fades. */}
        <Copy size={14} className={cn("absolute transition-[opacity,scale,filter] duration-[160ms] ease-ad", done && "opacity-0 scale-[0.8] blur-[2px]")} />
        <Check size={14} className={cn("absolute transition-[opacity,scale,filter] duration-[160ms] ease-ad", !done && "opacity-0 scale-[0.8] blur-[2px]")} />
      </span>
    </button>
  );
}
