import * as React from "react";
import { AlertCircle } from "react-feather";
import { cn } from "@/lib/ad";
import { FieldContext } from "@/components/ui/input";

export interface FieldProps {
  label: React.ReactNode;
  /** Validation message. No help text: make the field clear instead. */
  error?: React.ReactNode;
  /** "stack" puts the label above; "row" puts it beside the control. */
  layout?: "stack" | "row";
  className?: string;
  children: React.ReactNode;
  /** The control's id, when it sets its own. Without it the Field gives one to the control inside. */
  htmlFor?: string;
}

// Controls a <label for> can point at. Input and Textarea take the Field's id through context; anything else (a select
// trigger, a native input, a combobox) gets it here.
const LABELABLE = "input:not([type=hidden]), textarea, select, button";

/**
 * A label and its control, plus a validation message under the control. Clicking the label focuses the control, which
 * takes the label as its accessible name and the message as its description.
 */
export function Field({ label, error, layout = "stack", className, children, htmlFor }: FieldProps) {
  const auto = React.useId();
  const [target, setTarget] = React.useState(htmlFor ?? auto);
  const slot = React.useRef<HTMLDivElement>(null);
  const errorId = error ? `${auto}-err` : undefined;
  const ctx = React.useMemo(() => ({ id: htmlFor ?? auto, errorId }), [htmlFor, auto, errorId]);

  React.useLayoutEffect(() => {
    if (htmlFor) return setTarget(htmlFor);
    const el = slot.current?.querySelector<HTMLElement>(LABELABLE);
    if (!el) return;
    if (!el.id) el.id = auto;
    setTarget(el.id);
    // A control that didn't read the context: describe it with the message here.
    if (!errorId || el.getAttribute("aria-describedby")?.split(" ").includes(errorId)) return;
    const was = el.getAttribute("aria-describedby");
    el.setAttribute("aria-describedby", cn(was, errorId));
    return () => (was ? el.setAttribute("aria-describedby", was) : el.removeAttribute("aria-describedby"));
  }, [htmlFor, auto, errorId, children]);

  return (
    <div className={cn(layout === "row" ? "grid grid-cols-[minmax(120px,180px)_1fr] items-start gap-x-4" : "grid gap-1.5", className)}>
      <label htmlFor={target} className={cn("text-body text-ink-muted", layout === "row" && "flex min-h-control items-center")}>
        {label}
      </label>
      <div ref={slot} className="grid gap-1.5">
        <FieldContext.Provider value={ctx}>{children}</FieldContext.Provider>
        {error ? (
          <p id={errorId} role="alert" className="flex items-start gap-1.5 text-small text-danger">
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
