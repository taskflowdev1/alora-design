import * as React from "react";
import { Archive, Box, Copy, Download, FileText, MoreHorizontal, Printer, Search as SearchIcon, Trash2, Truck, Upload } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBar, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { Toolbar } from "@/components/ui/toolbar";
import { Search } from "@/components/ui/search";
import { Popover } from "@/components/ui/popover";
import { CheckboxField } from "@/components/ui/checkbox";
import { Chip, ChipGroup, Status } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading, LoadingText } from "@/components/ui/skeleton";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { Menu, MenuGroup, MenuItem, MenuSub } from "@/components/ui/menu";
import { Diff } from "@/components/ui/diff";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { ShopPicker } from "@/components/ui/shop-picker";
import { SplitButton } from "@/components/ui/split-button";
import { ContextMenu, ContextMenuGroup, ContextMenuItem, ContextMenuSub } from "@/components/ui/context-menu";
import { HoverCard } from "@/components/ui/hover-card";
import { ColumnMenu } from "@/components/ui/column-menu";
import { MARKET_SHOPS, NOW, ORDERS, smartTime, type Order } from "../data";
import { OrderDetail } from "../demos";
import { diffOf, marketOf, shopName, useBusy } from "./shared";

/* ------------------------------------------------------------ B1 orders */

const ORDER_COLUMNS = [
  { key: "order", label: "Order", locked: true },
  { key: "time", label: "Time" },
  { key: "shop", label: "Shop" },
  { key: "customer", label: "Customer" },
  { key: "payment", label: "Payment" },
  { key: "status", label: "Status", locked: true },
  { key: "total", label: "Total", locked: true },
  { key: "diff", label: "Difference", locked: true },
];
const ORDER_DEFAULT_COLS = ["time", "shop", "customer"];

const CHIPS = [
  { key: "all", label: "All" },
  { key: "Unpaid", label: "Unpaid" },
  { key: "Paid", label: "To pack" },
  { key: "Shipped", label: "Shipped" },
];

