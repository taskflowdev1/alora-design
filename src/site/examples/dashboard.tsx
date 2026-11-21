import * as React from "react";
import { Download, ShoppingBag } from "react-feather";
import { formatNumber, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, MetricCard } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { BarChart, BarList } from "@/components/ui/bar-chart";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { Thumb } from "@/components/ui/thumb";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/toolbar";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { LoadingText, Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { ShopPicker } from "@/components/ui/shop-picker";
import { DAILY, HOURLY, MARKET_SHOPS, ORDERS, PRODUCTS, productPhoto } from "../data";
import { NoTranslate, useLoading } from "./shared";

/* ------------------------------------------------------------ dashboard */

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
  const [shops, setShops] = React.useState(MARKET_SHOPS.map((s) => s.id));
  const [shop, setShop] = React.useState<string | null>(null);
  const r = RANGES[range];
  // The picker narrows every number on the page to the shops it keeps; a bar in By shop narrows the lists below to one.
  const share = shops.reduce((a, id) => a + (BY_SHOP[id] ?? 0), 0) / DAY_TOTAL;
  const sales = Math.round((range === "day" ? DAY_TOTAL : r.days.reduce((a, d) => a + d.value, 0)) * share * 1e4) * 100;
  const orders = Math.round(sales / 154600);
  const inScope = (orderShop: string) => (shop ? orderShopOf(shop) === orderShop : shops.some((id) => orderShopOf(id) === orderShop));
  const low = PRODUCTS.filter((p) => p.stock < 5);
  const unpaid = ORDERS.filter((o) => o.status === "Unpaid" && inScope(o.shop)).slice(0, 4);
  const byShop = MARKET_SHOPS.filter((s) => shops.includes(s.id)).sort((a, b) => BY_SHOP[b.id] - BY_SHOP[a.id]);
  const scale = range === "day" ? 1 : r.days.reduce((a, d) => a + d.value, 0) / DAY_TOTAL;
  const chart = range === "day" ? null : r.days.map((d) => ({ ...d, value: Math.round(d.value * share * 10) / 10, display: `Rp ${formatNumber(Math.round(d.value * share * 10) / 10)} jt` }));
  // Attention rows sit on a fill, so their skeleton bars take the next step up to show.
  const L = ({ children }: { children: React.ReactNode }) => (
    <LoadingText loading={loading} onFill>
      {children}
    </LoadingText>
  );
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Dashboard">
        <ShopPicker shops={MARKET_SHOPS} value={shops} onValueChange={(v) => (setShops(v), setShop(null))} />
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
      <Alert tone="neutral" title="2 shops haven’t synced since 09:40" action={<Button size="sm" onClick={() => toast("Syncing 2 shops", "neutral")}>Sync</Button>} />
      <div className="flex flex-wrap gap-4">
        <MetricCard primary loading={loading} label={`Sales ${r.label}`} unit="Rp" value={sales} delta={{ value: "9,7%", direction: "up" }} />
        <MetricCard loading={loading} label="Orders" value={orders} />
        <MetricCard loading={loading} label="Basket" unit="Rp" value={154600} />
        <MetricCard loading={loading} label="To ship" value={Math.round(18 * share)} />
        <MetricCard loading={loading} label="Cancelled" value={Math.round(r.cancelled * share)} />
      </div>
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
          {/* Stock is counted for the whole business, so the shop filters leave this list as it is. */}
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
