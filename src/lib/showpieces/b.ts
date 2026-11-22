// Showpiece batch B: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts.
import type { Item } from "../registry";

const parts = ["button", "card", "tooltip"];

export const ITEMS: Item[] = [
  { name: "odometer-total", title: "Rolling odometer total", group: "Showpieces", files: ["odometer-total.tsx"], registryDeps: parts },
  { name: "target-gauge", title: "Target gauge needle", group: "Showpieces", files: ["target-gauge.tsx"], registryDeps: parts },
  { name: "ghost-compare", title: "Ghost period compare", group: "Showpieces", files: ["ghost-compare.tsx"] },
  { name: "split-flap-board", title: "Split-flap KPI board", group: "Showpieces", files: ["split-flap-board.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "goal-rings", title: "Goal rings", group: "Showpieces", files: ["goal-rings.tsx"], registryDeps: parts },
  { name: "dot-matrix-number", title: "Dot matrix number", group: "Showpieces", files: ["dot-matrix-number.tsx"], registryDeps: parts },
  { name: "stock-battery", title: "Stock battery", group: "Showpieces", files: ["stock-battery.tsx"], registryDeps: parts },
];
