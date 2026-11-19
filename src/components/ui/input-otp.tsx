import * as React from "react";
import { cn } from "@/lib/ad";

export type InputOTPStatus = "idle" | "checking" | "invalid" | "success";

export interface InputOTPProps {
  value: string;
  onValueChange: (value: string) => void;
  length?: number;
  /** Split the boxes into groups with a gap (3 = 123 456). 0 keeps one row. */
  group?: number;
  /** Called once every box is filled. */
  onComplete?: (value: string) => void;
  /**
   * idle: typing. checking: a soft wave runs across the boxes (read-only). invalid: the row shakes once and turns soft red.
   * success: the boxes turn soft green one after another.
   */
  status?: InputOTPStatus;
  /** Same as status="invalid". */
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  ref?: React.Ref<HTMLInputElement>;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const css = `
@keyframes ad-otp-digit { from { opacity: 0; transform: translateY(4px) scale(0.85); } }
@keyframes ad-otp-wave { 0%, 100% { background-color: var(--ad-fill); } 40% { background-color: var(--ad-fill-strong); } }
@keyframes ad-otp-pop { 0% { transform: scale(1); } 45% { transform: scale(1.08); } 100% { transform: scale(1); } }`;

/**
 * A one-time code: one real input under a row of soft boxes, so paste, autofill (one-time-code) and the phone's
 * number pad all work. The box being typed into gets the focus tint and a caret; no rings, no outlines. Digits rise
 * in as they're typed; status drives the checking wave, the wrong-code shake and the success pop.
 */
export function InputOTP({
  value,
  onValueChange,
  length = 6,
  group = 3,
  onComplete,
  status = "idle",
  invalid,
  disabled,
  className,
  id,
  ref,
  ...aria
}: InputOTPProps) {
  const inner = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState(false);
  const [sel, setSel] = React.useState(0);
  const s: InputOTPStatus = invalid ? "invalid" : status;
  // One shake each time the row turns invalid (Web Animations, so the input keeps its focus).
  const row = React.useRef<HTMLDivElement>(null);
  const prev = React.useRef(s);
  React.useEffect(() => {
    if (s === "invalid" && prev.current !== "invalid" && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      row.current?.animate([{ translate: "0" }, { translate: "-6px" }, { translate: "5px" }, { translate: "-3px" }, { translate: "2px" }, { translate: "0" }], {
        duration: 380,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
    prev.current = s;
  }, [s]);
  const setRef = React.useCallback(
    (el: HTMLInputElement | null) => {
      inner.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  const chars = value.slice(0, length).split("");
  const at = Math.min(sel, length - 1);
  const typing = s === "idle" && focused;
  const locked = disabled || s === "checking" || s === "success";
  const sync = () => setSel(inner.current?.selectionStart ?? value.length);
  return (
    <div
      ref={row}
      className={cn("relative inline-flex items-center gap-1.5", disabled && "pointer-events-none opacity-45", className)}
      onClick={() => inner.current?.focus()}
    >
      <style href="ad-input-otp" precedence="default">
        {css}
      </style>
      {Array.from({ length }, (_, i) => (
        <React.Fragment key={i}>
          {group && i && i % group === 0 ? <span aria-hidden className="w-2" /> : null}
          <span
            aria-hidden
            style={{
              animationDelay: s === "checking" ? `${i * 90}ms` : s === "success" ? `${i * 45}ms` : undefined,
            }}
            className={cn(
              "relative grid h-[calc(var(--ad-control-h)*1.15)] w-[calc(var(--ad-control-h)*0.95)] place-items-center rounded-control text-number font-semibold tabular-nums transition-colors duration-[220ms] ease-ad",
              s === "invalid"
                ? "bg-danger-soft text-danger"
                : s === "success"
                  ? "animate-[ad-otp-pop_360ms_var(--ad-ease)_both] bg-success-soft text-success"
                  : s === "checking"
                    ? "animate-[ad-otp-wave_900ms_ease-in-out_infinite] bg-fill text-ink"
                    : typing && i === Math.min(value.length, at)
                      ? "bg-fill-strong text-ink"
                      : "bg-fill text-ink",
            )}
          >
            {chars[i] ? (
              <span key={chars[i] + i} className={cn(s === "idle" && "animate-[ad-otp-digit_160ms_var(--ad-ease)]")}>
                {chars[i]}
              </span>
            ) : null}
            {typing && i === value.length && i === at ? <span className="absolute h-5 w-px animate-[ad-pulse_1s_steps(1)_infinite] bg-ink" /> : null}
          </span>
        </React.Fragment>
      ))}
      <input
        ref={setRef}
        id={id}
        aria-label={aria["aria-label"] ?? "One-time code"}
        aria-describedby={aria["aria-describedby"]}
        aria-invalid={s === "invalid" || undefined}
        aria-busy={s === "checking" || undefined}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        disabled={disabled}
        readOnly={locked}
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
        className={cn("absolute inset-0 opacity-0", locked ? "cursor-default" : "cursor-text")}
      />
    </div>
  );
}
