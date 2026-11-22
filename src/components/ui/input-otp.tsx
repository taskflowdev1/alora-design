import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

export type InputOTPStatus = "idle" | "checking" | "invalid" | "success";
/** How the boxes show a correct code. */
export type InputOTPCelebrate = "join" | "quiet" | "seal";

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
   * success: the code locks and lands (see celebrate). The digits stay neutral; the caller's status line says it worked.
   */
  status?: InputOTPStatus;
  /**
   * success, how it lands. quiet: the boxes stay as they are. join: the gaps close into one bar. seal: the bar folds
   * into a circle and a green check, the one green mark, draws inside.
   */
  celebrate?: InputOTPCelebrate;
  /** Same as status="invalid". */
  invalid?: boolean;
  disabled?: boolean;
  /** "touch": 56 px boxes, 24 px digits and a 16 px input, for phones. */
  size?: "default" | "touch";
  /** Faint digits in the empty boxes (a demo's known code, or a format like "000000"); each goes as its box fills. */
  placeholder?: string;
  className?: string;
  id?: string;
  ref?: React.Ref<HTMLInputElement>;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const css = `
@keyframes ad-otp-digit { from { opacity: 0.35; transform: translateY(2px) scale(0.96); } }
@keyframes ad-otp-wave { 0%, 100% { background-color: var(--ad-fill); } 40% { background-color: var(--ad-fill-strong); } }
@keyframes ad-otp-seal {
  0% { opacity: 0; clip-path: inset(0 0 round var(--ad-radius-control)); }
  30% { opacity: 1; clip-path: inset(0 0 round var(--ad-radius-control)); }
  100% { opacity: 1; clip-path: inset(0 calc(50% - var(--ad-otp-h) / 2) round 999px); }
}
@keyframes ad-otp-draw { to { stroke-dashoffset: 0; } }
@keyframes ad-otp-rise { from { opacity: 0; transform: translateX(-4px); } }
@keyframes ad-otp-hide { to { opacity: 0; } }`;

/** When the gaps start closing on a correct code (ms). */
const JOIN_AT = 120;
/** When a correct code has finished landing (ms), so a status line can follow it. */
export const otpLanded = (celebrate: InputOTPCelebrate) => (celebrate === "quiet" ? 0 : celebrate === "join" ? JOIN_AT + 280 : JOIN_AT + 780);
const ease = "var(--ad-ease)";

/**
 * A one-time code: one real input under a row of soft boxes, so paste, autofill (one-time-code) and the phone's
 * number pad all work. The box being typed into gets the focus tint and a caret; no rings, no outlines. Digits rise
 * in as they're typed; status drives the checking wave, the wrong-code shake and how a correct code lands.
 */
export function InputOTP({
  value,
  onValueChange,
  length = 6,
  group = 3,
  onComplete,
  status = "idle",
  celebrate = "join",
  invalid,
  disabled,
  size = "default",
  placeholder,
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
    if (s === "invalid" && prev.current !== "invalid" && !prefersReducedMotion())
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
  const ok = s === "success";
  // Join and seal close the gaps so the code reads as one piece.
  const joinAt = JOIN_AT;
  const joined = ok && celebrate !== "quiet";
  const r = "var(--ad-radius-control)";
  return (
    <div
      ref={row}
      className={cn(
        "relative inline-flex items-center gap-1.5",
        size === "touch" ? "touch-manipulation [--ad-otp-h:56px] [--ad-otp-w:46px]" : "[--ad-otp-h:calc(var(--ad-control-h)*1.15)] [--ad-otp-w:calc(var(--ad-control-h)*0.95)]",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
      style={joined ? { gap: 0, transition: `gap 280ms ${ease} ${joinAt}ms` } : undefined}
      onClick={() => inner.current?.focus()}
    >
      <style href="ad-input-otp" precedence="default">
        {css}
      </style>
      {Array.from({ length }, (_, i) => (
        <React.Fragment key={i}>
          {group && i && i % group === 0 ? (
            <span aria-hidden className="w-2 self-stretch" style={joined ? { width: 0, transition: `width 280ms ${ease} ${joinAt}ms` } : undefined} />
          ) : null}
          <span
            aria-hidden
            style={
              ok
                ? {
                    transition: `border-radius 280ms ${ease} ${joinAt}ms`,
                    borderRadius: joined ? (i === 0 ? `${r} 0 0 ${r}` : i === length - 1 ? `0 ${r} ${r} 0` : 0) : undefined,
                    // Seal: once the bar covers them, the boxes go so only the circle is left.
                    animation: celebrate === "seal" ? `ad-otp-hide 1ms linear ${joinAt + 380}ms forwards` : undefined,
                  }
                : { animationDelay: s === "checking" ? `${i * 90}ms` : undefined }
            }
            className={cn(
              "relative grid h-(--ad-otp-h) w-(--ad-otp-w) place-items-center rounded-control font-semibold tabular-nums transition-colors duration-[220ms] ease-ad",
              size === "touch" ? "text-[24px]" : "text-number",
              s === "invalid"
                ? "bg-danger-soft text-danger"
                : s === "checking"
                  ? "animate-[ad-otp-wave_900ms_ease-in-out_infinite] bg-fill text-ink"
                  : typing && i === Math.min(value.length, at)
                    ? "bg-fill-strong text-ink"
                    : "bg-fill text-ink",
            )}
          >
            {chars[i] ? (
              <span key={chars[i] + i} className={cn(s === "idle" && "animate-[ad-otp-digit_120ms_var(--ad-ease)]")}>
                {chars[i]}
              </span>
            ) : placeholder?.[i] && !(typing && i === value.length && i === at) ? (
              <span className="font-normal text-fill-strong">{placeholder[i]}</span>
            ) : null}
            {typing && i === value.length && i === at ? <span className="absolute h-5 w-px animate-[ad-pulse_1s_steps(1)_infinite] bg-ink" /> : null}
          </span>
        </React.Fragment>
      ))}
      {ok && celebrate === "seal" ? (
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center bg-fill text-success"
          style={{ animation: `ad-otp-seal 520ms ${ease} ${joinAt + 200}ms both` }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              style={{ animation: `ad-otp-draw 280ms ${ease} ${joinAt + 640}ms forwards` }}
            />
          </svg>
        </span>
      ) : null}
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
        className={cn("absolute inset-0 opacity-0", size === "touch" && "text-[16px]", locked ? "cursor-default" : "cursor-text")}
      />
    </div>
  );
}
