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

/** What a surrounding Field tells its control: the id its label points at, and the error to describe it with. */
export interface FieldControl {
  id: string;
  errorId?: string;
}

export const FieldContext = React.createContext<FieldControl | null>(null);

/** Ties a control to the Field around it: the id its label points at, the error that describes it. Own props win. */
export function useFieldControl(props: { id?: string; "aria-describedby"?: string }) {
  const f = React.useContext(FieldContext);
  if (!f) return { attrs: {}, invalid: false };
  return { attrs: { id: props.id ?? f.id, "aria-describedby": cn(props["aria-describedby"], f.errorId) || undefined }, invalid: !!f.errorId };
}

/** Soft-fill field. Hover and focus share one lighter tint: no ring, no outline, no border. */
export function fieldBoxClass(invalid?: boolean) {
  return cn(
    "flex h-control min-w-0 items-center gap-2 rounded-control px-3 text-body transition-colors duration-[220ms] ease-ad",
    invalid ? "bg-danger-soft" : "bg-fill hover:bg-fill-strong focus-within:bg-fill-strong",
  );
}

export function Input({ icon: Icon, end, invalid, className, wrapperClassName, ...props }: InputProps) {
  const field = useFieldControl(props);
  const bad = invalid ?? field.invalid;
  return (
    <label className={cn(fieldBoxClass(bad), "cursor-text", wrapperClassName)}>
      {Icon ? <Icon size={16} className="shrink-0 text-ink-muted" /> : null}
      <input
        aria-invalid={bad || undefined}
        className={cn("h-full w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-muted", className)}
        {...props}
        {...field.attrs}
      />
      {end}
    </label>
  );
}

export function Textarea({ className, invalid, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  const field = useFieldControl(props);
  const bad = invalid ?? field.invalid;
  return (
    <textarea
      aria-invalid={bad || undefined}
      className={cn(
        "min-h-24 w-full resize-y rounded-control px-3 py-2 text-body pointer-coarse:text-[16px] text-ink outline-none transition-colors duration-[220ms] ease-ad placeholder:text-ink-muted",
        bad ? "bg-danger-soft" : "bg-fill hover:bg-fill-strong focus:bg-fill-strong",
        className,
      )}
      {...props}
      {...field.attrs}
    />
  );
}
