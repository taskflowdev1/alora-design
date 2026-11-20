/*
 * The shadcn-parity components in real use: charts, navigation, more inputs and display parts, the alert dialog and
 * drawer, resizable panes and the chat parts. Each tile composes a few of them the way an ERP would; every component
 * sits in a `Mark` exactly once. The Components page appends these tiles to their category bands; the landing shows
 * them as their own category bands (`MoreBento`).
 */
import * as React from "react";
import {
  AlertCircle,
  Box,
  Copy,
  Database,
  Download,
  FileText,
  Grid,
  Mail,
  Package,
  RefreshCw,
  ShoppingBag,
  Tag,
  ThumbsUp,
  Truck,
} from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { findItem, type Group } from "@/lib/registry";
import { Button } from "@/components/ui/button";
import { Status, type StatusTone } from "@/components/ui/status";
import { Thumb } from "@/components/ui/thumb";
import { toast } from "@/components/ui/toast";
import { MenuItem, MenuGroup, MenuSub } from "@/components/ui/menu";
import { ChartLegend, seriesColor, type Datum } from "@/components/ui/chart";
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
import { Segmented } from "@/components/ui/segmented";
import { InputGroup } from "@/components/ui/input-group";
import { OtpFlow } from "./otp-flow";
import { Select } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { DataTable, type DataColumn } from "@/components/ui/data-table";
import { Item, ItemList } from "@/components/ui/item";
import { Accordion } from "@/components/ui/accordion";
import { Collapsible } from "@/components/ui/collapsible";
import { Carousel } from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Bubble, Message } from "@/components/ui/message";
import { MessageScroller } from "@/components/ui/message-scroller";
import { Marker } from "@/components/ui/marker";
import { Trace } from "@/components/ui/trace";
import { Attachment, AttachmentGroup } from "@/components/ui/attachment";
import { Questionnaire } from "@/components/ui/questionnaire";
import { CodeBlock } from "@/components/ui/code-block";
import { BackPage, Head, Mark, PlainMarks, S, Tile, frame, type TileDef } from "./mark";
import { MOTION_TILES } from "./showcase-motion";
import { useConfig } from "./config";
import { DAILY, NOW, ORDERS, smartTime, type Order } from "./data";

/* ------------------------------------------------------------ demo data (invented) */

/** Sales per day, this fortnight and the one before, in rupiah. */
export const SALES_14: Datum[] = DAILY.slice(-14).map((d, i) => ({ label: d.label, now: Math.round(d.value * 1e6), before: Math.round(DAILY[i + 2].value * 0.88 * 1e6) }));
export const SALES_SERIES = [
  { key: "now", label: "This fortnight" },
  { key: "before", label: "The one before" },
];
/** Orders per hour by channel. */
export const BY_HOUR: Datum[] = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((h, i) => ({
  label: `${String(h).padStart(2, "0")}:00`,
  shopee: Math.round(6 + 9 * Math.sin((i / 13) * Math.PI) + (i % 3)),
  tiktok: Math.round(2 + 7 * Math.sin(((i + 3) / 16) * Math.PI) + ((i + 1) % 2)),
  offline: Math.round(3 + 4 * Math.sin(((i + 1) / 14) * Math.PI)),
}));
export const CHANNELS = [
  { key: "shopee", label: "Shopee" },
  { key: "tiktok", label: "TikTok Shop" },
  { key: "offline", label: "Shops" },
];
export const BY_CHANNEL = [
  { key: "shopee", label: "Shopee", value: 19_840_000 },
  { key: "tiktok", label: "TikTok Shop", value: 12_960_000 },
  { key: "offline", label: "Shops", value: 10_560_000 },
  { key: "tokopedia", label: "Tokopedia", value: 4_880_000 },
];
export const SHOP_SCORES: Datum[] = [
  { label: "Speed", kemang: 86, dago: 64 },
  { label: "Rating", kemang: 92, dago: 88 },
  { label: "Repeat buyers", kemang: 58, dago: 74 },
  { label: "Margin", kemang: 71, dago: 62 },
  { label: "Low returns", kemang: 80, dago: 90 },
  { label: "Stock depth", kemang: 48, dago: 76 },
];
export const SHOP_SERIES = [
  { key: "kemang", label: "Kemang" },
  { key: "dago", label: "Dago" },
];
export const TARGETS = [
  { key: "kemang", label: "Kemang", value: 82_400_000, max: 100_000_000 },
  { key: "senopati", label: "Senopati", value: 61_200_000, max: 90_000_000 },
  { key: "dago", label: "Dago", value: 47_300_000, max: 52_000_000 },
];

