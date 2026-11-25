import * as React from "react";
import { Download, RefreshCw, ShoppingBag } from "react-feather";
import { formatNumber, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { BarChart, BarList } from "@/components/ui/bar-chart";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { Thumb } from "@/components/ui/thumb";
import { Badge } from "@/components/ui/badge";
import { MoreMenu, PageHeader } from "@/components/ui/toolbar";
import { FilterButton, FilterChecks, FilterPick } from "@/components/ui/filter-button";
import { MenuItem } from "@/components/ui/menu";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { LoadingText, Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DAILY, HOURLY, MARKET_SHOPS, ORDERS, PRODUCTS, productPhoto } from "../data";
import { Metrics, NoTranslate, useLoading } from "./shared";

/** Sales today per shop, in Rp jt (they add up to the day's total), largest first. Ids match MARKET_SHOPS. */
const BY_SHOP: Record<string, number> = {
  kemang: 12.4,
  senopati: 9.8,
  "shopee-official": 8.6,
  dago: 7.1,
  tiktok: 5.9,
  "shopee-outlet": 3.0,
  tokopedia: 1.4,
};
const DAY_TOTAL = Object.values(BY_SHOP).reduce((a, v) => a + v, 0);

/** Each range scales today's numbers by how many days of sales it holds. */
const RANGES = {
  day: { label: "today", days: DAILY.slice(-1), cancelled: 4 },
  week: { label: "this week", days: DAILY.slice(-7), cancelled: 23 },
  month: { label: "this month", days: DAILY, cancelled: 97 },
};

/** Orders carry the shop's name; marketplace shops file under their marketplace. */
const orderShopOf = (id: string) => {
  const s = MARKET_SHOPS.find((x) => x.id === id);
  return !s ? null : s.market === "offline" ? s.name : s.market === "shopee" ? "Shopee" : s.market === "tiktok" ? "TikTok Shop" : null;
};

export function Dashboard() {
  const loading = useLoading();
  const [range, setRange] = React.useState<keyof typeof RANGES>("day");
  const [picked, setPicked] = React.useState<string[]>([]);
  const [shop, setShop] = React.useState<string | null>(null);
  const shops = picked.length ? picked : MARKET_SHOPS.map((s) => s.id);
  const r = RANGES[range];
  const share = shops.reduce((a, id) => a + (BY_SHOP[id] ?? 0), 0) / DAY_TOTAL;
  const sales = Math.round((range === "day" ? DAY_TOTAL : r.days.reduce((a, d) => a + d.value, 0)) * share * 1e4) * 100;
  const orders = Math.round(sales / 154600);
  const inScope = (orderShop: string) => (shop ? orderShopOf(shop) === orderShop : shops.some((id) => orderShopOf(id) === orderShop));
  const low = PRODUCTS.filter((p) => p.stock < 5);
  const unpaid = ORDERS.filter((o) => o.status === "Unpaid" && inScope(o.shop)).slice(0, 4);
  const byShop = MARKET_SHOPS.filter((s) => shops.includes(s.id)).sort((a, b) => BY_SHOP[b.id] - BY_SHOP[a.id]);
  const scale = range === "day" ? 1 : r.days.reduce((a, d) => a + d.value, 0) / DAY_TOTAL;
  const chart = range === "day" ? null : r.days.map((d) => ({ ...d, value: Math.round(d.value * share * 10) / 10, display: `Rp ${formatNumber(Math.round(d.value * share * 10) / 10)} jt` }));
  const L = ({ children }: { children: React.ReactNode }) => (
    <LoadingText loading={loading} onFill>
      {children}
    </LoadingText>
  );
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Dashboard">
        <FilterButton
          count={(picked.length ? 1 : 0) + (range !== "day" ? 1 : 0)}
          onClear={() => (setPicked([]), setRange("day"), setShop(null))}
          done="Show results"
        >
          <FilterPick
            label="Period"
            value={range}
            onValueChange={setRange}
            options={[
              { value: "day", label: "Today" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
          <FilterChecks
            label="Shop"
            allLabel="All shops"
            value={picked}
            onValueChange={(v) => (setPicked(v), setShop(null))}
            presets={[{ label: <><MarketMark market="shopee" />All Shopee</>, value: MARKET_SHOPS.filter((s) => s.market === "shopee").map((s) => s.id) }]}
            options={MARKET_SHOPS.map((s) => ({ value: s.id, label: <><MarketMark market={s.market} /><span translate="no">{s.name}</span></> }))}
          />
        </FilterButton>
        <MoreMenu>
          <MenuItem icon={Download} onSelect={() => toast("Export started", "neutral")}>Export</MenuItem>
          <MenuItem icon={RefreshCw} onSelect={() => toast("Syncing 2 shops", "neutral")}>Sync 2 shops</MenuItem>
        </MoreMenu>
      </PageHeader>
      <Metrics
        loading={loading}
        items={[
          { label: `Sales ${r.label}`, unit: "Rp", value: sales, primary: true, delta: { value: "9,7%", direction: "up" } },
          { label: "Orders", value: orders },
          { label: "Basket", unit: "Rp", value: 154600 },
          { label: "To ship", value: Math.round(18 * share) },
          { label: "Cancelled", value: Math.round(r.cancelled * share) },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={chart ? `Sales, last ${chart.length} days` : "Sales by hour"} />
          {chart ? (
            <BarChart key={range} data={chart} current={chart.length - 1} labelEvery={range === "week" ? 1 : 5} height={150} loading={loading} className="mt-4" aria-label={`Sales, last ${chart.length} days`} />
          ) : (
            <BarChart
              data={HOURLY.map((h) => ({ ...h, value: Math.round(h.value * share * 10) / 10, display: `Rp ${formatNumber(Math.round(h.value * share * 10) / 10)} jt` }))}
              current={6}
              labelEvery={1}
              height={150}
              loading={loading}
              className="mt-4"
              aria-label="Sales by hour"
            />
          )}
        </Card>
        <Card inset="nest">
          <CardHeader title="By shop" className="px-2 pt-2" action={shop ? <Button variant="ghost" size="sm" onClick={() => setShop(null)}>All shops</Button> : undefined} />
          <BarList
            loading={loading}
            selected={shop}
            onSelect={setShop}
            data={byShop.map((s) => {
              const v = Math.round(BY_SHOP[s.id] * scale * 10) / 10;
              return { key: s.id, label: s.name, value: v, display: `Rp ${formatNumber(v)} jt` };
            })}
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
                media={loading ? <Skeleton onFill className="size-[32px] rounded-small" /> : <Thumb src={productPhoto(p.sku)} alt={p.name} />}
                title={<L>{p.name}</L>}
                meta={
                  <L>
                    <NoTranslate>{p.sku}</NoTranslate>
                  </L>
                }
                value={<L>{p.stock === 0 ? "Out" : `${p.stock} left`}</L>}
                onClick={() => toast(`Restock ${p.name}`, "neutral")}
              />
            ))}
          </AttentionList>
        </Card>
        <Card inset="nest">
          <CardHeader title="Unpaid over 24 hours" action={<Badge>{unpaid.length}</Badge>} className="px-2 pt-2" />
          {unpaid.length ? (
            <AttentionList className="mt-1">
              {unpaid.map((o) => (
                <AttentionItem
                  key={o.id}
                  media={loading ? <Skeleton onFill className="size-8 rounded-full" /> : <Avatar name={o.customer} size="md" className="bg-surface" />}
                  title={<L>{o.customer}</L>}
                  meta={
                    <L>
                      <NoTranslate>{`${o.id} · ${o.shop}`}</NoTranslate>
                    </L>
                  }
                  value={<L>{formatRp(o.total)}</L>}
                  onClick={() => toast("Reminder sent", "neutral")}
                />
              ))}
            </AttentionList>
          ) : (
            <EmptyState icon={ShoppingBag} title="Nothing unpaid" className="py-8" />
          )}
        </Card>
      </div>
    </div>
  );
}
