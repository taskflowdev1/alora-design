// The Mobile example app: an invented ERP phone app for Rumah Bambu, built only from the mobile components (and the
// shared ones in their touch size). Orders list → order detail → action sheet, plus Products and Account tabs.
import * as React from "react";
import { Calendar as CalendarIcon, Globe, Bell, MoreHorizontal, Package, Printer, ShoppingBag, Truck, User, XCircle, Check, Archive, MapPin, Search as SearchIcon } from "react-feather";
import { formatDate, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumb } from "@/components/ui/thumb";
import { Switch } from "@/components/ui/switch";
import { SlidingPill } from "@/components/ui/sliding-pill";
import { MobileTabBar, MobileTab } from "@/components/mobile/mobile-tab-bar";
import { MobileScreen, MobileBarButton } from "@/components/mobile/mobile-nav-bar";
import { MobileList, MobileListRow, MobileListSkeleton } from "@/components/mobile/mobile-list";
import { SwipeRow } from "@/components/mobile/mobile-swipe-row";
import { PullToRefresh } from "@/components/mobile/mobile-pull-refresh";
import { MobileSearchBar } from "@/components/mobile/mobile-search-bar";
import { MobileSheet } from "@/components/mobile/mobile-sheet";
import { MobileActionSheet } from "@/components/mobile/mobile-action-sheet";
import { MobileDateSheet } from "@/components/mobile/mobile-wheel-picker";
import { MobileSnackbar } from "@/components/mobile/mobile-snackbar";
import { MobileActionBar } from "@/components/mobile/mobile-action-bar";
import { NOW, ORDERS, PRODUCTS, smartTime, type Order } from "./data";

type Stage = "pack" | "ship" | "done";
const STAGE_OF = (o: Order): Stage | null => (o.status === "Paid" ? "pack" : o.status === "Packed" ? "ship" : o.status === "Shipped" ? "done" : null);
export const COURIERS = [
  { id: "jne", name: "JNE Regular", price: 12000, eta: "2–3 days" },
  { id: "sicepat", name: "SiCepat Halu", price: 11000, eta: "2–4 days" },
  { id: "gosend", name: "GoSend Instant", price: 28000, eta: "Today" },
  { id: "grab", name: "GrabExpress Sameday", price: 24000, eta: "Today" },
  { id: "pos", name: "Pos Kilat", price: 10000, eta: "3–5 days" },
];
const short = (n: number) => (n >= 1e6 ? `Rp ${(n / 1e6).toFixed(1).replace(".", ",")} jt` : formatRp(n));

/** The courier list used by the app and the sheet demo: one of N, so its fill slides. */
export function CourierPicker({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Courier" className="relative grid gap-px">
      <SlidingPill selector='[aria-checked="true"]' className="rounded-control bg-fill-strong" />
      {COURIERS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          onClick={() => onValueChange(c.id)}
          className="relative flex min-h-14 cursor-pointer items-center gap-3 rounded-control px-3 text-left [-webkit-tap-highlight-color:transparent] active:scale-[0.99]"
        >
          <Truck size={20} strokeWidth={1.75} className="shrink-0" />
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-[15px]">{c.name}</span>
            <span className="text-[13px] text-ink-muted">{c.eta}</span>
          </span>
          <span className="text-[15px] tabular-nums text-ink-muted">{formatRp(c.price)}</span>
        </button>
      ))}
    </div>
  );
}

