import * as React from "react";
import { Download, Plus, Search as SearchIcon } from "react-feather";
import { formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Status } from "@/components/ui/status";
import { Table, TableBar, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { Search } from "@/components/ui/search";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { Sheet } from "@/components/ui/sheet";
import { PageHeader, Toolbar } from "@/components/ui/toolbar";
import { toast } from "@/components/ui/toast";
import { LoadingText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ColumnMenu } from "@/components/ui/column-menu";
import { useDoubleTapGuard } from "@/lib/ad-hooks";
import { OrderDetail } from "../demos";
import { NOW, ORDERS, SHOPS, smartTime, type OrderStatus } from "../data";
import { NoTranslate, PANE_CLASS, useLoading, usePaneRoom, useWide } from "./shared";

/* ------------------------------------------------------------ orders */

const STATUSES: OrderStatus[] = ["Unpaid", "Paid", "Packed", "Shipped", "Cancelled"];
const ORDER_COLS = [
  { key: "order", label: "Order", locked: true },
  { key: "time", label: "Time" },
  { key: "shop", label: "Shop" },
  { key: "customer", label: "Customer" },
  { key: "items", label: "Items" },
  { key: "payment", label: "Payment" },
  { key: "status", label: "Status", locked: true },
  { key: "total", label: "Total", locked: true },
  { key: "fee", label: "Fee" },
];

export function Orders() {
  const forcedLoading = useLoading();
  const [q, setQ] = React.useState("");
  const [shop, setShop] = React.useState("all");
  const [status, setStatus] = React.useState<string[]>([]);
  const [week, setWeek] = React.useState(NOW);
  const [page, setPage] = React.useState(1);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [cols, setCols] = React.useState(["time", "shop", "customer", "items", "payment", "fee"]);
  // Orders moved on from the pane (packed, then shipped): the table and the pane's steps follow.
  const [moved, setMoved] = React.useState<Record<string, OrderStatus>>({});
  const statusOf = (o: (typeof ORDERS)[number]): OrderStatus => moved[o.id] ?? o.status;
  const wide = useWide();
  const [busy, setBusy] = React.useState(false);
  const loading = forcedLoading || busy;
  const first = React.useRef(true);

  const rows = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    return ORDERS.filter(
      (o) =>
        (shop === "all" || o.shop === shop) &&
        (!status.length || status.includes(moved[o.id] ?? o.status)) &&
        (!t || o.id.toLowerCase().includes(t) || o.items.toLowerCase().includes(t) || o.customer.toLowerCase().includes(t)),
    );
  }, [q, shop, status, moved]);
  const pageRows = rows.slice((page - 1) * 50, page * 50);

  // A filter or page change shows the skeleton, the same shape as the rows that arrive.
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setBusy(true);
    const id = window.setTimeout(() => setBusy(false), 350);
    return () => window.clearTimeout(id);
  }, [page, shop, week, status]);

  React.useEffect(() => setPage(1), [q, shop, status]);

  const open = ORDERS.find((o) => o.id === openId);
  const openStatus = open ? statusOf(open) : null;
  const next = openStatus === "Paid" ? { status: "Packed" as const, label: "Mark as packed", done: "marked as packed" } : openStatus === "Packed" ? { status: "Shipped" as const, label: "Mark as shipped", done: "marked as shipped" } : null;
  // One step per press: the second click of a double click must not pack and ship at once.
  const advance = useDoubleTapGuard(() => {
    if (!open || !next) return;
    setMoved((m) => ({ ...m, [open.id]: next.status }));
    toast(`${open.id} ${next.done}`);
  });
  const room = usePaneRoom(!!open, "[data-orders]");
  // Below xl, Payment and Fee give way so Status and Total stay in view; the menu lists only what can show.
  const menuCols = wide ? ORDER_COLS : ORDER_COLS.filter((c) => c.key !== "payment" && c.key !== "fee");
  // Beside the open pane the table is narrower: the pane already shows the time and the payment.
  const show = (k: string) => cols.includes(k) && !(room && (k === "payment" || k === "time"));
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;

  return (
    <div className="flex h-[var(--ex-page-h)] min-h-[520px] flex-col gap-4 max-lg:h-auto">
      <PageHeader title="Orders" />
      <Toolbar>
        <Search value={q} onValueChange={setQ} placeholder="Search orders" wrapperClassName="max-sm:w-full" />
        <Select prefix="Shop" aria-label="Shop" value={shop} onValueChange={setShop} options={[{ value: "all", label: "All" }, ...SHOPS.map((s) => ({ value: s, label: s }))]} />
        {/* "Status · 3" at one fixed width: picking statuses while the menu is open must not grow the trigger and shove the row. */}
        <MultiSelect aria-label="Status" placeholder="Status" maxChips={0} value={status} onValueChange={setStatus} options={STATUSES.map((s) => ({ value: s, label: s }))} className="w-32" />
        <PeriodStepper value={week} period="week" onValueChange={setWeek} max={NOW} />
        {/* Columns, Export and Add stay together at the right end, also when the row wraps (1024). */}
        <div className="ml-auto flex items-center gap-gap">
          <ColumnMenu columns={menuCols} visible={cols} onVisibleChange={setCols} defaults={["time", "shop", "customer", "items", "payment", "fee"]} />
          <Button>
            <Download />
            Export
          </Button>
          <Button variant="primary" className="max-lg:hidden" onClick={() => toast("New order")}>
            <Plus />
            Add order
          </Button>
        </div>
      </Toolbar>
      <Card inset="nest" className="flex min-h-0 flex-1 flex-col max-lg:min-h-[480px]" style={room ? { marginRight: room } : undefined} data-orders>
        {rows.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No orders match" className="flex-1" />
        ) : (
          <>
            <Table className="min-h-0 flex-1">
              <THead>
                <tr>
                  <TH>Order</TH>
                  {show("time") ? <TH>Time</TH> : null}
                  {show("shop") ? <TH>Shop</TH> : null}
                  {show("customer") ? <TH>Customer</TH> : null}
                  {show("items") ? <TH>Items</TH> : null}
                  {/* Below xl the payment method gives way, so Status and Total stay in view. */}
                  {show("payment") ? <TH className="max-xl:hidden">Payment</TH> : null}
                  <TH>Status</TH>
                  <TH align="right">Total</TH>
                  {show("fee") ? (
                    <TH align="right" className="max-xl:hidden">
                      Fee
                    </TH>
                  ) : null}
                </tr>
              </THead>
              <TBody>
                {pageRows.map((o) => (
                  <TRow key={o.id} selected={o.id === openId} onActivate={() => setOpenId(o.id)}>
                    <TD>
                      <NoTranslate>
                        <L>{o.id}</L>
                      </NoTranslate>
                    </TD>
                    {show("time") ? (
                      <TD className="text-ink-muted">
                        <L>{smartTime(o.at)}</L>
                      </TD>
                    ) : null}
                    {show("shop") ? (
                      <TD>
                        <NoTranslate>
                          <L>{o.shop}</L>
                        </NoTranslate>
                      </TD>
                    ) : null}
                    {show("customer") ? (
                      <TD>
                        <NoTranslate>
                          <L>{o.customer}</L>
                        </NoTranslate>
                      </TD>
                    ) : null}
                    {show("items") ? (
                      <TD maxWidth={220}>
                        <NoTranslate>
                          <L>{o.items}</L>
                        </NoTranslate>
                      </TD>
                    ) : null}
                    {show("payment") ? (
                      <TD className="max-xl:hidden">
                        <L>{o.payment}</L>
                      </TD>
                    ) : null}
                    <TD>
                      {loading ? (
                        <L>{statusOf(o)}</L>
                      ) : (
                        <Status tone={o.status === "Unpaid" ? "attention" : o.status === "Cancelled" ? "muted" : "default"}>{statusOf(o)}</Status>
                      )}
                    </TD>
                    <TD align="right">
                      <L>{formatRp(o.total)}</L>
                    </TD>
                    {show("fee") ? (
                      <TD align="right" className="text-ink-muted max-xl:hidden">
                        <L>{formatRp(o.fee)}</L>
                      </TD>
                    ) : null}
                  </TRow>
                ))}
              </TBody>
            </Table>
            <TableBar page={page} total={rows.length} onPageChange={setPage} className="mt-1 shrink-0" />
          </>
        )}
      </Card>
      <Sheet
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        modal={false}
        keepOpenOn="[data-orders]"
        title={open ? <NoTranslate>{open.id}</NoTranslate> : null}
        className={PANE_CLASS}
        footer={
          <>
            <Button onClick={() => toast("Invoice sent", "neutral")}>Send invoice</Button>
            {/* The next step for this order: pack a paid one, ship a packed one. */}
            {next ? (
              <Button variant="primary" onClick={advance}>
                {next.label}
              </Button>
            ) : null}
          </>
        }
      >
        {open ? <OrderDetail id={open.id} status={openStatus ?? undefined} /> : null}
      </Sheet>
    </div>
  );
}
