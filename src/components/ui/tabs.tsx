import * as React from "react";
import { Tabs as T } from "radix-ui";
import { cn } from "@/lib/ad";

/** Tabs: no track and no underline. A soft fill slides behind the active tab. */
export function Tabs(props: React.ComponentProps<typeof T.Root>) {
  return <T.Root {...props} />;
}

export function TabsList({ className, children, ...props }: React.ComponentProps<typeof T.List>) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = React.useState(false);
  React.useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const measure = () => {
      const el = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      if (el) setBox({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-state"] });
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    const id = requestAnimationFrame(() => setReady(true));
    return () => (mo.disconnect(), ro.disconnect(), cancelAnimationFrame(id));
  }, []);
  return (
    <T.List ref={ref} className={cn("relative inline-flex items-center gap-1", className)} {...props}>
      {box ? (
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0 rounded-control bg-fill", ready && "transition-[transform,width] duration-[220ms] ease-ad")}
          style={{ width: box.w, transform: `translateX(${box.x}px)` }}
        />
      ) : null}
      {children}
    </T.List>
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "relative z-10 inline-flex h-control cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-control px-3 text-body font-medium transition-[color,transform] duration-[220ms] ease-ad active:scale-[0.96] [&_svg]:size-4",
        "text-ink-muted hover:text-ink focus-visible:text-ink data-[state=active]:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("pt-3 data-[state=active]:animate-[ad-fade-in_220ms_var(--ad-ease)]", className)} {...props} />;
}
