import * as React from "react";
import { Calendar, List, Plus, Tag } from "react-feather";
import { formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoreMenu, PageHeader, PageSearch } from "@/components/ui/toolbar";
import { FilterButton, FilterChecks } from "@/components/ui/filter-button";
import { MenuItem } from "@/components/ui/menu";
import { EmptyState } from "@/components/ui/empty-state";
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
import { MobileList, MobileListRow } from "@/components/mobile/mobile-list";
import { useMediaQuery } from "@/lib/ad-hooks";
import { NOW, PROMOTIONS, type Promotion } from "../data";
import { PrimaryAction } from "./shared";

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

/** The same promotion as one dense phone row: what and when, where it runs, how much of the budget is spent. */
function PromotionRow({ p }: { p: Promotion }) {
  return (
    <MobileListRow
      onClick={() => toast(p.name, "neutral")}
      title={p.name}
      subtitle={`${p.discount} · ${formatRange({ from: p.from, to: p.to })}`}
      value={
        <span className="grid w-16 justify-items-end gap-1">
          <span className="flex -space-x-1">
            {p.markets.map((m) => (
              <MarketMark key={m} market={m} className="shadow-[0_0_0_2px_var(--ad-surface)]" />
            ))}
          </span>
          <Progress value={p.used} max={p.budget || 1} aria-label={`${p.name}, budget used`} />
        </span>
      }
    />
  );
}

export function Promotions() {
  const phone = useMediaQuery("(max-width: 767.98px)");
  const [view, setView] = React.useState("list");
  const [q, setQ] = React.useState("");
  const [statuses, setStatuses] = React.useState<Promotion["status"][]>([]);
  const [markets, setMarkets] = React.useState<Promotion["markets"][number][]>([]);
  const [month, setMonth] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  const [creating, setCreating] = React.useState(false);
  const [range, setRange] = React.useState<DateRange>({ from: NOW, to: new Date(2026, 10, 22) });
  const [discount, setDiscount] = React.useState(15);
  const [budget, setBudget] = React.useState<number | null>(5000000);
  const [channels, setChannels] = React.useState(["shopee", "tiktok"]);
  const t = q.trim().toLowerCase();
  const shown = PROMOTIONS.filter((p) => (!t || p.name.toLowerCase().includes(t)) && (!statuses.length || statuses.includes(p.status)) && (!markets.length || p.markets.some((m) => markets.includes(m))));
  const groups: [string, Promotion[]][] = (["Live", "Scheduled", "Ended"] as const).map((g) => [g, shown.filter((p) => p.status === g)]);
  const events = shown.flatMap((p) => {
    const out = [];
    for (let d = new Date(p.from); d <= p.to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))
      out.push({ id: `${p.id}-${d.getDate()}-${d.getMonth()}`, date: d, title: p.name, tone: p.status === "Live" ? ("accent" as const) : ("neutral" as const) });
    return out;
  });
  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Promotions">
        <PageSearch value={q} onValueChange={setQ} placeholder="Search promotions" />
        <FilterButton
          count={(statuses.length ? 1 : 0) + (markets.length ? 1 : 0)}
          onClear={() => (setStatuses([]), setMarkets([]))}
          done={`Show ${shown.length} promotions`}
        >
          <FilterChecks label="Status" value={statuses} onValueChange={setStatuses} options={(["Live", "Scheduled", "Ended"] as const).map((s) => ({ value: s, label: s }))} />
          <FilterChecks
            label="Where"
            value={markets}
            onValueChange={setMarkets}
            options={[
              { value: "offline", label: <><MarketMark market="offline" />Shops</> },
              { value: "shopee", label: <><MarketMark market="shopee" />Shopee</> },
              { value: "tiktok", label: <><MarketMark market="tiktok" />TikTok</> },
            ]}
          />
        </FilterButton>
        <MoreMenu>
          {view === "list" ? (
            <MenuItem icon={Calendar} onSelect={() => setView("calendar")}>Calendar view</MenuItem>
          ) : (
            <MenuItem icon={List} onSelect={() => setView("list")}>List view</MenuItem>
          )}
        </MoreMenu>
        <PrimaryAction icon={Plus} label="New promotion" onClick={() => setCreating(true)} />
      </PageHeader>
      {view === "calendar" ? (
        <Card>
          <CalendarMonth month={month} onMonthChange={setMonth} events={events} today={NOW} onEventClick={(e) => toast(e.title, "neutral")} />
        </Card>
      ) : !shown.length ? (
        <EmptyState icon={Tag} title="No promotions match" className="py-16" />
      ) : (
        groups.filter(([, list]) => list.length).map(([title, list]) => (
          <section key={title} className="grid gap-2">
            <h2 className="px-1 text-title font-semibold">{title}</h2>
            {phone ? (
              <MobileList className="px-0">
                {list.map((p) => (
                  <PromotionRow key={p.id} p={p} />
                ))}
              </MobileList>
            ) : (
              <div className="grid gap-3 xl:grid-cols-2">
                {list.map((p) => (
                  <PromotionCard key={p.id} p={p} />
                ))}
              </div>
            )}
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
