// The Mobile example app: an invented ERP phone app for Rimba (orders, products, stock, POS, chats, approvals), built
// only from the library's mobile components and shared parts at their touch size. Five tabs, each with its own stack
// of screens that push in from the right and slide back out, plus full-screen flows (sign in, welcome) over the tabs.
// Every screen is in SCREENS with the components it is made of, so /mobile/app/<screen> opens it directly and the
// /mobile/screens gallery can list them all.
import * as React from "react";
import { Home, Inbox as InboxIcon, Menu, Package, ShoppingBag } from "react-feather";
import { MobileTabBar, MobileTab } from "@/components/mobile/mobile-tab-bar";
import { MobileSnackbar } from "@/components/mobile/mobile-snackbar";
import { cn } from "@/lib/ad";
import { usePressFeedback } from "./phone";
import { NavContext, type Nav, type Params, type ScreenProps, type TabId } from "./mobile-app-kit";
import { HomeScreen, NotificationsScreen, SearchScreen, ReportsScreen, OrdersScreen, OrderScreen, DeliveryScreen, OrdersProvider, useOrders } from "./mobile-screens-a";
import { ProductsScreen, ProductScreen, StockCountScreen, CustomersScreen, CustomerScreen, InboxScreen, ChatScreen, AssistantScreen, ProductsProvider } from "./mobile-screens-b";
import { MoreScreen, PosScreen, PosPayScreen, PosReceiptScreen, ApprovalsScreen, ScheduleScreen, SettingsScreen, AccountScreen, LoginScreen, OtpScreen, OnboardingScreen } from "./mobile-screens-c";
import { CHATS, CUSTOMERS } from "./mobile-data";
import { PRODUCTS } from "./data";

export { COURIERS, CourierPicker } from "./mobile-app-kit";

interface ScreenDef {
  id: string;
  /** The nav title, also the next screen's back label. */
  title: string | ((p: Params) => string);
  /** The tab it lives under; null for full-screen flows over the tabs. */
  tab: TabId | null;
  /** The screen it is pushed from (to rebuild the stack when opened directly). */
  parent?: string;
  Component: (p: ScreenProps) => React.ReactNode;
  /** The library items it is built from (the gallery links them). */
  parts: string[];
  /** Forced states worth their own gallery tile. */
  states?: { key: string; title: string }[];
  /** It shows a floating button above the tab bar (a snack then sits above that). */
  fab?: boolean;
}

