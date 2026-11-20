import * as React from "react";
import { Minus, Plus } from "react-feather";
import { cn } from "@/lib/ad";

export interface QuantityStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** "touch": 44 px buttons for phones. */
  size?: "default" | "sm" | "touch";
  className?: string;
  "aria-label"?: string;
}

/** − value +, in one soft track. The buttons sit one nest gap inside it, concentric. Type a number too. */
export function QuantityStepper({ value, onValueChange, min = 0, max = Infinity, step = 1, size = "default", className, ...aria }: QuantityStepperProps) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const commit = () => {
    if (draft == null) return;
    const n = Number(draft.replace(/\D/g, ""));
    if (Number.isFinite(n) && draft !== "") onValueChange(clamp(n));
    setDraft(null);
  };
  const btn = cn(
    "grid aspect-square h-full shrink-0 cursor-pointer place-items-center rounded-item text-ink transition-[background-color,transform] duration-[150ms] ease-ad hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[16px]",
  );
  return (
    <div
      role="group"
      aria-label={aria["aria-label"] ?? "Quantity"}
      className={cn(
        "inline-flex items-stretch rounded-control bg-fill p-nest",
        size === "sm" ? "h-item [&_svg]:!size-[14px]" : size === "touch" ? "h-[calc(var(--ad-touch-h)+var(--ad-nest)*2)] touch-manipulation [&_svg]:!size-[18px]" : "h-control",
        className,
      )}
    >
      <button type="button" aria-label="Less" className={btn} disabled={value <= min} onClick={() => onValueChange(clamp(value - step))}>
        <Minus />
      </button>
      <input
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
        aria-label={aria["aria-label"] ?? "Quantity"}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onValueChange(clamp(value + step));
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            onValueChange(clamp(value - step));
          }
        }}
        className={cn("w-[calc(var(--w)*1ch+16px)] min-w-9 grow bg-transparent text-center font-medium tabular-nums text-ink outline-none", size === "touch" ? "min-w-touch text-[16px]" : "text-body pointer-coarse:text-[16px]")}
        style={{ ["--w" as string]: Math.max(2, String(draft ?? value).length) }}
      />
      <button type="button" aria-label="More" className={btn} disabled={value >= max} onClick={() => onValueChange(clamp(value + step))}>
        <Plus />
      </button>
    </div>
  );
}
