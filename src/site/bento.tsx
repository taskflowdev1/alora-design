/*
 * The landing bento: every component in use, inside real-looking ERP cards of varied sizes.
 * No per-component labels; card titles only where a real app would have one. Everything stays
 * interactive. `?loading=1` holds the skeletons (review shots).
 */
import * as React from "react";
import { useSearchParams } from "react-router";
import {
  Archive,
  Bell,
  Box,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Home,
  Inbox,
  LogOut,
  Mail,
  MoreHorizontal,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search as SearchIcon,
  Settings,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  Upload,
  User,
  Users,
  XCircle,
} from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, MetricCard } from "@/components/ui/card";
import { Table, TableBar, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { Toolbar } from "@/components/ui/toolbar";
import { Search } from "@/components/ui/search";
import { Popover } from "@/components/ui/popover";
import { CheckboxField, Checkbox } from "@/components/ui/checkbox";
import { Chip, Pill, Status } from "@/components/ui/status";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Thumb } from "@/components/ui/thumb";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading, LoadingText } from "@/components/ui/skeleton";
import { BarChart } from "@/components/ui/bar-chart";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Slider } from "@/components/ui/slider";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { LanguagePicker } from "@/components/ui/language-picker";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";
import { toast, ToastView } from "@/components/ui/toast";
import { Menu, MenuGroup, MenuItem, MenuSub } from "@/components/ui/menu";
import { SaveBar } from "@/components/ui/save-bar";
import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar";
import { BottomNav, BottomNavItem } from "@/components/ui/bottom-nav";
import { CommandPalette } from "@/components/ui/command-palette";
import { DateRangePicker, DEFAULT_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Diff } from "@/components/ui/diff";
import { FeeRow, FeeTotal } from "@/components/ui/fee-row";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { ShopPicker } from "@/components/ui/shop-picker";
import { SplitButton } from "@/components/ui/split-button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { ContextMenu, ContextMenuGroup, ContextMenuItem, ContextMenuSub } from "@/components/ui/context-menu";
import { HoverCard } from "@/components/ui/hover-card";
import { ColumnMenu } from "@/components/ui/column-menu";
import { InlineEdit } from "@/components/ui/inline-edit";
import { CopyChip } from "@/components/ui/copy-chip";
import { Sparkline } from "@/components/ui/sparkline";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Steps } from "@/components/ui/steps";
import { Timeline } from "@/components/ui/timeline";
import { CommentThread, type Comment } from "@/components/ui/comment-thread";
import { Dropzone, type DropFile } from "@/components/ui/dropzone";
import { TagInput } from "@/components/ui/tag-input";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { NotificationBell, type Notice } from "@/components/ui/notification-bell";
import { KanbanCard, KanbanColumn } from "@/components/ui/kanban-card";
import { CalendarMonth, type CalendarEvent } from "@/components/ui/calendar-month";
import { DAILY, HOURLY, MARKET_SHOPS, NOW, ORDERS, PRODUCTS, SPARK, TEAM, smartTime, type Order } from "./data";
import { OrderDetail } from "./demos";

/* ------------------------------------------------------------ shared bits */

type Market = "shopee" | "tiktok" | "offline";
const marketOf = (shop: string): Market => (shop === "Shopee" ? "shopee" : shop === "TikTok Shop" ? "tiktok" : "offline");
const shopName = (shop: string) => (shop === "Shopee" ? "Rimba Official" : shop === "TikTok Shop" ? "Rimba Live" : shop);
const add = (n: number) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + n);

function useHeldLoading() {
  const [params] = useSearchParams();
  return params.get("loading") === "1";
}

/** A filter change swaps the content for its skeleton for a beat (taste: skeleton on every filter change). */
function useBusy(ms = 420): [boolean, () => void] {
  const held = useHeldLoading();
  const [busy, setBusy] = React.useState(false);
  const timer = React.useRef<number>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const kick = React.useCallback(() => {
    setBusy(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusy(false), ms);
  }, [ms]);
  return [held || busy, kick];
}

/** Payout check per order: what the platform paid against what we expected. Mostly none. */
const diffOf = (i: number) => [0, 0, -4000, 0, 0, 1500, 0, 0, -12000, 0, 0, 0][i % 12];

/* ------------------------------------------------------------ B1 orders */

const ORDER_COLUMNS = [
  { key: "order", label: "Order", locked: true },
  { key: "time", label: "Time" },
  { key: "shop", label: "Shop" },
  { key: "customer", label: "Customer" },
  { key: "payment", label: "Payment" },
  { key: "status", label: "Status", locked: true },
  { key: "total", label: "Total", locked: true },
  { key: "diff", label: "Difference", locked: true },
];
const ORDER_DEFAULT_COLS = ["time", "shop", "customer"];

const CHIPS = [
  { key: "all", label: "All" },
  { key: "Unpaid", label: "Unpaid" },
  { key: "Paid", label: "To pack" },
  { key: "Shipped", label: "Shipped" },
];

