import * as React from "react";
import { Plus, X } from "react-feather";
import { cn, formatNumber, formatRp, prefersReducedMotion } from "@/lib/ad";
import { useEdgeFade } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RollingNumber } from "@/components/ui/number-dial";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Select } from "@/components/ui/select";

export interface LineItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface LineProduct {
  name: string;
  price: number;
}

export interface LineItemsProps {
  defaultItems?: LineItem[];
  /** What "Add item" offers. A product already on the invoice leaves the list. */
  catalog?: LineProduct[];
  /** 0.11 is PPN 11%. */
  taxRate?: number;
  taxLabel?: string;
  /** Rows the list holds before it scrolls inside itself; its height never changes. */
  rows?: number;
  onItemsChange?: (items: LineItem[]) => void;
  className?: string;
}

const LEAVE = 220;

const CSS = `
.ad-li { container-type: inline-size; --li-row: 72px; }
.ad-li-row {
  display: grid; align-items: center; column-gap: var(--ad-gap); row-gap: 2px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: "name name total" "qty price x";
}
.ad-li-head { display: none; }
.ad-li-list { height: calc(var(--li-rows) * var(--li-row)); }
@container (min-width: 500px) {
  .ad-li-list { --li-row: 44px; }
  .ad-li-row {
    grid-template-columns: minmax(0, 1fr) 104px 92px 112px var(--ad-item-h);
    grid-template-areas: "name qty price total x";
  }
  .ad-li-head { display: grid; }
  .ad-li-price { text-align: right; }
  .ad-li-sum { margin-right: calc(var(--ad-item-h) + var(--ad-gap)); }
}
@container (max-width: 499.98px) { .ad-li-list { --li-row: 72px; } }
@keyframes ad-li-in { from { grid-template-rows: 0fr; opacity: 0; transform: translateY(-6px); } }
.ad-li-enter { animation: ad-li-in 260ms var(--ad-ease); }
@media (prefers-reduced-motion: reduce) { .ad-li-enter { animation: none; } }`;

const amount = (n: number) => formatNumber(Math.round(n));

function TotalLine({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={cn("text-body", strong ? "font-medium text-ink" : "text-ink-muted")}>{label}</span>
      <span className={cn("flex items-baseline tabular-nums", strong ? "text-[22px] font-semibold tracking-[-0.02em] text-ink" : "text-body text-ink")}>
        <span className={cn("mr-1 font-medium text-ink-muted", strong ? "text-small tracking-normal" : "text-body")}>Rp</span>
        <RollingNumber value={Math.round(value)} format={amount} />
      </span>
    </div>
  );
}

/**
 * An invoice's lines: product, quantity, price and total. A new row slides in, a changed quantity rolls its total with
 * the subtotal, tax and grand total in step, and a removed row collapses. The list has a fixed height and the totals
 * sit under it, so they never jump.
 */
