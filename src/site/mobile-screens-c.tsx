// Example app screens, part C: More, POS (cart, payment, receipt), Approvals, Schedule, Settings, Account, Sign in,
// one-time code, Welcome.
import * as React from "react";
import {
  BarChart2,
  Calendar as CalendarIcon,
  Check,
  CheckCircle,
  CreditCard,
  Globe,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  RefreshCw,
  Repeat,
  Settings as SettingsIcon,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Truck,
  Users,
  X,
  CheckSquare,
  Maximize,
  Compass,
  Trash2,
  Plus,
} from "react-feather";
import { Flag } from "@/components/ui/language-picker";
import { SAFE_TOP, cn, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Thumb } from "@/components/ui/thumb";
import { InputOTP, otpLanded, type InputOTPStatus } from "@/components/ui/input-otp";
import { MobileScreen, MobileBarButton, MobileBarTextButton } from "@/components/mobile/mobile-nav-bar";
import { MobileList, MobileListRow } from "@/components/mobile/mobile-list";
import { MobileSearchBar } from "@/components/mobile/mobile-search-bar";
import { MobileActionSheet } from "@/components/mobile/mobile-action-sheet";
import { MobileActionBar } from "@/components/mobile/mobile-action-bar";
import { SwipeRow } from "@/components/mobile/mobile-swipe-row";
import { MobileFilterChips } from "@/components/mobile/mobile-chip-row";
import { MobileAlert } from "@/components/mobile/mobile-alert";
import { MobileTextField } from "@/components/mobile/mobile-text-field";
import { MobileAmountKeypad } from "@/components/mobile/mobile-keypad";
import { MobileReceipt } from "@/components/mobile/mobile-receipt";
import { MobilePersonRow } from "@/components/mobile/mobile-person-row";
import { MobileSwitchRow, MobileRadioList } from "@/components/mobile/mobile-choice-rows";
import { MobileSlider } from "@/components/mobile/mobile-slider";
import { MobilePickerSheet, MobileMultiSelectSheet } from "@/components/mobile/mobile-picker-sheet";
import { MobileOnboardingPager } from "@/components/mobile/mobile-pager";
import { MobileStatTile } from "@/components/mobile/mobile-stats";
import { MobileScrubChart } from "@/components/mobile/mobile-scrub-chart";
import { CountBadge } from "@/components/mobile/mobile-badge";
import { HOURLY, ORDERS, PRODUCTS, SHOPS, productPhoto } from "./data";
import { APPROVALS, SHIFTS, weekDay, type Approval } from "./mobile-data";
import { COURIERS, ScreenEmpty, useNav, type ScreenProps } from "./mobile-app-kit";

/* ------------------------------------------------------------ More */

export function MoreScreen() {
  const nav = useNav();
  const [out, setOut] = React.useState(false);
  return (
    <>
      <MobileScreen title="More">
        <div className="grid gap-5">
          <MobileList>
            <MobilePersonRow name="Rizky Hartono" subtitle="Owner · Rimba" chevron onClick={() => nav.push("account")} />
          </MobileList>
          <MobileList title="Sell">
            <MobileListRow media={<ShoppingCart />} title="New sale" chevron onClick={() => nav.push("pos")} />
            <MobileListRow media={<Users />} title="Customers" chevron onClick={() => nav.push("customers")} />
            <MobileListRow media={<BarChart2 />} title="Reports" chevron onClick={() => nav.push("reports")} />
          </MobileList>
          <MobileList title="Run the shop">
            <MobileListRow media={<Maximize />} title="Stock count" chevron onClick={() => nav.push("stock-count")} />
            <MobileListRow media={<CheckSquare />} title="Approvals" value={<CountBadge count={APPROVALS.length} />} chevron onClick={() => nav.push("approvals")} />
            <MobileListRow media={<CalendarIcon />} title="Team schedule" chevron onClick={() => nav.push("schedule")} />
          </MobileList>
          <MobileList title="App">
            <MobileListRow media={<SettingsIcon />} title="Settings" chevron onClick={() => nav.push("settings")} />
            <MobileListRow media={<Compass />} title="Welcome tour" chevron onClick={() => nav.cover("onboarding")} />
            <MobileListRow media={<LogOut />} title="Sign out" onClick={() => setOut(true)} />
          </MobileList>
        </div>
      </MobileScreen>
      <SignOutAlert open={out} onOpenChange={setOut} />
    </>
  );
}

