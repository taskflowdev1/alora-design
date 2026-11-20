import * as React from "react";
import { Search, X } from "react-feather";
import { cn } from "@/lib/ad";

export interface MobileSearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Called after Cancel clears and leaves the field. */
  onCancel?: () => void;
  className?: string;
}

/**
 * Search on a phone: a 44 px soft field with 16 px text (no zoom on focus). Focus slides a Cancel button in from the
 * right while the field gives it room; Cancel clears, closes the keyboard and slides back out. The × clears without
 * leaving. Focus shows as a lighter fill, never a ring.
 */
export function MobileSearchBar({ value, onValueChange, placeholder = "Search", onCancel, className }: MobileSearchBarProps) {
  const input = React.useRef<HTMLInputElement>(null);
  const [active, setActive] = React.useState(false);
  return (
    <div role="search" className={cn("flex items-center", className)}>
      <label className="flex h-touch min-w-0 flex-1 cursor-text items-center gap-2 rounded-control bg-fill px-3 transition-colors duration-[150ms] ease-ad focus-within:bg-fill-strong">
        <Search size={18} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
        <input
          ref={input}
          type="search"
          enterKeyHint="search"
          value={value}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => setActive(true)}
          onBlur={() => !value && setActive(false)}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => (onValueChange(""), input.current?.focus())}
            className="group/clear -mr-2 grid size-touch shrink-0 cursor-pointer place-items-center text-ink-muted outline-none"
          >
            <span className="grid size-[18px] place-items-center rounded-full bg-ink-muted text-surface transition-colors duration-[150ms] ease-ad group-focus-visible/clear:bg-ink">
              <X size={12} strokeWidth={2.5} />
            </span>
          </button>
        ) : null}
      </label>
      {/* Cancel slides in; its column grows from 0 so the field shrinks in step instead of jumping. */}
      <div className="grid transition-[grid-template-columns] duration-[260ms] ease-ad motion-reduce:transition-none" style={{ gridTemplateColumns: active ? "1fr" : "0fr" }}>
        <div className="min-w-0 overflow-hidden">
          <button
            type="button"
            tabIndex={active ? 0 : -1}
            aria-hidden={!active}
            onClick={() => {
              onValueChange("");
              input.current?.blur();
              setActive(false);
              onCancel?.();
            }}
            className={cn(
              "h-touch cursor-pointer whitespace-nowrap rounded-control pl-3 pr-1 text-[16px] text-ink transition-[background-color,opacity,transform] duration-[260ms] ease-ad focus-visible:bg-fill",
              active ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
