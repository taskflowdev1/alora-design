import * as React from "react";
import { Home, Package, Settings, ShoppingBag, Tag, Users, XCircle } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Status } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar";
import { ORDERS } from "../data";
import { Mark, Tile } from "../mark";
import { tone } from "./actions";

/* ------------------------------------------------------------ Layout */

export function DesktopShellTile({ className }: { className?: string }) {
  const [at, setAt] = React.useState("Orders");
  const nav: [typeof Home, string, number?][] = [
    [Home, "Dashboard"],
    [ShoppingBag, "Orders", 23],
    [Package, "Products"],
    [Tag, "Promotions"],
    [XCircle, "Cancellations"],
  ];
  return (
    <Tile className={cn("sm:flex-row", className)}>
      <Mark name="sidebar" className="flex">
        <Sidebar className="w-52 max-sm:w-full sm:min-h-[360px]">
          <SidebarSection>
            {nav.map(([I, l, c]) => (
              <SidebarItem key={l} icon={I} active={at === l} count={c} onClick={() => setAt(l)}>
                {l}
              </SidebarItem>
            ))}
          </SidebarSection>
          <SidebarSection label="Shop">
            <SidebarItem icon={Users} active={at === "Team"} onClick={() => setAt("Team")}>
              Team
            </SidebarItem>
            <SidebarItem icon={Settings} active={at === "Settings"} onClick={() => setAt("Settings")}>
              Settings
            </SidebarItem>
          </SidebarSection>
          <div className="mt-auto flex items-center px-1 pt-4">
            <Avatar name="Rizky Hartono" size="sm" className="bg-side-fill-strong text-side-ink" />
          </div>
        </Sidebar>
      </Mark>
      <div className="grid min-w-0 flex-1 content-start gap-px">
        <div className="mb-2 flex min-h-control items-center px-2 pt-1 text-title font-semibold">{at}</div>
        {ORDERS.slice(0, 7).map((o) => (
          <div key={o.id} className="flex h-row items-center gap-4 rounded-item px-2 text-body hover:bg-fill">
            <span className="w-24 shrink-0">{o.id}</span>
            <span className="min-w-0 flex-1 truncate text-ink-muted">{o.items}</span>
            <span className="hidden w-24 shrink-0 md:block">
              <Status tone={tone(o)}>{o.status}</Status>
            </span>
            <span className="shrink-0 tabular-nums">{formatRp(o.total)}</span>
          </div>
        ))}
      </div>
    </Tile>
  );
}
