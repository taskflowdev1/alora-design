import * as React from "react";
import { cn, formatNumber } from "@/lib/ad";
import { fieldBoxClass } from "@/components/ui/input";

export interface CurrencyInputProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Shown before the number. */
  currency?: string;
  placeholder?: string;
  invalid?: boolean;
  /** Above this the field shows as invalid (the typed number is kept, never clamped); say why in the Field error. */
  max?: number;
  className?: string;
  "aria-label"?: string;
}

const group = (n: number) => formatNumber(n);

/** Types as "Rp 12.400.000": dots appear while typing and the caret stays on its digit. */
export function CurrencyInput({ value, onValueChange, currency = "Rp", placeholder = "0", invalid, max = 999_999_999_999, className, ...aria }: CurrencyInputProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const caret = React.useRef<number | null>(null);
  const text = value == null ? "" : group(value);
  const over = value != null && value > max;

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || caret.current == null) return;
    // Put the caret after the same number of digits it was after before formatting.
    let digits = caret.current;
    let pos = 0;
    while (pos < text.length && digits > 0) {
      if (/\d/.test(text[pos])) digits--;
      pos++;
    }
    el.setSelectionRange(pos, pos);
    caret.current = null;
  }, [text]);

  return (
    <label className={cn(fieldBoxClass(invalid || over), "cursor-text", className)}>
      <span className="shrink-0 text-ink-muted">{currency}</span>
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        aria-label={aria["aria-label"]}
        aria-invalid={invalid || over || undefined}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          const before = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, "").length;
          // Keep what was typed (accept, then validate); 15 digits is as far as a JS number stays exact.
          const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15);
          caret.current = before;
          onValueChange(digits ? Number(digits) : null);
        }}
        className="h-full w-full min-w-0 bg-transparent text-right tabular-nums text-ink outline-none placeholder:text-ink-muted"
      />
    </label>
  );
}
