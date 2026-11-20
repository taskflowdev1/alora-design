import * as React from "react";
import { Box, Copy, Edit2, Folder, Plus, Printer, RefreshCw, Settings, ShoppingBag, Trash2, Truck, User } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Table, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { Status } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { Thumb } from "@/components/ui/thumb";
import { toast } from "@/components/ui/toast";
import { MenuItem } from "@/components/ui/menu";
import { CommandPalette } from "@/components/ui/command-palette";
import { DateRangePicker, DEFAULT_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { TimePicker } from "@/components/ui/time-picker";
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
import { Kbd } from "@/components/ui/kbd";
import { Sparkline } from "@/components/ui/sparkline";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Steps } from "@/components/ui/steps";
import { Timeline } from "@/components/ui/timeline";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { NotificationBell } from "@/components/ui/notification-bell";
import { KanbanCard, KanbanColumn } from "@/components/ui/kanban-card";
import { CalendarMonth } from "@/components/ui/calendar-month";
import { Dropzone, type DropFile } from "@/components/ui/dropzone";
import { TagInput } from "@/components/ui/tag-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { CALENDAR_EVENTS, MARKET_SHOPS, NOTICES, NOW, ORDERS, PRODUCTS, SPARK, TEAM, type Order } from "../data";
import { CommentsDemo } from "../demos-niche";
import { Head, Mark, Tile, stack } from "../mark";
import { say } from "./shared";

/* ------------------------------------------------------------ Niche */

const PAYOUT_COLS = [
  { key: "shop", label: "Shop", locked: true },
  { key: "expected", label: "Expected" },
  { key: "counted", label: "Counted" },
  { key: "trend", label: "Trend" },
  { key: "diff", label: "Difference", locked: true },
];

export function PayoutsTile({ className }: { className?: string }) {
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

export function PaletteTile({ className }: { className?: string }) {
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

export function OrderTile({ className }: { className?: string }) {
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

export function NotesTile({ className }: { className?: string }) {
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
              <a href="#customer" onClick={(e) => e.preventDefault()} className="rounded-small font-medium text-ink hover:bg-fill focus-visible:bg-fill">
                {o.customer}
              </a>
            }
          >
            <div className="flex items-center gap-3">
              <Avatar name={o.customer} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-body font-semibold">{o.customer}</p>
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

export function ProductTile({ className }: { className?: string }) {
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

/** One event fewer than the landing's calendar: today holds two, so the tile's small cell doesn't overflow. */
const CALENDAR_EVENTS_SHORT = CALENDAR_EVENTS.filter((e) => e.id !== "f");

export function CalendarTile({ className }: { className?: string }) {
  const [m, setM] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  return (
    <Tile className={className}>
      <Mark name="calendar-month" className="flex-1">
        {/* The month row takes the tile title inset (Head: px-2 pt-1), so "November 2026" lines up with the titles beside it. */}
        <CalendarMonth
          month={m}
          onMonthChange={setM}
          events={CALENDAR_EVENTS_SHORT}
          today={NOW}
          onEventClick={(e) => toast(e.title, "neutral")}
          className="[&>div:first-child]:px-2 [&>div:first-child]:pt-1"
        />
      </Mark>
    </Tile>
  );
}

export function PackStack({ className }: { className?: string }) {
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

export function PricesTile({ className }: { className?: string }) {
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
                    prefix="Rp"
                    {...grouped}
                    validate={(v) => (/^\d+$/.test(v) ? null : "Numbers only")}
                    onSave={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, price: Number(v) } : x)))}
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

export function ShipmentTile({ className }: { className?: string }) {
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
