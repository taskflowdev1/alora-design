import * as React from "react";
import { Box, Truck } from "react-feather";
import { cn } from "@/lib/ad";
import { Card, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { LanguagePicker } from "@/components/ui/language-picker";
import { toast } from "@/components/ui/toast";
import { SaveBar } from "@/components/ui/save-bar";
import { TimePicker } from "@/components/ui/time-picker";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { CurrencyInput } from "@/components/ui/currency-input";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { CopyChip } from "@/components/ui/copy-chip";
import { Steps } from "@/components/ui/steps";
import { Timeline } from "@/components/ui/timeline";
import { CommentThread, type Comment } from "@/components/ui/comment-thread";
import { TEAM } from "../data";

/* ------------------------------------------------------------ B8 notes on an order */

export function NotesCard({ className }: { className?: string }) {
  const me = TEAM[0].name;
  const [list, setList] = React.useState<Comment[]>([
    { id: "1", author: TEAM[1].name, time: "Today, 13:52", body: "Buyer asked to swap the glaze to green. Stock has 9.", reactions: [{ emoji: "👍", by: [TEAM[2].name] }] },
    { id: "2", author: TEAM[3].name, time: "Today, 14:05", body: "Swapped and repacked. Courier picks up at 16:00.", reactions: [{ emoji: "🙏", by: [TEAM[1].name, me] }] },
  ]);
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader title="Notes" />
      <CommentThread
        className="mt-2"
        me={me}
        comments={list}
        onReact={(id, emoji) =>
          setList((l) =>
            l.map((c) => {
              if (c.id !== id) return c;
              const rs = c.reactions ?? [];
              const r = rs.find((x) => x.emoji === emoji);
              const next = r
                ? rs.map((x) => (x.emoji === emoji ? { ...x, by: x.by.includes(me) ? x.by.filter((b) => b !== me) : [...x.by, me] } : x)).filter((x) => x.by.length)
                : [...rs, { emoji, by: [me] }];
              return { ...c, reactions: next };
            }),
          )
        }
        onReply={(text) => setList((l) => [...l, { id: String(l.length + 1), author: me, time: "Today, 14:20", body: text }])}
      />
    </Card>
  );
}

/* ------------------------------------------------------------ B9 shipment */

export function ShipmentCard({ className }: { className?: string }) {
  return (
    <Card className={cn("grid min-w-0 content-start gap-4", className)}>
      <CardHeader title="RMB-24815" action={<CopyChip value="JNE 0123 4567 8910">JNE 0123 4567 8910</CopyChip>} />
      <Steps steps={["Paid", "Packed", "Shipped", "Delivered"]} current={2} />
      <Timeline
        className="-mx-2"
        events={[
          { id: "1", time: "Today, 14:05", title: "Picked up by JNE", media: <Truck /> },
          { id: "2", time: "Today, 11:40", title: `Packed by ${TEAM[3].name}`, media: <Box /> },
          { id: "3", time: "Yesterday, 21:30", title: "Ordered on Shopee", media: <MarketMark market="shopee" /> },
        ]}
      />
    </Card>
  );
}

/* ------------------------------------------------------------ B10 shop settings */

/** One row rhythm for settings-style cards: a 36 px control sits one nest gap inside a 44 px row.
 * In a card taller than its rows, the rows share the extra height evenly (`auto-rows-fr`). */
export const setRow = "flex min-h-[calc(var(--ad-control-h)+var(--ad-nest)*2)] items-center justify-between gap-3 rounded-item px-2";
/** Card insets: 16 to the content on every side (rows add the nest gap vertically). */
export const setCard = "flex min-w-0 flex-col gap-nest py-[calc(var(--ad-nest)*3)]";

export function SettingsCard({ className }: { className?: string }) {
  const [receipts, setReceipts] = React.useState(true);
  const [round, setRound] = React.useState(false);
  const [courier, setCourier] = React.useState("jne");
  const [pickup, setPickup] = React.useState<string | null>("16:00");
  const [freeShip, setFreeShip] = React.useState<number | null>(150000);
  const [alertAt, setAlertAt] = React.useState(5);
  const [lang, setLang] = React.useState("id");
  const [dirty, setDirty] = React.useState(true);
  const set =
    <T,>(f: (v: T) => void) =>
    (v: T) => (f(v), setDirty(true));
  const row = setRow;
  const ctl = "w-36";
  return (
    <Card inset="nest" className={cn(setCard, className)}>
      <CardHeader title="Kemang" className={row} />
      <div className="grid flex-1 auto-rows-fr">
        <label className={cn(row, "cursor-pointer hover:bg-fill has-[:focus-visible]:bg-fill")}>
          <span className="text-body">Print receipts</span>
          <Switch size="lg" checked={receipts} onCheckedChange={set(setReceipts)} />
        </label>
        <label className={cn(row, "cursor-pointer hover:bg-fill has-[:focus-visible]:bg-fill")}>
          <span className="text-body">Round cash totals</span>
          <Switch size="lg" checked={round} onCheckedChange={set(setRound)} />
        </label>
        <div className={row}>
          <span className="text-body">Courier</span>
          <Select
            aria-label="Courier"
            value={courier}
            onValueChange={set(setCourier)}
            align="end"
            className={ctl}
            options={[
              { value: "jne", label: "JNE Regular" },
              { value: "sicepat", label: "SiCepat" },
              { value: "pickup", label: "Pick up in shop" },
            ]}
          />
        </div>
        <div className={row}>
          <span className="text-body">Pickup at</span>
          <TimePicker value={pickup} onValueChange={set(setPickup)} className={ctl} />
        </div>
        <div className={row}>
          <span className="text-body">Free shipping over</span>
          <CurrencyInput aria-label="Free shipping over" value={freeShip} onValueChange={set(setFreeShip)} className={ctl} />
        </div>
        <div className={row}>
          <span className="text-body">Low stock at</span>
          <QuantityStepper aria-label="Low stock at" value={alertAt} onValueChange={set(setAlertAt)} min={1} max={50} className={ctl} />
        </div>
        <div className={row}>
          <span className="text-body">Receipt language</span>
          <LanguagePicker value={lang} onValueChange={set(setLang)} className={ctl} />
        </div>
      </div>
      <SaveBar
        open={dirty}
        inline
        onDiscard={() => setDirty(false)}
        onSave={() => {
          setDirty(false);
          toast("Changes saved");
        }}
      />
    </Card>
  );
}
