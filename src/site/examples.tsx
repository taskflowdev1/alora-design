import * as React from "react";
import { useBlocker, useNavigate, useParams, useSearchParams } from "react-router";
import {
  Bell,
  ChevronDown,
  Download,
  Home,
  LogOut,
  MoreHorizontal,
  Package,
  Plus,
  Search as SearchIcon,
  Settings as SettingsIcon,
  ShoppingBag,
  Tag,
  User,
  UserPlus,
  Users,
  XCircle,
} from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { serializeConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, MetricCard } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { BarChart, BarList } from "@/components/ui/bar-chart";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { Thumb } from "@/components/ui/thumb";
import { Badge } from "@/components/ui/badge";
import { Chip, ChipGroup, Pill, Status } from "@/components/ui/status";
import { Table, TableBar, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { Search } from "@/components/ui/search";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { Sheet } from "@/components/ui/sheet";
import { PageHeader, Toolbar } from "@/components/ui/toolbar";
import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LanguagePicker } from "@/components/ui/language-picker";
import { SaveBar } from "@/components/ui/save-bar";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { Loading, LoadingText, Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BottomNav, BottomNavItem, Fab } from "@/components/ui/bottom-nav";
import { Alert } from "@/components/ui/alert";
import { ColumnMenu } from "@/components/ui/column-menu";
import { ShopPicker } from "@/components/ui/shop-picker";
import { NotificationBell, type Notice } from "@/components/ui/notification-bell";
import { InlineEdit, grouped } from "@/components/ui/inline-edit";
import { Sparkline } from "@/components/ui/sparkline";
import { CurrencyInput } from "@/components/ui/currency-input";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { TagInput } from "@/components/ui/tag-input";
import { Dropzone, type DropFile } from "@/components/ui/dropzone";
import { ProgressRing } from "@/components/ui/progress-ring";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { DateRangePicker, formatRange, type DateRange } from "@/components/ui/date-range-picker";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Diff } from "@/components/ui/diff";
import { FeeRow, FeeTotal } from "@/components/ui/fee-row";
import { CommentThread, type Comment } from "@/components/ui/comment-thread";
import { CopyChip } from "@/components/ui/copy-chip";
import { Timeline } from "@/components/ui/timeline";
import { CalendarMonth } from "@/components/ui/calendar-month";
import { SplitButton } from "@/components/ui/split-button";
import { SLink, useConfig } from "./config";
import { useEdgeFade } from "./layout";
import { OrderDetail } from "./demos";
import {
  CANCEL_REASONS,
  CANCELLATIONS,
  DAILY,
  HOURLY,
  MARKET_SHOPS,
  NOW,
  ORDERS,
  PRODUCTS,
  PROMOTIONS,
  SHOPS,
  TEAM,
  TEAM_ACTIVITY,
  TEAM_DETAIL,
  smartTime,
  type Cancellation,
  type OrderStatus,
  type Promotion,
} from "./data";

type Page = "dashboard" | "orders" | "products" | "promotions" | "cancellations" | "team" | "settings";
const PAGES: Page[] = ["dashboard", "orders", "products", "promotions", "cancellations", "team", "settings"];

const NAV: { key: Page; label: string; icon: typeof Home; count?: number }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "orders", label: "Orders", icon: ShoppingBag, count: 23 },
  { key: "products", label: "Products", icon: Package },
  { key: "promotions", label: "Promotions", icon: Tag },
  { key: "cancellations", label: "Cancellations", icon: XCircle, count: 4 },
];

function useLoading() {
  const [params] = useSearchParams();
  return params.get("loading") === "1";
}

const NOTICES: Notice[] = [
  { id: "1", title: "2 shops haven’t synced since 09:40", time: "Today, 10:10", unread: true },
  { id: "2", title: "Payout of Rp 12.840.000 sent", time: "Today, 08:02", unread: true },
  { id: "3", title: "Keranjang pandan besar is out of stock", time: "Yesterday, 19:45" },
];

/**
 * A sidebar link. SidebarItem asChild clones its child around the row and also prints its children as the label; the
 * label copy renders inside the outer link (InLink), so it comes out as plain text: one link, one Tab stop per item.
 */
const InLink = React.createContext(false);
function NavLink({ to, children, ...props }: { to: string; children: React.ReactNode } & Omit<React.ComponentProps<typeof SLink>, "to">) {
  if (React.useContext(InLink)) return <>{children}</>;
  return (
    <InLink.Provider value={true}>
      <SLink to={to} {...props}>
        {children}
      </SLink>
    </InLink.Provider>
  );
}

function AppSidebar({ page }: { page: Page }) {
  const [shop, setShop] = React.useState("All shops");
  const [notices, setNotices] = React.useState(NOTICES);
  return (
    <Sidebar className="h-full max-lg:hidden">
      <Menu
        tone="dark"
        trigger={
          <button type="button" className="mb-3 flex h-control w-full cursor-pointer items-center gap-2.5 rounded-item bg-side-fill px-2.5 text-left text-body text-side-ink transition-[background-color,transform] duration-[160ms] hover:bg-side-fill-strong focus-visible:bg-side-fill-strong active:scale-[0.98]">
            <span className="min-w-0 flex-1 truncate font-medium">Rimba · {shop}</span>
            <ChevronDown size={16} className="shrink-0 text-side-muted" />
          </button>
        }
      >
        {["All shops", ...SHOPS].map((s) => (
          <MenuItem key={s} onSelect={() => setShop(s)}>
            {s}
          </MenuItem>
        ))}
      </Menu>
      <SidebarSection>
        {NAV.map((n) => (
          <SidebarItem key={n.key} icon={n.icon} active={page === n.key} count={n.count} asChild>
            <NavLink to={`/examples/${n.key}`}>{n.label}</NavLink>
          </SidebarItem>
        ))}
      </SidebarSection>
      <SidebarSection label="Shop">
        <SidebarItem icon={Users} active={page === "team"} asChild>
          <NavLink to="/examples/team">Team</NavLink>
        </SidebarItem>
        <SidebarItem icon={SettingsIcon} active={page === "settings"} asChild>
          <NavLink to="/examples/settings">Settings</NavLink>
        </SidebarItem>
      </SidebarSection>
      <div className="mt-auto flex items-center justify-between pl-1">
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
        <div className="ad-on-dark">
          <NotificationBell notices={notices} onMarkAllRead={() => setNotices(notices.map((n) => ({ ...n, unread: false })))} className="text-side-muted hover:text-side-ink" />
        </div>
      </div>
    </Sidebar>
  );
}