function SignOutAlert({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useNav();
  return (
    <MobileAlert
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out of Rimba on this phone?"
      actions={[
        { label: "Stay", tone: "cancel" },
        { label: "Sign out", tone: "danger", onSelect: () => nav.cover("login") },
      ]}
    />
  );
}

/* ------------------------------------------------------------ POS */

type Cart = Record<string, number>;
let cart: Cart = { "RMB-GL-014": 2, "RMB-LL-008": 1, "RMB-SP-003": 3 };
const listeners = new Set<() => void>();
const cartStore = {
  get: () => cart,
  set: (next: Cart) => {
    cart = next;
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => (listeners.add(l), () => void listeners.delete(l)),
};
const useCart = () => React.useSyncExternalStore(cartStore.subscribe, cartStore.get);
const totalOf = (c: Cart) => Object.entries(c).reduce((s, [sku, n]) => s + (PRODUCTS.find((p) => p.sku === sku)?.price ?? 0) * n, 0);

export function PosScreen({ back }: ScreenProps) {
  const nav = useNav();
  const c = useCart();
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const items = Object.values(c).reduce((s, n) => s + n, 0);
  const total = totalOf(c);
  const setQty = (sku: string, v: number) => cartStore.set(Object.fromEntries(Object.entries({ ...c, [sku]: v }).filter(([, n]) => n > 0)));
  // Clearing is one tap, so it can be undone instead of asked about.
  const clear = () => {
    const before = c;
    cartStore.set({});
    nav.snack("Cart cleared", () => cartStore.set(before));
  };
  const list = PRODUCTS.filter((p) => (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (filter === "all" || (filter === "cart" ? c[p.sku] : p.stock > 0)));
  return (
    <>
      <MobileScreen
        title="New sale"
        large={false}
        back={back}
        bottomInset="action-bar"
        trailing={
          items ? (
            <MobileBarButton aria-label="Clear the cart" onClick={clear}>
              <Trash2 />
            </MobileBarButton>
          ) : null
        }
        header={
          <div className="grid gap-2 pt-1">
            <MobileSearchBar value={q} onValueChange={setQ} placeholder="Find a product" />
            <MobileFilterChips
              aria-label="Show"
              value={filter}
              onValueChange={setFilter}
              options={[
                { value: "all", label: "All" },
                { value: "stock", label: "In stock" },
                { value: "cart", label: "In cart", count: items },
              ]}
            />
          </div>
        }
      >
        <MobileList>
          {/* A tap on the row adds one; the stepper shows only once it's in the cart, so names keep their width. */}
          {list.map((p) => {
            const n = c[p.sku] ?? 0;
            const room = Math.max(p.stock, n);
            return (
              <MobileListRow
                key={p.sku}
                media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />}
                // Two lines, so the stepper never cuts the name of what is being sold.
                title={<span className="line-clamp-2 whitespace-normal leading-[1.25]">{p.name}</span>}
                subtitle={p.stock ? formatRp(p.price) : `${formatRp(p.price)} · out of stock`}
                onClick={n ? undefined : p.stock ? () => setQty(p.sku, 1) : undefined}
                value={n ? <QuantityStepper size="touch" aria-label={`${p.name} in cart`} value={n} min={0} max={room} onValueChange={(v) => setQty(p.sku, v)} /> : undefined}
                trailing={
                  n || !p.stock ? null : (
                    <button
                      type="button"
                      aria-label={`Add ${p.name}`}
                      onClick={() => setQty(p.sku, 1)}
                      className="ad-press mr-1 grid size-touch shrink-0 cursor-pointer place-items-center rounded-control text-ink focus-visible:bg-fill active:scale-[0.92] active:bg-fill data-pressed:scale-[0.92] data-pressed:bg-fill"
                    >
                      <Plus size={20} strokeWidth={1.75} />
                    </button>
                  )
                }
              />
            );
          })}
        </MobileList>
      </MobileScreen>
      <MobileActionBar>
        {/* Off only while the cart is empty, and then the label says so. */}
        <Button variant="primary" disabled={!items} onClick={() => nav.push("pos-pay")}>
          {items ? `Charge ${formatRp(total)}` : "Add an item to charge"}
        </Button>
      </MobileActionBar>
    </>
  );
}

/** A drawn QR (made-up pattern), ink on the surface. */
function QrMock({ seed }: { seed: number }) {
  const n = 25;
  const cells: boolean[] = Array.from({ length: n * n }, (_, i) => ((i * 7919 + seed * 104729) % 97) % 3 === 0);
  const finder = (x: number, y: number) => [0, n - 7].some((fx) => [0, n - 7].some((fy) => !(fx === n - 7 && fy === n - 7) && x >= fx && x < fx + 7 && y >= fy && y < fy + 7));
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="aspect-square w-[200px] text-ink" shapeRendering="crispEdges" role="img" aria-label="QRIS code">
      {cells.map((on, i) => {
        const x = i % n;
        const y = Math.floor(i / n);
        if (finder(x, y)) return null;
        return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="currentColor" /> : null;
      })}
      {[
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} fill="currentColor">
          <path d={`M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z`} fillRule="evenodd" />
          <rect x={x + 2} y={y + 2} width="3" height="3" />
        </g>
      ))}
    </svg>
  );
}

