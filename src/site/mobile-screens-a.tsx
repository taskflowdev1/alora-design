// Example app screens, part A: Home, Notifications, Search, Reports, Orders, Order, Proof of delivery.
import * as React from "react";
import {
  AlertCircle,
  Bell,
  Calendar as CalendarIcon,
  Check,
  Clock,
  CreditCard,
  Archive,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Package,
  Printer,
  RotateCcw,
  Search as SearchIcon,
  ShoppingBag,
  Star,
  Truck,
  User,
  Users,
  WifiOff,
  XCircle,
  Camera,
  ShoppingCart,
} from "react-feather";
import { cn, formatNumber, formatRp, skeletonFill, skeletonText } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Thumb } from "@/components/ui/thumb";
import { Steps } from "@/components/ui/steps";
import { MobileScreen, MobileBarButton, MobileBarTextButton } from "@/components/mobile/mobile-nav-bar";
import { MobileList, MobileListRow, MobileListSkeleton } from "@/components/mobile/mobile-list";
import { SwipeRow, type SwipeAction } from "@/components/mobile/mobile-swipe-row";
import { PullToRefresh } from "@/components/mobile/mobile-pull-refresh";
import { MobileSearchBar } from "@/components/mobile/mobile-search-bar";
import { MobileSheet } from "@/components/mobile/mobile-sheet";
import { MobileActionSheet } from "@/components/mobile/mobile-action-sheet";
import { MobileDateSheet } from "@/components/mobile/mobile-wheel-picker";
import { MobileActionBar, MobileFab } from "@/components/mobile/mobile-action-bar";
import { MobileScrubChart } from "@/components/mobile/mobile-scrub-chart";
import { MobileStatGrid, MobileStatTile } from "@/components/mobile/mobile-stats";
import { MobileBanner, useOnline } from "@/components/mobile/mobile-banner";
import { BadgeAnchor, CountBadge } from "@/components/mobile/mobile-badge";
import { MobileFilterChips } from "@/components/mobile/mobile-chip-row";
import { MobileDateRangeSheet, formatRange, type DateRange } from "@/components/mobile/mobile-date-range";
import { MobileContextMenu } from "@/components/mobile/mobile-context-menu";
import { MobileTimeline } from "@/components/mobile/mobile-timeline";
import { MobilePhotoSheet, MobilePhotoStrip, type Photo } from "@/components/mobile/mobile-photo-picker";
import { MobileTextField } from "@/components/mobile/mobile-text-field";
import { MobileSignaturePad } from "@/components/mobile/mobile-signature";
import { DAILY, HOURLY, NOW, ORDERS, PAID_ORDERS, PRODUCTS, productPhoto, smartTime, type Order } from "./data";
import { CAMERA_ROLL, CUSTOMERS, NOTIFS, type Notif } from "./mobile-data";
import { COURIERS, CourierPicker, OrderThumb, ScreenEmpty, SectionTitle, rowTime, short, smartDay, useNav, type ScreenProps } from "./mobile-app-kit";

/* ------------------------------------------------------------ Home */