function PhoneNavBar({ page }: { page: Page }) {
  const navigate = useNavigate();
  const [config] = useConfig();
  const q = serializeConfig(config);
  const go = (p: Page) => navigate(`/examples/${p}${q ? `?${q}` : ""}`);
  const more: Page[] = ["promotions", "cancellations", "team", "settings"];
  return (
    <div className="lg:hidden">
      <BottomNav>
        <SLink to="/examples/dashboard" className="flex flex-1">
          <BottomNavItem icon={Home} label="Home" active={page === "dashboard"} />
        </SLink>
        <SLink to="/examples/orders" className="flex flex-1">
          <BottomNavItem icon={ShoppingBag} label="Orders" active={page === "orders"} />
        </SLink>
        <SLink to="/examples/products" className="flex flex-1">
          <BottomNavItem icon={Package} label="Products" active={page === "products"} />
        </SLink>
        <Menu side="top" align="end" trigger={<span className="flex flex-1"><BottomNavItem icon={MoreHorizontal} label="More" active={more.includes(page)} /></span>}>
          <MenuItem icon={Tag} onSelect={() => go("promotions")}>Promotions</MenuItem>
          <MenuItem icon={XCircle} onSelect={() => go("cancellations")}>Cancellations</MenuItem>
          <MenuItem icon={Users} onSelect={() => go("team")}>Team</MenuItem>
          <MenuItem icon={SettingsIcon} onSelect={() => go("settings")}>Settings</MenuItem>
        </Menu>
      </BottomNav>
      {page === "orders" ? <Fab icon={Plus} label="Add order" onClick={() => toast("New order")} /> : null}
    </div>
  );
}

export function Examples() {
  const { page = "dashboard" } = useParams();
  const p = (PAGES.includes(page as Page) ? page : "dashboard") as Page;
  const app = React.useRef<HTMLDivElement>(null);
  useEdgeFade(app);
  React.useLayoutEffect(() => {
    if (app.current) app.current.scrollTop = 0;
  }, [p]);
  return (
    <div className="mx-auto flex h-[calc(100dvh-64px)] w-full max-w-[1280px] gap-3 px-4 pb-4 sm:px-6 max-lg:h-auto max-lg:min-h-[calc(100dvh-108px)]">
      <AppSidebar page={p} />
      <div ref={app} data-app className="ad-fade-y min-w-0 flex-1 overflow-auto rounded-card max-lg:pb-24">
        <div key={p} className="animate-[ad-fade-in_220ms_var(--ad-ease)] px-1 py-1 sm:px-4 sm:py-2">
          {p === "dashboard" ? (
            <Dashboard />
          ) : p === "orders" ? (
            <Orders />
          ) : p === "products" ? (
            <Products />
          ) : p === "promotions" ? (
            <Promotions />
          ) : p === "cancellations" ? (
            <Cancellations />
          ) : p === "team" ? (
            <Team />
          ) : (
            <Settings />
          )}
        </div>
      </div>
      <PhoneNavBar page={p} />
    </div>
  );
}

/* ------------------------------------------------------------ dashboard */

/** Sales today per shop, in Rp jt: the four shops only (marketplaces have their own picker), largest first. */
const BY_SHOP: [string, number][] = [
  ["Kemang", 12.4],
  ["Senopati", 9.8],
  ["Dago", 7.1],
  ["Darmo", 5.2],
];

