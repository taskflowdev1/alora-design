import * as React from "react";
import { AspectRatio as AR } from "radix-ui";
import { cn } from "@/lib/ad";

/**
 * Holds media at a fixed shape (16/9, 4/3, 1) while its width follows the layout, so nothing jumps as images load.
 * The box is rounded at the card radius and clips its content; while empty it shows the soft fill.
 */
export function AspectRatio({ ratio = 16 / 9, className, children, ...props }: React.ComponentProps<typeof AR.Root>) {
  return (
    <div className={cn("overflow-hidden rounded-card bg-fill", className)}>
      <AR.Root ratio={ratio} {...props}>
        {children}
      </AR.Root>
    </div>
  );
}
