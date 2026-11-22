import * as React from "react";
import { Package, Plus, Printer, RefreshCw, Settings, ShoppingBag, Tag, XCircle } from "react-feather";
import { cn, formatNumber } from "@/lib/ad";
import { Card, MetricCard } from "@/components/ui/card";
import { LoadingText } from "@/components/ui/skeleton";
import { BarChart } from "@/components/ui/bar-chart";
import { Segmented } from "@/components/ui/segmented";
import { toast } from "@/components/ui/toast";
import { CommandPalette } from "@/components/ui/command-palette";
import { DAILY, HOURLY } from "../data";
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
