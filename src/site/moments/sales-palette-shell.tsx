import * as React from "react";
import { Bell, Box, ChevronDown, Home, LogOut, Package, Plus, Printer, RefreshCw, Settings, ShoppingBag, Tag, User, Users, XCircle } from "react-feather";
import { cn, formatNumber } from "@/lib/ad";
import { Card, MetricCard } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { LoadingText } from "@/components/ui/skeleton";
import { BarChart } from "@/components/ui/bar-chart";
import { Segmented } from "@/components/ui/segmented";
import { toast } from "@/components/ui/toast";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar";
import { CommandPalette } from "@/components/ui/command-palette";
import { NotificationBell } from "@/components/ui/notification-bell";
import { DAILY, HOURLY, MARKET_SHOPS, NOTICES } from "../data";
import { useBusy } from "./shared";

/* ------------------------------------------------------------ B2 sales */

type Range = "day" | "week" | "month";
const SALES: Record<Range, { label: string; value: number; delta: string; up: boolean; orders: number; chart: typeof HOURLY; current: number; every: number }> = {
  day: { label: "Sales today", value: 48240000, delta: "9,7%", up: true, orders: 312, chart: HOURLY, current: 6, every: 3 },
  week: { label: "Sales this week", value: 268400000, delta: "4,2%", up: true, orders: 1784, chart: DAILY.slice(-7), current: 6, every: 1 },
  month: { label: "Sales this month", value: 1124600000, delta: "1,8%", up: false, orders: 7420, chart: DAILY, current: 29, every: 5 },
};

const LONGEST_SALE = Math.max(...Object.values(SALES).map((s) => s.value));

export function SalesCard({ chartHeight = 96, className }: { chartHeight?: number; className?: string }) {
  const [range, setRange] = React.useState<Range>("day");
  const [loading, kick] = useBusy();
  const s = SALES[range];
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4", className)}>
      <MetricCard variant="hero" primary loading={loading} label={s.label} unit="Rp" value={s.value} fitTo={LONGEST_SALE} delta={{ value: s.delta, direction: s.up ? "up" : "down" }} />
      <BarChart data={s.chart} current={s.current} labelEvery={s.every} height={chartHeight} loading={loading} aria-label={s.label} />
      <div className="flex flex-wrap items-center justify-between gap-gap">
        <Segmented
          aria-label="Range"
          value={range}
          onValueChange={(v) => (setRange(v), kick())}
          options={[
            { value: "day", label: "Today" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
        <span className="flex items-center gap-2.5 text-body">
          <span className="text-ink-muted">Orders</span>
          <span className="min-w-[5ch] text-right font-semibold tabular-nums">
            <LoadingText loading={loading}>{formatNumber(s.orders)}</LoadingText>
          </span>
        </span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B3 command palette, open */

export function PaletteCard({ className }: { className?: string }) {
  const say = (m: string) => () => toast(m, "neutral");
  return (
    <CommandPalette
      inline
      className={cn("min-w-0 shadow-card", className)}
      groups={[
        {
          label: "Actions",
          items: [
            { id: "new-order", label: "New order", icon: Plus, shortcut: ["N"], onSelect: say("New order") },
            { id: "print", label: "Print packing slips", icon: Printer, shortcut: ["mod", "P"], onSelect: say("Printing 12 slips") },
            { id: "sync", label: "Sync stock now", icon: RefreshCw, keywords: "shopee tiktok", onSelect: say("Syncing 7 shops") },
          ],
        },
        {
          label: "Go to",
          items: [
            { id: "orders", label: "Orders", icon: ShoppingBag, shortcut: ["G", "O"], onSelect: say("Orders") },
            { id: "products", label: "Products", icon: Package, shortcut: ["G", "P"], onSelect: say("Products") },
            { id: "promotions", label: "Promotions", icon: Tag, onSelect: say("Promotions") },
            { id: "cancellations", label: "Cancellations", icon: XCircle, onSelect: say("Cancellations") },
            { id: "settings", label: "Settings", icon: Settings, shortcut: ["mod", ","], onSelect: say("Settings") },
          ],
        },
      ]}
    />
  );
}

/* ------------------------------------------------------------ B4 the app's sidebar */

export function ShellCard({ className }: { className?: string }) {
  const [at, setAt] = React.useState("Orders");
  const [notices, setNotices] = React.useState(NOTICES);
  const nav: [typeof Home, string, number?][] = [
    [Home, "Dashboard"],
    [ShoppingBag, "Orders", 23],
    [Package, "Products"],
    [Tag, "Promotions"],
    [XCircle, "Cancellations", 4],
  ];
  return (
    <Sidebar className={cn("w-full min-h-[420px]", className)}>
      <Menu
        tone="dark"
        trigger={
          <button type="button" className="flex h-control w-full cursor-pointer items-center justify-between gap-2 rounded-control bg-side-fill px-2.5 text-body hover:bg-side-fill-strong focus-visible:bg-side-fill-strong">
            <span className="truncate">Rimba · All shops</span>
            <ChevronDown size={16} className="shrink-0 text-side-muted" />
          </button>
        }
      >
        <MenuItem icon={Home} onSelect={() => toast("All shops", "neutral")}>
          All shops
        </MenuItem>
        {MARKET_SHOPS.slice(0, 3).map((s) => (
          <MenuItem key={s.id} icon={Box} onSelect={() => toast(s.name, "neutral")}>
            {s.name}
          </MenuItem>
        ))}
      </Menu>
      <SidebarSection className="mt-5">
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
      <div className="mt-auto flex items-center justify-between pt-4 pl-1">
        <Menu
          tone="dark"
          side="top"
          trigger={
            <button type="button" aria-label="Account" className="cursor-pointer rounded-full transition-[filter] duration-[150ms] ease-ad hover:brightness-[0.9] focus-visible:brightness-[0.78]">
              <Avatar name="Rizky Hartono" size="sm" className="bg-side-fill-strong text-side-ink" />
            </button>
          }
        >
          <MenuItem icon={User}>Profile</MenuItem>
          <MenuItem icon={Bell}>Notifications</MenuItem>
          <MenuItem icon={LogOut}>Sign out</MenuItem>
        </Menu>
        <NotificationBell notices={notices} onMarkAllRead={() => setNotices(notices.map((n) => ({ ...n, unread: false })))} className="text-side-muted hover:text-side-ink" />
      </div>
    </Sidebar>
  );
}
