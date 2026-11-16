import * as React from "react";
import { ArrowRight, Bell, Box, Edit2, Folder, Inbox, MoreHorizontal, Plus, Share2, Trash2, Truck } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { radii } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, MetricCard } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { BarChart } from "@/components/ui/bar-chart";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { Thumb } from "@/components/ui/thumb";
import { Switch } from "@/components/ui/switch";
import { Status, Pill, Chip } from "@/components/ui/status";
import { Search } from "@/components/ui/search";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { LanguagePicker } from "@/components/ui/language-picker";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { DatePicker } from "@/components/ui/date-picker";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { Checkbox } from "@/components/ui/checkbox";
import { Menu, MenuGroup, MenuItem, MenuSub } from "@/components/ui/menu";
import { Table, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";
import { Toolbar } from "@/components/ui/toolbar";
import { SLink, shapedSupported, useConfig } from "./config";
import { CornerControl, RadiusControl, SmoothingControl } from "./config-panel";
import { Wordmark } from "./layout";
import { HOURLY, NOW, ORDERS, PRODUCTS, SHOPS, TEAM } from "./data";

/* The signature visual: card > panel > pill > button, every corner concentric. */
function ConcentricStack() {
  const [config] = useConfig();
  const r = radii(config, shapedSupported());
  const zero = config.corner === "square";
  const pad = { pill: 5, panel: 14, card: 16, ring: 26 };
  const r0 = r.control;
  const r1 = zero ? 0 : r0 + pad.pill;
  const r2 = zero ? 0 : r1 + pad.panel;
  const r3 = zero ? 0 : r2 + pad.card;
  const r4 = zero ? 0 : r3 + pad.ring;
  const ease = "transition-[border-radius] duration-[220ms] ease-ad";
  return (
    <div className={cn("w-full max-w-[540px] bg-brand-soft", ease)} style={{ borderRadius: r4, padding: pad.ring }}>
      <div className={cn("bg-surface shadow-raised", ease)} style={{ borderRadius: r3, padding: pad.card }}>
        <div className={cn("bg-fill", ease)} style={{ borderRadius: r2, padding: pad.panel }}>
          <div className="flex items-start justify-between gap-3 px-1">
            <div className="grid gap-0.5">
              <span className="text-body text-ink-muted">Sales today</span>
              <span className="text-number font-semibold tabular-nums">{formatRp(48240000)}</span>
            </div>
            <Avatar name="Rizky Hartono" size="sm" className="mt-0.5 bg-surface" />
          </div>
          <BarChart data={HOURLY} height={92} current={6} labelEvery={3} className="mt-4 px-1" aria-label="Sales by hour" />
          <div className={cn("mt-4 flex items-center justify-between gap-3 bg-surface shadow-card", ease)} style={{ borderRadius: r1, padding: pad.pill, paddingLeft: 14 }}>
            <Status tone="attention">3 orders to pack</Status>
            <Button variant="primary" onClick={() => toast("3 orders packed")}>
              Pack orders
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const [config, setConfig] = useConfig();
  return (
    <section className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1fr_540px] lg:gap-16 lg:pb-24 lg:pt-16">
      <div className="grid max-w-[520px] gap-8">
        <h1 className="text-[clamp(44px,7.2vw,84px)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink">Corners that agree.</h1>
        <div className="grid gap-4 sm:max-w-[380px]">
          <CornerControl value={config} onChange={setConfig} />
          <SmoothingControl value={config} onChange={setConfig} />
          <RadiusControl value={config} onChange={setConfig} />
        </div>
        <div>
          <Button variant="primary" asChild>
            <SLink to="/gallery">
              Explore gallery
              <ArrowRight />
            </SLink>
          </Button>
        </div>
      </div>
      <div className="flex justify-center lg:justify-end">
        <ConcentricStack />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ the wall */

function Tile({ className, children, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card className={cn("min-w-0", className)} {...props}>
      {children}
    </Card>
  );
}

function MetricsTile() {
  return (
    <div className="flex flex-wrap gap-4 ">
      <MetricCard primary label="Sales today" value={formatRp(48240000)} delta={{ value: "9,7%", direction: "up" }} />
      <MetricCard label="Orders" value="312" />
      <MetricCard label="Basket" value={formatRp(154600)} />
      <MetricCard label="Cancelled" value="4" className="min-w-0" />
    </div>
  );
}

function ChartTile() {
  const [range, setRange] = React.useState("day");
  return (
    <Tile >
      <CardHeader
        title="Sales"
        action={
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
        }
      />
      <BarChart data={HOURLY} current={10} labelEvery={2} height={150} className="mt-5" aria-label="Sales by hour" />
    </Tile>
  );
}

function StockTile() {
  const low = PRODUCTS.filter((p) => p.stock < 5).slice(0, 4);
  return (
    <Tile inset="nest" >
      <CardHeader title="Low stock" action={<Badge>{low.length}</Badge>} className="px-2 pt-2" />
      <AttentionList className="mt-1">
        {low.map((p) => (
          <AttentionItem key={p.sku} media={<Thumb alt={p.name} />} title={p.name} meta={p.sku} value={p.stock === 0 ? "Out" : `${p.stock} left`} onClick={() => {}} />
        ))}
      </AttentionList>
    </Tile>
  );
}

function MenuTile() {
  return (
    <Tile className="flex flex-col gap-3 ">
      <CardHeader
        title="Order RMB-24817"
        action={
          <Menu
            align="end"
            trigger={
              <Button variant="ghost" icon aria-label="More">
                <MoreHorizontal />
              </Button>
            }
          >
            <MenuItem icon={Edit2}>Edit</MenuItem>
            <MenuItem icon={Share2}>Share</MenuItem>
            <MenuSub icon={Folder} label="Move to">
              <MenuItem>To pack</MenuItem>
              <MenuItem>On hold</MenuItem>
              <MenuItem>Archive</MenuItem>
            </MenuSub>
            <MenuGroup>
              <MenuItem icon={Trash2}>Cancel order</MenuItem>
            </MenuGroup>
          </Menu>
        }
      />
      <div className="grid gap-2 text-body">
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">Customer</span>
          <span>Rina S.</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">Status</span>
          <Status>Paid</Status>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-muted">Total</span>
          <span className="font-medium tabular-nums">{formatRp(434000)}</span>
        </div>
      </div>
    </Tile>
  );
}

function ToolbarTile() {
  const [q, setQ] = React.useState("");
  const [shop, setShop] = React.useState("all");
  const [status, setStatus] = React.useState<string[]>(["Paid"]);
  const [week, setWeek] = React.useState(NOW);
  const [view, setView] = React.useState("list");
  return (
    <Tile >
      <Toolbar>
        <Search value={q} onValueChange={setQ} placeholder="Order or product" wrapperClassName="w-full sm:w-56" />
        <Select
          aria-label="Shop"
          prefix="Shop"
          value={shop}
          onValueChange={setShop}
          options={[{ value: "all", label: "All" }, ...SHOPS.map((s) => ({ value: s, label: s }))]}
        />
        <MultiSelect aria-label="Status" value={status} onValueChange={setStatus} placeholder="Status" options={["Paid", "Packed", "Shipped", "Unpaid"].map((s) => ({ value: s, label: s }))} />
        <PeriodStepper value={week} period="week" onValueChange={setWeek} max={NOW} />
        <Segmented
          aria-label="View"
          value={view}
          onValueChange={setView}
          className="sm:ml-auto"
          options={[
            { value: "list", label: "List" },
            { value: "board", label: "Board" },
          ]}
        />
        <Button variant="primary">
          <Plus />
          Add order
        </Button>
      </Toolbar>
    </Tile>
  );
}

function TableTile() {
  const [sel, setSel] = React.useState(1);
  return (
    <Tile inset="nest" >
      <Table>
        <THead>
          <tr>
            <TH>Order</TH>
            <TH>Shop</TH>
            <TH>Status</TH>
            <TH align="right">Total</TH>
          </tr>
        </THead>
        <TBody>
          {ORDERS.slice(0, 5).map((o, i) => (
            <TRow key={o.id} selected={sel === i} onActivate={() => setSel(i)}>
              <TD>{o.id}</TD>
              <TD>{o.shop}</TD>
              <TD>
                <Status tone={o.status === "Unpaid" ? "attention" : o.status === "Cancelled" ? "muted" : "default"}>{o.status}</Status>
              </TD>
              <TD align="right">{formatRp(o.total)}</TD>
            </TRow>
          ))}
        </TBody>
      </Table>
    </Tile>
  );
}

function SettingsTile() {
  const [a, setA] = React.useState(true);
  const [b, setB] = React.useState(false);
  const [c, setC] = React.useState(true);
  const rows: [string, boolean, (v: boolean) => void][] = [
    ["Round cash totals", a, setA],
    ["Print receipts", b, setB],
    ["Ask why a sale is cancelled", c, setC],
  ];
  return (
    <Tile inset="nest" >
      <CardHeader title="Checkout" className="px-2 pt-2" />
      <div className="grid gap-px">
        {rows.map(([label, v, set]) => (
          <label key={label} className="flex h-row cursor-pointer items-center justify-between gap-3 rounded-item px-2 text-body hover:bg-fill">
            {label}
            <Switch checked={v} onCheckedChange={set} />
          </label>
        ))}
      </div>
    </Tile>
  );
}

function ChipsTile() {
  const [on, setOn] = React.useState("all");
  const [tags, setTags] = React.useState(["Kemang", "This week"]);
  return (
    <Tile className="flex flex-col gap-3 ">
      <div className="flex flex-wrap gap-1">
        {["all", "unpaid", "to pack", "shipped"].map((k) => (
          <Chip key={k} selected={on === k} onClick={() => setOn(k)}>
            {k[0].toUpperCase() + k.slice(1)}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Chip key={t} onRemove={() => setTags(tags.filter((x) => x !== t))}>
            {t}
          </Chip>
        ))}
        {tags.length === 0 ? (
          <Button variant="ghost" onClick={() => setTags(["Kemang", "This week"])}>
            Reset filters
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Pill>Needs review</Pill>
        <Status>Paid</Status>
        <Status tone="muted">Cancelled</Status>
      </div>
    </Tile>
  );
}

function DateTile() {
  const [d, setD] = React.useState<Date | null>(NOW);
  const [w, setW] = React.useState(NOW);
  return (
    <Tile className="flex flex-col gap-3 ">
      <DatePicker value={d} onValueChange={setD} today={NOW} className="w-full" />
      <PeriodStepper value={w} period="week" onValueChange={setW} max={NOW} />
    </Tile>
  );
}

function PeopleTile() {
  const [lang, setLang] = React.useState("en");
  return (
    <Tile className="flex items-center justify-between gap-3 ">
      <div className="flex gap-1.5">
        {TEAM.map((t) => (
          <Avatar key={t.name} name={t.name} />
        ))}
      </div>
      <LanguagePicker value={lang} onValueChange={setLang} />
    </Tile>
  );
}

function AlertTile() {
  return (
    <div className="grid gap-4 ">
      <Alert tone="attention" title="2 shops haven't synced since 09:40" action={<Button size="sm">Sync</Button>} />
      <Alert tone="danger" title="Payout failed">
        The bank rejected the account number. Check it in Settings.
      </Alert>
    </div>
  );
}

function EmptyTile() {
  return (
    <Tile className="grid place-items-center ">
      <EmptyState icon={Inbox} title="No returns yet" className="py-6" />
    </Tile>
  );
}

function TabsTile() {
  const [checked, setChecked] = React.useState([true, false, true]);
  return (
    <Tile className="flex flex-col gap-3 ">
      <Tabs defaultValue="pack">
        <TabsList>
          <TabsTrigger value="pack">
            <Box />
            Pack
          </TabsTrigger>
          <TabsTrigger value="ship">
            <Truck />
            Ship
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell />
            Alerts
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid gap-px">
        {["RMB-24817 · Gelas kopi", "RMB-24815 · Piring rotan", "RMB-24811 · Lilin sereh"].map((t, i) => (
          <label key={t} className="flex h-item cursor-pointer items-center gap-2.5 rounded-item px-2 text-body hover:bg-fill">
            <Checkbox checked={checked[i]} onCheckedChange={(v) => setChecked(checked.map((c, j) => (j === i ? v === true : c)))} />
            <span className="truncate">{t}</span>
          </label>
        ))}
      </div>
    </Tile>
  );
}

function SaveTile() {
  return (
    <div className="flex items-center justify-center ">
      <div className="ad-on-dark flex items-center gap-3 rounded-card bg-side p-nest pl-4 text-side-ink shadow-dialog">
        <span className="whitespace-nowrap text-body">Unsaved changes</span>
        <Button variant="ghost">Discard</Button>
        <Button variant="primary" onClick={() => toast("Changes saved")}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

function Wall() {
  return (
    <section aria-label="Components" className="mx-auto grid w-full max-w-[1280px] gap-4 px-4 sm:px-6">
      <ToolbarTile />
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="grid gap-4">
          <MetricsTile />
          <StockTile />
          <DateTile />
          <AlertTile />
        </div>
        <div className="grid gap-4">
          <ChartTile />
          <TableTile />
          <TabsTile />
          <EmptyTile />
        </div>
        <div className="grid gap-4">
          <MenuTile />
          <SettingsTile />
          <ChipsTile />
          <PeopleTile />
          <SaveTile />
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-[1280px] px-4 pb-10 sm:px-6">
      <div className="flex flex-col gap-8 rounded-sheet bg-surface p-pad shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="grid gap-4">
          <Wordmark className="text-[20px]" />
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-body text-ink-muted">
            <SLink to="/gallery" className="hover:text-ink">
              Gallery
            </SLink>
            <SLink to="/examples/dashboard" className="hover:text-ink">
              Examples
            </SLink>
            <SLink to="/export" className="hover:text-ink">
              Export
            </SLink>
          </nav>
        </div>
        <div>
          <Button variant="primary" asChild>
            <SLink to="/gallery">
              Explore gallery
              <ArrowRight />
            </SLink>
          </Button>
        </div>
      </div>
      <p className="mt-6 px-1 text-small text-ink-muted">© 2026 Alora</p>
    </footer>
  );
}

export function Landing() {
  return (
    <main>
      <Hero />
      <Wall />
      <Footer />
    </main>
  );
}
