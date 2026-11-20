import * as React from "react";
import { Home, Package, Search as SearchIcon, ShoppingBag } from "react-feather";
import { cn } from "@/lib/ad";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Thumb } from "@/components/ui/thumb";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast, ToastView } from "@/components/ui/toast";
import { MobileTab, MobileTabBar } from "@/components/mobile/mobile-tab-bar";
import { InlineEdit, grouped } from "@/components/ui/inline-edit";
import { ORDERS, PRODUCTS } from "../data";

/* ------------------------------------------------------------ B14 products, edit in place */

export function ProductsCard({ className }: { className?: string }) {
  const [rows, setRows] = React.useState(PRODUCTS.slice(0, 8).map((p) => ({ ...p })));
  const [sel, setSel] = React.useState<string[]>([PRODUCTS[1].sku]);
  const all = sel.length === rows.length ? true : sel.length ? "indeterminate" : false;
  const table = (list: typeof rows) => (
    <Table>
      <THead>
        <tr>
          <TH width={36}>
            <Checkbox aria-label="Select all" checked={all} onCheckedChange={(v) => setSel(v === true ? rows.map((r) => r.sku) : [])} />
          </TH>
          <TH>Product</TH>
          <TH align="right">Price</TH>
          <TH align="right">Stock</TH>
        </tr>
      </THead>
      <TBody>
        {list.map((r) => {
          const i = rows.indexOf(r);
          return (
            <TRow key={r.sku} selected={sel.includes(r.sku)}>
              <TD>
                <Checkbox aria-label={`Select ${r.name}`} checked={sel.includes(r.sku)} onCheckedChange={(v) => setSel(v === true ? [...sel, r.sku] : sel.filter((s) => s !== r.sku))} />
              </TD>
              <TD maxWidth={240}>
                <span className="flex min-w-0 items-center gap-2.5">
                  <Thumb alt={r.name} size={24} />
                  <span className="truncate">{r.name}</span>
                </span>
              </TD>
              <TD align="right" className="w-36">
                <InlineEdit
                  align="right"
                  aria-label={`${r.name} price`}
                  inputMode="numeric"
                  value={String(r.price)}
                  prefix="Rp"
                  {...grouped}
                  validate={(v) => (/^\d+$/.test(v) ? null : "Numbers only")}
                  onSave={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, price: Number(v) } : x)))}
                />
              </TD>
              <TD align="right" className="w-24">
                <InlineEdit
                  align="right"
                  aria-label={`${r.name} stock`}
                  inputMode="numeric"
                  value={String(r.stock)}
                  validate={(v) => (/^\d+$/.test(v) ? null : "Numbers only")}
                  onSave={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, stock: Number(v) } : x)))}
                />
              </TD>
            </TRow>
          );
        })}
      </TBody>
    </Table>
  );
  return (
    <Card inset="nest" className={cn("min-w-0", className)}>
      <Tabs defaultValue="all">
        <div className="flex min-h-control flex-wrap items-center justify-between gap-gap px-2 pt-2">
          <h3 className="text-title font-semibold">Products</h3>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="low">Low stock</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="all" className="mt-nest">
          {table(rows)}
        </TabsContent>
        <TabsContent value="low" className="mt-nest">
          {table(rows.filter((r) => r.stock < 5))}
        </TabsContent>
      </Tabs>
    </Card>
  );
}

/* ------------------------------------------------------------ B15 low stock */

export function LowStockCard({ className }: { className?: string }) {
  const low = PRODUCTS.filter((p) => p.stock < 5).slice(0, 4);
  return (
    <Card inset="nest" className={cn("flex min-w-0 flex-col gap-nest", className)}>
      <CardHeader title="Low stock" action={<Badge>{low.length}</Badge>} className="px-2 pt-2" />
      <AttentionList>
        {low.map((p) => (
          <AttentionItem key={p.sku} media={<Thumb alt={p.name} />} title={p.name} meta={p.sku} value={p.stock === 0 ? "Out" : `${p.stock} left`} onClick={() => toast(`Restock ${p.name}`, "neutral")} />
        ))}
      </AttentionList>
    </Card>
  );
}

/* ------------------------------------------------------------ B16 the phone view */

export function PhoneCard({ className }: { className?: string }) {
  const [at, setAt] = React.useState("Orders");
  return (
    <Card inset="none" className={cn("relative min-h-[420px] min-w-0 overflow-hidden [transform:translateZ(0)]", className)}>
      <div className="grid gap-nest p-[calc(var(--ad-nest)*2)] pb-28">
        <CardHeader title="To pack" action={<Badge>3</Badge>} className="px-2 pt-2" />
        {ORDERS.slice(0, 3).map((o) => (
          <div key={o.id} className="flex items-center gap-2.5 rounded-item bg-fill px-2.5 py-2">
            <Thumb alt={o.items} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body">{o.items}</p>
              <p className="text-small tabular-nums text-ink-muted">{o.id}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-[84px] flex justify-end">
        <ToastView>3 orders packed</ToastView>
      </div>
      <MobileTabBar className="absolute">
        {(
          [
            [Home, "Home"],
            [ShoppingBag, "Orders"],
            [Package, "Stock"],
            [SearchIcon, "Search"],
          ] as const
        ).map(([I, l]) => (
          <MobileTab key={l} icon={I} label={l} active={at === l} onClick={() => setAt(l)} />
        ))}
      </MobileTabBar>
    </Card>
  );
}
