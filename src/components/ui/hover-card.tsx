import * as React from "react";
import { HoverCard as H } from "radix-ui";
import { cn } from "@/lib/ad";

/** A preview card on hover (and on focus). Use it for people, orders and products named in a row. */
export function HoverCard({
  trigger,
  children,
  side = "bottom",
  align = "start",
  className,
}: {
  trigger: React.ReactElement;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <H.Root openDelay={250} closeDelay={120}>
      <H.Trigger asChild>{trigger}</H.Trigger>
      <H.Portal>
        <H.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-50 w-[288px] max-w-[calc(100vw-16px)] rounded-card bg-raised p-pad text-ink shadow-raised",
            "origin-(--radix-hover-card-content-transform-origin) data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_180ms_var(--ad-ease)]",
            className,
          )}
        >
          {children}
        </H.Content>
      </H.Portal>
    </H.Root>
  );
}
