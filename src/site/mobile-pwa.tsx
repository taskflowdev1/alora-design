// The installed-app scenes on /mobile: each a real Rimba screen in a phone, using one PWA part in its moment. They fit
// the 844 px screen without scrolling, so a swipe over a phone still scrolls the page.
import * as React from "react";
import { Bell, Book, Calendar, Camera, Clock, Cloud, Compass, CreditCard, Folder, Home, Image, Mail, Map, MessageCircle, Music, Package, Phone, Settings, Share2, ShoppingBag, Truck, WifiOff } from "react-feather";
import { cn, formatNumber, SAFE_TOP } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Thumb } from "@/components/ui/thumb";
import { MobileActionBar } from "@/components/mobile/mobile-action-bar";
import { MobileAlert } from "@/components/mobile/mobile-alert";
import { MobileAppHeader } from "@/components/mobile/mobile-app-header";
import { MobileAppIcon } from "@/components/mobile/mobile-app-badge";
import { MobileBanner } from "@/components/mobile/mobile-banner";
import { useCameraScan } from "@/components/mobile/mobile-camera";
import { MobileInstallSheet, type InstallPlatform } from "@/components/mobile/mobile-install-prompt";
import { MobileList, MobileListRow, MobileListSkeleton } from "@/components/mobile/mobile-list";
import { MobileScreen } from "@/components/mobile/mobile-nav-bar";
import { MobilePageStack } from "@/components/mobile/mobile-page-stack";
import { MobilePasskeySheet } from "@/components/mobile/mobile-passkey";
import { MobilePickerSheet } from "@/components/mobile/mobile-picker-sheet";
import { MobilePushAsk, type PushStatus } from "@/components/mobile/mobile-push-ask";
import { MobileScanner } from "@/components/mobile/mobile-scanner";
import { MobileShareSheet } from "@/components/mobile/mobile-share";
import { MobileSheet } from "@/components/mobile/mobile-sheet";
import { MobileStateButton } from "@/components/mobile/mobile-state-button";
import { MobileSyncPill, MobileSyncSheet, useSyncQueue, type SyncItem } from "@/components/mobile/mobile-sync-status";
import { MobileTab, MobileTabBar } from "@/components/mobile/mobile-tab-bar";
import { MobileTextField } from "@/components/mobile/mobile-text-field";
import { MobileUpdateToast } from "@/components/mobile/mobile-update-toast";
import { MobileWakeLockRow, useWakeLock } from "@/components/mobile/mobile-wake-lock";
import { PAID_ORDERS, PRODUCTS, SHOPS, productPhoto, type Order } from "./data";
import { OrderThumb } from "./mobile-app-kit";

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const ORDERS = PAID_ORDERS.slice(0, 6);

/** Money in a row: the small muted Rp on the number's baseline. */
function Rp({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1 tabular-nums text-ink", className)}>
      <span className="text-[12px] text-ink-muted">Rp</span>
      {formatNumber(n)}
    </span>
  );
}

/** Rimba's app icon: a leaf on the accent. */
function RimbaIcon({ size = 56 }: { size?: number }) {
  return (
    <span className="grid place-items-center bg-brand text-brand-ink [corner-shape:superellipse(1.6)]" style={{ width: size, height: size, borderRadius: size * 0.27 }}>
      <svg aria-hidden width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 19.5C4 10.5 10.5 4 19.5 4.5c.5 9-6 15.5-15 15Z" />
        <path d="M4.5 19.5 13.5 10.5" fill="none" strokeWidth="1.75" strokeLinecap="round" className="stroke-brand" />
      </svg>
    </span>
  );
}

function OrderRow({ o, onClick, value }: { o: Order; onClick?: () => void; value?: React.ReactNode }) {
  return <MobileListRow media={<OrderThumb o={o} />} title={o.customer} subtitle={o.items} value={value ?? <Rp n={o.total} />} onClick={onClick} />;
}

/* ---------------------------------------------------------------- install */

