// Showpiece batch H: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts. Upgrades to existing
// components need no entry here: their landing moment links to the component's own page.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "filter-search", title: "Filter search", group: "Showpieces", files: ["filter-search.tsx"], registryDeps: ["select"] },
];
