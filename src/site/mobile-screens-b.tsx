// Example app screens, part B: Products, Product (+ edit), Stock count, Customers, Customer, Inbox, Chat, Assistant.
import * as React from "react";
import { Box, Camera, ChevronRight, Edit2, FileText, Mail, MapPin, Package, Phone, Search as SearchIcon, ShoppingBag, Tag, Zap, Maximize, Check, Image as ImageIcon, Grid } from "react-feather";
import { formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumb } from "@/components/ui/thumb";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { StreamingText } from "@/components/ui/streaming-text";
import { ProposedChange } from "@/components/ui/proposed-change";
import { MobileScreen, MobileBarButton } from "@/components/mobile/mobile-nav-bar";
import { MobileList, MobileListRow, MobileListSkeleton } from "@/components/mobile/mobile-list";
import { MobileSearchBar } from "@/components/mobile/mobile-search-bar";
import { MobileSheet } from "@/components/mobile/mobile-sheet";
import { MobileActionSheet } from "@/components/mobile/mobile-action-sheet";
import { MobileActionBar } from "@/components/mobile/mobile-action-bar";
import { MobileScrubChart } from "@/components/mobile/mobile-scrub-chart";
import { MobileKpiCarousel, MobileStatGrid, MobileStatTile } from "@/components/mobile/mobile-stats";
import { MobileFilterChips } from "@/components/mobile/mobile-chip-row";
import { MobileModal } from "@/components/mobile/mobile-modal";
import { MobileAlert } from "@/components/mobile/mobile-alert";
import { MobileTextField } from "@/components/mobile/mobile-text-field";
import { MobileAmountSheet } from "@/components/mobile/mobile-keypad";
import { MobilePhotoSheet, MobilePhotoStrip, type Photo } from "@/components/mobile/mobile-photo-picker";
import { MobilePickerSheet, MobileMultiSelectSheet } from "@/components/mobile/mobile-picker-sheet";
import { MobileSwitchRow } from "@/components/mobile/mobile-choice-rows";
import { MobileSlider } from "@/components/mobile/mobile-slider";
import { MobileScanner } from "@/components/mobile/mobile-scanner";
import { MobileIndexedList } from "@/components/mobile/mobile-index-scrubber";
import { MobilePersonRow } from "@/components/mobile/mobile-person-row";
import { MobileTopTabs, MobileTabPager } from "@/components/mobile/mobile-top-tabs";
import { MobileContextMenu } from "@/components/mobile/mobile-context-menu";
import { MobileChatThread, MobileComposer, type MobileChatMessage } from "@/components/mobile/mobile-chat";
import { DAILY, ORDERS, PRODUCTS, SHOPS, smartTime } from "./data";
import { CAMERA_ROLL, CHATS, CUSTOMERS, productPhoto, type Chat } from "./mobile-data";
import { short, useNav, type ScreenProps } from "./mobile-app-kit";
import { OrderThumb } from "./mobile-screens-a";

type Product = (typeof PRODUCTS)[number];
const CATEGORIES = [
  { value: "cups", label: "Cups and mugs" },
  { value: "plates", label: "Plates and bowls" },
  { value: "baskets", label: "Baskets" },
  { value: "candles", label: "Candles" },
  { value: "linen", label: "Table linen" },
  { value: "decor", label: "Decor" },
];
const categoryOf = (p: Product) => ({ GL: "cups", PR: "plates", MB: "plates", KR: "baskets", NP: "baskets", LL: "candles", TP: "linen", TT: "linen", VS: "decor", SP: "cups" })[p.sku.split("-")[1]] ?? "decor";
const stockLabel = (n: number) => (n === 0 ? "Out of stock" : `${n} in stock`);

/** Stock and prices shared by the list, the detail and the editor. */
const ProductsStore = React.createContext<{ products: Product[]; update: (sku: string, patch: Partial<Product>) => void } | null>(null);
export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = React.useState(PRODUCTS);
  const update = React.useCallback((sku: string, patch: Partial<Product>) => setProducts((l) => l.map((p) => (p.sku === sku ? { ...p, ...patch } : p))), []);
  return <ProductsStore.Provider value={{ products, update }}>{children}</ProductsStore.Provider>;
}
const useProducts = () => React.useContext(ProductsStore)!;