const L = ["mobile-nav-bar", "mobile-list"];
export const SCREENS: ScreenDef[] = [
  { id: "home", title: "Home", tab: "home", fab: true, Component: HomeScreen, parts: ["mobile-tab-bar", ...L, "mobile-scrub-chart", "mobile-stat-tiles", "mobile-action-bar", "mobile-badge", "mobile-banner"], states: [{ key: "offline", title: "Home, offline" }] },
  { id: "notifications", title: "Notifications", tab: "home", parent: "home", Component: NotificationsScreen, parts: [...L, "mobile-swipe-row", "mobile-snackbar", "mobile-empty-state"], states: [{ key: "empty", title: "Notifications, all cleared" }] },
  { id: "search", title: "Search", tab: "home", parent: "home", Component: SearchScreen, parts: [...L, "mobile-search-bar", "mobile-empty-state"], states: [{ key: "empty", title: "Search, no results" }] },
  { id: "reports", title: "Reports", tab: "home", parent: "home", Component: ReportsScreen, parts: [...L, "mobile-filter-chips", "mobile-date-range", "mobile-scrub-chart", "mobile-stat-tiles"], states: [{ key: "error", title: "Reports, failed to load" }] },
  { id: "orders", title: "Orders", tab: "orders", Component: OrdersScreen, parts: ["mobile-tab-bar", ...L, "mobile-search-bar", "mobile-segmented", "mobile-swipe-row", "mobile-context-menu", "mobile-pull-refresh", "mobile-list-skeleton"] },
  { id: "order", title: (p) => p.id ?? "Order", tab: "orders", parent: "orders", Component: OrderScreen, parts: [...L, "mobile-steps", "mobile-timeline", "mobile-stepper", "mobile-action-bar", "mobile-action-sheet", "mobile-sheet", "mobile-date-picker"] },
  { id: "delivery", title: "Proof of delivery", tab: "orders", parent: "order", Component: DeliveryScreen, parts: [...L, "mobile-photo-picker", "mobile-text-field", "mobile-signature", "mobile-action-bar"] },
  { id: "products", title: "Products", tab: "products", fab: true, Component: ProductsScreen, parts: ["mobile-tab-bar", ...L, "mobile-search-bar", "mobile-filter-chips", "mobile-list-skeleton", "mobile-action-bar", "mobile-modal"] },
  { id: "product", title: (p) => PRODUCTS.find((x) => x.sku === p.sku)?.name ?? "Product", tab: "products", parent: "products", Component: ProductScreen, parts: [...L, "mobile-kpi-carousel", "mobile-stat-tiles", "mobile-scrub-chart", "mobile-action-bar"] },
  {
    id: "product-edit",
    title: "Edit product",
    tab: "products",
    parent: "products",
    Component: (p) => <ProductScreen {...p} params={{ ...p.params, edit: "1" }} />,
    parts: ["mobile-modal", "mobile-photo-picker", "mobile-text-field", "mobile-keypad", "mobile-stepper", "mobile-picker-sheet", "mobile-multi-select", "mobile-choice-rows", "mobile-slider", "mobile-alert"],
  },
  { id: "stock-count", title: "Stock count", tab: "products", parent: "products", Component: StockCountScreen, parts: [...L, "mobile-scanner", "mobile-text-field", "mobile-stepper", "mobile-action-bar", "mobile-alert"] },
  { id: "inbox", title: "Inbox", tab: "inbox", Component: InboxScreen, parts: ["mobile-tab-bar", ...L, "mobile-top-tabs", "mobile-person-row", "mobile-badge", "mobile-context-menu"] },
  { id: "chat", title: (p) => CHATS.find((c) => c.id === p.id)?.name ?? "Chat", tab: "inbox", parent: "inbox", Component: ChatScreen, parts: ["mobile-nav-bar", "mobile-chat", "mobile-action-sheet"] },
  { id: "assistant", title: "Assistant", tab: "inbox", parent: "inbox", Component: AssistantScreen, parts: ["mobile-nav-bar", "mobile-chat", ...L, "mobile-sheet"] },
  { id: "more", title: "More", tab: "more", Component: MoreScreen, parts: ["mobile-tab-bar", ...L, "mobile-person-row", "mobile-badge", "mobile-alert"] },
  { id: "customers", title: "Customers", tab: "more", parent: "more", Component: CustomersScreen, parts: ["mobile-nav-bar", "mobile-search-bar", "mobile-index-list", "mobile-person-row"] },
  { id: "customer", title: (p) => CUSTOMERS.find((c) => c.id === p.id)?.name ?? CUSTOMERS[25].name, tab: "more", parent: "customers", Component: CustomerScreen, parts: [...L, "mobile-stat-tiles"] },
  { id: "pos", title: "New sale", tab: "more", parent: "more", Component: PosScreen, parts: [...L, "mobile-search-bar", "mobile-filter-chips", "mobile-stepper", "mobile-action-bar"] },
  { id: "pos-pay", title: "Payment", tab: "more", parent: "pos", Component: PosPayScreen, parts: ["mobile-nav-bar", "mobile-segmented", "mobile-keypad", "mobile-action-bar"] },
  { id: "pos-receipt", title: "Receipt", tab: "more", parent: "pos", Component: PosReceiptScreen, parts: ["mobile-nav-bar", "mobile-receipt", "mobile-action-bar"] },
  { id: "approvals", title: "Approvals", tab: "more", parent: "more", Component: ApprovalsScreen, parts: ["mobile-nav-bar", "mobile-filter-chips", "mobile-swipe-row", "mobile-snackbar", "mobile-empty-state"], states: [{ key: "empty", title: "Approvals, all done" }] },
  { id: "schedule", title: "Schedule", tab: "more", parent: "more", Component: ScheduleScreen, parts: [...L, "mobile-filter-chips", "mobile-person-row", "mobile-action-sheet"] },
  { id: "settings", title: "Settings", tab: "more", parent: "more", Component: SettingsScreen, parts: [...L, "mobile-choice-rows", "mobile-slider", "mobile-picker-sheet", "mobile-multi-select"] },
  { id: "account", title: "Account", tab: "more", parent: "more", Component: AccountScreen, parts: [...L, "mobile-person-row", "mobile-choice-rows", "mobile-alert"] },
  { id: "login", title: "Sign in", tab: null, Component: LoginScreen, parts: ["mobile-nav-bar", "mobile-text-field", "mobile-action-bar"] },
  { id: "otp", title: "Code", tab: null, parent: "login", Component: OtpScreen, parts: ["mobile-nav-bar", "mobile-otp"] },
  { id: "onboarding", title: "Welcome", tab: null, Component: OnboardingScreen, parts: ["mobile-onboarding", "mobile-scrub-chart", "mobile-stat-tiles"] },
];
export const findScreen = (id: string) => SCREENS.find((s) => s.id === id);
const titleOf = (e: Entry) => {
  const t = findScreen(e.id)?.title ?? "";
  return typeof t === "function" ? t(e.params) : t;
};