export function PosPayScreen({ back }: ScreenProps) {
  const nav = useNav();
  const c = useCart();
  const total = totalOf(c);
  const [method, setMethod] = React.useState<"cash" | "qris" | "card">("cash");
  const [cash, setCash] = React.useState(0);
  const up = (step: number) => Math.ceil((total + 1) / step) * step;
  const can = method !== "cash" || cash >= total;
  // Take cash stays on: pressed with too little, the Change row says how much is missing and shakes once.
  const [tried, setTried] = React.useState(false);
  const changeRow = React.useRef<HTMLParagraphElement>(null);
  const refuse = () => {
    setTried(true);
    if (!prefersReducedMotion()) changeRow.current?.animate([{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "none" }], { duration: 320, easing: "ease-out" });
  };
  return (
    <>
      <MobileScreen title="Payment" large={false} back={back} bottomInset="action-bar">
        <div className="grid gap-4 px-pad pt-2">
          <div className="grid justify-items-center gap-1 py-1">
            <span className="text-[13px] text-ink-muted">To pay</span>
            <span className="text-[24px] font-semibold tabular-nums">{formatRp(total)}</span>
          </div>
          <Segmented
            size="touch"
            aria-label="Payment method"
            className="w-full"
            value={method}
            onValueChange={setMethod}
            options={[
              { value: "cash", label: "Cash" },
              { value: "qris", label: "QRIS" },
              { value: "card", label: "Card" },
            ]}
          />
          {method === "cash" ? (
            <div className="grid gap-2">
              <MobileAmountKeypad
                label="Cash received"
                value={cash}
                onValueChange={setCash}
                quick={[
                  { label: "Exact", value: total },
                  { label: formatRp(up(50000)).replace(/^Rp\s/, ""), value: up(50000) },
                  { label: formatRp(up(100000)).replace(/^Rp\s/, ""), value: up(100000) },
                ]}
              />
              <p ref={changeRow} aria-live="polite" className="flex h-touch items-center justify-between rounded-control bg-fill px-3.5 text-[15px]">
                <span className="text-ink-muted">{cash >= total || !(tried || cash) ? "Change" : "Still to pay"}</span>
                <span className="font-semibold tabular-nums">{cash >= total ? formatRp(cash - total) : tried || cash ? `${formatRp(total - cash)} short` : "–"}</span>
              </p>
            </div>
          ) : method === "qris" ? (
            <div className="grid justify-items-center gap-3 rounded-card bg-surface p-6 shadow-card">
              <QrMock seed={total % 97} />
              <p className="text-[15px] text-ink-muted">Rimba Kemang · {formatRp(total)}</p>
            </div>
          ) : (
            <div className="grid justify-items-center gap-3 rounded-card bg-surface p-8 shadow-card">
              <CreditCard size={40} strokeWidth={1.5} className="text-ink-muted" />
              <p className="text-[17px] font-medium">Tap or insert the card on the reader</p>
            </div>
          )}
        </div>
      </MobileScreen>
      <MobileActionBar>
        <Button
          variant="primary"
          onClick={() => {
            if (!can) return refuse();
            // Paid: the receipt keeps its own copy of the lines and the cart empties now, so nothing can charge it twice.
            const lines = Object.entries(c)
              .map(([sku, n]) => `${sku}:${n}`)
              .join(",");
            cartStore.set({});
            nav.replace("pos-receipt", { method, received: String(method === "cash" ? cash : total), lines });
          }}
        >
          <Check />
          {method === "cash" ? "Take cash" : "Payment received"}
        </Button>
      </MobileActionBar>
    </>
  );
}