/* ------------------------------------------------------------ Products */

export function ProductsScreen() {
  const nav = useNav();
  const { products } = useProducts();
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(t);
  }, []);
  const list = products.filter((p) => (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())) && (filter === "all" || (filter === "low" ? p.stock > 0 && p.stock <= 3 : p.stock === 0)));
  return (
    <MobileScreen
      title="Products"
      trailing={
        <MobileBarButton aria-label="Count stock" onClick={() => nav.push("stock-count")}>
          <Maximize />
        </MobileBarButton>
      }
      header={
        <>
          <MobileSearchBar value={q} onValueChange={setQ} placeholder="Name or SKU" />
          <MobileFilterChips
            aria-label="Stock"
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: "all", label: "All", count: products.length },
              { value: "low", label: "Low stock", count: products.filter((p) => p.stock > 0 && p.stock <= 3).length },
              { value: "out", label: "Out of stock", count: products.filter((p) => p.stock === 0).length },
            ]}
          />
        </>
      }
    >
      {loading ? (
        <MobileListSkeleton rows={8} />
      ) : list.length ? (
        <MobileList>
          {list.map((p) => (
            <MobileListRow key={p.sku} media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />} title={p.name} subtitle={stockLabel(p.stock)} value={short(p.price)} onClick={() => nav.push("product", { sku: p.sku })} />
          ))}
        </MobileList>
      ) : (
        <EmptyState icon={SearchIcon} title="No products match" className="py-20" />
      )}
    </MobileScreen>
  );
}

/* ------------------------------------------------------------ Product + edit */

export function ProductScreen({ params, back }: ScreenProps) {
  const nav = useNav();
  const { products } = useProducts();
  const p = products.find((x) => x.sku === params.sku) ?? products[0];
  const [edit, setEdit] = React.useState(params.edit === "1");
  const photos = [0, 1, 2].map((a) => productPhoto(p.sku, a));
  const days = DAILY.slice(-14).map((d, i) => ({ label: `${d.label} Nov`, value: Math.max(0, Math.round((d.value / 9) * (1 + ((i + p.price) % 3) * 0.2))), display: "" }));
  const sold = days.reduce((s, d) => s + d.value, 0);
  return (
    <>
      <MobileScreen title={p.name} back={back} bottomInset="action-bar">
        <div className="grid gap-5">
          <div className="px-pad">
            <MobileKpiCarousel aria-label="Photos">
              {photos.map((src, i) => (
                <img key={i} src={src} alt={`${p.name}, photo ${i + 1}`} draggable={false} className="aspect-square w-full rounded-card object-cover" />
              ))}
            </MobileKpiCarousel>
          </div>
          <div className="px-pad">
            <MobileStatGrid>
              <MobileStatTile label="Price" value={formatRp(p.price)} />
              <MobileStatTile label="In stock" value={p.stock} />
            </MobileStatGrid>
          </div>
          <div className="px-pad">
            <div className="rounded-card bg-surface p-pad shadow-card">
              <MobileScrubChart label="Sold per day" value={`${sold} pcs`} data={days.map((d) => ({ ...d, display: `${d.value} pcs` }))} height={80} labelEvery={7} />
            </div>
          </div>
          <MobileList title="Stock per shop">
            {SHOPS.slice(0, 3).map((s, i) => (
              <MobileListRow key={s} media={<MapPin />} title={s} value={Math.max(0, p.stock - i * 2)} />
            ))}
          </MobileList>
          <MobileList title="Details">
            <MobileListRow media={<Tag />} title="SKU" value={p.sku} />
            <MobileListRow media={<Grid />} title="Category" value={CATEGORIES.find((c) => c.value === categoryOf(p))?.label} />
          </MobileList>
        </div>
      </MobileScreen>
      <MobileActionBar>
        <Button onClick={() => nav.push("stock-count")}>
          <Maximize />
          Count
        </Button>
        <Button variant="primary" onClick={() => setEdit(true)}>
          <Edit2 />
          Edit product
        </Button>
      </MobileActionBar>
      <ProductEditor product={p} open={edit} onOpenChange={setEdit} />
    </>
  );
}

