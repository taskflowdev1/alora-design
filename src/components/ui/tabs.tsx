import * as React from "react";
import { Tabs as T } from "radix-ui";
import { cn } from "@/lib/ad";
import { HoldLabel, SlidingPill } from "@/components/ui/sliding-pill";

/**
 * Tabs: no track and no underline. A grey pill (fill-strong) slides behind the active tab; its label turns ink and medium.
 * Keyboard focus shows as a fill on an inactive tab and as a slightly darker pill on the active one.
 */
export function Tabs(props: React.ComponentProps<typeof T.Root>) {
  return <T.Root {...props} />;
}

export function TabsList({ className, children, ...props }: React.ComponentProps<typeof T.List>) {
  return (
    <T.List className={cn("relative inline-flex items-center gap-1", className)} {...props}>
      <SlidingPill selector='[role="tab"][data-state="active"]' className="rounded-control bg-fill-strong" />
      {children}
    </T.List>
  );
}

export function TabsTrigger({ className, children, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "relative z-10 inline-flex h-control cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-control px-bubble text-body transition-[color,transform,scale] duration-[150ms] ease-ad active:scale-[0.97] [&_svg]:size-[16px]",
        "text-ink-muted data-[state=inactive]:hover:text-ink data-[state=inactive]:focus-visible:text-ink data-[state=inactive]:focus-visible:bg-fill data-[state=active]:font-medium data-[state=active]:text-ink",
        className,
      )}
      {...props}
    >
      <HoldLabel>{children}</HoldLabel>
    </T.Trigger>
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("rounded-card pt-3 focus-visible:bg-fill data-[state=active]:animate-[ad-fade-in_220ms_var(--ad-ease)]", className)} {...props} />;
}
