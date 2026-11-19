import * as React from "react";
import { Search as SearchIcon, X } from "react-feather";
import { cn } from "@/lib/ad";
import { Input, type InputProps } from "@/components/ui/input";

export interface SearchProps extends Omit<InputProps, "icon" | "end" | "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
}

/** The one search field. Same height, radius and focus tint as every other control. */
export function Search({ value, onValueChange, placeholder = "Search", className, wrapperClassName, ...props }: SearchProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <Input
      ref={ref}
      type="search"
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="search"
      icon={SearchIcon}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && value) {
          e.preventDefault();
          onValueChange("");
        }
      }}
      wrapperClassName={cn("w-64 pr-1.5", wrapperClassName)}
      className={cn("[&::-webkit-search-cancel-button]:hidden", className)}
      end={
        <button
          type="button"
          aria-label="Clear search"
          tabIndex={value ? 0 : -1}
          onClick={() => {
            onValueChange("");
            ref.current?.focus();
          }}
          className={cn(
            "grid size-6 shrink-0 cursor-pointer place-items-center rounded-item text-ink-muted transition-[opacity,background-color,transform] duration-[150ms] ease-ad hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.97]",
            value ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <X size={14} />
        </button>
      }
      {...props}
    />
  );
}