/** A sample sale for the receipt when it's opened on its own (the gallery, a direct link). */
const SAMPLE_LINES = "RMB-GL-014:2,RMB-LL-008:1,RMB-SP-003:3";

export function PosReceiptScreen({ params }: ScreenProps) {
  const nav = useNav();
  const c: Cart = Object.fromEntries(
    (params.lines || SAMPLE_LINES)
      .split(",")
      .map((x) => x.split(":"))
      .filter(([sku, n]) => PRODUCTS.some((p) => p.sku === sku) && Number(n) > 0)
      .map(([sku, n]) => [sku, Number(n)]),
  );
  const lines = Object.entries(c).map(([sku, qty]) => {
    const p = PRODUCTS.find((x) => x.sku === sku)!;
    return { name: p.name, qty, price: p.price };
  });
  const total = totalOf(c);
  const method = params.method === "qris" ? "QRIS" : params.method === "card" ? "Debit card" : "Cash";
  return (
    <>
      {/* The end of the sale: no Back into a paid cart. Done goes back to where the sale started. */}
      <MobileScreen title="Receipt" large={false} leading={<MobileBarTextButton onClick={() => nav.pop(2)}>Done</MobileBarTextButton>} bottomInset="action-bar">
        <div className="grid gap-4 px-pad pt-2">
          <div className="grid justify-items-center gap-2 py-2 text-center">
            <CheckCircle size={40} strokeWidth={1.5} />
            <p className="text-[20px] font-semibold">{formatRp(total)} paid</p>
          </div>
          <MobileReceipt shop="Rimba Kemang" number="POS-0417" time="Today, 14:20" cashier="Bayu" lines={lines} method={method} received={params.received ? Number(params.received) : total} />
        </div>
      </MobileScreen>
      <MobileActionBar>
        <Button onClick={() => nav.snack("Receipt sent to the printer")}>
          <Printer />
          Print
        </Button>
        <Button variant="primary" onClick={() => nav.pop()}>
          New sale
        </Button>
      </MobileActionBar>
    </>
  );
}

/* ------------------------------------------------------------ Approvals */

