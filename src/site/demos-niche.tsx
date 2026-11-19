/* eslint-disable react-hooks/rules-of-hooks */
import * as React from "react";
import {
  Archive,
  Bold,
  Box,
  Columns,
  Copy,
  Edit2,
  FileText,
  Grid,
  Home,
  Italic,
  List,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Settings,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  Underline,
  User,
  XCircle,
} from "react-feather";
import { formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Thumb } from "@/components/ui/thumb";
import { toast } from "@/components/ui/toast";
import { MenuItem } from "@/components/ui/menu";
import { Table, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { CommandPalette, useCommandShortcut } from "@/components/ui/command-palette";
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
import { InlineEdit, grouped } from "@/components/ui/inline-edit";
import { CopyChip } from "@/components/ui/copy-chip";
import { Kbd, Shortcut } from "@/components/ui/kbd";
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
import { MARKET_SHOPS, NOW, ORDERS, PRODUCTS, SPARK, TEAM } from "./data";
import type { Demo } from "./demos";

const add = (n: number) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + n);

export function CommandDemo({ open: forced }: { open?: boolean }) {
  const [open, setOpen] = React.useState(!!forced);
  useCommandShortcut(setOpen);
  const say = (m: string) => () => toast(m, "neutral");
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Search
        <Shortcut keys={["mod", "K"]} />
      </Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={[
          {
            label: "Actions",
            items: [
              { id: "new-order", label: "New order", icon: Plus, shortcut: ["N"], onSelect: say("New order") },
              { id: "new-product", label: "New product", icon: Package, onSelect: say("New product") },
              { id: "print", label: "Print packing slips", icon: Printer, shortcut: ["mod", "P"], onSelect: say("Printing 12 slips") },
              { id: "sync", label: "Sync stock now", icon: RefreshCw, keywords: "shopee tiktok", onSelect: say("Syncing 7 shops") },
            ],
          },
          {
            label: "Go to",
            items: [
              { id: "dashboard", label: "Dashboard", icon: Home, onSelect: say("Dashboard") },
              { id: "orders", label: "Orders", icon: ShoppingBag, onSelect: say("Orders") },
              { id: "promotions", label: "Promotions", icon: Tag, onSelect: say("Promotions") },
              { id: "cancellations", label: "Cancellations", icon: XCircle, onSelect: say("Cancellations") },
              { id: "settings", label: "Settings", icon: Settings, shortcut: ["mod", ","], onSelect: say("Settings") },
            ],
          },
          {
            label: "Orders",
            items: ORDERS.slice(0, 4).map((o) => ({ id: o.id, label: `${o.id} · ${o.customer}`, keywords: o.items, icon: FileText, onSelect: say(o.id) })),
          },
        ]}
      />
    </>
  );
}

export function DateRangeDemo() {
  const [r, setR] = React.useState<DateRange>(DEFAULT_PRESETS[2].range(NOW));
  return <DateRangePicker value={r} onValueChange={setR} today={NOW} />;
}

export function ShopPickerDemo() {
  const [v, setV] = React.useState(MARKET_SHOPS.map((s) => s.id));
  return <ShopPicker shops={MARKET_SHOPS} value={v} onValueChange={setV} />;
}

export function FeeDemo({ market = "shopee" as "shopee" | "tiktok" }) {
  const lines = [
    { payer: "buyer" as const, label: "Items, 2 × Gelas kopi", amount: 178000 },
    { payer: "buyer" as const, label: "Shipping", amount: 18000, shipping: true },
    { payer: "platform" as const, label: "Admin fee 4,5%", amount: -8010 },
    { payer: "platform" as const, label: "Free shipping programme", amount: -4000 },
    { payer: "shop" as const, label: "Voucher RIMBA10", amount: -17800 },
  ];
  return (
    <Card inset="nest" className="grid w-full max-w-md gap-px">
      {lines.map((l) => (
        <FeeRow key={l.label} market={market} {...l} />
      ))}
      <FeeTotal label="You receive" amount={lines.reduce((a, l) => a + l.amount, 0)} className="mt-1" />
    </Card>
  );
}