function CustomerName({ o }: { o: Order }) {
  return (
    <HoverCard
      trigger={
        <a href="#customer" onClick={(e) => (e.preventDefault(), e.stopPropagation())} className="rounded-small text-ink hover:bg-fill">
          {o.customer}
        </a>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar name={o.customer} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold">{o.customer}</p>
          <p className="text-small text-ink-muted">Customer since Mar 2025</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-body">
        {[
          ["Orders", "14"],
          ["Spent", "Rp 3,2 jt"],
          ["Returns", "0"],
        ].map(([k, v]) => (
          <div key={k} className="grid gap-0.5 rounded-item bg-fill px-2.5 py-2">
            <span className="text-small text-ink-muted">{k}</span>
            <span className="font-semibold tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </HoverCard>
  );
}

function OrdersCard({ className }: { className?: string }) {
  const [q, setQ] = React.useState("");
  const [shops, setShops] = React.useState(MARKET_SHOPS.map((s) => s.id));
  const [week, setWeek] = React.useState(NOW);
  const [chip, setChip] = React.useState("all");
  const [cols, setCols] = React.useState(ORDER_DEFAULT_COLS);
  const [unpaidOnly, setUnpaidOnly] = React.useState(false);
  const [codOnly, setCodOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [open, setOpen] = React.useState<Order | null>(null);
  const [loading, kick] = useBusy();
  const on = (k: string) => cols.includes(k);
  const filter = <T,>(set: (v: T) => void) => (v: T) => (set(v), setPage(1), kick());

  const weekOffset = Math.round((NOW.getTime() - week.getTime()) / (7 * 864e5)) * 40;
  const markets = new Set(MARKET_SHOPS.filter((s) => shops.includes(s.id)).map((s) => s.market));
  const rows = ORDERS.slice(weekOffset).filter(
    (o) =>
      markets.has(marketOf(o.shop)) &&
      (chip === "all" || o.status === chip) &&
      (!unpaidOnly || o.status === "Unpaid") &&
      (!codOnly || o.payment === "COD") &&
      (!q || `${o.id} ${o.items} ${o.customer}`.toLowerCase().includes(q.toLowerCase())),
  );
  const shown = rows.slice((page - 1) * 50, (page - 1) * 50 + 14);
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;

  return (
    <Card inset="nest" className={cn("flex min-w-0 flex-col gap-gap", className)}>
      <div className="flex min-h-control flex-wrap items-center gap-gap px-2 pt-2">
        <h3 className="mr-auto text-title font-semibold">Orders</h3>
        <Menu
          align="end"
          trigger={
            <Button variant="ghost" icon aria-label="More order actions">
              <MoreHorizontal />
            </Button>
          }
        >
          <MenuItem icon={Download} onSelect={() => toast("Exporting 1.240 orders", "neutral")}>
            Export
          </MenuItem>
          <MenuItem icon={Upload} onSelect={() => toast("Choose a file to import", "neutral")}>
            Import
          </MenuItem>
          <MenuSub icon={Printer} label="Print">
            <MenuItem onSelect={() => toast("Printing 12 slips", "neutral")}>Packing slips</MenuItem>
            <MenuItem onSelect={() => toast("Printing 12 invoices", "neutral")}>Invoices</MenuItem>
          </MenuSub>
          <MenuGroup>
            <MenuItem icon={Archive} onSelect={() => toast("Archived last month", "neutral")}>
              Archive last month
            </MenuItem>
          </MenuGroup>
        </Menu>
        <SplitButton
          onClick={() => toast("12 orders packed")}
          menu={
            <>
              <MenuItem icon={Printer} onSelect={() => toast("Printing slips", "neutral")}>
                Pack and print slips
              </MenuItem>
              <MenuItem icon={Truck} onSelect={() => toast("Courier booked", "neutral")}>
                Pack and book courier
              </MenuItem>
            </>
          }
        >
          <Box />
          Pack 12
        </SplitButton>
      </div>
      <Toolbar className="px-2">
        <Search value={q} onValueChange={filter(setQ)} placeholder="Order or product" />
        <ShopPicker shops={MARKET_SHOPS} value={shops} onValueChange={filter(setShops)} />
        <PeriodStepper period="week" value={week} onValueChange={filter(setWeek)} max={NOW} />
        <Popover trigger={<Button>Filter</Button>}>
          <div className="grid w-52 gap-2.5">
            <CheckboxField label="Unpaid only" checked={unpaidOnly} onCheckedChange={(v) => filter(setUnpaidOnly)(v === true)} />
            <CheckboxField label="Cash on delivery" checked={codOnly} onCheckedChange={(v) => filter(setCodOnly)(v === true)} />
          </div>
        </Popover>
        <ColumnMenu columns={ORDER_COLUMNS} visible={cols} onVisibleChange={setCols} defaults={ORDER_DEFAULT_COLS} />
      </Toolbar>
      <div className="flex flex-wrap gap-1 px-2">
        {CHIPS.map((c) => (
          <Chip key={c.key} selected={chip === c.key} onClick={() => filter(setChip)(c.key)}>
            {c.label}
          </Chip>
        ))}
      </div>
      <Table className="min-h-[280px] lg:h-0 lg:flex-1">
        <THead>
          <tr>
            <TH>Order</TH>
            {on("time") ? <TH>Time</TH> : null}
            {on("shop") ? <TH>Shop</TH> : null}
            {on("customer") ? <TH>Customer</TH> : null}
            {on("payment") ? <TH>Payment</TH> : null}
            <TH>Status</TH>
            <TH align="right">Total</TH>
            <TH align="right">Difference</TH>
          </tr>
        </THead>
        <TBody>
          {shown.map((o) => {
            const i = ORDERS.indexOf(o);
            return (
              <ContextMenu
                key={o.id}
                menu={
                  <>
                    <ContextMenuItem icon={FileText} onSelect={() => setOpen(o)}>
                      Open
                    </ContextMenuItem>
                    <ContextMenuItem icon={Copy} onSelect={() => (navigator.clipboard?.writeText(o.id).catch(() => {}), toast(`${o.id} copied`, "neutral"))}>
                      Copy order number
                    </ContextMenuItem>
                    <ContextMenuSub icon={Truck} label="Move to">
                      <ContextMenuItem onSelect={() => toast(`${o.id} moved to To pack`, "neutral")}>To pack</ContextMenuItem>
                      <ContextMenuItem onSelect={() => toast(`${o.id} put on hold`, "neutral")}>On hold</ContextMenuItem>
                    </ContextMenuSub>
                    <ContextMenuGroup>
                      <ContextMenuItem icon={Trash2} onSelect={() => toast(`${o.id} cancelled`)}>
                        Cancel order
                      </ContextMenuItem>
                    </ContextMenuGroup>
                  </>
                }
              >
                <TRow selected={open?.id === o.id} onActivate={() => setOpen(o)}>
                  <TD>
                    <L>{o.id}</L>
                  </TD>
                  {on("time") ? (
                    <TD className="text-ink-muted">
                      <L>{smartTime(o.at)}</L>
                    </TD>
                  ) : null}
                  {on("shop") ? (
                    <TD>
                      <Loading loading={loading}>
                        <span className="inline-flex items-center gap-2">
                          <MarketMark market={marketOf(o.shop)} />
                          {shopName(o.shop)}
                        </span>
                      </Loading>
                    </TD>
                  ) : null}
                  {on("customer") ? <TD>{loading ? <L>{o.customer}</L> : <CustomerName o={o} />}</TD> : null}
                  {on("payment") ? (
                    <TD>
                      <L>{o.payment}</L>
                    </TD>
                  ) : null}
                  <TD>
                    <Loading loading={loading}>
                      <Status tone={o.status === "Unpaid" ? "attention" : o.status === "Cancelled" ? "muted" : "default"}>{o.status}</Status>
                    </Loading>
                  </TD>
                  <TD align="right">
                    <L>{formatRp(o.total)}</L>
                  </TD>
                  <TD align="right">
                    <Loading loading={loading}>
                      <Diff value={diffOf(i)} unit="Rp" />
                    </Loading>
                  </TD>
                </TRow>
              </ContextMenu>
            );
          })}
        </TBody>
      </Table>
      {shown.length === 0 ? <EmptyState icon={SearchIcon} title="No orders match" className="py-6" /> : null}
      <TableBar page={page} total={rows.length} onPageChange={setPage} />
      <Sheet
        open={!!open}
        onOpenChange={(v) => !v && setOpen(null)}
        title={open?.id ?? ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => (setOpen(null), toast("Marked as packed"))}>
              Mark as packed
            </Button>
          </>
        }
      >
        {open ? <OrderDetail id={open.id} /> : null}
      </Sheet>
    </Card>
  );
}

/* ------------------------------------------------------------ B2 sales */

type Range = "day" | "week" | "month";
const SALES: Record<Range, { label: string; value: number; delta: string; up: boolean; orders: number; chart: typeof HOURLY; current: number; every: number }> = {
  day: { label: "Sales today", value: 48240000, delta: "9,7%", up: true, orders: 312, chart: HOURLY, current: 6, every: 3 },
  week: { label: "Sales this week", value: 268400000, delta: "4,2%", up: true, orders: 1784, chart: DAILY.slice(-7), current: 6, every: 1 },
  month: { label: "Sales this month", value: 1124600000, delta: "1,8%", up: false, orders: 7420, chart: DAILY, current: 29, every: 5 },
};

function SalesCard({ className }: { className?: string }) {
  const [range, setRange] = React.useState<Range>("day");
  const [loading, kick] = useBusy();
  const s = SALES[range];
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4", className)}>
      <MetricCard variant="hero" primary loading={loading} label={s.label} unit="Rp" value={s.value} delta={{ value: s.delta, direction: s.up ? "up" : "down" }} />
      <BarChart data={s.chart} current={s.current} labelEvery={s.every} height={96} loading={loading} aria-label={s.label} />
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
            <LoadingText loading={loading}>{s.orders.toLocaleString("id-ID")}</LoadingText>
          </span>
        </span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B3 command palette, open */

function PaletteCard({ className }: { className?: string }) {
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
            { id: "promotions", label: "Promotions", icon: Tag, onSelect: say("Promotions") },
            { id: "settings", label: "Settings", icon: Settings, shortcut: ["mod", ","], onSelect: say("Settings") },
          ],
        },
      ]}
    />
  );
}

