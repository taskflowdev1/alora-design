import * as React from "react";
import { useBlocker, useParams, useSearchParams } from "react-router";
import { Bell, ChevronDown, Download, Home, LogOut, Package, Plus, Settings as SettingsIcon, ShoppingBag, Tag, User, Users, XCircle, Search as SearchIcon } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, MetricCard } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { BarChart, BarList } from "@/components/ui/bar-chart";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { Thumb } from "@/components/ui/thumb";
import { Badge } from "@/components/ui/badge";
import { Status } from "@/components/ui/status";
import { Table, TableBar, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { Search } from "@/components/ui/search";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { Popover } from "@/components/ui/popover";
import { CheckboxField } from "@/components/ui/checkbox";
import { Sheet } from "@/components/ui/sheet";
import { PageHeader, Toolbar, ToolbarSpacer } from "@/components/ui/toolbar";
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
import { SLink } from "./config";
import { OrderDetail } from "./demos";
import { DAILY, HOURLY, NOW, ORDERS, PRODUCTS, SHOPS, TEAM, smartTime, type OrderStatus } from "./data";

type Page = "dashboard" | "orders" | "settings";

const NAV: { key: Page | "products" | "promotions" | "cancellations" | "team"; label: string; icon: typeof Home; count?: number }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "orders", label: "Orders", icon: ShoppingBag, count: 23 },
  { key: "products", label: "Products", icon: Package },
  { key: "promotions", label: "Promotions", icon: Tag },
  { key: "cancellations", label: "Cancellations", icon: XCircle },
];

function useLoading() {
  const [params] = useSearchParams();
  return params.get("loading") === "1";
}

