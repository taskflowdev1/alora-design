/* eslint-disable react-hooks/rules-of-hooks */
// Detail-page demos for the shadcn-parity components: each one live with its controls, plus its usage snippet.
import * as React from "react";
import { Bold, Box, Database, FileText, Italic, Package, RefreshCw, Search as SearchIcon, ShoppingBag, Tag, Truck, Underline } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Thumb } from "@/components/ui/thumb";
import { toast } from "@/components/ui/toast";
import { MenuItem, MenuSub } from "@/components/ui/menu";
import { ChartLegend, ChartTooltip, seriesColor } from "@/components/ui/chart";
import { LineChart } from "@/components/ui/line-chart";
import { AreaChart } from "@/components/ui/area-chart";
import { PieChart } from "@/components/ui/pie-chart";
import { RadarChart } from "@/components/ui/radar-chart";
import { RadialChart } from "@/components/ui/radial-chart";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { Menubar } from "@/components/ui/menubar";
import { Pagination } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { ButtonGroup } from "@/components/ui/button-group";
import { InputGroup } from "@/components/ui/input-group";
import { InputOTP } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { DataTable } from "@/components/ui/data-table";
import { Item, ItemList } from "@/components/ui/item";
import { Accordion } from "@/components/ui/accordion";
import { Collapsible } from "@/components/ui/collapsible";
import { Carousel } from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { H1, H2, H3, InlineCode, List, Muted, Num, P, Quote, Small } from "@/components/ui/typography";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Drawer, DrawerClose } from "@/components/ui/drawer";
import { Resizable } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bubble, BubbleGroup, Message } from "@/components/ui/message";
import { MessageScroller } from "@/components/ui/message-scroller";
import { Marker } from "@/components/ui/marker";
import { Trace } from "@/components/ui/trace";
import { Attachment, AttachmentGroup } from "@/components/ui/attachment";
import { Questionnaire } from "@/components/ui/questionnaire";
import { CodeBlock } from "@/components/ui/code-block";
import { NOW, ORDERS } from "./data";
import type { Demo } from "./demos";
import { BY_CHANNEL, BY_HOUR, CHANNELS, ORDER_COLUMNS, SALES_14, SALES_SERIES, SHOP_SCORES, SHOP_SERIES, TARGETS } from "./showcase-more";

const say = (m: string) => () => toast(m, "neutral");
const chartCard = "w-full max-w-2xl";
// Photo stand-ins: fixed colours in both themes, like a real photo, with a soft dark icon. grey-ok: image content.
const tints = ["#c9b79c", "#a8b5a2", "#b9a3a0", "#a9b4c2", "#c2b0a4"]; // grey-ok
const photoIcon = "text-black/30"; // grey-ok

