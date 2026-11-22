// Showpiece batch C: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import * as React from "react";
import { formatRp } from "@/lib/ad";
import { Card } from "@/components/ui/card";
import { DetentKnob } from "@/components/ui/detent-knob";
import { HoldToConfirm } from "@/components/ui/hold-to-confirm";
import { RubberBandStepper } from "@/components/ui/rubber-band-stepper";
import { ShiftRingClock } from "@/components/ui/shift-ring-clock";
import type { Demo } from "../demos";
import { Mark, Tile, type TileDef } from "../mark";
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
  "shift-ring-clock": {
    controls: [{ key: "step", type: "select", label: "Snap", options: ["15", "30", "60"], labels: ["15 min", "30 min", "1 hour"], default: "15" }],
    render: (p) => <ShiftRingClock key={String(p.step)} step={Number(p.step)} />,
    usage: (p) => `<ShiftRingClock value={shift} onValueChange={setShift} step={${p.step}} />  // { start: 1320, end: 360 }, minutes after midnight`,
  },
};

const tile = (name: string, title: string, node: React.ReactNode): TileDef => ({
  items: [name],
  render: (_, c) => (
    <Tile inset="pad" className={c}>
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
  tile("shift-ring-clock", "Night shift", <ShiftRingClock />),
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
];
