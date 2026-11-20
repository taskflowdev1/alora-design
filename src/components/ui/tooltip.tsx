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

/**
 * A short label over a control. Props other than these go to the trigger, so a Tooltip can itself be the child of
 * another `asChild` trigger (a popover's or a menu's) and pass its handlers on to the button inside.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  open,
  className,
  ...trigger
}: {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  open?: boolean;
  /** Classes for the tooltip bubble. */
  className?: string;
} & Omit<React.ComponentProps<typeof T.Trigger>, "content" | "children" | "className" | "asChild">) {
  return (
    <T.Root open={open}>
      <T.Trigger asChild {...trigger}>
        {children}
      </T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-[70] max-w-64 rounded-item bg-tip px-2.5 py-1.5 text-small text-tip-ink shadow-raised",
            // Only the first (delayed) tooltip grows in; one opened straight after another appears instantly.
            "origin-(--radix-tooltip-content-transform-origin) data-[state=delayed-open]:animate-[ad-in_160ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_130ms_var(--ad-ease)]",
            className,
          )}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