export function ApprovalsScreen({ back, state }: ScreenProps) {
  const nav = useNav();
  const [list, setList] = React.useState<Approval[]>(state === "empty" ? [] : APPROVALS);
  const [filter, setFilter] = React.useState("all");
  // A decided card folds away over 220 ms, but its slot stays (empty) and the cards ignore taps for 400 ms, a double tap's
  // reach: the second tap would otherwise land on the next card's button, which slid up under the finger. Undo puts back
  // only that card, in its place, so stacked decisions all undo.
  const [leaving, setLeaving] = React.useState<string[]>([]);
  const timers = React.useRef(new Map<string, number>());
  React.useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);
  const decide = (a: Approval, ok: boolean) => {
    if (leaving.includes(a.id)) return;
    setLeaving((l) => [...l, a.id]);
    timers.current.set(
      a.id,
      window.setTimeout(() => {
        setList((l) => l.filter((x) => x.id !== a.id));
        setLeaving((l) => l.filter((x) => x !== a.id));
      }, 400),
    );
    nav.snack(`${ok ? "Approved" : "Rejected"}: ${a.title}`, () => {
      window.clearTimeout(timers.current.get(a.id));
      setLeaving((l) => l.filter((x) => x !== a.id));
      setList((l) => APPROVALS.filter((x) => x.id === a.id || l.includes(x)));
    });
  };
  const shown = list.filter((a) => filter === "all" || a.kind === filter);
  return (
    <MobileScreen
      title="Approvals"
      large={false}
      back={back}
      bottomInset="none"
      header={
        list.length ? (
        <div className="pt-1">
          <MobileFilterChips
            aria-label="Kind"
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: "all", label: "All", count: list.length },
              { value: "expense", label: "Expenses", count: list.filter((a) => a.kind === "expense").length },
              { value: "leave", label: "Leave", count: list.filter((a) => a.kind === "leave").length },
            ]}
          />
        </div>
        ) : null
      }
    >
      {shown.length ? (
        <div className="grid px-pad" inert={leaving.length > 0 || undefined}>
          {shown.map((a) => (
            <div
              key={a.id}
              className={cn("grid transition-[grid-template-rows,opacity] duration-[220ms] ease-ad", leaving.includes(a.id) ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]")}
            >
            <div className={cn("min-h-0 pb-gap", leaving.includes(a.id) && "overflow-hidden")}>
            <SwipeRow
              className="rounded-card shadow-card"
              leading={[{ label: "Approve", icon: Check, tone: "accent", onSelect: () => decide(a, true) }]}
              trailing={[{ label: "Reject", icon: X, tone: "danger", onSelect: () => decide(a, false) }]}
            >
              <article className="grid gap-3 p-pad">
                <div className="flex items-center gap-3">
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-[15px] font-medium">{a.title}</span>
                    <span className="truncate text-[13px] text-ink-muted">
                      {a.who} · {a.time}
                    </span>
                  </span>
                  <span className="shrink-0 text-[17px] font-semibold tabular-nums">{a.amount ? formatRp(a.amount) : a.dates}</span>
                </div>
                <div className="grid grid-cols-2 gap-gap">
                  <Button className="h-touch text-[15px]" onClick={() => decide(a, false)}>
                    <X />
                    Reject
                  </Button>
                  <Button className="h-touch text-[15px] font-semibold" onClick={() => decide(a, true)}>
                    <Check />
                    Approve
                  </Button>
                </div>
              </article>
            </SwipeRow>
            </div>
            </div>
          ))}
        </div>
      ) : (
        <ScreenEmpty icon={CheckCircle} title="All caught up" />
      )}
    </MobileScreen>
  );
}

/* ------------------------------------------------------------ Schedule */

const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ScheduleScreen({ back }: ScreenProps) {
  const nav = useNav();
  const [day, setDay] = React.useState("0");
  const [shift, setShift] = React.useState<(typeof SHIFTS)[number] | null>(null);
  const shifts = SHIFTS.filter((s) => s.day === Number(day));
  const byShop = ["Kemang", "Senopati", "Dago"].map((shop) => ({ shop, list: shifts.filter((s) => s.shop === shop) }));
  return (
    <>
      <MobileScreen
        title="Schedule"
        large={false}
        back={back}
        bottomInset="none"
        header={
          <div className="pt-1">
            <MobileFilterChips aria-label="Day" value={day} onValueChange={setDay} options={DAY.map((d, i) => ({ value: String(i), label: `${d} ${weekDay(i).getDate()}` }))} />
          </div>
        }
      >
        <div className="grid gap-5">
          {byShop.map(({ shop, list }) => (
            <MobileList key={shop} title={`${shop} · ${list.length ? `${list.length} on shift` : "closed"}`}>
              {list.length ? (
                list.map((s) => <MobilePersonRow key={s.id} name={s.who} subtitle={`${s.from} – ${s.to}`} chevron onClick={() => setShift(s)} />)
              ) : (
                <MobileListRow media={<MapPin />} title="Nobody on shift" />
              )}
            </MobileList>
          ))}
        </div>
      </MobileScreen>
      <MobileActionSheet
        open={!!shift}
        onOpenChange={(o) => !o && setShift(null)}
        title={shift ? `${shift.who}, ${DAY[shift.day]} ${shift.from} – ${shift.to}` : undefined}
        actions={[
          { label: "Swap with someone", icon: Repeat, onSelect: () => nav.snack("Swap request sent") },
          { label: "Message", icon: MessageCircle, onSelect: () => nav.snack(`Message to ${shift?.who.split(" ")[0]}`) },
          { label: "Remove from shift", icon: X, destructive: true, onSelect: () => nav.snack("Removed from the shift") },
        ]}
      />
    </>
  );
}