export function HomeScreen({ state }: ScreenProps) {
  const nav = useNav();
  const toPack = useOrders().orders.filter((o) => o.status === "Paid").length;
  const online = useOnline() && state !== "offline";
  const sales = HOURLY.reduce((s, h) => s + h.value, 0);
  const low = PRODUCTS.filter((p) => p.stock <= 3);
  return (
    <>
    <MobileScreen
      title="Home"
      bottomInset="tab-bar-fab"
      trailing={
        <>
          <MobileBarButton aria-label="Search" onClick={() => nav.push("search")}>
            <SearchIcon />
          </MobileBarButton>
          <MobileBarButton aria-label={`Notifications, ${NOTIFS.filter((n) => n.unread).length} new`} onClick={() => nav.push("notifications")}>
            <BadgeAnchor badge={<CountBadge count={NOTIFS.filter((n) => n.unread).length} />}>
              <Bell />
            </BadgeAnchor>
          </MobileBarButton>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="px-pad empty:hidden">
          <MobileBanner open={!online} icon={WifiOff} action={{ label: "Retry", onClick: () => nav.snack("Still offline") }}>
            You’re offline. These numbers are from 14:05.
          </MobileBanner>
        </div>
        <div className="px-pad">
          <div className="rounded-card bg-surface p-pad shadow-card">
            <MobileScrubChart
              kind="bars"
              label="Sales today"
              value={`Rp ${formatNumber(sales, { maximumFractionDigits: 1 })} jt`}
              data={HOURLY.map((h) => ({ label: `${h.label}:00`, value: h.value, display: h.display }))}
              current={HOURLY.length - 1}
              labelEvery={3}
              height={96}
            />
          </div>
        </div>
        {/* The four numbers an owner checks, all at once (2 × 2), instead of one per swipe. */}
        <div className="px-pad">
          <MobileStatGrid>
            <MobileStatTile label="Orders" value="86" />
            <MobileStatTile label="Average basket" value="Rp 149.300" />
            <MobileStatTile label="To pack" value={toPack} onClick={() => nav.setTab("orders")} />
            <MobileStatTile label="Returns this week" value="2" />
          </MobileStatGrid>
        </div>
        <div>
          <SectionTitle>Needs you</SectionTitle>
          <div className="grid gap-gap px-pad">
            <AttentionCard icon={Package} title={`${toPack} orders to pack`} meta="Oldest 2 h ago" onClick={() => nav.setTab("orders")} />
            {low.slice(0, 3).map((p) => (
              <AttentionCard key={p.sku} media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />} title={p.name} meta={p.stock ? `${p.stock} left` : "Out of stock"} onClick={() => nav.push("product", { sku: p.sku })} />
            ))}
            <AttentionCard icon={RotateCcw} title="Return request from Sari W." meta="Today, 10:53" onClick={() => nav.push("chat", { id: "ch3" })} />
          </div>
        </div>
      </div>
    </MobileScreen>
    {/* The cashier's most frequent action, in thumb reach (it stays in More too). */}
    <MobileFab icon={ShoppingCart} label="New sale" onClick={() => nav.push("pos")} />
    </>
  );
}

