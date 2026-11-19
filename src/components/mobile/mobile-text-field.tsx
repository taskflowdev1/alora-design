import * as React from "react";
import { AlertCircle, X } from "react-feather";
import { cn } from "@/lib/ad";

export interface MobileTextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "prefix" | "size"> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Shown under the field in place of help text; the field turns soft red. Say what to fix, in a few words. */
  error?: string;
  /** Fixed text before the value ("Rp", "+62"). */
  prefix?: React.ReactNode;
  /** Hide the clear button (on by default while there is a value). */
  clearable?: boolean;
  /** Something at the right end instead of / beside the clear button (a unit, a scan button). */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * A text field for phones: the label sits right above the field (it never floats or hides), 16 px text so nothing
 * zooms, a 44 px soft field that turns a shade darker while focused (no ring), and a 44 px clear button while there is
 * a value. An error opens under the field (it slides open, nothing jumps) with its icon on the first line; no help text.
 */
export function MobileTextField({ label, value, onValueChange, error, prefix, clearable = true, trailing, className, id: idProp, ...input }: MobileTextFieldProps) {
  const auto = React.useId();
  const id = idProp ?? auto;
  const ref = React.useRef<HTMLInputElement>(null);
  // Keep the last message while the error row closes, so it doesn't go blank mid-slide.
  const shown = React.useRef(error);
  if (error) shown.current = error;
  return (
    <div className={cn("grid min-w-0", className)}>
      <label htmlFor={id} className="px-1 pb-1.5 text-[13px] text-ink-muted">
        {label}
      </label>
      <div
        className={cn(
          "flex h-touch min-w-0 cursor-text items-center rounded-control pl-3.5 transition-colors duration-[150ms] ease-ad",
          error ? "bg-danger-soft" : "bg-fill focus-within:bg-fill-strong",
          !(clearable && value) && !trailing && "pr-3.5",
        )}
        onClick={() => ref.current?.focus()}
      >
        {prefix != null ? <span className="mr-1.5 shrink-0 text-[16px] text-ink-muted">{prefix}</span> : null}
        <input
          ref={ref}
          id={id}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onValueChange(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-muted"
          {...input}
        />
        {clearable && value && !input.readOnly ? (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => (onValueChange(""), ref.current?.focus())}
            className="grid size-touch shrink-0 cursor-pointer place-items-center text-ink-muted [-webkit-tap-highlight-color:transparent] active:scale-[0.9] transition-transform duration-[150ms] ease-ad"
          >
            <span className="grid size-[20px] place-items-center rounded-full bg-ink-muted text-surface">
              <X size={12} strokeWidth={2.5} />
            </span>
          </button>
        ) : null}
        {trailing}
      </div>
      <div className="grid transition-[grid-template-rows] duration-[200ms] ease-ad motion-reduce:transition-none" style={{ gridTemplateRows: error ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">
          <p id={`${id}-error`} role={error ? "alert" : undefined} className="flex items-start gap-1.5 px-1 pt-1.5 text-[13px] leading-[18px] text-danger">
            <AlertCircle size={16} strokeWidth={1.75} className="mt-px shrink-0" />
            <span>{shown.current}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
