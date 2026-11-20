import * as React from "react";
import { Home, Truck, User } from "react-feather";
import { cn, formatNumber } from "@/lib/ad";
import { MarketMark, type Market } from "@/components/ui/marketplace-mark";

export type Payer = "buyer" | "platform" | "shop";

export interface FeeRowProps {
  /** Who pays (or receives) this line. */
  payer: Payer;
  /** The marketplace, so "Platform" shows its mark. */
  market?: Market;
  /** What the fee is, e.g. "Admin fee 4,5%". */
  label: React.ReactNode;
  /** Signed amount from the shop's side: + comes in, − goes out. */
  amount: number;
  unit?: string;
  /** Shipping lines get a truck instead of the payer icon. */
  shipping?: boolean;
  className?: string;
}

const PAYER: Record<Payer, string> = { buyer: "Buyer", platform: "Platform", shop: "Shop" };

/** Who pays, on the left (icon + short label); the amount on the right, coloured by direction. */
export function FeeRow({ payer, market = "shopee", label, amount, unit = "Rp", shipping, className }: FeeRowProps) {
  const icon = shipping ? (
    <Truck size={16} className="text-ink-muted" />
  ) : payer === "platform" ? (
    <MarketMark market={market} />
  ) : payer === "buyer" ? (
    <User size={16} className="text-ink-muted" />
  ) : (
    <Home size={16} className="text-ink-muted" />
  );
  return (
    <div className={cn("flex h-row items-center gap-3 rounded-item px-2.5 text-body", className)}>
      <span className="flex w-24 shrink-0 items-center gap-2 text-ink-muted">
        <span className="grid size-[16px] shrink-0 place-items-center">{icon}</span>
        {PAYER[payer]}
      </span>
      <span className="min-w-0 flex-1 truncate text-ink">{label}</span>
      <span className={cn("shrink-0 tabular-nums", amount > 0 ? "text-success" : amount < 0 ? "text-danger" : "text-ink-muted")}>
        {amount > 0 ? "+" : amount < 0 ? "−" : ""}
        {unit} {formatNumber(Math.abs(Math.round(amount)))}
      </span>
    </div>
  );
}

/** The bottom line: bold, no icon, no colour. */
export function FeeTotal({ label, amount, unit = "Rp", className }: { label: React.ReactNode; amount: number; unit?: string; className?: string }) {
  return (
    <div className={cn("flex h-row items-center justify-between gap-3 rounded-item bg-fill px-2.5 text-body font-semibold", className)}>
      <span>{label}</span>
      <span className="tabular-nums">
        {amount < 0 ? "−" : ""}
        {unit} {formatNumber(Math.abs(Math.round(amount)))}
      </span>
    </div>
  );
}