/** One thing that needs attention: its own small soft card, never a row in a ruled list. */
function AttentionCard({ icon: I, media, title, meta, onClick }: { icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>; media?: React.ReactNode; title: string; meta: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ad-press flex min-h-[60px] w-full cursor-pointer items-center gap-3 rounded-card bg-surface px-pad py-2.5 text-left shadow-card focus-visible:bg-fill active:scale-[0.98] data-pressed:scale-[0.98]"
    >
      {media ?? (I ? <span className="grid size-[40px] shrink-0 place-items-center rounded-small bg-fill text-ink"><I size={20} strokeWidth={1.75} /></span> : null)}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-[15px]">{title}</span>
        <span className="truncate text-[13px] text-ink-muted">{meta}</span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------ Notifications */

const NOTIF_ICON: Record<Notif["kind"], React.ComponentType> = { order: ShoppingBag, stock: Package, payout: CreditCard, review: Star, team: Users, return: RotateCcw };

export function NotificationsScreen({ back, state }: ScreenProps) {
  const nav = useNav();
  const [list, setList] = React.useState(state === "empty" ? [] : NOTIFS);
  // Undo puts back only what it cleared, in its place, so clearing two in a row and undoing loses nothing.
  const restore = (ids: string[]) => setList((l) => NOTIFS.filter((x) => ids.includes(x.id) || l.includes(x)));
  const clear = (n: Notif) => {
    setList((l) => l.filter((x) => x.id !== n.id));
    nav.snack("Cleared", () => restore([n.id]));
  };
  const open = (n: Notif) => (n.kind === "order" ? nav.setTab("orders") : n.kind === "return" ? nav.push("chat", { id: "ch3" }) : n.kind === "stock" ? nav.setTab("products") : n.kind === "payout" ? nav.push("reports") : nav.push("approvals"));
  const today = list.filter((n) => /:/.test(n.time));
  const earlier = list.filter((n) => !/:/.test(n.time));
  const group = (title: string, items: Notif[]) =>
    items.length ? (
      <MobileList title={title}>
        {items.map((n) => {
          const I = NOTIF_ICON[n.kind];
          return (
            <SwipeRow key={n.id} trailing={[{ label: "Clear", icon: Check, onSelect: () => clear(n) }]}>
              {/* Long press (or the menu key) offers Clear too, so it never takes a swipe. */}
              <MobileContextMenu aria-label={n.title} actions={[{ label: "Clear", icon: Check, onSelect: () => clear(n) }]}>
                <MobileListRow media={<I />} title={n.title} subtitle={n.time} value={n.unread ? <CountBadge dot aria-label="Unread" /> : undefined} onClick={() => open(n)} />
              </MobileContextMenu>
            </SwipeRow>
          );
        })}
      </MobileList>
    ) : null;
  return (
    <MobileScreen
      title="Notifications"
      large={false}
      back={back}
      bottomInset="none"
      trailing={
        list.length ? (
          <MobileBarTextButton
            onClick={() => {
              const ids = list.map((x) => x.id);
              setList([]);
              nav.snack("All cleared", () => restore(ids));
            }}
          >
            Clear all
          </MobileBarTextButton>
        ) : null
      }
    >
      {list.length ? (
        <div className="grid gap-5 pt-2">
          {group("Today", today)}
          {group("Earlier", earlier)}
        </div>
      ) : (
        <ScreenEmpty icon={Bell} title="No notifications" />
      )}
    </MobileScreen>
  );
}

/* ------------------------------------------------------------ Search */

export function SearchScreen({ back, params, state }: ScreenProps) {
  const nav = useNav();
  const [q, setQ] = React.useState(state === "empty" ? "keramik biru" : (params.q ?? ""));
  const s = q.trim().toLowerCase();
  const products = s ? PRODUCTS.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(s)) : [];
  const orders = s ? ORDERS.slice(0, 200).filter((o) => `${o.id} ${o.customer} ${o.items}`.toLowerCase().includes(s)).slice(0, 5) : [];
  const people = s ? CUSTOMERS.filter((c) => c.name.toLowerCase().includes(s)).slice(0, 5) : [];
  const none = s && !products.length && !orders.length && !people.length;
  return (
    <MobileScreen title="Search" large={false} back={back} bottomInset="none" header={<div className="pt-1"><MobileSearchBar value={q} onValueChange={setQ} placeholder="Orders, products, customers" /></div>}>
      {!s ? (
        <MobileList title="Recent">
          {["gelas", "RMB-24811", "Nadia", "keranjang"].map((r) => (
            <MobileListRow key={r} media={<Clock />} title={r} onClick={() => setQ(r)} />
          ))}
        </MobileList>
      ) : none ? (
        <ScreenEmpty icon={SearchIcon} title={`Nothing matches “${q}”`} />
      ) : (
        <div className="grid gap-5">
          {products.length ? (
            <MobileList title="Products">
              {products.slice(0, 5).map((p) => (
                <MobileListRow key={p.sku} media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />} title={p.name} subtitle={`${p.stock} in stock`} value={formatRp(p.price)} onClick={() => nav.push("product", { sku: p.sku })} />
              ))}
            </MobileList>
          ) : null}
          {orders.length ? (
            <MobileList title="Orders">
              {orders.map((o) => (
                <MobileListRow key={o.id} media={<OrderThumb o={o} />} title={o.customer} subtitle={<>{rowTime(o.at)} · <span translate="no">{o.id}</span></>} value={short(o.total)} onClick={() => nav.push("order", { id: o.id })} />
              ))}
            </MobileList>
          ) : null}
          {people.length ? (
            <MobileList title="Customers">
              {people.map((c) => (
                <MobileListRow key={c.id} media={<User />} title={c.name} subtitle={c.city} onClick={() => nav.push("customer", { id: c.id })} />
              ))}
            </MobileList>
          ) : null}
        </div>
      )}
    </MobileScreen>
  );
}

/* ------------------------------------------------------------ Reports */

const SHOP_FILTERS = [
  { value: "all", label: "All shops" },
  { value: "kemang", label: "Kemang" },
  { value: "senopati", label: "Senopati" },
  { value: "dago", label: "Dago" },
  { value: "shopee", label: "Shopee" },
  { value: "tiktok", label: "TikTok" },
];

