// Showpiece batch F: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "chat-to-order", title: "Chat to order", group: "Showpieces", files: ["chat-to-order.tsx"], registryDeps: ["button"] },
  { name: "invoice-xray", title: "Invoice x-ray scan", group: "Showpieces", files: ["invoice-xray.tsx"], registryDeps: ["button"] },
  { name: "answer-chart", title: "Answer becomes chart", group: "Showpieces", files: ["answer-chart.tsx"], registryDeps: ["button"] },
  { name: "receipt-printer", title: "Thermal receipt printer", group: "Showpieces", files: ["receipt-printer.tsx"], registryDeps: ["button"] },
  { name: "instant-photo", title: "Instant photo develop", group: "Showpieces", files: ["instant-photo.tsx"], registryDeps: ["tooltip"] },
  { name: "before-after", title: "Before after wipe", group: "Showpieces", files: ["before-after.tsx"] },
];
