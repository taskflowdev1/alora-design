import * as React from "react";
import { Columns, Download, Plus, Printer, Search as SearchIcon } from "react-feather";
import { formatNumber, formatRp, sameDay, startOfWeek } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Status } from "@/components/ui/status";
import { Table, TableBar, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { FilterButton, FilterChecks, FilterGroup } from "@/components/ui/filter-button";
import { MenuItem } from "@/components/ui/menu";
import { MobileList, MobileListRow } from "@/components/mobile/mobile-list";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { Sheet } from "@/components/ui/sheet";
import { MoreMenu, PageHeader, PageSearch } from "@/components/ui/toolbar";
import { toast } from "@/components/ui/toast";
import { LoadingText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ColumnMenu } from "@/components/ui/column-menu";
import { useDoubleTapGuard, useMediaQuery } from "@/lib/ad-hooks";
import { OrderDetail } from "../demos";
import { NOW, ORDERS, SHOPS, smartTime, type OrderStatus } from "../data";
import { NoTranslate, PANE_CLASS, PrimaryAction, Rp, useLoading, usePaneRoom, useWide } from "./shared";

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
  const [shops, setShops] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<string[]>([]);
  const [week, setWeek] = React.useState(NOW);
  const [page, setPage] = React.useState(1);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [cols, setCols] = React.useState(["time", "shop", "customer", "items", "payment", "fee"]);
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const phone = useMediaQuery("(max-width: 767.98px)");
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
        (!shops.length || shops.includes(o.shop)) &&
        (!status.length || status.includes(moved[o.id] ?? o.status)) &&
        (!t || o.id.toLowerCase().includes(t) || o.items.toLowerCase().includes(t) || o.customer.toLowerCase().includes(t)),
    );
  }, [q, shops, status, moved]);
  const pageRows = rows.slice((page - 1) * 50, page * 50);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setBusy(true);
    const id = window.setTimeout(() => setBusy(false), 350);
    return () => window.clearTimeout(id);
  }, [page, shops, week, status]);

  React.useEffect(() => setPage(1), [q, shops, status]);

  const open = ORDERS.find((o) => o.id === openId);
  const openStatus = open ? statusOf(open) : null;
  const next = openStatus === "Paid" ? { status: "Packed" as const, label: "Mark as packed", done: "marked as packed" } : openStatus === "Packed" ? { status: "Shipped" as const, label: "Mark as shipped", done: "marked as shipped" } : null;
  const advance = useDoubleTapGuard(() => {
    if (!open || !next) return;
    setMoved((m) => ({ ...m, [open.id]: next.status }));
    toast(`${open.id} ${next.done}`);
  });
  const room = usePaneRoom(!!open, "[data-orders]");
  const menuCols = wide ? ORDER_COLS : ORDER_COLS.filter((c) => c.key !== "payment" && c.key !== "fee");
  const show = (k: string) => cols.includes(k) && !(room && (k === "payment" || k === "time"));
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;

  return (
    <div className="flex h-[var(--ex-page-h)] min-h-[520px] flex-col gap-4 max-lg:h-auto">
      <PageHeader title="Orders">
        <PageSearch value={q} onValueChange={setQ} placeholder="Search orders" />
        <FilterButton
          count={(shops.length ? 1 : 0) + (status.length ? 1 : 0) + (sameDay(startOfWeek(week), startOfWeek(NOW)) ? 0 : 1)}
          onClear={() => (setShops([]), setStatus([]), setWeek(NOW))}
          done={`Show ${formatNumber(rows.length)} orders`}
        >
          <FilterChecks label="Status" value={status} onValueChange={setStatus} options={STATUSES.map((s) => ({ value: s, label: s }))} />
          <FilterChecks label="Shop" allLabel="All shops" value={shops} onValueChange={setShops} options={SHOPS.map((s) => ({ value: s, label: <span translate="no">{s}</span> }))} />
          <FilterGroup label="Week">
            <PeriodStepper value={week} period="week" onValueChange={setWeek} max={NOW} className="justify-between" />
          </FilterGroup>
        </FilterButton>
        <span className="relative flex">
          <MoreMenu>
            {phone ? null : <MenuItem icon={Columns} onSelect={() => setColumnsOpen(true)}>Columns</MenuItem>}
            <MenuItem icon={Download} onSelect={() => toast("Export started", "neutral")}>Export</MenuItem>
            <MenuItem icon={Printer} onSelect={() => toast("Printing slips", "neutral")}>Print slips</MenuItem>
          </MoreMenu>
          {phone ? null : (
            <ColumnMenu
              open={columnsOpen}
              onOpenChange={setColumnsOpen}
              trigger={<span aria-hidden className="pointer-events-none absolute bottom-0 right-0 size-px" />}
              columns={menuCols}
              visible={cols}
              onVisibleChange={setCols}
              defaults={["time", "shop", "customer", "items", "payment", "fee"]}
            />
          )}
        </span>
        <PrimaryAction icon={Plus} label="Add order" onClick={() => toast("New order")} />
      </PageHeader>
      <Card inset="nest" className="flex min-h-0 flex-1 flex-col max-lg:min-h-[480px]" style={room ? { marginRight: room } : undefined} data-orders>
        {rows.length === 0 ? (
          <EmptyState icon={SearchIcon} title="No orders match" className="flex-1" />
        ) : (
          <>
            {phone ? (
              <MobileList className="min-h-0 flex-1 px-0 [&>[role=list]]:bg-transparent [&>[role=list]]:p-0">
                {pageRows.map((o) => (
                  <MobileListRow
                    key={o.id}
                    onClick={() => setOpenId(o.id)}
                    title={<L><span translate="no">{o.customer}</span></L>}
                    subtitle={<L><span translate="no">{o.id}</span> · {smartTime(o.at)}</L>}
                    value={
                      <span className="grid justify-items-end gap-0.5">
                        <span className="text-ink"><L><Rp>{formatNumber(o.total)}</Rp></L></span>
                        {loading ? <L>{statusOf(o)}</L> : <Status tone={o.status === "Unpaid" ? "attention" : o.status === "Cancelled" ? "muted" : "default"}>{statusOf(o)}</Status>}
                      </span>
                    }
                  />
                ))}
              </MobileList>
            ) : (
            <Table className="min-h-0 flex-1">
              <THead>
                <tr>
                  <TH>Order</TH>
                  {show("time") ? <TH>Time</TH> : null}
                  {show("shop") ? <TH>Shop</TH> : null}
                  {show("customer") ? <TH>Customer</TH> : null}
                  {show("items") ? <TH>Items</TH> : null}
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
            )}
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