export function ReportsScreen({ back, state }: ScreenProps) {
  const [range, setRange] = React.useState<DateRange>({ from: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 13), to: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()) });
  const [pick, setPick] = React.useState(false);
  const [shop, setShop] = React.useState("all");
  const [phase, setPhase] = React.useState<"error" | "loading" | "ready">(state === "error" ? "error" : "ready");
  const days = Math.round((range.to.getTime() - range.from.getTime()) / 864e5) + 1;
  const k = shop === "all" ? 1 : 0.22 + SHOP_FILTERS.findIndex((s) => s.value === shop) * 0.04;
  const data = DAILY.slice(-Math.min(30, days)).map((d) => ({ label: `${d.label} ${["Oct", "Nov"][Number(d.label) > 16 ? 0 : 1]}`, value: +(d.value * k).toFixed(1), display: `Rp ${formatNumber(d.value * k, { maximumFractionDigits: 1 })} jt` }));
  const total = data.reduce((s, d) => s + d.value, 0);
  // Every number on the screen follows the range and the shop (r: this range against the default 14 days).
  const r = (days / 14) * k;
  const orders = Math.round(total * 6.4);
  const n = (v: number) => formatNumber(v);
  const retry = () => {
    setPhase("loading");
    window.setTimeout(() => setPhase("ready"), 400);
  };
  return (
    <>
      <MobileScreen
        title="Reports"
        large={false}
        back={back}
        bottomInset="none"
        header={
          <div className="grid gap-2 pt-1">
            <MobileFilterChips aria-label="Shop" value={shop} onValueChange={setShop} options={SHOP_FILTERS} />
          </div>
        }
      >
        <div className="grid gap-4">
          <MobileList>
            <MobileListRow media={<CalendarIcon />} title="Dates" value={formatRange(range, NOW)} chevron onClick={() => setPick(true)} />
          </MobileList>
          {phase === "error" ? (
            <div className="grid justify-items-center gap-4 px-pad py-24 text-center">
              <AlertCircle size={40} strokeWidth={1.5} className="text-ink-muted" />
              <p className="text-[17px] font-medium text-ink-muted">Couldn’t load the report</p>
              <Button className="h-touch px-5 text-[15px]" onClick={retry}>
                <RotateCcw />
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="px-pad">
                <div className="rounded-card bg-surface p-pad shadow-card">
                  {phase === "loading" ? (
                    <div aria-busy className="grid gap-2">
                      <span className={cn("w-fit text-[13px]", skeletonText())}>Sales</span>
                      <span className={cn("w-fit text-[24px] leading-tight", skeletonText())}>Rp 000,0 jt</span>
                      <span className={cn("h-[140px] rounded-control", skeletonFill())} />
                      <span className="h-[17px]" />
                    </div>
                  ) : (
                    <MobileScrubChart kind="bars" label={`Sales, ${formatRange(range, NOW)}`} value={`Rp ${formatNumber(total, { maximumFractionDigits: 1 })} jt`} data={data} current={data.length - 1} labelEvery={days > 14 ? 7 : 3} height={140} />
                  )}
                </div>
              </div>
              <div className="px-pad">
                <MobileStatGrid>
                  <MobileStatTile label="Orders" value={n(orders)} loading={phase === "loading"} />
                  <MobileStatTile label="Average basket" value={formatRp(Math.round(((total * 1e6) / Math.max(1, orders)) / 100) * 100)} loading={phase === "loading"} />
                  <MobileStatTile label="Returns" value={n(Math.max(0, Math.round(4 * r)))} loading={phase === "loading"} />
                  <MobileStatTile label="Cancelled" value={n(Math.max(0, Math.round(7 * r)))} loading={phase === "loading"} />
                </MobileStatGrid>
              </div>
              <div className="px-pad">
                <div className="rounded-card bg-surface p-pad shadow-card">
                  {/* The headline is the daily average: the total is already on the Orders tile. */}
                  <MobileScrubChart label="Orders per day" value={`${n(Math.round(orders / data.length))} a day`} data={data.map((d) => ({ label: d.label, value: Math.round(d.value * 6.4), display: `${n(Math.round(d.value * 6.4))} orders` }))} height={88} labelEvery={days > 14 ? 7 : 3} />
                </div>
              </div>
              <MobileList title="Best sellers">
                {PRODUCTS.slice(0, 5).map((p, i) => {
                  const sold = Math.max(1, Math.round((42 - i * 7) * r));
                  return <MobileListRow key={p.sku} media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />} title={p.name} subtitle={`${n(sold)} sold`} value={short(sold * p.price)} />;
                })}
              </MobileList>
            </>
          )}
        </div>
      </MobileScreen>
      <MobileDateRangeSheet open={pick} onOpenChange={setPick} value={range} onValueChange={setRange} today={NOW} />
    </>
  );
}