function Dashboard() {
  const loading = useLoading();
  const [range, setRange] = React.useState("day");
  const [shops, setShops] = React.useState(MARKET_SHOPS.map((s) => s.id));
  const [shop, setShop] = React.useState<string | null>(null);
  const low = PRODUCTS.filter((p) => p.stock < 5);
  const unpaid = ORDERS.filter((o) => o.status === "Unpaid").slice(0, 4);
  // Attention rows sit on a fill, so their skeleton bars take the next step up to show.
  const L = ({ children }: { children: React.ReactNode }) => (
    <LoadingText loading={loading} onFill>
      {children}
    </LoadingText>
  );
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Dashboard">
        <ShopPicker shops={MARKET_SHOPS} value={shops} onValueChange={setShops} />
        <Segmented
          aria-label="Range"
          value={range}
          onValueChange={setRange}
          options={[
            { value: "day", label: "Today" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
        <Button>
          <Download />
          Export
        </Button>
      </PageHeader>
      <Alert tone="neutral" title="2 shops haven’t synced since 09:40" action={<Button size="sm" onClick={() => toast("Syncing 2 shops", "neutral")}>Sync</Button>} />
      <div className="flex flex-wrap gap-4">
        <MetricCard primary loading={loading} label="Sales today" unit="Rp" value={48240000} delta={{ value: "9,7%", direction: "up" }} />
        <MetricCard loading={loading} label="Orders" value={312} />
        <MetricCard loading={loading} label="Basket" unit="Rp" value={154600} />
        <MetricCard loading={loading} label="To ship" value={18} />
        <MetricCard loading={loading} label="Cancelled" value={4} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={range === "day" ? "Sales by hour" : "Sales, last 30 days"} />
          {range === "day" ? (
            <BarChart data={HOURLY} current={6} labelEvery={1} height={150} loading={loading} className="mt-4" aria-label="Sales by hour" />
          ) : (
            <BarChart data={DAILY} current={29} labelEvery={5} height={150} loading={loading} className="mt-4" aria-label="Sales, last 30 days" />
          )}
        </Card>
        <Card inset="nest">
          <CardHeader title="By shop" className="px-2 pt-2" action={shop ? <Button variant="ghost" size="sm" onClick={() => setShop(null)}>All shops</Button> : undefined} />
          <BarList
            loading={loading}
            selected={shop}
            onSelect={setShop}
            data={BY_SHOP.map(([s, v]) => ({ key: s, label: s, value: v, display: `Rp ${v.toLocaleString("id-ID")} jt` }))}
          />
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card inset="nest">
          <CardHeader title="Low stock" action={<Badge>{low.length}</Badge>} className="px-2 pt-2" />
          <AttentionList className="mt-1">
            {low.map((p) => (
              <AttentionItem
                key={p.sku}
                media={loading ? <Skeleton onFill className="size-[32px] rounded-small" /> : <Thumb alt={p.name} />}
                title={<L>{p.name}</L>}
                meta={<L>{p.sku}</L>}
                value={<L>{p.stock === 0 ? "Out" : `${p.stock} left`}</L>}
                onClick={() => toast(`Restock ${p.name}`, "neutral")}
              />
            ))}
          </AttentionList>
        </Card>
        <Card inset="nest">
          <CardHeader title="Unpaid over 24 hours" action={<Badge>{unpaid.length}</Badge>} className="px-2 pt-2" />
          <AttentionList className="mt-1">
            {unpaid.map((o) => (
              <AttentionItem
                key={o.id}
                media={loading ? <Skeleton onFill className="size-8 rounded-full" /> : <Avatar name={o.customer} size="md" className="bg-surface" />}
                title={<L>{o.customer}</L>}
                meta={<L>{`${o.id} · ${o.shop}`}</L>}
                value={<L>{formatRp(o.total)}</L>}
                onClick={() => toast("Reminder sent", "neutral")}
              />
            ))}
          </AttentionList>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ orders */

const STATUSES: OrderStatus[] = ["Unpaid", "Paid", "Packed", "Shipped", "Cancelled"];
const ORDER_COLS = [
  { key: "order", label: "Order", locked: true },
  { key: "time", label: "Time" },
  { key: "shop", label: "Shop" },
  { key: "customer", label: "Customer" },
  { key: "items", label: "Items" },
  { key: "payment", label: "Payment" },
  { key: "status", label: "Status", locked: true },
  { key: "total", label: "Total", locked: true },
  { key: "fee", label: "Fee" },
];

function Orders() {
  const forcedLoading = useLoading();
  const [q, setQ] = React.useState("");
  const [shop, setShop] = React.useState("all");
  const [status, setStatus] = React.useState<string[]>([]);
  const [week, setWeek] = React.useState(NOW);
  const [page, setPage] = React.useState(1);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [cols, setCols] = React.useState(["time", "shop", "customer", "items", "payment", "fee"]);
  const [busy, setBusy] = React.useState(false);
  const loading = forcedLoading || busy;
  const first = React.useRef(true);
  const show = (k: string) => cols.includes(k);

  const rows = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    return ORDERS.filter(
      (o) =>
        (shop === "all" || o.shop === shop) &&
        (!status.length || status.includes(o.status)) &&
        (!t || o.id.toLowerCase().includes(t) || o.items.toLowerCase().includes(t) || o.customer.toLowerCase().includes(t)),
    );
  }, [q, shop, status]);
  const pageRows = rows.slice((page - 1) * 50, page * 50);

  // A filter or page change shows the skeleton, the same shape as the rows that arrive.
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setBusy(true);
    const id = window.setTimeout(() => setBusy(false), 350);
    return () => window.clearTimeout(id);
  }, [page, shop, week, status]);

  React.useEffect(() => setPage(1), [q, shop, status]);

  const open = ORDERS.find((o) => o.id === openId);
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;

  return (
    <div className="flex h-[calc(100dvh-64px-16px-16px)] min-h-[520px] flex-col gap-4 max-lg:h-auto">
      <PageHeader title="Orders" />
      <Toolbar>
        <Search value={q} onValueChange={setQ} placeholder="Search orders" wrapperClassName="max-sm:w-full" />
        <Select prefix="Shop" aria-label="Shop" value={shop} onValueChange={setShop} options={[{ value: "all", label: "All" }, ...SHOPS.map((s) => ({ value: s, label: s }))]} />
        <MultiSelect aria-label="Status" placeholder="Status" value={status} onValueChange={setStatus} options={STATUSES.map((s) => ({ value: s, label: s }))} />
        <PeriodStepper value={week} period="week" onValueChange={setWeek} max={NOW} />
        {/* Columns, Export and Add stay together at the right end, also when the row wraps (1024). */}
        <div className="ml-auto flex items-center gap-gap">
          <ColumnMenu columns={ORDER_COLS} visible={cols} onVisibleChange={setCols} defaults={["time", "shop", "customer", "items", "payment", "fee"]} />
          <Button>
            <Download />
            Export
          </Button>
          <Button variant="primary" className="max-lg:hidden" onClick={() => toast("New order")}>
            <Plus />
            Add order
          </Button>
        </div>
      </Toolbar>
      <Card inset="nest" className="flex min-h-0 flex-1 flex-col max-lg:min-h-[480px]" data-orders>
        {rows.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No orders match" className="flex-1" />
        ) : (
          <>
            <Table className="min-h-0 flex-1">
              <THead>
                <tr>
                  <TH>Order</TH>
                  {show("time") ? <TH>Time</TH> : null}
                  {show("shop") ? <TH>Shop</TH> : null}
                  {show("customer") ? <TH>Customer</TH> : null}
                  {show("items") ? <TH>Items</TH> : null}
                  {/* Below xl the payment method gives way, so Status and Total stay in view. */}
                  {show("payment") ? <TH className="max-xl:hidden">Payment</TH> : null}
                  <TH>Status</TH>
                  <TH align="right">Total</TH>
                  {show("fee") ? <TH align="right">Fee</TH> : null}
                </tr>
              </THead>
              <TBody>
                {pageRows.map((o) => (
                  <TRow key={o.id} selected={o.id === openId} onActivate={() => setOpenId(o.id)}>
                    <TD>
                      <L>{o.id}</L>
                    </TD>
                    {show("time") ? (
                      <TD className="text-ink-muted">
                        <L>{smartTime(o.at)}</L>
                      </TD>
                    ) : null}
                    {show("shop") ? (
                      <TD>
                        <L>{o.shop}</L>
                      </TD>
                    ) : null}
                    {show("customer") ? (
                      <TD>
                        <L>{o.customer}</L>
                      </TD>
                    ) : null}
                    {show("items") ? (
                      <TD maxWidth={220}>
                        <L>{o.items}</L>
                      </TD>
                    ) : null}
                    {show("payment") ? (
                      <TD className="max-xl:hidden">
                        <L>{o.payment}</L>
                      </TD>
                    ) : null}
                    <TD>
                      {loading ? (
                        <L>{o.status}</L>
                      ) : (
                        <Status tone={o.status === "Unpaid" ? "attention" : o.status === "Cancelled" ? "muted" : "default"}>{o.status}</Status>
                      )}
                    </TD>
                    <TD align="right">
                      <L>{formatRp(o.total)}</L>
                    </TD>
                    {show("fee") ? (
                      <TD align="right" className="text-ink-muted">
                        <L>{formatRp(o.fee)}</L>
                      </TD>
                    ) : null}
                  </TRow>
                ))}
              </TBody>
            </Table>
            <TableBar page={page} total={rows.length} onPageChange={setPage} className="mt-1 shrink-0" />
          </>
        )}
      </Card>
      <Sheet
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        modal={false}
        keepOpenOn="[data-orders]"
        title={open?.id}
        footer={
          <>
            <Button variant="ghost" onClick={() => toast("Invoice sent", "neutral")}>
              Send invoice
            </Button>
            <Button variant="primary" onClick={() => toast(`${open?.id} marked as packed`)}>
              Mark as packed
            </Button>
          </>
        }
      >
        {open ? <OrderDetail id={open.id} /> : null}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------ products */

type ProductRow = (typeof PRODUCTS)[number] & { sold: number[] };

const PRODUCT_ROWS: ProductRow[] = PRODUCTS.map((p, i) => ({
  ...p,
  sold: Array.from({ length: 12 }, (_, w) => Math.max(1, Math.round(8 + 6 * Math.sin((w + i) / 2) + ((i * 7 + w * 3) % 5)))),
}));

/** An inline-edit cell while loading: the same row height and right edge, the value's text as a pulsing bar. */
function SkeletonValue({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-item items-center justify-end tabular-nums">
      <LoadingText loading>{children}</LoadingText>
    </span>
  );
}

function stockStatus(n: number) {
  if (n === 0) return <Pill>Out of stock</Pill>;
  if (n < 5) return <Status tone="attention">Low</Status>;
  return <Status>In stock</Status>;
}

function Products() {
  const loading = useLoading();
  const [rows, setRows] = React.useState(PRODUCT_ROWS);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState({ name: "", price: null as number | null, stock: 10, tags: ["Handmade"] as string[] });
  const [files, setFiles] = React.useState<DropFile[]>([]);
  const list = rows.filter(
    (p) =>
      (filter === "all" || (filter === "low" && p.stock > 0 && p.stock < 5) || (filter === "out" && p.stock === 0)) &&
      (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())),
  );
  const set = (sku: string, patch: Partial<ProductRow>) => setRows(rows.map((r) => (r.sku === sku ? { ...r, ...patch } : r)));
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;
  return (
    <div className="grid grid-cols-1 gap-4">
      <PageHeader title="Products" />
      <Toolbar>
        <Search value={q} onValueChange={setQ} placeholder="Name or SKU" wrapperClassName="max-sm:w-full" />
        <ChipGroup aria-label="Stock" className="flex-nowrap">
          {[
            ["all", "All"],
            ["low", "Low stock"],
            ["out", "Out of stock"],
          ].map(([k, l]) => (
            <Chip key={k} selected={filter === k} onClick={() => setFilter(k)}>
              {l}
            </Chip>
          ))}
        </ChipGroup>
        <div className="ml-auto flex items-center gap-gap">
          <Button>
            <Download />
            Export
          </Button>
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus />
            Add product
          </Button>
        </div>
      </Toolbar>
      <Card inset="nest">
        {list.length === 0 ? (
          <EmptyState icon={Package} title="No products match" className="py-16" />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH>SKU</TH>
                <TH align="right">Price</TH>
                <TH align="right">Stock</TH>
                <TH>Status</TH>
                <TH>Last 12 weeks</TH>
              </tr>
            </THead>
            <TBody>
              {list.map((p) => (
                <TRow key={p.sku}>
                  <TD>
                    <span className="flex items-center gap-3">
                      <Loading loading={loading}>
                        <Thumb alt={p.name} size={28} />
                      </Loading>
                      <span className="max-w-[240px] truncate">
                        <L>{p.name}</L>
                      </span>
                    </span>
                  </TD>
                  <TD className="text-ink-muted">
                    <L>{p.sku}</L>
                  </TD>
                  <TD align="right" className="w-40">
                    {loading ? (
                      <SkeletonValue>
                        Rp<span className="ml-1.5">{p.price.toLocaleString("id-ID")}</span>
                      </SkeletonValue>
                    ) : (
                      <InlineEdit
                        align="right"
                        aria-label={`${p.name} price`}
                        inputMode="numeric"
                        value={String(p.price)}
                        prefix="Rp"
                        {...grouped}
                        validate={(v) => (/^\d+$/.test(v) ? null : "Numbers only")}
                        onSave={(v) => set(p.sku, { price: Number(v) })}
                      />
                    )}
                  </TD>
                  <TD align="right" className="w-28">
                    {loading ? (
                      <SkeletonValue>{p.stock}</SkeletonValue>
                    ) : (
                      <InlineEdit
                        align="right"
                        aria-label={`${p.name} stock`}
                        inputMode="numeric"
                        value={String(p.stock)}
                        validate={(v) => (/^\d+$/.test(v) ? null : "Numbers only")}
                        onSave={(v) => set(p.sku, { stock: Number(v) })}
                      />
                    )}
                  </TD>
                  <TD>
                    <Loading loading={loading}>{stockStatus(p.stock)}</Loading>
                  </TD>
                  <TD>
                    <Loading loading={loading}>
                      <Sparkline data={p.sold} aria-label={`${p.name}, sold per week`} width={88} height={22} />
                    </Loading>
                  </TD>
                </TRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      <Sheet
        open={adding}
        onOpenChange={setAdding}
        title="New product"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAdding(false);
                toast(`${draft.name || "Product"} added`);
              }}
            >
              Add product
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <Field label="Name">
            <Input aria-label="Name" value={draft.name} placeholder="Gelas kopi tanah liat" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Price">
              <CurrencyInput aria-label="Price" value={draft.price} onValueChange={(price) => setDraft({ ...draft, price })} className="w-44" />
            </Field>
            <Field label="Stock">
              <QuantityStepper aria-label="Stock" value={draft.stock} onValueChange={(stock) => setDraft({ ...draft, stock })} max={999} />
            </Field>
          </div>
          <Field label="Tags">
            <TagInput value={draft.tags} onValueChange={(tags) => setDraft({ ...draft, tags })} suggestions={["Keramik", "Kayu jati", "Bambu", "Rotan", "Best seller"]} />
          </Field>
          <Field label="Photos">
            <Dropzone
              title="Drop product photos"
              accept="image/*"
              files={files}
              onRemove={(id) => setFiles(files.filter((f) => f.id !== id))}
              onFiles={(fs) => setFiles([...files, ...fs.map((f, i) => ({ id: `${f.name}-${i}`, name: f.name, size: f.size }))])}
            />
          </Field>
        </div>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------ promotions */

function PromotionCard({ p }: { p: Promotion }) {
  const pct = p.budget ? Math.round((p.used / p.budget) * 100) : 0;
  return (
    <Card interactive className="flex items-center gap-4" onClick={() => toast(p.name, "neutral")}>
      <ProgressRing value={pct} size={52} aria-label={`${p.name}, budget used`} />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-title font-semibold">{p.name}</span>
          {p.status === "Live" ? <Pill>Live</Pill> : null}
        </div>
        <span className="truncate text-body text-ink-muted">
          {p.discount} · {formatRange({ from: p.from, to: p.to })}
        </span>
      </div>
      <div className="grid shrink-0 justify-items-end gap-1.5">
        <span className="flex -space-x-1">
          {p.markets.map((m) => (
            <MarketMark key={m} market={m} className="shadow-[0_0_0_2px_var(--ad-surface)]" />
          ))}
        </span>
        <span className="text-small tabular-nums text-ink-muted">
          {formatRp(p.used)} of {formatRp(p.budget)}
        </span>
      </div>
    </Card>
  );
}

function Promotions() {
  const [view, setView] = React.useState("list");
  const [month, setMonth] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  const [creating, setCreating] = React.useState(false);
  const [range, setRange] = React.useState<DateRange>({ from: NOW, to: new Date(2026, 10, 22) });
  const [discount, setDiscount] = React.useState(15);
  const [budget, setBudget] = React.useState<number | null>(5000000);
  const [channels, setChannels] = React.useState(["shopee", "tiktok"]);
  const groups: [string, Promotion[]][] = [
    ["Live", PROMOTIONS.filter((p) => p.status === "Live")],
    ["Scheduled", PROMOTIONS.filter((p) => p.status === "Scheduled")],
    ["Ended", PROMOTIONS.filter((p) => p.status === "Ended")],
  ];
  const events = PROMOTIONS.flatMap((p) => {
    const out = [];
    for (let d = new Date(p.from); d <= p.to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))
      out.push({ id: `${p.id}-${d.getDate()}-${d.getMonth()}`, date: d, title: p.name, tone: p.status === "Live" ? ("accent" as const) : ("neutral" as const) });
    return out;
  });
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Promotions">
        <Segmented
          aria-label="View"
          value={view}
          onValueChange={setView}
          options={[
            { value: "list", label: "List" },
            { value: "calendar", label: "Calendar" },
          ]}
        />
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus />
          New promotion
        </Button>
      </PageHeader>
      {view === "calendar" ? (
        <Card>
          <CalendarMonth month={month} onMonthChange={setMonth} events={events} today={NOW} onEventClick={(e) => toast(e.title, "neutral")} />
        </Card>
      ) : (
        groups.map(([title, list]) => (
          <section key={title} className="grid gap-2">
            <h2 className="px-1 text-title font-semibold">{title}</h2>
            <div className="grid gap-3 xl:grid-cols-2">
              {list.map((p) => (
                <PromotionCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        ))
      )}
      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="New promotion"
        className="w-[min(480px,calc(100vw-32px))]"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" onClick={() => toast("Promotion scheduled")}>
                Schedule
              </Button>
            </DialogClose>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Name">
            <Input aria-label="Promotion name" placeholder="Rotan week" />
          </Field>
          <Field label="Dates">
            <DateRangePicker value={range} onValueChange={setRange} today={NOW} />
          </Field>
          <Slider label="Discount" value={discount} min={5} max={50} onValueChange={setDiscount} display={`${discount}%`} />
          <Field label="Budget">
            <CurrencyInput aria-label="Budget" value={budget} onValueChange={setBudget} className="w-48" />
          </Field>
          <Field label="Where">
            <ToggleGroup
              aria-label="Channels"
              value={channels}
              onValueChange={setChannels}
              options={[
                { value: "offline", label: <><MarketMark market="offline" />Shops</> },
                { value: "shopee", label: <><MarketMark market="shopee" />Shopee</> },
                { value: "tiktok", label: <><MarketMark market="tiktok" />TikTok</> },
              ]}
            />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------ cancellations */

const CANCEL_COMMENTS: Comment[] = [
  { id: "1", author: "Dewi Anggraini", time: "Today, 10:20", body: "Shopee kept the admin fee on this one. Opened a dispute.", reactions: [{ emoji: "👀", by: ["Rizky Hartono"] }] },
];

function CancellationDetail({ c }: { c: Cancellation }) {
  const [comments, setComments] = React.useState(CANCEL_COMMENTS);
  const fee = c.market === "offline" ? 0 : Math.round(c.refund * 0.045);
  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-body">
        {(
          [
            ["Order", <CopyChip key="c" value={c.id} />],
            ["Cancelled", smartTime(c.at)],
            ["Shop", <span key="s" className="inline-flex items-center gap-2"><MarketMark market={c.market} />{c.shop}</span>],
            ["Customer", c.customer],
            ["Reason", c.reason],
          ] as [string, React.ReactNode][]
        ).map(([k, v]) => (
          <div key={k} className="flex min-h-6 items-center justify-between gap-4">
            <span className="text-ink-muted">{k}</span>
            <span className="truncate">{v}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-1.5">
        <h3 className="text-body font-semibold">Refund</h3>
        <div className="-mx-2.5 grid gap-px">
          <FeeRow payer="buyer" label={`Refund, ${c.items}`} amount={-c.refund} />
          {c.market !== "offline" ? <FeeRow payer="platform" market={c.market} label="Admin fee returned" amount={fee + c.feeDiff} /> : null}
          <FeeTotal label="Net" amount={-c.refund + (c.market !== "offline" ? fee + c.feeDiff : 0)} className="mt-1" />
        </div>
        {c.feeDiff ? (
          <div className="flex items-center justify-between px-0 pt-1 text-body">
            <span className="text-ink-muted">Fee not returned</span>
            <Diff value={c.feeDiff} unit="Rp" />
          </div>
        ) : null}
      </div>
      <div className="grid gap-2">
        <h3 className="text-body font-semibold">Notes</h3>
        <CommentThread
          me="Rizky Hartono"
          comments={comments}
          onReact={(id, emoji) =>
            setComments(
              comments.map((x) => {
                if (x.id !== id) return x;
                const rs = x.reactions ?? [];
                const has = rs.find((r) => r.emoji === emoji);
                return {
                  ...x,
                  reactions: has
                    ? rs.map((r) => (r.emoji === emoji ? { ...r, by: r.by.includes("Rizky Hartono") ? r.by.filter((b) => b !== "Rizky Hartono") : [...r.by, "Rizky Hartono"] } : r))
                    : [...rs, { emoji, by: ["Rizky Hartono"] }],
                };
              }),
            )
          }
          onReply={(text) => setComments([...comments, { id: String(comments.length + 1), author: "Rizky Hartono", time: "Today, 14:20", body: text }])}
        />
      </div>
    </div>
  );
}

function Cancellations() {
  const loading = useLoading();
  const [reason, setReason] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>({ from: new Date(2026, 10, 10), to: NOW });
  const [openId, setOpenId] = React.useState<string | null>(null);
  const rows = CANCELLATIONS.filter((c) => !reason || c.reason === reason);
  const counts = CANCEL_REASONS.map((r) => CANCELLATIONS.filter((c) => c.reason === r).length);
  const open = CANCELLATIONS.find((c) => c.id === openId);
  const lost = CANCELLATIONS.reduce((a, c) => a + c.feeDiff, 0);
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Cancellations">
        <DateRangePicker value={range} onValueChange={setRange} today={NOW} />
        <Button>
          <Download />
          Export
        </Button>
      </PageHeader>
      <div className="flex flex-wrap gap-4">
        <MetricCard loading={loading} label="Today" value={4} />
        <MetricCard loading={loading} label="This week" value={CANCELLATIONS.length} />
        <MetricCard loading={loading} label="Refunded" unit="Rp" value={CANCELLATIONS.reduce((a, c) => a + c.refund, 0)} />
        <MetricCard loading={loading} label="Disputed" value={CANCELLATIONS.filter((c) => c.status === "Disputed").length} />
        <MetricCard loading={loading} label="Fees not returned" unit="Rp" value={Math.abs(lost)} />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card inset="nest" data-cancels>
          <Table>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Time</TH>
                <TH>Shop</TH>
                <TH>Reason</TH>
                <TH align="right">Refund</TH>
                <TH align="right">Fee difference</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((c) => (
                <TRow key={c.id} selected={c.id === openId} onActivate={() => setOpenId(c.id)}>
                  <TD>{c.id}</TD>
                  <TD className="text-ink-muted">{smartTime(c.at)}</TD>
                  <TD>
                    <span className="inline-flex items-center gap-2">
                      <MarketMark market={c.market} />
                      {c.shop}
                    </span>
                  </TD>
                  <TD>{c.reason}</TD>
                  <TD align="right">{formatRp(c.refund)}</TD>
                  <TD align="right">
                    <Diff value={c.feeDiff} unit="Rp" />
                  </TD>
                  <TD>{c.status === "Disputed" ? <Pill>Disputed</Pill> : <Status tone={c.status === "Refunded" ? "muted" : "default"}>{c.status}</Status>}</TD>
                </TRow>
              ))}
            </TBody>
          </Table>
        </Card>
        <Card inset="nest">
          <CardHeader title="By reason" className="px-2 pt-2" action={reason ? <Button variant="ghost" size="sm" onClick={() => setReason(null)}>All reasons</Button> : undefined} />
          <BarList
            selected={reason}
            onSelect={setReason}
            loading={loading}
            data={CANCEL_REASONS.map((r, i) => ({ key: r, label: r, value: counts[i], display: String(counts[i]) }))}
          />
        </Card>
      </div>
      <Sheet
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        modal={false}
        keepOpenOn="[data-cancels]"
        title={open?.id}
        footer={
          <SplitButton
            onClick={() => toast("Dispute sent to the platform")}
            menu={
              <>
                <MenuItem onSelect={() => toast("Marked as refunded")}>Mark as refunded</MenuItem>
                <MenuItem onSelect={() => toast("Buyer contacted", "neutral")}>Message the buyer</MenuItem>
              </>
            }
          >
            Dispute the fee
          </SplitButton>
        }
      >
        {open ? <CancellationDetail key={open.id} c={open} /> : null}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------ team */

function Team() {
  const loading = useLoading();
  const [roles, setRoles] = React.useState(Object.fromEntries(TEAM_DETAIL.map((t) => [t.email, t.role])));
  const [inviting, setInviting] = React.useState(false);
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Team">
        <Button variant="primary" onClick={() => setInviting(true)}>
          <UserPlus />
          Invite
        </Button>
      </PageHeader>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card inset="nest" className="grid gap-px">
          {TEAM_DETAIL.map((t) => (
            <div key={t.email} className="flex min-h-[calc(var(--ad-row-h)+16px)] items-center gap-3 rounded-item px-2.5 py-1.5 hover:bg-fill">
              {loading ? <Skeleton className="size-8 rounded-full" /> : <Avatar name={t.name} />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium">
                  <L>{t.name}</L>
                </p>
                <p className="truncate text-small text-ink-muted">
                  <L>{t.email}</L>
                </p>
              </div>
              <span className="w-28 truncate text-body text-ink-muted max-md:hidden">
                <L>{t.shops}</L>
              </span>
              <span className="w-28 max-md:hidden">
                <Loading loading={loading}>
                  {t.active === "Online" ? <Status tone="attention">Online</Status> : t.active === "Invited" ? <Pill tone="neutral">Invited</Pill> : <span className="text-body text-ink-muted">{t.active}</span>}
                </Loading>
              </span>
              {/* One width for every role, so the shop and last-active columns line up row to row. */}
              <Loading loading={loading} className="w-28">
                <Select
                  aria-label={`${t.name} role`}
                  align="end"
                  value={roles[t.email]}
                  onValueChange={(v) => {
                    setRoles({ ...roles, [t.email]: v });
                    toast(`${t.name.split(" ")[0]} is now ${v}`);
                  }}
                  options={["Owner", "Admin", "Cashier", "Stock"].map((r) => ({ value: r, label: r }))}
                  className="w-28"
                />
              </Loading>
            </div>
          ))}
        </Card>
        <Card inset="nest">
          <CardHeader title="Activity" className="px-2 pt-2" />
          <Timeline
            events={TEAM_ACTIVITY.map((a) => ({
              id: a.id,
              time: a.time,
              // Two lines before it cuts, so "changed the courier for Dago to SiCepat" reads whole in the 380 px card.
              title: (
                <span className="line-clamp-2 whitespace-normal">
                  <L>
                    <span className="font-medium">{a.who.split(" ")[0]}</span> {a.what}
                  </L>
                </span>
              ),
            }))}
          />
        </Card>
      </div>
      <Dialog
        open={inviting}
        onOpenChange={setInviting}
        title="Invite to Rimba"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" onClick={() => toast("Invite sent")}>
                Send invite
              </Button>
            </DialogClose>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Email">
            <Input aria-label="Email" placeholder="name@rimba.example" type="email" />
          </Field>
          <Field label="Role">
            <Select aria-label="Role" value="Cashier" onValueChange={() => {}} options={["Admin", "Cashier", "Stock"].map((r) => ({ value: r, label: r }))} />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------ settings */

type Form = {
  name: string;
  legal: string;
  tz: string;
  lang: string;
  money: string;
  round: boolean;
  receipts: boolean;
  reason: boolean;
  sync: string;
};

const INITIAL: Form = {
  name: "Rimba",
  legal: "PT Rimba Rumah Nusantara",
  tz: "wib",
  lang: "en",
  money: "full",
  round: true,
  receipts: false,
  reason: true,
  sync: "5",
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="px-1 text-title font-semibold">{title}</h2>
      <Card inset="nest" className="grid gap-px">
        {children}
      </Card>
    </section>
  );
}

/** While the settings load, every row's value pulses in place (the labels are the page's own copy, not data). */
const SettingsLoading = React.createContext(false);

function Row({ label, children, onClick }: { label: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  const loading = React.useContext(SettingsLoading);
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-[calc(var(--ad-row-h)+8px)] w-full items-center justify-between gap-4 rounded-item px-2.5 py-1 text-left text-body",
        onClick && "cursor-pointer transition-colors duration-[160ms] hover:bg-fill focus-visible:bg-fill",
      )}
    >
      <span className="min-w-0 truncate text-ink">{label}</span>
      <span className="flex shrink-0 items-center gap-2">
        <Loading loading={loading}>{children}</Loading>
      </span>
    </Comp>
  );
}

function Settings() {
  const loading = useLoading();
  const [saved, setSaved] = React.useState(INITIAL);
  const [form, setForm] = React.useState(INITIAL);
  const [member, setMember] = React.useState<(typeof TEAM)[number] | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);

  return (
    <SettingsLoading.Provider value={loading}>
      <div className="grid max-w-[720px] gap-6 pb-4">
        <PageHeader title="Settings" />
        <Group title="Shop">
          <Row label="Shop name">
            <Input aria-label="Shop name" value={form.name} onChange={(e) => set("name", e.target.value)} wrapperClassName="w-60 max-sm:w-40" />
          </Row>
          <Row label="Legal name">
            <Input aria-label="Legal name" value={form.legal} onChange={(e) => set("legal", e.target.value)} wrapperClassName="w-60 max-sm:w-40" />
          </Row>
          <Row label="Time zone">
            <Select
              aria-label="Time zone"
              value={form.tz}
              onValueChange={(v) => set("tz", v)}
              options={[
                { value: "wib", label: "Jakarta, WIB" },
                { value: "wita", label: "Makassar, WITA" },
                { value: "wit", label: "Jayapura, WIT" },
              ]}
            />
          </Row>
          <Row label="Language">
            <LanguagePicker value={form.lang} onValueChange={(v) => set("lang", v)} />
          </Row>
          <Row label="Money">
            <Select
              aria-label="Money format"
              value={form.money}
              onValueChange={(v) => set("money", v)}
              options={[
                { value: "full", label: "Rp 12.400.000" },
                { value: "short", label: "Rp 12,4 jt" },
              ]}
            />
          </Row>
        </Group>
        <Group title="Checkout">
          {(
            [
              ["round", "Round cash totals to Rp 100"],
              ["receipts", "Print receipts"],
              ["reason", "Ask why a sale is cancelled"],
            ] as const
          ).map(([k, label]) => (
            <Row key={k} label={label} onClick={() => set(k, !form[k])}>
              <Switch checked={form[k]} onCheckedChange={(v) => set(k, v)} onClick={(e) => e.stopPropagation()} tabIndex={-1} aria-label={label} />
            </Row>
          ))}
        </Group>
        <Group title="Marketplaces">
          <Row label="Shopee" onClick={() => toast("Shopee is connected", "neutral")}>
            <Status>Connected</Status>
          </Row>
          <Row label="TikTok Shop" onClick={() => toast("TikTok Shop is connected", "neutral")}>
            <Status>Connected</Status>
          </Row>
          <Row label="Tokopedia" onClick={() => toast("Connect Tokopedia", "neutral")}>
            <Status tone="muted">Not connected</Status>
          </Row>
          <Row label="Sync stock every">
            <Select
              aria-label="Sync stock every"
              value={form.sync}
              onValueChange={(v) => set("sync", v)}
              options={[
                { value: "1", label: "1 minute" },
                { value: "5", label: "5 minutes" },
                { value: "15", label: "15 minutes" },
              ]}
            />
          </Row>
        </Group>
        <Group title="Team">
          {TEAM.map((t) => (
            <Row
              key={t.email}
              onClick={() => setMember(t)}
              label={
                <span className="flex items-center gap-3">
                  <Avatar name={t.name} size="sm" />
                  {t.name}
                </span>
              }
            >
              <span className="text-ink-muted">{t.role}</span>
            </Row>
          ))}
        </Group>
        <SaveBar
          open={dirty}
          onDiscard={() => setForm(saved)}
          onSave={() => {
            setSaved(form);
            toast("Changes saved");
          }}
        />
        <Dialog
          open={!!member}
          onOpenChange={(o) => !o && setMember(null)}
          title={member?.name}
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="primary" onClick={() => toast("Role updated")}>
                  Save role
                </Button>
              </DialogClose>
            </>
          }
        >
          <Field label="Role">
            <Select
              aria-label="Role"
              value={member?.role ?? "Admin"}
              onValueChange={() => {}}
              options={["Owner", "Admin", "Cashier", "Stock"].map((r) => ({ value: r, label: r }))}
            />
          </Field>
        </Dialog>
        <Dialog
          open={blocker.state === "blocked"}
          onOpenChange={(o) => !o && blocker.reset?.()}
          title="Leave without saving?"
          footer={
            <>
              <Button variant="ghost" onClick={() => blocker.proceed?.()}>
                Discard changes
              </Button>
              <Button variant="primary" onClick={() => blocker.reset?.()}>
                Keep editing
              </Button>
            </>
          }
        />
      </div>
    </SettingsLoading.Provider>
  );
}