function ProductEditor({ product: p, open, onOpenChange }: { product: Product; open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useNav();
  const { update } = useProducts();
  const initial = React.useMemo(() => [0, 1].map((a) => ({ id: `${p.sku}-${a}`, src: productPhoto(p.sku, a), alt: `${p.name}, photo ${a + 1}` })), [p]);
  const [photos, setPhotos] = React.useState<Photo[]>(initial);
  const [roll, setRoll] = React.useState<Photo[]>(CAMERA_ROLL);
  const [name, setName] = React.useState(p.name);
  const [price, setPrice] = React.useState(p.price);
  const [stock, setStock] = React.useState(p.stock);
  const [category, setCategory] = React.useState(categoryOf(p));
  const [shops, setShops] = React.useState(["Kemang", "Senopati", "Shopee"]);
  const [online, setOnline] = React.useState(true);
  const [discount, setDiscount] = React.useState(0);
  const [sheet, setSheet] = React.useState<"photos" | "price" | "category" | "shops" | null>(null);
  React.useEffect(() => {
    if (!open) return;
    setPhotos(initial);
    setName(p.name);
    setPrice(p.price);
    setStock(p.stock);
  }, [open, p, initial]);
  const dirty = name !== p.name || price !== p.price || stock !== p.stock || photos.length !== initial.length || discount > 0 || category !== categoryOf(p) || shops.length !== 3 || !online;
  const nameError = name.trim() ? undefined : "Give it a name";
  return (
    <>
      <MobileModal
        open={open}
        onOpenChange={onOpenChange}
        title="Edit product"
        dirty={dirty && !nameError}
        onSave={() =>
          new Promise((r) =>
            window.setTimeout(() => {
              update(p.sku, { name, price, stock });
              nav.snack(`${name} saved`);
              r(null);
            }, 500),
          )
        }
      >
        <div className="grid gap-5">
          <MobilePhotoStrip photos={photos} onRemove={(id) => setPhotos((l) => l.filter((x) => x.id !== id))} onAddClick={() => setSheet("photos")} />
          <MobileTextField label="Name" value={name} onValueChange={setName} error={nameError} autoComplete="off" />
          <div className="-mx-pad grid gap-5">
            <MobileList>
              <MobileListRow media={<Tag />} title="Price" value={<span className="text-ink">{formatRp(price)}</span>} chevron onClick={() => setSheet("price")} />
              <MobileListRow media={<Box />} title="Stock" value={<QuantityStepper size="touch" aria-label="Stock" value={stock} onValueChange={setStock} />} />
              <MobileListRow media={<Grid />} title="Category" value={CATEGORIES.find((c) => c.value === category)?.label} chevron onClick={() => setSheet("category")} />
              <MobileListRow media={<ShoppingBag />} title="Sold at" value={shops.length === 6 ? "All shops" : `${shops.length} shops`} chevron onClick={() => setSheet("shops")} />
            </MobileList>
            <MobileList>
              <MobileSwitchRow icon={Zap} title="Sell online" checked={online} onCheckedChange={setOnline} />
            </MobileList>
          </div>
          <div className="rounded-card bg-surface px-pad pb-2 pt-3 shadow-card">
            <MobileSlider label="Launch discount" value={discount} onValueChange={setDiscount} min={0} max={50} step={5} format={(v) => (v ? `${v}%` : "None")} />
          </div>
        </div>
      </MobileModal>
      <MobilePhotoSheet
        open={sheet === "photos"}
        onOpenChange={(o) => setSheet(o ? "photos" : null)}
        photos={roll}
        max={9 - photos.length}
        onAdd={(ps) => setRoll((r) => [...ps, ...r])}
        onPick={(ids) => setPhotos((l) => [...l, ...ids.map((id) => roll.find((x) => x.id === id)!)])}
      />
      <MobileAmountSheet open={sheet === "price"} onOpenChange={(o) => setSheet(o ? "price" : null)} title="Price" label="Price" value={price} onValueChange={setPrice} />
      <MobilePickerSheet open={sheet === "category"} onOpenChange={(o) => setSheet(o ? "category" : null)} title="Category" options={CATEGORIES} value={category} onValueChange={setCategory} />
      <MobileMultiSelectSheet
        open={sheet === "shops"}
        onOpenChange={(o) => setSheet(o ? "shops" : null)}
        title="Shops"
        options={SHOPS.map((s) => ({ value: s, label: s, icon: s === "Shopee" || s === "TikTok Shop" ? ShoppingBag : MapPin }))}
        value={shops}
        onValueChange={setShops}
        doneLabel={(n) => (n ? `Sell at ${n} ${n === 1 ? "shop" : "shops"}` : "Pick a shop")}
      />
    </>
  );
}

/* ------------------------------------------------------------ Stock count */

export function StockCountScreen({ back }: ScreenProps) {
  const nav = useNav();
  const [counts, setCounts] = React.useState<Record<string, number>>({ "RMB-GL-014": 2, "RMB-LL-008": 11 });
  const [flash, setFlash] = React.useState<string | null>(null);
  const [ask, setAsk] = React.useState(false);
  const order = React.useRef(0);
  const next = ["RMB-GL-014", "RMB-PR-022", "RMB-LL-008", "RMB-MB-005", "RMB-VS-012"];
  const counted = PRODUCTS.filter((p) => counts[p.sku] != null);
  const diffs = counted.filter((p) => counts[p.sku] !== p.stock).length;
  const add = (sku: string) => {
    setCounts((c) => ({ ...c, [sku]: (c[sku] ?? 0) + 1 }));
    setFlash(sku);
    window.setTimeout(() => setFlash((f) => (f === sku ? null : f)), 600);
  };
  return (
    <>
      <MobileScreen title="Stock count" large={false} back={back} bottomInset="action-bar">
        <div className="grid gap-5 pt-2">
          <div className="px-pad">
            <MobileScanner
              mockCode={() => next[order.current++ % next.length]}
              onScan={(code) => {
                const p = PRODUCTS.find((x) => x.sku === code) ?? PRODUCTS[Number(code.slice(-1)) % PRODUCTS.length];
                add(p.sku);
              }}
            />
          </div>
          <MobileList title={`Counted at Kemang · ${counted.length} items`}>
            {counted.map((p) => (
              <MobileListRow
                key={p.sku}
                className={flash === p.sku ? "rounded-item bg-fill transition-colors duration-[280ms]" : "transition-colors duration-[280ms]"}
                media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />}
                title={p.name}
                subtitle={counts[p.sku] === p.stock ? "Matches" : `System says ${p.stock}`}
                value={<QuantityStepper size="touch" aria-label={`${p.name} count`} value={counts[p.sku]} onValueChange={(v) => setCounts((c) => ({ ...c, [p.sku]: v }))} />}
              />
            ))}
          </MobileList>
        </div>
      </MobileScreen>
      <MobileActionBar>
        <Button variant="primary" disabled={!counted.length} onClick={() => setAsk(true)}>
          <Check />
          Finish count
        </Button>
      </MobileActionBar>
      <MobileAlert
        open={ask}
        onOpenChange={setAsk}
        title={diffs ? `Save the count? ${diffs} ${diffs === 1 ? "item differs" : "items differ"}` : "Save the count?"}
        message="Stock at Kemang will match what you counted."
        actions={[
          { label: "Keep counting", tone: "cancel" },
          { label: "Save", tone: "primary", onSelect: () => (nav.pop(), nav.snack(`Count saved, ${counted.length} items`)) },
        ]}
      />
    </>
  );
}

