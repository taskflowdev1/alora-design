import * as React from "react";
import { cn } from "@/lib/ad";

export interface InputOTPProps {
  value: string;
  onValueChange: (value: string) => void;
  length?: number;
  /** Split the boxes into groups with a gap (3 = 123 456). 0 keeps one row. */
  group?: number;
  /** Called once every box is filled. */
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * A one-time code: one real input under a row of soft boxes, so paste, autofill (one-time-code) and the phone's
 * number pad all work. The box being typed into gets the focus tint and a caret; no rings, no outlines.
 */
export function InputOTP({ value, onValueChange, length = 6, group = 3, onComplete, invalid, disabled, className, ...aria }: InputOTPProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState(false);
  const [sel, setSel] = React.useState(0);
  const chars = value.slice(0, length).split("");
  const at = Math.min(sel, length - 1);
  const sync = () => setSel(ref.current?.selectionStart ?? value.length);
  return (
    <div className={cn("relative inline-flex items-center gap-1.5", disabled && "pointer-events-none opacity-45", className)} onClick={() => ref.current?.focus()}>
      {Array.from({ length }, (_, i) => (
        <React.Fragment key={i}>
          {group && i && i % group === 0 ? <span aria-hidden className="w-1.5" /> : null}
          <span
            aria-hidden
            className={cn(
              "relative grid h-control w-[calc(var(--ad-control-h)*0.9)] place-items-center rounded-control text-title font-medium tabular-nums text-ink transition-colors duration-[160ms] ease-ad",
              invalid ? "bg-danger-soft" : focused && i === Math.min(value.length, at) ? "bg-fill-strong" : "bg-fill",
            )}
          >
            {chars[i] ?? ""}
            {focused && i === value.length && i === at ? <span className="absolute h-4 w-px animate-[ad-pulse_1s_steps(1)_infinite] bg-ink" /> : null}
          </span>
        </React.Fragment>
      ))}
      <input
        ref={ref}
        aria-label={aria["aria-label"] ?? "One-time code"}
        aria-invalid={invalid || undefined}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        disabled={disabled}
        value={value}
        onFocus={() => (setFocused(true), sync())}
        onBlur={() => setFocused(false)}
        onSelect={sync}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, length);
          onValueChange(v);
          setSel(v.length);
          if (v.length === length) onComplete?.(v);
        }}
        className="absolute inset-0 cursor-text opacity-0"
      />
    </div>
  );
}