/* ------------------------------------------------------------ Orders */

type Stage = "pack" | "ship" | "done";
const STAGE_OF = (o: Order): Stage | null => (o.status === "Paid" ? "pack" : o.status === "Packed" ? "ship" : o.status === "Shipped" ? "done" : null);

/** Orders shared by the list and the detail screen, so marking one packed shows everywhere. */
const OrdersStore = React.createContext<{ orders: Order[]; setStatus: (id: string, s: Order["status"]) => void } | null>(null);
export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = React.useState(() => ORDERS.slice(0, 60).filter((o) => STAGE_OF(o)));
  const setStatus = React.useCallback((id: string, status: Order["status"]) => setOrders((l) => l.map((o) => (o.id === id ? { ...o, status } : o))), []);
  return <OrdersStore.Provider value={{ orders, setStatus }}>{children}</OrdersStore.Provider>;
}
export const useOrders = () => React.useContext(OrdersStore)!;

export function OrdersScreen({ state }: ScreenProps) {
  const nav = useNav();
  const { orders, setStatus } = useOrders();
  const [stage, setStage] = React.useState<Stage>("pack");
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 400);
    return () => window.clearTimeout(t);
  }, []);
  const act = React.useCallback(
    (o: Order, status: Order["status"], text: string) => {
      const before = o.status;
      setStatus(o.id, status);
      nav.snack(text, () => setStatus(o.id, before));
    },
    [nav, setStatus],
  );
  const openOrder = React.useCallback((id: string) => nav.push("order", { id }), [nav]);
  const list = state === "empty" ? [] : orders.filter((o) => STAGE_OF(o) === stage && (!q || `${o.customer} ${o.items} ${o.id}`.toLowerCase().includes(q.toLowerCase())));
  const count = (s: Stage) => orders.filter((o) => STAGE_OF(o) === s).length;
  const STAGES: { value: Stage; label: string }[] = [
    { value: "pack", label: "To pack" },
    { value: "ship", label: "To ship" },
    { value: "done", label: "Shipped" },
  ];
  return (
    <>
      <MobileScreen
        title="Orders"
        barTitle={STAGES.find((s) => s.value === stage)?.label}
        header={
          <>
            <MobileSearchBar value={q} onValueChange={setQ} placeholder="Customer, item or order" />
            <Segmented
              size="touch"
              aria-label="Stage"
              value={stage}
              onValueChange={setStage}
              className="w-full"
              options={STAGES.map((s) => ({ value: s.value, label: `${s.label} ${count(s.value)}` }))}
            />
          </>
        }
      >
        <PullToRefresh onRefresh={() => new Promise((r) => window.setTimeout(r, 1200))}>
          {loading ? (
            // The same rows the list will have (count, thumbnail, two lines, value), so nothing moves when it lands.
            <MobileListSkeleton rows={Math.max(1, list.length)} />
          ) : list.length === 0 ? (
            <ScreenEmpty icon={q ? SearchIcon : Package} title={q ? "No orders match" : stage === "pack" ? "Nothing to pack" : stage === "ship" ? "Nothing to ship" : "Nothing shipped yet"} />
          ) : (
            <MobileList>
              {list.map((o) => (
                <OrderRow key={o.id} o={o} stage={stage} act={act} onOpen={openOrder} />
              ))}
            </MobileList>
          )}
        </PullToRefresh>
      </MobileScreen>
    </>
  );
}

// The long-press menu says what it will do, as verbs (the swipe buttons are too narrow for that).
const VERB: Record<string, string> = { Packed: "Mark packed", Cancel: "Cancel order", Shipped: "Mark shipped", Archive: "Archive" };

/**
 * One order in the list, memoised: a snack or a status change elsewhere re-renders only the rows it touches, so the
 * stage switch and the list stay quick with 60 swipe rows.
 */
