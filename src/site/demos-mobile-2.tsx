/* eslint-disable react-hooks/rules-of-hooks */
// Demos for the Mobile v2 set: each a real phone screen, drawn in the 390 × 844 PhoneFrame (stage "phone").
import * as React from "react";
import {
  Bell,
  Calendar as CalendarIcon,
  Check,
  CreditCard,
  Home,
  MapPin,
  MoreHorizontal,
  Package,
  Printer,
  ShoppingBag,
  Tag,
  Truck,
  User,
  WifiOff,
  XCircle,
  Inbox as InboxIcon,
  MessageCircle,
  Edit2,
  Menu,
} from "react-feather";
import { formatRp } from "@/lib/ad";
import { useDoubleTapGuard } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";
import { Thumb } from "@/components/ui/thumb";
import { InputOTP, type InputOTPStatus } from "@/components/ui/input-otp";
import { Steps } from "@/components/ui/steps";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { MobileScreen, MobileBarButton } from "@/components/mobile/mobile-nav-bar";
import { MobileList, MobileListRow } from "@/components/mobile/mobile-list";
import { MobileActionBar } from "@/components/mobile/mobile-action-bar";
import { MobileTabBar, MobileTab } from "@/components/mobile/mobile-tab-bar";
import { MobileFilterChips } from "@/components/mobile/mobile-chip-row";
import { MobileTopTabs, MobileTabPager } from "@/components/mobile/mobile-top-tabs";
import { MobileSwitchRow, MobileCheckRow, MobileRadioList } from "@/components/mobile/mobile-choice-rows";
import { MobilePersonRow } from "@/components/mobile/mobile-person-row";
import { MobileIndexedList } from "@/components/mobile/mobile-index-scrubber";
import { MobilePickerSheet, MobileMultiSelectSheet } from "@/components/mobile/mobile-picker-sheet";
import { MobileDateRangeSheet, formatRange, type DateRange } from "@/components/mobile/mobile-date-range";
import { MobileContextMenu } from "@/components/mobile/mobile-context-menu";
import { MobileModal } from "@/components/mobile/mobile-modal";
import { MobileAlert } from "@/components/mobile/mobile-alert";
import { MobileTextField } from "@/components/mobile/mobile-text-field";
import { MobileAmountKeypad } from "@/components/mobile/mobile-keypad";
import { MobileSlider } from "@/components/mobile/mobile-slider";
import { MobilePhotoSheet, MobilePhotoStrip, type Photo } from "@/components/mobile/mobile-photo-picker";
import { MobileScanner } from "@/components/mobile/mobile-scanner";
import { MobileSignaturePad } from "@/components/mobile/mobile-signature";
import { MobileStatGrid, MobileStatTile, MobileKpiCarousel, MobileKpiCard } from "@/components/mobile/mobile-stats";
import { MobileScrubChart } from "@/components/mobile/mobile-scrub-chart";
import { MobileTimeline } from "@/components/mobile/mobile-timeline";
import { MobileReceipt } from "@/components/mobile/mobile-receipt";
import { CountBadge, BadgeAnchor } from "@/components/mobile/mobile-badge";
import { MobileBanner } from "@/components/mobile/mobile-banner";
import { MobileUploadRow } from "@/components/mobile/mobile-upload-row";
import { MobileOnboardingPager } from "@/components/mobile/mobile-pager";
import { MobileChatThread, MobileComposer, type MobileChatMessage } from "@/components/mobile/mobile-chat";
import { MobileSnackbar } from "@/components/mobile/mobile-snackbar";
import { DAILY, HOURLY, NOW, ORDERS, PAID_ORDERS, PRODUCTS, SHOPS, smartTime } from "./data";
import { CAMERA_ROLL, CHATS, CUSTOMERS, productPhoto } from "./mobile-data";
import { COURIERS, orderPhoto, orderRow, productRow } from "./mobile-app-kit";
import type { Demo } from "./demos";

const TO_PACK = PAID_ORDERS.slice(0, 10);
/** Open a sheet from a control (?open=1) and keep it in step with the control. */
function useOpen(p: Record<string, string | boolean>) {
  const [open, setOpen] = React.useState(!!p.open);
  React.useEffect(() => setOpen(!!p.open), [p.open]);
  return [open, setOpen] as const;
}
const openControl = { key: "open", type: "toggle" as const, label: "Open", default: false };
const today = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

