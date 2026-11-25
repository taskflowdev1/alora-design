import * as React from "react";
import { X } from "react-feather";
import { cn, fieldChipClass } from "@/lib/ad";
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
          <span key={t} className={fieldChipClass}>
            <span className="max-w-40 truncate">{t}</span>
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={(e) => (e.stopPropagation(), onValueChange(value.filter((x) => x !== t)))}
              className="relative grid size-[18px] cursor-pointer place-items-center rounded-small text-ink-muted ad-press after:absolute after:-inset-[3px] hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink active:scale-[0.97]"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          ref={input}
          value={text}
          aria-label={aria["aria-label"] ?? "Tags"}
          autoComplete="off"
          enterKeyHint="enter"
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
          className={cn("h-[calc(var(--ad-control-h)-var(--ad-nest)*2)] flex-1 bg-transparent pl-1.5 text-ink outline-none placeholder:text-ink-muted", text || !value.length ? "min-w-24" : "min-w-4")}
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
              className="relative inline-flex h-6 cursor-pointer items-center rounded-item px-bubble-sm after:absolute after:inset-x-0 after:-inset-y-[3px] text-small text-ink-muted transition-colors duration-[150ms] hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink"
            >
              {h}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