/** The whole app. `startAt` opens a given state for screenshots (?at=detail, ?at=actions). */
export function OrdersApp({ startAt }: { startAt?: string }) {
  const [tab, setTab] = React.useState<"orders" | "products" | "account">("orders");
  const [orders, setOrders] = React.useState(() => ORDERS.slice(0, 40).filter((o) => STAGE_OF(o)));
  const [stage, setStage] = React.useState<Stage>("pack");
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [openId, setOpenId] = React.useState<string | null>(startAt === "detail" || startAt === "actions" ? (ORDERS.find((o) => o.status === "Paid")?.id ?? null) : null);
  const [leaving, setLeaving] = React.useState(false);
  const [snack, setSnack] = React.useState<{ text: string; undo?: () => void } | null>(null);
  React.useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  const setStatus = (id: string, status: Order["status"]) => setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
  const act = (o: Order, status: Order["status"], text: string) => {
    const before = o.status;
    setStatus(o.id, status);
    setSnack({ text, undo: () => setStatus(o.id, before) });
  };
  const close = () => {
    setLeaving(true);
    window.setTimeout(() => (setOpenId(null), setLeaving(false)), 260);
  };
  const list = orders.filter((o) => STAGE_OF(o) === stage && (!q || `${o.customer} ${o.items} ${o.id}`.toLowerCase().includes(q.toLowerCase())));
  const open = orders.find((o) => o.id === openId) ?? null;

  return (
    <div className="relative h-full overflow-hidden bg-page">
      {/* The list stays underneath while a detail screen slides over it from the right (a real page change). */}
      <div className="absolute inset-0 transition-transform duration-[300ms] ease-ad" style={{ transform: open && !leaving ? "translateX(-28%)" : undefined }}>
        {tab === "orders" ? (
          <MobileScreen
            title="Orders"
            header={
              <>
                <MobileSearchBar value={q} onValueChange={setQ} placeholder="Customer, item or order" />
                <Segmented
                  size="touch"
                  aria-label="Stage"
                  value={stage}
                  onValueChange={setStage}
                  className="w-full"
                  options={[
                    { value: "pack", label: "To pack" },
                    { value: "ship", label: "To ship" },
                    { value: "done", label: "Shipped" },
                  ]}
                />
              </>
            }
          >
            <PullToRefresh onRefresh={() => new Promise((r) => window.setTimeout(r, 1200))}>
              {loading ? (
                <MobileListSkeleton rows={7} />
              ) : list.length === 0 ? (
                <EmptyState icon={q ? SearchIcon : Package} title={q ? "No orders match" : "Nothing here"} className="py-20" />
              ) : (
                <MobileList>
                  {list.map((o) => (
                    <SwipeRow
                      key={o.id}
                      trailing={
                        stage === "pack"
                          ? [
                              { label: "Packed", icon: Check, tone: "accent", onSelect: () => act(o, "Packed", `${o.id} packed`) },
                              { label: "Cancel", icon: XCircle, tone: "danger", onSelect: () => act(o, "Cancelled", `${o.id} cancelled`) },
                            ]
                          : stage === "ship"
                            ? [{ label: "Shipped", icon: Truck, tone: "accent", onSelect: () => act(o, "Shipped", `${o.id} shipped`) }]
                            : [{ label: "Archive", icon: Archive, onSelect: () => act(o, "Cancelled", `${o.id} archived`) }]
                      }
                    >
                      <MobileListRow
                        media={<Thumb alt={o.items} size={40} />}
                        title={o.customer}
                        subtitle={`${o.items} · ${smartTime(o.at)}`}
                        value={short(o.total)}
                        onClick={() => setOpenId(o.id)}
                      />
                    </SwipeRow>
                  ))}
                </MobileList>
              )}
            </PullToRefresh>
          </MobileScreen>
        ) : tab === "products" ? (
          <ProductsScreen />
        ) : (
          <AccountScreen />
        )}
        <MobileTabBar>
          <MobileTab icon={ShoppingBag} label="Orders" badge={orders.filter((o) => o.status === "Paid").length} active={tab === "orders"} onClick={() => setTab("orders")} />
          <MobileTab icon={Package} label="Products" active={tab === "products"} onClick={() => setTab("products")} />
          <MobileTab icon={User} label="Account" active={tab === "account"} onClick={() => setTab("account")} />
        </MobileTabBar>
      </div>
      {open ? (
        <div
          className="absolute inset-0 z-50 shadow-dialog"
          style={{ animation: leaving ? "ad-push-out 260ms cubic-bezier(0.32,0.72,0,1) forwards" : "ad-push-in 300ms cubic-bezier(0.32,0.72,0,1)" }}
        >
          <style href="ad-mobile-push" precedence="default">{`@keyframes ad-push-in { from { transform: translateX(100%); } } @keyframes ad-push-out { to { transform: translateX(100%); } }`}</style>
          <OrderScreen
            order={open}
            onBack={close}
            startActions={startAt === "actions"}
            onPrint={() => setSnack({ text: `Label for ${open.id} sent to the printer` })}
            onPacked={() => {
              act(open, "Packed", `${open.id} packed`);
              close();
            }}
            onCancel={() => {
              act(open, "Cancelled", `${open.id} cancelled`);
              close();
            }}
          />
        </div>
      ) : null}
      <MobileSnackbar
        open={!!snack}
        above={open && !leaving ? "action-bar" : "tab-bar"}
        onOpenChange={(o) => !o && setSnack(null)}
        message={snack?.text}
        action={snack?.undo ? { label: "Undo", onClick: snack.undo } : undefined}
      />
    </div>
  );
}

