import * as React from "react";
import { cn } from "@/lib/ad";

/**
 * Related buttons as one control: they share one soft track and sit one nest gap inside it, so the corners stay
 * concentric (track radius = button radius + gap). No dividers between them. Put secondary or ghost Buttons inside.
 */
export function ButtonGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex h-control shrink-0 items-stretch gap-0.5 rounded-control bg-fill p-nest",
        "[&>*]:h-full [&>*]:rounded-item [&>*]:bg-transparent [&>*]:px-[calc(var(--ad-bubble-x)-var(--ad-nest))] [&>*]:hover:bg-fill-strong [&>*]:focus-visible:bg-fill-strong",
        "[&>[data-icon]]:aspect-square [&>[data-icon]]:px-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
