import * as React from "react";
import { Tabs as T } from "radix-ui";
import { cn } from "@/lib/ad";

/** Tabs: no track and no underline. A grey pill (fill-strong) slides behind the active tab; its label turns ink and medium. */
export function Tabs(props: React.ComponentProps<typeof T.Root>) {
  return <T.Root {...props} />;
}

/** The label twice in one cell, the hidden copy at medium weight, so turning medium never changes the width. */
const hold = (label: React.ReactNode) => (
  <span className="ad-hold">
    <span aria-hidden>{label}</span>
    <span>{label}</span>
  </span>
);

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
          className={cn("absolute inset-y-0 left-0 rounded-control bg-fill-strong", ready && "transition-[transform,width] duration-[220ms] ease-ad")}
          style={{ width: box.w, transform: `translateX(${box.x}px)` }}
        />
      ) : null}
      {children}
    </T.List>
  );
}

export function TabsTrigger({ className, children, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "relative z-10 inline-flex h-control cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-control px-bubble text-body transition-[color,transform] duration-[150ms] ease-ad active:scale-[0.97] [&_svg]:size-4",
        "text-ink-muted data-[state=inactive]:hover:text-ink data-[state=inactive]:focus-visible:text-ink data-[state=active]:font-medium data-[state=active]:text-ink",
        className,
      )}
      {...props}
    >
      {hold(children)}
    </T.Trigger>
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("pt-3 data-[state=active]:animate-[ad-fade-in_220ms_var(--ad-ease)]", className)} {...props} />;
}
