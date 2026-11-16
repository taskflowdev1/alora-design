import * as React from "react";
import { cn } from "@/lib/ad";

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  /** Feather icon component shown before the value. */
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  /** Anything after the value, such as a clear button or a unit. */
  end?: React.ReactNode;
  invalid?: boolean;
  wrapperClassName?: string;
}

/** Soft-fill field. Hover and focus share one lighter tint: no ring, no outline, no border. */
export function fieldBoxClass(invalid?: boolean) {
  return cn(
    "flex h-control min-w-0 items-center gap-2 rounded-control px-3 text-body transition-colors duration-[220ms] ease-ad",
    invalid ? "bg-danger-soft" : "bg-fill hover:bg-fill-hover focus-within:bg-fill-hover",
  );
}

export function Input({ icon: Icon, end, invalid, className, wrapperClassName, ...props }: InputProps) {
  return (
    <label className={cn(fieldBoxClass(invalid), "cursor-text", wrapperClassName)}>
      {Icon ? <Icon size={16} className="shrink-0 text-ink-muted" /> : null}
      <input
        aria-invalid={invalid || undefined}
        className={cn("h-full w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-faint", className)}
        {...props}
      />
      {end}
    </label>
  );
}

export function Textarea({ className, invalid, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-24 w-full resize-y rounded-control px-3 py-2 text-body text-ink outline-none transition-colors duration-[220ms] ease-ad placeholder:text-ink-faint",
        invalid ? "bg-danger-soft" : "bg-fill hover:bg-fill-hover focus:bg-fill-hover",
        className,
      )}
      {...props}
    />
  );
}