/* ------------------------------------------------------------ Settings */

export function SettingsScreen({ back }: ScreenProps) {
  const [alerts, setAlerts] = React.useState({ orders: true, stock: true, payouts: false, chats: true });
  const [lowAt, setLowAt] = React.useState(3);
  const [receipts, setReceipts] = React.useState<"auto" | "ask" | "never">("ask");
  const [sheet, setSheet] = React.useState<"courier" | "lang" | "shops" | null>(null);
  const [courier, setCourier] = React.useState("jne");
  const [lang, setLang] = React.useState("EN");
  const [shops, setShops] = React.useState(["Kemang", "Senopati", "Dago"]);
  const sw = (k: keyof typeof alerts) => (v: boolean) => setAlerts((a) => ({ ...a, [k]: v }));
  return (
    <>
      <MobileScreen title="Settings" large={false} back={back} bottomInset="none">
        <div className="grid gap-5 pt-2">
          <MobileList title="Notify me about">
            <MobileSwitchRow icon={ShoppingBag} title="New orders" checked={alerts.orders} onCheckedChange={sw("orders")} />
            <MobileSwitchRow icon={Package} title="Low stock" checked={alerts.stock} onCheckedChange={sw("stock")} />
            <MobileSwitchRow icon={CreditCard} title="Payouts" checked={alerts.payouts} onCheckedChange={sw("payouts")} />
            <MobileSwitchRow icon={MessageCircle} title="Buyer chats" checked={alerts.chats} onCheckedChange={sw("chats")} />
          </MobileList>
          <div className="grid gap-1.5 px-pad">
            <h2 className="px-1 text-[13px] text-ink-muted">Low stock</h2>
            <div className="rounded-card bg-surface px-pad pb-2 pt-3">
              <MobileSlider label="Warn me at" value={lowAt} onValueChange={setLowAt} min={1} max={20} format={(v) => `${v} left`} />
            </div>
          </div>
          <div className="grid gap-1.5 px-pad">
            <h2 className="px-1 text-[13px] text-ink-muted">Receipts</h2>
            <div className="rounded-card bg-surface p-nest">
              <MobileRadioList
                aria-label="Receipts"
                value={receipts}
                onValueChange={setReceipts}
                options={[
                  { value: "auto", title: "Print every receipt", icon: Printer },
                  { value: "ask", title: "Ask each time", icon: RefreshCw },
                  { value: "never", title: "Don’t print", icon: X },
                ]}
              />
            </div>
          </div>
          <MobileList title="This phone">
            <MobileListRow media={<Truck />} title="Default courier" value={COURIERS.find((c) => c.id === courier)?.name} chevron onClick={() => setSheet("courier")} />
            <MobileListRow media={<MapPin />} title="Shops" value={`${shops.length} shops`} chevron onClick={() => setSheet("shops")} />
            <MobileListRow
              media={<Globe />}
              title="Language"
              value={
                <span className="flex items-center gap-2">
                  <Flag code={lang.toLowerCase()} className="size-[18px]" />
                  {lang}
                </span>
              }
              chevron
              onClick={() => setSheet("lang")}
            />
          </MobileList>
        </div>
      </MobileScreen>
      <MobilePickerSheet open={sheet === "courier"} onOpenChange={(o) => setSheet(o ? "courier" : null)} title="Default courier" value={courier} onValueChange={setCourier} options={COURIERS.map((c) => ({ value: c.id, label: c.name, detail: c.eta, meta: formatRp(c.price), icon: Truck }))} />
      <MobilePickerSheet open={sheet === "lang"} onOpenChange={(o) => setSheet(o ? "lang" : null)} title="Language" value={lang} onValueChange={setLang} options={["EN", "ID", "CN"].map((l) => ({ value: l, label: l, icon: () => <Flag code={l.toLowerCase()} className="size-[20px]" /> }))} />
      <MobileMultiSelectSheet open={sheet === "shops"} onOpenChange={(o) => setSheet(o ? "shops" : null)} title="Shops" value={shops} onValueChange={setShops} options={SHOPS.map((s) => ({ value: s, label: s, icon: MapPin }))} />
    </>
  );
}

