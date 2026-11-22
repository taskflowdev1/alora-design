// Showpiece batch J: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts. Upgrades to existing
// components need no entry here: their landing moment links to the component's own page.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "line-items", title: "Invoice line items", group: "Showpieces", files: ["line-items.tsx"], registryDeps: ["button", "card", "number-dial", "quantity-stepper", "select"] },
  { name: "import-mapping", title: "CSV import mapping", group: "Showpieces", files: ["import-mapping.tsx"], registryDeps: ["card", "number-dial", "select"] },
  { name: "year-heatmap", title: "Year heatmap", group: "Showpieces", files: ["year-heatmap.tsx"], registryDeps: ["card", "number-dial"] },
  { name: "margin-waterfall", title: "Margin waterfall", group: "Showpieces", files: ["margin-waterfall.tsx"], registryDeps: ["card", "number-dial", "segmented"] },
];