export const MOBILE_DEMOS_2: Record<string, Demo> = {
  "mobile-filter-chips": {
    stage: "phone",
    render: () => {
      const [f, setF] = React.useState("all");
      const list = PRODUCTS.filter((p) => (f === "all" ? true : f === "low" ? p.stock > 0 && p.stock <= 3 : f === "out" ? p.stock === 0 : p.stock > 10));
      return (
        <MobileScreen
          title="Products"
          bottomInset="none"
          header={
            <MobileFilterChips
              aria-label="Stock"
              value={f}
              onValueChange={setF}
              options={[
                { value: "all", label: "All", count: PRODUCTS.length },
                { value: "low", label: "Low stock", count: PRODUCTS.filter((p) => p.stock > 0 && p.stock <= 3).length },
                { value: "out", label: "Out of stock", count: PRODUCTS.filter((p) => p.stock === 0).length },
                { value: "plenty", label: "Plenty", count: PRODUCTS.filter((p) => p.stock > 10).length },
              ]}
            />
          }
        >
          <MobileList>{list.map((x) => productRow(x))}</MobileList>
        </MobileScreen>
      );
    },
    usage: () => `<MobileFilterChips\n  aria-label="Stock"\n  value={filter}\n  onValueChange={setFilter}\n  options={[\n    { value: "all", label: "All", count: 10 },\n    { value: "low", label: "Low stock", count: 4 },\n    { value: "out", label: "Out of stock", count: 1 },\n  ]}\n/>`,
  },
  "mobile-top-tabs": {
    stage: "phone",
    render: () => {
      type S = "all" | "Unpaid" | "Paid" | "Packed" | "Shipped" | "Cancelled";
      const [tab, setTab] = React.useState<S>("Paid");
      const tabs: { value: S; label: string }[] = [
        { value: "all", label: "All" },
        { value: "Unpaid", label: "Unpaid" },
        { value: "Paid", label: "To pack" },
        { value: "Packed", label: "To ship" },
        { value: "Shipped", label: "Shipped" },
        { value: "Cancelled", label: "Cancelled" },
      ];
      return (
        <MobileScreen title="Orders" bottomInset="none" header={<MobileTopTabs aria-label="Status" value={tab} onValueChange={setTab} tabs={tabs} />}>
          <MobileTabPager value={tab} onValueChange={setTab} pages={tabs.map((t) => ({ value: t.value, content: <MobileList>{ORDERS.filter((o) => t.value === "all" || o.status === t.value).slice(0, 10).map((o) => orderRow(o))}</MobileList> }))} />
        </MobileScreen>
      );
    },
    usage: () => `<MobileScreen title="Orders" header={<MobileTopTabs aria-label="Status" value={tab} onValueChange={setTab} tabs={tabs} />}>\n  <MobileTabPager value={tab} onValueChange={setTab} pages={tabs.map((t) => ({ value: t.value, content: <OrderList status={t.value} /> }))} />\n</MobileScreen>`,
  },
  "mobile-choice-rows": {
    stage: "phone",
    render: () => {
      const [on, setOn] = React.useState({ orders: true, stock: true, chats: false });
      const [shops, setShops] = React.useState(["Kemang", "Dago"]);
      const [r, setR] = React.useState<"auto" | "ask" | "never">("ask");
      return (
        <MobileScreen title="Settings" bottomInset="none">
          <div className="grid gap-5">
            <MobileList title="Notify me about">
              <MobileSwitchRow icon={ShoppingBag} title="New orders" checked={on.orders} onCheckedChange={(v) => setOn({ ...on, orders: v })} />
              <MobileSwitchRow icon={Package} title="Low stock" checked={on.stock} onCheckedChange={(v) => setOn({ ...on, stock: v })} />
              <MobileSwitchRow icon={MessageCircle} title="Buyer chats" subtitle="Shopee, TikTok, Tokopedia" checked={on.chats} onCheckedChange={(v) => setOn({ ...on, chats: v })} />
            </MobileList>
            <MobileList title="Shops on this phone">
              {SHOPS.slice(0, 4).map((s) => (
                <MobileCheckRow key={s} icon={MapPin} title={s} checked={shops.includes(s)} onCheckedChange={(v) => setShops(v ? [...shops, s] : shops.filter((x) => x !== s))} />
              ))}
            </MobileList>
            <div className="grid gap-1.5 px-pad">
              <h2 className="px-1 text-[13px] text-ink-muted">Receipts</h2>
              <div className="rounded-card bg-surface p-nest">
                <MobileRadioList
                  aria-label="Receipts"
                  value={r}
                  onValueChange={setR}
                  options={[
                    { value: "auto", title: "Print every receipt" },
                    { value: "ask", title: "Ask each time" },
                    { value: "never", title: "Don’t print" },
                  ]}
                />
              </div>
            </div>
          </div>
        </MobileScreen>
      );
    },
    usage: () =>
      `<MobileList title="Notify me about">\n  <MobileSwitchRow icon={ShoppingBag} title="New orders" checked={orders} onCheckedChange={setOrders} />\n</MobileList>\n<MobileList title="Shops">\n  <MobileCheckRow icon={MapPin} title="Kemang" checked={on} onCheckedChange={setOn} />\n</MobileList>\n<MobileRadioList aria-label="Receipts" value={mode} onValueChange={setMode} options={[{ value: "ask", title: "Ask each time" }, …]} />`,
  },
  "mobile-person-row": {
    stage: "phone",
    render: () => (
      <MobileScreen title="Inbox" bottomInset="none">
        <MobileList>
          {CHATS.map((c) => (
            <MobilePersonRow key={c.id} name={c.name} subtitle={c.lines[c.lines.length - 1].text} meta={c.time} unread={c.unread} badge={<MarketMark market={c.market} size={16} />} onClick={() => {}} />
          ))}
        </MobileList>
      </MobileScreen>
    ),
    usage: () => `<MobilePersonRow\n  name="Nadia Putri"\n  subtitle="Can you wrap it as a gift?"\n  meta="14:12"\n  unread={2}\n  badge={<MarketMark market="shopee" size={16} />}\n  onClick={openChat}\n/>`,
  },
  "mobile-index-list": {
    stage: "phone",
    render: () => {
      const sections = [...new Set(CUSTOMERS.map((c) => c.name[0]))].map((letter) => ({ letter, items: CUSTOMERS.filter((c) => c.name[0] === letter) }));
      return (
        <MobileScreen title="Customers" large={false} bottomInset="none">
          <MobileIndexedList sections={sections} bottomInset={24} renderItem={(c) => <MobilePersonRow name={c.name} subtitle={`${c.orders} ${c.orders === 1 ? "order" : "orders"} · ${c.city}`} onClick={() => {}} />} />
        </MobileScreen>
      );
    },
    usage: () => `<MobileScreen title="Customers" large={false}>\n  <MobileIndexedList\n    sections={[{ letter: "A", items: [...] }, …]}\n    renderItem={(c) => <MobilePersonRow name={c.name} subtitle={c.city} onClick={() => open(c)} />}\n  />\n</MobileScreen>`,
  },
  "mobile-picker-sheet": {
    stage: "phone",
    controls: [openControl, { key: "long", type: "toggle", label: "Long list (search)", default: false }],
    render: (p) => {
      const [open, setOpen] = useOpen(p);
      const [v, setV] = React.useState("jne");
      const options = p.long
        ? [...COURIERS, { id: "anteraja", name: "AnterAja Reguler", price: 11000, eta: "2–3 days" }, { id: "ninja", name: "Ninja Xpress", price: 12000, eta: "2–4 days" }, { id: "lion", name: "Lion Parcel", price: 9000, eta: "3–5 days" }, { id: "jnt", name: "J&T Express", price: 11000, eta: "2–3 days" }, { id: "wahana", name: "Wahana", price: 8000, eta: "4–6 days" }]
        : COURIERS;
      const c = options.find((x) => x.id === v)!;
      return (
        <>
          <MobileScreen title="RMB-24811" translateTitle={false} large={false} back={{ label: "Orders", onClick: () => {} }} bottomInset="none">
            <div className="grid gap-5 pt-2">
              <MobileList title="Shipping">
                <MobileListRow media={<Truck />} title="Courier" value={c.name} chevron onClick={() => setOpen(true)} />
              </MobileList>
              <MobileList title="Items">{TO_PACK.slice(0, 3).map((o) => orderRow(o))}</MobileList>
            </div>
          </MobileScreen>
          <MobilePickerSheet open={open} onOpenChange={setOpen} title="Courier" value={v} onValueChange={setV} options={options.map((x) => ({ value: x.id, label: x.name, detail: x.eta, meta: formatRp(x.price), icon: Truck }))} />
        </>
      );
    },
    usage: () => `<MobileListRow media={<Truck />} title="Courier" value={courier.name} chevron onClick={() => setOpen(true)} />\n<MobilePickerSheet\n  open={open}\n  onOpenChange={setOpen}\n  title="Courier"\n  value={courier.id}\n  onValueChange={setCourier}\n  options={couriers.map((c) => ({ value: c.id, label: c.name, detail: c.eta, meta: formatRp(c.price) }))}\n/>`,
  },
  "mobile-multi-select": {
    stage: "phone",
    controls: [openControl],
    render: (p) => {
      const [open, setOpen] = useOpen(p);
      const [v, setV] = React.useState(["Kemang", "Shopee"]);
      return (
        <>
          <MobileScreen title="Report" large={false} back={{ label: "Reports", onClick: () => {} }} bottomInset="none">
            <div className="grid gap-5 pt-2">
              <MobileList>
                <MobileListRow media={<MapPin />} title="Shops" value={v.length === SHOPS.length ? "All" : v.join(", ")} chevron onClick={() => setOpen(true)} />
              </MobileList>
              <MobileList title="Sales">{SHOPS.filter((s) => v.includes(s)).map((s, i) => <MobileListRow key={s} title={s} value={formatRp(18_400_000 - i * 3_150_000)} />)}</MobileList>
            </div>
          </MobileScreen>
          <MobileMultiSelectSheet open={open} onOpenChange={setOpen} title="Shops" value={v} onValueChange={setV} options={SHOPS.map((s) => ({ value: s, label: s, icon: MapPin }))} doneLabel={(n) => (n ? `Show ${n} ${n === 1 ? "shop" : "shops"}` : "Pick a shop")} />
        </>
      );
    },
    usage: () => `<MobileMultiSelectSheet\n  open={open}\n  onOpenChange={setOpen}\n  title="Shops"\n  value={shops}\n  onValueChange={setShops}\n  options={SHOPS.map((s) => ({ value: s, label: s }))}\n  doneLabel={(n) => \`Show \${n} shops\`}\n/>`,
  },
  "mobile-date-range": {
    stage: "phone",
    controls: [openControl],
    render: (p) => {
      const [open, setOpen] = useOpen(p);
      const [r, setR] = React.useState<DateRange>({ from: new Date(today.getTime() - 6 * 864e5), to: today });
      return (
        <>
          <MobileScreen title="Reports" bottomInset="none">
            <div className="grid gap-5">
              <MobileList>
                <MobileListRow media={<CalendarIcon />} title="Dates" value={formatRange(r, NOW)} chevron onClick={() => setOpen(true)} />
              </MobileList>
              <div className="px-pad">
                <div className="rounded-card bg-surface p-pad shadow-card">
                  <MobileScrubChart kind="bars" label="Sales" value="Rp 287,4 jt" data={DAILY.slice(-Math.min(30, Math.round((r.to.getTime() - r.from.getTime()) / 864e5) + 1)).map((d) => ({ label: `${d.label} Nov`, value: d.value, display: d.display }))} height={120} />
                </div>
              </div>
            </div>
          </MobileScreen>
          <MobileDateRangeSheet open={open} onOpenChange={setOpen} value={r} onValueChange={setR} today={NOW} />
        </>
      );
    },
    usage: () => `<MobileListRow media={<Calendar />} title="Dates" value={formatRange(range)} chevron onClick={() => setOpen(true)} />\n<MobileDateRangeSheet open={open} onOpenChange={setOpen} value={range} onValueChange={setRange} />`,
  },
  "mobile-context-menu": {
    stage: "phone",
    render: () => {
      const [snack, setSnack] = React.useState("");
      const [menu, setMenu] = React.useState<string | null>(null);
      return (
        <>
          <MobileScreen title="To pack" bottomInset="none">
            <MobileList>
              {TO_PACK.map((o) => (
                <MobileContextMenu
                  key={o.id}
                  aria-label={o.id}
                  open={menu === o.id}
                  onOpenChange={(v) => setMenu(v ? o.id : null)}
                  actions={[
                    { label: "Mark packed", icon: Check, onSelect: () => setSnack(`${o.id} packed`) },
                    { label: "Print label", icon: Printer, onSelect: () => setSnack(`Label for ${o.id} printing`) },
                    { label: "Cancel order", icon: XCircle, destructive: true, onSelect: () => setSnack(`${o.id} cancelled`) },
                  ]}
                >
                  <MobileListRow
                    media={<Thumb src={orderPhoto(o.items)} alt={o.items} size={40} />}
                    title={o.customer}
                    subtitle={o.items}
                    onClick={() => {}}
                    trailing={
                      <MobileBarButton aria-label={`Actions for ${o.id}`} onClick={() => setMenu(o.id)} className="text-ink-muted">
                        <MoreHorizontal />
                      </MobileBarButton>
                    }
                  />
                </MobileContextMenu>
              ))}
            </MobileList>
          </MobileScreen>
          <MobileSnackbar open={!!snack} onOpenChange={(v) => !v && setSnack("")} message={snack} above="none" />
        </>
      );
    },
    usage: () => `<MobileContextMenu\n  aria-label="RMB-24811"\n  open={open} onOpenChange={setOpen} // the "…" button's twin\n  actions={[\n    { label: "Mark packed", icon: Check, onSelect: pack },\n    { label: "Cancel order", icon: XCircle, destructive: true, onSelect: cancel },\n  ]}\n>\n  <MobileListRow title="Rina K." … />\n</MobileContextMenu>`,
  },
  "mobile-modal": {
    stage: "phone",
    controls: [openControl],
    render: (p) => {
      const [open, setOpen] = useOpen(p);
      const [name, setName] = React.useState(PRODUCTS[0].name);
      const [saved, setSaved] = React.useState(PRODUCTS[0].name);
      const [touched, setTouched] = React.useState(false);
      const nameId = React.useId();
      return (
        <>
          <MobileScreen title={saved} large={false} back={{ label: "Products", onClick: () => {} }} bottomInset="action-bar">
            <div className="grid gap-5 pt-2">
              <div className="px-pad">
                <img src={productPhoto(PRODUCTS[0].sku)} alt={saved} className="aspect-square w-full rounded-card object-cover" />
              </div>
              <MobileList>
                <MobileListRow media={<Tag />} title="Price" value={formatRp(PRODUCTS[0].price)} />
                <MobileListRow media={<Package />} title="In stock" value={PRODUCTS[0].stock} />
              </MobileList>
            </div>
          </MobileScreen>
          <MobileActionBar>
            <Button variant="primary" onClick={() => (setName(saved), setOpen(true))}>
              <Edit2 />
              Edit product
            </Button>
          </MobileActionBar>
          <MobileModal
            open={open}
            onOpenChange={(o) => (setOpen(o), setTouched(false))}
            title="Edit product"
            dirty={name !== saved}
            onSave={() => {
              // Save stays on: with no name it says so on the field and puts the cursor there.
              if (!name.trim()) return (setTouched(true), document.getElementById(nameId)?.focus(), false);
              return new Promise((r) => window.setTimeout(() => (setSaved(name), r(null)), 500));
            }}
          >
            <div className="grid gap-5">
              <MobileTextField id={nameId} label="Name" value={name} onValueChange={setName} onBlur={() => setTouched(true)} error={touched && !name.trim() ? "Give it a name" : undefined} />
            </div>
          </MobileModal>
        </>
      );
    },
    usage: () => `<MobileModal open={open} onOpenChange={setOpen} title="Edit product" dirty={changed} onSave={save}>\n  <MobileTextField label="Name" value={name} onValueChange={setName} />\n</MobileModal>`,
  },
  "mobile-alert": {
    stage: "phone",
    controls: [openControl],
    render: (p) => {
      const [open, setOpen] = useOpen(p);
      const [snack, setSnack] = React.useState("");
      const o = TO_PACK[0];
      return (
        <>
          <MobileScreen title={o.id} translateTitle={false} large={false} back={{ label: "Orders", onClick: () => {} }} bottomInset="action-bar">
            <div className="grid gap-5 pt-2">
              <MobileList title="Customer">
                <MobileListRow media={<User />} title={o.customer} value={o.payment} />
                <MobileListRow media={<MapPin />} title={o.shop} value={smartTime(o.at)} />
              </MobileList>
              <MobileList title="Items">{orderRow(o)}</MobileList>
            </div>
          </MobileScreen>
          <MobileActionBar>
            <Button onClick={() => setOpen(true)}>
              <XCircle />
              Cancel order
            </Button>
            <Button variant="primary">
              <Check />
              Mark packed
            </Button>
          </MobileActionBar>
          <MobileAlert
            open={open}
            onOpenChange={setOpen}
            title={`Cancel ${o.id}?`}
            message={`${o.customer} gets a refund of ${formatRp(o.total)}.`}
            actions={[
              { label: "Keep order", tone: "cancel" },
              { label: "Cancel order", tone: "danger", onSelect: () => setSnack(`${o.id} cancelled`) },
            ]}
          />
          <MobileSnackbar open={!!snack} onOpenChange={(v) => !v && setSnack("")} message={snack} above="action-bar" />
        </>
      );
    },
    usage: () => `<MobileAlert\n  open={open}\n  onOpenChange={setOpen}\n  title="Cancel RMB-24811?"\n  message="Rina K. gets a refund of Rp 178.000."\n  actions={[\n    { label: "Keep order", tone: "cancel" },\n    { label: "Cancel order", tone: "danger", onSelect: cancel },\n  ]}\n/>`,
  },
  "mobile-text-field": {
    stage: "phone",
    controls: [{ key: "error", type: "toggle", label: "Show an error", default: false }, { key: "keyboard", type: "toggle", label: "Keyboard open", default: false }],
    render: (p) => {
      const [name, setName] = React.useState("Nadia Putri");
      const [phone, setPhone] = React.useState(p.error ? "812 44" : "812 4410 2231");
      const [email, setEmail] = React.useState("");
      React.useEffect(() => setPhone(p.error ? "812 44" : "812 4410 2231"), [p.error]);
      const bad = phone.replace(/\D/g, "").length < 9;
      return (
        <>
          <MobileScreen title="New customer" large={false} back={{ label: "Customers", onClick: () => {} }} bottomInset="action-bar">
            <div className="grid gap-4 px-pad pt-3">
              <MobileTextField label="Name" value={name} onValueChange={setName} autoComplete="name" />
              <MobileTextField label="Phone" prefix="+62" type="tel" inputMode="tel" value={phone} onValueChange={setPhone} error={bad ? "Enter the whole number" : undefined} />
              <MobileTextField label="Email" type="email" inputMode="email" value={email} onValueChange={setEmail} placeholder="nadia@example.com" />
            </div>
          </MobileScreen>
          <MobileActionBar>
            <Button variant="primary" disabled={bad || !name.trim()}>
              Add customer
            </Button>
          </MobileActionBar>
        </>
      );
    },
    usage: () => `<MobileTextField label="Phone" prefix="+62" type="tel" inputMode="tel" value={phone} onValueChange={setPhone} error={tooShort ? "Enter the whole number" : undefined} />`,
  },
  "mobile-keypad": {
    stage: "phone",
    render: () => {
      const total = 412000;
      const [cash, setCash] = React.useState(500000);
      return (
        <>
          <MobileScreen title="Payment" large={false} back={{ label: "New sale", onClick: () => {} }} bottomInset="action-bar">
            <div className="grid gap-3 px-pad pt-2">
              <p className="flex h-touch items-center justify-between rounded-control bg-fill px-3.5 text-[15px]">
                <span className="text-ink-muted">To pay</span>
                <span className="font-semibold tabular-nums">{formatRp(total)}</span>
              </p>
              <MobileAmountKeypad
                label="Cash received"
                value={cash}
                onValueChange={setCash}
                quick={[
                  { label: "Exact", value: total },
                  { label: "450.000", value: 450000 },
                  { label: "500.000", value: 500000 },
                ]}
              />
            </div>
          </MobileScreen>
          <MobileActionBar>
            <Button variant="primary" disabled={cash < total}>
              <Check />
              {cash >= total ? `Take cash · change ${formatRp(cash - total)}` : "Take cash"}
            </Button>
          </MobileActionBar>
        </>
      );
    },
    usage: () => `<MobileAmountKeypad label="Cash received" value={cash} onValueChange={setCash} quick={[{ label: "Exact", value: total }, { label: "500.000", value: 500000 }]} />\n\n// or in a sheet, editing a draft:\n<MobileAmountSheet open={open} onOpenChange={setOpen} title="Price" value={price} onValueChange={setPrice} />`,
  },
  "mobile-slider": {
    stage: "phone",
    render: () => {
      const [low, setLow] = React.useState(3);
      const [disc, setDisc] = React.useState(15);
      return (
        <MobileScreen title="Alerts" bottomInset="none">
          <div className="grid gap-4 px-pad">
            <div className="rounded-card bg-surface px-pad pb-2 pt-3 shadow-card">
              <MobileSlider label="Warn me at" value={low} onValueChange={setLow} min={1} max={20} format={(v) => `${v} left`} />
            </div>
            <div className="rounded-card bg-surface px-pad pb-2 pt-3 shadow-card">
              <MobileSlider label="Payday discount" value={disc} onValueChange={setDisc} min={0} max={50} step={5} format={(v) => (v ? `${v}%` : "None")} />
            </div>
          </div>
        </MobileScreen>
      );
    },
    usage: () => `<MobileSlider label="Warn me at" value={low} onValueChange={setLow} min={1} max={20} format={(v) => \`\${v} left\`} />`,
  },
  "mobile-photo-picker": {
    stage: "phone",
    controls: [openControl],
    render: (p) => {
      const [open, setOpen] = useOpen(p);
      const [roll, setRoll] = React.useState<Photo[]>(CAMERA_ROLL);
      const [photos, setPhotos] = React.useState<Photo[]>(CAMERA_ROLL.slice(0, 2));
      return (
        <>
          <MobileScreen title="Photos" large={false} back={{ label: "Product", onClick: () => {} }} bottomInset="none">
            <div className="grid gap-4 px-pad pt-3">
              <MobilePhotoStrip photos={photos} onRemove={(id) => setPhotos((l) => l.filter((x) => x.id !== id))} onAddClick={() => setOpen(true)} />
            </div>
          </MobileScreen>
          <MobilePhotoSheet open={open} onOpenChange={setOpen} photos={roll} max={9 - photos.length} onAdd={(ps) => setRoll((r) => [...ps, ...r])} onPick={(ids) => setPhotos((l) => [...l, ...ids.map((id) => roll.find((x) => x.id === id)!)])} />
        </>
      );
    },
    usage: () => `<MobilePhotoStrip photos={photos} onRemove={remove} onAddClick={() => setOpen(true)} />\n<MobilePhotoSheet open={open} onOpenChange={setOpen} photos={cameraRoll} onAdd={addFiles} onPick={(ids) => add(ids)} />`,
  },
  "mobile-scanner": {
    stage: "phone",
    render: () => {
      const [list, setList] = React.useState<string[]>([]);
      const i = React.useRef(0);
      return (
        <MobileScreen title="Stock count" large={false} back={{ label: "Products", onClick: () => {} }} bottomInset="none">
          <div className="grid gap-5 pt-2">
            <div className="px-pad">
              <MobileScanner mockCode={() => PRODUCTS[i.current++ % PRODUCTS.length].sku} onScan={(code) => setList((l) => [code, ...l])} />
            </div>
            {list.length ? (
              <MobileList title="Scanned">
                {list.map((code, n) => {
                  const p = PRODUCTS.find((x) => x.sku === code);
                  return <MobileListRow key={n} media={<Thumb src={p ? productPhoto(p.sku) : undefined} alt={p?.name ?? code} size={40} />} title={p?.name ?? code} subtitle={code} />;
                })}
              </MobileList>
            ) : null}
          </div>
        </MobileScreen>
      );
    },
    usage: () => `<MobileScanner onScan={(code) => count(code)} />  // the built-in camera is a mock; pass camera={<video …/>} in an app`,
  },
  "mobile-signature": {
    stage: "phone",
    render: () => {
      const [signed, setSigned] = React.useState(false);
      return (
        <>
          <MobileScreen title="Proof of delivery" large={false} back={{ label: "RMB-24790", onClick: () => {} }} bottomInset="action-bar">
            <div className="grid gap-2 px-pad pt-3">
              <h2 className="px-1 text-[13px] text-ink-muted">Signature</h2>
              <MobileSignaturePad onChange={(png) => setSigned(!!png)} />
            </div>
          </MobileScreen>
          <MobileActionBar>
            <Button variant="primary" disabled={!signed}>
              <Check />
              Mark delivered
            </Button>
          </MobileActionBar>
        </>
      );
    },
    usage: () => `<MobileSignaturePad onChange={(png) => setSignature(png)} />`,
  },
  "mobile-otp": {
    stage: "phone",
    controls: [{ key: "status", type: "select", label: "State", options: ["idle", "invalid", "success"], labels: ["Live", "Wrong", "Correct"], default: "idle" }],
    render: (p) => {
      const [code, setCode] = React.useState(p.status === "idle" ? "" : p.status === "invalid" ? "135792" : "246810");
      const [status, setStatus] = React.useState<InputOTPStatus>(p.status as InputOTPStatus);
      React.useEffect(() => {
        setStatus(p.status as InputOTPStatus);
        setCode(p.status === "idle" ? "" : p.status === "invalid" ? "135792" : "246810");
      }, [p.status]);
      return (
        <MobileScreen title="Code" large={false} back={{ label: "Sign in", onClick: () => {} }} bottomInset="none">
          <div className="grid justify-items-center gap-6 px-pad pt-12 text-center">
            <h1 className="text-[22px] font-semibold">Enter the code</h1>
            <InputOTP
              size="touch"
              value={code}
              onValueChange={(v) => (setCode(v), status !== "idle" && setStatus("idle"))}
              status={status}
              onComplete={(v) => {
                setStatus("checking");
                window.setTimeout(() => setStatus(v === "246810" ? "success" : "invalid"), 700);
              }}
            />
            <p className="h-[22px] text-[15px] text-ink-muted">{status === "invalid" ? "Wrong code, try again" : status === "success" ? "Signed in" : "The code is 246810"}</p>
          </div>
        </MobileScreen>
      );
    },
    usage: () => `<InputOTP size="touch" value={code} onValueChange={setCode} status={status} onComplete={check} />`,
  },
  "mobile-stat-tiles": {
    stage: "phone",
    controls: [{ key: "loading", type: "toggle", label: "Loading", default: false }],
    render: (p) => (
      <MobileScreen title="Today" bottomInset="none">
        <div className="px-pad">
          <MobileStatGrid>
            <MobileStatTile label="Sales" value="Rp 12,8 jt" loading={!!p.loading} onClick={() => {}} />
            <MobileStatTile label="Orders" value="86" loading={!!p.loading} onClick={() => {}} />
            <MobileStatTile label="To pack" value="12" loading={!!p.loading} />
            <MobileStatTile label="Returns" value="2" loading={!!p.loading} />
            <MobileStatTile label="Average basket" value="Rp 149.300" loading={!!p.loading} />
            <MobileStatTile label="Cancelled" value="1" loading={!!p.loading} />
          </MobileStatGrid>
        </div>
      </MobileScreen>
    ),
    usage: (p) => `<MobileStatGrid>\n  <MobileStatTile label="Sales" value="Rp 12,8 jt"${p.loading ? " loading" : ""} onClick={openReport} />\n  <MobileStatTile label="Orders" value="86"${p.loading ? " loading" : ""} />\n</MobileStatGrid>`,
  },
  "mobile-kpi-carousel": {
    stage: "phone",
    render: () => (
      <MobileScreen title="Today" bottomInset="none">
        <div className="px-pad">
          <MobileKpiCarousel aria-label="Key numbers">
            <MobileKpiCard label="Sales" value="Rp 59,5 jt">
              <MobileScrubChart kind="bars" label="Sales" value="" data={HOURLY.map((h) => ({ label: `${h.label}:00`, value: h.value, display: h.display }))} height={64} className="[&>figcaption]:hidden" />
            </MobileKpiCard>
            <MobileKpiCard label="Orders" value="86" />
            <MobileKpiCard label="Average basket" value="Rp 149.300" />
            <MobileKpiCard label="To pack" value="12" />
          </MobileKpiCarousel>
        </div>
      </MobileScreen>
    ),
    usage: () => `<MobileKpiCarousel aria-label="Key numbers">\n  <MobileKpiCard label="Sales" value="Rp 59,5 jt"><MobileScrubChart … /></MobileKpiCard>\n  <MobileKpiCard label="Orders" value="86" />\n</MobileKpiCarousel>`,
  },
  "mobile-scrub-chart": {
    stage: "phone",
    controls: [{ key: "kind", type: "select", label: "Kind", options: ["bars", "line"], default: "bars" }],
    render: (p) => (
      <MobileScreen title="Reports" bottomInset="none">
        <div className="grid gap-4 px-pad">
          <div className="rounded-card bg-surface p-pad shadow-card">
            <MobileScrubChart
              kind={p.kind as "bars" | "line"}
              label="Sales, last 30 days"
              value="Rp 1,2 M"
              data={DAILY.map((d) => ({ label: `${d.label} ${Number(d.label) > 16 ? "Oct" : "Nov"}`, value: d.value, display: d.display }))}
              current={p.kind === "bars" ? DAILY.length - 1 : undefined}
              labelEvery={7}
              height={150}
            />
          </div>
        </div>
      </MobileScreen>
    ),
    usage: (p) => `<MobileScrubChart\n  kind="${p.kind}"\n  label="Sales, last 30 days"\n  value="Rp 1,2 M"\n  data={days.map((d) => ({ label: d.date, value: d.total, display: d.money }))}\n/>`,
  },
  "mobile-timeline": {
    stage: "phone",
    render: () => (
      <MobileScreen title="RMB-24790" translateTitle={false} large={false} back={{ label: "Orders", onClick: () => {} }} bottomInset="none">
        <div className="px-pad pt-2">
          <div className="rounded-card bg-surface px-pad py-2 shadow-card">
            <MobileTimeline
              events={[
                { id: "1", title: "Ordered on Shopee", time: "Today, 08:12", state: "done" },
                { id: "2", title: "Paid with ShopeePay", time: "Today, 08:14", state: "done" },
                { id: "3", title: "Packed by Intan", time: "Today, 11:40", state: "done" },
                { id: "4", title: "Picked up by JNE Regular", time: "Today, 13:05", detail: "JX4410293", state: "now" },
                { id: "5", title: "Delivered", state: "next" },
              ]}
            />
          </div>
        </div>
      </MobileScreen>
    ),
    usage: () => `<MobileTimeline events={[\n  { id: "1", title: "Ordered on Shopee", time: "Today, 08:12", state: "done" },\n  { id: "4", title: "Picked up by JNE", time: "Today, 13:05", detail: "JX4410293", state: "now" },\n  { id: "5", title: "Delivered", state: "next" },\n]} />`,
  },
  "mobile-steps": {
    stage: "phone",
    controls: [{ key: "step", type: "select", label: "Step", options: ["0", "1", "2", "3", "4"], labels: ["Unpaid", "Paid", "Packed", "Shipped", "Delivered"], default: "2" }],
    render: (p) => (
      <MobileScreen title="RMB-24811" translateTitle={false} large={false} back={{ label: "Orders", onClick: () => {} }} bottomInset="none">
        <div className="grid gap-5 pt-2">
          <div className="px-pad">
            <div className="rounded-card bg-surface p-pad shadow-card">
              <Steps size="touch" steps={["Paid", "Packed", "Shipped", "Delivered"]} current={Number(p.step)} />
            </div>
          </div>
          <MobileList title="Items">{orderRow(TO_PACK[1])}</MobileList>
        </div>
      </MobileScreen>
    ),
    usage: (p) => `<Steps size="touch" steps={["Paid", "Packed", "Shipped", "Delivered"]} current={${p.step}} />`,
  },
  "mobile-receipt": {
    stage: "phone",
    render: () => (
      <MobileScreen title="Receipt" large={false} back={{ label: "New sale", onClick: () => {} }} bottomInset="none">
        <div className="px-pad pt-2">
          <MobileReceipt
            shop="Rimba Kemang"
            number="POS-0417"
            time="Today, 14:20"
            cashier="Bayu"
            lines={[
              { name: "Gelas kopi tanah liat", qty: 2, price: 89000 },
              { name: "Lilin aromaterapi sereh", qty: 1, price: 119000 },
              { name: "Sendok kayu sawo", qty: 3, price: 45000 },
            ]}
            discount={20000}
            method="Cash"
            received={500000}
          />
        </div>
      </MobileScreen>
    ),
    usage: () => `<MobileReceipt shop="Rimba Kemang" number="POS-0417" time="Today, 14:20" lines={lines} discount={20000} method="Cash" received={500000} />`,
  },
  "mobile-badge": {
    stage: "phone",
    render: () => {
      const [n, setN] = React.useState(3);
      const [tab, setTab] = React.useState("Inbox");
      return (
        <>
          <MobileScreen
            title="Inbox"
            trailing={
              <MobileBarButton aria-label={`Notifications, ${n} new`} onClick={() => setN(0)}>
                <BadgeAnchor badge={<CountBadge count={n} />}>
                  <Bell />
                </BadgeAnchor>
              </MobileBarButton>
            }
          >
            <div className="grid gap-5">
              <MobileList>
                <MobileListRow media={<InboxIcon />} title="Buyer chats" value={<CountBadge count={n} />} chevron onClick={() => setN(n + 1)} />
                <MobileListRow media={<Package />} title="Low stock" value={<CountBadge count={4} tone="soft" />} chevron onClick={() => {}} />
                <MobileListRow media={<CreditCard />} title="Payouts" value={<CountBadge dot />} chevron onClick={() => {}} />
                <MobileListRow media={<ShoppingBag />} title="Orders" value={<CountBadge count={128} />} chevron onClick={() => {}} />
              </MobileList>
            </div>
          </MobileScreen>
          <MobileTabBar>
            {[
              { label: "Home", icon: Home },
              { label: "Orders", icon: ShoppingBag, badge: 12 },
              { label: "Inbox", icon: InboxIcon, badge: n },
              { label: "More", icon: Menu },
            ].map((t) => (
              <MobileTab key={t.label} icon={t.icon} label={t.label} badge={t.badge} active={tab === t.label} onClick={() => setTab(t.label)} />
            ))}
          </MobileTabBar>
        </>
      );
    },
    usage: () => `<MobileListRow title="Buyer chats" value={<CountBadge count={3} />} />\n<BadgeAnchor badge={<CountBadge count={3} />}><Bell /></BadgeAnchor>\n<CountBadge dot />`,
  },
  "mobile-banner": {
    stage: "phone",
    controls: [{ key: "offline", type: "toggle", label: "Offline", default: true }],
    render: (p) => (
      <MobileScreen title="Orders" bottomInset="none">
        <div className="grid gap-4">
          <div className="px-pad">
            <MobileBanner open={!!p.offline} icon={WifiOff} action={{ label: "Retry", onClick: () => {} }}>
              You’re offline. Changes save on this phone and sync later.
            </MobileBanner>
          </div>
          <MobileList>{TO_PACK.map((o) => orderRow(o))}</MobileList>
        </div>
      </MobileScreen>
    ),
    usage: () => `const online = useOnline();\n\n<MobileBanner open={!online} icon={WifiOff} action={{ label: "Retry", onClick: retry }}>\n  You’re offline. Changes save on this phone and sync later.\n</MobileBanner>`,
  },
  "mobile-upload-row": {
    stage: "phone",
    render: () => {
      const [ups, setUps] = React.useState(() => CAMERA_ROLL.slice(0, 4).map((ph, i) => ({ ...ph, progress: [1, 0.64, 0.3, 0.45][i], state: (["done", "uploading", "uploading", "failed"] as const)[i] })));
      React.useEffect(() => {
        if (!ups.some((u) => u.state === "uploading")) return;
        const t = window.setInterval(() => setUps((l) => l.map((u) => (u.state !== "uploading" ? u : { ...u, progress: Math.min(1, u.progress + 0.06), state: u.progress + 0.06 >= 1 ? "done" : "uploading" }))), 240);
        return () => window.clearInterval(t);
      }, [ups]);
      // The next row moves up under the finger, so a double tap on Cancel would cancel two.
      const cancel = useDoubleTapGuard((id: string) => setUps((l) => l.filter((x) => x.id !== id)));
      return (
        <MobileScreen title="Uploads" large={false} back={{ label: "Delivery", onClick: () => {} }} bottomInset="none">
          <div className="pt-2">
            <MobileList>
              {ups.map((u) => (
                <MobileUploadRow
                  key={u.id}
                  name={`IMG_04${u.id.length}${u.id.slice(-1)}.jpg`}
                  size="1,8 MB"
                  progress={u.progress}
                  state={u.state}
                  media={<Thumb src={u.src} alt="" size={40} />}
                  onCancel={() => cancel(u.id)}
                  onRetry={() => setUps((l) => l.map((x) => (x.id === u.id ? { ...x, progress: 0, state: "uploading" } : x)))}
                />
              ))}
            </MobileList>
          </div>
        </MobileScreen>
      );
    },
    usage: () => `<MobileUploadRow name="IMG_0412.jpg" size="1,8 MB" progress={0.64} state="uploading" media={<Thumb src={src} alt="" size={40} />} onCancel={cancel} onRetry={retry} />`,
  },
  "mobile-onboarding": {
    stage: "phone",
    render: () => (
      <MobileOnboardingPager
        onDone={() => {}}
        pages={[
          { key: "a", title: "Every shop’s sales, live", art: <div className="rounded-sheet bg-surface p-3 shadow-dialog"><MobileScrubChart kind="bars" label="Sales today" value="Rp 59,5 jt" data={HOURLY.map((h) => ({ label: h.label, value: h.value }))} height={90} /></div> },
          { key: "b", title: "Pack every marketplace from one list", art: <div className="grid gap-gap"><MobileStatTile label="To pack" value="12" /><MobileStatTile label="Shipped today" value="64" /></div> },
          { key: "c", title: "Every buyer chat in one inbox", art: <div className="grid gap-1.5"><p className="w-fit rounded-card bg-surface px-3.5 py-2 text-[15px] shadow-card">Can you wrap it as a gift?</p><p className="ml-auto w-fit rounded-card bg-on px-3.5 py-2 text-[15px] text-on-ink">Yes, it ships today.</p></div> },
        ]}
      />
    ),
    usage: () => `<MobileOnboardingPager\n  pages={[{ key: "sales", title: "Every shop’s sales, live", art: <SalesCard /> }, …]}\n  onDone={finish}\n/>`,
  },
  "mobile-chat": {
    stage: "phone",
    controls: [{ key: "keyboard", type: "toggle", label: "Keyboard open", default: false }],
    render: () => {
      const chat = CHATS[0];
      const [lines, setLines] = React.useState<MobileChatMessage[]>(chat.lines.map((l) => ({ id: l.id, mine: l.mine, text: l.text, time: l.time })));
      const [draft, setDraft] = React.useState("");
      const [typing, setTyping] = React.useState(false);
      return (
        <>
          <MobileScreen title={chat.name} large={false} back={{ label: "Inbox", onClick: () => {} }} bottomInset="none">
            <MobileChatThread messages={lines} typing={typing} />
          </MobileScreen>
          <MobileComposer
            value={draft}
            onValueChange={setDraft}
            onAttach={() => {}}
            suggestions={["Yes, we’ll gift wrap it", "It ships today"]}
            onSend={(t) => {
              setLines((l) => [...l, { id: `m${l.length}`, mine: true, text: t }]);
              setDraft("");
              window.setTimeout(() => setTyping(true), 600);
              window.setTimeout(() => (setTyping(false), setLines((l) => [...l, { id: `r${l.length}`, text: "Thank you!" }])), 2000);
            }}
          />
        </>
      );
    },
    usage: () => `<MobileScreen title="Nadia Putri" large={false} bottomInset="none">\n  <MobileChatThread messages={messages} typing={typing} />\n</MobileScreen>\n<MobileComposer value={draft} onValueChange={setDraft} onSend={send} onAttach={attach} suggestions={["It ships today"]} />`,
  },
};

