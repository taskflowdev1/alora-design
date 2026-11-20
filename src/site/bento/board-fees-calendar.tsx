import * as React from "react";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/status";
import { Thumb } from "@/components/ui/thumb";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { FeeRow, FeeTotal } from "@/components/ui/fee-row";
import { KanbanCard, KanbanColumn } from "@/components/ui/kanban-card";
import { CalendarMonth } from "@/components/ui/calendar-month";
import { CALENDAR_EVENTS, NOW, ORDERS, TEAM, type Order } from "../data";
import { shopName } from "./shared";

/* ------------------------------------------------------------ B5 packing board */

export function BoardCard({ className }: { className?: string }) {
  const card = (o: Order, i: number, attention?: boolean) => (
    <KanbanCard
      key={o.id}
      title={o.items}
      id={o.id}
      media={<Thumb alt={o.items} />}
      tags={[shopName(o.shop)]}
      people={[{ name: TEAM[(i + 1) % 4].name }]}
      due={attention ? "Today" : "Tomorrow"}
      attention={attention}
      onClick={() => toast(o.id, "neutral")}
    />
  );
  return (
    <Card inset="nest" className={cn("flex min-w-0 gap-nest max-sm:flex-col sm:overflow-x-auto", className)}>
      <KanbanColumn title="To pack" count={3} className="flex-1 max-sm:min-w-0 sm:min-w-56">
        {card(ORDERS[1], 0, true)}
        {card(ORDERS[3], 1)}
        {card(ORDERS[7], 2)}
      </KanbanColumn>
      <KanbanColumn title="Packed" count={2} className="flex-1 max-sm:min-w-0 sm:min-w-56">
        {card(ORDERS[10], 3)}
        {card(ORDERS[14], 0)}
      </KanbanColumn>
    </Card>
  );
}

/* ------------------------------------------------------------ B6 fees on one order */

export function FeesCard({ className }: { className?: string }) {
  const lines = [
    { payer: "buyer" as const, label: "Items, 2 × Gelas kopi", amount: 178000 },
    { payer: "buyer" as const, label: "Shipping", amount: 18000, shipping: true },
    { payer: "platform" as const, label: "Admin fee 4,5%", amount: -8010 },
    { payer: "platform" as const, label: "Free shipping programme", amount: -4000 },
    { payer: "shop" as const, label: "Voucher RIMBA10", amount: -17800 },
  ];
  const [reason, setReason] = React.useState("fee");
  return (
    <Card inset="nest" className={cn("flex min-w-0 flex-col gap-nest", className)}>
      <div className="flex min-h-control items-center gap-2 px-2 pt-2">
        <h3 className="mr-auto truncate text-title font-semibold">RMB-24812</h3>
        <Pill>Fee mismatch</Pill>
        <Dialog
          title="Dispute RMB-24812?"
          trigger={<Button>Dispute</Button>}
          footer={
            <>
              <DialogClose asChild>
                <Button variant="ghost">Keep</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="primary" onClick={() => toast("Dispute sent to Shopee")}>
                  Send dispute
                </Button>
              </DialogClose>
            </>
          }
        >
          <div className="grid gap-4">
            <Field label="Reason">
              <Select
                aria-label="Reason"
                value={reason}
                onValueChange={setReason}
                options={[
                  { value: "fee", label: "Admin fee too high" },
                  { value: "ship", label: "Shipping not refunded" },
                  { value: "voucher", label: "Voucher charged twice" },
                ]}
              />
            </Field>
            <Field label="Note">
              <Textarea defaultValue="Admin fee should be 4% for Star sellers." />
            </Field>
          </div>
        </Dialog>
      </div>
      <div className="grid gap-px">
        {lines.map((l) => (
          <FeeRow key={l.label} market="shopee" {...l} />
        ))}
      </div>
      <FeeTotal label="You receive" amount={lines.reduce((a, l) => a + l.amount, 0)} />
      <div className="grid gap-2 px-2 pb-2 pt-2 text-body">
        {[
          ["Paid out", "18 Nov 2026"],
          ["To", "BCA •••• 4410"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4">
            <span className="text-ink-muted">{k}</span>
            <span className="tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B7 calendar */

export function CalendarCard({ className }: { className?: string }) {
  const [m, setM] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  return (
    <Card className={cn("min-w-0 overflow-x-auto", className)}>
      <CalendarMonth month={m} onMonthChange={setM} events={CALENDAR_EVENTS} today={NOW} onEventClick={(e) => toast(e.title, "neutral")} className="sm:min-w-[560px]" />
    </Card>
  );
}
