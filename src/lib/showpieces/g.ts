// Showpiece batch G: registry entries, spread into ITEMS in ../registry.ts.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "product-hotspots", title: "Product hotspots", group: "Display", files: ["product-hotspots.tsx"] },
  { name: "photo-stack", title: "Photo stack shuffle", group: "Display", files: ["photo-stack.tsx"] },
  { name: "scratch-voucher", title: "Scratch voucher", group: "Display", files: ["scratch-voucher.tsx"], registryDeps: ["button", "copy-chip"] },
  { name: "foil-badge", title: "Foil achievement badge", group: "Display", files: ["foil-badge.tsx"], registryDeps: ["button"] },
];