export const MORE_DEMOS: Record<string, Demo> = {
  /* ---------------------------------------------------------- charts */
  chart: {
    stage: "page",
    render: () => (
      <Card className="grid w-full max-w-md gap-5">
        <ChartLegend items={SALES_SERIES.map((s, i) => ({ label: s.label, color: seriesColor(i) }))} />
        <div className="relative h-24">
          <ChartTooltip title="14 Nov" rows={SALES_SERIES.map((s, i) => ({ color: seriesColor(i), label: s.label, value: `Rp ${[46, 39][i]} jt` }))} style={{ left: 0, top: 0 }} />
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-8 flex-1 rounded-small" style={{ background: seriesColor(i) }} />
          ))}
        </div>
      </Card>
    ),
    usage: () =>
      `import { ChartLegend, ChartTooltip, seriesColor, formatShort, niceTicks } from "@/components/ui/chart";\n\n// Series n always gets chart-n (accent shades, fixed order).\n<ChartLegend items={series.map((s, i) => ({ label: s.label, color: seriesColor(i) }))} />\nformatShort(12_400_000) // "12,4 jt"\nniceTicks(47) // [0, 10, 20, 30, 40, 50]`,
  },
  "line-chart": {
    stage: "page",
    controls: [
      { key: "series", type: "select", label: "Series", options: ["1", "2"], default: "2" },
      { key: "curve", type: "select", label: "Curve", options: ["smooth", "linear"], default: "smooth" },
      { key: "dots", type: "toggle", label: "Dots", default: false },
      { key: "grid", type: "toggle", label: "Grid", default: true },
      { key: "axis", type: "toggle", label: "Axis", default: true },
    ],
    render: (p) => (
      <Card className={chartCard}>
        <h3 className="mb-3 text-title font-semibold">Sales</h3>
        <LineChart aria-label="Sales per day" data={SALES_14} series={SALES_SERIES.slice(0, Number(p.series))} curve={p.curve as "smooth"} dots={!!p.dots} grid={!!p.grid} axis={!!p.axis} height={240} />
      </Card>
    ),
    usage: (p) =>
      `<LineChart\n  data={[{ label: "3", now: 41200000, before: 38900000 }, …]}\n  series={[{ key: "now", label: "This fortnight" }${p.series === "2" ? `, { key: "before", label: "The one before" }` : ""}]}${p.curve === "linear" ? `\n  curve="linear"` : ""}${p.dots ? "\n  dots" : ""}${p.grid ? "" : "\n  grid={false}"}${p.axis ? "" : "\n  axis={false}"}\n/>`,
  },
  "area-chart": {
    stage: "page",
    controls: [
      { key: "stacked", type: "toggle", label: "Stacked", default: true },
      { key: "fill", type: "select", label: "Wash", options: ["0.08", "0.14", "0.24"], labels: ["Light", "Default", "Strong"], default: "0.14" },
      { key: "curve", type: "select", label: "Curve", options: ["smooth", "linear"], default: "smooth" },
    ],
    render: (p) => (
      <Card className={chartCard}>
        <h3 className="mb-3 text-title font-semibold">Orders by hour</h3>
        <AreaChart aria-label="Orders by hour" data={BY_HOUR} series={CHANNELS} stacked={!!p.stacked} fill={Number(p.fill)} curve={p.curve as "smooth"} height={240} format={(n) => String(Math.round(n))} />
      </Card>
    ),
    usage: (p) => `<AreaChart data={byHour} series={[{ key: "shopee", label: "Shopee" }, { key: "tiktok", label: "TikTok Shop" }, { key: "offline", label: "Shops" }]}${p.stacked ? " stacked" : ""}${p.fill !== "0.14" ? ` fill={${p.fill}}` : ""} />`,
  },
  "pie-chart": {
    stage: "page",
    controls: [
      { key: "kind", type: "select", label: "Kind", options: ["donut", "pie"], default: "donut" },
      { key: "legend", type: "select", label: "Legend", options: ["side", "bottom", "none"], default: "side" },
    ],
    render: (p) => (
      <Card className="w-full max-w-md">
        <h3 className="mb-4 text-title font-semibold">Sales by channel</h3>
        <PieChart
          aria-label="Sales by channel"
          data={BY_CHANNEL}
          thickness={p.kind === "pie" ? 1 : 0.32}
          legend={p.legend as "side"}
          center={
            <span className="grid">
              <span className="text-small text-ink-muted">This month</span>
              <span className="text-title font-semibold tabular-nums">Rp 48 jt</span>
            </span>
          }
        />
      </Card>
    ),
    usage: (p) => `<PieChart data={[{ key: "shopee", label: "Shopee", value: 19840000 }, …]}${p.kind === "pie" ? " thickness={1}" : ' center={<Total />}'}${p.legend !== "side" ? ` legend="${p.legend}"` : ""} />`,
  },
  "radar-chart": {
    stage: "page",
    controls: [{ key: "series", type: "select", label: "Series", options: ["1", "2"], default: "2" }],
    render: (p) => (
      <Card className="w-full max-w-lg">
        <h3 className="mb-2 text-title font-semibold">Kemang and Dago</h3>
        <RadarChart aria-label="Shops compared" data={SHOP_SCORES} series={SHOP_SERIES.slice(0, Number(p.series))} size={280} format={(n) => `${n}/100`} />
      </Card>
    ),
    usage: () => `<RadarChart data={[{ label: "Speed", kemang: 86, dago: 64 }, …]} series={[{ key: "kemang", label: "Kemang" }, { key: "dago", label: "Dago" }]} />`,
  },
  "radial-chart": {
    stage: "page",
    controls: [
      { key: "sweep", type: "select", label: "Sweep", options: ["270", "360"], labels: ["Gauge", "Full"], default: "270" },
      { key: "rings", type: "select", label: "Rings", options: ["1", "3"], default: "3" },
    ],
    render: (p) => {
      const one = p.rings === "1";
      const data = (one ? TARGETS.slice(0, 1) : TARGETS).map((t) => ({ ...t, display: `Rp ${Math.round(t.value / 1e6)} of ${Math.round(t.max / 1e6)} jt` }));
      return (
        <Card className="w-full max-w-md">
          <h3 className="mb-4 text-title font-semibold">{one ? "Kemang, November" : "November targets"}</h3>
          <RadialChart
            aria-label="Targets"
            data={data}
            sweep={Number(p.sweep)}
            thickness={one ? 14 : 10}
            size={one ? 176 : 168}
            center={one ? <span className="grid"><span className="text-number font-semibold tabular-nums">82%</span><span className="text-small text-ink-muted">Rp 82 of 100 jt</span></span> : undefined}
          />
        </Card>
      );
    },
    usage: (p) => `<RadialChart data={[{ key: "kemang", label: "Kemang", value: 82400000, max: 100000000 }${p.rings === "1" ? "" : ", …"}]}${p.sweep === "360" ? " sweep={360}" : ""} />`,
  },

  /* ---------------------------------------------------------- navigation */
  breadcrumb: {
    controls: [{ key: "long", type: "toggle", label: "Long path", default: false }],
    render: (p) => (
      <Breadcrumb
        items={[
          { label: "Products", onClick: say("Products") },
          ...(p.long ? [{ label: "Kitchen", onClick: say("Kitchen") }, { label: "Clay", onClick: say("Clay") }] : []),
          { label: "Mugs", onClick: say("Mugs") },
          { label: "Gelas kopi tanah liat" },
        ]}
      />
    ),
    usage: () => `<Breadcrumb items={[{ label: "Products", href: "/products" }, { label: "Mugs", href: "/products/mugs" }, { label: "Gelas kopi tanah liat" }]} />`,
  },
  "navigation-menu": {
    render: () => (
      <div className="h-64 w-full max-w-xl">
        <NavigationMenu
          items={[
            { label: "Dashboard", href: "#" },
            {
              label: "Orders",
              columns: 2,
              links: [
                { title: "All orders", icon: ShoppingBag, active: true },
                { title: "To pack", icon: Box },
                { title: "To ship", icon: Truck },
                { title: "Returns", icon: RefreshCw },
              ],
            },
            { label: "Products", links: [{ title: "Catalogue", icon: Package }, { title: "Prices", icon: Tag }] },
          ]}
        />
      </div>
    ),
    usage: () => `<NavigationMenu items={[\n  { label: "Dashboard", href: "/" },\n  { label: "Orders", columns: 2, links: [{ title: "All orders", icon: ShoppingBag, href: "/orders" }, …] },\n]} />`,
  },
  menubar: {
    render: () => (
      <div className="h-52">
        <Menubar
          menus={[
            {
              label: "File",
              content: (
                <>
                  <MenuItem icon={FileText} shortcut="⌘N" onSelect={say("New template")}>
                    New template
                  </MenuItem>
                  <MenuItem onSelect={say("Saved")}>Save</MenuItem>
                </>
              ),
            },
            {
              label: "Insert",
              content: (
                <MenuSub label="Shop details">
                  <MenuItem onSelect={say("Address")}>Address</MenuItem>
                  <MenuItem onSelect={say("Phone")}>Phone</MenuItem>
                </MenuSub>
              ),
            },
            { label: "View", content: <MenuItem icon={SearchIcon} onSelect={say("Preview")}>Print preview</MenuItem> },
          ]}
        />
      </div>
    ),
    usage: () => `<Menubar menus={[\n  { label: "File", content: <><MenuItem shortcut="⌘N" onSelect={newTemplate}>New template</MenuItem></> },\n  { label: "Insert", content: <MenuSub label="Shop details">…</MenuSub> },\n]} />`,
  },
  pagination: {
    controls: [
      { key: "numbers", type: "toggle", label: "Page numbers", default: true },
      { key: "count", type: "toggle", label: "Row count", default: true },
    ],
    render: (p) => {
      const [page, setPage] = React.useState(4);
      return <Pagination page={page} pageCount={26} onPageChange={setPage} total={p.count ? 1284 : undefined} numbers={!!p.numbers} className="w-full max-w-xl" />;
    },
    usage: (p) => `<Pagination page={page} pageCount={26} onPageChange={setPage}${p.count ? " total={1284}" : ""}${p.numbers ? "" : " numbers={false}"} />`,
  },

  /* ---------------------------------------------------------- inputs and actions */
  textarea: {
    controls: [{ key: "invalid", type: "toggle", label: "Invalid", default: false }],
    render: (p) => <Textarea aria-label="Note" rows={4} defaultValue="Pack the mugs in pairs, with paper between them." invalid={!!p.invalid} className="w-80" />,
    usage: (p) => `<Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)}${p.invalid ? " invalid" : ""} />`,
  },
  "input-group": {
    render: () => (
      <div className="grid w-72 gap-3">
        <InputGroup start="Rp" end="a day">
          <input aria-label="Minimum" defaultValue="500.000" className="tabular-nums" />
        </InputGroup>
        <InputGroup start="https://" end={<Button size="sm" variant="ghost" onClick={say("Copied")}>Copy</Button>}>
          <input aria-label="Shop link" defaultValue="rimba.id/kemang" />
        </InputGroup>
        <InputGroup start={<SearchIcon />} end={<kbd className="text-small">⌘K</kbd>}>
          <input aria-label="Search" placeholder="Search orders" />
        </InputGroup>
      </div>
    ),
    usage: () => `<InputGroup start="Rp" end="a day">\n  <input value={min} onChange={…} />\n</InputGroup>`,
  },
  "input-otp": {
    controls: [
      { key: "length", type: "select", label: "Length", options: ["4", "6"], default: "6" },
      { key: "invalid", type: "toggle", label: "Invalid", default: false },
    ],
    render: (p) => {
      const [v, setV] = React.useState("482");
      return <InputOTP value={v} onValueChange={setV} length={Number(p.length)} group={p.length === "6" ? 3 : 0} invalid={!!p.invalid} onComplete={() => toast("Code accepted")} />;
    },
    usage: (p) => `<InputOTP value={code} onValueChange={setCode} length={${p.length}} onComplete={verify} />`,
  },
  label: {
    controls: [{ key: "required", type: "toggle", label: "Required", default: false }],
    render: (p) => {
      const [on, setOn] = React.useState(true);
      return (
        <div className="flex w-64 items-center justify-between">
          <Label htmlFor="lbl-demo" required={!!p.required}>
            Print receipts
          </Label>
          <Switch id="lbl-demo" checked={on} onCheckedChange={setOn} />
        </div>
      );
    },
    usage: (p) => `<Label htmlFor="receipts"${p.required ? " required" : ""}>Print receipts</Label>\n<Switch id="receipts" … />`,
  },
  calendar: {
    controls: [{ key: "past", type: "toggle", label: "Past days", default: false }],
    render: (p) => {
      const [d, setD] = React.useState<Date | null>(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 2));
      return <Calendar value={d} onValueChange={setD} today={NOW} min={p.past ? undefined : NOW} />;
    },
    usage: (p) => `<Calendar value={date} onValueChange={setDate}${p.past ? "" : " min={new Date()}"} />`,
  },
  toggle: {
    controls: [{ key: "label", type: "toggle", label: "With label", default: false }],
    render: (p) => {
      const [m, setM] = React.useState<Record<string, boolean>>({ bold: true });
      return (
        <div className="flex gap-1">
          {(
            [
              ["bold", Bold, "Bold"],
              ["italic", Italic, "Italic"],
              ["underline", Underline, "Underline"],
            ] as const
          ).map(([k, I, l]) => (
            <Toggle key={k} icon={!p.label} aria-label={l} pressed={!!m[k]} onPressedChange={(v) => setM((x) => ({ ...x, [k]: v }))}>
              <I />
              {p.label ? l : null}
            </Toggle>
          ))}
        </div>
      );
    },
    usage: (p) => `<Toggle${p.label ? "" : ' icon aria-label="Bold"'} pressed={bold} onPressedChange={setBold}>\n  <Bold />${p.label ? "\n  Bold" : ""}\n</Toggle>`,
  },
  "button-group": {
    render: () => {
      const [f, setF] = React.useState("xlsx");
      return (
        <ButtonGroup aria-label="Format">
          {["csv", "xlsx", "pdf"].map((x) => (
            <Button key={x} size="sm" onClick={() => setF(x)} className={cn(f === x && "!bg-on !text-on-ink")}>
              {x.toUpperCase()}
            </Button>
          ))}
        </ButtonGroup>
      );
    },
    usage: () => `<ButtonGroup aria-label="Format">\n  <Button size="sm">CSV</Button>\n  <Button size="sm">XLSX</Button>\n  <Button size="sm">PDF</Button>\n</ButtonGroup>`,
  },

  /* ---------------------------------------------------------- display */
  "data-table": {
    stage: "page",
    controls: [
      { key: "select", type: "toggle", label: "Selection", default: true },
      { key: "search", type: "toggle", label: "Search", default: true },
      { key: "loading", type: "toggle", label: "Loading", default: false },
    ],
    render: (p) => {
      const [sel, setSel] = React.useState<string[]>([]);
      return (
        <Card inset="nest" className="w-full min-w-0">
          <DataTable rows={ORDERS.slice(0, 60)} columns={ORDER_COLUMNS} rowKey={(o) => o.id} selected={p.select ? sel : undefined} onSelectedChange={p.select ? setSel : undefined} search={!!p.search} loading={!!p.loading} pageSize={8} onRowClick={(o) => toast(`${o.id} opened`, "neutral")} />
        </Card>
      );
    },
    usage: () => `<DataTable\n  rows={orders}\n  rowKey={(o) => o.id}\n  columns={[\n    { key: "id", header: "Order", locked: true, sortable: true },\n    { key: "total", header: "Total", align: "right", sortable: true, cell: (o) => formatRp(o.total) },\n  ]}\n  selected={selected}\n  onSelectedChange={setSelected}\n  onRowClick={openPane}\n/>`,
  },
  item: {
    controls: [
      { key: "variant", type: "select", label: "Variant", options: ["plain", "soft"], default: "plain" },
      { key: "description", type: "toggle", label: "Second line", default: true },
    ],
    render: (p) => (
      <ItemList className="w-80">
        {[
          ["Gerabah Kasongan", "Clay mugs, plates", "3 open"],
          ["Rotan Cirebon", "Baskets, trays", "1 open"],
          ["Tenun Troso", "Table linen", "Paid"],
        ].map(([n, d, s]) => (
          <Item key={n} asChild variant={p.variant as "plain"} media={<Thumb alt={n} />} title={n} description={p.description ? d : undefined} end={<span className="text-ink-muted">{s}</span>}>
            <button type="button" onClick={say(n)} className="w-full" />
          </Item>
        ))}
      </ItemList>
    ),
    usage: (p) => `<Item media={<Thumb alt="…" />} title="Gerabah Kasongan"${p.description ? ' description="Clay mugs, plates"' : ""} end="3 open"${p.variant === "soft" ? ' variant="soft"' : ""} />`,
  },
  accordion: {
    controls: [
      { key: "cards", type: "toggle", label: "Cards", default: true },
      { key: "type", type: "select", label: "Open", options: ["single", "multiple"], labels: ["One at a time", "Several"], default: "single" },
    ],
    render: (p) => (
      <Accordion
        key={String(p.type)}
        type={p.type as "single"}
        cards={!!p.cards}
        defaultValue={["payout"]}
        className="w-full max-w-md"
        items={[
          { value: "payout", title: "When does Shopee pay out?", content: "Two days after the buyer confirms, at 09:00. Weekends move to Monday." },
          { value: "cancel", title: "Can I cancel a packed order?", content: "Yes, until the courier scans it." },
          { value: "fees", title: "Why is the admin fee 4,5%?", meta: "Shopee", content: "It's the Star seller rate." },
        ]}
      />
    ),
    usage: (p) => `<Accordion${p.cards ? " cards" : ""}${p.type === "multiple" ? ' type="multiple"' : ""} items={[{ value: "payout", title: "When does Shopee pay out?", content: "…" }]} />`,
  },
  collapsible: {
    render: () => (
      <Collapsible title="Archived suppliers" meta="6" defaultOpen className="w-80">
        Batik Pekalongan, Anyaman Tasik, Keramik Plered and three more.
      </Collapsible>
    ),
    usage: () => `<Collapsible title="Archived suppliers" meta="6">…</Collapsible>`,
  },
  carousel: {
    controls: [
      { key: "perView", type: "select", label: "Per view", options: ["1", "2", "3"], default: "2" },
      { key: "arrows", type: "toggle", label: "Arrows", default: true },
      { key: "dots", type: "toggle", label: "Dots", default: true },
    ],
    render: (p) => (
      <Carousel aria-label="Photos" perView={Number(p.perView)} arrows={!!p.arrows} dots={!!p.dots} className="w-full max-w-lg">
        {tints.map((c, i) => (
          <AspectRatio key={i} ratio={4 / 3}>
            <div className="grid size-full place-items-center" style={{ background: c }}>
              <Package size={28} className={photoIcon} />
            </div>
          </AspectRatio>
        ))}
      </Carousel>
    ),
    usage: (p) => `<Carousel perView={${p.perView}}${p.arrows ? "" : " arrows={false}"}${p.dots ? "" : " dots={false}"}>\n  {photos.map((p) => <AspectRatio ratio={4 / 3}><img src={p} /></AspectRatio>)}\n</Carousel>`,
  },
  "aspect-ratio": {
    controls: [{ key: "ratio", type: "select", label: "Ratio", options: ["1", "4/3", "16/9"], default: "16/9" }],
    render: (p) => {
      const [a, b] = String(p.ratio).split("/").map(Number);
      return (
        <AspectRatio ratio={a / (b || 1)} className="w-80">
          <div className="grid size-full place-items-center" style={{ background: tints[0] }}>
            <Package size={28} className={photoIcon} />
          </div>
        </AspectRatio>
      );
    },
    usage: (p) => `<AspectRatio ratio={${p.ratio}}>\n  <img src={photo} className="size-full object-cover" />\n</AspectRatio>`,
  },
  typography: {
    render: () => (
      <div className="grid w-full max-w-lg gap-3">
        <H1>Stock count</H1>
        <H2>Saturday, Kemang</H2>
        <H3>Before you start</H3>
        <P>We close the shop at 18:00 and count before 21:00. Scan each shelf once; the app adds them up.</P>
        <div className="flex items-baseline gap-2">
          <Num>1.284</Num>
          <Muted>items to count</Muted>
        </div>
        <List>
          <li>Start with the clay shelf</li>
          <li>
            Damaged goes under <InlineCode>RMB-RUSAK</InlineCode>
          </li>
        </List>
        <Quote>Count twice where the shelf is mixed.</Quote>
        <Small>Last count: 7 Nov 2026</Small>
      </div>
    ),
    usage: () => `import { H1, H2, H3, P, Muted, Num, List, InlineCode, Quote } from "@/components/ui/typography";\n\n<H2>Saturday, Kemang</H2>\n<P>We close the shop at 18:00…</P>\n<Num>1.284</Num>`,
  },

  /* ---------------------------------------------------------- overlays */
  "alert-dialog": {
    render: () => (
      <AlertDialog
        trigger={<Button>Cancel 3 orders</Button>}
        title="Cancel 3 orders?"
        action="Cancel orders"
        onAction={() => toast("3 orders cancelled")}
      >
        Buyers get their money back today and the stock returns to Kemang.
      </AlertDialog>
    ),
    usage: () => `<AlertDialog\n  trigger={<Button>Cancel 3 orders</Button>}\n  title="Cancel 3 orders?"\n  action="Cancel orders"\n  onAction={cancel}\n>\n  Buyers get their money back today.\n</AlertDialog>`,
  },
  drawer: {
    render: () => (
      <Drawer
        trigger={<Button>Choose courier</Button>}
        title="Ship with"
        footer={
          <DrawerClose asChild>
            <Button variant="primary" onClick={() => toast("Courier booked")}>
              Book pickup
            </Button>
          </DrawerClose>
        }
      >
        <div className="grid gap-px">
          {[
            ["JNE Regular", "Rp 12.000"],
            ["SiCepat", "Rp 11.000"],
            ["GoSend Instant", "Rp 28.000"],
          ].map(([n, pr]) => (
            <div key={n} className="flex h-row items-center justify-between rounded-item px-2.5 text-body hover:bg-fill">
              {n}
              <span className="tabular-nums text-ink-muted">{pr}</span>
            </div>
          ))}
        </div>
      </Drawer>
    ),
    usage: () => `<Drawer trigger={<Button>Choose courier</Button>} title="Ship with" footer={<Button variant="primary">Book pickup</Button>}>\n  …\n</Drawer>`,
  },

  /* ---------------------------------------------------------- layout */
  resizable: {
    stage: "page",
    controls: [{ key: "direction", type: "select", label: "Direction", options: ["horizontal", "vertical"], default: "horizontal" }],
    render: (p) => (
      <Card inset="nest" className="h-80 w-full max-w-2xl">
        <Resizable key={String(p.direction)} direction={p.direction as "horizontal"} defaultSize={40} className="h-full">
          <div className="grid h-full place-items-center rounded-item bg-fill text-body text-ink-muted">Orders</div>
          <div className="grid h-full place-items-center rounded-item bg-fill text-body text-ink-muted">Order RMB-24817</div>
        </Resizable>
      </Card>
    ),
    usage: (p) => `<Resizable defaultSize={40}${p.direction === "vertical" ? ' direction="vertical"' : ""}>\n  <OrderList />\n  <OrderPane />\n</Resizable>`,
  },
  "scroll-area": {
    render: () => (
      <ScrollArea className="h-64 w-72 rounded-card bg-fill">
        <div className="grid gap-px p-2">
          {ORDERS.slice(0, 30).map((o) => (
            <div key={o.id} className="flex h-row items-center justify-between gap-3 rounded-item px-2 text-body">
              <span className="tabular-nums">{o.id}</span>
              <span className="tabular-nums text-ink-muted">{formatRp(o.total)}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    ),
    usage: () => `<ScrollArea className="h-64">\n  {rows}\n</ScrollArea>`,
  },

  /* ---------------------------------------------------------- chat */
  message: {
    controls: [{ key: "bubble", type: "select", label: "Bubble", options: ["soft", "ink", "quote"], default: "soft" }],
    render: (p) => (
      <div className="grid w-full max-w-lg gap-5">
        <Message from={{ name: "Dewi Anggraini" }} time="13:52">
          Can we move clay mugs from Dago to Kemang before the weekend?
        </Message>
        <Message from={{ name: "Alora", agent: true }} time="13:52">
          Yes. Dago has 9 and needs 3 for its open orders, so I'm moving 6 to Kemang.
        </Message>
        <BubbleGroup>
          <Bubble align="end" variant={p.bubble as "soft"}>
            Perfect
          </Bubble>
          <Bubble align="end" variant={p.bubble as "soft"}>
            Book the pickup for 15:00
          </Bubble>
        </BubbleGroup>
      </div>
    ),
    usage: (p) => `<Message from={{ name: "Dewi Anggraini" }} time="13:52">…</Message>\n<Message from={{ name: "Alora", agent: true }}>…</Message>\n<Bubble align="end"${p.bubble !== "soft" ? ` variant="${p.bubble}"` : ""}>Perfect</Bubble>`,
  },
  "message-scroller": {
    stage: "page",
    render: () => {
      const [n, setN] = React.useState(6);
      return (
        <Card className="grid h-96 w-full max-w-lg grid-rows-[1fr_auto] gap-3">
          <MessageScroller watch={n}>
            {Array.from({ length: n }, (_, i) =>
              i % 2 ? (
                <Message key={i} from={{ name: "Alora", agent: true }}>
                  Restocked {i + 2} items at Kemang.
                </Message>
              ) : (
                <Bubble key={i} align="end">
                  Any more low on stock?
                </Bubble>
              ),
            )}
          </MessageScroller>
          <Button onClick={() => setN(n + 1)}>Add a message</Button>
        </Card>
      );
    },
    usage: () => `<MessageScroller watch={messages.length}>\n  {messages.map((m) => <Message … />)}\n</MessageScroller>`,
  },
  marker: {
    controls: [{ key: "variant", type: "select", label: "Variant", options: ["note", "soft", "label"], default: "note" }],
    render: (p) => (
      <div className="w-80">
        <Marker variant={p.variant as "note"} icon={p.variant === "label" ? undefined : Truck}>
          {p.variant === "label" ? "Today" : "Transfer TRF-0412 booked, pickup 15:00"}
        </Marker>
      </div>
    ),
    usage: (p) => (p.variant === "label" ? `<Marker variant="label">Today</Marker>` : `<Marker icon={Truck}${p.variant === "soft" ? ' variant="soft"' : ""}>Transfer booked, pickup 15:00</Marker>`),
  },
  trace: {
    render: () => (
      <Trace
        className="w-full max-w-md"
        steps={[
          { id: "s", title: "Read stock at Dago and Kemang", description: "Stock table", time: "0,8 s", icon: Database, detail: "Gelas kopi tanah liat: Dago 9, Kemang 2." },
          { id: "o", title: "Checked open orders", time: "0,4 s" },
          { id: "e", title: "Couldn't reach the courier", status: "error", time: "2,0 s" },
          { id: "t", title: "Booking a transfer", status: "running" },
          { id: "n", title: "Tell the Kemang team", status: "pending" },
        ]}
      />
    ),
    usage: () => `<Trace steps={[\n  { id: "s", title: "Read stock", time: "0,8 s", detail: "…" },\n  { id: "t", title: "Booking a transfer", status: "running" },\n]} />`,
  },
  attachment: {
    controls: [
      { key: "state", type: "select", label: "State", options: ["done", "uploading", "error"], default: "done" },
      { key: "size", type: "select", label: "Size", options: ["default", "sm"], default: "default" },
    ],
    render: (p) => (
      <AttachmentGroup className="max-w-full">
        <Attachment name="restock-dago.csv" kind="doc" meta="CSV · 4 KB" state={p.state as "done"} progress={62} size={p.size as "sm"} onRemove={say("Removed")} />
        <Attachment name="foto-rak.jpg" kind="image" meta="JPG · 1,2 MB" size={p.size as "sm"} onRemove={say("Removed")} />
      </AttachmentGroup>
    ),
    usage: (p) => `<Attachment name="restock-dago.csv" kind="doc" meta="CSV · 4 KB"${p.state !== "done" ? ` state="${p.state}"` : ""}${p.state === "uploading" ? " progress={62}" : ""}${p.size === "sm" ? ' size="sm"' : ""} onRemove={remove} />`,
  },
  questionnaire: {
    render: () => (
      <div className="w-full max-w-md">
        <Questionnaire
          questions={[
            { name: "shops", title: "Which shops should I restock?", type: "multiple", options: ["Kemang", "Senopati", "Dago"], required: true },
            { name: "when", title: "When should the stock arrive?", type: "single", options: ["Before Friday", "Next week", "No rush"] },
            { name: "note", title: "Anything the supplier should know?", type: "text", placeholder: "Pack the mugs in pairs" },
          ]}
          onSubmit={() => toast("Answers sent")}
        />
      </div>
    ),
    usage: () => `<Questionnaire\n  questions={[\n    { name: "shops", title: "Which shops?", type: "multiple", options: ["Kemang", "Dago"], required: true },\n    { name: "note", title: "Anything else?", type: "text" },\n  ]}\n  onSubmit={send}\n/>`,
  },
  "code-block": {
    controls: [
      { key: "title", type: "toggle", label: "File name", default: true },
      { key: "lines", type: "toggle", label: "Line numbers", default: true },
    ],
    render: (p) => (
      <CodeBlock
        className="w-full max-w-lg"
        title={p.title ? "restock-dago.csv" : undefined}
        lineNumbers={!!p.lines}
        onCopy={say("Copied")}
        code={"sku,from,to,qty\nRMB-GL-014,Dago,Kemang,6\nRMB-MB-005,Dago,Kemang,4"}
      />
    ),
    usage: (p) => `<CodeBlock code={csv}${p.title ? ' title="restock-dago.csv"' : ""}${p.lines ? " lineNumbers" : ""} />`,
  },
};

