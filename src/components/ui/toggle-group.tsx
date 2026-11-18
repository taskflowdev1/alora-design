import * as React from "react";
import { ToggleGroup as T } from "radix-ui";
import { cn } from "@/lib/ad";

export interface ToggleGroupProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: { value: string; label: React.ReactNode; "aria-label"?: string }[];
  className?: string;
  "aria-label"?: string;
}

/**
 * Several on/off choices in one track, like a segmented control that allows more than one.
 * Pressed items get a solid ink pill (on / on-ink), clear against the track in both themes; track and pills are concentric.
 */
export function ToggleGroup({ value, onValueChange, options, className, ...aria }: ToggleGroupProps) {
  return (
    <T.Root
      type="multiple"
      value={value}
      onValueChange={onValueChange}
      aria-label={aria["aria-label"]}
      className={cn("inline-flex h-control shrink-0 items-stretch gap-0.5 rounded-control bg-fill p-nest", className)}
    >
      {options.map((o) => (
        <T.Item
          key={o.value}
          value={o.value}
          aria-label={o["aria-label"]}
          className={cn(
            "inline-flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-item px-bubble text-body transition-[background-color,color,transform] duration-[220ms] ease-ad active:scale-[0.96] [&_svg]:size-4",
            "text-ink-muted data-[state=off]:hover:text-ink data-[state=on]:bg-on data-[state=on]:text-on-ink",
          )}
        >
          {o.label}
        </T.Item>
      ))}
    </T.Root>
  );
}
