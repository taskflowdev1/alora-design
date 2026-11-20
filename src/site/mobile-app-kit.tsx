// Shared parts of the Mobile example app: navigation (a native-style stack per tab), screen props and small helpers.
import * as React from "react";
import { Truck } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { NOW, smartTime } from "./data";
import { SlidingPill } from "@/components/ui/sliding-pill";
import { EmptyState } from "@/components/ui/empty-state";

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
export const short = (n: number) =>
  n >= 1e9
    ? `Rp ${(n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`
    : n >= 1e6
      ? `Rp ${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`
      : formatRp(n);

/** A time in a list row: "13:05" today (the list is about today), "Yesterday, 13:05" or "14 Nov, 13:05" before. */
export const rowTime = (d: Date) => smartTime(d).replace(/^Today, /, "");

/** A day without the year when it is this year: "Tomorrow", "Today", "17 Nov"; "17 Nov 2025" otherwise. */
export function smartDay(d: Date, now: Date = NOW) {
  const day = (x: Date) => Math.floor(new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime() / 864e5);
  const diff = day(d) - day(now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
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
          className="relative flex min-h-[56px] cursor-pointer items-center gap-3 rounded-control px-3 text-left outline-none transition-[background-color,transform] duration-[120ms] ease-ad [-webkit-tap-highlight-color:transparent] focus-visible:bg-fill aria-checked:focus-visible:bg-ink-muted aria-checked:focus-visible:text-surface active:scale-[0.99]"
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

/** A quiet text button at the end of a section title ("See all"). */
export function TextButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mb-1.5 -mr-2 h-touch cursor-pointer rounded-control px-2 text-[15px] font-medium text-ink transition-[background-color,transform] duration-[150ms] ease-ad focus-visible:bg-fill active:scale-[0.96] [-webkit-tap-highlight-color:transparent]"
    >
      {children}
    </button>
  );
}