export function CommentsDemo() {
  const me = TEAM[0].name;
  const [list, setList] = React.useState<Comment[]>([
    { id: "1", author: TEAM[1].name, time: "Today, 13:52", body: "Buyer asked to swap the glaze to green. Stock has 9.", reactions: [{ emoji: "👍", by: [TEAM[2].name] }] },
    { id: "2", author: TEAM[3].name, time: "Today, 14:05", body: "Swapped and repacked. Courier picks up at 16:00.", reactions: [{ emoji: "🙏", by: [TEAM[1].name, me] }] },
  ]);
  return (
    <div className="w-full max-w-md">
      <CommentThread
        me={me}
        comments={list}
        onReact={(id, emoji) =>
          setList((l) =>
            l.map((c) => {
              if (c.id !== id) return c;
              const rs = c.reactions ?? [];
              const r = rs.find((x) => x.emoji === emoji);
              const next = r
                ? rs.map((x) => (x.emoji === emoji ? { ...x, by: x.by.includes(me) ? x.by.filter((b) => b !== me) : [...x.by, me] } : x))
                : [...rs, { emoji, by: [me] }];
              return { ...c, reactions: next };
            }),
          )
        }
        onReply={(text) => setList((l) => [...l, { id: String(l.length + 1), author: me, time: "Today, 14:20", body: text }])}
      />
    </div>
  );
}

export function KanbanDemo() {
  const card = (o: (typeof ORDERS)[number], i: number) => (
    <KanbanCard
      key={o.id}
      title={o.items}
      id={o.id}
      media={<Thumb alt={o.items} />}
      tags={[o.shop]}
      people={[{ name: TEAM[i % 4].name }]}
      due={i === 0 ? "Today" : "Tomorrow"}
      attention={i === 0}
      onClick={() => toast(o.id, "neutral")}
    />
  );
  return (
    <div className="flex w-full max-w-2xl gap-3 overflow-auto">
      <KanbanColumn title="To pack" count={3} className="flex-1">
        {ORDERS.slice(0, 2).map(card)}
      </KanbanColumn>
      <KanbanColumn title="Packed" count={1} className="flex-1 max-sm:hidden">
        {ORDERS.slice(2, 3).map((o) => card(o, 2))}
      </KanbanColumn>
    </div>
  );
}

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

export function CalendarDemo() {
  const [m, setM] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  return <CalendarMonth month={m} onMonthChange={setM} events={EVENTS} today={NOW} onEventClick={(e) => toast(e.title, "neutral")} className="w-full max-w-3xl" />;
}