/* ------------------------------------------------------------ Customers */

export function CustomersScreen({ back }: ScreenProps) {
  const nav = useNav();
  const [q, setQ] = React.useState("");
  const list = CUSTOMERS.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  const sections = [...new Set(list.map((c) => c.name[0]))].map((letter) => ({ letter, items: list.filter((c) => c.name[0] === letter) }));
  return (
    <MobileScreen title="Customers" large={false} back={back} bottomInset="none" header={<div className="pt-1"><MobileSearchBar value={q} onValueChange={setQ} placeholder="Name or phone" /></div>}>
      {sections.length ? (
        <MobileIndexedList
          sections={sections}
          bottomInset={24}
          renderItem={(c) => <MobilePersonRow name={c.name} subtitle={`${c.orders} ${c.orders === 1 ? "order" : "orders"} · ${c.city}`} onClick={() => nav.push("customer", { id: c.id })} />}
        />
      ) : (
        <EmptyState icon={SearchIcon} title="No customers match" className="py-24" />
      )}
    </MobileScreen>
  );
}

export function CustomerScreen({ params, back }: ScreenProps) {
  const nav = useNav();
  const c = CUSTOMERS.find((x) => x.id === params.id) ?? CUSTOMERS[25];
  const orders = ORDERS.filter((_, i) => i % 37 === Number(c.id.slice(1)) % 37).slice(0, 6);
  return (
    <MobileScreen title={c.name} large={false} back={back} bottomInset="none">
      <div className="grid gap-5 pt-2">
        <div className="px-pad">
          <MobileStatGrid>
            <MobileStatTile label="Orders" value={c.orders} />
            <MobileStatTile label="Spent" value={short(c.spent)} />
          </MobileStatGrid>
        </div>
        <MobileList title="Contact">
          <MobileListRow media={<Phone />} title={c.phone} chevron onClick={() => nav.snack(`Calling ${c.name.split(" ")[0]}`)} />
          <MobileListRow media={<Mail />} title="WhatsApp" chevron onClick={() => nav.push("chat", { id: "ch1" })} />
          <MobileListRow media={<MapPin />} title={c.city} />
        </MobileList>
        <MobileList title="Orders">
          {orders.map((o) => (
            <MobileListRow key={o.id} media={<OrderThumb o={o} />} title={o.items} subtitle={`${o.id} · ${smartTime(o.at)}`} value={short(o.total)} onClick={() => nav.push("order", { id: o.id })} />
          ))}
        </MobileList>
      </div>
    </MobileScreen>
  );
}