function AppSidebar({ page }: { page: Page }) {
  const [shop, setShop] = React.useState("All shops");
  return (
    <Sidebar className="h-full max-lg:hidden">
      <Menu
        tone="dark"
        trigger={
          <button type="button" className="mb-3 flex h-control w-full cursor-pointer items-center gap-2.5 rounded-item bg-side-fill px-2.5 text-left text-body text-side-ink transition-[background-color,transform] duration-[160ms] hover:bg-side-fill-hover active:scale-[0.98]">
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
        {NAV.map((n) =>
          n.key === "dashboard" || n.key === "orders" ? (
            <SidebarItem key={n.key} icon={n.icon} active={page === n.key} count={n.count} asChild>
              <SLink to={`/examples/${n.key}`}>{n.label}</SLink>
            </SidebarItem>
          ) : (
            <SidebarItem key={n.key} icon={n.icon} count={n.count} onClick={() => toast(`${n.label} isn't part of this example`, "neutral")}>
              {n.label}
            </SidebarItem>
          ),
        )}
      </SidebarSection>
      <SidebarSection label="Shop">
        <SidebarItem icon={Users} onClick={() => toast("Team isn't part of this example", "neutral")}>
          Team
        </SidebarItem>
        <SidebarItem icon={SettingsIcon} active={page === "settings"} asChild>
          <SLink to="/examples/settings">Settings</SLink>
        </SidebarItem>
      </SidebarSection>
      <div className="mt-auto flex items-center justify-between pl-1">
        <Menu
          tone="dark"
          side="top"
          trigger={
            <button type="button" aria-label="Account" className="cursor-pointer rounded-full transition-transform duration-[160ms] active:scale-95">
              <Avatar name="Rizky Hartono" size="sm" className="bg-side-fill-hover text-side-ink" />
            </button>
          }
        >
          <MenuItem icon={User}>Profile</MenuItem>
          <MenuItem icon={Bell}>Notifications</MenuItem>
          <MenuItem icon={LogOut}>Sign out</MenuItem>
        </Menu>
      </div>
    </Sidebar>
  );
}

function PhoneNavBar({ page }: { page: Page }) {
  return (
    <div className="lg:hidden">
      <BottomNav>
        <SLink to="/examples/dashboard" className="flex flex-1">
          <BottomNavItem icon={Home} label="Home" active={page === "dashboard"} />
        </SLink>
        <SLink to="/examples/orders" className="flex flex-1">
          <BottomNavItem icon={ShoppingBag} label="Orders" active={page === "orders"} />
        </SLink>
        <BottomNavItem icon={Package} label="Stock" onClick={() => toast("Stock isn't part of this example", "neutral")} />
        <SLink to="/examples/settings" className="flex flex-1">
          <BottomNavItem icon={SettingsIcon} label="Settings" active={page === "settings"} />
        </SLink>
      </BottomNav>
      {page === "orders" ? <Fab icon={Plus} label="Add order" onClick={() => toast("New order")} /> : null}
    </div>
  );
}

export function Examples() {
  const { page = "dashboard" } = useParams();
  const p = (["dashboard", "orders", "settings"].includes(page) ? page : "dashboard") as Page;
  return (
    <div className="flex h-[calc(100dvh-64px)] gap-3 px-3 pb-3 max-sm:h-auto max-sm:min-h-[calc(100dvh-104px)]">
      <AppSidebar page={p} />
      <div data-app className="min-w-0 flex-1 overflow-auto rounded-card max-lg:pb-24" key={p}>
        <div className="animate-[ad-fade-in_220ms_var(--ad-ease)] px-2 py-2 sm:px-5 sm:py-3">
          {p === "dashboard" ? <Dashboard /> : p === "orders" ? <Orders /> : <Settings />}
        </div>
      </div>
      <PhoneNavBar page={p} />
    </div>
  );
}

/* ------------------------------------------------------------ dashboard */

function Dashboard() {
  const loading = useLoading();
  const [range, setRange] = React.useState("day");
  const [shop, setShop] = React.useState<string | null>(null);
  const low = PRODUCTS.filter((p) => p.stock < 5);
  const unpaid = ORDERS.filter((o) => o.status === "Unpaid").slice(0, 4);
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;
  return (
    <div className="grid gap-5">
      <PageHeader title="Dashboard">
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
      <div className="flex flex-wrap gap-4">
        <MetricCard primary label="Sales today" value={<L>{formatRp(48240000)}</L>} delta={{ value: <L>9,7%</L>, direction: "up" }} />
        <MetricCard label="Orders" value={<L>312</L>} />
        <MetricCard label="Basket" value={<L>{formatRp(154600)}</L>} />
        <MetricCard label="To ship" value={<L>18</L>} className="min-w-0" />
        <MetricCard label="Cancelled" value={<L>4</L>} className="min-w-0" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={range === "day" ? "Sales by hour" : "Sales, last 30 days"} />
          {loading ? (
            <Skeleton className="mt-4 h-[178px]" />
          ) : range === "day" ? (
            <BarChart data={HOURLY} current={6} labelEvery={1} height={150} className="mt-4" aria-label="Sales by hour" />
          ) : (
            <BarChart data={DAILY} current={29} labelEvery={5} height={150} className="mt-4" aria-label="Sales, last 30 days" />
          )}
        </Card>
        <Card inset="nest">
          <CardHeader title="By shop" className="px-2 pt-2" action={shop ? <Button variant="ghost" size="sm" onClick={() => setShop(null)}>All shops</Button> : undefined} />
          {loading ? (
            <div className="grid gap-px">
              {SHOPS.map((s) => (
                <Skeleton key={s} className="h-row" />
              ))}
            </div>
          ) : (
            <BarList
              selected={shop}
              onSelect={setShop}
              data={SHOPS.map((s, i) => ({ key: s, label: s, value: [12.4, 9.8, 7.1, 5.2, 8.9, 4.8][i], display: `Rp ${[12.4, 9.8, 7.1, 5.2, 8.9, 4.8][i].toLocaleString("id-ID")} jt` }))}
            />
          )}
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card inset="nest">
          <CardHeader title="Low stock" action={<Badge>{low.length}</Badge>} className="px-2 pt-2" />
          <AttentionList className="mt-1">
            {low.map((p) => (
              <AttentionItem
                key={p.sku}
                media={
                  <Loading loading={loading}>
                    <Thumb alt={p.name} />
                  </Loading>
                }
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
                media={
                  <Loading loading={loading}>
                    <Avatar name={o.customer} size="md" className="bg-surface" />
                  </Loading>
                }
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

function Orders() {
  const forcedLoading = useLoading();
  const [q, setQ] = React.useState("");
  const [shop, setShop] = React.useState("all");
  const [status, setStatus] = React.useState<string[]>([]);
  const [week, setWeek] = React.useState(NOW);
  const [page, setPage] = React.useState(1);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [cols, setCols] = React.useState({ customer: true, payment: true, fee: true });
  const [busy, setBusy] = React.useState(false);
  const loading = forcedLoading || busy;
  const first = React.useRef(true);

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

  // A short skeleton when the page changes, the same shape as the rows that arrive.
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setBusy(true);
    const id = window.setTimeout(() => setBusy(false), 350);
    return () => window.clearTimeout(id);
  }, [page, shop, week]);

  React.useEffect(() => setPage(1), [q, shop, status]);

  const open = ORDERS.find((o) => o.id === openId);
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;

  return (
    <div className="flex h-[calc(100dvh-64px-24px-24px)] min-h-[520px] flex-col gap-4 max-lg:h-auto">
      <PageHeader title="Orders">
        <Button>
          <Download />
          Export
        </Button>
        <Button variant="primary" className="max-lg:hidden" onClick={() => toast("New order")}>
          <Plus />
          Add order
        </Button>
      </PageHeader>
      <Toolbar>
        <Search value={q} onValueChange={setQ} placeholder="Search orders" wrapperClassName="max-sm:w-full" />
        <Select prefix="Shop" aria-label="Shop" value={shop} onValueChange={setShop} options={[{ value: "all", label: "All" }, ...SHOPS.map((s) => ({ value: s, label: s }))]} />
        <MultiSelect aria-label="Status" placeholder="Status" value={status} onValueChange={setStatus} options={STATUSES.map((s) => ({ value: s, label: s }))} />
        <PeriodStepper value={week} period="week" onValueChange={setWeek} max={NOW} />
        <ToolbarSpacer />
        <Popover align="end" trigger={<Button>Columns</Button>}>
          <div className="grid w-48 gap-2.5">
            <CheckboxField label="Customer" checked={cols.customer} onCheckedChange={(v) => setCols({ ...cols, customer: v === true })} />
            <CheckboxField label="Payment" checked={cols.payment} onCheckedChange={(v) => setCols({ ...cols, payment: v === true })} />
            <CheckboxField label="Fee" checked={cols.fee} onCheckedChange={(v) => setCols({ ...cols, fee: v === true })} />
          </div>
        </Popover>
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
                  <TH>Time</TH>
                  <TH>Shop</TH>
                  {cols.customer ? <TH>Customer</TH> : null}
                  <TH>Items</TH>
                  {cols.payment ? <TH>Payment</TH> : null}
                  <TH>Status</TH>
                  <TH align="right">Total</TH>
                  {cols.fee ? <TH align="right">Fee</TH> : null}
                </tr>
              </THead>
              <TBody>
                {pageRows.map((o) => (
                  <TRow key={o.id} selected={o.id === openId} onActivate={() => setOpenId(o.id)}>
                    <TD>
                      <L>{o.id}</L>
                    </TD>
                    <TD className="text-ink-muted">
                      <L>{smartTime(o.at)}</L>
                    </TD>
                    <TD>
                      <L>{o.shop}</L>
                    </TD>
                    {cols.customer ? (
                      <TD>
                        <L>{o.customer}</L>
                      </TD>
                    ) : null}
                    <TD maxWidth={220}>
                      <L>{o.items}</L>
                    </TD>
                    {cols.payment ? (
                      <TD>
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
                    {cols.fee ? (
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

function Row({ label, children, onClick }: { label: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
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
      <span className="flex shrink-0 items-center gap-2">{children}</span>
    </Comp>
  );
}

function Settings() {
  const [saved, setSaved] = React.useState(INITIAL);
  const [form, setForm] = React.useState(INITIAL);
  const [member, setMember] = React.useState<(typeof TEAM)[number] | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);

  return (
    <div className="mx-auto grid max-w-[720px] gap-6 pb-4">
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
            className="w-full"
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
  );
}
