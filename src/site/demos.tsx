/* eslint-disable react-hooks/rules-of-hooks */
import * as React from "react";
import {
  Archive,
  Bell,
  Box,
  Copy,
  Edit2,
  Folder,
  Grid,
  Home,
  Inbox,
  Layers,
  Package,
  Plus,
  Search as SearchIcon,
  Settings,
  Share2,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  Users,
  XCircle,
  Mail,
  Tag,
  BarChart2,
} from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { PeriodStepper, type Period } from "@/components/ui/period-stepper";
import { LanguagePicker } from "@/components/ui/language-picker";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, MetricCard, type MetricVariant } from "@/components/ui/card";
import { Table, TableBar, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { BarChart, BarList } from "@/components/ui/bar-chart";
import { Chip, Pill, Status } from "@/components/ui/status";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Thumb } from "@/components/ui/thumb";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading, LoadingText, Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { Menu, MenuGroup, MenuItem, MenuLabel, MenuSub } from "@/components/ui/menu";
import { Toolbar, ToolbarSpacer, PageHeader } from "@/components/ui/toolbar";
import { SaveBar } from "@/components/ui/save-bar";
import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar";
import { BottomNav, BottomNavItem } from "@/components/ui/bottom-nav";
import { DAILY, NOW, ORDERS, PRODUCTS, SHOPS, TEAM, smartTime } from "./data";
import { radii, squircleCompensation, type Config } from "@/lib/config";
import { shapedSupported } from "./config";
import { NICHE_DEMOS } from "./demos-niche";
import { MORE_DEMOS } from "./demos-more";
import { CopyChip } from "@/components/ui/copy-chip";
import { Steps } from "@/components/ui/steps";
import { FeeRow, FeeTotal } from "@/components/ui/fee-row";
import { Timeline } from "@/components/ui/timeline";

export type Control =
  | { key: string; type: "select"; label: string; options: string[]; labels?: string[]; default: string }
  | { key: string; type: "toggle"; label: string; default: boolean };

export type Props = Record<string, string | boolean>;

export interface Demo {
  controls?: Control[];
  /** "page" shows the preview on a tinted stage (for cards); "surface" on a white card. */
  stage?: "page" | "surface";
  render: (p: Props, config: Config) => React.ReactNode;
  usage: (p: Props) => string;
}

function ShapesCompare({ config }: { config: Config }) {
  const shapes: { key: Config["corner"]; label: string; css: string }[] = [
    { key: "square", label: "Square", css: "square" },
    { key: "round", label: "Round", css: "round" },
    { key: "squircle", label: "Squircle", css: config.smoothing === 2 ? "squircle" : `superellipse(${config.smoothing})` },
  ];
  // Same visual size: the squircle gets the compensation the components use, so its
  // corner sits where the round one's does instead of looking almost square.
  const r = Math.max(config.radius, 1) * 3;
  const comp = shapedSupported() ? squircleCompensation(config.smoothing) : 1;
  const radiusOf = (k: Config["corner"]) => (k === "square" ? 0 : k === "squircle" ? Math.min(96, Math.round(r * comp)) : r);
  return (
    <div className="grid w-full max-w-3xl grid-cols-3 gap-3 sm:gap-6">
      {shapes.map((s) => (
        <div key={s.key} className="grid justify-items-center gap-3">
          <div
            className="aspect-square w-full max-w-48 bg-brand transition-[border-radius] duration-[220ms] ease-ad"
            style={{ borderRadius: radiusOf(s.key), cornerShape: s.css } as React.CSSProperties}
          />
          <span className="text-body font-medium text-ink">{s.label}</span>
          <span className="text-small tabular-nums text-ink-muted">{`${radiusOf(s.key)} px`}</span>
        </div>
      ))}
    </div>
  );
}

function Concentric({ config }: { config: Config }) {
  const r = radii(config, shapedSupported());
  return (
    <div className="grid justify-items-center gap-3">
      <div className="rounded-card bg-fill p-nest">
        <Button variant="primary">Save changes</Button>
      </div>
      <span className="text-body tabular-nums text-ink-muted">
        {r.control} + {r.gap} = {r.card} px
      </span>
    </div>
  );
}

const orderRows = ORDERS.slice(0, 8);

