// Showpiece batch A: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "slide-to-pay", title: "Slide to pay", group: "Showpieces", files: ["slide-to-pay.tsx"] },
  { name: "balance-privacy-wave", title: "Balance privacy", group: "Showpieces", files: ["balance-privacy-wave.tsx"], registryDeps: ["button"] },
];