/* ------------------------------------------------------------ Account */

export function AccountScreen({ back }: ScreenProps) {
  const [twoStep, setTwoStep] = React.useState(true);
  const [out, setOut] = React.useState(false);
  return (
    <>
      <MobileScreen title="Account" large={false} back={back} bottomInset="none">
        <div className="grid gap-5 pt-2">
          <MobileList>
            <MobilePersonRow name="Rizky Hartono" subtitle="Owner · Rimba" />
          </MobileList>
          <MobileList title="Contact">
            <MobileListRow media={<Phone />} title="+62 812 4410 2231" />
            <MobileListRow media={<Mail />} title="rizky@rimba.example" />
          </MobileList>
          <MobileList title="Security">
            <MobileSwitchRow icon={Shield} title="Code by WhatsApp at sign in" checked={twoStep} onCheckedChange={setTwoStep} />
          </MobileList>
          <MobileList title="Signed in on">
            <MobileListRow media={<Smartphone />} title="This phone" value="Now" />
            <MobileListRow media={<Smartphone />} title="Kemang till" value="Today, 09:02" />
            <MobileListRow media={<Smartphone />} title="Senopati till" value="Yesterday" />
          </MobileList>
          <MobileList>
            <MobileListRow media={<LogOut />} title="Sign out" onClick={() => setOut(true)} />
          </MobileList>
        </div>
      </MobileScreen>
      <SignOutAlert open={out} onOpenChange={setOut} />
    </>
  );
}

/* ------------------------------------------------------------ Sign in and one-time code */

export function LoginScreen() {
  const nav = useNav();
  const [phone, setPhone] = React.useState("812 4410 2231");
  const [error, setError] = React.useState("");
  const submit = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) return setError("Enter the whole number");
    setError("");
    nav.push("otp", { phone: `+62 ${phone}` });
  };
  return (
    <>
      <MobileScreen title="" large={false} bottomInset="action-bar">
        <form
          className="grid gap-8 px-pad pt-10"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="text-center text-[28px] font-semibold tracking-tight">Rimba</p>
          <MobileTextField
            label="Phone number"
            prefix="+62"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phone}
            onValueChange={(v) => (setPhone(v), error && setError(""))}
            error={error}
            enterKeyHint="send"
          />
        </form>
      </MobileScreen>
      <MobileActionBar>
        <Button variant="primary" onClick={submit}>
          Send code
        </Button>
      </MobileActionBar>
    </>
  );
}

const CODE = "246810";

