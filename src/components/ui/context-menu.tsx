import * as React from "react";
import { ContextMenu as C } from "radix-ui";
import { ChevronRight } from "react-feather";
import { cn } from "@/lib/ad";
import { menuSurface } from "@/components/ui/menu";

/** Right click (or long press) on the child opens the menu at the pointer. */
export function ContextMenu({ children, menu, className }: { children: React.ReactElement; menu: React.ReactNode; className?: string }) {
  return (
    <C.Root>
      <C.Trigger asChild>{children}</C.Trigger>
      <C.Portal>
        <C.Content collisionPadding={8} className={cn(menuSurface, "origin-(--radix-context-menu-content-transform-origin)", className)}>
          {menu}
        </C.Content>
      </C.Portal>
    </C.Root>
  );
}

const item = cn(
  "flex h-item w-full cursor-pointer select-none items-center gap-2.5 rounded-control px-2.5 text-left text-body text-ink outline-none",
  "data-[highlighted]:bg-fill data-[state=open]:bg-fill data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
);

export interface ContextMenuItemProps {
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  children: React.ReactNode;
  shortcut?: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
}

export function ContextMenuItem({ icon: Icon, children, shortcut, onSelect, disabled }: ContextMenuItemProps) {
  return (
    <C.Item className={item} onSelect={onSelect} disabled={disabled}>
      {Icon ? <Icon size={16} className="shrink-0 text-ink-muted" /> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut ? <span className="pl-4 text-small text-ink-faint">{shortcut}</span> : null}
    </C.Item>
  );
}

/** Groups are separated by space, never by a line. */
export function ContextMenuGroup({ children }: { children: React.ReactNode }) {
  return <C.Group className="mt-1.5 grid gap-px first:mt-0">{children}</C.Group>;
}

export function ContextMenuSub({ label, icon: Icon, children }: { label: React.ReactNode; icon?: ContextMenuItemProps["icon"]; children: React.ReactNode }) {
  return (
    <C.Sub>
      <C.SubTrigger className={item}>
        {Icon ? <Icon size={16} className="shrink-0 text-ink-muted" /> : null}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronRight size={16} className="-mr-1 shrink-0 text-ink-muted" />
      </C.SubTrigger>
      <C.Portal>
        <C.SubContent sideOffset={6} collisionPadding={8} className={cn(menuSurface, "animate-[ad-fade-in_160ms_var(--ad-ease)]")}>
          {children}
        </C.SubContent>
      </C.Portal>
    </C.Sub>
  );
}
