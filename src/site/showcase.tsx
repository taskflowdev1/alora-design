/*
 * The Components page: every component live, composed into a bento like the landing's. Each category is a band of
 * tiles on one 12-column grid; each tile is that category's components in real use (an orders page, a form, a
 * filter, a table, an overlay opened in place). Every component sits inside a `Mark`: hover shows a soft fill and a
 * chip with its name that opens its page with the sliders; a click on its empty space does the same.
 */
import * as React from "react";
import {
  Archive,
  Box,
  ChevronRight,
  Copy,
  Edit2,
  Folder,
  Home,
  Inbox,
  Mail,
  MoreHorizontal,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search as SearchIcon,
  Settings,
  Share2,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  User,
  Users,
  X,
  XCircle,
} from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { radii, squircleCompensation, type Config } from "@/lib/config";
import { COMPONENT_ITEMS, GROUPS, findItem, type Group } from "@/lib/registry";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, MetricCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { LanguagePicker } from "@/components/ui/language-picker";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Slider } from "@/components/ui/slider";
import { Table, TableBar, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { BarChart } from "@/components/ui/bar-chart";
import { Chip, Status } from "@/components/ui/status";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Thumb } from "@/components/ui/thumb";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading, LoadingText, Skeleton } from "@/components/ui/skeleton";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { toast, ToastView } from "@/components/ui/toast";
import { Menu, MenuItem, menuSurface } from "@/components/ui/menu";
import { Toolbar, ToolbarSpacer } from "@/components/ui/toolbar";
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
import { Kbd } from "@/components/ui/kbd";
import { Sparkline } from "@/components/ui/sparkline";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Steps } from "@/components/ui/steps";
import { Timeline } from "@/components/ui/timeline";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { NotificationBell, type Notice } from "@/components/ui/notification-bell";
import { KanbanCard, KanbanColumn } from "@/components/ui/kanban-card";
import { CalendarMonth, type CalendarEvent } from "@/components/ui/calendar-month";
import { Dropzone, type DropFile } from "@/components/ui/dropzone";
import { TagInput } from "@/components/ui/tag-input";
import { shapedSupported, useConfig } from "./config";
import { DAILY, MARKET_SHOPS, NOW, ORDERS, PRODUCTS, SHOPS, SPARK, TEAM, smartTime, type Order } from "./data";
import { CommentsDemo } from "./demos-niche";
import { BackPage, Head, Mark, S, Tile, frame, stack, type TileDef } from "./mark";
import { MORE_TILES } from "./showcase-more";

const say = (m: string) => () => toast(m, "neutral");

/* ------------------------------------------------------------ Foundations */

function CornerTile({ config, className }: { config: Config; className?: string }) {
  const r = Math.max(config.radius, 1) * 2;
  const comp = shapedSupported() ? squircleCompensation(config.smoothing) : 1;
  const shapes: { key: Config["corner"]; label: string; css: string; radius: number }[] = [
    { key: "square", label: "Square", css: "square", radius: 0 },
    { key: "round", label: "Round", css: "round", radius: r },
    { key: "squircle", label: "Squircle", css: config.smoothing === 2 ? "squircle" : `superellipse(${config.smoothing})`, radius: Math.min(64, Math.round(r * comp)) },
  ];
  const rr = radii(config, shapedSupported());
  return (
    <Tile inset="pad" className={className}>
      <Mark name="corner-shape" className="flex flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-6">
          {shapes.map((s) => (
            <div key={s.key} className="grid justify-items-start gap-1.5">
              <div className="size-20 bg-brand sm:size-24" style={{ borderRadius: s.radius, cornerShape: s.css } as React.CSSProperties} />
              <span className="text-body font-medium">{s.label}</span>
              <span className="text-small tabular-nums text-ink-muted">{s.radius} px</span>
            </div>
          ))}
        <div className="grid justify-items-start gap-1.5">
          <div className="rounded-card bg-fill p-nest">
            <Button variant="primary">Save changes</Button>
          </div>
          <span className="text-body font-medium">Concentric</span>
          <span className="text-small tabular-nums text-ink-muted">
            {rr.control} + {rr.gap} = {rr.card} px
          </span>
        </div>
      </Mark>
    </Tile>
  );
}