const say = (m: string) => () => toast(m, "neutral");
const total = BY_CHANNEL.reduce((s, d) => s + d.value, 0);

/* ------------------------------------------------------------ Charts */

function SalesTrendTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-title font-semibold">Sales</h3>
        <Mark name="chart">
          <ChartLegend items={SALES_SERIES.map((s, i) => ({ label: s.label, color: seriesColor(i) }))} />
        </Mark>
      </div>
      <Mark name="line-chart" className="flex-1">
        <LineChart aria-label="Sales per day" data={SALES_14} series={SALES_SERIES} height={208} legend={false} />
      </Mark>
    </Tile>
  );
}

function OrdersByHourTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">Orders by hour</h3>
      <Mark name="area-chart" className="flex-1">
        <AreaChart aria-label="Orders by hour and channel" data={BY_HOUR} series={CHANNELS} stacked height={176} format={(n) => String(Math.round(n))} />
      </Mark>
    </Tile>
  );
}

function ChannelTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">Sales by channel</h3>
      <Mark name="pie-chart" className="flex flex-1 items-center">
        <PieChart
          aria-label="Sales by channel this month"
          data={BY_CHANNEL}
          size={136}
          center={
            <span className="grid">
              <span className="text-small text-ink-muted">This month</span>
              <span className="text-title font-semibold tabular-nums">Rp {Math.round(total / 1e6)} jt</span>
            </span>
          }
          className="w-full"
        />
      </Mark>
    </Tile>
  );
}

function ShopsComparedTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">Kemang and Dago</h3>
      <Mark name="radar-chart" className="flex-1">
        <RadarChart aria-label="Kemang and Dago compared" data={SHOP_SCORES} series={SHOP_SERIES} size={208} format={(n) => `${n}/100`} />
      </Mark>
    </Tile>
  );
}

function TargetsTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">November targets</h3>
      <Mark name="radial-chart" className="flex flex-1 items-center">
        <RadialChart
          aria-label="Sales against November targets"
          data={TARGETS.map((t) => ({ ...t, display: `Rp ${Math.round(t.value / 1e6)} of ${Math.round(t.max / 1e6)} jt` }))}
          size={136}
          thickness={9}
          gap={5}
          className="w-full"
        />
      </Mark>
    </Tile>
  );
}

/* ------------------------------------------------------------ Navigation */

const NAV_ITEMS = [
  { label: "Dashboard", href: "#", active: false },
  {
    label: "Orders",
    columns: 2 as const,
    links: [
      { title: "All orders", icon: ShoppingBag, active: true },
      { title: "To pack", icon: Box },
      { title: "To ship", icon: Truck },
      { title: "Returns", icon: RefreshCw },
    ],
  },
  {
    label: "Products",
    links: [
      { title: "Catalogue", icon: Grid },
      { title: "Stock", icon: Package },
      { title: "Prices", icon: Tag },
    ],
  },
];

