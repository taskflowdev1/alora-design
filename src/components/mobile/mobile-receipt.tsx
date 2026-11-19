import { cn, formatRp } from "@/lib/ad";

export interface ReceiptLine {
  name: string;
  qty: number;
  /** Unit price. */
  price: number;
}

export interface MobileReceiptProps {
  shop: string;
  /** "POS-0417". */
  number: string;
  /** "Today, 14:20". */
  time: string;
  lines: ReceiptLine[];
  /** A discount as a positive amount. */
  discount?: number;
  /** Paid with: "Cash", "QRIS". */
  method: string;
  /** Cash handed over (shows the change). */
  received?: number;
  /** Who served ("Bayu"). */
  cashier?: string;
  className?: string;
}

/**
 * A sale's receipt on screen: a soft card with rounded corners (never a torn or zigzag edge), the shop, then the items
 * (name, quantity × price, line total), then totals and payment. Groups are told apart by space, never by rules. The
 * total is the one bold number. Tabular figures keep the amounts in a column.
 */
export function MobileReceipt({ shop, number, time, lines, discount = 0, method, received, cashier, className }: MobileReceiptProps) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const total = subtotal - discount;
  const row = "flex items-baseline justify-between gap-3 text-[15px]";
  return (
    <article aria-label={`Receipt ${number}`} className={cn("grid gap-5 rounded-card bg-surface p-[calc(var(--ad-pad)*1.25)] shadow-card", className)}>
      <header className="grid justify-items-center gap-1 text-center">
        <h2 className="text-[17px] font-semibold">{shop}</h2>
        <p className="text-[13px] tabular-nums text-ink-muted">
          {number} · {time}
          {cashier ? ` · ${cashier}` : ""}
        </p>
      </header>
      <ul className="grid gap-2.5">
        {lines.map((l) => (
          <li key={l.name} className="grid gap-0.5">
            <span className={row}>
              <span className="min-w-0 truncate">{l.name}</span>
              <span className="shrink-0 tabular-nums">{formatRp(l.qty * l.price)}</span>
            </span>
            <span className="text-[13px] tabular-nums text-ink-muted">
              {l.qty} × {formatRp(l.price)}
            </span>
          </li>
        ))}
      </ul>
      <div className="grid gap-1.5">
        <p className={cn(row, "text-ink-muted")}>
          <span>Subtotal</span>
          <span className="tabular-nums">{formatRp(subtotal)}</span>
        </p>
        {discount ? (
          <p className={cn(row, "text-ink-muted")}>
            <span>Discount</span>
            <span className="tabular-nums">−{formatRp(discount)}</span>
          </p>
        ) : null}
        <p className={cn(row, "pt-1 text-[17px] font-semibold")}>
          <span>Total</span>
          <span className="tabular-nums">{formatRp(total)}</span>
        </p>
      </div>
      <div className="grid gap-1.5">
        <p className={row}>
          <span className="text-ink-muted">{method}</span>
          <span className="tabular-nums">{formatRp(received ?? total)}</span>
        </p>
        {received != null && received > total ? (
          <p className={row}>
            <span className="text-ink-muted">Change</span>
            <span className="tabular-nums">{formatRp(received - total)}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
