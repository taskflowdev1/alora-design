import * as React from "react";
import { X } from "react-feather";
import { cn } from "@/lib/ad";
import { fieldBoxClass } from "@/components/ui/input";

export interface TagInputProps {
  value: string[];
  onValueChange: (tags: string[]) => void;
  placeholder?: string;
  /** Offered as you type. */
  suggestions?: string[];
  className?: string;
  "aria-label"?: string;
}

/** Tags as chips inside the field. Enter or comma adds, Backspace on empty removes the last. */
export function TagInput({ value, onValueChange, placeholder = "Add a tag", suggestions = [], className, ...aria }: TagInputProps) {
  const [text, setText] = React.useState("");
  const input = React.useRef<HTMLInputElement>(null);
  const add = (t: string) => {
    const v = t.trim().replace(/,$/, "");
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onValueChange([...value, v]);
    setText("");
  };
  const hits = text ? suggestions.filter((s) => s.toLowerCase().startsWith(text.toLowerCase()) && !value.includes(s)).slice(0, 4) : [];
  return (
    <div className={cn("grid gap-1", className)}>
      <div
        onClick={() => input.current?.focus()}
        className={cn(fieldBoxClass(), "h-auto min-h-control cursor-text flex-wrap gap-1 py-nest pl-nest")}
      >
        {value.map((t) => (
          <span key={t} className="inline-flex h-[calc(var(--ad-control-h)-var(--ad-nest)*2)] items-center gap-1 rounded-item bg-sel pl-bubble-sm pr-1 text-body text-ink shadow-sel">
            <span className="max-w-40 truncate">{t}</span>
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={(e) => (e.stopPropagation(), onValueChange(value.filter((x) => x !== t)))}
              className="grid size-5 cursor-pointer place-items-center rounded-small text-ink-muted transition-[background-color,color,transform] duration-[150ms] ease-ad hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink active:scale-[0.97]"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={input}
          value={text}
          aria-label={aria["aria-label"] ?? "Tags"}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            }
            if (e.key === "Tab" && hits[0]) {
              e.preventDefault();
              add(hits[0]);
            }
            if (e.key === "Backspace" && !text && value.length) onValueChange(value.slice(0, -1));
          }}
          onBlur={() => text && add(text)}
          className="h-[calc(var(--ad-control-h)-var(--ad-nest)*2)] min-w-24 flex-1 bg-transparent pl-1.5 text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
      {hits.length ? (
        <div className="flex flex-wrap gap-1">
          {hits.map((h) => (
            <button
              key={h}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(h)}
              className="inline-flex h-6 cursor-pointer items-center rounded-item px-bubble-sm text-small text-ink-muted transition-colors duration-[160ms] hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink"
            >
              {h}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
