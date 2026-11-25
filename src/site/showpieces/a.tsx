import type * as React from "react";
import { Card } from "@/components/ui/card";
import { BalancePrivacyWave } from "@/components/ui/balance-privacy-wave";
import { SlideToPay } from "@/components/ui/slide-to-pay";
import type { Demo } from "../demos";
import { Mark, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

const stay = (e: React.MouseEvent) => e.stopPropagation();

export const DEMOS: Record<string, Demo> = {
  "slide-to-pay": {
    controls: [{ key: "slow", type: "toggle", label: "Slow payment", default: false }],
    render: (p) => (
      <div className="w-full max-w-[420px]">
        <SlideToPay onConfirm={p.slow ? () => new Promise((done) => setTimeout(done, 1200)) : undefined} />
      </div>
    ),
    usage: () => `// A touch control: on desktop, confirm with a button instead.\n<SlideToPay amount={1250000} onConfirm={() => pay(order.id)} />`,
  },
  "balance-privacy-wave": {
    controls: [{ key: "details", type: "toggle", label: "Details", default: true }],
    render: (p) => (
      <Card className="w-full max-w-[420px] [container-type:inline-size]">
        <BalancePrivacyWave details={p.details ? undefined : []} />
      </Card>
    ),
    usage: () => `<BalancePrivacyWave amount={48240000} details={[{ label: "In today", amount: 12480000 }]} onHiddenChange={save} />`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["balance-privacy-wave"],
    render: (_, c) => (
      <Tile inset="pad" className={c}>
        <Mark name="balance-privacy-wave" className="[container-type:inline-size]">
          <div onClick={stay}>
            <BalancePrivacyWave />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["slide-to-pay"],
    render: (_, c) => (
      <Tile inset="pad" className={c}>
        <Mark name="slide-to-pay">
          <div onClick={stay}>
            <SlideToPay amount={416667} />
          </div>
        </Mark>
      </Tile>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  {
    id: "balance-wave",
    title: "Balance privacy",
    to: "/components/balance-privacy-wave",
    width: "max-w-[440px]",
    render: () => (
      <Card className="[container-type:inline-size]">
        <BalancePrivacyWave />
      </Card>
    ),
  },
  { id: "slide-to-pay", title: "Slide to pay", to: "/components/slide-to-pay", width: "max-w-[440px]", touchOnly: true, render: () => <SlideToPay /> },
];
