import type { Item } from "../registry";

const parts = ["button", "card", "tooltip"];

export const ITEMS: Item[] = [
  { name: "odometer-total", title: "Rolling odometer total", group: "Display", files: ["odometer-total.tsx"], registryDeps: parts },
  { name: "target-gauge", title: "Target gauge needle", group: "Charts", files: ["target-gauge.tsx"], registryDeps: parts },
  { name: "ghost-compare", title: "Ghost period compare", group: "Charts", files: ["ghost-compare.tsx"] },
  { name: "split-flap-board", title: "Split-flap KPI board", group: "Display", files: ["split-flap-board.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "goal-rings", title: "Goal rings", group: "Charts", files: ["goal-rings.tsx"], registryDeps: parts },
  { name: "dot-matrix-number", title: "Dot matrix number", group: "Display", files: ["dot-matrix-number.tsx"], registryDeps: parts },
  { name: "stock-battery", title: "Stock battery", group: "Display", files: ["stock-battery.tsx"], registryDeps: parts },
];
