/* eslint-disable react-hooks/rules-of-hooks */
// One demo per Mobile item, each a real phone screen. The gallery draws them inside PhoneFrame (stage "phone").
import * as React from "react";
import { BarChart2, Bell, Check, CreditCard, Filter, Globe, Home, MapPin, MoreHorizontal, Package, Plus, Printer, RotateCcw, ShoppingBag, Truck, User, XCircle, Calendar as CalendarIcon, Clock } from "react-feather";
import { formatDate, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumb } from "@/components/ui/thumb";
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
import { NOW, ORDERS, PAID_ORDERS, PRODUCTS, smartTime, type Order } from "./data";
import { productPhoto } from "./mobile-data";
import { COURIERS, CourierPicker } from "./mobile-app";
import { OrderThumb, orderRow, rowTime } from "./mobile-app-kit";
import type { Demo } from "./demos";

const TO_PACK = PAID_ORDERS.slice(0, 12);
/** A plain screen for demos that only need somewhere to sit. */
function OrdersScreen({ children, bottomInset }: { children?: React.ReactNode; bottomInset?: "tab-bar" | "action-bar" | "none" }) {
  return (
    <MobileScreen title="To pack" bottomInset={bottomInset}>
      {children ?? <MobileList>{TO_PACK.map((o) => orderRow(o))}</MobileList>}
    </MobileScreen>
  );
}

