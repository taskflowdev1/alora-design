import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/ad";
import { SlidingPill } from "@/components/ui/sliding-pill";

/** Inside a Sidebar one highlight slides between rows; a lone SidebarItem paints its own. */
const InSidebar = React.createContext(false);

/*
 * Dark sidebar in both themes. Floats with a margin; its radius is the card
 * radius, and rows sit two nest gaps in, so the row highlight is concentric.
 * Menus and popovers opened from it pass tone="dark".
 */
export function Sidebar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <nav className={cn("ad-on-dark relative flex w-56 shrink-0 flex-col rounded-card bg-side p-[calc(var(--ad-nest)*2)] text-side-ink", className)}>
      <SlidingPill selector='[aria-current="page"]' className="rounded-item bg-side-fill-strong" />
      <InSidebar.Provider value={true}>{children}</InSidebar.Provider>
    </nav>
  );
}

export function SidebarSection({ label, children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mt-4 grid gap-px first-of-type:mt-0", className)}>
      {label ? <div className="flex h-7 items-center px-2.5 text-small text-side-muted">{label}</div> : null}
      {children}
    </div>
  );
}

export interface SidebarItemProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  children: React.ReactNode;
  active?: boolean;
  /** Plain grey count on the right. */
  count?: number;
  asChild?: boolean;
  onClick?: () => void;
}

/** Icon + label. The active row gets a highlight (it slides between rows inside a Sidebar); the icon stays the same. */
export function SidebarItem({ icon: Icon, children, active, count, asChild, onClick }: SidebarItemProps) {
  const Comp = asChild ? Slot.Root : "button";
  const sliding = React.useContext(InSidebar);
  const inner = (
    <>
      <Icon size={16} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      {count != null ? <span className="text-small tabular-nums text-side-muted">{count}</span> : null}
    </>
  );
  return (
    <Comp
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex h-item w-full cursor-pointer select-none items-center gap-2.5 rounded-item px-2.5 text-body transition-[background-color,color,transform] duration-[150ms] ease-ad active:scale-[0.98]",
        active ? cn("text-side-ink", !sliding && "bg-side-fill-strong") : "text-side-muted hover:bg-side-fill hover:text-side-ink focus-visible:text-side-ink focus-visible:bg-side-fill",
      )}
    >
      {asChild ? React.cloneElement(React.Children.only(children) as React.ReactElement<{ children?: React.ReactNode }>, undefined, inner) : inner}
    </Comp>
  );
}
