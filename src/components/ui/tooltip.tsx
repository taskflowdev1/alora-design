import * as React from "react";
import { Tooltip as T } from "radix-ui";
import { cn } from "@/lib/ad";

/** Put one at the app root: the first tooltip waits, then neighbours open at once (and without animating) for a moment. */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <T.Provider delayDuration={300} skipDelayDuration={200}>
      {children}
    </T.Provider>
  );
}

export function Tooltip({
  content,
  children,
  side = "top",
  open,
}: {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  open?: boolean;
}) {
  return (
    <T.Root open={open}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-[70] max-w-64 rounded-item bg-on px-2.5 py-1.5 text-small text-on-ink shadow-raised",
            // Only the first (delayed) tooltip grows in; one opened straight after another appears instantly.
            "origin-(--radix-tooltip-content-transform-origin) data-[state=delayed-open]:animate-[ad-in_160ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_130ms_var(--ad-ease)]",
          )}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