export const MOBILE_DEMOS: Record<string, Demo> = {
  "mobile-tab-bar": {
    stage: "phone",
    controls: [
      { key: "iconOnly", type: "toggle", label: "Icons only", default: false },
      { key: "badge", type: "toggle", label: "Count on Orders", default: true },
    ],
    render: (p) => {
      const [tab, setTab] = React.useState("Orders");
      const tabs = [
        { label: "Home", icon: Home },
        { label: "Orders", icon: ShoppingBag },
        { label: "Products", icon: Package },
        { label: "Reports", icon: BarChart2 },
      ];
      return (
        <>
          <MobileScreen title={tab}>
            {tab === "Orders" ? <MobileList>{TO_PACK.map((o) => orderRow(o))}</MobileList> : null}
            {tab === "Products" ? (
              <MobileList>
                {PRODUCTS.map((x) => (
                  <MobileListRow key={x.sku} media={<Thumb src={productPhoto(x.sku)} alt={x.name} size={40} />} title={x.name} value={`${x.stock} left`} />
                ))}
              </MobileList>
            ) : null}
            {tab === "Home" ? (
              <MobileList title="Today">
                <MobileListRow media={<BarChart2 />} title="Sales" value="Rp 12.840.000" />
                <MobileListRow media={<ShoppingBag />} title="Orders" value="86" />
                <MobileListRow media={<Package />} title="To pack" value={TO_PACK.length} />
              </MobileList>
            ) : null}
            {tab === "Reports" ? (
              <MobileList title="Sales this week">
                {["Kemang", "Senopati", "Dago", "Darmo", "Shopee", "TikTok Shop"].map((shop, i) => (
                  <MobileListRow key={shop} media={<MapPin />} title={shop} value={formatRp(18_400_000 - i * 2_150_000)} />
                ))}
              </MobileList>
            ) : null}
          </MobileScreen>
          <MobileTabBar iconOnly={!!p.iconOnly}>
            {tabs.map((t) => (
              <MobileTab key={t.label} icon={t.icon} label={t.label} badge={p.badge && t.label === "Orders" ? TO_PACK.length : undefined} active={tab === t.label} onClick={() => setTab(t.label)} />
            ))}
          </MobileTabBar>
        </>
      );
    },
    usage: (p) =>
      `<MobileTabBar${p.iconOnly ? " iconOnly" : ""}>\n  <MobileTab icon={Home} label="Home" active={tab === "home"} onClick={() => setTab("home")} />\n  <MobileTab icon={ShoppingBag} label="Orders"${p.badge ? " badge={12}" : ""} active={tab === "orders"} onClick={() => setTab("orders")} />\n  <MobileTab icon={Package} label="Products" … />\n</MobileTabBar>`,
  },
  "mobile-nav-bar": {
    stage: "phone",
    controls: [{ key: "large", type: "toggle", label: "Large title", default: true }],
    render: (p) => (
      <MobileScreen
        title="Orders"
        large={!!p.large}
        bottomInset="none"
        back={p.large ? undefined : { label: "Home", onClick: () => {} }}
        trailing={
          <>
            <MobileBarButton aria-label="Filter">
              <Filter />
            </MobileBarButton>
            <MobileBarButton aria-label="New order">
              <Plus />
            </MobileBarButton>
          </>
        }
      >
        <MobileList>{ORDERS.slice(0, 24).map((o) => orderRow(o))}</MobileList>
      </MobileScreen>
    ),
    usage: (p) =>
      `<MobileScreen\n  title="Orders"${p.large ? "" : "\n  large={false}\n  back={{ label: \"Home\", onClick: goBack }}"}\n  trailing={<MobileBarButton aria-label="New order"><Plus /></MobileBarButton>}\n>\n  <MobileList>…</MobileList>\n</MobileScreen>`,
  },
  "mobile-action-bar": {
    stage: "phone",
    controls: [{ key: "keyboard", type: "toggle", label: "Keyboard open", default: false }],
    render: () => {
      const [boxes, setBoxes] = React.useState(1);
      return (
        <>
          <MobileScreen title="RMB-24811" translateTitle={false} large={false} back={{ label: "Orders", onClick: () => {} }} bottomInset="action-bar">
            <div className="grid gap-5 pt-2">
              <MobileList title="Packing note">
                <div className="px-[calc(var(--ad-pad)-var(--ad-nest))] py-2">
                  <textarea aria-label="Packing note" defaultValue="Wrap the mugs one by one, fragile sticker on top." rows={3} className="w-full resize-none bg-transparent text-[16px] text-ink outline-none" />
                </div>
              </MobileList>
              <MobileList title="Parcel">
                <MobileListRow media={<Package />} title="Boxes" value={<QuantityStepper size="touch" aria-label="Boxes" value={boxes} onValueChange={setBoxes} min={1} />} />
                <MobileListRow media={<Truck />} title="Courier" value="JNE Regular" chevron onClick={() => {}} />
              </MobileList>
            </div>
          </MobileScreen>
          <MobileActionBar>
            <Button>
              <Printer />
              Print label
            </Button>
            <Button variant="primary">
              <Check />
              Mark packed
            </Button>
          </MobileActionBar>
        </>
      );
    },
    usage: () => `useKeyboardInset(); // once, near the root\n\n<MobileScreen title="RMB-24811" translateTitle={false} large={false} bottomInset="action-bar">…</MobileScreen>\n<MobileActionBar>\n  <Button><Printer />Print label</Button>\n  <Button variant="primary"><Check />Mark packed</Button>\n</MobileActionBar>`,
  },
  "mobile-list": {
    stage: "phone",
    controls: [{ key: "variant", type: "select", label: "Variant", options: ["inset", "plain"], default: "inset" }],
    render: (p) => (
      <MobileScreen title="Settings" bottomInset="none">
        <div className="grid gap-5">
          <MobileList title="Shop" variant={p.variant as "inset"}>
            <MobileListRow media={<ShoppingBag />} title="Rumah Bambu Kemang" chevron onClick={() => {}} />
            <MobileListRow media={<MapPin />} title="Pickup address" subtitle="Jl. Kemang Raya 12, Jakarta Selatan" chevron onClick={() => {}} />
            <MobileListRow media={<Globe />} title="Language" value="ID" chevron onClick={() => {}} />
          </MobileList>
          <MobileList title="Payouts" variant={p.variant as "inset"}>
            <MobileListRow media={<CreditCard />} title="BCA · 0123 4567 89" value="Daily" chevron onClick={() => {}} />
            <MobileListRow media={<Bell />} title="Payout alerts" value="On" chevron onClick={() => {}} />
          </MobileList>
        </div>
      </MobileScreen>
    ),
    usage: (p) =>
      `<MobileList title="Shop"${p.variant === "plain" ? ' variant="plain"' : ""}>\n  <MobileListRow media={<ShoppingBag />} title="Rumah Bambu Kemang" chevron onClick={open} />\n  <MobileListRow media={<Globe />} title="Language" value="ID" chevron onClick={pick} />\n</MobileList>`,
  },
  "mobile-swipe-row": {
    stage: "phone",
    render: () => {
      const [rows, setRows] = React.useState(TO_PACK);
      const [snack, setSnack] = React.useState("");
      const [undo, setUndo] = React.useState<(() => void) | null>(null);
      const [more, setMore] = React.useState<Order | null>(null);
      // A full swipe commits in one motion, so every drop can be undone (the row goes back where it was).
      const drop = (o: Order, text: string) => {
        const before = rows;
        setRows((r) => r.filter((x) => x.id !== o.id));
        setSnack(text);
        setUndo(() => () => setRows(before));
      };
      const note = (text: string) => (setSnack(text), setUndo(null));
      return (
        <>
          <OrdersScreen bottomInset="none">
            <MobileList>
              {rows.map((o) => (
                <SwipeRow
                  key={o.id}
                  leading={[{ label: "Print", icon: Printer, onSelect: () => note(`Label for ${o.id} printing`) }]}
                  trailing={[
                    { label: "Packed", icon: Check, tone: "accent", onSelect: () => drop(o, `${o.id} packed`) },
                    { label: "Cancel", icon: XCircle, tone: "danger", onSelect: () => drop(o, `${o.id} cancelled`) },
                  ]}
                >
                  <MobileListRow
                    media={<OrderThumb o={o} />}
                    title={o.customer}
                    subtitle={`${rowTime(o.at)} · ${o.items}`}
                    trailing={
                      <MobileBarButton aria-label={`Actions for ${o.id}`} onClick={() => setMore(o)}>
                        <MoreHorizontal />
                      </MobileBarButton>
                    }
                  />
                </SwipeRow>
              ))}
            </MobileList>
          </OrdersScreen>
          <MobileActionSheet
            open={!!more}
            onOpenChange={(o) => !o && setMore(null)}
            title={more?.id}
            actions={
              more
                ? [
                    { label: "Print label", icon: Printer, onSelect: () => note(`Label for ${more.id} printing`) },
                    { label: "Mark packed", icon: Check, onSelect: () => drop(more, `${more.id} packed`) },
                    { label: "Cancel order", icon: XCircle, destructive: true, onSelect: () => drop(more, `${more.id} cancelled`) },
                  ]
                : []
            }
          />
          <MobileSnackbar open={!!snack} onOpenChange={(o) => !o && setSnack("")} message={snack} above="none" action={undo ? { label: "Undo", onClick: undo } : undefined} />
        </>
      );
    },
    usage: () =>
      `<SwipeRow\n  leading={[{ label: "Print", icon: Printer, onSelect: print }]}\n  trailing={[\n    { label: "Packed", icon: Check, tone: "accent", onSelect: pack },\n    { label: "Cancel", icon: XCircle, tone: "danger", onSelect: cancel },\n  ]}\n>\n  <MobileListRow title="Rina K." trailing={<MobileBarButton aria-label="Actions" onClick={openSheet}><MoreHorizontal /></MobileBarButton>} />\n</SwipeRow>`,
  },
  "mobile-pull-refresh": {
    stage: "phone",
    render: () => {
      const [rows, setRows] = React.useState(TO_PACK.slice(2));
      const [n, setN] = React.useState(0);
      return (
        <OrdersScreen bottomInset="none">
          <PullToRefresh
            onRefresh={() =>
              new Promise((r) =>
                window.setTimeout(() => {
                  const next = TO_PACK[(1 - n + TO_PACK.length) % TO_PACK.length];
                  setRows((x) => [{ ...next, id: `${next.id}-${n}`, at: new Date(NOW.getTime() + n * 60000) }, ...x]);
                  setN(n + 1);
                  r(null);
                }, 1400),
              )
            }
          >
            <MobileList>{rows.map((o) => orderRow(o))}</MobileList>
          </PullToRefresh>
        </OrdersScreen>
      );
    },
    usage: () => `<MobileScreen title="To pack">\n  <PullToRefresh onRefresh={() => refetch()}>\n    <MobileList>…</MobileList>\n  </PullToRefresh>\n</MobileScreen>`,
  },
  "mobile-list-skeleton": {
    stage: "phone",
    controls: [{ key: "loading", type: "toggle", label: "Loading", default: true }],
    render: (p) => <OrdersScreen bottomInset="none">{p.loading ? <MobileListSkeleton rows={9} /> : <MobileList>{TO_PACK.slice(0, 9).map((o) => orderRow(o))}</MobileList>}</OrdersScreen>,
    usage: () => `{loading ? <MobileListSkeleton rows={9} /> : <MobileList>{orders.map(row)}</MobileList>}`,
  },
  "mobile-empty-state": {
    stage: "phone",
    render: () => {
      const [stage, setStage] = React.useState("returns");
      return (
        <MobileScreen
          title="Orders"
          bottomInset="none"
          header={
            <Segmented
              size="touch"
              className="w-full"
              aria-label="Stage"
              value={stage}
              onValueChange={setStage}
              options={[
                { value: "pack", label: "To pack" },
                { value: "returns", label: "Returns" },
              ]}
            />
          }
        >
          {stage === "returns" ? <EmptyState icon={RotateCcw} title="No returns this week" className="py-24" /> : <MobileList>{TO_PACK.map((o) => orderRow(o))}</MobileList>}
        </MobileScreen>
      );
    },
    usage: () => `<EmptyState icon={RotateCcw} title="No returns this week" className="py-24" />`,
  },
  "mobile-sheet": {
    stage: "phone",
    controls: [{ key: "detents", type: "select", label: "Detents", options: ["half, full", "fit"], default: "half, full" }],
    render: (p) => {
      const [open, setOpen] = React.useState(false);
      const [courier, setCourier] = React.useState("jne");
      const c = COURIERS.find((x) => x.id === courier)!;
      return (
        <>
          <OrdersScreen bottomInset="none">
            <div className="grid gap-5">
              <MobileList title="Shipping">
                <MobileListRow media={<Truck />} title="Courier" value={c.name} chevron onClick={() => setOpen(true)} />
              </MobileList>
              <MobileList>{TO_PACK.slice(0, 6).map((o) => orderRow(o))}</MobileList>
            </div>
          </OrdersScreen>
          <MobileSheet
            open={open}
            onOpenChange={setOpen}
            title="Courier"
            detents={p.detents === "fit" ? ["fit"] : [0.5, 0.92]}
            footer={
              <Button variant="primary" onClick={() => setOpen(false)}>
                Use {c.name}
              </Button>
            }
          >
            <CourierPicker value={courier} onValueChange={setCourier} />
          </MobileSheet>
        </>
      );
    },
    usage: (p) =>
      `<MobileSheet\n  open={open}\n  onOpenChange={setOpen}\n  title="Courier"\n  detents={${p.detents === "fit" ? '["fit"]' : "[0.5, 0.92]"}}\n  footer={<Button variant="primary">Use JNE Regular</Button>}\n>\n  …\n</MobileSheet>`,
  },
  "mobile-action-sheet": {
    stage: "phone",
    render: () => {
      const [open, setOpen] = React.useState(false);
      const [snack, setSnack] = React.useState("");
      const o = TO_PACK[0];
      return (
        <>
          <MobileScreen
            title={o.id}
            translateTitle={false}
            large={false}
            bottomInset="none"
            back={{ label: "Orders", onClick: () => {} }}
            trailing={
              <MobileBarButton aria-label="More actions" onClick={() => setOpen(true)}>
                <MoreHorizontal />
              </MobileBarButton>
            }
          >
            <div className="grid gap-5 pt-2">
              <MobileList title="Customer">
                <MobileListRow media={<User />} title={o.customer} value={o.payment} />
                <MobileListRow media={<MapPin />} title={o.shop} value={smartTime(o.at)} />
              </MobileList>
              <MobileList title="Items">
                <MobileListRow media={<OrderThumb o={o} />} title={o.items} subtitle={`${o.qty} pcs`} value={formatRp(o.total)} />
              </MobileList>
            </div>
          </MobileScreen>
          <MobileActionSheet
            open={open}
            onOpenChange={setOpen}
            title={o.id}
            actions={[
              { label: "Print label", icon: Printer, onSelect: () => setSnack("Label sent to the printer") },
              { label: "Mark packed", icon: Check, onSelect: () => setSnack(`${o.id} packed`) },
              { label: "Cancel order", icon: XCircle, destructive: true, onSelect: () => setSnack(`${o.id} cancelled`) },
            ]}
          />
          <MobileSnackbar open={!!snack} onOpenChange={(x) => !x && setSnack("")} message={snack} above="none" />
        </>
      );
    },
    usage: () =>
      `<MobileActionSheet\n  open={open}\n  onOpenChange={setOpen}\n  title="RMB-24811"\n  actions={[\n    { label: "Print label", icon: Printer, onSelect: print },\n    { label: "Cancel order", icon: XCircle, destructive: true, onSelect: cancel },\n  ]}\n/>`,
  },
  "mobile-date-picker": {
    stage: "phone",
    controls: [{ key: "mode", type: "select", label: "Mode", options: ["date", "time"], default: "date" }],
    render: (p) => {
      const [open, setOpen] = React.useState(false);
      const [when, setWhen] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 1, 10, 30));
      const time = p.mode === "time";
      return (
        <>
          <OrdersScreen bottomInset="none">
            <div className="grid gap-5">
              <MobileList title="Pickup">
                <MobileListRow
                  media={time ? <Clock /> : <CalendarIcon />}
                  title={time ? "Pickup time" : "Pickup date"}
                  value={time ? `${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}` : formatDate(when)}
                  chevron
                  onClick={() => setOpen(true)}
                />
              </MobileList>
              <MobileList>{TO_PACK.slice(0, 6).map((o) => orderRow(o))}</MobileList>
            </div>
          </OrdersScreen>
          <MobileDateSheet open={open} onOpenChange={setOpen} title={time ? "Pickup time" : "Pickup date"} mode={time ? "time" : "date"} value={when} onValueChange={setWhen} />
        </>
      );
    },
    usage: (p) => `<MobileDateSheet\n  open={open}\n  onOpenChange={setOpen}\n  title="Pickup ${p.mode === "time" ? "time" : "date"}"${p.mode === "time" ? '\n  mode="time"' : ""}\n  value={pickup}\n  onValueChange={setPickup}\n/>`,
  },
  "mobile-segmented": {
    stage: "phone",
    render: () => {
      const [stage, setStage] = React.useState("pack");
      const list = ORDERS.filter((o) => o.status === (stage === "pack" ? "Paid" : stage === "ship" ? "Packed" : "Shipped")).slice(0, 12);
      return (
        <MobileScreen
          title="Orders"
          bottomInset="none"
          header={
            <Segmented
              size="touch"
              className="w-full"
              aria-label="Stage"
              value={stage}
              onValueChange={setStage}
              options={[
                { value: "pack", label: "To pack" },
                { value: "ship", label: "To ship" },
                { value: "done", label: "Shipped" },
              ]}
            />
          }
        >
          <MobileList>{list.map((o) => orderRow(o))}</MobileList>
        </MobileScreen>
      );
    },
    usage: () => `<Segmented size="touch" className="w-full" value={stage} onValueChange={setStage} options={[\n  { value: "pack", label: "To pack" },\n  { value: "ship", label: "To ship" },\n  { value: "done", label: "Shipped" },\n]} />`,
  },
  "mobile-search-bar": {
    stage: "phone",
    render: () => {
      const [q, setQ] = React.useState("");
      const list = PRODUCTS.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
      return (
        <MobileScreen title="Products" bottomInset="none" header={<MobileSearchBar value={q} onValueChange={setQ} placeholder="Name or SKU" />}>
          {list.length ? (
            <MobileList>
              {list.map((x) => (
                <MobileListRow key={x.sku} media={<Thumb src={productPhoto(x.sku)} alt={x.name} size={40} />} title={x.name} subtitle={x.sku} value={`${x.stock} left`} />
              ))}
            </MobileList>
          ) : (
            <EmptyState icon={Package} title="No products match" className="py-20" />
          )}
        </MobileScreen>
      );
    },
    usage: () => `<MobileScreen title="Products" header={<MobileSearchBar value={q} onValueChange={setQ} placeholder="Name or SKU" />}>\n  …\n</MobileScreen>`,
  },
  "mobile-stepper": {
    stage: "phone",
    render: () => {
      const [stock, setStock] = React.useState(() => Object.fromEntries(PRODUCTS.map((x) => [x.sku, x.stock])));
      return (
        <MobileScreen title="Stock count" bottomInset="none">
          <MobileList>
            {PRODUCTS.map((x) => (
              <MobileListRow
                key={x.sku}
                media={<Thumb src={productPhoto(x.sku)} alt={x.name} size={40} />}
                // Two lines for the name: the 140 px stepper leaves little room, and a cut name can't be told apart.
                title={<span className="line-clamp-2 whitespace-normal leading-[1.25]">{x.name}</span>}
                subtitle={x.sku}
                value={<QuantityStepper size="touch" aria-label={`${x.name} count`} value={stock[x.sku]} onValueChange={(v) => setStock((s) => ({ ...s, [x.sku]: v }))} />}
              />
            ))}
          </MobileList>
        </MobileScreen>
      );
    },
    usage: () => `<QuantityStepper size="touch" aria-label="Count" value={count} onValueChange={setCount} />`,
  },
  "mobile-snackbar": {
    stage: "phone",
    render: () => {
      const [rows, setRows] = React.useState(TO_PACK.slice(0, 8));
      const [last, setLast] = React.useState<{ o: Order; i: number } | null>(null);
      const [tab, setTab] = React.useState("Orders");
      return (
        <>
          <MobileScreen title="To pack">
            <MobileList>
              {rows.map((o, i) => (
                <MobileListRow
                  key={o.id}
                  media={<OrderThumb o={o} />}
                  title={o.customer}
                  subtitle={o.items}
                  trailing={
                    <MobileBarButton aria-label={`Mark ${o.id} packed`} onClick={() => (setRows((r) => r.filter((x) => x.id !== o.id)), setLast({ o, i }))}>
                      <Check />
                    </MobileBarButton>
                  }
                />
              ))}
            </MobileList>
          </MobileScreen>
          <MobileTabBar>
            {[
              { label: "Orders", icon: ShoppingBag },
              { label: "Products", icon: Package },
              { label: "Account", icon: User },
            ].map((t) => (
              <MobileTab key={t.label} icon={t.icon} label={t.label} active={tab === t.label} onClick={() => setTab(t.label)} />
            ))}
          </MobileTabBar>
          <MobileSnackbar
            open={!!last}
            onOpenChange={(o) => !o && setLast(null)}
            message={last ? `${last.o.id} packed` : ""}
            action={last ? { label: "Undo", onClick: () => setRows((r) => [...r.slice(0, last.i), last.o, ...r.slice(last.i)]) } : undefined}
          />
        </>
      );
    },
    usage: () => `<MobileSnackbar\n  open={!!last}\n  onOpenChange={(o) => !o && setLast(null)}\n  message="RMB-24811 packed"\n  action={{ label: "Undo", onClick: undo }}\n/>`,
  },
};
