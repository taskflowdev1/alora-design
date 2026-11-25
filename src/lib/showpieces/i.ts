import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "bulk-action-bar", title: "Bulk action bar", group: "Actions", files: ["bulk-action-bar.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "status-select", title: "Status changer", group: "Inputs", files: ["status-select.tsx"], registryDeps: ["menu"] },
  { name: "approval-flow", title: "Approval flow", group: "Display", files: ["approval-flow.tsx"], registryDeps: ["avatar", "button", "input"] },
];
