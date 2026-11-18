import * as React from "react";
import { ScrollArea as SA } from "radix-ui";
import { cn } from "@/lib/ad";

/**
 * A scroll box with the one scrollbar style (thin, soft thumb, no track) on every platform, vertical and sideways.
 * Wheel inside it never scrolls the page past its end (overscroll contained).
 */
export function ScrollArea({ className, children, orientation = "vertical", ...props }: React.ComponentProps<typeof SA.Root> & { orientation?: "vertical" | "horizontal" | "both" }) {
  const bar = (o: "vertical" | "horizontal") => (
    <SA.Scrollbar
      orientation={o}
      className={cn("flex touch-none select-none p-0.5 transition-opacity duration-[160ms]", o === "vertical" ? "h-full w-2" : "h-2 flex-col")}
    >
      <SA.Thumb className="relative flex-1 rounded-full bg-scroll" />
    </SA.Scrollbar>
  );
  return (
    <SA.Root type="hover" className={cn("relative overflow-hidden", className)} {...props}>
      <SA.Viewport className="size-full overscroll-contain rounded-[inherit]">{children}</SA.Viewport>
      {orientation !== "horizontal" ? bar("vertical") : null}
      {orientation !== "vertical" ? bar("horizontal") : null}
      <SA.Corner />
    </SA.Root>
  );
}