export function LineItems({ defaultItems = [], catalog = [], taxRate = 0.11, taxLabel = "PPN 11%", rows = 4, onItemsChange, className }: LineItemsProps) {
  const [items, setItems] = React.useState(defaultItems);
  const [leaving, setLeaving] = React.useState<string[]>([]);
  const [fresh, setFresh] = React.useState<string | null>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const nextId = React.useRef(0);
  const timers = React.useRef(new Set<number>());
  useEdgeFade(list);
  React.useEffect(() => {
    const live = timers.current;
    return () => live.forEach((t) => window.clearTimeout(t));
  }, []);

  const latest = React.useRef(items);
  const commit = (next: LineItem[]) => {
    latest.current = next;
    setItems(next);
    onItemsChange?.(next);
  };
  const counted = items.filter((i) => !leaving.includes(i.id));
  const subtotal = counted.reduce((sum, i) => sum + i.qty * i.price, 0);
  const tax = Math.round(subtotal * taxRate);
  const remaining = catalog.filter((p) => !items.some((i) => i.name === p.name && !leaving.includes(i.id)));

  const add = (name: string) => {
    const product = catalog.find((p) => p.name === name);
    if (!product) return;
    const id = `line-${++nextId.current}`;
    setFresh(id);
    commit([...items, { id, name: product.name, price: product.price, qty: 1 }]);
    requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" }));
  };

  const remove = (id: string, button: HTMLElement) => {
    const all = [...(list.current?.querySelectorAll<HTMLElement>("[data-li-remove]:not(:disabled)") ?? [])];
    const at = all.indexOf(button);
    (all[at + 1] ?? all[at - 1])?.focus({ preventScroll: true });
    const finish = () => {
      setLeaving((l) => l.filter((x) => x !== id));
      commit(latest.current.filter((i) => i.id !== id));
    };
    if (prefersReducedMotion()) return finish();
    setLeaving((l) => [...l, id]);
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      finish();
    }, LEAVE);
    timers.current.add(t);
  };

  return (
    <Card className={cn("ad-li grid min-w-0 gap-3", className)}>
      <style href="ad-line-items" precedence="default">
        {CSS}
      </style>
      <div role="table" aria-label="Invoice lines" className="-mx-2 grid min-w-0 gap-1">
        <div role="row" className="ad-li-row ad-li-head px-2 text-small text-ink-muted">
          <span role="columnheader" style={{ gridArea: "name" }}>
            Product
          </span>
          <span role="columnheader" className="text-center" style={{ gridArea: "qty" }}>
            Qty
          </span>
          <span role="columnheader" className="text-right" style={{ gridArea: "price" }}>
            Price
          </span>
          <span role="columnheader" className="text-right" style={{ gridArea: "total" }}>
            Total
          </span>
          <span role="columnheader" aria-label="Remove" style={{ gridArea: "x" }} />
        </div>
        <div ref={list} role="rowgroup" className="ad-li-list min-w-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none]" style={{ ["--li-rows" as string]: rows }}>
          {items.length ? null : <div className="grid h-full place-items-center text-body text-ink-muted">No items yet</div>}
          {items.map((item) => {
            const out = leaving.includes(item.id);
            return (
              <div
                key={item.id}
                role="row"
                aria-hidden={out || undefined}
                className={cn("grid transition-[grid-template-rows,opacity] duration-[220ms] ease-ad", out ? "pointer-events-none grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]", fresh === item.id && "ad-li-enter")}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="ad-li-row group box-border h-[var(--li-row)] rounded-item px-2 transition-colors duration-[150ms] ease-ad focus-within:bg-fill [@media(hover:hover)]:hover:bg-fill">
                    <span role="cell" className="min-w-0 truncate text-body text-ink" style={{ gridArea: "name" }}>
                      {item.name}
                    </span>
                    <span role="cell" className="justify-self-start" style={{ gridArea: "qty" }}>
                      <QuantityStepper
                        size="sm"
                        aria-label={`Quantity of ${item.name}`}
                        value={item.qty}
                        min={1}
                        max={999}
                        onValueChange={(qty) => commit(items.map((i) => (i.id === item.id ? { ...i, qty } : i)))}
                        className="bg-fill group-hover:bg-fill-strong group-focus-within:bg-fill-strong"
                      />
                    </span>
                    <span role="cell" className="ad-li-price min-w-0 truncate text-body tabular-nums text-ink-muted" style={{ gridArea: "price" }}>
                      {formatRp(item.price)}
                    </span>
                    <span role="cell" className="justify-self-end text-body font-medium text-ink" style={{ gridArea: "total" }}>
                      <RollingNumber value={item.qty * item.price} format={formatRp} />
                    </span>
                    <span role="cell" className="justify-self-end" style={{ gridArea: "x" }}>
                      <Button
                        data-li-remove=""
                        variant="ghost"
                        size="sm"
                        icon
                        disabled={out}
                        aria-label={`Remove ${item.name}`}
                        onClick={(e) => remove(item.id, e.currentTarget)}
                        className="group-hover:bg-transparent hover:!bg-fill-strong focus-visible:!bg-fill-strong [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
                      >
                        <X />
                      </Button>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-end justify-between gap-4">
        <Select
          aria-label="Add item"
          value=""
          options={remaining.map((p) => ({ value: p.name, label: `${p.name} · ${formatRp(p.price)}` }))}
          onValueChange={add}
          disabled={!remaining.length}
          contentClassName="max-w-[calc(100vw-32px)]"
          renderValue={() => (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Plus size={16} />
              Add item
            </span>
          )}
          className="shrink-0 [&>svg:last-child]:hidden pr-3"
        />
        <div aria-live="polite" className="ad-li-sum grid w-[min(100%,240px)] min-w-0 gap-1">
          <TotalLine label="Subtotal" value={subtotal} />
          <TotalLine label={taxLabel} value={tax} />
          <TotalLine label="Total" value={subtotal + tax} strong />
        </div>
      </div>
    </Card>
  );
}