/* ------------------------------------------------------------ Inbox */

type Market = "all" | Chat["market"];

export function InboxScreen() {
  const nav = useNav();
  const [tab, setTab] = React.useState<Market>("all");
  const [read, setRead] = React.useState<string[]>([]);
  const unread = (c: Chat) => (read.includes(c.id) ? 0 : c.unread);
  const tabs: { value: Market; label: string }[] = [
    { value: "all", label: "All" },
    { value: "shopee", label: "Shopee" },
    { value: "tiktok", label: "TikTok" },
    { value: "tokopedia", label: "Tokopedia" },
  ];
  const page = (m: Market) => {
    const list = CHATS.filter((c) => m === "all" || c.market === m);
    return list.length ? (
      <MobileList>
        {m === "all" ? <MobileListRow media={<Zap />} title="Assistant" subtitle="Ask about sales, stock and orders" chevron onClick={() => nav.push("assistant")} /> : null}
        {list.map((c) => (
          <MobileContextMenu
            key={c.id}
            aria-label={c.name}
            actions={[
              { label: unread(c) ? "Mark as read" : "Mark as unread", icon: Check, onSelect: () => setRead((r) => (r.includes(c.id) ? r.filter((x) => x !== c.id) : [...r, c.id])) },
              { label: "Open order", icon: FileText, onSelect: () => nav.push("order", { id: "RMB-24811" }) },
            ]}
          >
            <MobilePersonRow
              name={c.name}
              subtitle={c.lines[c.lines.length - 1].text}
              meta={c.time}
              unread={unread(c)}
              badge={<MarketMark market={c.market} size={16} />}
              onClick={() => (setRead((r) => [...r, c.id]), nav.push("chat", { id: c.id }))}
            />
          </MobileContextMenu>
        ))}
      </MobileList>
    ) : (
      <EmptyState icon={ShoppingBag} title="No chats" className="py-24" />
    );
  };
  return (
    <MobileScreen
      title="Inbox"
      header={<MobileTopTabs aria-label="Marketplace" value={tab} onValueChange={setTab} tabs={tabs.map((t) => ({ ...t, count: CHATS.filter((c) => (t.value === "all" || c.market === t.value) && unread(c)).length || undefined }))} />}
    >
      <MobileTabPager value={tab} onValueChange={setTab} pages={tabs.map((t) => ({ value: t.value, content: page(t.value) }))} />
    </MobileScreen>
  );
}

