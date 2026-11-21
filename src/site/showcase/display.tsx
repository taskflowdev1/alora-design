import * as React from "react";
import { Inbox } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, MetricCard } from "@/components/ui/card";
import { Table, TableBar, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { AttentionItem, AttentionList } from "@/components/ui/attention-list";
import { BarChart } from "@/components/ui/bar-chart";
import { Chip, ChipGroup, Status } from "@/components/ui/status";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Thumb } from "@/components/ui/thumb";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading, LoadingText, Skeleton } from "@/components/ui/skeleton";
import { DAILY, ORDERS, PRODUCTS, TEAM, itemPhoto, productPhoto, smartTime } from "../data";
import { Head, Mark, Tile, stack } from "../mark";
import { tone } from "./actions";
import { say } from "./shared";

/* ------------------------------------------------------------ Display */

export function TableTile({ className }: { className?: string }) {
  const [chip, setChip] = React.useState("all");
  const [sel, setSel] = React.useState<string | null>(ORDERS[1].id);
  const [page, setPage] = React.useState(1);
  const rows = ORDERS.filter((o) => chip === "all" || o.status === chip).slice(0, 6);
  return (
    <Tile className={className}>
      <div className="flex min-h-control flex-wrap items-center gap-gap px-2 pt-1">
        <h3 className="mr-auto text-title font-semibold">Orders</h3>
        <Mark name="status">
          <ChipGroup aria-label="Order status" className="items-center">
          {[
            ["all", "All"],
            ["Unpaid", "Unpaid"],
            ["Paid", "To pack"],
            ["Shipped", "Shipped"],
          ].map(([k, l]) => (
            <Chip key={k} selected={chip === k} onClick={() => setChip(k)}>
              {l}
            </Chip>
          ))}
          </ChipGroup>
        </Mark>
      </div>
      <Mark name="table" className="flex-1">
        <Table>
          <THead>
            <tr>
              <TH>Order</TH>
              <TH>Time</TH>
              <TH>Items</TH>
              <TH>Status</TH>
              <TH align="right">Total</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((o, i) => (
              <TRow key={o.id} selected={sel === o.id} onActivate={() => setSel(o.id)}>
                <TD>{o.id}</TD>
                <TD className="text-ink-muted">{smartTime(o.at)}</TD>
                <TD maxWidth={240}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    {i === 0 ? (
                      <Mark name="thumb" className="shrink-0">
                        <Thumb src={itemPhoto(o.items)} alt={o.items} size={24} />
                      </Mark>
                    ) : (
                      <Thumb src={itemPhoto(o.items)} alt={o.items} size={24} />
                    )}
                    <span className="truncate">{o.items}</span>
                  </span>
                </TD>
                <TD>
                  <Status tone={tone(o)}>{o.status}</Status>
                </TD>
                <TD align="right">{formatRp(o.total)}</TD>
              </TRow>
            ))}
          </TBody>
        </Table>
        <TableBar page={page} total={1240} onPageChange={setPage} className="mt-1" />
      </Mark>
    </Tile>
  );
}

export function NumbersStack({ className }: { className?: string }) {
  return (
    <div className={cn(stack, "lg:grid-rows-[auto_1fr]", className)}>
      <Mark name="metric-card" className="grid grid-cols-2 gap-4">
        <MetricCard variant="scale" label="Orders" value={312} delta={{ value: "3,1%", direction: "down" }} className="w-full" />
        <MetricCard variant="scale" label="Cancelled" value={4} className="w-full" />
      </Mark>
      <Tile>
        <Head title="Last 30 days" />
        <Mark name="bar-chart" className="mx-2 mt-auto">
          <BarChart data={DAILY} current={29} labelEvery={5} height={120} aria-label="Sales, last 30 days" />
        </Mark>
      </Tile>
    </div>
  );
}

export function ShopCardTile({ className }: { className?: string }) {
  return (
    <Mark name="card" className={cn("flex", className)}>
      <Card interactive className="flex flex-1 flex-col gap-3">
        <CardHeader title="Kemang" action={<Status>Open</Status>} />
        <div className="grid gap-1.5 text-body">
          <div className="flex justify-between gap-3">
            <span className="text-ink-muted">Sales today</span>
            <span className="whitespace-nowrap tabular-nums">{formatRp(12400000)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-ink-muted">Orders</span>
            <span className="tabular-nums">84</span>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-body text-ink-muted">On shift</span>
          <Mark name="avatar" className="flex items-center gap-1.5">
            <Avatar name={TEAM[1].name} size="sm" />
            <Avatar name={TEAM[2].name} size="sm" />
          </Mark>
        </div>
      </Card>
    </Mark>
  );
}

export function LowStockTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Head
        title="Low stock"
        action={
          <Mark name="badge">
            <Badge>4</Badge>
          </Mark>
        }
      />
      <Mark name="attention-list">
        <AttentionList>
          {PRODUCTS.filter((p) => p.stock < 4)
            .slice(0, 3)
            .map((p) => (
              <AttentionItem key={p.sku} media={<Thumb src={productPhoto(p.sku)} alt={p.name} />} title={p.name} meta={p.sku} value={p.stock === 0 ? "Out" : `${p.stock} left`} onClick={say(p.name)} />
            ))}
        </AttentionList>
      </Mark>
    </Tile>
  );
}

export function AlertsTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Mark name="alert" className="grid gap-2">
        <Alert tone="attention" title="2 shops haven’t synced" action={<Button size="sm">Sync</Button>} />
        <Alert tone="danger" title="Payout failed">
          The bank rejected the account number.
        </Alert>
      </Mark>
      <Mark name="progress" className="mx-2 mt-auto grid gap-2 pb-1 text-body">
        <div className="flex justify-between gap-3">
          <span>Adding up 1.240 sales</span>
          <span className="tabular-nums text-ink-muted">64%</span>
        </div>
        <Progress value={64} aria-label="Import" />
      </Mark>
    </Tile>
  );
}

export function EmptyLoadingStack({ className }: { className?: string }) {
  return (
    <div className={cn(stack, className)}>
      <Tile>
        <Mark name="skeleton" className="flex items-center gap-3 px-1 py-1">
          <Loading loading>
            <Avatar name="Rizky Hartono" />
          </Loading>
          <div className="grid min-w-0 flex-1 gap-1">
            <span className="text-body">
              <LoadingText loading>Rizky Hartono</LoadingText>
            </span>
            <Skeleton className="h-3 w-20" />
          </div>
        </Mark>
      </Tile>
      <Tile className="justify-center">
        <Mark name="empty-state">
          <EmptyState icon={Inbox} title="No returns yet" className="py-4" />
        </Mark>
      </Tile>
    </div>
  );
}