/** Whole rows only: the scroll area is as many rows tall as fit the tile, and sits centred in it. */
function ScrollTile({ className }: { className?: string }) {
  const box = React.useRef<HTMLDivElement>(null);
  const [fit, setFit] = React.useState<{ h: number; top: number } | null>(null);
  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const row = (el.querySelector("[data-row]") as HTMLElement | null)?.offsetHeight ?? 36;
      const H = el.clientHeight;
      const n = Math.max(3, Math.floor((H + 1) / (row + 1)));
      const h = n * row + (n - 1);
      setFit({ h, top: Math.max(0, Math.floor((H - h) / 2)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <Tile className={className}>
      <Mark name="scrollbar" className="flex flex-1 flex-col">
        <div ref={box} className="relative min-h-[calc(var(--spacing-row)*3+2px)] flex-1">
          <div className="absolute inset-x-0 overflow-auto rounded-item" style={{ top: fit?.top ?? 0, height: fit?.h ?? "100%" }}>
            <div className="grid w-[560px] gap-px">
              {ORDERS.slice(0, 14).map((o) => (
                <div key={o.id} data-row className="flex h-row shrink-0 items-center gap-5 rounded-item px-2 text-body hover:bg-fill">
                  <span className="w-24 shrink-0">{o.id}</span>
                  <span className="w-28 shrink-0 text-ink-muted">{smartTime(o.at)}</span>
                  <span className="w-48 truncate">{o.items}</span>
                  <span className="ml-auto tabular-nums">{formatRp(o.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

/* ------------------------------------------------------------ Actions */

const tone = (o: Order) => (o.status === "Unpaid" ? "attention" : o.status === "Cancelled" ? "muted" : "default");

function OrdersActionsTile({ className }: { className?: string }) {
  const [q, setQ] = React.useState("");
  const [shop, setShop] = React.useState("all");
  const [range, setRange] = React.useState("week");
  const rows = ORDERS.slice(0, 5);
  const [sel, setSel] = React.useState<string[]>([rows[1].id, rows[3].id]);
  return (
    <Tile className={className}>
      <div className="flex min-h-control flex-wrap items-center gap-gap px-2 pt-1">
        <h3 className="mr-auto text-title font-semibold">Orders</h3>
        <Menu
          align="end"
          trigger={
            <Button variant="ghost" icon aria-label="More">
              <MoreHorizontal />
            </Button>
          }
        >
          <MenuItem icon={Printer}>Print all slips</MenuItem>
          <MenuItem icon={Archive}>Archive shipped</MenuItem>
        </Menu>
        <Button onClick={say("Exported 1.240 orders")}>Export</Button>
        <Button variant="primary" onClick={say("New order")}>
          <Plus />
          Add order
        </Button>
      </div>
      <Mark name="toolbar" className="mx-2">
        <Toolbar>
          <Search value={q} onValueChange={setQ} placeholder="Order or product" />
          <Select prefix="Shop" aria-label="Shop" value={shop} onValueChange={setShop} options={[{ value: "all", label: "All" }, ...SHOPS.slice(0, 4).map((s) => ({ value: s, label: s }))]} />
          <Popover trigger={<Button>Filter</Button>}>
            <div className="grid w-56 gap-2.5">
              <CheckboxField label="Unpaid" defaultChecked />
              <CheckboxField label="To pack" />
              <CheckboxField label="Shipped" />
            </div>
          </Popover>
          <ToolbarSpacer />
          <Segmented
            aria-label="Range"
            value={range}
            onValueChange={setRange}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </Toolbar>
      </Mark>
      <div className="grid grid-cols-1 gap-px">
        {rows.map((o) => {
          const on = sel.includes(o.id);
          return (
            <label key={o.id} className={cn("flex h-row cursor-pointer items-center gap-3 rounded-item px-2 text-body", on ? "bg-fill-strong" : "hover:bg-fill")}>
              <Checkbox aria-label={o.id} checked={on} onCheckedChange={(v) => setSel(v ? [...sel, o.id] : sel.filter((x) => x !== o.id))} />
              <span className="w-24 shrink-0">{o.id}</span>
              <span className="min-w-0 flex-1 truncate">{o.items}</span>
              <span className="hidden w-24 shrink-0 sm:block">
                <Status tone={tone(o)}>{o.status}</Status>
              </span>
              <span className="w-28 shrink-0 text-right tabular-nums">{formatRp(o.total)}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-gap rounded-item bg-fill p-nest pl-3">
        <span className="mr-auto text-body tabular-nums">{sel.length} selected</span>
        <Mark name="button" className="flex flex-wrap items-center gap-gap">
          <Button variant="ghost" onClick={() => setSel([])}>
            Clear
          </Button>
          <Button onClick={say(`Printing ${sel.length} slips`)}>
            <Printer />
            Print slips
          </Button>
          <Button icon aria-label="Copy order numbers" onClick={say("Copied")}>
            <Copy />
          </Button>
          <Button variant="primary" onClick={() => toast(`${sel.length} orders packed`)}>
            <Box />
            Mark packed
          </Button>
        </Mark>
      </div>
    </Tile>
  );
}

/** A menu row as the menu draws it, for a menu shown open in place. */
function MenuRow({ icon: Icon, children, sub, shortcut, active }: { icon: typeof Edit2; children: React.ReactNode; sub?: boolean; shortcut?: string; active?: boolean }) {
  return (
    <div className={cn("flex h-item items-center gap-2.5 rounded-control px-2.5 text-body", active ? "bg-fill" : "hover:bg-fill")}>
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 truncate">{children}</span>
      {shortcut ? <span className="text-small text-ink-muted">{shortcut}</span> : null}
      {sub ? <ChevronRight size={16} className="text-ink-muted" /> : null}
    </div>
  );
}

function MenuOpenTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Head
        title="RMB-24817"
        action={
          <Menu align="end" trigger={<Button className="bg-fill-strong">Actions</Button>}>
            <MenuItem icon={Edit2} shortcut="E">
              Edit
            </MenuItem>
            <MenuItem icon={Copy} shortcut="D">
              Duplicate
            </MenuItem>
            <MenuItem icon={Trash2}>Delete</MenuItem>
          </Menu>
        }
      />
      <Mark name="menu" className="flex justify-end">
        <div role="presentation" className={cn(menuSurface, "relative w-56 animate-none")}>
          <div className="grid grid-cols-1 gap-px">
            <MenuRow icon={Edit2} shortcut="E">
              Edit
            </MenuRow>
            <MenuRow icon={Copy} shortcut="D">
              Duplicate
            </MenuRow>
            <MenuRow icon={Folder} sub active>
              Move to
            </MenuRow>
            <MenuRow icon={Trash2}>Delete</MenuRow>
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

function SaveTile({ className }: { className?: string }) {
  const [dirty, setDirty] = React.useState(true);
  const [name, setName] = React.useState("Rimba Kemang Baru");
  return (
    <Tile className={className}>
      <Field label="Shop name" layout="row" className="px-2">
        <Input value={name} onChange={(e) => (setName(e.target.value), setDirty(true))} />
      </Field>
      <Mark name="save-bar" className="mt-auto">
        {dirty ? (
          <SaveBar inline open onDiscard={() => (setName("Rimba Kemang"), setDirty(false))} onSave={() => (setDirty(false), toast("Changes saved"))} />
        ) : (
          <div className="flex h-[calc(var(--ad-control-h)+var(--ad-nest)*2)] items-center px-2 text-body text-ink-muted">Saved</div>
        )}
      </Mark>
    </Tile>
  );
}

/* ------------------------------------------------------------ Inputs */

function NewOrderTile({ className }: { className?: string }) {
  const [sku, setSku] = React.useState<string | null>(PRODUCTS[0].sku);
  const [date, setDate] = React.useState<Date | null>(NOW);
  const [lang, setLang] = React.useState("id");
  return (
    <Tile inset="pad" className={className}>
      <CardHeader
        title="New order"
        action={
          <Mark name="language-picker">
            <LanguagePicker value={lang} onValueChange={setLang} />
          </Mark>
        }
      />
      <Field label="Product">
        <Mark name="combobox">
          <Combobox aria-label="Product" value={sku} onValueChange={setSku} placeholder="Choose a product" searchPlaceholder="Search products" options={PRODUCTS.map((p) => ({ value: p.sku, label: p.name }))} className="w-full" />
        </Mark>
      </Field>
      <Mark name="field">
        <Field label="Customer email" error="Add the part after @, like rina@gmail.com">
          <Mark name="input">
            <Input icon={Mail} defaultValue="rina@" invalid />
          </Mark>
        </Field>
      </Mark>
      <Field label="Ship on">
        <Mark name="date-picker">
          <DatePicker value={date} onValueChange={setDate} today={NOW} />
        </Mark>
      </Field>
    </Tile>
  );
}

function FindTile({ className }: { className?: string }) {
  const [q, setQ] = React.useState("Gelas");
  const [shop, setShop] = React.useState("Kemang");
  const [st, setSt] = React.useState(["Paid", "Packed"]);
  const [d, setD] = React.useState(NOW);
  const [range, setRange] = React.useState("week");
  return (
    <Tile className={className}>
      <Mark name="tabs" className="px-1">
        <Tabs defaultValue="pack">
          <TabsList>
            <TabsTrigger value="pack">
              <Box />
              To pack
            </TabsTrigger>
            <TabsTrigger value="ship">
              <Truck />
              To ship
            </TabsTrigger>
            <TabsTrigger value="done">
              <Archive />
              Done
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pack" />
          <TabsContent value="ship" />
          <TabsContent value="done" />
        </Tabs>
      </Mark>
      <div className="grid gap-gap px-2">
        <Mark name="search">
          <Search value={q} onValueChange={setQ} placeholder="Order or product" className="w-full" />
        </Mark>
        <div className="flex flex-wrap gap-gap">
          <Mark name="select">
            <Select aria-label="Shop" prefix="Shop" value={shop} onValueChange={setShop} options={SHOPS.slice(0, 4).map((s) => ({ value: s, label: s }))} />
          </Mark>
          <Mark name="multi-select">
            <MultiSelect aria-label="Status" value={st} onValueChange={setSt} placeholder="Status" options={["Paid", "Packed", "Shipped", "Unpaid"].map((s) => ({ value: s, label: s }))} />
          </Mark>
        </div>
        <div className="flex flex-wrap items-center gap-gap">
          <Mark name="period-stepper">
            <PeriodStepper value={d} period={range === "month" ? "month" : range === "day" ? "day" : "week"} onValueChange={setD} max={NOW} />
          </Mark>
          <Mark name="segmented">
            <Segmented
              aria-label="Period"
              value={range}
              onValueChange={setRange}
              options={[
                { value: "day", label: "Day" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
              ]}
            />
          </Mark>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-px">
        {ORDERS.filter((o) => o.items.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 4)
          .map((o) => (
            <div key={o.id} className="flex h-row items-center gap-3 rounded-item px-2 text-body hover:bg-fill">
              <Thumb alt={o.items} size={24} />
              <span className="min-w-0 flex-1 truncate">{o.items}</span>
              <span className="shrink-0 tabular-nums text-ink-muted">{o.id}</span>
            </div>
          ))}
      </div>
    </Tile>
  );
}

function CheckoutTile({ className }: { className?: string }) {
  const [print, setPrint] = React.useState(true);
  const [round, setRound] = React.useState(false);
  const [disc, setDisc] = React.useState(15);
  return (
    <Tile className={className}>
      <Head title="Checkout" />
      <Mark name="switch" className="grid grid-cols-1 gap-px">
        {(
          [
            ["Print receipts", print, setPrint],
            ["Round cash totals", round, setRound],
          ] as const
        ).map(([l, v, s]) => (
          <label key={l} className="flex h-row cursor-pointer items-center justify-between gap-3 rounded-item px-2 text-body hover:bg-fill">
            {l}
            <Switch checked={v} onCheckedChange={s} />
          </label>
        ))}
      </Mark>
      <div className="grid gap-4 px-2 sm:grid-cols-2">
        <Mark name="checkbox" className="grid content-start gap-2.5">
          <span className="text-body text-ink-muted">Show</span>
          <CheckboxField label="Unpaid" defaultChecked />
          <CheckboxField label="To pack" defaultChecked />
          <CheckboxField label="Cancelled" />
        </Mark>
        <Mark name="radio" className="grid content-start gap-2.5">
          <span className="text-body text-ink-muted">Courier</span>
          <RadioGroup defaultValue="jne">
            <Radio value="jne" label="JNE Regular" />
            <Radio value="sicepat" label="SiCepat" />
            <Radio value="pickup" label="Pick up" />
          </RadioGroup>
        </Mark>
      </div>
      <Mark name="slider" className="mx-2 mt-auto">
        <Slider label="Member discount" value={disc} min={0} max={50} onValueChange={setDisc} display={`${disc}%`} />
      </Mark>
    </Tile>
  );
}

/* ------------------------------------------------------------ Display */

function TableTile({ className }: { className?: string }) {
  const [chip, setChip] = React.useState("all");
  const [sel, setSel] = React.useState<string | null>(ORDERS[1].id);
  const [page, setPage] = React.useState(1);
  const rows = ORDERS.filter((o) => chip === "all" || o.status === chip).slice(0, 6);
  return (
    <Tile className={className}>
      <div className="flex min-h-control flex-wrap items-center gap-gap px-2 pt-1">
        <h3 className="mr-auto text-title font-semibold">Orders</h3>
        <Mark name="status" className="flex flex-wrap items-center gap-1">
          {[
            ["all", "All"],
            ["Unpaid", "Unpaid"],
            ["Paid", "To pack"],
            ["Shipped", "Shipped"],
          ].map(([k, l]) => (
            <Chip key={k} selected={chip === k} onClick={() => setChip(k)}>
              {l}
            </Chip>
          ))}
        </Mark>
      </div>
      <Mark name="table" className="flex-1">
        <Table>
          <THead>
            <tr>
              <TH>Order</TH>
              <TH>Time</TH>
              <TH>Items</TH>
              <TH>Status</TH>
              <TH align="right">Total</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((o, i) => (
              <TRow key={o.id} selected={sel === o.id} onActivate={() => setSel(o.id)}>
                <TD>{o.id}</TD>
                <TD className="text-ink-muted">{smartTime(o.at)}</TD>
                <TD maxWidth={240}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    {i === 0 ? (
                      <Mark name="thumb" className="shrink-0">
                        <Thumb alt={o.items} size={24} />
                      </Mark>
                    ) : (
                      <Thumb alt={o.items} size={24} />
                    )}
                    <span className="truncate">{o.items}</span>
                  </span>
                </TD>
                <TD>
                  <Status tone={tone(o)}>{o.status}</Status>
                </TD>
                <TD align="right">{formatRp(o.total)}</TD>
              </TRow>
            ))}
          </TBody>
        </Table>
        <TableBar page={page} total={1240} onPageChange={setPage} className="mt-1" />
      </Mark>
    </Tile>
  );
}

function NumbersStack({ className }: { className?: string }) {
  return (
    <div className={cn(stack, "lg:grid-rows-[auto_1fr]", className)}>
      <Mark name="metric-card" className="grid grid-cols-2 gap-4">
        <MetricCard variant="scale" label="Orders" value={312} delta={{ value: "3,1%", direction: "down" }} className="w-full" />
        <MetricCard variant="scale" label="Cancelled" value={4} className="w-full" />
      </Mark>
      <Tile>
        <Head title="Last 30 days" />
        <Mark name="bar-chart" className="mx-2 mt-auto">
          <BarChart data={DAILY} current={29} labelEvery={5} height={120} aria-label="Sales, last 30 days" />
        </Mark>
      </Tile>
    </div>
  );
}

function ShopCardTile({ className }: { className?: string }) {
  return (
    <Mark name="card" className={cn("flex", className)}>
      <Card interactive className="flex flex-1 flex-col gap-3">
        <CardHeader title="Kemang" action={<Status>Open</Status>} />
        <div className="grid gap-1.5 text-body">
          <div className="flex justify-between gap-3">
            <span className="text-ink-muted">Sales today</span>
            <span className="whitespace-nowrap tabular-nums">{formatRp(12400000)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-ink-muted">Orders</span>
            <span className="tabular-nums">84</span>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-body text-ink-muted">On shift</span>
          <Mark name="avatar" className="flex items-center gap-1.5">
            <Avatar name={TEAM[1].name} size="sm" />
            <Avatar name={TEAM[2].name} size="sm" />
          </Mark>
        </div>
      </Card>
    </Mark>
  );
}

function LowStockTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Head
        title="Low stock"
        action={
          <Mark name="badge">
            <Badge>4</Badge>
          </Mark>
        }
      />
      <Mark name="attention-list">
        <AttentionList>
          {PRODUCTS.filter((p) => p.stock < 4)
            .slice(0, 3)
            .map((p) => (
              <AttentionItem key={p.sku} media={<Thumb alt={p.name} />} title={p.name} meta={p.sku} value={p.stock === 0 ? "Out" : `${p.stock} left`} onClick={say(p.name)} />
            ))}
        </AttentionList>
      </Mark>
    </Tile>
  );
}

function AlertsTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Mark name="alert" className="grid gap-2">
        <Alert tone="attention" title="2 shops haven’t synced" action={<Button size="sm">Sync</Button>} />
        <Alert tone="danger" title="Payout failed">
          The bank rejected the account number.
        </Alert>
      </Mark>
      <Mark name="progress" className="mx-2 mt-auto grid gap-2 pb-1 text-body">
        <div className="flex justify-between gap-3">
          <span>Adding up 1.240 sales</span>
          <span className="tabular-nums text-ink-muted">64%</span>
        </div>
        <Progress value={64} aria-label="Import" />
      </Mark>
    </Tile>
  );
}

function EmptyLoadingStack({ className }: { className?: string }) {
  return (
    <div className={cn(stack, className)}>
      <Tile>
        <Mark name="skeleton" className="flex items-center gap-3 px-1 py-1">
          <Loading loading>
            <Avatar name="Rizky Hartono" />
          </Loading>
          <div className="grid min-w-0 flex-1 gap-1">
            <span className="text-body">
              <LoadingText loading>Rizky Hartono</LoadingText>
            </span>
            <Skeleton className="h-3 w-20" />
          </div>
        </Mark>
      </Tile>
      <Tile className="justify-center">
        <Mark name="empty-state">
          <EmptyState icon={Inbox} title="No returns yet" className="py-4" />
        </Mark>
      </Tile>
    </div>
  );
}

/* ------------------------------------------------------------ Overlays, opened in place */

/** A small page behind an overlay: a few order rows, dimmed by the overlay that sits on it. */
function DialogTile({ className }: { className?: string }) {
  const [reason, setReason] = React.useState("stock");
  return (
    <Tile className={className}>
      <Mark name="dialog" className="flex flex-1">
        <div className={frame}>
          <BackPage />
          <div className="absolute inset-0 bg-overlay" />
          <div className="absolute inset-x-3 top-1/2 mx-auto grid max-w-[380px] -translate-y-1/2 gap-4 rounded-sheet bg-surface p-pad shadow-dialog">
            <div className="flex min-h-control items-center justify-between gap-3">
              <span className="text-title font-semibold">Cancel order RMB-24817?</span>
              <Button variant="ghost" icon aria-label="Close" className="-mr-1">
                <X />
              </Button>
            </div>
            <Field label="Reason">
              <Select value={reason} onValueChange={setReason} options={[{ value: "stock", label: "Out of stock" }, { value: "buyer", label: "Buyer asked" }]} className="w-full" />
            </Field>
            <div className="flex flex-wrap justify-end gap-gap">
              <Button variant="ghost">Keep order</Button>
              <Button variant="primary" onClick={() => toast("Order cancelled")}>
                Cancel order
              </Button>
            </div>
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

function SheetTile({ className }: { className?: string }) {
  const o = ORDERS[0];
  return (
    <Tile className={className}>
      <Mark name="sheet" className="flex flex-1">
        <div className={frame}>
          <BackPage />
          <div className="absolute inset-0 bg-overlay" />
          <div className="absolute bottom-2 right-2 top-2 flex w-[min(300px,calc(100%-48px))] flex-col rounded-sheet bg-surface shadow-dialog">
            <div className="flex min-h-control items-center justify-between gap-3 px-pad pt-pad">
              <span className="truncate text-title font-semibold">{o.id}</span>
              <Button variant="ghost" icon aria-label="Close" className="-mr-1">
                <X />
              </Button>
            </div>
            <div className="grid min-h-0 flex-1 content-start gap-2 overflow-hidden px-pad py-3 text-body">
              {[
                ["Time", smartTime(o.at)],
                ["Shop", o.shop],
                ["Customer", o.customer],
                ["Payment", o.payment],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <span className="text-ink-muted">{k}</span>
                  <span className="truncate">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 px-pad pb-pad">
              <Button variant="primary" onClick={() => toast("Marked as packed")}>
                Mark as packed
              </Button>
            </div>
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

function PopoverTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Mark name="popover" className="grid justify-items-start gap-1.5 px-1">
        <Popover trigger={<Button className="bg-fill-strong">Filter</Button>}>
          <div className="grid w-56 gap-2.5">
            <CheckboxField label="Unpaid" defaultChecked />
            <CheckboxField label="To pack" defaultChecked />
            <CheckboxField label="Shipped" />
          </div>
        </Popover>
        <div className="w-full max-w-60 rounded-card bg-raised p-[calc(var(--ad-nest)*2)] text-ink shadow-raised">
          <div className="grid gap-2.5">
            <CheckboxField label="Unpaid" defaultChecked />
            <CheckboxField label="To pack" defaultChecked />
            <CheckboxField label="Shipped" />
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

function TooltipTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Mark name="tooltip" className="flex items-center gap-1 px-1 pt-11">
        <Tooltip content="Copy order number">
          <Button variant="ghost" icon aria-label="Copy order number">
            <Copy />
          </Button>
        </Tooltip>
        <span className="relative">
          <span aria-hidden className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-item bg-on px-2.5 py-1.5 text-small text-on-ink shadow-raised">
            Print packing slip
          </span>
          <Tooltip content="Print packing slip">
            <Button icon className="bg-fill-strong" aria-label="Print packing slip" onClick={say("Printing")}>
              <Printer />
            </Button>
          </Tooltip>
        </span>
          <Tooltip content="Book a courier">
            <Button variant="ghost" icon aria-label="Book a courier">
              <Truck />
            </Button>
          </Tooltip>
          <Tooltip content="Share">
            <Button variant="ghost" icon aria-label="Share">
              <Share2 />
            </Button>
          </Tooltip>
      </Mark>
      <div className="mt-auto flex h-row items-center gap-3 rounded-item bg-fill px-2.5 text-body">
        <span className="shrink-0">RMB-24816</span>
        <span className="min-w-0 flex-1 truncate text-ink-muted">{ORDERS[1].items}</span>
      </div>
    </Tile>
  );
}

function ToastTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Mark name="toast" className="grid content-start justify-items-start gap-2 px-1">
        <ToastView>Changes saved</ToastView>
        <ToastView tone="neutral">Copied RMB-24817</ToastView>
      </Mark>
      <div className="mt-auto flex flex-wrap gap-gap px-1">
        <Button variant="primary" onClick={() => toast("Changes saved")}>
          Save
        </Button>
        <Button onClick={() => toast("Copied RMB-24817", "neutral")}>Copy link</Button>
      </div>
    </Tile>
  );
}

/* ------------------------------------------------------------ Layout */

function DesktopShellTile({ className }: { className?: string }) {
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

function PhoneShellTile({ className }: { className?: string }) {
  const [at, setAt] = React.useState("Orders");
  return (
    <Card inset="none" className={cn("relative min-h-[384px] min-w-0 overflow-hidden [transform:translateZ(0)]", className)}>
      <div className="grid gap-nest p-[calc(var(--ad-nest)*2)] pb-24">
        <CardHeader title="To pack" action={<Badge>3</Badge>} className="px-2 pt-1" />
        {ORDERS.slice(0, 4).map((o) => (
          <div key={o.id} className="flex items-center gap-2.5 rounded-item bg-fill px-2.5 py-2">
            <Thumb alt={o.items} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body">{o.items}</p>
              <p className="text-small tabular-nums text-ink-muted">{o.id}</p>
            </div>
          </div>
        ))}
      </div>
      <Mark name="bottom-nav" className="absolute inset-x-3 bottom-3">
        <BottomNav className="relative inset-auto bottom-auto">
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
      </Mark>
    </Card>
  );
}

/* ------------------------------------------------------------ Niche */

const NOTICES: Notice[] = [
  { id: "1", title: "2 shops haven’t synced since 09:40", time: "Today, 10:10", unread: true },
  { id: "2", title: "Payout of Rp 12.840.000 sent", time: "Today, 08:02", unread: true },
  { id: "3", title: "Keranjang pandan besar is out of stock", time: "Yesterday, 19:45" },
];

const PAYOUT_COLS = [
  { key: "shop", label: "Shop", locked: true },
  { key: "expected", label: "Expected" },
  { key: "counted", label: "Counted" },
  { key: "trend", label: "Trend" },
  { key: "diff", label: "Difference", locked: true },
];

function PayoutsTile({ className }: { className?: string }) {
  const [shops, setShops] = React.useState(MARKET_SHOPS.map((s) => s.id));
  const [range, setRange] = React.useState<DateRange>(DEFAULT_PRESETS[2].range(NOW));
  const [channels, setChannels] = React.useState(["offline", "shopee", "tiktok"]);
  const [cols, setCols] = React.useState(["expected", "counted", "trend"]);
  const [notices, setNotices] = React.useState(NOTICES);
  const on = (k: string) => cols.includes(k);
  const rows: ["offline" | "shopee" | "tiktok", string, number, number, number[]][] = [
    ["offline", "Kemang", 12400000, 12400000, SPARK],
    ["offline", "Senopati", 9800000, 9812000, [9, 11, 10, 9, 12, 11, 10, 9, 11, 10, 12, 11]],
    ["offline", "Dago", 7100000, 7085500, [14, 13, 12, 12, 11, 10, 11, 9, 9, 8, 8, 7]],
    ["shopee", "Rimba Official", 8900000, 8900000, [6, 7, 9, 8, 10, 12, 11, 13, 12, 14, 15, 16]],
    ["tiktok", "Rimba Live", 4800000, 4796000, [3, 4, 4, 6, 5, 7, 8, 7, 9, 10, 9, 11]],
  ];
  return (
    <Tile className={className}>
      <div className="flex min-h-control items-center justify-between gap-2 px-2 pt-1">
        <h3 className="text-title font-semibold">Payout check</h3>
        <Mark name="notification-bell">
          <NotificationBell notices={notices} onMarkAllRead={() => setNotices(notices.map((n) => ({ ...n, unread: false })))} />
        </Mark>
      </div>
      <div className="flex flex-wrap items-center gap-gap px-2">
        <Mark name="shop-picker">
          <ShopPicker shops={MARKET_SHOPS} value={shops} onValueChange={setShops} />
        </Mark>
        <Mark name="date-range-picker">
          <DateRangePicker value={range} onValueChange={setRange} today={NOW} />
        </Mark>
        <Mark name="toggle-group">
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
        </Mark>
        <span className="flex-1" />
        <Mark name="column-menu">
          <ColumnMenu columns={PAYOUT_COLS} visible={cols} onVisibleChange={setCols} defaults={["expected", "counted", "trend"]} />
        </Mark>
      </div>
      <Mark name="context-menu" className="flex-1">
        <Table>
          <THead>
            <tr>
              <TH>Shop</TH>
              {on("expected") ? <TH align="right">Expected</TH> : null}
              {on("counted") ? <TH align="right">Counted</TH> : null}
              {on("trend") ? <TH>Trend</TH> : null}
              <TH align="right">Difference</TH>
            </tr>
          </THead>
          <TBody>
            {rows
              .filter(([m]) => channels.includes(m))
              .map(([m, s, e, c, d], i) => (
                <ContextMenu
                  key={s}
                  menu={
                    <>
                      <ContextMenuItem icon={Edit2} onSelect={say(`Recount ${s}`)}>
                        Recount
                      </ContextMenuItem>
                      <ContextMenuItem icon={Copy} onSelect={say("Copied")}>
                        Copy amount
                      </ContextMenuItem>
                      <ContextMenuSub icon={Folder} label="Mark as">
                        <ContextMenuItem>Checked</ContextMenuItem>
                        <ContextMenuItem>Needs review</ContextMenuItem>
                      </ContextMenuSub>
                      <ContextMenuGroup>
                        <ContextMenuItem icon={Trash2}>Clear count</ContextMenuItem>
                      </ContextMenuGroup>
                    </>
                  }
                >
                  <TRow onActivate={() => {}}>
                    <TD>
                      <span className="flex items-center gap-2.5">
                        {i === 3 ? (
                          <Mark name="marketplace-mark" className="shrink-0">
                            <MarketMark market={m} />
                          </Mark>
                        ) : (
                          <MarketMark market={m} />
                        )}
                        {s}
                      </span>
                    </TD>
                    {on("expected") ? <TD align="right">{formatRp(e)}</TD> : null}
                    {on("counted") ? <TD align="right">{formatRp(c)}</TD> : null}
                    {on("trend") ? (
                      <TD>
                        {i === 0 ? (
                          <Mark name="sparkline" className="w-fit">
                            <Sparkline data={d} width={72} height={20} aria-label={`${s}, last 12 weeks`} />
                          </Mark>
                        ) : (
                          <Sparkline data={d} width={72} height={20} aria-label={`${s}, last 12 weeks`} />
                        )}
                      </TD>
                    ) : null}
                    <TD align="right">
                      {i === 1 ? (
                        <Mark name="diff" className="ml-auto w-fit">
                          <Diff value={c - e} unit="Rp" />
                        </Mark>
                      ) : (
                        <Diff value={c - e} unit="Rp" />
                      )}
                    </TD>
                  </TRow>
                </ContextMenu>
              ))}
          </TBody>
        </Table>
      </Mark>
    </Tile>
  );
}

function PaletteTile({ className }: { className?: string }) {
  return (
    <div className={cn(stack, "lg:grid-rows-[1fr_auto] [&>*:last-child]:h-auto", className)}>
      <Mark name="command-palette" className="flex">
        <CommandPalette
          inline
          className="min-w-0 flex-1 shadow-card"
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
                { id: "orders", label: "Orders", icon: ShoppingBag, onSelect: say("Orders") },
                { id: "settings", label: "Settings", icon: Settings, shortcut: ["mod", ","], onSelect: say("Settings") },
              ],
            },
          ]}
        />
      </Mark>
      <Tile className="flex-row items-center justify-between px-3">
        <Mark name="kbd" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            Move
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>Esc</Kbd>
            Close
          </span>
        </Mark>
      </Tile>
    </div>
  );
}

function OrderTile({ className }: { className?: string }) {
  const [time, setTime] = React.useState<string | null>("16:00");
  const lines = [
    { payer: "buyer" as const, label: "Items, 2 × Gelas kopi", amount: 178000 },
    { payer: "buyer" as const, label: "Shipping", amount: 18000, shipping: true },
    { payer: "platform" as const, label: "Admin fee 4,5%", amount: -8010 },
    { payer: "shop" as const, label: "Voucher RIMBA10", amount: -17800 },
  ];
  return (
    <Tile className={className}>
      <div className="flex min-h-control items-center justify-between gap-2 px-2 pt-1">
        <h3 className="text-title font-semibold">Order</h3>
        <Mark name="copy-chip">
          <CopyChip value="RMB-24812" />
        </Mark>
      </div>
      <Mark name="steps" className="mx-2">
        <Steps steps={["Paid", "Packed", "Shipped", "Delivered"]} current={2} />
      </Mark>
      <Mark name="fee-row" className="grid grid-cols-1 gap-px">
        {lines.map((l) => (
          <FeeRow key={l.label} market="shopee" {...l} />
        ))}
        <FeeTotal label="You receive" amount={lines.reduce((a, l) => a + l.amount, 0)} className="mt-1" />
      </Mark>
      <div className="flex items-center justify-between gap-3 px-2">
        <span className="text-body text-ink-muted">Courier pickup</span>
        <Mark name="time-picker">
          <TimePicker value={time} onValueChange={setTime} />
        </Mark>
      </div>
    </Tile>
  );
}

function NotesTile({ className }: { className?: string }) {
  const o = ORDERS[3];
  return (
    <Tile className={className}>
      <Head
        title="Notes"
        action={
          <Mark name="avatar-group">
            <AvatarGroup people={[...TEAM, { name: "Wulan Sari" }]} max={3} size="sm" />
          </Mark>
        }
      />
      <Mark name="hover-card" className="mx-2">
        <p className="text-body text-ink-muted">
          For{" "}
          <HoverCard
            trigger={
              <a href="#customer" onClick={(e) => e.preventDefault()} className="rounded-small font-medium text-ink hover:bg-fill">
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
          , {o.id}
        </p>
      </Mark>
      <Mark name="comment-thread" className="mx-1">
        <CommentsDemo />
      </Mark>
    </Tile>
  );
}

function ProductTile({ className }: { className?: string }) {
  const [files, setFiles] = React.useState<DropFile[]>([
    { id: "a", name: "gelas-kopi-hijau.jpg", size: 1840000 },
    { id: "b", name: "gelas-kopi-set.jpg", size: 2310000, progress: 64 },
  ]);
  const [tags, setTags] = React.useState(["Keramik", "Handmade"]);
  const [price, setPrice] = React.useState<number | null>(89000);
  const [stock, setStock] = React.useState(2);
  return (
    <Tile className={className}>
      <Head title="Gelas kopi tanah liat" />
      <Mark name="dropzone">
        <Dropzone
          title="Drop product photos"
          accept="image/*"
          files={files}
          onRemove={(id) => setFiles(files.filter((f) => f.id !== id))}
          onFiles={(fs) => setFiles([...files, ...fs.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size }))])}
        />
      </Mark>
      <Mark name="tag-input">
        <TagInput aria-label="Tags" value={tags} onValueChange={setTags} suggestions={["Rotan", "Kayu jati", "Bambu", "Best seller"]} />
      </Mark>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-gap px-1">
        <Mark name="currency-input">
          <CurrencyInput aria-label="Price" value={price} onValueChange={setPrice} className="w-40" />
        </Mark>
        <Mark name="quantity-stepper">
          <QuantityStepper aria-label="Stock" value={stock} onValueChange={setStock} min={0} max={99} />
        </Mark>
      </div>
    </Tile>
  );
}

const add = (n: number) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + n);
const EVENTS: CalendarEvent[] = [
  { id: "a", date: add(-12), title: "Payday sale", tone: "accent" },
  { id: "b", date: add(-9), title: "Stock count" },
  { id: "c", date: add(-2), title: "Restock rotan" },
  { id: "d", date: NOW, title: "11.11 payout" },
  { id: "e", date: NOW, title: "Team sync" },
  { id: "g", date: add(4), title: "12.12 sale prep", tone: "accent" },
  { id: "h", date: add(9), title: "Tax filing" },
];

function CalendarTile({ className }: { className?: string }) {
  const [m, setM] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  return (
    <Tile className={className}>
      <Mark name="calendar-month" className="flex-1">
        <CalendarMonth month={m} onMonthChange={setM} events={EVENTS} today={NOW} onEventClick={(e) => toast(e.title, "neutral")} />
      </Mark>
    </Tile>
  );
}

function PackStack({ className }: { className?: string }) {
  const card = (o: Order, i: number) => (
    <KanbanCard key={o.id} title={o.items} id={o.id} media={<Thumb alt={o.items} />} tags={[o.shop]} people={[{ name: TEAM[i % 4].name }]} due={i === 0 ? "Today" : "Tomorrow"} attention={i === 0} onClick={say(o.id)} />
  );
  return (
    <div className={cn(stack, "lg:grid-rows-[1fr_auto] [&>*:last-child]:h-auto", className)}>
      <Tile>
        <div className="flex min-h-control items-center justify-between gap-2 pl-2">
          <h3 className="text-title font-semibold">Packing</h3>
          <Mark name="split-button">
            <SplitButton
              onClick={() => toast("3 orders packed")}
              menu={
                <>
                  <MenuItem icon={Printer} onSelect={say("Printing slips")}>
                    Pack and print slips
                  </MenuItem>
                  <MenuItem icon={Truck} onSelect={say("Courier booked")}>
                    Pack and book courier
                  </MenuItem>
                </>
              }
            >
              <Box />
              Pack 3 orders
            </SplitButton>
          </Mark>
        </div>
        <Mark name="kanban-card" className="flex flex-1">
          <KanbanColumn title="To pack" count={3} className="flex-1">
            {card(ORDERS[1], 0)}
            {card(ORDERS[3], 1)}
            {card(ORDERS[7], 2)}
          </KanbanColumn>
        </Mark>
      </Tile>
      <Tile>
        <Mark name="progress-ring" className="grid grid-cols-3 gap-2">
          {(
            [
              ["shopee", "Shopee", 100],
              ["tiktok", "TikTok", 72],
              ["tokopedia", "Tokopedia", 38],
            ] as const
          ).map(([mk, l, v]) => (
            <div key={mk} className="grid justify-items-center gap-2 rounded-item bg-fill py-3">
              <ProgressRing value={v} size={56} aria-label={`${l} synced`} label={`${v}%`} />
              <span className="flex items-center gap-1.5 text-small">
                <MarketMark market={mk} size={14} />
                {l}
              </span>
            </div>
          ))}
        </Mark>
      </Tile>
    </div>
  );
}

function PricesTile({ className }: { className?: string }) {
  const [rows, setRows] = React.useState(PRODUCTS.slice(0, 5).map((p) => ({ ...p })));
  return (
    <Tile className={className}>
      <Head title="Prices" />
      <Mark name="inline-edit" className="flex-1">
        <Table>
          <THead>
            <tr>
              <TH>Product</TH>
              <TH align="right">Price</TH>
              <TH align="right">Stock</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r, i) => (
              <TRow key={r.sku}>
                <TD maxWidth={200}>{r.name}</TD>
                <TD align="right" className="sm:w-36">
                  <InlineEdit
                    align="right"
                    aria-label={`${r.name} price`}
                    inputMode="numeric"
                    value={String(r.price)}
                    display={(v) => formatRp(Number(v))}
                    validate={(v) => (/^\d+$/.test(v.replace(/\./g, "")) ? null : "Numbers only")}
                    onSave={(v) => (setRows(rows.map((x, j) => (j === i ? { ...x, price: Number(v.replace(/\./g, "")) } : x))), toast("Price saved"))}
                  />
                </TD>
                <TD align="right" className="sm:w-24">
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
            ))}
          </TBody>
        </Table>
      </Mark>
    </Tile>
  );
}

function ShipmentTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Head title="Shipment" action={<Status>Shipped</Status>} />
      <Mark name="timeline">
        <Timeline
          events={[
            { id: "1", time: "Today, 14:05", title: "Picked up by JNE", media: <Truck /> },
            { id: "2", time: "Today, 11:40", title: `Packed by ${TEAM[3].name}`, media: <Box /> },
            { id: "3", time: "Today, 09:12", title: "Paid with QRIS", detail: formatRp(434000) },
            { id: "4", time: "Yesterday, 21:30", title: "Ordered on Shopee", media: <MarketMark market="shopee" /> },
            { id: "5", time: "Yesterday, 21:28", title: "Buyer asked about the glaze", media: <User /> },
          ]}
        />
      </Mark>
    </Tile>
  );
}

/* ------------------------------------------------------------ the page */

const BASE_TILES: Record<Exclude<Group, "Charts" | "Navigation" | "Chat">, TileDef[]> = {
  Foundations: [
    { items: ["corner-shape"], render: (c) => <CornerTile config={c} className={S[8]} /> },
    { items: ["scrollbar"], render: () => <ScrollTile className={S[4]} /> },
  ],
  Actions: [
    { items: ["toolbar", "button"], render: () => <OrdersActionsTile className={S[8]} /> },
    {
      items: ["menu", "save-bar"],
      render: () => (
        <div className={cn(stack, "md:col-span-2 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-[auto_1fr]")}>
          <MenuOpenTile />
          <SaveTile />
        </div>
      ),
    },
  ],
  Inputs: [
    { items: ["language-picker", "combobox", "field", "input", "date-picker"], render: () => <NewOrderTile className={S[4]} /> },
    { items: ["tabs", "search", "select", "multi-select", "period-stepper", "segmented"], render: () => <FindTile className={S[4]} /> },
    { items: ["switch", "checkbox", "radio", "slider"], render: () => <CheckoutTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
  ],
  Display: [
    { items: ["status", "table", "thumb"], render: () => <TableTile className={S[8]} /> },
    { items: ["metric-card", "bar-chart"], render: () => <NumbersStack className="md:col-span-2 lg:col-span-4" /> },
    { items: ["card", "avatar"], render: () => <ShopCardTile className={S[3]} /> },
    { items: ["badge", "attention-list"], render: () => <LowStockTile className={S[3]} /> },
    { items: ["alert", "progress"], render: () => <AlertsTile className={S[3]} /> },
    { items: ["skeleton", "empty-state"], render: () => <EmptyLoadingStack className={S[3]} /> },
  ],
  Overlays: [
    { items: ["dialog"], render: () => <DialogTile className={S[6]} /> },
    { items: ["sheet"], render: () => <SheetTile className={S[6]} /> },
    { items: ["popover"], render: () => <PopoverTile className={S[4]} /> },
    { items: ["tooltip"], render: () => <TooltipTile className={S[4]} /> },
    { items: ["toast"], render: () => <ToastTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
  ],
  Layout: [
    { items: ["sidebar"], render: () => <DesktopShellTile className={S[8]} /> },
    { items: ["bottom-nav"], render: () => <PhoneShellTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
  ],
  Niche: [
    { items: ["notification-bell", "shop-picker", "date-range-picker", "toggle-group", "column-menu", "context-menu", "marketplace-mark", "sparkline", "diff"], render: () => <PayoutsTile className={S[8]} /> },
    { items: ["command-palette", "kbd"], render: () => <PaletteTile className="md:col-span-2 lg:col-span-4" /> },
    { items: ["copy-chip", "steps", "fee-row", "time-picker"], render: () => <OrderTile className={S[4]} /> },
    { items: ["avatar-group", "hover-card", "comment-thread"], render: () => <NotesTile className={S[4]} /> },
    { items: ["dropzone", "tag-input", "currency-input", "quantity-stepper"], render: () => <ProductTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
    { items: ["calendar-month"], render: () => <CalendarTile className={S[8]} /> },
    { items: ["split-button", "kanban-card", "progress-ring"], render: () => <PackStack className="md:col-span-2 lg:col-span-4" /> },
    { items: ["inline-edit"], render: () => <PricesTile className={S[6]} /> },
    { items: ["timeline"], render: () => <ShipmentTile className={S[6]} /> },
  ],
  AI: [],
  Backgrounds: [],
};

/** Each category's tiles: the originals, then the shadcn-parity ones (showcase-more.tsx). */
const TILES = Object.fromEntries(GROUPS.map((g) => [g, [...((BASE_TILES as Partial<Record<Group, TileDef[]>>)[g] ?? []), ...(MORE_TILES[g] ?? [])]])) as Record<Group, TileDef[]>;

/** Every component's name, once, from the tiles (the coverage check compares it with the registry). */
export const SHOWN = Object.values(TILES).flatMap((ts) => ts.flatMap((t) => t.items));

/** The Components page body: a band of tiles per category, filtered by `query` (a tile shows if any part matches). */
export function ComponentBento({ query }: { query: string }) {
  const [config] = useConfig();
  const q = query.trim().toLowerCase();
  const match = (name: string) => {
    const i = findItem(name);
    return !q || name.includes(q) || !!i?.title.toLowerCase().includes(q);
  };
  const groups = GROUPS.map((g) => ({ g, tiles: TILES[g].filter((t) => t.items.some(match)) })).filter((x) => x.tiles.length);
  return (
    <div className="grid gap-10" data-components={COMPONENT_ITEMS.filter((i) => i.showcase !== false).map((i) => i.name).join(",")}>
      {groups.length === 0 ? <EmptyState icon={SearchIcon} title="No component by that name" /> : null}
      {groups.map(({ g, tiles }) => (
        <section key={g} aria-label={g} data-group={g} className="grid gap-3">
          <h2 className="text-title font-semibold text-ink">{g}</h2>
          <div className="grid grid-flow-row-dense grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
            {tiles.map((t) => (
              <React.Fragment key={t.items.join()}>{t.render(config)}</React.Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