/* ------------------------------------------------------------ Chat */

export function ChatScreen({ params, back }: ScreenProps) {
  const chat = CHATS.find((c) => c.id === params.id) ?? CHATS[0];
  const order = ORDERS.find((o) => o.id === "RMB-24811") ?? ORDERS[6];
  const nav = useNav();
  const [lines, setLines] = React.useState<MobileChatMessage[]>(() =>
    chat.lines.map((l) => ({
      id: l.id,
      mine: l.mine,
      time: l.time,
      text: l.text,
      attachment: l.order ? (
        <button type="button" onClick={() => nav.push("order", { id: order.id })} className="-mx-1.5 -mt-0.5 flex min-h-touch cursor-pointer items-center gap-2.5 rounded-control bg-fill p-1.5 pr-3 text-left">
          <OrderThumb o={order} />
          <span className="grid min-w-0">
            <span className="truncate text-[15px]">{order.id}</span>
            <span className="text-[13px] text-ink-muted">{formatRp(order.total)}</span>
          </span>
          <ChevronRight size={18} className="text-ink-muted" />
        </button>
      ) : undefined,
    })),
  );
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [attach, setAttach] = React.useState(false);
  const send = (text: string) => {
    setLines((l) => [...l, { id: `m${l.length}`, mine: true, text }]);
    setDraft("");
    window.setTimeout(() => setTyping(true), 700);
    window.setTimeout(() => (setTyping(false), setLines((l) => [...l, { id: `r${l.length}`, text: "Thank you!" }])), 2200);
  };
  return (
    <>
      <MobileScreen
        title={chat.name}
        large={false}
        back={back}
        bottomInset="none"
        trailing={
          <MobileBarButton aria-label="Open the order" onClick={() => nav.push("order", { id: order.id })}>
            <FileText />
          </MobileBarButton>
        }
      >
        <MobileChatThread messages={lines} typing={typing} />
      </MobileScreen>
      <MobileComposer
        value={draft}
        onValueChange={setDraft}
        onSend={send}
        onAttach={() => setAttach(true)}
        suggestions={chat.id === "ch1" ? ["Yes, we'll gift wrap it", "It ships today", "Thanks, Nadia!"] : ["It ships today", "Let me check"]}
      />
      <MobileActionSheet
        open={attach}
        onOpenChange={setAttach}
        title="Attach"
        actions={[
          { label: "Photo", icon: ImageIcon, onSelect: () => send("Photo sent") },
          { label: "Camera", icon: Camera, onSelect: () => send("Photo sent") },
          { label: "Order", icon: FileText, onSelect: () => send(`Order ${order.id}`) },
          { label: "Product", icon: Package, onSelect: () => send("Gelas kopi tanah liat, Rp 89.000") },
        ]}
      />
    </>
  );
}

/* ------------------------------------------------------------ Assistant */

const QUESTION = "Which products should I restock this week?";
const ANSWER =
  "Three products will run out before the weekend at the pace they sold last week[1]. The large pandan basket has 1 left and sells about 4 a week. The clay coffee cup has 2 left and sold 9[1].\n\nThe teak coasters have been out since Saturday, and 6 buyers asked about them on Shopee[2]. Your supplier in Jepara restocks in 5 days[3].";
