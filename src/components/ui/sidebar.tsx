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
      {/* The island is dark in both themes, so keyboard focus on the current row darkens its pill by the dark-theme notch. */}
      <SlidingPill selector='[aria-current="page"]' className="rounded-item bg-side-fill-strong data-[focus]:brightness-[0.78]" />
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
  // With asChild the child (a link) becomes the row, so its own children are the label; rendering the child again
  // inside itself would nest a link in a link (two tab stops, read twice).
  const child = asChild ? (React.Children.only(children) as React.ReactElement<{ children?: React.ReactNode }>) : null;
  const inner = (
    <>
      <Icon size={16} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{child ? child.props.children : children}</span>
      {count != null ? <span className="text-small tabular-nums text-side-muted">{count}</span> : null}
    </>
  );
  return (
    <Comp
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex h-item w-full cursor-pointer select-none items-center gap-2.5 rounded-item px-2.5 text-body ad-press active:scale-[0.98]",
        active ? cn("text-side-ink", !sliding && "bg-side-fill-strong focus-visible:brightness-[0.78]") : "text-side-muted hover:bg-side-fill hover:text-side-ink focus-visible:text-side-ink focus-visible:bg-side-fill",
      )}
    >
      {child ? React.cloneElement(child, undefined, inner) : inner}
    </Comp>
  );
}