/* ------------------------------------------------------------ B4 the app's sidebar */

const NOTICES: Notice[] = [
  { id: "1", title: "2 shops haven't synced since 09:40", time: "Today, 10:10", unread: true },
  { id: "2", title: "Payout of Rp 12.840.000 sent", time: "Today, 08:02", unread: true },
  { id: "3", title: "Keranjang pandan besar is out of stock", time: "Yesterday, 19:45" },
];

function ShellCard({ className }: { className?: string }) {
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
          <button type="button" className="flex h-control w-full cursor-pointer items-center justify-between gap-2 rounded-control bg-side-fill px-2.5 text-body hover:bg-side-fill-strong">
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
            <button type="button" aria-label="Account" className="cursor-pointer rounded-full transition-transform duration-[160ms] active:scale-95">
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

/* ------------------------------------------------------------ B5 packing board */

function BoardCard({ className }: { className?: string }) {
  const card = (o: Order, i: number, attention?: boolean) => (
    <KanbanCard
      key={o.id}
      title={o.items}
      id={o.id}
      media={<Thumb alt={o.items} />}
      tags={[shopName(o.shop)]}
      people={[{ name: TEAM[(i + 1) % 4].name }]}
      due={attention ? "Today" : "Tomorrow"}
      attention={attention}
      onClick={() => toast(o.id, "neutral")}
    />
  );
  return (
    <Card inset="nest" className={cn("flex min-w-0 gap-nest max-sm:flex-col sm:overflow-x-auto", className)}>
      <KanbanColumn title="To pack" count={3} className="flex-1 max-sm:min-w-0 sm:min-w-56">
        {card(ORDERS[1], 0, true)}
        {card(ORDERS[3], 1)}
        {card(ORDERS[7], 2)}
      </KanbanColumn>
      <KanbanColumn title="Packed" count={2} className="flex-1 max-sm:min-w-0 sm:min-w-56">
        {card(ORDERS[10], 3)}
        {card(ORDERS[14], 0)}
      </KanbanColumn>
    </Card>
  );
}

/* ------------------------------------------------------------ B6 fees on one order */

function FeesCard({ className }: { className?: string }) {
  const lines = [
    { payer: "buyer" as const, label: "Items, 2 × Gelas kopi", amount: 178000 },
    { payer: "buyer" as const, label: "Shipping", amount: 18000, shipping: true },
    { payer: "platform" as const, label: "Admin fee 4,5%", amount: -8010 },
    { payer: "platform" as const, label: "Free shipping programme", amount: -4000 },
    { payer: "shop" as const, label: "Voucher RIMBA10", amount: -17800 },
  ];
  const [reason, setReason] = React.useState("fee");
  return (
    <Card inset="nest" className={cn("flex min-w-0 flex-col gap-nest", className)}>
      <div className="flex min-h-control items-center gap-2 px-2 pt-2">
        <h3 className="mr-auto truncate text-title font-semibold">RMB-24812</h3>
        <Pill>Fee mismatch</Pill>
        <Dialog
          title="Dispute RMB-24812?"
          trigger={<Button>Dispute</Button>}
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Keep</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="primary" onClick={() => toast("Dispute sent to Shopee")}>
                  Send dispute
                </Button>
              </DialogClose>
            </>
          }
        >
          <div className="grid gap-4">
            <Field label="Reason">
              <Select
                aria-label="Reason"
                value={reason}
                onValueChange={setReason}
                options={[
                  { value: "fee", label: "Admin fee too high" },
                  { value: "ship", label: "Shipping not refunded" },
                  { value: "voucher", label: "Voucher charged twice" },
                ]}
              />
            </Field>
            <Field label="Note">
              <Textarea defaultValue="Admin fee should be 4% for Star sellers." />
            </Field>
          </div>
        </Dialog>
      </div>
      <div className="grid gap-px">
        {lines.map((l) => (
          <FeeRow key={l.label} market="shopee" {...l} />
        ))}
      </div>
      <FeeTotal label="You receive" amount={lines.reduce((a, l) => a + l.amount, 0)} />
      <div className="grid gap-2 px-2 pb-2 pt-2 text-body">
        {[
          ["Paid out", "18 Nov 2026"],
          ["To", "BCA •••• 4410"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4">
            <span className="text-ink-muted">{k}</span>
            <span className="tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B7 calendar */

const EVENTS: CalendarEvent[] = [
  { id: "a", date: add(-12), title: "Payday sale", tone: "accent" },
  { id: "b", date: add(-9), title: "Stock count" },
  { id: "c", date: add(-2), title: "Restock rotan" },
  { id: "d", date: NOW, title: "11.11 payout" },
  { id: "e", date: NOW, title: "Team sync" },
  { id: "f", date: NOW, title: "Courier change" },
  { id: "g", date: add(4), title: "12.12 sale prep", tone: "accent" },
  { id: "h", date: add(9), title: "Tax filing" },
];

function CalendarCard({ className }: { className?: string }) {
  const [m, setM] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  return (
    <Card className={cn("min-w-0 overflow-x-auto", className)}>
      <CalendarMonth month={m} onMonthChange={setM} events={EVENTS} today={NOW} onEventClick={(e) => toast(e.title, "neutral")} className="sm:min-w-[560px]" />
    </Card>
  );
}

/* ------------------------------------------------------------ B8 notes on an order */

function NotesCard({ className }: { className?: string }) {
  const me = TEAM[0].name;
  const [list, setList] = React.useState<Comment[]>([
    { id: "1", author: TEAM[1].name, time: "Today, 13:52", body: "Buyer asked to swap the glaze to green. Stock has 9.", reactions: [{ emoji: "👍", by: [TEAM[2].name] }] },
    { id: "2", author: TEAM[3].name, time: "Today, 14:05", body: "Swapped and repacked. Courier picks up at 16:00.", reactions: [{ emoji: "🙏", by: [TEAM[1].name, me] }] },
  ]);
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader title="Notes" />
      <CommentThread
        className="mt-2"
        me={me}
        comments={list}
        onReact={(id, emoji) =>
          setList((l) =>
            l.map((c) => {
              if (c.id !== id) return c;
              const rs = c.reactions ?? [];
              const r = rs.find((x) => x.emoji === emoji);
              const next = r
                ? rs.map((x) => (x.emoji === emoji ? { ...x, by: x.by.includes(me) ? x.by.filter((b) => b !== me) : [...x.by, me] } : x)).filter((x) => x.by.length)
                : [...rs, { emoji, by: [me] }];
              return { ...c, reactions: next };
            }),
          )
        }
        onReply={(text) => setList((l) => [...l, { id: String(l.length + 1), author: me, time: "Today, 14:20", body: text }])}
      />
    </Card>
  );
}

/* ------------------------------------------------------------ B9 shipment */

function ShipmentCard({ className }: { className?: string }) {
  return (
    <Card className={cn("grid min-w-0 content-start gap-4", className)}>
      <CardHeader title="RMB-24815" action={<CopyChip value="JNE 0123 4567 8910">JNE 0123 4567 8910</CopyChip>} />
      <Steps steps={["Paid", "Packed", "Shipped", "Delivered"]} current={2} />
      <Timeline
        className="-mx-2"
        events={[
          { id: "1", time: "Today, 14:05", title: "Picked up by JNE", media: <Truck /> },
          { id: "2", time: "Today, 11:40", title: `Packed by ${TEAM[3].name}`, media: <Box /> },
          { id: "3", time: "Yesterday, 21:30", title: "Ordered on Shopee", media: <MarketMark market="shopee" /> },
        ]}
      />
    </Card>
  );
}

/* ------------------------------------------------------------ B10 shop settings */

/** One row rhythm for settings-style cards: a 36 px control sits one nest gap inside a 44 px row.
 * In a card taller than its rows, the rows share the extra height evenly (`auto-rows-fr`). */
const setRow = "flex min-h-[calc(var(--ad-control-h)+var(--ad-nest)*2)] items-center justify-between gap-3 rounded-item px-2";
/** Card insets: 16 to the content on every side (rows add the nest gap vertically). */
const setCard = "flex min-w-0 flex-col gap-nest py-[calc(var(--ad-nest)*3)]";

function SettingsCard({ className }: { className?: string }) {
  const [receipts, setReceipts] = React.useState(true);
  const [round, setRound] = React.useState(false);
  const [courier, setCourier] = React.useState("jne");
  const [pickup, setPickup] = React.useState<string | null>("16:00");
  const [freeShip, setFreeShip] = React.useState<number | null>(150000);
  const [alertAt, setAlertAt] = React.useState(5);
  const [lang, setLang] = React.useState("id");
  const [dirty, setDirty] = React.useState(true);
  const set =
    <T,>(f: (v: T) => void) =>
    (v: T) => (f(v), setDirty(true));
  const row = setRow;
  const ctl = "w-36";
  return (
    <Card inset="nest" className={cn(setCard, className)}>
      <CardHeader title="Kemang" className={row} />
      <div className="grid flex-1 auto-rows-fr">
        <label className={cn(row, "cursor-pointer hover:bg-fill")}>
          <span className="text-body">Print receipts</span>
          <Switch size="lg" checked={receipts} onCheckedChange={set(setReceipts)} />
        </label>
        <label className={cn(row, "cursor-pointer hover:bg-fill")}>
          <span className="text-body">Round cash totals</span>
          <Switch size="lg" checked={round} onCheckedChange={set(setRound)} />
        </label>
        <div className={row}>
          <span className="text-body">Courier</span>
          <Select
            aria-label="Courier"
            value={courier}
            onValueChange={set(setCourier)}
            align="end"
            className={ctl}
            options={[
              { value: "jne", label: "JNE Regular" },
              { value: "sicepat", label: "SiCepat" },
              { value: "pickup", label: "Pick up in shop" },
            ]}
          />
        </div>
        <div className={row}>
          <span className="text-body">Pickup at</span>
          <TimePicker value={pickup} onValueChange={set(setPickup)} className={ctl} />
        </div>
        <div className={row}>
          <span className="text-body">Free shipping over</span>
          <CurrencyInput aria-label="Free shipping over" value={freeShip} onValueChange={set(setFreeShip)} className={ctl} />
        </div>
        <div className={row}>
          <span className="text-body">Low stock at</span>
          <QuantityStepper aria-label="Low stock at" value={alertAt} onValueChange={set(setAlertAt)} min={1} max={50} className={ctl} />
        </div>
        <div className={row}>
          <span className="text-body">Receipt language</span>
          <LanguagePicker value={lang} onValueChange={set(setLang)} className={ctl} />
        </div>
      </div>
      <SaveBar
        open={dirty}
        inline
        onDiscard={() => setDirty(false)}
        onSave={() => {
          setDirty(false);
          toast("Changes saved");
        }}
      />
    </Card>
  );
}

/* ------------------------------------------------------------ B11 new promotion */

function PromotionCard({ className }: { className?: string }) {
  const [name, setName] = React.useState("Rotan week");
  const [product, setProduct] = React.useState<string | null>("RMB-PR-022");
  const [shops, setShops] = React.useState(["Kemang", "Rimba Official"]);
  const [start, setStart] = React.useState<Date | null>(add(4));
  const [discount, setDiscount] = React.useState(15);
  const [limit, setLimit] = React.useState("once");
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4", className)}>
      <CardHeader title="New promotion" />
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Product">
        <Combobox
          aria-label="Product"
          value={product}
          onValueChange={setProduct}
          placeholder="Choose a product"
          searchPlaceholder="Search products"
          options={PRODUCTS.map((p) => ({ value: p.sku, label: p.name }))}
          className="w-full"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label="Shops">
          <MultiSelect aria-label="Shops" value={shops} onValueChange={setShops} maxChips={1} options={MARKET_SHOPS.map((s) => ({ value: s.name, label: s.name }))} />
        </Field>
        <Field label="Starts">
          <DatePicker value={start} onValueChange={setStart} today={NOW} />
        </Field>
      </div>
      <Slider label="Discount" value={discount} min={0} max={50} onValueChange={setDiscount} display={`${discount}%`} />
      <RadioGroup value={limit} onValueChange={setLimit} className="flex flex-wrap gap-x-5 gap-y-2.5">
        <Radio value="once" label="Once per buyer" />
        <Radio value="any" label="No limit" />
      </RadioGroup>
      <div className="mt-auto flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={() => toast("Draft saved", "neutral")}>
          Save draft
        </Button>
        <Button variant="primary" onClick={() => toast(`${name} scheduled`)}>
          Schedule
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B12 team */

function TeamCard({ className }: { className?: string }) {
  const team = TEAM.slice(0, 3);
  const [roles, setRoles] = React.useState(team.map((t) => t.role));
  const [email, setEmail] = React.useState("");
  const roleOptions = ["Owner", "Admin", "Cashier", "Stock"].map((r) => ({ value: r, label: r }));
  // One right-hand column: role selects, the owner's fixed role (text on the selects' text inset) and Invite.
  const ctl = "w-28";
  return (
    <Card inset="nest" className={cn(setCard, className)}>
      <CardHeader title="Team" action={<AvatarGroup people={[...TEAM, { name: "Wulan Sari" }, { name: "Eko Prasetyo" }]} max={4} />} className={setRow} />
      <div className="grid">
        {team.map((t, i) => (
          <div key={t.name} className={cn(setRow, "justify-start")}>
            <Avatar name={t.name} size="sm" />
            <span className="min-w-0 flex-1 truncate text-body">{t.name}</span>
            {i === 0 ? (
              <span className={cn(ctl, "shrink-0 pl-3 text-body text-ink-muted")}>Owner</span>
            ) : (
              <Select aria-label={`${t.name} role`} value={roles[i]} onValueChange={(v) => setRoles(roles.map((r, j) => (j === i ? v : r)))} align="end" options={roleOptions.slice(1)} className={cn(ctl, "shrink-0")} />
            )}
          </div>
        ))}
      </div>
      <form
        className={setRow}
        onSubmit={(e) => {
          e.preventDefault();
          toast(email ? `Invite sent to ${email}` : "Add an email first", email ? "success" : "neutral");
          setEmail("");
        }}
      >
        <Input aria-label="Email" placeholder="Email" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} wrapperClassName="min-w-0 flex-1" />
        <Button type="submit" className={cn(ctl, "shrink-0")}>
          Invite
        </Button>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------ B13 returns, none */

function ReturnsCard({ className }: { className?: string }) {
  return (
    <Card className={cn("flex min-w-0 flex-col", className)}>
      <CardHeader title="Returns" />
      <EmptyState icon={Inbox} title="No returns yet" className="flex-1 py-6" />
    </Card>
  );
}

/* ------------------------------------------------------------ B14 products, edit in place */

function ProductsCard({ className }: { className?: string }) {
  const [rows, setRows] = React.useState(PRODUCTS.slice(0, 8).map((p) => ({ ...p })));
  const [sel, setSel] = React.useState<string[]>([PRODUCTS[1].sku]);
  const all = sel.length === rows.length ? true : sel.length ? "indeterminate" : false;
  const table = (list: typeof rows) => (
    <Table>
      <THead>
        <tr>
          <TH width={36}>
            <Checkbox aria-label="Select all" checked={all} onCheckedChange={(v) => setSel(v === true ? rows.map((r) => r.sku) : [])} />
          </TH>
          <TH>Product</TH>
          <TH align="right">Price</TH>
          <TH align="right">Stock</TH>
        </tr>
      </THead>
      <TBody>
        {list.map((r) => {
          const i = rows.indexOf(r);
          return (
            <TRow key={r.sku} selected={sel.includes(r.sku)}>
              <TD>
                <Checkbox aria-label={`Select ${r.name}`} checked={sel.includes(r.sku)} onCheckedChange={(v) => setSel(v === true ? [...sel, r.sku] : sel.filter((s) => s !== r.sku))} />
              </TD>
              <TD maxWidth={240}>
                <span className="flex min-w-0 items-center gap-2.5">
                  <Thumb alt={r.name} size={24} />
                  <span className="truncate">{r.name}</span>
                </span>
              </TD>
              <TD align="right" className="w-36">
                <InlineEdit
                  align="right"
                  aria-label={`${r.name} price`}
                  inputMode="numeric"
                  value={String(r.price)}
                  display={(v) => formatRp(Number(v))}
                  validate={(v) => (/^\d+$/.test(v.replace(/\./g, "")) ? null : "Numbers only")}
                  onSave={(v) => {
                    setRows(rows.map((x, j) => (j === i ? { ...x, price: Number(v.replace(/\./g, "")) } : x)));
                    toast("Price saved");
                  }}
                />
              </TD>
              <TD align="right" className="w-24">
                <InlineEdit
                  align="right"
                  aria-label={`${r.name} stock`}
                  inputMode="numeric"
                  value={String(r.stock)}
                  validate={(v) => (/^\d+$/.test(v) ? null : "Numbers only")}
                  onSave={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, stock: Number(v) } : x)))}
                />
              </TD>
            </TRow>
          );
        })}
      </TBody>
    </Table>
  );
  return (
    <Card inset="nest" className={cn("min-w-0", className)}>
      <Tabs defaultValue="all">
        <div className="flex min-h-control flex-wrap items-center justify-between gap-gap px-2 pt-2">
          <h3 className="text-title font-semibold">Products</h3>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="low">Low stock</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="all" className="mt-nest">
          {table(rows)}
        </TabsContent>
        <TabsContent value="low" className="mt-nest">
          {table(rows.filter((r) => r.stock < 5))}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

/* ------------------------------------------------------------ B15 low stock */

function LowStockCard({ className }: { className?: string }) {
  const low = PRODUCTS.filter((p) => p.stock < 5).slice(0, 4);
  return (
    <Card inset="nest" className={cn("flex min-w-0 flex-col gap-nest", className)}>
      <CardHeader title="Low stock" action={<Badge>{low.length}</Badge>} className="px-2 pt-2" />
      <AttentionList>
        {low.map((p) => (
          <AttentionItem key={p.sku} media={<Thumb alt={p.name} />} title={p.name} meta={p.sku} value={p.stock === 0 ? "Out" : `${p.stock} left`} onClick={() => toast(`Restock ${p.name}`, "neutral")} />
        ))}
      </AttentionList>
    </Card>
  );
}

/* ------------------------------------------------------------ B16 the phone view */

function PhoneCard({ className }: { className?: string }) {
  const [at, setAt] = React.useState("Orders");
  return (
    <Card inset="none" className={cn("relative min-h-[420px] min-w-0 overflow-hidden [transform:translateZ(0)]", className)}>
      <div className="grid gap-nest p-[calc(var(--ad-nest)*2)] pb-28">
        <CardHeader title="To pack" action={<Badge>3</Badge>} className="px-2 pt-2" />
        {ORDERS.slice(0, 3).map((o) => (
          <div key={o.id} className="flex items-center gap-2.5 rounded-item bg-fill px-2.5 py-2">
            <Thumb alt={o.items} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body">{o.items}</p>
              <p className="text-small tabular-nums text-ink-muted">{o.id}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-[84px] flex justify-end">
        <ToastView>3 orders packed</ToastView>
      </div>
      <BottomNav className="absolute">
        {(
          [
            [Home, "Home"],
            [ShoppingBag, "Orders"],
            [Package, "Stock"],
            [SearchIcon, "Search"],
          ] as const
        ).map(([I, l]) => (
          <BottomNavItem key={l} icon={I} label={l} active={at === l} onClick={() => setAt(l)} />
        ))}
      </BottomNav>
    </Card>
  );
}

/* ------------------------------------------------------------ B17 sync */

function SyncCard({ className }: { className?: string }) {
  const [syncing, setSyncing] = React.useState(false);
  const rings: [Market | "tokopedia", string, number][] = [
    ["shopee", "Shopee", 100],
    ["tiktok", "TikTok", 72],
    ["tokopedia", "Tokopedia", 38],
  ];
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4", className)}>
      <CardHeader
        title="Stock sync"
        action={
          <Tooltip content="Last full sync 09:40">
            <Button
              variant="ghost"
              icon
              aria-label="Sync now"
              onClick={() => {
                setSyncing(true);
                toast("Syncing 7 shops", "neutral");
                window.setTimeout(() => setSyncing(false), 1200);
              }}
            >
              <RefreshCw className={cn(syncing && "animate-spin")} />
            </Button>
          </Tooltip>
        }
      />
      <Alert title="2 shops haven't synced since 09:40" />
      <div className="grid grid-cols-3 gap-2">
        {rings.map(([m, l, v]) => (
          <div key={m} className="grid justify-items-center gap-2 rounded-item bg-fill py-3">
            <ProgressRing value={v} size={48} aria-label={`${l} synced`} />
            <span className="flex items-center gap-1.5 text-body">
              <MarketMark market={m} size={14} />
              {l}
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-2 text-body">
        <div className="flex justify-between">
          <span>Adding up 1.240 sales</span>
          <span className="tabular-nums text-ink-muted">64%</span>
        </div>
        <Progress value={64} aria-label="Adding up sales" />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B18 photos and tags */

function PhotosCard({ className }: { className?: string }) {
  const [files, setFiles] = React.useState<DropFile[]>([
    { id: "a", name: "gelas-kopi-hijau.jpg", size: 1840000 },
    { id: "b", name: "gelas-kopi-set.jpg", size: 2310000, progress: 64 },
  ]);
  const [tags, setTags] = React.useState(["Keramik", "Handmade"]);
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4", className)}>
      <CardHeader title="Gelas kopi tanah liat" />
      <div className="grid gap-2">
        <Dropzone
          title="Drop product photos"
          accept="image/*"
          files={files}
          onRemove={(id) => setFiles(files.filter((f) => f.id !== id))}
          onFiles={(fs) => setFiles([...files, ...fs.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size }))])}
        />
        <TagInput aria-label="Tags" value={tags} onValueChange={setTags} suggestions={["Rotan", "Kayu jati", "Bambu", "Best seller", "Pre-order"]} />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B19 sales by shop */

function ByShopCard({ className }: { className?: string }) {
  const [range, setRange] = React.useState<DateRange>(DEFAULT_PRESETS[2].range(NOW));
  const [channels, setChannels] = React.useState<string[]>(["offline", "shopee", "tiktok"]);
  const [loading, kick] = useBusy();
  const rows: [Market, string, number, number[]][] = [
    ["offline", "Kemang", 12400000, SPARK],
    ["offline", "Senopati", 9800000, [9, 11, 10, 9, 12, 11, 10, 9, 11, 10, 12, 11]],
    ["shopee", "Rimba Official", 8900000, [6, 7, 9, 8, 10, 12, 11, 13, 12, 14, 15, 16]],
    ["offline", "Dago", 7100000, [14, 13, 12, 12, 11, 10, 11, 9, 9, 8, 8, 7]],
    ["tiktok", "Rimba Live", 4800000, [3, 4, 4, 6, 5, 7, 8, 7, 9, 10, 9, 11]],
  ];
  return (
    <Card inset="nest" className={cn("flex min-w-0 flex-col gap-nest", className)}>
      <div className="flex min-h-control flex-wrap items-center justify-between gap-gap px-2 pt-2">
        <h3 className="text-title font-semibold">By shop</h3>
        <DateRangePicker value={range} onValueChange={(r) => (setRange(r), kick())} today={NOW} />
      </div>
      <ToggleGroup
        aria-label="Channels"
        value={channels}
        onValueChange={(v) => (setChannels(v), kick())}
        className="mx-2 w-fit"
        options={[
          { value: "offline", label: <><MarketMark market="offline" />Shops</> },
          { value: "shopee", label: <><MarketMark market="shopee" />Shopee</> },
          { value: "tiktok", label: <><MarketMark market="tiktok" />TikTok</> },
        ]}
      />
      <div className="grid gap-px">
        {rows
          .filter(([m]) => channels.includes(m))
          .map(([m, s, v, d]) => (
            <div key={s} className="flex min-h-row items-center gap-3 rounded-item px-2">
              <MarketMark market={m} />
              <span className="min-w-0 flex-1 truncate text-body">{s}</span>
              <Loading loading={loading}>
                <Sparkline data={d} width={72} height={22} aria-label={`${s}, last 12 weeks`} />
              </Loading>
              <span className="w-30 shrink-0 whitespace-nowrap text-right text-body font-medium tabular-nums">
                <LoadingText loading={loading}>{formatRp(v)}</LoadingText>
              </span>
            </div>
          ))}
        {channels.length === 0 ? <EmptyState icon={Box} title="No channel picked" className="py-6" /> : null}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ the composition */

/**
 * Bands of a 12-column grid. Cards in a band share its height; a stack is a column of cards
 * whose last card takes the rest. Tablet: two columns. Phone: one column, in reading order.
 */
const band = "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12";
const stack = "grid min-w-0 grid-cols-1 gap-4 content-stretch [&>*:last-child]:h-full";

export function Bento() {
  return (
    <section aria-label="Components in use" className="mx-auto grid w-full max-w-[1280px] gap-4 px-4 sm:px-6">
      <div className={band} data-bento="1">
        <OrdersCard className="md:col-span-2 lg:col-span-8" />
        <div data-stack className={cn(stack, "md:col-span-2 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-[auto_1fr]")}>
          <SalesCard />
          <PaletteCard />
        </div>
      </div>
      <div className={band} data-bento="2">
        <ShellCard className="lg:col-span-3" />
        <BoardCard className="lg:col-span-5" />
        <FeesCard className="md:col-span-2 lg:col-span-4" />
      </div>
      <div className={band} data-bento="3">
        <CalendarCard className="md:col-span-2 lg:col-span-8" />
        <div data-stack className={cn(stack, "md:col-span-2 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-[auto_1fr]")}>
          <NotesCard />
          <ShipmentCard />
        </div>
      </div>
      <div className={band} data-bento="4">
        <SettingsCard className="lg:col-span-4" />
        <PromotionCard className="lg:col-span-4" />
        <div data-stack className={cn(stack, "md:col-span-2 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-[auto_1fr]")}>
          <TeamCard />
          <ReturnsCard />
        </div>
      </div>
      <div className={band} data-bento="5">
        <ProductsCard className="md:col-span-2 lg:col-span-6" />
        <LowStockCard className="lg:col-span-3" />
        <PhoneCard className="lg:col-span-3" />
      </div>
      <div className={band} data-bento="6">
        <SyncCard className="lg:col-span-4" />
        <PhotosCard className="lg:col-span-4" />
        <ByShopCard className="md:col-span-2 lg:col-span-4" />
      </div>
    </section>
  );
}
