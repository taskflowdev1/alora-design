// Showpiece batch H: page demos and Components-page tiles for its new components (inside a Mark, exactly once), and
// its landing moments. Aggregated in ./index.ts.
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateRangePicker, type DateRange, type RangePreset } from "@/components/ui/date-range-picker";
import { FilterSearch, type FilterField, type FilterToken } from "@/components/ui/filter-search";
import { grouped, InlineEdit } from "@/components/ui/inline-edit";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import type { Option } from "@/components/ui/select";
import { addDays, cn, formatRp, startOfDay } from "@/lib/ad";
import type { Demo } from "../demos";
import { Mark, S, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

const stay = (e: React.MouseEvent) => e.stopPropagation();
const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

/** Outside the piece, with its height kept, so nothing moves when it appears. */
function StartOver({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <div className="flex h-control items-center justify-center">
      {show ? (
        <Button size="sm" variant="ghost" onClick={onClick} className="animate-[ad-fade-in_220ms_var(--ad-ease)_both]">
          Start over
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ date range */

const TODAY = new Date(2026, 10, 20);
const RANGE_PRESETS: RangePreset[] = [
  { key: "today", label: "Today", range: (t) => ({ from: startOfDay(t), to: startOfDay(t) }) },
  { key: "7d", label: "7 days", range: (t) => ({ from: addDays(t, -6), to: startOfDay(t) }) },
  { key: "30d", label: "30 days", range: (t) => ({ from: addDays(t, -29), to: startOfDay(t) }) },
  { key: "month", label: "This month", range: (t) => ({ from: new Date(t.getFullYear(), t.getMonth(), 1), to: startOfDay(t) }) },
];

function DateRangeMoment() {
  const [range, setRange] = React.useState<DateRange>(() => RANGE_PRESETS[1].range(TODAY));
  return (
    <Card className="grid min-w-0">
      <DateRangePicker inline value={range} onValueChange={setRange} presets={RANGE_PRESETS} today={TODAY} />
    </Card>
  );
}

/* ------------------------------------------------------------ multi-select */

const CHANNELS: Option[] = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada", "Blibli", "Website", "WhatsApp"].map((c) => ({ value: c, label: c }));

function MultiSelectMoment() {
  const [picked, setPicked] = React.useState(["Shopee", "Tokopedia"]);
  return (
    <Card className="grid min-w-0 gap-2">
      <Label>Sell on</Label>
      <MultiSelect inline aria-label="Sell on" value={picked} onValueChange={setPicked} options={CHANNELS} placeholder="Choose channels" maxChips={3} listHeight={228} />
    </Card>
  );
}

/* ------------------------------------------------------------ currency */

const CREDIT_START = 1250000;

function CurrencyMoment() {
  const [amount, setAmount] = React.useState<number | null>(CREDIT_START);
  return (
    <div className="grid min-w-0 gap-3">
      <Card className="grid min-w-0 gap-2">
        <Label>Credit for Toko Sari</Label>
        <CurrencyInput aria-label="Credit for Toko Sari" value={amount} onValueChange={setAmount} quick={[50000, 100000, 500000, 1000000]} limit={5000000} />
      </Card>
      <StartOver show={amount !== CREDIT_START} onClick={() => setAmount(CREDIT_START)} />
    </div>
  );
}

/* ------------------------------------------------------------ inline edit */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-item grid-cols-[88px_minmax(0,1fr)] items-center gap-3">
      <span className="text-body text-ink-muted">{label}</span>
      {/* The cell's box overhangs its text by this much: inset it so the fill stops at the card's padding. */}
      <div className="min-w-0 px-2">{children}</div>
    </div>
  );
}

function InlineEditMoment() {
  const [price, setPrice] = React.useState("89000");
  const [stock, setStock] = React.useState("124");
  const [supplier, setSupplier] = React.useState("Rizky Pratama");
  const [phone, setPhone] = React.useState("0812-3456-7890");
  const slow = (set: (v: string) => void) => async (v: string) => {
    await wait(650);
    set(v);
  };
  const digits = (v: string) => (/^\d+$/.test(v) ? null : "Numbers only");
  return (
    <Card className="grid min-w-0 gap-1">
      <h3 className="mb-2 truncate text-title font-semibold text-ink">Gelas kopi tanah liat</h3>
      <DetailRow label="Price">
        <InlineEdit aria-label="Price" value={price} onSave={slow(setPrice)} prefix="Rp" inputMode="numeric" validate={digits} {...grouped} />
      </DetailRow>
      <DetailRow label="Stock">
        <InlineEdit aria-label="Stock" value={stock} onSave={slow(setStock)} suffix="pcs" inputMode="numeric" validate={digits} {...grouped} />
      </DetailRow>
      <DetailRow label="Supplier">
        <InlineEdit aria-label="Supplier" value={supplier} onSave={slow(setSupplier)} validate={(v) => (v ? null : "Enter a name")} />
      </DetailRow>
      <DetailRow label="Phone">
        <InlineEdit aria-label="Phone" value={phone} onSave={slow(setPhone)} inputMode="tel" validate={(v) => (/^[\d\s+-]{8,}$/.test(v) ? null : "Enter a phone number")} />
      </DetailRow>
    </Card>
  );
}

/* ------------------------------------------------------------ filter search */

type Order = { id: string; customer: string; status: string; channel: string; total: number };
const ORDERS: Order[] = [
  { id: "INV-2041", customer: "Rizky Pratama", status: "paid", channel: "shopee", total: 1250000 },
  { id: "INV-2040", customer: "Sari Wulandari", status: "packed", channel: "tokopedia", total: 445000 },
  { id: "INV-2039", customer: "Dewi Anggraini", status: "shipped", channel: "tiktok", total: 89000 },
  { id: "INV-2038", customer: "Budi Santoso", status: "paid", channel: "tokopedia", total: 2180000 },
  { id: "INV-2037", customer: "Ayu Lestari", status: "unpaid", channel: "shopee", total: 267000 },
  { id: "INV-2036", customer: "Hendra Wijaya", status: "packed", channel: "shopee", total: 712000 },
  { id: "INV-2035", customer: "Toko Sinar Jaya", status: "shipped", channel: "tiktok", total: 3560000 },
  { id: "INV-2034", customer: "Maya Putri", status: "paid", channel: "tiktok", total: 178000 },
  { id: "INV-2033", customer: "Andi Saputra", status: "paid", channel: "shopee", total: 534000 },
  { id: "INV-2032", customer: "Nadia Kusuma", status: "paid", channel: "tokopedia", total: 925000 },
  { id: "INV-2031", customer: "Fajar Nugroho", status: "paid", channel: "shopee", total: 356000 },
];
const FILTER_FIELDS: FilterField[] = [
  {
    key: "status",
    label: "Status",
    values: [
      { value: "paid", label: "Paid" },
      { value: "packed", label: "Packed" },
      { value: "shipped", label: "Shipped" },
      { value: "unpaid", label: "Unpaid" },
    ],
  },
  {
    key: "channel",
    label: "Channel",
    values: [
      { value: "shopee", label: "Shopee" },
      { value: "tokopedia", label: "Tokopedia" },
      { value: "tiktok", label: "TikTok Shop" },
    ],
  },
];
const valueLabel = (field: string, value: string) => FILTER_FIELDS.find((f) => f.key === field)?.values.find((v) => v.value === value)?.label ?? value;

function matchOrders(tokens: FilterToken[], query: string) {
  const q = query.trim().toLowerCase();
  return ORDERS.filter((o) => {
    // Values of one field widen the match; different fields narrow it.
    const fits = FILTER_FIELDS.every((f) => {
      const wanted = tokens.filter((t) => t.field === f.key).map((t) => t.value);
      return !wanted.length || wanted.includes(o[f.key as "status" | "channel"]);
    });
    // A half-typed filter ("status:pa") is still choosing a value, so it doesn't narrow the rows.
    const choosing = FILTER_FIELDS.some((f) => q.startsWith(`${f.key}:`));
    return fits && (!q || choosing || `${o.id} ${o.customer}`.toLowerCase().includes(q));
  });
}

function FilterSearchPiece({ listHeight = 228 }: { listHeight?: number }) {
  const [tokens, setTokens] = React.useState<FilterToken[]>([{ field: "status", value: "paid" }]);
  const [query, setQuery] = React.useState("");
  const results = matchOrders(tokens, query);
  return (
    <FilterSearch aria-label="Search orders" fields={FILTER_FIELDS} tokens={tokens} onTokensChange={setTokens} query={query} onQueryChange={setQuery} placeholder="Search orders or type status:" listHeight={listHeight}>
      {results.length ? (
        results.map((o) => (
          <div key={o.id} className="grid h-item grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-control px-2.5 text-body hover:bg-fill">
            <span className="truncate text-ink">{o.customer}</span>
            <span className="flex items-center gap-3 tabular-nums">
              <span className="text-ink-muted max-[380px]:hidden">{valueLabel("status", o.status)}</span>
              <span className="text-ink">{formatRp(o.total)}</span>
            </span>
          </div>
        ))
      ) : (
        <div className="flex h-item items-center px-2.5 text-body text-ink-muted">No orders</div>
      )}
    </FilterSearch>
  );
}

/* ------------------------------------------------------------ combobox */

const CUSTOMERS: Option[] = ["Ayu Lestari", "Budi Santoso", "Hendra Wijaya", "Maya Putri", "Rizky Pratama", "Sari Wulandari", "Toko Sinar Jaya"].map((c) => ({ value: c, label: c }));

function ComboboxMoment() {
  const [customers, setCustomers] = React.useState(CUSTOMERS);
  const [picked, setPicked] = React.useState<string | null>("Rizky Pratama");
  const changed = customers.length !== CUSTOMERS.length || picked !== "Rizky Pratama";
  return (
    <div className="grid min-w-0 gap-3">
      <Card className="grid min-w-0 gap-2">
        <Label>Customer</Label>
        <Combobox
          inline
          aria-label="Customer"
          value={picked}
          onValueChange={setPicked}
          options={customers}
          searchPlaceholder="Search customers"
          listHeight={228}
          onCreate={async (name) => {
            await wait(420);
            setCustomers((all) => [...all, { value: name, label: name }].sort((a, b) => a.label.localeCompare(b.label)));
            return name;
          }}
        />
      </Card>
      <StartOver
        show={changed}
        onClick={() => {
          setCustomers(CUSTOMERS);
          setPicked("Rizky Pratama");
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ registry surfaces */

export const DEMOS: Record<string, Demo> = {
  "filter-search": {
    render: () => (
      <Card className="w-full max-w-[460px]">
        <FilterSearchPiece />
      </Card>
    ),
    usage: () => `<FilterSearch\n  fields={[{ key: "status", label: "Status", values: [{ value: "paid", label: "Paid" }] }]}\n  tokens={tokens}\n  onTokensChange={setTokens}\n  query={query}\n  onQueryChange={setQuery}\n>\n  {results.map(renderRow)}\n</FilterSearch>`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["filter-search"],
    render: () => (
      <Tile inset="pad" className={cn(S[6])}>
        <Mark name="filter-search">
          <div onClick={stay}>
            <FilterSearchPiece listHeight={180} />
          </div>
        </Mark>
      </Tile>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "date-range-picker", title: "Date range picker", to: "/components/date-range-picker", width: "max-w-[560px]", render: () => <DateRangeMoment /> },
  { id: "multi-select", title: "Multi-select", to: "/components/multi-select", width: "max-w-[420px]", render: () => <MultiSelectMoment /> },
  { id: "currency-input", title: "Currency input", to: "/components/currency-input", width: "max-w-[420px]", render: () => <CurrencyMoment /> },
  { id: "inline-edit", title: "Inline edit", to: "/components/inline-edit", width: "max-w-[420px]", render: () => <InlineEditMoment /> },
  { id: "filter-search", title: "Filter search", to: "/components/filter-search", width: "max-w-[480px]", render: () => <Card className="grid min-w-0"><FilterSearchPiece /></Card> },
  { id: "combobox", title: "Combobox", to: "/components/combobox", width: "max-w-[420px]", render: () => <ComboboxMoment /> },
];