export const DEMOS: Record<string, Demo> = {
  ...NICHE_DEMOS,
  ...MORE_DEMOS,
  "corner-shape": {
    stage: "surface",
    render: (_p, config) => (
      <div className="grid w-full justify-items-center gap-10">
        <ShapesCompare config={config} />
        <Concentric config={config} />
      </div>
    ),
    usage: () => `/* Set once on the page; every component follows. */\n:root {\n  --ad-corner: squircle;  /* square | round | squircle | superellipse(k) */\n  --ad-radius-control: 18px;\n}`,
  },
  scrollbar: {
    stage: "surface",
    render: () => (
      <div className="grid w-full max-w-lg gap-4">
        <div className="h-48 overflow-auto rounded-card bg-fill p-nest">
          <div className="grid w-[720px] gap-px">
            {ORDERS.slice(0, 18).map((o) => (
              <div key={o.id} className="flex h-row items-center gap-6 rounded-item px-2.5 text-body hover:bg-fill-strong">
                <span className="w-24">{o.id}</span>
                <span className="w-32 text-ink-muted">{smartTime(o.at)}</span>
                <span className="w-56 truncate">{o.items}</span>
                <span className="ml-auto tabular-nums">{formatRp(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    usage: () => `/* One thin, soft scrollbar for the whole app, both directions. It ships in the theme. */\n* { scrollbar-width: thin; scrollbar-color: var(--ad-scroll) transparent; }`,
  },
  button: {
    controls: [
      { key: "variant", type: "select", label: "Variant", options: ["primary", "secondary", "ghost"], default: "primary" },
      { key: "size", type: "select", label: "Size", options: ["default", "sm"], default: "default" },
      { key: "icon", type: "toggle", label: "Leading icon", default: true },
      { key: "disabled", type: "toggle", label: "Disabled", default: false },
    ],
    render: (p) => (
      <div className="grid justify-items-center gap-6">
        <Button variant={p.variant as never} size={p.size as never} disabled={!!p.disabled} onClick={() => toast("Order added")}>
          {p.icon ? <Plus /> : null}
          Add order
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" size={p.size as never}>
            Save
          </Button>
          <Button size={p.size as never}>Export</Button>
          <Button variant="ghost" size={p.size as never}>
            Cancel
          </Button>
          <Button icon size={p.size as never} aria-label="Copy">
            <Copy />
          </Button>
          <Button variant="ghost" icon size={p.size as never} aria-label="Share">
            <Share2 />
          </Button>
        </div>
      </div>
    ),
    usage: (p) =>
      `<Button variant="${p.variant}"${p.size === "sm" ? ` size="sm"` : ""}${p.disabled ? " disabled" : ""}>\n  ${p.icon ? "<Plus />\n  " : ""}Add order\n</Button>`,
  },
  menu: {
    controls: [
      { key: "tone", type: "select", label: "Tone", options: ["light", "dark"], default: "light" },
      { key: "safe", type: "toggle", label: "Show safe area", default: true },
    ],
    render: (p) => (
      <div className={cn("grid place-items-center rounded-card p-8", p.tone === "dark" && "bg-side")}>
        <Menu
          tone={p.tone as never}
          showSafeArea={!!p.safe}
          trigger={
            <Button variant={p.tone === "dark" ? "ghost" : "secondary"} className={p.tone === "dark" ? "text-side-ink hover:bg-side-fill" : ""}>
              Actions
            </Button>
          }
        >
          <MenuItem icon={Edit2} shortcut="E">
            Edit
          </MenuItem>
          <MenuItem icon={Copy} shortcut="D">
            Duplicate
          </MenuItem>
          <MenuSub icon={Folder} label="Move to">
            <MenuItem icon={Inbox}>To pack</MenuItem>
            <MenuItem icon={Truck}>Shipped</MenuItem>
            <MenuSub icon={Archive} label="Archive">
              <MenuItem>This month</MenuItem>
              <MenuItem>Older</MenuItem>
            </MenuSub>
          </MenuSub>
          <MenuSub icon={Share2} label="Share">
            <MenuItem icon={Mail}>Email</MenuItem>
            <MenuItem icon={Copy}>Copy link</MenuItem>
          </MenuSub>
          <MenuGroup>
            <MenuLabel>Danger</MenuLabel>
            <MenuItem icon={Trash2}>Delete</MenuItem>
          </MenuGroup>
        </Menu>
      </div>
    ),
    usage: (p) =>
      `<Menu${p.tone === "dark" ? ` tone="dark"` : ""} trigger={<Button>Actions</Button>}>\n  <MenuItem icon={Edit2}>Edit</MenuItem>\n  <MenuSub icon={Folder} label="Move to">\n    <MenuItem>To pack</MenuItem>\n    <MenuItem>Shipped</MenuItem>\n  </MenuSub>\n  <MenuGroup>\n    <MenuItem icon={Trash2}>Delete</MenuItem>\n  </MenuGroup>\n</Menu>`,
  },
  toolbar: {
    stage: "page",
    render: () => {
      const [q, setQ] = React.useState("");
      const [shop, setShop] = React.useState("all");
      const [range, setRange] = React.useState("week");
      return (
        <div className="grid w-full max-w-4xl gap-4">
          <PageHeader title="Orders">
            <Button>Export</Button>
            <Button variant="primary">
              <Plus />
              Add order
            </Button>
          </PageHeader>
          <Toolbar>
            <Search value={q} onValueChange={setQ} placeholder="Order or product" />
            <Select prefix="Shop" aria-label="Shop" value={shop} onValueChange={setShop} options={[{ value: "all", label: "All" }, ...SHOPS.map((s) => ({ value: s, label: s }))]} />
            <Popover trigger={<Button>Filter</Button>}>
              <div className="grid w-56 gap-2.5">
                <CheckboxField label="Unpaid" defaultChecked />
                <CheckboxField label="To pack" />
                <CheckboxField label="Shipped" />
              </div>
            </Popover>
            <Popover trigger={<Button>Columns</Button>}>
              <div className="grid w-56 gap-2.5">
                <CheckboxField label="Customer" defaultChecked />
                <CheckboxField label="Payment" defaultChecked />
                <CheckboxField label="Fee" />
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
        </div>
      );
    },
    usage: () =>
      `<PageHeader title="Orders">\n  <Button variant="primary"><Plus />Add order</Button>\n</PageHeader>\n<Toolbar>\n  <Search value={q} onValueChange={setQ} />\n  <Select prefix="Shop" value={shop} onValueChange={setShop} options={shops} />\n  <Popover trigger={<Button>Filter</Button>}>…</Popover>\n  <Popover trigger={<Button>Columns</Button>}>…</Popover>\n  <ToolbarSpacer />\n  <Segmented value={range} onValueChange={setRange} options={ranges} />\n</Toolbar>`,
  },
  "save-bar": {
    stage: "page",
    render: () => {
      const [dirty, setDirty] = React.useState(true);
      return (
        <div className="grid w-full max-w-md gap-4">
          <Card className="grid gap-3">
            <Field label="Shop name">
              <Input defaultValue="Rimba Kemang" onChange={() => setDirty(true)} />
            </Field>
          </Card>
          <SaveBar
            open={dirty}
            onDiscard={() => setDirty(false)}
            onSave={() => {
              setDirty(false);
              toast("Changes saved");
            }}
            className="static"
          />
        </div>
      );
    },
    usage: () => `<SaveBar open={dirty} onSave={save} onDiscard={reset} />`,
  },
  input: {
    controls: [
      { key: "icon", type: "toggle", label: "Icon", default: true },
      { key: "invalid", type: "toggle", label: "Invalid", default: false },
      { key: "multiline", type: "toggle", label: "Multiline", default: false },
    ],
    render: (p) => (
      <div className="w-full max-w-xs">
        {p.multiline ? (
          <Textarea placeholder="Note for the courier" invalid={!!p.invalid} />
        ) : (
          <Input placeholder="Customer email" icon={p.icon ? Mail : undefined} invalid={!!p.invalid} defaultValue={p.invalid ? "rina@" : ""} />
        )}
      </div>
    ),
    usage: (p) => (p.multiline ? `<Textarea placeholder="Note for the courier" />` : `<Input placeholder="Customer email"${p.icon ? " icon={Mail}" : ""}${p.invalid ? " invalid" : ""} />`),
  },
  search: {
    render: () => {
      const [q, setQ] = React.useState("Gelas");
      return <Search value={q} onValueChange={setQ} placeholder="Order or product" />;
    },
    usage: () => `const [q, setQ] = useState("");\n<Search value={q} onValueChange={setQ} placeholder="Order or product" />`,
  },
  field: {
    controls: [
      { key: "layout", type: "select", label: "Layout", options: ["stack", "row"], default: "stack" },
      { key: "error", type: "toggle", label: "Error", default: false },
    ],
    render: (p) => (
      <div className="grid w-full max-w-sm gap-4">
        <Field label="Shop name" layout={p.layout as never}>
          <Input defaultValue="Rimba Kemang" />
        </Field>
        <Field label="Phone" layout={p.layout as never} error={p.error ? "Use 10 to 13 digits, like 0812 3456 7890" : undefined}>
          <Input defaultValue={p.error ? "0812 34" : "0812 3456 7890"} invalid={!!p.error} />
        </Field>
      </div>
    ),
    usage: (p) => `<Field label="Phone"${p.layout === "row" ? ` layout="row"` : ""}${p.error ? ` error="Use 10 to 13 digits"` : ""}>\n  <Input />\n</Field>`,
  },
  select: {
    controls: [{ key: "prefix", type: "toggle", label: "Prefix", default: false }],
    render: (p) => {
      const [v, setV] = React.useState("Kemang");
      return <Select aria-label="Shop" prefix={p.prefix ? "Shop" : undefined} value={v} onValueChange={setV} options={SHOPS.map((s) => ({ value: s, label: s }))} />;
    },
    usage: (p) => `<Select${p.prefix ? ` prefix="Shop"` : ""} value={shop} onValueChange={setShop} options={shops} />`,
  },
  "multi-select": {
    render: () => {
      const [v, setV] = React.useState(["Paid", "Packed", "Shipped"]);
      return <MultiSelect aria-label="Status" value={v} onValueChange={setV} placeholder="Status" options={["Paid", "Packed", "Shipped", "Unpaid", "Cancelled"].map((s) => ({ value: s, label: s }))} />;
    },
    usage: () => `<MultiSelect value={statuses} onValueChange={setStatuses} options={options} />`,
  },
  combobox: {
    render: () => {
      const [v, setV] = React.useState<string | null>(null);
      return (
        <Combobox
          aria-label="Product"
          value={v}
          onValueChange={setV}
          placeholder="Choose a product"
          searchPlaceholder="Search products"
          options={PRODUCTS.map((p) => ({ value: p.sku, label: p.name }))}
          className="w-64"
        />
      );
    },
    usage: () => `<Combobox value={sku} onValueChange={setSku} options={products} placeholder="Choose a product" />`,
  },
  "date-picker": {
    render: () => {
      const [d, setD] = React.useState<Date | null>(new Date(2026, 10, 7));
      return <DatePicker value={d} onValueChange={setD} today={NOW} />;
    },
    usage: () => `<DatePicker value={date} onValueChange={setDate} />  // shows "7 Nov 2026", or "Today"`,
  },
  "period-stepper": {
    controls: [{ key: "period", type: "select", label: "Period", options: ["day", "week", "month"], default: "week" }],
    render: (p) => {
      const [d, setD] = React.useState(NOW);
      return <PeriodStepper value={d} period={p.period as Period} onValueChange={setD} max={NOW} />;
    },
    usage: (p) => `<PeriodStepper period="${p.period}" value={date} onValueChange={setDate} max={today} />`,
  },
  "language-picker": {
    render: () => {
      const [v, setV] = React.useState("id");
      return <LanguagePicker value={v} onValueChange={setV} />;
    },
    usage: () => `<LanguagePicker value={lang} onValueChange={setLang} />`,
  },
  segmented: {
    controls: [{ key: "icons", type: "toggle", label: "Icons", default: false }],
    render: (p) => {
      const [v, setV] = React.useState("week");
      return (
        <Segmented
          aria-label="Range"
          value={v}
          onValueChange={setV}
          options={[
            { value: "day", label: p.icons ? <><BarChart2 />Today</> : "Today" },
            { value: "week", label: p.icons ? <><Layers />Week</> : "Week" },
            { value: "month", label: p.icons ? <><Grid />Month</> : "Month" },
          ]}
        />
      );
    },
    usage: () => `<Segmented value={range} onValueChange={setRange} options={[\n  { value: "day", label: "Today" },\n  { value: "week", label: "Week" },\n  { value: "month", label: "Month" },\n]} />`,
  },
  tabs: {
    render: () => (
      <Tabs defaultValue="pack" className="w-full max-w-md">
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
        <TabsContent value="pack" className="text-body text-ink-muted">
          12 orders
        </TabsContent>
        <TabsContent value="ship" className="text-body text-ink-muted">
          8 orders
        </TabsContent>
        <TabsContent value="done" className="text-body text-ink-muted">
          214 orders
        </TabsContent>
      </Tabs>
    ),
    usage: () => `<Tabs defaultValue="pack">\n  <TabsList>\n    <TabsTrigger value="pack"><Box />To pack</TabsTrigger>\n    <TabsTrigger value="ship"><Truck />To ship</TabsTrigger>\n  </TabsList>\n  <TabsContent value="pack">…</TabsContent>\n</Tabs>`,
  },
  switch: {
    controls: [
      { key: "size", type: "select", label: "Size", options: ["default", "lg"], default: "default" },
      { key: "disabled", type: "toggle", label: "Disabled", default: false },
    ],
    render: (p) => {
      const [a, setA] = React.useState(true);
      const [b, setB] = React.useState(false);
      return (
        <div className="grid w-64 gap-px">
          {[
            ["Print receipts", a, setA],
            ["Round cash totals", b, setB],
          ].map(([l, v, s]) => (
            <label key={l as string} className="flex h-row cursor-pointer items-center justify-between rounded-item px-2 text-body hover:bg-fill">
              {l as string}
              <Switch size={p.size as "lg"} checked={v as boolean} onCheckedChange={s as (v: boolean) => void} disabled={!!p.disabled} />
            </label>
          ))}
        </div>
      );
    },
    usage: (p) => `<Switch${p.size === "lg" ? ` size="lg"` : ""} checked={on} onCheckedChange={setOn} />`,
  },
  checkbox: {
    render: () => (
      <div className="grid gap-2.5">
        <CheckboxField label="Unpaid" defaultChecked />
        <CheckboxField label="To pack" />
        <CheckboxField label="All shops" checked="indeterminate" />
        <Checkbox aria-label="Bare" defaultChecked />
      </div>
    ),
    usage: () => `<CheckboxField label="Unpaid" checked={on} onCheckedChange={setOn} />`,
  },
  radio: {
    render: () => (
      <RadioGroup defaultValue="jne">
        <Radio value="jne" label="JNE Regular" />
        <Radio value="sicepat" label="SiCepat" />
        <Radio value="pickup" label="Pick up in shop" />
      </RadioGroup>
    ),
    usage: () => `<RadioGroup value={courier} onValueChange={setCourier}>\n  <Radio value="jne" label="JNE Regular" />\n  <Radio value="pickup" label="Pick up in shop" />\n</RadioGroup>`,
  },
  slider: {
    render: () => {
      const [v, setV] = React.useState(20);
      return <Slider label="Discount" value={v} min={0} max={50} onValueChange={setV} display={`${v}%`} className="w-64" />;
    },
    usage: () => `<Slider label="Discount" value={v} min={0} max={50} onValueChange={setV} display={\`\${v}%\`} />`,
  },
  card: {
    stage: "page",
    controls: [{ key: "interactive", type: "toggle", label: "Clickable", default: true }],
    render: (p) => (
      <Card interactive={!!p.interactive} className="w-80">
        <CardHeader title="Kemang" action={<Status>Open</Status>} />
        <div className="mt-2 grid gap-1.5 text-body">
          <div className="flex justify-between">
            <span className="text-ink-muted">Sales today</span>
            <span className="tabular-nums">{formatRp(12400000)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Orders</span>
            <span className="tabular-nums">84</span>
          </div>
        </div>
      </Card>
    ),
    usage: (p) => `<Card${p.interactive ? " interactive" : ""}>\n  <CardHeader title="Kemang" action={<Status>Open</Status>} />\n  …\n</Card>`,
  },
  "metric-card": {
    stage: "page",
    controls: [
      { key: "variant", type: "select", label: "Variant", options: ["tile", "scale", "compact", "hero"], labels: ["A · Tile", "B · Scale", "C · Compact", "D · Hero"], default: "tile" },
      { key: "primary", type: "toggle", label: "Primary", default: true },
      { key: "delta", type: "toggle", label: "Change", default: true },
      { key: "loading", type: "toggle", label: "Loading", default: false },
    ],
    render: (p) => {
      const v = p.variant as MetricVariant;
      const l = !!p.loading;
      if (v === "hero")
        return (
          <Card className="w-[380px] max-w-full">
            <MetricCard variant="hero" loading={l} primary={!!p.primary} label="Sales this month" unit="Rp" value={1124600000} delta={p.delta ? { value: "9,7%", direction: "up" } : undefined} />
          </Card>
        );
      return (
        <div className="flex max-w-3xl flex-wrap justify-center gap-4">
          <MetricCard variant={v} loading={l} primary={!!p.primary} label="Sales today" unit="Rp" value={48240000} delta={p.delta ? { value: "9,7%", direction: "up" } : undefined} />
          <MetricCard variant={v} loading={l} label="Orders" value={312} delta={p.delta ? { value: "3,1%", direction: "down" } : undefined} />
          <MetricCard variant={v} loading={l} label="Basket" unit="Rp" value={154600} />
          <MetricCard variant={v} loading={l} label="To ship" value={18} />
          <MetricCard variant={v} loading={l} label="Cancelled" value={4} />
        </div>
      );
    },
    usage: (p) =>
      p.variant === "hero"
        ? `<Card>\n  <MetricCard variant="hero"${p.primary ? " primary" : ""} label="Sales this month" unit="Rp" value={1124600000}${p.delta ? ` delta={{ value: "9,7%", direction: "up" }}` : ""} />\n  <BarChart data={days} />\n</Card>`
        : `<MetricCard${p.variant !== "tile" ? ` variant="${p.variant}"` : ""}${p.primary ? " primary" : ""} label="Sales today" unit="Rp" value={48240000}${p.delta ? ` delta={{ value: "9,7%", direction: "up" }}` : ""} />\n<MetricCard${p.variant !== "tile" ? ` variant="${p.variant}"` : ""} label="Cancelled" value={4} />  // one or two digits: the short treatment`,
  },
  table: {
    stage: "page",
    controls: [{ key: "bar", type: "toggle", label: "Bottom bar", default: true }],
    render: (p) => {
      const [sel, setSel] = React.useState<string | null>(orderRows[1].id);
      const [page, setPage] = React.useState(1);
      return (
        <Card inset="nest" className="max-w-full">
          <Table className="max-h-[300px]">
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Time</TH>
                <TH>Shop</TH>
                <TH>Items</TH>
                <TH>Status</TH>
                <TH align="right">Total</TH>
              </tr>
            </THead>
            <TBody>
              {orderRows.map((o) => (
                <TRow key={o.id} selected={sel === o.id} onActivate={() => setSel(o.id)}>
                  <TD>{o.id}</TD>
                  <TD className="text-ink-muted">{smartTime(o.at)}</TD>
                  <TD>{o.shop}</TD>
                  <TD maxWidth={180}>{o.items}</TD>
                  <TD>
                    <Status tone={o.status === "Unpaid" ? "attention" : o.status === "Cancelled" ? "muted" : "default"}>{o.status}</Status>
                  </TD>
                  <TD align="right">{formatRp(o.total)}</TD>
                </TRow>
              ))}
            </TBody>
          </Table>
          {p.bar ? <TableBar page={page} total={ORDERS.length} onPageChange={setPage} className="mt-1" /> : null}
        </Card>
      );
    },
    usage: () =>
      `<Card inset="nest">\n  <Table>\n    <THead><tr><TH>Order</TH><TH align="right">Total</TH></tr></THead>\n    <TBody>\n      {rows.map((o) => (\n        <TRow key={o.id} selected={o.id === open} onActivate={() => setOpen(o.id)}>\n          <TD>{o.id}</TD>\n          <TD align="right">{formatRp(o.total)}</TD>\n        </TRow>\n      ))}\n    </TBody>\n  </Table>\n  <TableBar page={page} total={1240} onPageChange={setPage} />\n</Card>`,
  },
  "attention-list": {
    stage: "page",
    render: () => (
      <Card inset="nest" className="w-full max-w-sm">
        <CardHeader title="Low stock" action={<Badge>4</Badge>} className="px-2 pt-2" />
        <AttentionList className="mt-1">
          {PRODUCTS.filter((p) => p.stock < 5)
            .slice(0, 4)
            .map((p) => (
              <AttentionItem key={p.sku} media={<Thumb alt={p.name} />} title={p.name} meta={p.sku} value={p.stock === 0 ? "Out" : `${p.stock} left`} onClick={() => {}} />
            ))}
        </AttentionList>
      </Card>
    ),
    usage: () => `<AttentionList>\n  <AttentionItem media={<Thumb src={p.image} alt={p.name} />} title={p.name} meta={p.sku} value="2 left" onClick={open} />\n</AttentionList>`,
  },
  "bar-chart": {
    stage: "page",
    controls: [{ key: "kind", type: "select", label: "Kind", options: ["columns", "list"], default: "columns" }],
    render: (p) => {
      const [sel, setSel] = React.useState<string | null>(null);
      return (
        <Card className="w-full max-w-lg">
          <CardHeader title={p.kind === "list" ? "By shop" : "Last 30 days"} />
          {p.kind === "list" ? (
            <BarList
              className="mt-2"
              selected={sel}
              onSelect={setSel}
              data={SHOPS.map((s, i) => ({ key: s, label: s, value: [42, 36, 28, 19, 51, 33][i], display: `Rp ${[42, 36, 28, 19, 51, 33][i]} jt` }))}
            />
          ) : (
            <BarChart data={DAILY} current={29} labelEvery={5} className="mt-4" aria-label="Sales, last 30 days" />
          )}
        </Card>
      );
    },
    usage: (p) => (p.kind === "list" ? `<BarList data={byShop} selected={shop} onSelect={setShop} />` : `<BarChart data={daily} current={29} labelEvery={5} />`),
  },
  status: {
    render: () => (
      <div className="grid justify-items-center gap-5">
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Status>Paid</Status>
          <Status tone="attention">Unpaid</Status>
          <Status tone="muted">Cancelled</Status>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Pill>Needs review</Pill>
          <Pill tone="neutral" dot="default">Paid</Pill>
          <Pill tone="neutral" dot="muted">Cancelled</Pill>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Chip selected>All</Chip>
          <Chip>Unpaid</Chip>
          <Chip>To pack</Chip>
          <Chip>Shipped</Chip>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Chip onRemove={() => toast("Filter removed", "neutral")}>Kemang</Chip>
          <Chip onRemove={() => toast("Filter removed", "neutral")}>This week</Chip>
        </div>
      </div>
    ),
    usage: () => `<Status>Paid</Status>                       // tables and detail rows\n<Pill>Needs review</Pill>                  // the one status that needs attention\n<Pill tone="neutral" dot="default">Paid</Pill>  // beside a pill, same box\n<Chip selected onClick={…}>All</Chip>\n<Chip onRemove={…}>Kemang</Chip>\n// Pills, chips, segments and tabs share --ad-bubble-x / --ad-bubble-x-sm.`,
  },
  badge: {
    render: () => (
      <div className="flex items-center gap-2 text-body">
        Orders <Badge>23</Badge>
      </div>
    ),
    usage: () => `<Badge>23</Badge>`,
  },
  avatar: {
    render: () => (
      <div className="flex items-center gap-3">
        <Avatar name={TEAM[0].name} size="lg" />
        <Avatar name={TEAM[1].name} />
        <Avatar name={TEAM[2].name} size="sm" />
      </div>
    ),
    usage: () => `<Avatar name="Rizky Hartono" src={photo} />`,
  },
  thumb: {
    render: () => (
      <div className="flex items-center gap-3">
        <Thumb alt="Gelas kopi" size={48} />
        <Thumb alt="Piring rotan" size={32} />
        <Thumb alt="Lilin" size={24} />
      </div>
    ),
    usage: () => `<Thumb src={product.image} alt={product.name} size={32} />`,
  },
  alert: {
    controls: [
      { key: "tone", type: "select", label: "Tone", options: ["neutral", "attention", "danger"], default: "neutral" },
      { key: "action", type: "toggle", label: "Action", default: true },
    ],
    render: (p) => (
      <div className="grid w-full max-w-md gap-3">
        <Alert tone={p.tone as never} title="2 shops haven't synced since 09:40" action={p.action ? <Button size="sm">Sync</Button> : undefined} />
        <Alert tone="danger" title="Payout failed" action={p.action ? <Button size="sm">Open</Button> : undefined}>
          The bank rejected the account number. Check it in Settings.
        </Alert>
      </div>
    ),
    usage: (p) =>
      `// One line: icon, text and action share one centre line.\n<Alert tone="${p.tone}" title="2 shops haven't synced since 09:40"${p.action ? ` action={<Button size="sm">Sync</Button>}` : ""} />\n\n// Two lines: the icon stays on the first line.\n<Alert tone="danger" title="Payout failed">\n  The bank rejected the account number. Check it in Settings.\n</Alert>`,
  },
  progress: {
    render: () => (
      <div className="grid w-72 gap-2 text-body">
        <div className="flex justify-between">
          <span>Adding up 1.240 sales</span>
          <span className="tabular-nums text-ink-muted">64%</span>
        </div>
        <Progress value={64} aria-label="Import" />
      </div>
    ),
    usage: () => `<Progress value={64} aria-label="Import" />`,
  },
  "empty-state": {
    render: () => <EmptyState icon={Inbox} title="No returns yet" />,
    usage: () => `<EmptyState icon={Inbox} title="No returns yet" />`,
  },
  skeleton: {
    stage: "page",
    controls: [{ key: "loading", type: "toggle", label: "Loading", default: true }],
    render: (p) => {
      const l = !!p.loading;
      return (
        <div className="flex flex-wrap justify-center gap-4">
          <Card className="w-72">
            <div className="flex items-center gap-3">
              <Loading loading={l}>
                <Avatar name="Rizky Hartono" />
              </Loading>
              <div className="grid min-w-0">
                <span className="text-body">
                  <LoadingText loading={l}>Rizky Hartono</LoadingText>
                </span>
                <span className="text-small text-ink-muted">
                  <LoadingText loading={l}>Owner</LoadingText>
                </span>
              </div>
            </div>
            <div className="mt-4 grid gap-1">
              <span className="text-body text-ink-muted">
                <LoadingText loading={l}>Sales today</LoadingText>
              </span>
              <span className="text-number font-semibold tabular-nums">
                <LoadingText loading={l}>{formatRp(48240000)}</LoadingText>
              </span>
            </div>
            <div className="mt-4">
              <Loading loading={l}>
                <Button variant="primary">Open shop</Button>
              </Loading>
            </div>
          </Card>
          <Skeleton className={cn("h-[150px] w-40", !l && "hidden")} />
        </div>
      );
    },
    usage: () => `<LoadingText loading={loading}>{name ?? "Rizky Hartono"}</LoadingText>\n<Loading loading={loading}><Button>Open shop</Button></Loading>\n<Skeleton className="h-[150px] w-40" />`,
  },
  dialog: {
    render: () => (
      <Dialog
        title="Cancel order RMB-24817?"
        trigger={<Button>Cancel order</Button>}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Keep order</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" onClick={() => toast("Order cancelled")}>
                Cancel order
              </Button>
            </DialogClose>
          </>
        }
      >
        <Field label="Reason">
          <Select value="stock" onValueChange={() => {}} options={[{ value: "stock", label: "Out of stock" }, { value: "buyer", label: "Buyer asked" }]} />
        </Field>
      </Dialog>
    ),
    usage: () => `<Dialog title="Cancel order?" trigger={<Button>Cancel order</Button>}\n  footer={<><DialogClose asChild><Button variant="ghost">Keep</Button></DialogClose><Button variant="primary">Cancel order</Button></>}>\n  …\n</Dialog>`,
  },
  sheet: {
    render: () => {
      const [open, setOpen] = React.useState(false);
      const o = ORDERS[0];
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open order</Button>
          <Sheet
            open={open}
            onOpenChange={setOpen}
            title={o.id}
            footer={
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => toast("Marked as packed")}>
                  Mark as packed
                </Button>
              </>
            }
          >
            <OrderDetail id={o.id} />
          </Sheet>
        </>
      );
    },
    usage: () => `<Sheet open={open} onOpenChange={setOpen} title="RMB-24817"\n  footer={<Button variant="primary">Mark as packed</Button>}>\n  …\n</Sheet>`,
  },
  popover: {
    render: () => (
      <Popover trigger={<Button>Filter</Button>}>
        <div className="grid w-56 gap-2.5">
          <CheckboxField label="Unpaid" defaultChecked />
          <CheckboxField label="To pack" />
          <CheckboxField label="Shipped" />
        </div>
      </Popover>
    ),
    usage: () => `<Popover trigger={<Button>Filter</Button>}>…</Popover>\n// In a <Toolbar>, opening one popover closes the other.`,
  },
  tooltip: {
    render: () => (
      <Tooltip content="2–8 Nov">
        <Button icon aria-label="Previous week">
          <Package />
        </Button>
      </Tooltip>
    ),
    usage: () => `<Tooltip content="2–8 Nov"><Button icon aria-label="Previous week">…</Button></Tooltip>`,
  },
  toast: {
    render: () => (
      <div className="flex gap-2">
        <Button variant="primary" onClick={() => toast("Changes saved")}>
          Save
        </Button>
        <Button onClick={() => toast("Copied", "neutral")}>Copy link</Button>
      </div>
    ),
    usage: () => `// once, near the root\n<Toaster />\n\ntoast("Changes saved");\n\n// One shown in place (a preview):\n<ToastView>3 orders packed</ToastView>`,
  },
  sidebar: {
    stage: "page",
    render: () => {
      const [at, setAt] = React.useState("Orders");
      return (
        <Sidebar className="h-[440px]">
          <SidebarSection>
            {[
              [Home, "Dashboard"],
              [ShoppingBag, "Orders", 23],
              [Package, "Products"],
              [Tag, "Promotions"],
              [XCircle, "Cancellations"],
            ].map(([I, l, c]) => (
              <SidebarItem key={l as string} icon={I as typeof Home} active={at === l} count={c as number | undefined} onClick={() => setAt(l as string)}>
                {l as string}
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
          <div className="mt-auto flex items-center justify-between px-1">
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
              <MenuItem icon={Settings}>Settings</MenuItem>
            </Menu>
          </div>
        </Sidebar>
      );
    },
    usage: () => `<Sidebar>\n  <SidebarSection>\n    <SidebarItem icon={Home} active>Dashboard</SidebarItem>\n    <SidebarItem icon={ShoppingBag} count={23}>Orders</SidebarItem>\n  </SidebarSection>\n</Sidebar>`,
  },
  "bottom-nav": {
    stage: "page",
    render: () => {
      const [at, setAt] = React.useState("Home");
      return (
        <div className="relative h-[220px] w-[340px] overflow-hidden rounded-sheet bg-page shadow-card [transform:translateZ(0)]">
          <BottomNav className="absolute">
            {[
              [Home, "Home"],
              [ShoppingBag, "Orders"],
              [Package, "Stock"],
              [SearchIcon, "Search"],
            ].map(([I, l]) => (
              <BottomNavItem key={l as string} icon={I as typeof Home} label={l as string} active={at === l} onClick={() => setAt(l as string)} />
            ))}
          </BottomNav>
        </div>
      );
    },
    usage: () => `<BottomNav>\n  <BottomNavItem icon={Home} label="Home" active />\n  <BottomNavItem icon={ShoppingBag} label="Orders" />\n</BottomNav>\n<Fab icon={Plus} label="Add order" />`,
  },
};

export function OrderDetail({ id }: { id: string }) {
  const o = ORDERS.find((x) => x.id === id) ?? ORDERS[0];
  const step = { Unpaid: 0, Paid: 1, Packed: 2, Shipped: 3, Cancelled: 0 }[o.status];
  const market = o.shop === "TikTok Shop" ? "tiktok" : "shopee";
  const rows: [string, React.ReactNode][] = [
    ["Order", <CopyChip key="c" value={o.id} />],
    ["Time", smartTime(o.at)],
    ["Shop", o.shop],
    ["Customer", o.customer],
    ["Payment", o.payment],
  ];
  return (
    <div className="grid gap-6">
      {o.status === "Cancelled" ? (
        <Alert tone="neutral" title="Cancelled by the buyer" />
      ) : (
        <Steps steps={["Ordered", "Paid", "Packed", "Shipped"]} current={step + 1} />
      )}
      <div className="grid gap-2 text-body">
        {rows.map(([k, v]) => (
          <div key={k} className="flex min-h-6 items-center justify-between gap-4">
            <span className="text-ink-muted">{k}</span>
            <span className="truncate">{v}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-1.5">
        <h3 className="text-body font-semibold">Items</h3>
        <div className="flex items-center gap-3 rounded-item bg-fill px-2.5 py-2">
          <Thumb alt={o.items} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body">{o.items}</p>
            <p className="text-small tabular-nums text-ink-muted">
              {o.qty} × {formatRp(o.total / o.qty)}
            </p>
          </div>
          <span className="shrink-0 text-body font-medium tabular-nums">{formatRp(o.total)}</span>
        </div>
      </div>
      <div className="grid gap-1.5">
        <h3 className="text-body font-semibold">Money</h3>
        <div className="-mx-2.5 grid gap-px">
          <FeeRow payer="buyer" label="Items" amount={o.total} />
          <FeeRow payer="platform" market={market} label="Admin fee 4,5%" amount={-o.fee} />
          <FeeTotal label="You receive" amount={o.total - o.fee} className="mt-1" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <h3 className="text-body font-semibold">Activity</h3>
        <Timeline
          className="-mx-2"
          events={[
            ...(step >= 2 ? [{ id: "p", time: "Today, 11:40", title: `Packed by ${TEAM[3].name}`, media: <Box /> }] : []),
            ...(step >= 1 ? [{ id: "y", time: smartTime(new Date(o.at.getTime() + 4 * 60000)), title: `Paid with ${o.payment}` }] : []),
            { id: "o", time: smartTime(o.at), title: `Ordered at ${o.shop}` },
          ]}
        />
      </div>
    </div>
  );
}