function StoreChromeTile({ className }: { className?: string }) {
  const [page, setPage] = React.useState(3);
  const rows = ORDERS.slice((page - 1) * 4, page * 4);
  return (
    <Tile className={cn("overflow-visible", className)}>
      <Mark name="navigation-menu" className="w-fit max-w-full px-1 pt-1">
        <NavigationMenu items={NAV_ITEMS.map((n) => ({ ...n, links: n.links?.map((l) => ({ ...l, onSelect: say(l.title) })) }))} />
      </Mark>
      <Mark name="breadcrumb" className="px-1">
        <Breadcrumb items={[{ label: "Orders", onClick: say("Orders") }, { label: "Kemang", onClick: say("Kemang") }, { label: "November" , onClick: say("November")}, { label: "To pack" }]} max={3} />
      </Mark>
      <div className="grid gap-px">
        {rows.map((o) => (
          <div key={o.id} className="flex h-row items-center gap-4 rounded-item px-2 text-body">
            <span className="w-24 shrink-0 tabular-nums">{o.id}</span>
            <span className="min-w-0 flex-1 truncate text-ink-muted">{o.items}</span>
            <span className="tabular-nums">{formatRp(o.total)}</span>
          </div>
        ))}
      </div>
      <Mark name="pagination" className="mt-auto">
        <Pagination page={page} pageCount={12} onPageChange={setPage} total={48} pageSize={4} className="px-1" />
      </Mark>
    </Tile>
  );
}

function ReceiptEditorTile({ className }: { className?: string }) {
  const [flags, setFlags] = React.useState<Record<string, boolean>>({ fragile: true });
  const [text, setText] = React.useState("Vas keramik: bubble wrap dua lapis, kardus double wall.\nSelipkan kartu terima kasih.");
  return (
    <Tile className={className}>
      <Mark name="menubar" className="w-fit max-w-full">
        <Menubar
          menus={[
            {
              label: "Order",
              content: (
                <>
                  <MenuItem icon={ThumbsUp} onSelect={say("RMB-24817 marked paid")}>
                    Mark paid
                  </MenuItem>
                  <MenuItem icon={Copy} onSelect={say("RMB-24817 duplicated")}>
                    Duplicate
                  </MenuItem>
                </>
              ),
            },
            {
              label: "Print",
              content: (
                <>
                  <MenuItem icon={FileText} shortcut="⌘P" onSelect={say("Packing slip sent to printer")}>
                    Packing slip
                  </MenuItem>
                  <MenuSub label="Label" icon={Tag}>
                    <MenuItem onSelect={say("JNE label printed")}>JNE</MenuItem>
                    <MenuItem onSelect={say("SiCepat label printed")}>SiCepat</MenuItem>
                  </MenuSub>
                </>
              ),
            },
            {
              label: "Ship",
              content: (
                <MenuGroup>
                  <MenuItem icon={Truck} onSelect={say("Pickup booked")}>
                    Book pickup
                  </MenuItem>
                </MenuGroup>
              ),
            },
          ]}
        />
      </Mark>
      <div className="flex flex-wrap items-center gap-1 px-1">
        <Mark name="toggle" className="flex flex-wrap gap-1">
          {(
            [
              ["fragile", AlertCircle, "Fragile"],
              ["gift", Package, "Gift wrap"],
              ["priority", Truck, "Priority"],
            ] as const
          ).map(([k, I, label]) => (
            <Toggle key={k} size="sm" pressed={!!flags[k]} onPressedChange={(v) => setFlags((m) => ({ ...m, [k]: v }))}>
              <I />
              {label}
            </Toggle>
          ))}
        </Mark>
      </div>
      <Mark name="textarea" className="flex flex-1">
        <Textarea aria-label="Note for the packer" value={text} onChange={(e) => setText(e.target.value)} rows={4} className="flex-1" />
      </Mark>
    </Tile>
  );
}

/* ------------------------------------------------------------ Inputs */

/** The till's one-time code, centred: the playable flow (OtpFlow) under the title. */
function TillSignInTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={cn("items-center", className)}>
      <h3 className="text-title font-semibold">Open the Kemang till</h3>
      <OtpFlow marks className="my-auto w-full" />
    </Tile>
  );
}