const SOURCES = [
  { title: "Stock ledger", meta: "All shops · last 7 days", quote: "Keranjang pandan besar: 1 left, 4 sold. Gelas kopi tanah liat: 2 left, 9 sold." },
  { title: "Shopee chats", meta: "Rimba Official", quote: "6 chats asked about Tatakan gelas jati since 14 Nov." },
  { title: "Supplier: Jati Jepara", meta: "Purchase orders", quote: "Lead time 5 days, minimum 20 sets." },
];

export function AssistantScreen({ back }: ScreenProps) {
  const nav = useNav();
  const [shown, setShown] = React.useState(0);
  const [state, setState] = React.useState<"pending" | "applying" | "applied" | "dismissed">("pending");
  const [source, setSource] = React.useState<number | null>(null);
  const [draft, setDraft] = React.useState("");
  const words = ANSWER.split(/(\s+)/);
  const streaming = shown < words.length;
  React.useEffect(() => {
    if (!streaming) return;
    const t = window.setTimeout(() => setShown((n) => n + 3), 60);
    return () => window.clearTimeout(t);
  }, [shown, streaming]);
  return (
    <>
      <MobileScreen title="Assistant" large={false} back={back} bottomInset="none">
        <div className="grid gap-4 px-pad pt-3" style={{ paddingBottom: "calc(var(--ad-composer, 60px) + max(10px, var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px)), calc(var(--ad-keyboard, 0px) + 8px)) + 16px)" }}>
          <p className="ml-auto w-fit max-w-[80%] rounded-card bg-on px-3.5 py-2 text-[16px] leading-[22px] text-on-ink">{QUESTION}</p>
          <div className="text-[16px] leading-[26px]">
            <StreamingText
              text={words.slice(0, shown).join("")}
              streaming={streaming}
              final={ANSWER}
              cite={(n) => <sup className="ml-0.5 text-[11px] font-semibold text-ink-muted">{n}</sup>}
            />
          </div>
          {!streaming ? (
            <div className="grid animate-[ad-up_220ms_var(--ad-ease)] gap-4">
              <ProposedChange
                size="touch"
                title="Order 20 baskets and 30 cups?"
                changes={[
                  { id: "kr", label: "Keranjang pandan besar", from: "1", to: "21" },
                  { id: "gl", label: "Gelas kopi tanah liat", from: "2", to: "32" },
                ]}
                state={state}
                applyLabel="Create order"
                onApply={() => {
                  setState("applying");
                  window.setTimeout(() => (setState("applied"), nav.snack("Purchase order PO-0192 created")), 900);
                }}
                onDismiss={() => setState("dismissed")}
                onUndo={() => setState("pending")}
              />
              <div className="-mx-pad">
                <MobileList title="Sources">
                  {SOURCES.map((s, i) => (
                    <MobileListRow key={s.title} media={<span className="grid size-[22px] place-items-center rounded-full bg-fill text-[12px] font-semibold">{i + 1}</span>} title={s.title} subtitle={s.meta} chevron onClick={() => setSource(i)} />
                  ))}
                </MobileList>
              </div>
            </div>
          ) : null}
        </div>
      </MobileScreen>
      <MobileComposer value={draft} onValueChange={setDraft} onSend={() => setDraft("")} busy={streaming} placeholder="Ask about your shops" suggestions={streaming ? undefined : ["Why is Dago slower?", "Best sellers this month"]} />
      <MobileSheet open={source != null} onOpenChange={(o) => !o && setSource(null)} title={source != null ? SOURCES[source].title : ""}>
        {source != null ? (
          <div className="grid gap-3 pb-2">
            <p className="text-[13px] text-ink-muted">{SOURCES[source].meta}</p>
            <blockquote className="rounded-card bg-fill p-pad text-[16px] leading-[24px]">{SOURCES[source].quote}</blockquote>
          </div>
        ) : null}
      </MobileSheet>
    </>
  );
}
