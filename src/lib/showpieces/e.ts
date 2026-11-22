// Showpiece batch E: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "parcel-journey", title: "Parcel journey line", group: "Showpieces", files: ["parcel-journey.tsx"], registryDeps: ["button"] },
  { name: "peel-label", title: "Peel shipping label", group: "Showpieces", files: ["peel-label.tsx"], registryDeps: ["button"] },
  { name: "route-untangle", title: "Route untangle", group: "Showpieces", files: ["route-untangle.tsx"], registryDeps: ["button"] },
  { name: "box-packing", title: "Box packing fit", group: "Showpieces", files: ["box-packing.tsx"], registryDeps: ["button"] },
  { name: "paid-stamp", title: "Paid rubber stamp", group: "Showpieces", files: ["paid-stamp.tsx"], registryDeps: ["button"] },
  { name: "envelope-send", title: "Envelope send", group: "Showpieces", files: ["envelope-send.tsx"], registryDeps: ["button"] },
];
