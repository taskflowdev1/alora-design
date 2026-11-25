import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "line-items", title: "Invoice line items", group: "Inputs", files: ["line-items.tsx"], registryDeps: ["button", "card", "number-dial", "quantity-stepper", "select"] },
  { name: "year-heatmap", title: "Year heatmap", group: "Charts", files: ["year-heatmap.tsx"], registryDeps: ["card", "number-dial"] },
  { name: "margin-waterfall", title: "Margin waterfall", group: "Charts", files: ["margin-waterfall.tsx"], registryDeps: ["card", "number-dial", "segmented"] },
];