function PayoutAccountTile({ className }: { className?: string }) {
  const [bank, setBank] = React.useState("bca");
  const [min, setMin] = React.useState("500.000");
  const [fmt, setFmt] = React.useState("xlsx");
  return (
    <Tile inset="pad" className={cn("gap-4", className)}>
      <h3 className="text-title font-semibold">Payouts</h3>
      <div className="grid gap-1.5">
        <span className="text-body text-ink-muted">Bank</span>
        <Select
          aria-label="Bank"
          value={bank}
          onValueChange={setBank}
          className="w-full"
          options={[
            { value: "bca", label: "BCA · 0123 4567 89" },
            { value: "mandiri", label: "Mandiri · 1300 0123 4567" },
            { value: "bni", label: "BNI · 0987 6543 21" },
          ]}
        />
      </div>
      <div className="grid gap-1.5">
        <span className="text-body text-ink-muted">Pay out when over</span>
        <Mark name="input-group">
          <InputGroup start="Rp" end={<span>a day</span>}>
            <input aria-label="Pay out when over" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} className="tabular-nums" />
          </InputGroup>
        </Mark>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-gap">
        <span className="text-body text-ink-muted">Statement</span>
        <div className="flex shrink-0 items-center gap-gap">
          <Segmented
            aria-label="Statement format"
            value={fmt}
            onValueChange={setFmt}
            options={["csv", "xlsx", "pdf"].map((f) => ({ value: f, label: f.toUpperCase() }))}
          />
          <Mark name="button-group" className="shrink-0">
            <ButtonGroup aria-label="Statement">
              <Button icon aria-label="Download statement" onClick={() => toast(`Statement as ${fmt.toUpperCase()}`, "neutral")}>
                <Download />
              </Button>
              <Button icon aria-label="Email statement" onClick={() => toast("Statement sent to finance@tokodago.example", "neutral")}>
                <Mail />
              </Button>
            </ButtonGroup>
          </Mark>
        </div>
      </div>
    </Tile>
  );
}

function PickupDateTile({ className }: { className?: string }) {
  const [d, setD] = React.useState<Date | null>(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 2));
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">Courier pickup</h3>
      <Mark name="calendar" className="mx-auto w-fit">
        <Calendar value={d} onValueChange={setD} today={NOW} min={NOW} />
      </Mark>
    </Tile>
  );
}

/* ------------------------------------------------------------ Display */

const STATUS_TONE: Record<string, StatusTone> = { Unpaid: "attention", Cancelled: "muted" };

export const ORDER_COLUMNS: DataColumn<Order>[] = [
  { key: "id", header: "Order", locked: true, sortable: true, cell: (o) => <span className="tabular-nums">{o.id}</span> },
  { key: "at", header: "Time", sortable: true, value: (o) => o.at.getTime(), cell: (o) => <span className="text-ink-muted">{smartTime(o.at)}</span> },
  { key: "shop", header: "Shop", sortable: true },
  { key: "items", header: "Items", maxWidth: 200 },
  { key: "customer", header: "Buyer", hidden: true },
  { key: "status", header: "Status", sortable: true, cell: (o) => <Status tone={STATUS_TONE[o.status] ?? "default"}>{o.status}</Status> },
  { key: "total", header: "Total", align: "right", sortable: true, locked: true, cell: (o) => formatRp(o.total) },
];

function OrdersTableTile({ className }: { className?: string }) {
  const [sel, setSel] = React.useState<string[]>([ORDERS[1].id]);
  return (
    <Tile className={className}>
      <Mark name="data-table" className="min-w-0">
        <DataTable rows={ORDERS.slice(0, 40)} columns={ORDER_COLUMNS} rowKey={(o) => o.id} selected={sel} onSelectedChange={setSel} onRowClick={(o) => toast(`${o.id} opened`, "neutral")} pageSize={6} />
      </Mark>
    </Tile>
  );
}

function HelpTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">Help</h3>
      <Mark name="accordion">
        <Accordion
          cards
          defaultValue={["payout"]}
          items={[
            { value: "payout", title: "When does Shopee pay out?", content: "Two days after the buyer confirms, at 09:00. Weekends move to Monday." },
            { value: "cancel", title: "Can I cancel a packed order?", content: "Yes, until the courier scans it. The stock goes back to the shop that packed it." },
            { value: "fees", title: "Why is the admin fee 4,5%?", content: "It’s Shopee’s Star seller rate. TikTok Shop charges 4% on the same items." },
            { value: "shop", title: "How do I add a shop?", content: "Settings, Shops, Add shop. Marketplace shops connect with one sign-in." },
          ]}
        />
      </Mark>
    </Tile>
  );
}

function ProductPhotosTile({ className }: { className?: string }) {
  const tints = ["#c9b79c", "#a8b5a2", "#b9a3a0", "#a9b4c2"]; // grey-ok: photo stand-ins (image content)
  const photoIcon = "text-black/30"; // grey-ok: icon on a photo stand-in
  return (
    <Tile inset="pad" className={className}>
      <h3 className="truncate text-title font-semibold">Gelas kopi tanah liat</h3>
      <Mark name="carousel" className="min-w-0">
        <Carousel aria-label="Product photos" perView={3} gap={8}>
          {tints.map((c, i) =>
            i === 0 ? (
              <Mark key={i} name="aspect-ratio">
                <AspectRatio ratio={1}>
                  <div className="grid size-full place-items-center" style={{ background: c }}>
                    <Package size={28} className={photoIcon} />
                  </div>
                </AspectRatio>
              </Mark>
            ) : (
              <AspectRatio key={i} ratio={1}>
                <div className="grid size-full place-items-center" style={{ background: c }}>
                  <Package size={28} className={photoIcon} />
                </div>
              </AspectRatio>
            ),
          )}
        </Carousel>
      </Mark>
    </Tile>
  );
}

function SuppliersTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Head title="Suppliers" />
      <Mark name="item">
        <ItemList>
          {[
            ["Gerabah Kasongan", "Clay mugs, plates", "3 open"],
            ["Rotan Cirebon", "Baskets, trays", "1 open"],
            ["Tenun Troso", "Table linen", "Paid"],
            ["Kayu Jepara", "Spoons, coasters", "Paid"],
          ].map(([n, d, s]) => (
            <Item key={n} asChild media={<Thumb alt={n} size={32} />} title={n} description={d} end={<span className="text-ink-muted">{s}</span>}>
              <button type="button" onClick={say(n)} className="w-full" />
            </Item>
          ))}
        </ItemList>
      </Mark>
      <Mark name="collapsible" className="mt-auto">
        <Collapsible title="Archived" meta="6">
          Batik Pekalongan, Anyaman Tasik, Keramik Plered and three more.
        </Collapsible>
      </Mark>
    </Tile>
  );
}

/* ------------------------------------------------------------ Overlays */

