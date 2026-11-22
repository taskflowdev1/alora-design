// Showpiece batch I: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts. Upgrades to existing
// components need no entry here: their landing moment links to the component's own page.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "bulk-action-bar", title: "Bulk action bar", group: "Showpieces", files: ["bulk-action-bar.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "status-select", title: "Status changer", group: "Showpieces", files: ["status-select.tsx"], registryDeps: ["menu"] },
  { name: "approval-flow", title: "Approval flow", group: "Showpieces", files: ["approval-flow.tsx"], registryDeps: ["avatar", "button", "input"] },
  { name: "activity-feed", title: "Activity feed", group: "Showpieces", files: ["activity-feed.tsx"] },
];