const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Package },
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "more", label: "More", icon: Menu },
];

interface Entry {
  key: number;
  id: string;
  params: Params;
  /**
   * in: slides in from the right. out: slides back out, then goes. still: placed without motion. fade: fades in over
   * the screen it replaces. gone: that replaced screen, kept still under the fade until it lands, so nothing behind it
   * shows through.
   */
  phase: "in" | "out" | "still" | "fade" | "gone";
}
interface State {
  tab: TabId;
  stacks: Record<TabId, Entry[]>;
  visited: TabId[];
  cover: Entry[] | null;
  coverPhase: "in" | "out" | "still";
}

let keys = 0;
const entry = (id: string, params: Params = {}, phase: Entry["phase"] = "in"): Entry => ({ key: ++keys, id, params, phase });
/** The chain of screens from the tab's root (or the flow's first screen) to `id`. */
function chain(id: string, params: Params): Entry[] {
  const out: Entry[] = [];
  let d = findScreen(id);
  while (d) {
    // Parents get the same params (an order's id names the order screen under its proof of delivery).
    out.unshift(entry(d.id, params, "still"));
    d = d.parent ? findScreen(d.parent) : undefined;
  }
  return out;
}
const roots = (): Record<TabId, Entry[]> => ({ home: [entry("home", {}, "still")], orders: [entry("orders", {}, "still")], products: [entry("products", {}, "still")], inbox: [entry("inbox", {}, "still")], more: [entry("more", {}, "still")] });

function initial(screen: string, params: Params): State {
  const d = findScreen(screen) ?? findScreen("home")!;
  const stacks = roots();
  if (!d.tab) return { tab: "home", stacks, visited: ["home"], cover: chain(d.id, params), coverPhase: "still" };
  stacks[d.tab] = chain(d.id, params);
  return { tab: d.tab, stacks, visited: [d.tab], cover: null, coverPhase: "still" };
}

const EASE = "var(--ad-ease-page)";
const moving = (e: Entry) => e.phase !== "still";

/** A stack of screens: the top one on top, the one under it shifted left (a real page change), deeper ones hidden. */
function Stack({ entries, nav, state, onDone }: { entries: Entry[]; nav: Nav; state?: string; onDone: (key: number) => void }) {
  const live = entries.filter((e) => e.phase !== "out" && e.phase !== "gone");
  const top = live[live.length - 1];
  return (
    <>
      {entries.map((e, i) => {
        const def = findScreen(e.id)!;
        const li = live.indexOf(e);
        const under = li >= 0 && li < live.length - 1;
        const deep = li >= 0 && li < live.length - 2;
        // The screen it goes back to (not the one a replace left fading out under it).
        const prev = entries.slice(0, i).filter((x) => x.phase !== "gone").at(-1);
        return (
          <div
            key={e.key}
            data-app-screen={e.id}
            aria-hidden={e !== top || undefined}
            inert={e !== top || undefined}
            className="absolute inset-0 overflow-hidden bg-page"
            style={{
              zIndex: 10 + i,
              visibility: deep ? "hidden" : undefined,
              transform: under ? "translateX(-28%)" : undefined,
              transition: `transform 300ms ${EASE}`,
              boxShadow: i > 0 ? "var(--ad-shadow-dialog)" : undefined,
              animation: e.phase === "in" ? `ad-push-in 300ms ${EASE}` : e.phase === "out" ? `ad-push-out 260ms ${EASE} forwards` : e.phase === "fade" ? "ad-fade-in 200ms var(--ad-ease)" : undefined,
            }}
            onAnimationEnd={(ev) => ev.target === ev.currentTarget && moving(e) && onDone(e.key)}
          >
            <def.Component params={e.params} state={e === top ? state : undefined} back={prev ? { label: titleOf(prev), onClick: () => nav.pop() } : undefined} />
          </div>
        );
      })}
    </>
  );
}

interface MobileAppProps {
  /** The screen to open on (an id from SCREENS); its parents are stacked under it. Default "home". */
  screen?: string;
  params?: Params;
  /** A forced state for the opening screen ("empty", "offline", "error"). */
  state?: string;
  /**
   * The app owns the page (/mobile/app): the document title follows the top screen, and each screen deeper than a tab's
   * root is a history step, so the browser's back, Android's back and the iOS edge swipe go back one screen.
   */
  page?: boolean;
}

