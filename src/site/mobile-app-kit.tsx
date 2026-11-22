// Shared parts of the Mobile example app: navigation (a native-style stack per tab), screen props and small helpers.
import * as React from "react";
import { Truck } from "react-feather";
import { MONTHS, cn, dayDiff, formatCompact, formatRp } from "@/lib/ad";
import { NOW, itemPhoto, productPhoto, smartTime, type Order, type PRODUCTS } from "./data";
import { SlidingPill } from "@/components/ui/sliding-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumb } from "@/components/ui/thumb";
import { MobileListRow } from "@/components/mobile/mobile-list";

export type TabId = "home" | "orders" | "products" | "inbox" | "more";
export type Params = Record<string, string>;

export interface Nav {
  /** Slide a screen in from the right on the current stack. */
  push: (id: string, params?: Params) => void;
  /** Slide the top screen out; with n > 1 the screens under it go too (the end of a flow back to where it began). */
  pop: (n?: number) => void;
  /** Swap the top screen (a finished payment becomes its receipt). */
  replace: (id: string, params?: Params) => void;
  setTab: (tab: TabId) => void;
  /** Full-screen flows over the tabs (sign in, welcome); null closes them. */
  cover: (id: string | null, params?: Params) => void;
  snack: (text: string, undo?: () => void) => void;
}

export const NavContext = React.createContext<Nav | null>(null);
export const useNav = () => React.useContext(NavContext)!;

export interface ScreenProps {
  params: Params;
  /** The back button: the previous screen's title. Undefined on a tab's root. */
  back?: { label: string; onClick: () => void };
  /** A forced state for the gallery and screenshots: "empty", "offline", "error". */
  state?: string;
}

/** Money in a row: Rp 1,3 M from a billion, Rp 12,4 jt from a million (id-ID figures), the full amount below. */
export const short = (n: number) => (n >= 1e6 ? `Rp ${formatCompact(n, { space: " ", digits: 1 })}` : formatRp(n));

/** A time in a list row: "13:05" today (the list is about today), "Yesterday, 13:05" or "14 Nov, 13:05" before. */
export const rowTime = (d: Date) => smartTime(d).replace(/^Today, /, "");

/** A day without the year when it is this year: "Tomorrow", "Today", "17 Nov"; "17 Nov 2025" otherwise. */
export function smartDay(d: Date, now: Date = NOW) {
  const diff = dayDiff(d, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const m = MONTHS[d.getMonth()];
  return d.getFullYear() === now.getFullYear() ? `${d.getDate()} ${m}` : `${d.getDate()} ${m} ${d.getFullYear()}`;
}

export const COURIERS = [
  { id: "jne", name: "JNE Regular", price: 12000, eta: "2–3 days" },
  { id: "sicepat", name: "SiCepat Halu", price: 11000, eta: "2–4 days" },
  { id: "gosend", name: "GoSend Instant", price: 28000, eta: "Today" },
  { id: "grab", name: "GrabExpress Sameday", price: 24000, eta: "Today" },
  { id: "pos", name: "Pos Kilat", price: 10000, eta: "3–5 days" },
];

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
          className="relative flex min-h-[56px] cursor-pointer items-center gap-3 rounded-control px-3 text-left outline-none transition-colors duration-[150ms] ease-ad focus-visible:bg-fill aria-checked:focus-visible:bg-ink-muted aria-checked:focus-visible:text-surface not-aria-checked:active:bg-fill not-aria-checked:active:duration-0 not-aria-checked:data-pressed:bg-fill not-aria-checked:data-pressed:duration-0"
        >
          <Truck size={20} strokeWidth={1.75} className="shrink-0" />
          <span className="grid min-w-0 flex-1">
            <span translate="no" className="truncate text-[15px]">
              {c.name}
            </span>
            <span className="text-[13px] text-ink-muted">{c.eta}</span>
          </span>
          <span className="text-[15px] tabular-nums text-ink-muted">{formatRp(c.price)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * A section title on a screen: plain, muted, right above its card, at the same spot as a MobileList title (so every
 * label sits the same distance from its card). Only with an action does the row grow to the action's 44 px.
 */
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={cn("flex items-end justify-between gap-3 px-[calc(var(--ad-pad)+4px)] pb-1.5", action && "min-h-touch")}>
      <h2 className="text-[13px] text-ink-muted">{children}</h2>
      {action}
    </div>
  );
}

/** The phone's empty state: centred in the height left under the bar, the same on every screen. */
export function ScreenEmpty(props: React.ComponentProps<typeof EmptyState>) {
  return <EmptyState {...props} className={cn("grow py-16", props.className)} />;
}

export const OrderThumb = ({ o }: { o: Order }) => <Thumb src={itemPhoto(o.items)} alt={o.items} size={40} />;

/** An order in a list: its photo, the customer, the time first (truncation never eats it) and the items, the total. */
export const orderRow = (o: Order, onClick: () => void = () => {}) => (
  <MobileListRow key={o.id} media={<OrderThumb o={o} />} title={o.customer} subtitle={`${rowTime(o.at)} · ${o.items}`} value={short(o.total)} onClick={onClick} />
);

/** A product in a list: its photo, name, stock and price. */
export const productRow = (p: (typeof PRODUCTS)[number], onClick: () => void = () => {}) => (
  <MobileListRow key={p.sku} media={<Thumb src={productPhoto(p.sku)} alt={p.name} size={40} />} title={p.name} subtitle={p.stock ? `${p.stock} in stock` : "Out of stock"} value={formatRp(p.price)} onClick={onClick} />
);