const OrderRow = React.memo(function OrderRow({ o, stage, act, onOpen }: { o: Order; stage: Stage; act: (o: Order, s: Order["status"], text: string) => void; onOpen: (id: string) => void }) {
  const actions = React.useMemo<SwipeAction[]>(
    () =>
      stage === "pack"
        ? [
            { label: "Packed", icon: Check, tone: "accent", onSelect: () => act(o, "Packed", `${o.id} packed`) },
            { label: "Cancel", icon: XCircle, tone: "danger", onSelect: () => act(o, "Cancelled", `${o.id} cancelled`) },
          ]
        : stage === "ship"
          ? [{ label: "Shipped", icon: Truck, tone: "accent", onSelect: () => act(o, "Shipped", `${o.id} shipped`) }]
          : [{ label: "Archive", icon: Archive, onSelect: () => act(o, "Cancelled", `${o.id} archived`) }],
    [o, stage, act],
  );
  const menu = React.useMemo(() => actions.map((a) => ({ label: VERB[a.label] ?? a.label, icon: a.icon, onSelect: a.onSelect, destructive: a.tone === "danger" })), [actions]);
  return (
    <SwipeRow trailing={actions}>
      <MobileContextMenu aria-label={o.id} actions={menu}>
        <MobileListRow media={<OrderThumb o={o} />} title={o.customer} subtitle={`${rowTime(o.at)} · ${o.items}`} value={short(o.total)} onClick={() => onOpen(o.id)} />
      </MobileContextMenu>
    </SwipeRow>
  );
});

/* ------------------------------------------------------------ Order */