/** The whole app. Mount it inside a PhoneFrame (docs) or full screen (/mobile/app on a phone). */
export function MobileApp(props: MobileAppProps) {
  // Touch press states (data-pressed); PhoneFrame installs it too, but full screen on a phone there is no frame.
  usePressFeedback();
  return (
    <OrdersProvider>
      <ProductsProvider>
        <AppShell {...props} />
      </ProductsProvider>
    </OrdersProvider>
  );
}

function AppShell({ screen = "home", params = {}, state, page = false }: MobileAppProps) {
  const [s, setS] = React.useState<State>(() => initial(screen, params));
  const [snack, setSnack] = React.useState<{ text: string; undo?: () => void; n: number } | null>(null);
  const [forced, setForced] = React.useState(state);
  const { orders } = useOrders();
  const nav = React.useMemo<Nav>(() => {
    const edit = (fn: (list: Entry[]) => Entry[]) =>
      setS((st) => (st.cover ? { ...st, cover: fn(st.cover) } : { ...st, stacks: { ...st.stacks, [st.tab]: fn(st.stacks[st.tab]) } }));
    return {
      push: (id, p) => (setForced(undefined), edit((l) => [...l, entry(id, p)])),
      pop: (n = 1) =>
        edit((l) => {
          const live = l.filter((e) => e.phase !== "out");
          const k = Math.min(n, live.length - 1);
          if (k < 1) return l;
          const top = live[live.length - 1];
          // The top slides out; the ones between it and the landing screen leave at once, under it.
          const skip = new Set(live.slice(live.length - k, live.length - 1));
          return l.filter((e) => !skip.has(e)).map((e) => (e === top ? { ...e, phase: "out" } : e));
        }),
      replace: (id, p) => edit((l) => [...l.slice(0, -1).filter((e) => e.phase !== "gone"), { ...l[l.length - 1], phase: "gone" }, entry(id, p, "fade")]),
      setTab: (tab) => setS((st) => ({ ...st, tab, visited: st.visited.includes(tab) ? st.visited : [...st.visited, tab], cover: null })),
      cover: (id, p) => {
        setForced(undefined);
        setS((st) => (id ? { ...st, cover: [entry(id, p, "still")], coverPhase: "in" } : st.cover ? { ...st, coverPhase: "out" } : st));
      },
      snack: (text, undo) => setSnack({ text, undo, n: Date.now() }),
    };
  }, []);
  // A screen's motion ended: one that slid out goes, one that slid or faded in is placed (and the screen it replaced
  // goes with it).
  const settle = (list: Entry[], key: number) => {
    const e = list.find((x) => x.key === key);
    if (!e) return list;
    if (e.phase === "out") return list.filter((x) => x.key !== key);
    return list.filter((x) => x.phase !== "gone" || e.phase !== "fade").map((x) => (x.key === key ? { ...x, phase: "still" as const } : x));
  };
  const drop = (key: number) =>
    setS((st) => (st.cover?.some((e) => e.key === key) ? { ...st, cover: settle(st.cover, key) } : { ...st, stacks: { ...st.stacks, [st.tab]: settle(st.stacks[st.tab], key) } }));
  const depth = s.stacks[s.tab].filter((e) => e.phase !== "out" && e.phase !== "gone").length;
  const bar = depth === 1 && !s.cover;
  // While any screen is moving, taps are ignored (as iOS does): a double tap on Back would otherwise pop two screens,
  // and one on Take cash would land on the receipt's New sale before the receipt was seen.
  const busy = s.stacks[s.tab].some(moving) || !!s.cover?.some(moving) || s.coverPhase !== "still";
  // If an animation never reports its end (a tab hidden mid-push), place everything after the longest motion.
  React.useEffect(() => {
    if (!busy) return;
    const t = window.setTimeout(() => {
      const fix = (l: Entry[]) => l.filter((e) => e.phase !== "out" && e.phase !== "gone").map((e) => (e.phase === "still" ? e : { ...e, phase: "still" as const }));
      setS((st) => ({ ...st, stacks: { ...st.stacks, [st.tab]: fix(st.stacks[st.tab]) }, cover: st.coverPhase === "out" ? null : st.cover && fix(st.cover), coverPhase: "still" }));
    }, 600);
    return () => window.clearTimeout(t);
  }, [busy]);
  const top = (s.cover ?? s.stacks[s.tab]).filter((e) => e.phase !== "out" && e.phase !== "gone").at(-1);
  const deep = depth > 1 || !!s.cover;
  // Page mode: the title names the top screen, and one history step stands for "deeper than the root", re-armed after
  // each system back while there is still somewhere to go back to.
  const title = top ? titleOf(top) : "";
  React.useEffect(() => {
    if (page) document.title = `${title ? `${title} · ` : ""}Mobile app · Alora Design`;
  }, [page, title]);
  const armed = React.useRef(false);
  const expect = React.useRef(false);
  const back = React.useRef(() => {});
  back.current = () => {
    if (s.cover && s.cover.filter((e) => e.phase !== "out").length > 1) nav.pop();
    else if (s.cover) nav.cover(null);
    else nav.pop();
  };
  React.useEffect(() => {
    if (!page) return;
    if (deep && !armed.current) {
      history.pushState({ ...history.state, adBack: true }, "");
      armed.current = true;
    } else if (!deep && armed.current) {
      // Back at the root by the app's own Back or Done: take the step off so the next system back leaves the app.
      armed.current = false;
      expect.current = true;
      history.back();
    }
  }, [page, deep]);
  React.useEffect(() => {
    if (!page) return;
    const on = () => {
      if (expect.current) return void (expect.current = false);
      if (!armed.current) return;
      armed.current = false;
      back.current();
    };
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, [page]);
  const toPack = orders.filter((o) => o.status === "Paid").length;
  // A new snack replaces the old one (fresh timer); closing keeps the same element so it can slide out.
  const snackKey = React.useRef(0);
  if (snack) snackKey.current = snack.n;
  return (
    <NavContext.Provider value={nav}>
      <div data-mobile-app-shell className="relative h-full overflow-hidden bg-page" style={busy ? { pointerEvents: "none" } : undefined}>
        <style href="ad-mobile-push" precedence="default">{`@keyframes ad-push-in { from { transform: translateX(100%); } } @keyframes ad-push-out { to { transform: translateX(100%); } } @keyframes ad-cover-in { from { transform: translateY(100%); } } @keyframes ad-cover-out { to { transform: translateY(100%); } } @media (prefers-reduced-motion: reduce) { [data-app-screen], [data-app-cover] { animation-name: ad-fade-in !important; transition: none !important; } }`}</style>
        {s.visited.map((t) => (
          <div key={t} className="absolute inset-0" style={{ visibility: t === s.tab ? undefined : "hidden" }} inert={t !== s.tab || !!s.cover || undefined}>
            <Stack entries={s.stacks[t]} nav={nav} state={t === s.tab && !s.cover ? forced : undefined} onDone={drop} />
          </div>
        ))}
        {/* The tab bar leaves with a push and returns after the pop; under reduced motion it only fades. */}
        <div
          className={cn("transition-[translate,opacity] duration-[260ms] ease-ad motion-reduce:transition-opacity", !bar && "translate-y-[120px] opacity-0 motion-reduce:translate-y-0")}
          inert={!bar || undefined}
          aria-hidden={!bar || undefined}
        >
          <MobileTabBar>
            {TABS.map((t) => (
              <MobileTab key={t.id} icon={t.icon} label={t.label} badge={t.id === "orders" ? toPack : t.id === "inbox" ? CHATS.filter((c) => c.unread).length : undefined} active={s.tab === t.id} onClick={() => nav.setTab(t.id)} />
            ))}
          </MobileTabBar>
        </div>
        {s.cover ? (
          <div
            data-app-cover
            className="absolute inset-0 z-[60] bg-page"
            style={{ animation: s.coverPhase === "in" ? `ad-cover-in 300ms ${EASE}` : s.coverPhase === "out" ? `ad-cover-out 260ms ${EASE} forwards` : undefined }}
            onAnimationEnd={(ev) => ev.target === ev.currentTarget && s.coverPhase !== "still" && setS((st) => ({ ...st, cover: st.coverPhase === "out" ? null : st.cover, coverPhase: "still" }))}
          >
            <Stack entries={s.cover} nav={nav} state={forced} onDone={drop} />
          </div>
        ) : null}
        <MobileSnackbar
          key={snackKey.current}
          open={!!snack}
          above={bar ? (top && findScreen(top.id)?.fab ? "tab-bar-fab" : "tab-bar") : "action-bar"}
          onOpenChange={(o) => !o && setSnack(null)}
          message={snack?.text}
          action={snack?.undo ? { label: "Undo", onClick: snack.undo } : undefined}
        />
      </div>
    </NavContext.Provider>
  );
}