export function InstallScene({ platform }: { platform: InstallPlatform }) {
  const [open, setOpen] = React.useState(true);
  const [installed, setInstalled] = React.useState(false);
  return (
    <>
      <MobileScreen title="Today" bottomInset="none">
        <div className="grid gap-5">
          {installed ? null : (
            <MobileList>
              <MobileListRow media={<RimbaIcon size={32} />} title="Install Rimba" chevron onClick={() => setOpen(true)} />
            </MobileList>
          )}
          <MobileList title="To pack">
            {ORDERS.slice(0, 5).map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </MobileList>
        </div>
      </MobileScreen>
      <MobileInstallSheet
        open={open}
        onOpenChange={setOpen}
        name="Rimba"
        icon={<RimbaIcon size={64} />}
        platform={platform}
        onInstall={async () => {
          await wait(1100);
          setInstalled(true);
          return "accepted";
        }}
        onOpenApp={() => setOpen(false)}
      />
    </>
  );
}

/* ---------------------------------------------------------------- passkey */

export function PasskeyScene() {
  const [stage, setStage] = React.useState<"out" | "code" | "in">("out");
  const [open, setOpen] = React.useState(true);
  const [code, setCode] = React.useState("");
  if (stage === "in") {
    return (
      <MobileScreen title="Today" bottomInset="none">
        <MobileList title="To pack">
          {ORDERS.slice(0, 6).map((o) => (
            <OrderRow key={o.id} o={o} />
          ))}
        </MobileList>
      </MobileScreen>
    );
  }
  return (
    <div className="flex h-full flex-col bg-page px-pad" style={{ paddingTop: `calc(${SAFE_TOP} + 88px)` }}>
      <div className="grid justify-items-center gap-4">
        <RimbaIcon size={72} />
        <h2 className="text-[26px] font-semibold text-ink">Sign in to Rimba</h2>
      </div>
      {stage === "code" ? (
        <div className="mt-8 grid gap-3">
          <MobileTextField label="Code from WhatsApp" value={code} onValueChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" />
          <Button variant="primary" disabled={code.length < 6} className="h-touch text-[15px]" onClick={() => setStage("in")}>
            Sign in
          </Button>
        </div>
      ) : (
        <Button variant="primary" className="mt-8 h-touch text-[15px]" onClick={() => setOpen(true)}>
          Sign in
        </Button>
      )}
      <MobilePasskeySheet
        open={open}
        onOpenChange={setOpen}
        name="Sari Wulandari"
        onAuthenticate={() => wait(1300)}
        onDone={() => (setOpen(false), setStage("in"))}
        onUseCode={() => (setOpen(false), setStage("code"))}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- push */

export function PushScene() {
  const [status, setStatus] = React.useState<PushStatus>("ask");
  const [system, setSystem] = React.useState(false);
  const [how, setHow] = React.useState(false);
  const [notice, setNotice] = React.useState(false);
  const timers = React.useRef<number[]>([]);
  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  const o = ORDERS[0];
  return (
    <>
      <MobileScreen title="Orders" bottomInset="none">
        <div className="grid gap-4">
          <div className="px-3 empty:hidden">
            <MobilePushAsk status={status} onAllow={() => setSystem(true)} onLater={() => setStatus("unsupported")} onFix={() => setHow(true)} />
          </div>
          <MobileList>
            {ORDERS.slice(0, 5).map((x) => (
              <OrderRow key={x.id} o={x} />
            ))}
          </MobileList>
        </div>
      </MobileScreen>
      <div
        aria-hidden={!notice}
        className={cn(
          "pointer-events-none fixed inset-x-2 z-[60] flex items-center gap-3 rounded-sheet bg-surface p-3 shadow-dialog transition-[transform,opacity] duration-[320ms] ease-ad-page motion-reduce:transition-none",
          notice ? "translate-y-0 opacity-100" : "-translate-y-[calc(100%+60px)] opacity-0",
        )}
        style={{ top: `calc(${SAFE_TOP} + 4px)` }}
      >
        <RimbaIcon size={36} />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-[15px] font-semibold text-ink">New order from {o.customer}</span>
          <Rp n={o.total} className="text-[14px]" />
        </span>
      </div>
      <MobileAlert
        open={system}
        onOpenChange={setSystem}
        title="“Rimba” would like to send you notifications"
        actions={[
          { label: "Don't allow", tone: "cancel", onSelect: () => setStatus("blocked") },
          {
            label: "Allow",
            tone: "default",
            onSelect: () => {
              setStatus("granted");
              timers.current.push(window.setTimeout(() => setNotice(true), 700), window.setTimeout(() => setNotice(false), 4700));
            },
          },
        ]}
      />
      <MobileSheet open={how} onOpenChange={setHow} title="Turn notifications on" footer={<Button variant="primary" onClick={() => (setHow(false), setStatus("granted"))}>Done</Button>}>
        <ol className="grid gap-1 pb-1">
          {["Open Settings", "Tap Notifications", "Tap Rimba", "Turn on Allow Notifications"].map((t, i) => (
            <li key={t} className="flex h-touch items-center gap-3 rounded-item px-3 text-[15px] text-ink">
              <span className="w-4 text-center text-[13px] font-semibold tabular-nums text-ink-muted">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </MobileSheet>
    </>
  );
}

/* ---------------------------------------------------------------- app shell */

export function ShellScene() {
  const [shop, setShop] = React.useState("Kemang");
  const [pick, setPick] = React.useState(false);
  const [tab, setTab] = React.useState("Home");
  const shift = SHOPS.indexOf(shop);
  const orders = [...PAID_ORDERS.slice(shift), ...PAID_ORDERS.slice(0, shift)].slice(0, 5);
  const today = orders.reduce((a, o) => a + o.total, 0);
  return (
    <div className="flex h-full flex-col bg-page">
      <MobileAppHeader title={`Rimba ${shop}`} onPick={() => setPick(true)} standalone />
      <div className="grid content-start gap-5 pt-2">
        {tab === "Home" ? (
          <>
            <section className="mx-3 grid gap-1 rounded-card bg-surface p-pad shadow-card">
              <h2 className="text-[13px] text-ink-muted">Sales today</h2>
              <p className="flex items-baseline gap-1.5 text-[30px] font-semibold tabular-nums text-ink">
                <span className="text-[15px] font-normal text-ink-muted">Rp</span>
                {formatNumber(today)}
              </p>
            </section>
            <MobileList title="To pack">
              {orders.slice(0, 4).map((o) => (
                <OrderRow key={o.id} o={o} />
              ))}
            </MobileList>
          </>
        ) : tab === "Orders" ? (
          <MobileList>
            {orders.map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </MobileList>
        ) : (
          <MobileList>
            {PRODUCTS.slice(0, 7).map((p) => (
              <MobileListRow key={p.sku} media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />} title={p.name} value={`${p.stock} left`} />
            ))}
          </MobileList>
        )}
      </div>
      <MobileTabBar>
        <MobileTab icon={Home} label="Home" active={tab === "Home"} onClick={() => setTab("Home")} />
        <MobileTab icon={ShoppingBag} label="Orders" badge={orders.length} active={tab === "Orders"} onClick={() => setTab("Orders")} />
        <MobileTab icon={Package} label="Products" active={tab === "Products"} onClick={() => setTab("Products")} />
      </MobileTabBar>
      <MobilePickerSheet open={pick} onOpenChange={setPick} title="Shop" value={shop} onValueChange={setShop} options={SHOPS.slice(0, 4).map((s) => ({ value: s, label: `Rimba ${s}` }))} />
    </div>
  );
}

/* ---------------------------------------------------------------- badge */

const HOME_APPS = [
  ["Camera", Camera],
  ["Mail", Mail],
  ["Calendar", Calendar],
  ["Maps", Map],
  ["Clock", Clock],
  ["Phone", Phone],
  ["Music", Music],
  ["Photos", Image],
  ["Messages", MessageCircle],
  ["Browser", Compass],
  ["Weather", Cloud],
  ["Files", Folder],
  ["Wallet", CreditCard],
  ["Notes", Book],
  ["Settings", Settings],
] as const;

export function BadgeScene() {
  const [count, setCount] = React.useState(3);
  return (
    <>
      <div className="grid h-full content-start bg-page px-5" style={{ paddingTop: `calc(${SAFE_TOP} + 28px)` }}>
        <div className="grid grid-cols-4 justify-items-center gap-y-6">
          <MobileAppIcon label="Rimba" count={count}>
            <RimbaIcon size={60} />
          </MobileAppIcon>
          {HOME_APPS.map(([label, Icon]) => (
            <MobileAppIcon key={label} label={label}>
              <span aria-hidden className="grid size-full place-items-center bg-fill text-ink-muted">
                <Icon size={26} strokeWidth={1.5} />
              </span>
            </MobileAppIcon>
          ))}
        </div>
      </div>
      <MobileActionBar>
        <Button onClick={() => setCount((c) => Math.max(0, c - 1))} disabled={!count}>
          Pack one
        </Button>
        <Button variant="primary" onClick={() => setCount((c) => c + 1)}>
          New order
        </Button>
      </MobileActionBar>
    </>
  );
}

/* ---------------------------------------------------------------- offline queue */

const QUEUED: SyncItem[] = [
  { id: ORDERS[0].id, title: `Packed ${ORDERS[0].id}`, state: "waiting" },
  { id: ORDERS[1].id, title: `Packed ${ORDERS[1].id}`, state: "waiting" },
];

export function SyncScene({ online }: { online: boolean }) {
  const [sheet, setSheet] = React.useState(false);
  const q = useSyncQueue({ online, initial: QUEUED, send: () => wait(760) });
  const packed = new Set(q.items.map((i) => i.id));
  const allDone = q.items.length > 0 && q.items.every((i) => i.state === "done");
  const clear = q.clear;
  React.useEffect(() => {
    if (!allDone) return;
    const t = window.setTimeout(clear, 1600);
    return () => window.clearTimeout(t);
  }, [allDone, clear]);
  return (
    <div className="flex h-full flex-col bg-page">
      <MobileAppHeader title="To pack" standalone={false} trailing={<MobileSyncPill online={online} items={q.items} onClick={() => setSheet(true)} />} />
      <div className="px-3 pb-2 pt-1 empty:hidden">
        <MobileBanner open={!online} icon={WifiOff}>
          You're offline. Changes stay on this phone.
        </MobileBanner>
      </div>
      <MobileList>
        {ORDERS.map((o) => {
          const on = packed.has(o.id);
          return <OrderRow key={o.id} o={o} value={on ? <span className="text-[14px] text-ink-muted">Packed</span> : <Rp n={o.total} />} onClick={on ? undefined : () => q.add(o.id, `Packed ${o.id}`)} />;
        })}
      </MobileList>
      <MobileSyncSheet open={sheet} onOpenChange={setSheet} items={q.items} onRetry={q.retry} />
    </div>
  );
}

/* ---------------------------------------------------------------- update */

export function UpdateScene() {
  const [phase, setPhase] = React.useState<"waiting" | "ready" | "reloading" | "loading" | "new" | "later">("waiting");
  React.useEffect(() => {
    if (phase === "waiting") {
      const t = window.setTimeout(() => setPhase("ready"), 900);
      return () => window.clearTimeout(t);
    }
    if (phase === "reloading") {
      const t = window.setTimeout(() => setPhase("loading"), 900);
      return () => window.clearTimeout(t);
    }
    if (phase === "loading") {
      const t = window.setTimeout(() => setPhase("new"), 800);
      return () => window.clearTimeout(t);
    }
  }, [phase]);
  const rows = phase === "new" ? ORDERS.slice(1, 6) : ORDERS.slice(0, 5);
  return (
    <>
      <MobileScreen title="Orders">
        {phase === "loading" ? (
          <MobileListSkeleton rows={5} />
        ) : (
          <MobileList>
            {rows.map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </MobileList>
        )}
      </MobileScreen>
      <MobileTabBar>
        <MobileTab icon={Home} label="Home" />
        <MobileTab icon={ShoppingBag} label="Orders" active />
        <MobileTab icon={Package} label="Products" />
      </MobileTabBar>
      <MobileUpdateToast open={phase === "ready" || phase === "reloading"} busy={phase === "reloading"} onReload={() => setPhase("reloading")} onLater={() => setPhase("later")} />
    </>
  );
}

/* ---------------------------------------------------------------- share */

export function ShareScene() {
  const [open, setOpen] = React.useState(false);
  const o = ORDERS[2];
  return (
    <>
      <MobileScreen title={o.id} translateTitle={false} large={false} back={{ label: "Orders", onClick: () => {} }} bottomInset="action-bar">
        <div className="grid gap-5 pt-2">
          <section className="mx-3 grid justify-items-center gap-1 rounded-card bg-surface p-6 shadow-card">
            <h2 className="text-[15px] text-ink-muted">{o.customer}</h2>
            <p className="flex items-baseline gap-1.5 text-[34px] font-semibold tabular-nums text-ink">
              <span className="text-[16px] font-normal text-ink-muted">Rp</span>
              {formatNumber(o.total)}
            </p>
          </section>
          <MobileList title="Items">
            <MobileListRow media={<OrderThumb o={o} />} title={o.items} subtitle={`${o.qty} pcs`} />
          </MobileList>
          <MobileList title="Delivery">
            <MobileListRow media={<Truck />} title="GoSend Instant" value="Today" />
          </MobileList>
        </div>
      </MobileScreen>
      <MobileActionBar>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Share2 />
          Share invoice
        </Button>
      </MobileActionBar>
      <MobileShareSheet open={open} onOpenChange={setOpen} data={{ title: `Invoice ${o.id}`, text: `Invoice ${o.id} from Rimba`, url: `https://rimba.example/i/${o.id}` }} />
    </>
  );
}

/* ---------------------------------------------------------------- scan */

export function ScanScene() {
  const [counts, setCounts] = React.useState<Record<string, number>>({ [PRODUCTS[0].sku]: 2 });
  const next = React.useRef(1);
  const add = () => {
    const p = PRODUCTS[next.current++ % 4];
    setCounts((c) => ({ ...c, [p.sku]: (c[p.sku] ?? 0) + 1 }));
  };
  const cam = useCameraScan({ onCode: add });
  const live = cam.status === "starting" || cam.status === "live";
  const rows = PRODUCTS.filter((p) => counts[p.sku]).slice(0, 3);
  return (
    <MobileScreen title="Stock count" large={false} bottomInset="none" trailing={<Button variant="ghost" className="h-touch px-3 text-[15px]" onClick={() => (live ? cam.stop() : void cam.start())}>{live ? "Stop" : "Camera"}</Button>}>
      <div className="grid gap-4 px-3 pt-2">
        <MobileScanner onScan={add} camera={live ? cam.video : undefined} />
      </div>
      <MobileList title="Counted" className="mt-4">
        {rows.map((p) => (
          <MobileListRow key={p.sku} media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />} title={p.name} value={String(counts[p.sku])} />
        ))}
      </MobileList>
    </MobileScreen>
  );
}

/* ---------------------------------------------------------------- keep awake */

export function WakeScene() {
  const lock = useWakeLock();
  const [local, setLocal] = React.useState(true);
  const on = lock.on || local;
  const [dim, setDim] = React.useState(false);
  const [qty, setQty] = React.useState<Record<string, number>>({ [PRODUCTS[0].sku]: 12, [PRODUCTS[1].sku]: 7, [PRODUCTS[3].sku]: 3 });
  const box = React.useRef<HTMLDivElement>(null);
  // With the lock off the screen dims after a few idle seconds, as the phone would; any touch brings it back.
  React.useEffect(() => {
    if (on) return setDim(false);
    let t = window.setTimeout(() => setDim(true), 3500);
    const wake = () => {
      setDim(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setDim(true), 3500);
    };
    const el = box.current;
    el?.addEventListener("pointerdown", wake);
    return () => (window.clearTimeout(t), el?.removeEventListener("pointerdown", wake));
  }, [on]);
  return (
    <div ref={box} className="h-full">
      <MobileScreen title="Count: Kemang" large={false} bottomInset="none">
        <div className="grid gap-5 pt-2">
          <MobileList>
            <MobileWakeLockRow
              checked={on}
              onCheckedChange={(v) => {
                setLocal(v);
                if (lock.supported) void lock.set(v);
              }}
            />
          </MobileList>
          <MobileList title="Shelf A">
            {PRODUCTS.slice(0, 5).map((p) => (
              <MobileListRow
                key={p.sku}
                media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />}
                title={p.name}
                value={<QuantityStepper size="touch" aria-label={`Count of ${p.name}`} value={qty[p.sku] ?? 0} onValueChange={(v) => setQty((q) => ({ ...q, [p.sku]: v }))} />}
              />
            ))}
          </MobileList>
        </div>
      </MobileScreen>
      <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-[60] bg-overlay transition-opacity duration-[700ms] ease-ad motion-reduce:transition-none", dim ? "opacity-100" : "opacity-0")} />
    </div>
  );
}

/* ---------------------------------------------------------------- swipe back */

export function StackScene() {
  const [stack, setStack] = React.useState<string[]>(["list", ORDERS[1].id]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const push = (id: string) => setStack((s) => [...s, id]);
  const pages = stack.map((key) => {
    if (key === "list") {
      return {
        key,
        node: (
          <MobileScreen title="Orders" bottomInset="none">
            <MobileList>
              {ORDERS.map((o) => (
                <MobileListRow key={o.id} media={<OrderThumb o={o} />} title={o.customer} subtitle={o.id} chevron onClick={() => push(o.id)} />
              ))}
            </MobileList>
          </MobileScreen>
        ),
      };
    }
    const o = ORDERS.find((x) => x.id === key) ?? ORDERS[0];
    return {
      key,
      node: (
        <MobileScreen title={o.id} translateTitle={false} large={false} back={{ label: "Orders", onClick: pop }} bottomInset="none">
          <div className="grid gap-5 pt-2">
            <section className="mx-3 grid gap-1 rounded-card bg-surface p-pad shadow-card">
              <h2 className="text-[13px] text-ink-muted">{o.customer}</h2>
              <p className="flex items-baseline gap-1.5 text-[28px] font-semibold tabular-nums text-ink">
                <span className="text-[14px] font-normal text-ink-muted">Rp</span>
                {formatNumber(o.total)}
              </p>
            </section>
            <MobileList title="Items">
              <MobileListRow media={<OrderThumb o={o} />} title={o.items} subtitle={`${o.qty} pcs`} />
            </MobileList>
            <MobileList title="Shipping">
              <MobileListRow media={<Truck />} title="Courier" value="JNE Reguler" />
              <MobileListRow media={<Bell />} title="Notify buyer" value="WhatsApp" />
            </MobileList>
          </div>
        </MobileScreen>
      ),
    };
  });
  return <MobilePageStack pages={pages} onBack={pop} />;
}

/* ---------------------------------------------------------------- keyboard */

export function KeyboardScene({ onKeyboard }: { onKeyboard: (open: boolean) => void }) {
  const [name, setName] = React.useState("Rina Kusuma");
  const [note, setNote] = React.useState("");
  const [state, setState] = React.useState<"idle" | "busy" | "done">("idle");
  const timers = React.useRef<number[]>([]);
  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  const save = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    onKeyboard(false);
    setState("busy");
    timers.current.push(window.setTimeout(() => setState("done"), 800), window.setTimeout(() => setState("idle"), 2200));
  };
  return (
    <>
      <MobileScreen title="New customer" large={false} back={{ label: "Customers", onClick: () => {} }} bottomInset="action-bar">
        <div className="grid gap-4 px-pad pt-2" onFocus={() => onKeyboard(true)} onBlur={() => onKeyboard(false)}>
          <MobileTextField label="Name" value={name} onValueChange={setName} autoComplete="off" enterKeyHint="next" />
          <MobileTextField label="Note for the packer" value={note} onValueChange={setNote} autoComplete="off" enterKeyHint="done" />
        </div>
      </MobileScreen>
      <MobileActionBar>
        {/* Keeps the field focused through the press, so the bar doesn't drop out from under the finger. */}
        <span onPointerDown={(e) => e.preventDefault()} className="grid">
          <MobileStateButton variant="primary" state={state} busyLabel="Saving" doneLabel="Saved" onClick={save}>
            Save customer
          </MobileStateButton>
        </span>
      </MobileActionBar>
    </>
  );
}

