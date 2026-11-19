import * as React from "react";
import { AlertCircle } from "react-feather";
import { cn } from "@/lib/ad";

export interface FieldProps {
  label: React.ReactNode;
  /** Validation message. No help text: make the field clear instead. */
  error?: React.ReactNode;
  /** "stack" puts the label above; "row" puts it beside the control. */
  layout?: "stack" | "row";
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

export function Field({ label, error, layout = "stack", className, children, htmlFor }: FieldProps) {
  return (
    <div className={cn(layout === "row" ? "grid grid-cols-[minmax(120px,180px)_1fr] items-center gap-x-4" : "grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-body text-ink-muted">
        {label}
      </label>
      <div className="grid gap-1.5">
        {children}
        {error ? (
          <p role="alert" className="flex items-start gap-1.5 text-small text-danger">
            <span className="flex h-[1.4em] items-center">
              <AlertCircle size={14} />
            </span>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
