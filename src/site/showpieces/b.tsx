// Showpiece batch B: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import type * as React from "react";
import { cn } from "@/lib/ad";
import { DotMatrixNumber } from "@/components/ui/dot-matrix-number";
import { GhostCompare } from "@/components/ui/ghost-compare";
import { GoalRings } from "@/components/ui/goal-rings";
import { OdometerTotal } from "@/components/ui/odometer-total";
import { SplitFlapBoard } from "@/components/ui/split-flap-board";
import { StockBattery } from "@/components/ui/stock-battery";
import { TargetGauge } from "@/components/ui/target-gauge";
import type { Demo } from "../demos";
import { Mark, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

export const DEMOS: Record<string, Demo> = {
  "odometer-total": {
    stage: "page",
    render: () => <OdometerTotal className="w-full max-w-[460px]" />,
    usage: () => `<OdometerTotal label="Sales today" defaultValue={48240000} steps={[89000, 1250000, -245000]} onValueChange={save} />`,
  },
  "target-gauge": {
    stage: "page",
    render: () => <TargetGauge className="w-full max-w-[400px]" />,
    usage: () => `<TargetGauge label="Today’s target" value={sales} target={48000000} onValueChange={setSales} />`,
  },
  "ghost-compare": {
    stage: "page",
    render: () => <GhostCompare className="max-w-[460px]" />,
    usage: () => `<GhostCompare label="Sales this week" current={thisWeek} previous={lastWeek} today={6} />`,
  },
  "split-flap-board": {
    stage: "page",
    controls: [{ key: "cells", type: "select", label: "Cells", options: ["4", "5", "6"], default: "5" }],
    render: (p) => <SplitFlapBoard key={String(p.cells)} cells={Number(p.cells)} className="w-full max-w-[440px]" />,
    usage: (p) => `<SplitFlapBoard cells={${p.cells}} rows={[{ id: "orders", label: "Orders", value: 312, step: 24 }]} />`,
  },
  "goal-rings": {
    stage: "page",
    render: () => <GoalRings className="w-full max-w-[520px]" />,
    usage: () => `<GoalRings rings={[{ id: "orders", label: "Orders", value: 212, goal: 320, step: 38 }]} onRingChange={save} />`,
  },
  "dot-matrix-number": {
    stage: "page",
    controls: [{ key: "places", type: "select", label: "Digits", options: ["4", "5", "6"], default: "4" }],
    render: (p) => <DotMatrixNumber key={String(p.places)} places={Number(p.places)} className="w-full max-w-[560px]" />,
    usage: (p) => `<DotMatrixNumber label="Orders today" value={orders} places={${p.places}} onValueChange={setOrders} />`,
  },
  "stock-battery": {
    stage: "page",
    render: () => <StockBattery className="w-full max-w-[460px]" />,
    usage: () => `<StockBattery product="Gelas kopi tanah liat" value={stock} capacity={120} reorderAt={24} onValueChange={setStock} />`,
  },
};

const tile = (name: string, body: React.ReactNode): TileDef => ({
  items: [name],
  render: (_, c) => (
    <Mark name={name} className={cn("grid grid-cols-1", c)}>
      {body}
    </Mark>
  ),
});

export const TILES: TileDef[] = [
  tile("odometer-total", <OdometerTotal defaultValue={12480000} label="Sales today" />),
  tile("target-gauge", <TargetGauge />),
  tile("ghost-compare", <GhostCompare />),
  tile("split-flap-board", <SplitFlapBoard />),
  tile("goal-rings", <GoalRings />),
  tile("dot-matrix-number", <DotMatrixNumber />),
  tile("stock-battery", <StockBattery />),
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "odometer-total", title: "Rolling odometer total", to: "/components/odometer-total", width: "max-w-[460px]", render: () => <OdometerTotal /> },
  { id: "target-gauge", title: "Target gauge needle", to: "/components/target-gauge", width: "max-w-[400px]", render: () => <TargetGauge /> },
  { id: "ghost-compare", title: "Ghost period compare", to: "/components/ghost-compare", width: "max-w-[460px]", render: () => <GhostCompare /> },
  { id: "split-flap-board", title: "Split-flap KPI board", to: "/components/split-flap-board", width: "max-w-[440px]", render: () => <SplitFlapBoard /> },
  { id: "goal-rings", title: "Goal rings", to: "/components/goal-rings", width: "max-w-[520px]", render: () => <GoalRings /> },
  { id: "dot-matrix-number", title: "Dot matrix number", to: "/components/dot-matrix-number", width: "max-w-[560px]", render: () => <DotMatrixNumber /> },
  { id: "stock-battery", title: "Stock battery", to: "/components/stock-battery", width: "max-w-[480px]", render: () => <StockBattery /> },
];
