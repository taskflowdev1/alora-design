// Showpiece batch D: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "status-island", title: "Morphing status island", group: "Showpieces", files: ["status-island.tsx"] },
  { name: "save-morph", title: "Save button morph", group: "Showpieces", files: ["save-morph.tsx"] },
  { name: "dust-delete", title: "Dust dissolve delete", group: "Showpieces", files: ["dust-delete.tsx"], registryDeps: ["button"] },
  { name: "undo-fuse", title: "Undo fuse pill", group: "Showpieces", files: ["undo-fuse.tsx"] },
  { name: "flip-countdown", title: "Flip countdown", group: "Showpieces", files: ["flip-countdown.tsx"] },
  { name: "sla-fuse", title: "SLA burning fuse", group: "Showpieces", files: ["sla-fuse.tsx"], registryDeps: ["button"] },
];
