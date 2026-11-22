// Showpiece batch C: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import * as React from "react";
import { addDays, formatRp } from "@/lib/ad";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { DateTextMorph } from "@/components/ui/date-text-morph";
import { DetentKnob } from "@/components/ui/detent-knob";
import { HoldToConfirm } from "@/components/ui/hold-to-confirm";
import { LeverToggle } from "@/components/ui/lever-toggle";
import { RubberBandStepper } from "@/components/ui/rubber-band-stepper";
import { ShiftRingClock } from "@/components/ui/shift-ring-clock";
import type { Demo } from "../demos";
import { Mark, S, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

const UNIT_PRICE = 85000;

/** These pieces are played with: a click inside one stays on it instead of opening its page. */
const Playable = ({ children }: { children: React.ReactNode }) => (
  <div className="contents" onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

function InvoicePay() {
  return (
    <div className="grid w-full grid-cols-1 gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="min-w-0 truncate text-title font-semibold">Keramik Bumi Sari</span>
        <span className="shrink-0 text-body tabular-nums text-ink-muted">INV-2481</span>
      </div>
      <HoldToConfirm className="w-full" />
    </div>
  );
}

function OrderLine() {
  const [qty, setQty] = React.useState(12);
  return (
    <div className="grid w-full grid-cols-1 justify-items-center gap-4">
      <div className="flex w-full items-baseline justify-between gap-4">
        <span className="min-w-0 truncate text-title font-semibold">Gelas kopi tanah liat</span>
        <span className="shrink-0 text-title font-semibold tabular-nums">{formatRp(qty * UNIT_PRICE)}</span>
      </div>
      <RubberBandStepper value={qty} onValueChange={setQty} />
    </div>
  );
}

function ShopStatus() {
  return (
    <div className="grid w-full grid-cols-1 justify-items-center gap-3">
      <span className="justify-self-start text-title font-semibold">Rimba Kemang</span>
      <LeverToggle defaultChecked className="w-full" />
    </div>
  );
}

const SHIP_DAYS = [
  { value: "2", label: "2 days" },
  { value: "7", label: "1 week" },
  { value: "21", label: "3 weeks" },
];

function ShipDate() {
  const [today] = React.useState(() => new Date());
  const [days, setDays] = React.useState("2");
  return (
    <div className="grid w-full grid-cols-1 justify-items-center gap-5">
      <DateTextMorph date={addDays(today, Number(days))} now={today} align="center" className="text-[clamp(32px,9cqw,44px)] leading-tight tracking-[-0.02em]" />
      <Segmented aria-label="Ships in" value={days} onValueChange={setDays} options={SHIP_DAYS} />
    </div>
  );
}

export const DEMOS: Record<string, Demo> = {
  "detent-knob": {
    controls: [{ key: "step", type: "select", label: "Notch", options: ["5", "10"], labels: ["5%", "10%"], default: "5" }],
    render: (p) => <DetentKnob key={String(p.step)} step={Number(p.step)} />,
    usage: (p) => `<DetentKnob value={discount} onValueChange={setDiscount} min={0} max={60} step={${p.step}} product="Gelas kopi tanah liat" price={85000} />`,
  },
  "hold-to-confirm": {
    controls: [{ key: "duration", type: "select", label: "Hold", options: ["800", "1200", "2000"], labels: ["0,8 s", "1,2 s", "2 s"], default: "1200" }],
    render: (p) => <HoldToConfirm duration={Number(p.duration)} />,
    usage: (p) => `<HoldToConfirm label="Hold to pay" doneLabel="Paid" detail="Rp 1.250.000" duration={${p.duration}} onConfirm={pay} />`,
  },
  "rubber-band-stepper": {
    controls: [{ key: "step", type: "select", label: "Step", options: ["1", "5", "10"], default: "1" }],
    render: (p) => <RubberBandStepper step={Number(p.step)} />,
    usage: (p) => `<RubberBandStepper value={qty} onValueChange={setQty} min={0} max={999}${p.step !== "1" ? ` step={${p.step}}` : ""} />`,
  },
  "lever-toggle": {
    render: () => <LeverToggle defaultChecked />,
    usage: () => `<LeverToggle checked={open} onCheckedChange={setOpen} offLabel="Closed" onLabel="Open" />`,
  },
  "shift-ring-clock": {
    controls: [{ key: "step", type: "select", label: "Snap", options: ["15", "30", "60"], labels: ["15 min", "30 min", "1 hour"], default: "15" }],
    render: (p) => <ShiftRingClock key={String(p.step)} step={Number(p.step)} />,
    usage: (p) => `<ShiftRingClock value={shift} onValueChange={setShift} step={${p.step}} />  // { start: 1320, end: 360 }, minutes after midnight`,
  },
  "date-text-morph": {
    controls: [{ key: "mode", type: "select", label: "Starts as", options: ["relative", "absolute"], labels: ["Relative", "Absolute"], default: "relative" }],
    render: (p) => <DateTextMorph key={String(p.mode)} defaultMode={p.mode as "relative"} className="text-[32px] leading-tight tracking-[-0.02em]" />,
    usage: (p) => `<DateTextMorph date={shipDate}${p.mode !== "relative" ? ` defaultMode="${p.mode}"` : ""} className="text-[32px]" />`,
  },
};

const tile = (name: string, title: string, node: React.ReactNode, className: string = S[4]): TileDef => ({
  items: [name],
  render: () => (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">{title}</h3>
      <Mark name={name} className="grid flex-1 grid-cols-1 place-items-center py-2">
        <Playable>{node}</Playable>
      </Mark>
    </Tile>
  ),
});

export const TILES: TileDef[] = [
  tile("detent-knob", "Discount", <DetentKnob />),
  tile("hold-to-confirm", "Supplier payment", <HoldToConfirm className="w-full" />),
  tile("rubber-band-stepper", "Order quantity", <RubberBandStepper />),
  tile("lever-toggle", "Shop status", <LeverToggle defaultChecked className="w-full" />),
  tile("shift-ring-clock", "Night shift", <ShiftRingClock />),
  tile("date-text-morph", "Ships", <DateTextMorph align="center" className="text-[32px] leading-tight tracking-[-0.02em]" />),
];

export const MOMENTS: ShowpieceMoment[] = [
  {
    id: "detent-knob",
    title: "Detent rotary knob",
    to: "/components/detent-knob",
    width: "max-w-[400px]",
    render: () => (
      <Card className="grid grid-cols-1 justify-items-center">
        <DetentKnob className="w-full" />
      </Card>
    ),
  },
  {
    id: "hold-to-confirm",
    title: "Hold to confirm",
    to: "/components/hold-to-confirm",
    width: "max-w-[440px]",
    render: () => (
      <Card>
        <InvoicePay />
      </Card>
    ),
  },
  {
    id: "rubber-band-stepper",
    title: "Rubber band stepper",
    to: "/components/rubber-band-stepper",
    width: "max-w-[440px]",
    render: () => (
      <Card>
        <OrderLine />
      </Card>
    ),
  },
  {
    id: "lever-toggle",
    title: "Lever toggle",
    to: "/components/lever-toggle",
    width: "max-w-[400px]",
    render: () => (
      <Card>
        <ShopStatus />
      </Card>
    ),
  },
  {
    id: "shift-ring-clock",
    title: "Shift ring clock",
    to: "/components/shift-ring-clock",
    width: "max-w-[420px]",
    render: () => (
      <Card className="grid grid-cols-1 justify-items-center">
        <ShiftRingClock />
      </Card>
    ),
  },
  {
    id: "date-text-morph",
    title: "Date text morph",
    to: "/components/date-text-morph",
    width: "max-w-[480px]",
    render: () => (
      <Card className="[container-type:inline-size]">
        <ShipDate />
      </Card>
    ),
  },
];