function CustomerName({ o }: { o: Order }) {
  return (
    <HoverCard
      trigger={
        <a href="#customer" onClick={(e) => (e.preventDefault(), e.stopPropagation())} className="rounded-small text-ink hover:bg-fill focus-visible:bg-fill">
          {o.customer}
        </a>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar name={o.customer} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold">{o.customer}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-body">
        {[
          ["Orders", "14"],
          ["Spent", "Rp 3,2 jt"],
          ["Returns", "0"],
        ].map(([k, v]) => (
          <div key={k} className="grid gap-0.5 rounded-item bg-fill px-2.5 py-2">
            <span className="text-small text-ink-muted">{k}</span>
            <span className="font-semibold tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </HoverCard>
  );
}

export function OrdersCard({ className }: { className?: string }) {
  const [q, setQ] = React.useState("");
  const [shops, setShops] = React.useState(MARKET_SHOPS.map((s) => s.id));
  const [week, setWeek] = React.useState(NOW);
  const [chip, setChip] = React.useState("all");
  const [cols, setCols] = React.useState(ORDER_DEFAULT_COLS);
  const [unpaidOnly, setUnpaidOnly] = React.useState(false);
  const [codOnly, setCodOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [open, setOpen] = React.useState<Order | null>(null);
  const [loading, kick] = useBusy();
  const on = (k: string) => cols.includes(k);
  const filter = <T,>(set: (v: T) => void) => (v: T) => (set(v), setPage(1), kick());

  const weekOffset = Math.round((NOW.getTime() - week.getTime()) / (7 * 864e5)) * 40;
  const markets = new Set(MARKET_SHOPS.filter((s) => shops.includes(s.id)).map((s) => s.market));
  const rows = ORDERS.slice(weekOffset).filter(
    (o) =>
      markets.has(marketOf(o.shop)) &&
      (chip === "all" || o.status === chip) &&
      (!unpaidOnly || o.status === "Unpaid") &&
      (!codOnly || o.payment === "COD") &&
      (!q || `${o.id} ${o.items} ${o.customer}`.toLowerCase().includes(q.toLowerCase())),
  );
  const shown = rows.slice((page - 1) * 50, (page - 1) * 50 + 14);
  const L = ({ children }: { children: React.ReactNode }) => <LoadingText loading={loading}>{children}</LoadingText>;

  return (
    <Card inset="nest" className={cn("flex min-w-0 flex-col gap-gap", className)}>
      <div className="flex min-h-control flex-wrap items-center gap-gap px-2 pt-2">
        <h3 className="mr-auto text-title font-semibold">Orders</h3>
        <Menu
          align="end"
          trigger={
            <Button variant="ghost" icon aria-label="More order actions">
              <MoreHorizontal />
            </Button>
          }
        >
          <MenuItem icon={Download} onSelect={() => toast("Exporting 1.240 orders", "neutral")}>
            Export
          </MenuItem>
          <MenuItem icon={Upload} onSelect={() => toast("Choose a file to import", "neutral")}>
            Import
          </MenuItem>
          <MenuSub icon={Printer} label="Print">
            <MenuItem onSelect={() => toast("Printing 12 slips", "neutral")}>Packing slips</MenuItem>
            <MenuItem onSelect={() => toast("Printing 12 invoices", "neutral")}>Invoices</MenuItem>
          </MenuSub>
          <MenuGroup>
            <MenuItem icon={Archive} onSelect={() => toast("Archived last month", "neutral")}>
              Archive last month
            </MenuItem>
          </MenuGroup>
        </Menu>
        <SplitButton
          onClick={() => toast("12 orders packed")}
          menu={
            <>
              <MenuItem icon={Printer} onSelect={() => toast("Printing slips", "neutral")}>
                Pack and print slips
              </MenuItem>
              <MenuItem icon={Truck} onSelect={() => toast("Courier booked", "neutral")}>
                Pack and book courier
              </MenuItem>
            </>
          }
        >
          <Box />
          Pack 12
        </SplitButton>
      </div>
      <Toolbar className="px-2">
        <Search value={q} onValueChange={filter(setQ)} placeholder="Order or product" />
        <ShopPicker shops={MARKET_SHOPS} value={shops} onValueChange={filter(setShops)} />
        <PeriodStepper period="week" value={week} onValueChange={filter(setWeek)} max={NOW} />
        <Popover trigger={<Button>Filter</Button>}>
          <div className="grid w-52 gap-2.5">
            <CheckboxField label="Unpaid only" checked={unpaidOnly} onCheckedChange={(v) => filter(setUnpaidOnly)(v === true)} />
            <CheckboxField label="Cash on delivery" checked={codOnly} onCheckedChange={(v) => filter(setCodOnly)(v === true)} />
          </div>
        </Popover>
        <ColumnMenu columns={ORDER_COLUMNS} visible={cols} onVisibleChange={setCols} defaults={ORDER_DEFAULT_COLS} />
      </Toolbar>
      <ChipGroup aria-label="Order status" className="px-2">
        {CHIPS.map((c) => (
          <Chip key={c.key} selected={chip === c.key} onClick={() => filter(setChip)(c.key)}>
            {c.label}
          </Chip>
        ))}
      </ChipGroup>
      <Table className="min-h-[280px] lg:h-0 lg:flex-1">
        <THead>
          <tr>
            <TH>Order</TH>
            {on("time") ? <TH>Time</TH> : null}
            {on("shop") ? <TH>Shop</TH> : null}
            {on("customer") ? <TH>Customer</TH> : null}
            {on("payment") ? <TH>Payment</TH> : null}
            <TH>Status</TH>
            <TH align="right">Total</TH>
            <TH align="right">Difference</TH>
          </tr>
        </THead>
        <TBody>
          {shown.map((o) => {
            const i = ORDERS.indexOf(o);
            return (
              <ContextMenu
                key={o.id}
                menu={
                  <>
                    <ContextMenuItem icon={FileText} onSelect={() => setOpen(o)}>
                      Open
                    </ContextMenuItem>
                    <ContextMenuItem icon={Copy} onSelect={() => (navigator.clipboard?.writeText(o.id).catch(() => {}), toast(`${o.id} copied`, "neutral"))}>
                      Copy order number
                    </ContextMenuItem>
                    <ContextMenuSub icon={Truck} label="Move to">
                      <ContextMenuItem onSelect={() => toast(`${o.id} moved to To pack`, "neutral")}>To pack</ContextMenuItem>
                      <ContextMenuItem onSelect={() => toast(`${o.id} put on hold`, "neutral")}>On hold</ContextMenuItem>
                    </ContextMenuSub>
                    <ContextMenuGroup>
                      <ContextMenuItem icon={Trash2} onSelect={() => toast(`${o.id} cancelled`)}>
                        Cancel order
                      </ContextMenuItem>
                    </ContextMenuGroup>
                  </>
                }
              >
                <TRow selected={open?.id === o.id} onActivate={() => setOpen(o)}>
                  <TD>
                    <L>{o.id}</L>
                  </TD>
                  {on("time") ? (
                    <TD className="text-ink-muted">
                      <L>{smartTime(o.at)}</L>
                    </TD>
                  ) : null}
                  {on("shop") ? (
                    <TD>
                      <Loading loading={loading}>
                        <span className="inline-flex items-center gap-2">
                          <MarketMark market={marketOf(o.shop)} />
                          {shopName(o.shop)}
                        </span>
                      </Loading>
                    </TD>
                  ) : null}
                  {on("customer") ? <TD>{loading ? <L>{o.customer}</L> : <CustomerName o={o} />}</TD> : null}
                  {on("payment") ? (
                    <TD>
                      <L>{o.payment}</L>
                    </TD>
                  ) : null}
                  <TD>
                    <Loading loading={loading}>
                      <Status tone={o.status === "Unpaid" ? "attention" : o.status === "Cancelled" ? "muted" : "default"}>{o.status}</Status>
                    </Loading>
                  </TD>
                  <TD align="right">
                    <L>{formatRp(o.total)}</L>
                  </TD>
                  <TD align="right">
                    <Loading loading={loading}>
                      <Diff value={diffOf(i)} unit="Rp" />
                    </Loading>
                  </TD>
                </TRow>
              </ContextMenu>
            );
          })}
        </TBody>
      </Table>
      {shown.length === 0 ? <EmptyState icon={SearchIcon} title="No orders match" className="py-6" /> : null}
      <TableBar page={page} total={rows.length} onPageChange={setPage} />
      <Sheet
        open={!!open}
        onOpenChange={(v) => !v && setOpen(null)}
        title={open?.id ?? ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => (setOpen(null), toast("Marked as packed"))}>
              Mark as packed
            </Button>
          </>
        }
      >
        {open ? <OrderDetail id={open.id} /> : null}
      </Sheet>
    </Card>
  );
}
