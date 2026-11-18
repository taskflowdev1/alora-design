import * as React from "react";
import { Toggle as T } from "radix-ui";
import { cn } from "@/lib/ad";

export interface ToggleProps extends React.ComponentProps<typeof T.Root> {
  size?: "default" | "sm";
  /** Square, icon only. Give it an aria-label. */
  icon?: boolean;
}

/**
 * One on/off button (Bold, Pin, Show archived). Off is ghost and muted; on is the grey pill (fill-strong) in ink, the
 * same treatment as a selected chip or tab. Same radius and heights as Button.
 */
export function Toggle({ size = "default", icon, className, ...props }: ToggleProps) {
  return (
    <T.Root
      className={cn(
        "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-control text-body font-medium transition-[transform,background-color,color] duration-[220ms] ease-ad active:scale-[0.96] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4",
        "text-ink-muted data-[state=off]:hover:bg-fill data-[state=off]:hover:text-ink data-[state=on]:bg-fill-strong data-[state=on]:text-ink",
        size === "sm" ? "h-item" : "h-control",
        icon ? (size === "sm" ? "w-item" : "w-control") : size === "sm" ? "px-2.5" : "px-3.5",
        className,
      )}
      {...props}
    />
  );
}
