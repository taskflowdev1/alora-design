// Showpiece batch A: registry entries (group "Showpieces"), spread into ITEMS in ../registry.ts.
import type { Item } from "../registry";

export const ITEMS: Item[] = [
  { name: "qr-payment-tile", title: "QR payment tile", group: "Showpieces", files: ["qr-payment-tile.tsx"], registryDeps: ["button"] },
  { name: "slide-to-pay", title: "Slide to pay", group: "Showpieces", files: ["slide-to-pay.tsx"] },
  { name: "card-wallet-stack", title: "Card wallet stack", group: "Showpieces", files: ["card-wallet-stack.tsx"] },
  { name: "secure-number-reveal", title: "Secure number reveal", group: "Showpieces", files: ["secure-number-reveal.tsx"] },
  { name: "balance-privacy-wave", title: "Balance privacy wave", group: "Showpieces", files: ["balance-privacy-wave.tsx"], registryDeps: ["button"] },
  { name: "installment-slicer", title: "Installment slicer", group: "Showpieces", files: ["installment-slicer.tsx"] },
];