export function OrderScreen({ params, back }: ScreenProps) {
  const nav = useNav();
  const { orders, setStatus } = useOrders();
  const order = orders.find((o) => o.id === params.id) ?? ORDERS.find((o) => o.id === params.id) ?? PAID_ORDERS[0];
  const [actions, setActions] = React.useState(params.actions === "1");
  const [courierOpen, setCourierOpen] = React.useState(params.sheet === "courier");
  const [courier, setCourier] = React.useState("jne");
  // The courier sheet edits a draft: "Use …" applies it, a swipe down or the backdrop drops it.
  const [draft, setDraft] = React.useState(courier);
  React.useEffect(() => {
    if (courierOpen) setDraft(courier);
  }, [courierOpen, courier]);
  const d = COURIERS.find((x) => x.id === draft)!;
  const [dateOpen, setDateOpen] = React.useState(false);
  const [pickup, setPickup] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1));
  const [boxes, setBoxes] = React.useState(1);
  const c = COURIERS.find((x) => x.id === courier)!;
  const step = order.status === "Paid" ? 1 : order.status === "Packed" ? 2 : order.status === "Shipped" ? 3 : 0;
  const act = (status: Order["status"], text: string) => {
    const before = order.status;
    setStatus(order.id, status);
    nav.pop();
    nav.snack(text, () => setStatus(order.id, before));
  };
  return (
    <>
      <MobileScreen
        title={order.id}
        translateTitle={false}
        large={false}
        back={back}
        bottomInset="action-bar"
        trailing={
          <MobileBarButton aria-label="More actions" onClick={() => setActions(true)}>
            <MoreHorizontal />
          </MobileBarButton>
        }
      >
        <div className="grid gap-5 pt-2">
          <div className="px-pad">
            <div className="rounded-card bg-surface p-pad shadow-card">
              <Steps size="touch" steps={["Paid", "Packed", "Shipped", "Delivered"]} current={step} />
            </div>
          </div>
          <MobileList title="Customer">
            <MobileListRow media={<User />} title={order.customer} value={order.payment} />
            <MobileListRow media={<MapPin />} title={order.shop} value={smartTime(order.at)} />
            <MobileListRow media={<MessageCircle />} title="Message" chevron onClick={() => nav.push("chat", { id: "ch1" })} />
          </MobileList>
          <MobileList title="Items">
            <MobileListRow media={<OrderThumb o={order} />} title={order.items} subtitle={`${order.qty} pcs`} value={formatRp(order.total)} />
            <MobileListRow media={<Package />} title="Boxes" value={<QuantityStepper size="touch" aria-label="Boxes" value={boxes} onValueChange={setBoxes} min={1} max={9} />} />
          </MobileList>
          <MobileList title="Shipping">
            <MobileListRow media={<Truck />} title="Courier" value={c.name} chevron onClick={() => setCourierOpen(true)} />
            <MobileListRow media={<CalendarIcon />} title="Pickup" value={smartDay(pickup)} chevron onClick={() => setDateOpen(true)} />
            {order.status === "Shipped" ? <MobileListRow media={<Camera />} title="Proof of delivery" chevron onClick={() => nav.push("delivery", { id: order.id })} /> : null}
          </MobileList>
          <div>
            <SectionTitle>History</SectionTitle>
            <div className="mx-pad rounded-card bg-surface px-pad py-2 shadow-card">
              <MobileTimeline
                events={[
                  { id: "o", title: "Ordered on Shopee", time: smartTime(new Date(order.at.getTime() - 25 * 60000)), state: "done" },
                  { id: "p", title: "Paid with " + order.payment, time: smartTime(order.at), state: step >= 1 ? "done" : "now" },
                  { id: "k", title: step >= 2 ? "Packed by Intan" : "Pack", time: step >= 2 ? "Today, 13:40" : undefined, state: step >= 2 ? "done" : step === 1 ? "now" : "next" },
                  { id: "s", title: step >= 3 ? `Picked up by ${c.name}` : "Courier pickup", time: step >= 3 ? "Today, 15:10" : smartDay(pickup), detail: step >= 3 ? "JX4410293" : undefined, state: step >= 3 ? "done" : step === 2 ? "now" : "next" },
                  { id: "d", title: "Delivered", state: step >= 3 ? "now" : "next" },
                ]}
              />
            </div>
          </div>
          <MobileList title="Payment">
            <MobileListRow title="Items" value={formatRp(order.total)} />
            <MobileListRow title="Shipping" value={formatRp(c.price)} />
            <MobileListRow title={<span className="font-semibold">Total</span>} value={<span className="font-semibold text-ink">{formatRp(order.total + c.price)}</span>} />
          </MobileList>
        </div>
      </MobileScreen>
      <MobileActionBar>
        <Button onClick={() => nav.snack(`Label for ${order.id} sent to the printer`)}>
          <Printer />
          Print label
        </Button>
        {order.status === "Paid" ? (
          <Button variant="primary" onClick={() => act("Packed", `${order.id} packed`)}>
            <Check />
            Mark packed
          </Button>
        ) : order.status === "Packed" ? (
          <Button variant="primary" onClick={() => act("Shipped", `${order.id} shipped`)}>
            <Truck />
            Mark shipped
          </Button>
        ) : (
          <Button variant="primary" onClick={() => nav.push("delivery", { id: order.id })}>
            <Camera />
            Proof of delivery
          </Button>
        )}
      </MobileActionBar>
      <MobileActionSheet
        open={actions}
        onOpenChange={setActions}
        title={order.id}
        actions={[
          { label: "Print label", icon: Printer, onSelect: () => nav.snack(`Label for ${order.id} sent to the printer`) },
          { label: "Change courier…", icon: Truck, onSelect: () => setCourierOpen(true) },
          { label: "Change pickup date…", icon: CalendarIcon, onSelect: () => setDateOpen(true) },
          { label: "Cancel order", icon: XCircle, destructive: true, onSelect: () => act("Cancelled", `${order.id} cancelled`) },
        ]}
      />
      <MobileSheet
        open={courierOpen}
        onOpenChange={setCourierOpen}
        title="Courier"
        detents={[0.5, 0.92]}
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setCourier(draft);
              setCourierOpen(false);
            }}
          >
            Use {d.name}
          </Button>
        }
      >
        <CourierPicker value={draft} onValueChange={setDraft} />
      </MobileSheet>
      <MobileDateSheet open={dateOpen} onOpenChange={setDateOpen} title="Pickup date" value={pickup} onValueChange={setPickup} />
    </>
  );
}

/* ------------------------------------------------------------ Proof of delivery */

type Upload = Photo & { progress: number; state: "uploading" | "done" | "failed" };