function ConfirmTile({ className }: { className?: string }) {
  return (
    // The dimmed page runs to the card's edge: no lighter rim around it (a frame inside a frame).
    <Tile inset="none" className={className}>
      <Mark name="alert-dialog" className="m-0 flex flex-1 p-0 rounded-[inherit]!">
        <div className={cn(frame, "rounded-[inherit]")}>
          <BackPage />
          <div className="absolute inset-0 bg-overlay" />
          <div role="alertdialog" aria-label="Cancel 3 orders?" className="absolute inset-x-3 top-1/2 mx-auto grid max-w-[340px] -translate-y-1/2 gap-3 rounded-sheet bg-surface p-pad shadow-dialog">
            <span className="pt-1 text-title font-semibold">Cancel 3 orders?</span>
            <span className="text-body leading-relaxed text-ink-muted">Buyers get their money back today and the stock returns to Kemang.</span>
            <div className="mt-2 flex flex-wrap justify-end gap-gap">
              <Button variant="ghost" onClick={say("Kept")}>
                Keep
              </Button>
              <Button className="bg-on text-on-ink hover:bg-ink-muted focus-visible:bg-ink-muted" onClick={() => toast("3 orders cancelled")}>
                Cancel orders
              </Button>
            </div>
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

function AgentChatTile({ className }: { className?: string }) {
  const [files, setFiles] = React.useState(["restock-dago.csv", "foto-rak.jpg"]);
  return (
    <Tile inset="pad" className={cn("gap-0", className)}>
      <Mark name="message-scroller" className="flex h-[440px] min-h-0 flex-col">
        <MessageScroller className="h-full" watch={files.length}>
          <Mark name="marker">
            <Marker variant="label">Today</Marker>
          </Mark>
          <Message from={{ name: "Dewi Anggraini" }} time="13:52">
            Can we move clay mugs from Dago to Kemang before the weekend?
          </Message>
          <Message from={{ name: "Alora", agent: true }} time="13:52">
            <Mark name="trace" className="mb-2">
              <Trace
                steps={[
                  { id: "s", title: "Read stock at Dago and Kemang", time: "0,8 s", icon: Database, detail: "Gelas kopi tanah liat: Dago 9, Kemang 2. Open orders: Dago 3, Kemang 5." },
                  { id: "o", title: "Checked open orders", time: "0,4 s" },
                  { id: "t", title: "Booked a transfer", status: "running" },
                ]}
              />
            </Mark>
            <p>Yes. Dago has 9 and needs 3 for its open orders, so I’m moving 6 to Kemang.</p>
          </Message>
          <Marker icon={Truck}>Transfer TRF-0412 booked, pickup 15:00</Marker>
          <Mark name="message">
            <Message from={{ name: "Dewi Anggraini" }} mine>
              <span>Perfect. Here’s the shelf photo and the list.</span>
            </Message>
          </Mark>
          <Mark name="attachment" className="ml-auto w-fit max-w-full">
            <AttachmentGroup>
              {files.map((f) => (
                <Attachment key={f} name={f} kind={f.endsWith(".jpg") ? "image" : "doc"} meta={f.endsWith(".jpg") ? "JPG · 1,2 MB" : "CSV · 4 KB"} onRemove={() => setFiles((x) => x.filter((y) => y !== f))} />
              ))}
            </AttachmentGroup>
          </Mark>
          <Message from={{ name: "Alora", agent: true }} time="13:54">
            <p>Here are the rows I’ll import:</p>
            <Mark name="code-block" className="mt-2">
              <CodeBlock title="restock-dago.csv" lineNumbers code={"sku,from,to,qty\nRMB-GL-014,Dago,Kemang,6\nRMB-MB-005,Dago,Kemang,4"} onCopy={say("Copied")} />
            </Mark>
          </Message>
          <Bubble align="end" reactions={<span className="inline-flex h-6 items-center gap-1 rounded-item bg-fill px-bubble-sm text-small text-ink-muted"><ThumbsUp size={12} />1</span>}>
            Go ahead
          </Bubble>
        </MessageScroller>
      </Mark>
    </Tile>
  );
}

function BeforeRestockTile({ className }: { className?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">Before I restock</h3>
      <Mark name="questionnaire" className="flex-1">
        {done ? (
          <div className="grid h-full place-items-center gap-2 py-8 text-center">
            <AlertCircle size={40} strokeWidth={1.5} className="text-ink-muted" />
            <span className="text-title font-semibold">Answers sent</span>
            <Button variant="ghost" size="sm" onClick={() => setDone(false)}>
              Start again
            </Button>
          </div>
        ) : (
          <Questionnaire
            questions={[
              { name: "shops", title: "Which shops should I restock?", type: "multiple", options: ["Kemang", "Senopati", "Dago"], required: true },
              { name: "when", title: "When should the stock arrive?", type: "single", options: ["Before Friday", "Next week", "No rush"] },
              { name: "note", title: "Anything the supplier should know?", type: "text", placeholder: "Pack the mugs in pairs" },
            ]}
            onSubmit={() => (setDone(true), toast("Answers sent"))}
          />
        )}
      </Mark>
    </Tile>
  );
}

/* ------------------------------------------------------------ the tiles, by category */

export const MORE_TILES: Partial<Record<Group, TileDef[]>> = {
  Charts: [
    { items: ["chart", "line-chart"], render: () => <SalesTrendTile className={S[8]} /> },
    { items: ["area-chart"], render: () => <OrdersByHourTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
    { items: ["pie-chart"], render: () => <ChannelTile className={S[4]} /> },
    { items: ["radar-chart"], render: () => <ShopsComparedTile className={S[4]} /> },
    { items: ["radial-chart"], render: () => <TargetsTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
  ],
  Navigation: [
    { items: ["navigation-menu", "breadcrumb", "pagination"], render: () => <StoreChromeTile className={S[7]} /> },
    { items: ["menubar", "toggle", "textarea"], render: () => <ReceiptEditorTile className={cn(S[5], "md:col-span-2 lg:col-span-5")} /> },
  ],
  Inputs: [
    { items: ["label", "input-otp"], render: () => <TillSignInTile className={S[4]} /> },
    { items: ["input-group", "button-group"], render: () => <PayoutAccountTile className={S[4]} /> },
    { items: ["calendar"], render: () => <PickupDateTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
  ],
  Display: [
    { items: ["data-table"], render: () => <OrdersTableTile className={S[8]} /> },
    { items: ["accordion"], render: () => <HelpTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
    { items: ["carousel", "aspect-ratio"], render: () => <ProductPhotosTile className={S[6]} /> },
    { items: ["item", "collapsible"], render: () => <SuppliersTile className={S[6]} /> },
  ],
  Overlays: [
    { items: ["alert-dialog"], render: () => <ConfirmTile className={S[12]} /> },
  ],
  // Chat: the two threads share the first row (7 + 5, with Ask from MOTION_TILES), the two decision cards the second
  // (6 + 6), so no card is stretched to a much taller neighbour.
  Chat: [
    { items: ["marker", "trace", "message", "attachment", "code-block", "message-scroller"], render: () => <AgentChatTile className={S[7]} /> },
    { items: ["questionnaire"], render: () => <BeforeRestockTile className={S[6]} /> },
  ],
};

/** The order the landing shows the new bands in. */
const LANDING_GROUPS: Group[] = ["Charts", "Navigation", "Inputs", "Display", "Overlays", "Chat"];

/** On the landing: the shadcn-parity components live, one band per category, the same tiles as the Components page. */
export function MoreBento() {
  const [config] = useConfig();
  const tiles = (g: Group) => [...(MORE_TILES[g] ?? []), ...((MOTION_TILES as Partial<Record<Group, TileDef[]>>)[g] ?? [])];
  const names = LANDING_GROUPS.flatMap((g) => tiles(g).flatMap((t) => t.items));
  return (
    <PlainMarks.Provider value={true}>
      <section aria-label="More components" data-landing="more" data-more={names.filter((n) => findItem(n)).join(",")} className="mx-auto mt-20 grid w-full max-w-[1280px] gap-14 px-4 sm:px-6">
        {LANDING_GROUPS.map((g) => (
          <section key={g} aria-label={g} data-band={g} className="grid gap-4">
            <h2 className="px-1 text-title font-semibold text-ink">{g}</h2>
            <div className="grid grid-flow-row-dense grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
              {tiles(g).map((t) => (
                <React.Fragment key={t.items.join()}>{t.render(config)}</React.Fragment>
              ))}
            </div>
          </section>
        ))}
      </section>
    </PlainMarks.Provider>
  );
}

