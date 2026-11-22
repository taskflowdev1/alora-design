// Showpiece batch E: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import { BoxPacking } from "@/components/ui/box-packing";
import { EnvelopeSend } from "@/components/ui/envelope-send";
import { PaidStamp } from "@/components/ui/paid-stamp";
import { ParcelJourney } from "@/components/ui/parcel-journey";
import { PeelLabel } from "@/components/ui/peel-label";
import { RouteUntangle } from "@/components/ui/route-untangle";
import type { Demo } from "../demos";
import { Mark, S, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

/** Inside a tile the piece sits straight on the tile's surface, with no card of its own. */
const FLAT = "bg-transparent p-0 shadow-none";

export const DEMOS: Record<string, Demo> = {
  "parcel-journey": {
    stage: "page",
    controls: [{ key: "autoPlay", type: "toggle", label: "Plays when seen", default: true }],
    render: (p) => <ParcelJourney key={String(p.autoPlay)} autoPlay={!!p.autoPlay} className="max-w-[640px]" />,
    usage: (p) => `<ParcelJourney tracking="RK-2041-8836"${p.autoPlay ? "" : " autoPlay={false}"} onArrive={markDelivered} />`,
  },
  "peel-label": {
    stage: "page",
    render: () => <PeelLabel className="max-w-[520px]" />,
    usage: () => `<PeelLabel to="Sari Wulandari" address="Jl. Kaliurang Km 5 No. 14, Sleman" tracking="RK-2041-8836" weight="1,2 kg" onStick={(at) => save(at)} />`,
  },
  "route-untangle": {
    stage: "page",
    render: () => <RouteUntangle className="max-w-[600px]" />,
    usage: () => `<RouteUntangle stops={stops} kmPerUnit={0.034} onUntangle={(savedKm) => log(savedKm)} />`,
  },
  "box-packing": {
    stage: "page",
    render: () => <BoxPacking className="max-w-[520px]" />,
    usage: () => `<BoxPacking items={items} cartons={cartons} defaultValue={["teko", "gelas"]} onChange={(ids, carton) => setCarton(carton)} />`,
  },
  "paid-stamp": {
    stage: "page",
    controls: [{ key: "word", type: "select", label: "Word", options: ["LUNAS", "PAID"], default: "LUNAS" }],
    render: (p) => <PaidStamp word={String(p.word)} className="max-w-[480px]" />,
    usage: (p) => `<PaidStamp shop="Rimba Kemang" customer="Toko Bu Sari" invoice="INV/2026/11/0482" lines={lines} word="${p.word}" onStamp={markPaid} />`,
  },
  "envelope-send": {
    stage: "page",
    render: () => <EnvelopeSend className="max-w-[440px]" />,
    usage: () => `<EnvelopeSend shop="Rimba Kemang" customer="Toko Bu Sari" invoice="INV/2026/11/0482" lines={lines} onSend={sendInvoice} />`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["parcel-journey"],
    render: () => (
      <Tile inset="pad" className={S[7]}>
        <h3 className="text-title font-semibold">Track a parcel</h3>
        <Mark name="parcel-journey">
          <div onClick={(e) => e.stopPropagation()}>
            <ParcelJourney className={FLAT} />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["peel-label"],
    render: () => (
      <Tile inset="pad" className={S[5]}>
        <h3 className="text-title font-semibold">Stick the label</h3>
        <Mark name="peel-label">
          <div onClick={(e) => e.stopPropagation()}>
            <PeelLabel />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["route-untangle"],
    render: () => (
      <Tile inset="pad" className={S[6]}>
        <h3 className="text-title font-semibold">Today’s delivery loop</h3>
        <Mark name="route-untangle">
          <div onClick={(e) => e.stopPropagation()}>
            <RouteUntangle className={FLAT} />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["box-packing"],
    render: () => (
      <Tile inset="pad" className={S[6]}>
        <h3 className="text-title font-semibold">Pack the order</h3>
        <Mark name="box-packing">
          <div onClick={(e) => e.stopPropagation()}>
            <BoxPacking className={FLAT} />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["paid-stamp"],
    render: () => (
      <Tile inset="pad" className={S[6]}>
        <h3 className="text-title font-semibold">Settle the invoice</h3>
        <Mark name="paid-stamp">
          <div onClick={(e) => e.stopPropagation()}>
            <PaidStamp />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["envelope-send"],
    render: () => (
      <Tile inset="pad" className={S[6]}>
        <h3 className="text-title font-semibold">Send the invoice</h3>
        <Mark name="envelope-send">
          <div onClick={(e) => e.stopPropagation()}>
            <EnvelopeSend className="mx-auto max-w-[400px]" />
          </div>
        </Mark>
      </Tile>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "parcel-journey", title: "Parcel journey line", to: "/components/parcel-journey", width: "max-w-[720px]", render: () => <ParcelJourney /> },
  { id: "peel-label", title: "Peel shipping label", to: "/components/peel-label", width: "max-w-[560px]", touchOnly: true, render: () => <PeelLabel /> },
  { id: "route-untangle", title: "Route untangle", to: "/components/route-untangle", width: "max-w-[640px]", render: () => <RouteUntangle /> },
  { id: "box-packing", title: "Box packing fit", to: "/components/box-packing", width: "max-w-[520px]", render: () => <BoxPacking /> },
  { id: "paid-stamp", title: "Paid rubber stamp", to: "/components/paid-stamp", width: "max-w-[480px]", render: () => <PaidStamp /> },
  { id: "envelope-send", title: "Envelope send", to: "/components/envelope-send", width: "max-w-[440px]", render: () => <EnvelopeSend /> },
];