export function OtpScreen({ params, back }: ScreenProps) {
  const nav = useNav();
  const [code, setCode] = React.useState("");
  const [status, setStatus] = React.useState<InputOTPStatus>("idle");
  const [wait, setWait] = React.useState(30);
  const [banner, setBanner] = React.useState(false);
  // The message drops in like a phone notification and goes again after a while, as one would.
  React.useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(false), 8000);
    return () => window.clearTimeout(t);
  }, [banner]);
  React.useEffect(() => {
    const t = window.setTimeout(() => setBanner(true), 900);
    return () => window.clearTimeout(t);
  }, []);
  React.useEffect(() => {
    if (!wait) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);
  const check = (v: string) => {
    setStatus("checking");
    window.setTimeout(() => {
      if (v === CODE) {
        setStatus("success");
        // The green boxes and the status line already said it: no "Signed in" snack on top.
        window.setTimeout(() => nav.cover(null), otpLanded("join") + 500);
      } else {
        setStatus("invalid");
        window.setTimeout(() => (setCode(""), setStatus("idle")), 1000);
      }
    }, 700);
  };
  return (
    <MobileScreen title="" large={false} back={back} bottomInset="none">
      {/* The message as the phone would show it: tap it to fill the code (what autofill does on a real phone). */}
      <button
        type="button"
        onClick={() => {
          setBanner(false);
          setCode(CODE);
          check(CODE);
        }}
        className={cn(
          "absolute inset-x-2 z-30 flex min-h-touch cursor-pointer items-center gap-3 rounded-sheet bg-raised p-3 text-left shadow-dialog transition-[transform,opacity] duration-[300ms] ease-ad",
          banner ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-[140%] opacity-0",
        )}
        style={{ top: `calc(${SAFE_TOP} + 4px)` }}
        tabIndex={banner ? 0 : -1}
      >
        <span className="grid size-[36px] shrink-0 place-items-center rounded-control bg-fill">
          <MessageCircle size={20} strokeWidth={1.75} />
        </span>
        <span className="grid min-w-0">
          <span className="text-[13px] text-ink-muted">WhatsApp · now</span>
          <span className="truncate text-[15px]">Your Rimba code is {CODE}</span>
        </span>
      </button>
      <div className="grid justify-items-center gap-6 px-pad pt-10 text-center">
        <div className="grid gap-1.5">
          <h1 className="text-balance text-[22px] font-semibold">Enter the code</h1>
          <p className="text-[15px] text-ink-muted">Sent by WhatsApp to {params.phone ?? "+62 812 4410 2231"}</p>
        </div>
        <InputOTP
          size="touch"
          aria-label="Code"
          value={code}
          onValueChange={setCode}
          status={status}
          onComplete={check}
        />
        <p role="status" className="h-[22px] text-[15px] text-ink-muted">
          {status === "invalid" ? "Wrong code, try again" : status === "success" ? "Signed in" : ""}
        </p>
        <Button className="h-touch px-4 text-[15px]" disabled={wait > 0} onClick={() => (setWait(30), setBanner(true))}>
          {wait ? `Send again in 0:${String(wait).padStart(2, "0")}` : "Send again"}
        </Button>
      </div>
    </MobileScreen>
  );
}

/* ------------------------------------------------------------ Welcome */

const art = "pointer-events-none grid gap-2 rounded-sheet bg-surface p-3 shadow-dialog";

export function OnboardingScreen() {
  const nav = useNav();
  return (
    <MobileOnboardingPager
      onDone={() => nav.cover(null)}
      pages={[
        {
          key: "sales",
          title: "Every shop’s sales, live",
          art: (
            <div className={art}>
              <MobileScrubChart kind="bars" label="Sales today" value="Rp 59,5 jt" data={HOURLY.map((h) => ({ label: h.label, value: h.value }))} current={HOURLY.length - 1} height={90} />
            </div>
          ),
        },
        {
          key: "orders",
          title: "Pack every marketplace from one list",
          art: (
            <div className={cn(art, "gap-0 p-1.5")}>
              {ORDERS.filter((o) => o.status === "Paid")
                .slice(0, 3)
                .map((o) => {
                  const p = PRODUCTS.find((x) => o.items.startsWith(x.name));
                  return (
                    <div key={o.id} className="flex items-center gap-3 rounded-item px-2 py-2">
                      <Thumb src={p ? productPhoto(p.sku) : undefined} alt="" size={36} />
                      <span className="grid min-w-0 flex-1 text-left">
                        <span className="truncate text-[15px]">{o.customer}</span>
                        <span className="truncate text-[13px] text-ink-muted">{o.items}</span>
                      </span>
                    </div>
                  );
                })}
            </div>
          ),
        },
        {
          key: "stock",
          title: "Count stock with the camera",
          art: (
            <div className="grid grid-cols-2 gap-gap">
              <MobileStatTile label="Counted" value="48" />
              <MobileStatTile label="Differences" value="2" />
            </div>
          ),
        },
        {
          key: "chats",
          title: "Every buyer chat in one inbox",
          art: (
            <div className="grid gap-1.5">
              <p className="w-fit max-w-[85%] rounded-card bg-surface px-3.5 py-2 text-left text-[15px] shadow-card">Can you wrap it as a gift?</p>
              <p className="ml-auto w-fit max-w-[85%] rounded-card bg-on px-3.5 py-2 text-left text-[15px] text-on-ink">Yes, it ships today.</p>
            </div>
          ),
        },
      ]}
    />
  );
}

