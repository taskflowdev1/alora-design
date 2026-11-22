// Showpiece batch G: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "product-hotspots", title: "Product hotspots", group: "Showpieces", files: ["product-hotspots.tsx"] },
  { name: "photo-stack", title: "Photo stack shuffle", group: "Showpieces", files: ["photo-stack.tsx"] },
  { name: "scratch-voucher", title: "Scratch voucher", group: "Showpieces", files: ["scratch-voucher.tsx"], registryDeps: ["button", "copy-chip"] },
  { name: "foil-badge", title: "Foil achievement badge", group: "Showpieces", files: ["foil-badge.tsx"], registryDeps: ["button"] },
  { name: "spin-wheel", title: "Prize spin wheel", group: "Showpieces", files: ["spin-wheel.tsx"] },
  { name: "stamp-card", title: "Loyalty stamp card", group: "Showpieces", files: ["stamp-card.tsx"], registryDeps: ["button"] },
];
