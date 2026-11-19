import * as React from "react";
import { Edit2 } from "react-feather";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/ad";

export interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  /** How the value reads when not editing. */
  display?: (value: string) => React.ReactNode;
  /** Return an error message to refuse the value. */
  validate?: (value: string) => string | null;
  align?: "left" | "right";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
  "aria-label"?: string;
}

/**
 * A table cell you can edit in place. Hover shows a soft fill and a pencil (its space is
 * always reserved, so nothing moves). Click or Enter edits; Enter saves, Esc cancels.
 */
export function InlineEdit({ value, onSave, display, validate, align = "left", inputMode, className, ...aria }: InlineEditProps) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const input = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (draft != null) input.current?.select();
  }, [draft != null]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (draft == null) return;
    const err = validate?.(draft) ?? null;
    if (err) return setError(err);
    if (draft !== value) onSave(draft);
    setDraft(null);
    setError(null);
  };
  const box = cn(
    "-mx-2 flex h-item min-w-0 items-center gap-1.5 rounded-control px-2 text-body transition-colors duration-[160ms]",
    align === "right" && "flex-row-reverse text-right",
    className,
  );

  if (draft != null) {
    return (
      <Tooltip content={error} open={!!error}>
        <span className={cn(box, error ? "bg-danger-soft" : "bg-fill")}>
          <input
            ref={input}
            value={draft}
            inputMode={inputMode}
            enterKeyHint="done"
            aria-label={aria["aria-label"]}
            aria-invalid={!!error || undefined}
            onChange={(e) => (setDraft(e.target.value), setError(null))}
            onBlur={save}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setDraft(null);
                setError(null);
              }
            }}
            className={cn("w-full min-w-0 bg-transparent tabular-nums text-ink outline-none", align === "right" && "text-right")}
          />
          <span className="size-3.5 shrink-0" />
        </span>
      </Tooltip>
    );
  }
  return (
    <button
      type="button"
      aria-label={aria["aria-label"] ? `Edit ${aria["aria-label"]}` : "Edit"}
      onClick={(e) => (e.stopPropagation(), setDraft(value))}
      className={cn(box, "group w-full cursor-text tabular-nums hover:bg-fill focus-visible:bg-fill")}
    >
      <span className="flex-1 whitespace-nowrap">{display ? display(value) : value}</span>
      <Edit2 size={14} className="shrink-0 text-ink-muted opacity-0 transition-opacity duration-[160ms] group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  );
}