function OrderScreen({
  order,
  onBack,
  onPacked,
  onCancel,
  onPrint,
  startActions,
}: {
  order: Order;
  onBack: () => void;
  onPacked: () => void;
  onCancel: () => void;
  onPrint: () => void;
  startActions?: boolean;
}) {
  const [actions, setActions] = React.useState(!!startActions);
  const [courierOpen, setCourierOpen] = React.useState(false);
  const [courier, setCourier] = React.useState("jne");
  const [dateOpen, setDateOpen] = React.useState(false);
  const [pickup, setPickup] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1));
  const [boxes, setBoxes] = React.useState(1);
  const c = COURIERS.find((x) => x.id === courier)!;
  return (
    <>
      <MobileScreen
        title={order.id}
        large={false}
        back={{ label: "Orders", onClick: onBack }}
        bottomInset="action-bar"
        trailing={
          <MobileBarButton aria-label="More actions" onClick={() => setActions(true)}>
            <MoreHorizontal />
          </MobileBarButton>
        }
      >
        <div className="grid gap-5 pt-2">
          <MobileList title="Customer">
            <MobileListRow media={<User />} title={order.customer} value={order.payment} />
            <MobileListRow media={<MapPin />} title={order.shop} value={smartTime(order.at)} />
          </MobileList>
          <MobileList title="Items">
            <MobileListRow media={<Thumb alt={order.items} size={40} />} title={order.items} subtitle={`${order.qty} pcs`} value={formatRp(order.total)} />
            <MobileListRow media={<Package />} title="Boxes" value={<QuantityStepper size="touch" aria-label="Boxes" value={boxes} onValueChange={setBoxes} min={1} max={9} />} />
          </MobileList>
          <MobileList title="Shipping">
            <MobileListRow media={<Truck />} title="Courier" value={c.name} chevron onClick={() => setCourierOpen(true)} />
            <MobileListRow media={<CalendarIcon />} title="Pickup" value={formatDate(pickup)} chevron onClick={() => setDateOpen(true)} />
          </MobileList>
          <MobileList title="Payment">
            <MobileListRow title="Items" value={formatRp(order.total)} />
            <MobileListRow title="Shipping" value={formatRp(c.price)} />
            <MobileListRow title={<span className="font-semibold">Total</span>} value={<span className="font-semibold text-ink">{formatRp(order.total + c.price)}</span>} />
          </MobileList>
        </div>
      </MobileScreen>
      <MobileActionBar>
        <Button onClick={onPrint}>
          <Printer />
          Print label
        </Button>
        <Button variant="primary" onClick={onPacked}>
          <Check />
          Mark packed
        </Button>
      </MobileActionBar>
      <MobileActionSheet
        open={actions}
        onOpenChange={setActions}
        title={order.id}
        actions={[
          { label: "Print label", icon: Printer, onSelect: onPrint },
          { label: "Change courier", icon: Truck, onSelect: () => setCourierOpen(true) },
          { label: "Change pickup date", icon: CalendarIcon, onSelect: () => setDateOpen(true) },
          { label: "Cancel order", icon: XCircle, destructive: true, onSelect: onCancel },
        ]}
      />
      <MobileSheet
        open={courierOpen}
        onOpenChange={setCourierOpen}
        title="Courier"
        detents={[0.5, 0.92]}
        footer={
          <Button variant="primary" onClick={() => setCourierOpen(false)}>
            Use {c.name}
          </Button>
        }
      >
        <CourierPicker value={courier} onValueChange={setCourier} />
      </MobileSheet>
      <MobileDateSheet open={dateOpen} onOpenChange={setDateOpen} title="Pickup date" value={pickup} onValueChange={setPickup} />
    </>
  );
}

function ProductsScreen() {
  const [stock, setStock] = React.useState(() => Object.fromEntries(PRODUCTS.map((p) => [p.sku, p.stock])));
  const [q, setQ] = React.useState("");
  const list = PRODUCTS.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <MobileScreen title="Products" header={<MobileSearchBar value={q} onValueChange={setQ} placeholder="Name or SKU" />}>
      {list.length ? (
        <MobileList>
          {list.map((p) => (
            <MobileListRow
              key={p.sku}
              media={<Thumb alt={p.name} size={40} />}
              title={p.name}
              subtitle={formatRp(p.price)}
              value={<QuantityStepper size="touch" aria-label={`${p.name} stock`} value={stock[p.sku]} onValueChange={(v) => setStock((s) => ({ ...s, [p.sku]: v }))} />}
            />
          ))}
        </MobileList>
      ) : (
        <EmptyState icon={SearchIcon} title="No products match" className="py-20" />
      )}
    </MobileScreen>
  );
}

function AccountScreen() {
  const [alerts, setAlerts] = React.useState(true);
  const [lowStock, setLowStock] = React.useState(true);
  return (
    <MobileScreen title="Account">
      <div className="grid gap-5">
        <MobileList title="Shop">
          <MobileListRow media={<ShoppingBag />} title="Rumah Bambu Kemang" value="Owner" />
          <MobileListRow media={<Globe />} title="Language" value="ID" />
        </MobileList>
        <MobileList title="Notifications">
          <MobileListRow media={<Bell />} title="New orders" toggle={<Switch size="lg" checked={alerts} onCheckedChange={setAlerts} />} />
          <MobileListRow media={<Package />} title="Low stock" toggle={<Switch size="lg" checked={lowStock} onCheckedChange={setLowStock} />} />
        </MobileList>
      </div>
    </MobileScreen>
  );
}
