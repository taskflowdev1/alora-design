import * as React from "react";
import { Download, Search as SearchIcon } from "react-feather";
import { formatRp, sameDay, startOfDay } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, MetricCard } from "@/components/ui/card";
import { BarList } from "@/components/ui/bar-chart";
import { Pill, Status } from "@/components/ui/status";
import { Table, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { Sheet } from "@/components/ui/sheet";
import { PageHeader } from "@/components/ui/toolbar";
import { MenuItem } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { Diff } from "@/components/ui/diff";
import { FeeRow, FeeTotal } from "@/components/ui/fee-row";
import { CommentThread, type Comment } from "@/components/ui/comment-thread";
import { CopyChip } from "@/components/ui/copy-chip";
import { SplitButton } from "@/components/ui/split-button";
import { CANCEL_REASONS, CANCELLATIONS, NOW, smartTime, type Cancellation } from "../data";
import { NoTranslate, PANE_CLASS, useLoading, usePaneRoom } from "./shared";

/* ------------------------------------------------------------ cancellations */

const CANCEL_COMMENTS: Comment[] = [
  { id: "1", author: "Dewi Anggraini", time: "Today, 10:20", body: "Shopee kept the admin fee on this one. Opened a dispute.", reactions: [{ emoji: "👀", by: ["Rizky Hartono"] }] },
];

function CancellationDetail({ c }: { c: Cancellation }) {
  const [comments, setComments] = React.useState(CANCEL_COMMENTS);
  const fee = c.market === "offline" ? 0 : Math.round(c.refund * 0.045);
  return (
    <div className="grid gap-6">
      <div className="grid gap-2 text-body">
        {(
          [
            ["Order", <CopyChip key="c" value={c.id} />],
            ["Cancelled", smartTime(c.at)],
            ["Shop", <span key="s" className="inline-flex items-center gap-2"><MarketMark market={c.market} />{c.shop}</span>],
            ["Customer", c.customer],
            ["Reason", c.reason],
          ] as [string, React.ReactNode][]
        ).map(([k, v]) => (
          <div key={k} className="flex min-h-6 items-center justify-between gap-4">
            <span className="text-ink-muted">{k}</span>
            <span className="truncate">{v}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-1.5">
        <h3 className="text-body font-semibold">Refund</h3>
        <div className="-mx-2.5 grid gap-px">
          <FeeRow payer="buyer" label={`Refund, ${c.items}`} amount={-c.refund} />
          {c.market !== "offline" ? <FeeRow payer="platform" market={c.market} label="Admin fee returned" amount={fee + c.feeDiff} /> : null}
          <FeeTotal label="Net" amount={-c.refund + (c.market !== "offline" ? fee + c.feeDiff : 0)} className="mt-1" />
        </div>
        {c.feeDiff ? (
          <div className="flex items-center justify-between px-0 pt-1 text-body">
            <span className="text-ink-muted">Fee not returned</span>
            <Diff value={c.feeDiff} unit="Rp" />
          </div>
        ) : null}
      </div>
      <div className="grid gap-2">
        <h3 className="text-body font-semibold">Notes</h3>
        <CommentThread
          me="Rizky Hartono"
          comments={comments}
          onReact={(id, emoji) =>
            setComments(
              comments.map((x) => {
                if (x.id !== id) return x;
                const rs = x.reactions ?? [];
                const has = rs.find((r) => r.emoji === emoji);
                return {
                  ...x,
                  reactions: has
                    ? rs.map((r) => (r.emoji === emoji ? { ...r, by: r.by.includes("Rizky Hartono") ? r.by.filter((b) => b !== "Rizky Hartono") : [...r.by, "Rizky Hartono"] } : r))
                    : [...rs, { emoji, by: ["Rizky Hartono"] }],
                };
              }),
            )
          }
          onReply={(text) => setComments([...comments, { id: String(comments.length + 1), author: "Rizky Hartono", time: "Today, 14:20", body: text }])}
        />
      </div>
    </div>
  );
}

export function Cancellations() {
  const loading = useLoading();
  const [reason, setReason] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>({ from: new Date(2026, 10, 10), to: NOW });
  const [openId, setOpenId] = React.useState<string | null>(null);
  // The date range narrows everything on the page; a reason bar narrows the table further.
  const from = startOfDay(range.from);
  const to = startOfDay(range.to ?? range.from);
  const inRange = CANCELLATIONS.filter((c) => startOfDay(c.at) >= from && startOfDay(c.at) <= to);
  const rows = inRange.filter((c) => !reason || c.reason === reason);
  const counts = CANCEL_REASONS.map((r) => inRange.filter((c) => c.reason === r).length);
  const open = CANCELLATIONS.find((c) => c.id === openId);
  const lost = inRange.reduce((a, c) => a + c.feeDiff, 0);
  const room = usePaneRoom(!!open, "[data-cancels]");
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Cancellations">
        <DateRangePicker value={range} onValueChange={setRange} today={NOW} />
        <Button>
          <Download />
          Export
        </Button>
      </PageHeader>
      {/* The counts first, then the money: one card shape per run, not interleaved. */}
      <div className="flex flex-wrap gap-4">
        <MetricCard loading={loading} label="Today" value={inRange.filter((c) => sameDay(c.at, NOW)).length} />
        <MetricCard loading={loading} label="Cancelled" value={inRange.length} />
        <MetricCard loading={loading} label="Disputed" value={inRange.filter((c) => c.status === "Disputed").length} />
        <MetricCard loading={loading} label="Refunded" unit="Rp" value={inRange.reduce((a, c) => a + c.refund, 0)} />
        <MetricCard loading={loading} label="Fees not returned" unit="Rp" value={Math.abs(lost)} />
      </div>
      {/* The summary that filters the table sits above it, as on the dashboard, so its effect is in view. Stacked at
          every width: beside a 320 px card the table lost its Status column past the edge at 1280 and 1440. */}
      <div className="grid items-start gap-4">
        <Card inset="nest">
          <CardHeader title="By reason" className="px-2 pt-2" action={reason ? <Button variant="ghost" size="sm" onClick={() => setReason(null)}>All reasons</Button> : undefined} />
          <BarList
            selected={reason}
            onSelect={setReason}
            loading={loading}
            data={CANCEL_REASONS.map((r, i) => ({ key: r, label: r, value: counts[i], display: String(counts[i]) }))}
          />
        </Card>
        <Card inset="nest" data-cancels style={room ? { marginRight: room } : undefined}>
          {rows.length === 0 ? (
            <EmptyState icon={SearchIcon} title="No cancellations in these days" className="py-16" />
          ) : (
          <Table>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Time</TH>
                <TH>Shop</TH>
                <TH>Reason</TH>
                <TH align="right">Refund</TH>
                <TH align="right">Fee difference</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((c) => (
                <TRow key={c.id} selected={c.id === openId} onActivate={() => setOpenId(c.id)}>
                  <TD>
                    <NoTranslate>{c.id}</NoTranslate>
                  </TD>
                  <TD className="text-ink-muted">{smartTime(c.at)}</TD>
                  <TD>
                    <span translate="no" className="inline-flex items-center gap-2">
                      <MarketMark market={c.market} />
                      {c.shop}
                    </span>
                  </TD>
                  <TD>{c.reason}</TD>
                  <TD align="right">{formatRp(c.refund)}</TD>
                  <TD align="right">
                    <Diff value={c.feeDiff} unit="Rp" />
                  </TD>
                  <TD>{c.status === "Disputed" ? <Pill>Disputed</Pill> : <Status tone={c.status === "Refunded" ? "muted" : "default"}>{c.status}</Status>}</TD>
                </TRow>
              ))}
            </TBody>
          </Table>
          )}
        </Card>
      </div>
      <Sheet
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        modal={false}
        keepOpenOn="[data-cancels]"
        title={open ? <NoTranslate>{open.id}</NoTranslate> : null}
        className={PANE_CLASS}
        footer={
          <SplitButton
            onClick={() => toast("Dispute sent to the platform")}
            menu={
              <>
                <MenuItem onSelect={() => toast("Marked as refunded")}>Mark as refunded</MenuItem>
                <MenuItem onSelect={() => toast("Buyer contacted", "neutral")}>Message the buyer</MenuItem>
              </>
            }
          >
            Dispute the fee
          </SplitButton>
        }
      >
        {open ? <CancellationDetail key={open.id} c={open} /> : null}
      </Sheet>
    </div>
  );
}
