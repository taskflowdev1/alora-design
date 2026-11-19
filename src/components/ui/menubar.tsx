import * as React from "react";
import { cn } from "@/lib/ad";
import { buttonClass } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";

export interface MenubarMenu {
  label: React.ReactNode;
  /** MenuItem / MenuGroup / MenuSub children: the same menu (with its safe triangle) as everywhere else. */
  content: React.ReactNode;
}

/**
 * A desktop-app menu row (File, Edit, View). Click opens a menu; while one is open, moving across the row opens its
 * neighbour, and arrow keys move between them. The open trigger keeps the hover fill. Built on Menu.
 */
export function Menubar({ menus, className }: { menus: MenubarMenu[]; className?: string }) {
  const [open, setOpen] = React.useState<number | null>(null);
  const row = React.useRef<HTMLDivElement>(null);
  const focusAt = (i: number) => row.current?.querySelectorAll<HTMLElement>("[data-menubar-trigger]")[(i + menus.length) % menus.length]?.focus();
  return (
    <div ref={row} role="menubar" className={cn("inline-flex h-control items-center gap-0.5 rounded-control bg-fill p-nest", className)}>
      {menus.map((m, i) => (
        <Menu
          key={i}
          open={open === i}
          onOpenChange={(o) => setOpen((cur) => (o ? i : cur === i ? null : cur))}
          trigger={
            <button
              type="button"
              role="menuitem"
              data-menubar-trigger
              onPointerEnter={() => open != null && open !== i && setOpen(i)}
              onKeyDown={(e) => {
                const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                if (!d) return;
                e.preventDefault();
                focusAt(i + d);
                if (open != null) setOpen((i + d + menus.length) % menus.length);
              }}
              className={cn(buttonClass({ variant: "ghost", size: "sm" }), "h-full rounded-item px-[calc(var(--ad-bubble-x)-var(--ad-nest))] font-normal hover:bg-fill-strong focus-visible:bg-fill-strong data-[state=open]:bg-fill-strong")}
            >
              {m.label}
            </button>
          }
        >
          {m.content}
        </Menu>
      ))}
    </div>
  );
}
