import * as React from "react";
import { Plus } from "react-feather";
import { formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { PageHeader } from "@/components/ui/toolbar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Progress } from "@/components/ui/progress";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { DateRangePicker, formatRange, type DateRange } from "@/components/ui/date-range-picker";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { CalendarMonth } from "@/components/ui/calendar-month";
import { NOW, PROMOTIONS, type Promotion } from "../data";

/* ------------------------------------------------------------ promotions */

/** A promotion: what and when, where it runs, then how much of its budget is spent (a bar, never a ring). */
function PromotionCard({ p }: { p: Promotion }) {
  return (
    <Card interactive className="grid gap-3" onClick={() => toast(p.name, "neutral")}>
      <div className="flex items-start gap-4">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-title font-semibold">{p.name}</span>
          <span className="truncate text-body text-ink-muted">
            {p.discount} · {formatRange({ from: p.from, to: p.to })}
          </span>
        </div>
        <span className="flex shrink-0 -space-x-1 pt-0.5">
          {p.markets.map((m) => (
            <MarketMark key={m} market={m} className="shadow-[0_0_0_2px_var(--ad-surface)]" />
          ))}
        </span>
      </div>
      <div className="grid gap-1.5">
        <span className="text-small tabular-nums text-ink-muted">
          {formatRp(p.used)} of {formatRp(p.budget)}
        </span>
        <Progress value={p.used} max={p.budget || 1} aria-label={`${p.name}, budget used`} />
      </div>
    </Card>
  );
}

export function Promotions() {
  const [view, setView] = React.useState("list");
  const [month, setMonth] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  const [creating, setCreating] = React.useState(false);
  const [range, setRange] = React.useState<DateRange>({ from: NOW, to: new Date(2026, 10, 22) });
  const [discount, setDiscount] = React.useState(15);
  const [budget, setBudget] = React.useState<number | null>(5000000);
  const [channels, setChannels] = React.useState(["shopee", "tiktok"]);
  const groups: [string, Promotion[]][] = [
    ["Live", PROMOTIONS.filter((p) => p.status === "Live")],
    ["Scheduled", PROMOTIONS.filter((p) => p.status === "Scheduled")],
    ["Ended", PROMOTIONS.filter((p) => p.status === "Ended")],
  ];
  const events = PROMOTIONS.flatMap((p) => {
    const out = [];
    for (let d = new Date(p.from); d <= p.to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))
      out.push({ id: `${p.id}-${d.getDate()}-${d.getMonth()}`, date: d, title: p.name, tone: p.status === "Live" ? ("accent" as const) : ("neutral" as const) });
    return out;
  });
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Promotions">
        <Segmented
          aria-label="View"
          value={view}
          onValueChange={setView}
          options={[
            { value: "list", label: "List" },
            { value: "calendar", label: "Calendar" },
          ]}
        />
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus />
          New promotion
        </Button>
      </PageHeader>
      {view === "calendar" ? (
        <Card>
          <CalendarMonth month={month} onMonthChange={setMonth} events={events} today={NOW} onEventClick={(e) => toast(e.title, "neutral")} />
        </Card>
      ) : (
        groups.map(([title, list]) => (
          <section key={title} className="grid gap-2">
            <h2 className="px-1 text-title font-semibold">{title}</h2>
            <div className="grid gap-3 xl:grid-cols-2">
              {list.map((p) => (
                <PromotionCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        ))
      )}
      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="New promotion"
        className="w-[min(480px,calc(100vw-32px))]"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" onClick={() => toast("Promotion scheduled")}>
                Schedule
              </Button>
            </DialogClose>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Name">
            <Input aria-label="Promotion name" placeholder="Rotan week" />
          </Field>
          <Field label="Dates">
            <DateRangePicker value={range} onValueChange={setRange} today={NOW} />
          </Field>
          <Slider label="Discount" value={discount} min={5} max={50} onValueChange={setDiscount} display={`${discount}%`} />
          <Field label="Budget">
            <CurrencyInput aria-label="Budget" value={budget} onValueChange={setBudget} className="w-48" />
          </Field>
          <Field label="Where">
            <ToggleGroup
              aria-label="Channels"
              value={channels}
              onValueChange={setChannels}
              options={[
                { value: "offline", label: <><MarketMark market="offline" />Shops</> },
                { value: "shopee", label: <><MarketMark market="shopee" />Shopee</> },
                { value: "tiktok", label: <><MarketMark market="tiktok" />TikTok</> },
              ]}
            />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
