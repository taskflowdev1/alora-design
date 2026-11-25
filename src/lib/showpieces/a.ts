import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "slide-to-pay", title: "Slide to pay", group: "Actions", files: ["slide-to-pay.tsx"] },
  { name: "balance-privacy-wave", title: "Balance privacy", group: "Display", files: ["balance-privacy-wave.tsx"], registryDeps: ["button"] },
];