export const NICHE_DEMOS: Record<string, Demo> = {
  "command-palette": {
    render: () => <CommandDemo />,
    usage: () =>
      `const [open, setOpen] = useState(false);\nuseCommandShortcut(setOpen); // Cmd+K / Ctrl+K\n\n<CommandPalette open={open} onOpenChange={setOpen} groups={[\n  { label: "Actions", items: [{ id: "new", label: "New order", icon: Plus, shortcut: ["N"], onSelect: newOrder }] },\n]} />\n\n// In place (no dialog), e.g. in a side card:\n<CommandPalette inline groups={groups} />`,
  },
  "date-range-picker": {
    render: () => <DateRangeDemo />,
    usage: () => `<DateRangePicker value={range} onValueChange={setRange} />  // presets: Today … Last month; reads "3–9 Nov 2026"`,
  },
  "time-picker": {
    controls: [{ key: "step", type: "select", label: "Step", options: ["5", "15", "30"], labels: ["5 min", "15 min", "30 min"], default: "15" }],
    render: (p) => {
      const [v, setV] = React.useState<string | null>("16:00");
      return <TimePicker value={v} onValueChange={setV} step={Number(p.step) as 15} />;
    },
    usage: (p) => `<TimePicker value={time} onValueChange={setTime} step={${p.step}} />  // "16:00", 24-hour`,
  },
  "quantity-stepper": {
    controls: [{ key: "size", type: "select", label: "Size", options: ["default", "sm"], default: "default" }],
    render: (p) => {
      const [v, setV] = React.useState(2);
      return (
        <div className="flex items-center gap-4">
          <Thumb alt="Gelas kopi" size={40} />
          <div className="grid">
            <span className="text-body">Gelas kopi tanah liat</span>
            <span className="text-small tabular-nums text-ink-muted">{formatRp(89000 * v)}</span>
          </div>
          <QuantityStepper value={v} onValueChange={setV} min={0} max={9} size={p.size as "sm"} />
        </div>
      );
    },
    usage: (p) => `<QuantityStepper value={qty} onValueChange={setQty} min={0} max={stock}${p.size === "sm" ? ` size="sm"` : ""} />`,
  },
  "currency-input": {
    render: () => {
      const [v, setV] = React.useState<number | null>(12400000);
      return <CurrencyInput aria-label="Price" value={v} onValueChange={setV} className="w-56" />;
    },
    usage: () => `<CurrencyInput aria-label="Price" value={price} onValueChange={setPrice} />  // types as Rp 12.400.000`,
  },
  diff: {
    stage: "page",
    render: () => {
      const rows = [
        ["Kemang", 12400000, 12400000],
        ["Senopati", 9800000, 9812000],
        ["Dago", 7100000, 7085500],
        ["Rimba Official", 8900000, 8900000],
      ] as const;
      return (
        <Card inset="nest">
          <Table>
            <THead>
              <tr>
                <TH>Shop</TH>
                <TH align="right">Expected</TH>
                <TH align="right">Counted</TH>
                <TH align="right">Difference</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map(([s, e, c]) => (
                <TRow key={s}>
                  <TD>{s}</TD>
                  <TD align="right">{formatRp(e)}</TD>
                  <TD align="right">{formatRp(c)}</TD>
                  <TD align="right">
                    <Diff value={c - e} unit="Rp" />
                  </TD>
                </TRow>
              ))}
            </TBody>
          </Table>
        </Card>
      );
    },
    usage: () => `<Diff value={counted - expected} unit="Rp" />  // green or red only when there is a difference; "—" otherwise`,
  },
  "fee-row": {
    stage: "page",
    controls: [{ key: "market", type: "select", label: "Platform", options: ["shopee", "tiktok"], labels: ["Shopee", "TikTok Shop"], default: "shopee" }],
    render: (p) => <FeeDemo market={p.market as "shopee"} />,
    usage: () => `<FeeRow payer="buyer" label="Shipping" amount={18000} shipping />\n<FeeRow payer="platform" market="shopee" label="Admin fee 4,5%" amount={-8010} />\n<FeeRow payer="shop" label="Voucher RIMBA10" amount={-17800} />\n<FeeTotal label="You receive" amount={166190} />`,
  },
  "marketplace-mark": {
    controls: [{ key: "size", type: "select", label: "Size", options: ["16", "24", "32"], labels: ["16 px", "24 px", "32 px"], default: "24" }],
    render: (p) => (
      <div className="grid gap-3">
        {(["shopee", "tiktok", "tokopedia", "offline"] as const).map((m) => (
          <span key={m} className="flex items-center gap-2.5 text-body">
            <MarketMark market={m} size={Number(p.size)} />
            {{ shopee: "Shopee", tiktok: "TikTok Shop", tokopedia: "Tokopedia", offline: "Shop" }[m]}
          </span>
        ))}
      </div>
    ),
    usage: (p) => `<MarketMark market="shopee" size={${p.size}} />`,
  },
  "shop-picker": {
    render: () => <ShopPickerDemo />,
    usage: () => `<ShopPicker shops={shops} value={ids} onValueChange={setIds} quick={["shopee", "tiktok"]} />`,
  },
  "split-button": {
    controls: [{ key: "variant", type: "select", label: "Variant", options: ["primary", "secondary"], default: "primary" }],
    render: (p) => (
      <SplitButton variant={p.variant as "primary"} onClick={() => toast("12 orders packed")} menu={
        <>
          <MenuItem icon={Printer} onSelect={() => toast("Printing slips", "neutral")}>Pack and print slips</MenuItem>
          <MenuItem icon={Truck} onSelect={() => toast("Courier booked", "neutral")}>Pack and book courier</MenuItem>
          <MenuItem icon={Archive} onSelect={() => toast("Moved to on hold", "neutral")}>Put on hold</MenuItem>
        </>
      }>
        <Box />
        Pack 12 orders
      </SplitButton>
    ),
    usage: () => `<SplitButton onClick={pack} menu={<>\n  <MenuItem icon={Printer}>Pack and print slips</MenuItem>\n  <MenuItem icon={Truck}>Pack and book courier</MenuItem>\n</>}>\n  <Box />Pack 12 orders\n</SplitButton>`,
  },
  "toggle-group": {
    controls: [
      { key: "type", type: "select", label: "Type", options: ["multiple", "single"], default: "multiple" },
      { key: "icons", type: "toggle", label: "Icons only", default: false },
    ],
    render: (p) => {
      const [v, setV] = React.useState(["shopee", "tiktok"]);
      const [f, setF] = React.useState(["bold"]);
      const [view, setView] = React.useState("list");
      if (p.type === "single")
        return (
          <ToggleGroup
            type="single"
            aria-label="View"
            value={view}
            onValueChange={setView}
            options={[
              { value: "list", label: p.icons ? <List /> : <><List />List</>, "aria-label": "List" },
              { value: "grid", label: p.icons ? <Grid /> : <><Grid />Grid</>, "aria-label": "Grid" },
              { value: "board", label: p.icons ? <Columns /> : <><Columns />Board</>, "aria-label": "Board" },
            ]}
          />
        );
      return (
        <div className="grid justify-items-center gap-4">
          <ToggleGroup
            aria-label="Channels"
            value={v}
            onValueChange={setV}
            options={[
              { value: "offline", label: <><MarketMark market="offline" />Shops</> },
              { value: "shopee", label: <><MarketMark market="shopee" />Shopee</> },
              { value: "tiktok", label: <><MarketMark market="tiktok" />TikTok</> },
            ]}
          />
          <ToggleGroup
            aria-label="Text style"
            value={f}
            onValueChange={setF}
            options={[
              { value: "bold", label: p.icons ? <Bold /> : <><Bold />Bold</>, "aria-label": "Bold" },
              { value: "italic", label: p.icons ? <Italic /> : <><Italic />Italic</>, "aria-label": "Italic" },
              { value: "underline", label: p.icons ? <Underline /> : <><Underline />Underline</>, "aria-label": "Underline" },
            ]}
          />
        </div>
      );
    },
    usage: (p) =>
      p.type === "single"
        ? `<ToggleGroup type="single" value={view} onValueChange={setView} options={[\n  { value: "list", label: <><List />List</> },\n  { value: "grid", label: <><Grid />Grid</> },\n]} />`
        : `<ToggleGroup value={channels} onValueChange={setChannels} options={[\n  { value: "shopee", label: <><MarketMark market="shopee" />Shopee</> },\n  { value: "tiktok", label: <><MarketMark market="tiktok" />TikTok</> },\n]} />`,
  },
  "context-menu": {
    stage: "page",
    render: () => (
      <Card inset="nest" className="w-full max-w-md">
        <Table>
          <TBody>
            {ORDERS.slice(0, 4).map((o) => (
              <ContextMenu
                key={o.id}
                menu={
                  <>
                    <ContextMenuItem icon={Edit2} shortcut="E" onSelect={() => toast(`Edit ${o.id}`, "neutral")}>Edit</ContextMenuItem>
                    <ContextMenuItem icon={Copy} onSelect={() => toast(`${o.id} copied`, "neutral")}>Copy order number</ContextMenuItem>
                    <ContextMenuSub icon={Truck} label="Move to">
                      <ContextMenuItem>To pack</ContextMenuItem>
                      <ContextMenuItem>On hold</ContextMenuItem>
                    </ContextMenuSub>
                    <ContextMenuGroup>
                      <ContextMenuItem icon={Trash2} onSelect={() => toast(`${o.id} cancelled`)}>Cancel order</ContextMenuItem>
                    </ContextMenuGroup>
                  </>
                }
              >
                <TRow onActivate={() => {}}>
                  <TD>{o.id}</TD>
                  <TD>{o.customer}</TD>
                  <TD align="right">{formatRp(o.total)}</TD>
                </TRow>
              </ContextMenu>
            ))}
          </TBody>
        </Table>
      </Card>
    ),
    usage: () => `<ContextMenu menu={<>\n  <ContextMenuItem icon={Edit2}>Edit</ContextMenuItem>\n  <ContextMenuSub label="Move to">…</ContextMenuSub>\n</>}>\n  <TRow>…</TRow>\n</ContextMenu>  // right click the row`,
  },
  "hover-card": {
    render: () => {
      const o = ORDERS[3];
      return (
        <p className="max-w-sm text-body text-ink-muted">
          Last order from{" "}
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
              {[["Orders", "14"], ["Spent", "Rp 3,2 jt"], ["Returns", "0"]].map(([k, v]) => (
                <div key={k} className="grid gap-0.5 rounded-item bg-fill px-2.5 py-2">
                  <span className="text-small text-ink-muted">{k}</span>
                  <span className="font-semibold tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </HoverCard>
          , {formatRp(o.total)}.
        </p>
      );
    },
    usage: () => `<HoverCard trigger={<a href="/customers/rina">Rina S.</a>}>\n  …customer preview…\n</HoverCard>`,
  },
  "column-menu": {
    render: () => {
      const cols = [
        { key: "order", label: "Order", locked: true },
        { key: "time", label: "Time" },
        { key: "shop", label: "Shop" },
        { key: "customer", label: "Customer" },
        { key: "items", label: "Items" },
        { key: "payment", label: "Payment" },
        { key: "total", label: "Total", locked: true },
        { key: "fee", label: "Fee" },
        { key: "diff", label: "Difference", locked: true },
      ];
      const [v, setV] = React.useState(["time", "shop", "customer", "items", "fee"]);
      return <ColumnMenu columns={cols} visible={v} onVisibleChange={setV} defaults={["time", "shop", "customer", "items", "fee"]} />;
    },
    usage: () => `<ColumnMenu columns={[{ key: "order", label: "Order", locked: true }, …]} visible={cols} onVisibleChange={setCols} />`,
  },
  "inline-edit": {
    stage: "page",
    render: () => {
      const [rows, setRows] = React.useState(PRODUCTS.slice(0, 4).map((p) => ({ ...p })));
      return (
        <Card inset="nest" className="w-full max-w-lg">
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
                  <TD align="right" className="w-36">
                    <InlineEdit
                      align="right"
                      aria-label={`${r.name} price`}
                      inputMode="numeric"
                      value={String(r.price)}
                      prefix="Rp"
                      {...grouped}
                      validate={(v) => (/^\d+$/.test(v) ? null : "Numbers only")}
                      onSave={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, price: Number(v) } : x)))}
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
              ))}
            </TBody>
          </Table>
        </Card>
      );
    },
    usage: () => `<InlineEdit value={String(price)} prefix="Rp" {...grouped} onSave={savePrice} align="right" />`,
  },
  "copy-chip": {
    render: () => (
      <div className="flex flex-wrap items-center gap-gap">
        <CopyChip value="RMB-24817" />
        <CopyChip value="JNE 0123 4567 8910">Resi JNE 0123 4567 8910</CopyChip>
        <CopyChip value="RMB-GL-014" />
      </div>
    ),
    usage: () => `<CopyChip value="RMB-24817" />`,
  },
  kbd: {
    render: () => (
      <div className="grid gap-2 text-body">
        {[
          ["Search", ["mod", "K"]],
          ["New order", ["N"]],
          ["Print slips", ["mod", "P"]],
          ["Next order", ["J"]],
        ].map(([l, k]) => (
          <div key={l as string} className="flex w-56 items-center justify-between gap-4">
            <span>{l as string}</span>
            <Shortcut keys={k as string[]} />
          </div>
        ))}
        <div className="mt-2 flex gap-1">
          <Kbd>Esc</Kbd>
          <Kbd>↵</Kbd>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
        </div>
      </div>
    ),
    usage: () => `<Shortcut keys={["mod", "K"]} />  // ⌘ K on Mac, Ctrl K elsewhere\n<Kbd>Esc</Kbd>`,
  },
  sparkline: {
    stage: "page",
    controls: [{ key: "kind", type: "select", label: "Kind", options: ["line", "bars"], default: "line" }],
    render: (p) => (
      <div className="grid w-full max-w-sm gap-2">
        {[
          ["Kemang", 12400000, SPARK],
          ["Senopati", 9800000, [9, 11, 10, 9, 12, 11, 10, 9, 11, 10, 12, 11]],
          ["Dago", 7100000, [14, 13, 12, 12, 11, 10, 11, 9, 9, 8, 8, 7]],
        ].map(([s, v, d]) => (
          <Card key={s as string} className="flex items-center gap-4 py-3">
            <span className="min-w-0 flex-1 truncate text-body">{s as string}</span>
            <Sparkline data={d as number[]} kind={p.kind as "line"} aria-label={`${s} last 12 weeks`} />
            <span className="w-28 text-right text-body font-medium tabular-nums">{formatRp(v as number)}</span>
          </Card>
        ))}
      </div>
    ),
    usage: (p) => `<Sparkline data={weekly}${p.kind === "bars" ? ` kind="bars"` : ""} aria-label="Last 12 weeks" />`,
  },
  "progress-ring": {
    controls: [{ key: "size", type: "select", label: "Size", options: ["40", "56", "80"], labels: ["40 px", "56 px", "80 px"], default: "56" }],
    render: (p) => (
      <div className="flex items-center gap-6">
        {[
          [72, "Budget used"],
          [38, "Packed"],
          [100, "Synced"],
        ].map(([v, l]) => (
          <div key={l as string} className="grid justify-items-center gap-2">
            <ProgressRing value={v as number} size={Number(p.size)} aria-label={l as string} />
            <span className="text-body text-ink-muted">{l as string}</span>
          </div>
        ))}
      </div>
    ),
    usage: (p) => `<ProgressRing value={72} size={${p.size}} aria-label="Budget used" />`,
  },
  steps: {
    controls: [{ key: "current", type: "select", label: "Current", options: ["0", "1", "2", "3", "4"], labels: ["Paid", "Packed", "Shipped", "Delivered", "All done"], default: "2" }],
    render: (p) => <Steps steps={["Paid", "Packed", "Shipped", "Delivered"]} current={Number(p.current)} className="w-full max-w-md" />,
    usage: (p) => `<Steps steps={["Paid", "Packed", "Shipped", "Delivered"]} current={${p.current}} />`,
  },
  timeline: {
    render: () => (
      <Timeline
        className="w-full max-w-md"
        events={[
          { id: "1", time: "Today, 14:05", title: "Picked up by JNE", media: <Truck /> },
          { id: "2", time: "Today, 11:40", title: `Packed by ${TEAM[3].name}`, media: <Box /> },
          { id: "3", time: "Today, 09:12", title: "Paid with QRIS", detail: formatRp(434000) },
          { id: "4", time: "Yesterday, 21:30", title: "Ordered on Shopee", media: <MarketMark market="shopee" /> },
          { id: "5", time: "Yesterday, 21:28", title: "Buyer asked about the glaze", media: <User /> },
        ]}
      />
    ),
    usage: () => `<Timeline events={[{ id: "1", time: "Today, 14:05", title: "Picked up by JNE", media: <Truck /> }, …]} />`,
  },
  "comment-thread": {
    stage: "page",
    render: () => (
      <Card className="w-full max-w-md">
        <CommentsDemo />
      </Card>
    ),
    usage: () => `<CommentThread me="Rizky Hartono" comments={comments} onReact={(id, emoji) => …} onReply={(text) => …} />`,
  },
  dropzone: {
    render: () => {
      const [files, setFiles] = React.useState<DropFile[]>([
        { id: "a", name: "gelas-kopi-hijau.jpg", size: 1840000 },
        { id: "b", name: "piring-rotan-set.jpg", size: 2310000, progress: 64 },
      ]);
      return (
        <Dropzone
          className="w-full max-w-md"
          title="Drop product photos"
          accept="image/*"
          files={files}
          onRemove={(id) => setFiles(files.filter((f) => f.id !== id))}
          onFiles={(fs) => setFiles([...files, ...fs.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size }))])}
        />
      );
    },
    usage: () => `<Dropzone title="Drop product photos" accept="image/*" files={files} onFiles={upload} onRemove={remove} />`,
  },
  "tag-input": {
    render: () => {
      const [v, setV] = React.useState(["Rotan", "Handmade"]);
      return <TagInput value={v} onValueChange={setV} suggestions={["Keramik", "Kayu jati", "Bambu", "Best seller", "Pre-order"]} className="w-full max-w-sm" />;
    },
    usage: () => `<TagInput value={tags} onValueChange={setTags} suggestions={["Keramik", "Bambu"]} />`,
  },
  "avatar-group": {
    controls: [{ key: "max", type: "select", label: "Shown", options: ["2", "3", "4"], default: "3" }],
    render: (p) => <AvatarGroup people={[...TEAM, { name: "Wulan Sari" }, { name: "Eko Prasetyo" }]} max={Number(p.max)} />,
    usage: (p) => `<AvatarGroup people={team} max={${p.max}} />`,
  },
  "notification-bell": {
    render: () => {
      const [list, setList] = React.useState<Notice[]>([
        { id: "1", title: "2 shops haven’t synced since 09:40", time: "Today, 10:10", unread: true },
        { id: "2", title: "Payout of Rp 12.840.000 sent", time: "Today, 08:02", unread: true },
        { id: "3", title: "Keranjang pandan besar is out of stock", time: "Yesterday, 19:45", unread: true },
        { id: "4", title: "Dewi changed the courier for Dago", time: "Yesterday, 15:20" },
      ]);
      return <NotificationBell notices={list} onMarkAllRead={() => setList(list.map((n) => ({ ...n, unread: false })))} />;
    },
    usage: () => `<NotificationBell notices={notices} onMarkAllRead={markAllRead} />`,
  },
  "kanban-card": {
    stage: "page",
    render: () => <KanbanDemo />,
    usage: () => `<KanbanColumn title="To pack" count={3}>\n  <KanbanCard title="Gelas kopi" id="RMB-24817" media={<Thumb … />} tags={["Kemang"]} people={[…]} due="Today" />\n</KanbanColumn>`,
  },
  "calendar-month": {
    render: () => <CalendarDemo />,
    usage: () => `<CalendarMonth month={month} onMonthChange={setMonth} events={[{ id, date, title, tone: "accent" }]} />`,
  },
};