export function DeliveryScreen({ params, back }: ScreenProps) {
  const nav = useNav();
  const order = ORDERS.find((o) => o.id === params.id) ?? ORDERS.find((o) => o.status === "Shipped")!;
  const [sheet, setSheet] = React.useState(false);
  const [uploads, setUploads] = React.useState<Upload[]>(() => (params.photos === "1" ? [{ ...CAMERA_ROLL[0], progress: 1, state: "done" }, { ...CAMERA_ROLL[3], progress: 0.62, state: "uploading" }] : []));
  const [roll, setRoll] = React.useState<Photo[]>(CAMERA_ROLL);
  const [receiver, setReceiver] = React.useState(order.customer.replace(/ [A-Z]\.$/, ""));
  const [signed, setSigned] = React.useState(false);
  // The name's error waits until the field is left (or Mark delivered is pressed), then follows the typing.
  const [touched, setTouched] = React.useState(false);
  // Uploads tick along; one of every four fails once so Retry shows.
  React.useEffect(() => {
    if (!uploads.some((u) => u.state === "uploading")) return;
    const t = window.setInterval(() => {
      setUploads((list) =>
        list.map((u, i) => {
          if (u.state !== "uploading") return u;
          const p = Math.min(1, u.progress + 0.09 + (i % 3) * 0.03);
          if (i === 2 && p > 0.55 && !u.id.endsWith("-retry")) return { ...u, progress: p, state: "failed" };
          return { ...u, progress: p, state: p >= 1 ? "done" : "uploading" };
        }),
      );
    }, 180);
    return () => window.clearInterval(t);
  }, [uploads]);
  const done = uploads.filter((u) => u.state === "done").length;
  const ready = done > 0 && signed && receiver.trim().length > 1;
  const missing = !done ? (uploads.length ? "Waiting for the photo" : "Add a photo") : receiver.trim().length <= 1 ? "Add who took it" : !signed ? "Sign to finish" : null;
  return (
    <>
      <MobileScreen title="Proof of delivery" large={false} back={back} bottomInset="action-bar">
        <div className="grid gap-5 pt-2">
          <MobileList>
            <MobileListRow media={<OrderThumb o={order} />} title={order.customer} subtitle={`${order.id} · ${order.items}`} />
          </MobileList>
          <div className="grid gap-2">
            <SectionTitle>Photos</SectionTitle>
            {/* Each photo is a tile from the moment it's picked, its progress and Retry drawn over it, so nothing
                below the strip moves while uploads start and finish (the signature pad may be under a finger). */}
            <div className="px-pad">
              <MobilePhotoStrip
                photos={uploads}
                cover={false}
                onRemove={(id) => setUploads((l) => l.filter((u) => u.id !== id))}
                onRetry={(id) => setUploads((l) => l.map((x) => (x.id === id ? { ...x, id: `${x.id}-retry`, progress: 0, state: "uploading" } : x)))}
                onAddClick={() => setSheet(true)}
                max={4}
              />
            </div>
          </div>
          <div className="px-pad">
            <MobileTextField
              label="Received by"
              value={receiver}
              onValueChange={setReceiver}
              onBlur={() => setTouched(true)}
              autoComplete="name"
              error={touched && receiver.trim().length <= 1 ? "Who took the parcel?" : undefined}
            />
          </div>
          <div className="grid gap-2 px-pad">
            <h2 className="px-1 text-[13px] text-ink-muted">Signature</h2>
            <MobileSignaturePad onChange={(png) => setSigned(!!png)} />
          </div>
        </div>
      </MobileScreen>
      <MobileActionBar>
        <Button
          variant="primary"
          disabled={!ready}
          onClick={() => {
            nav.pop();
            nav.snack(`${order.id} delivered`);
          }}
        >
          {missing ? null : <Check />}
          {missing ?? "Mark delivered"}
        </Button>
      </MobileActionBar>
      <MobilePhotoSheet
        open={sheet}
        onOpenChange={setSheet}
        photos={roll}
        max={4 - uploads.length}
        onAdd={(ps) => setRoll((r) => [...ps, ...r])}
        onPick={(ids) => setUploads((l) => [...l, ...ids.map((id) => ({ ...roll.find((p) => p.id === id)!, progress: 0, state: "uploading" as const }))])}
      />
    </>
  );
}
