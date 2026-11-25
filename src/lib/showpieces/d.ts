import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "status-island", title: "Morphing status island", group: "Display", files: ["status-island.tsx"] },
  { name: "save-morph", title: "Save button morph", group: "Actions", files: ["save-morph.tsx"] },
  { name: "dust-delete", title: "Dust dissolve delete", group: "Actions", files: ["dust-delete.tsx"], registryDeps: ["button"] },
  { name: "undo-fuse", title: "Undo fuse pill", group: "Actions", files: ["undo-fuse.tsx"] },
  { name: "flip-countdown", title: "Flip countdown", group: "Display", files: ["flip-countdown.tsx"] },
  { name: "sla-fuse", title: "SLA burning fuse", group: "Display", files: ["sla-fuse.tsx"], registryDeps: ["button"] },
];
