// Showpiece batch F: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import * as React from "react";
import { AnswerChart } from "@/components/ui/answer-chart";
import { BeforeAfter } from "@/components/ui/before-after";
import { ChatToOrder } from "@/components/ui/chat-to-order";
import { InstantPhoto } from "@/components/ui/instant-photo";
import { InvoiceXray } from "@/components/ui/invoice-xray";
import { ReceiptPrinter } from "@/components/ui/receipt-printer";
import type { Demo } from "../demos";
import { Mark, S, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

const SHOTS = [
  { src: "/photos/cup-terracotta.webp", alt: "Gelas kopi tanah liat on a wooden tray" },
  { src: "/photos/cup-table.webp", alt: "Cangkir latte on a wooden table" },
  { src: "/photos/products/pr-2.webp", alt: "Woven basket from Lombok" },
];

const RAW = "saturate(0.58) contrast(0.84) brightness(0.8) sepia(0.2)";
const Wipe = ({ className }: { className?: string }) => <BeforeAfter before="/photos/cup-table.webp" after="/photos/cup-table.webp" beforeFilter={RAW} alt="Cangkir latte on a wooden table" className={className} />;

/** The pieces answer to clicks and drags, so a click inside one stays there instead of opening its page. */
const Keep = ({ children }: { children: React.ReactNode }) => (
  <div className="contents" onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

export const DEMOS: Record<string, Demo> = {
  "chat-to-order": {
    render: () => <ChatToOrder className="max-w-[760px]" />,
    usage: () => `<ChatToOrder
  message={["Kak, mau pesan ", { field: "item", text: "2 gelas kopi" }, " ya, atas nama ", { field: "customer", text: "Dewi" }]}
  fields={[
    { id: "customer", label: "Customer", value: "Dewi" },
    { id: "item", label: "Item", value: "2 × Gelas kopi tanah liat" },
  ]}
  onComplete={(values) => createDraft(values)}
/>`,
  },
  "invoice-xray": {
    render: () => <InvoiceXray className="max-w-[720px]" />,
    usage: () => `<InvoiceXray
  defaultValues={{ vendor: "CV Tanah Liat Sejahtera", number: "INV/2026/0418", date: "12 Nov 2026", total: "Rp 4.218.000" }}
  lines={lines}
  onScanned={(values) => saveBill(values)}
/>`,
  },
  "answer-chart": {
    render: () => <AnswerChart className="max-w-[560px]" />,
    usage: () => `<AnswerChart
  intro="Rimba Kemang sold"
  data={[{ id: "mon", label: "Mon", phrase: "on Monday", value: 4200000 }, { id: "tue", label: "Tue", phrase: "on Tuesday", value: 6100000 }]}
  onValueChange={(id, value) => updateForecast(id, value)}
/>`,
  },
  "receipt-printer": {
    controls: [{ key: "autoPrint", type: "toggle", label: "Print when seen", default: true }],
    render: (p) => <ReceiptPrinter key={String(p.autoPrint)} autoPrint={!!p.autoPrint} />,
    usage: (p) => `<ReceiptPrinter
  shop="Rimba Kemang"
  items={[{ id: "gelas", name: "Gelas kopi tanah liat", qty: 2, price: 89000 }]}
  payment="QRIS"${p.autoPrint ? "" : "\n  autoPrint={false}"}
  onTear={() => nextOrder()}
/>`,
  },
  "instant-photo": {
    render: () => <InstantPhoto photos={SHOTS} />,
    usage: () => `<InstantPhoto photos={[{ src: "/photos/gelas.webp", alt: "Gelas kopi tanah liat" }]} onDeveloped={(shot) => attach(shot)} />`,
  },
  "before-after": {
    render: () => <Wipe className="max-w-[640px]" />,
    usage: () => `<BeforeAfter before="/photos/gelas-raw.webp" after="/photos/gelas-edited.webp" alt="Gelas kopi tanah liat" />`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["chat-to-order"],
    render: () => (
      <Tile inset="pad" className={S[8]}>
        <h3 className="text-title font-semibold">WhatsApp orders</h3>
        <Mark name="chat-to-order">
          <Keep>
            <ChatToOrder />
          </Keep>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["before-after"],
    render: () => (
      <Tile inset="pad" className={S[4]}>
        <h3 className="text-title font-semibold">Product shot</h3>
        <Mark name="before-after">
          <Keep>
            <Wipe />
          </Keep>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["invoice-xray"],
    render: () => (
      <Tile inset="pad" className={S[7]}>
        <h3 className="text-title font-semibold">Supplier bill</h3>
        <Mark name="invoice-xray">
          <Keep>
            <InvoiceXray />
          </Keep>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["answer-chart"],
    render: () => (
      <Tile inset="pad" className={S[5]}>
        <h3 className="text-title font-semibold">Weekly answer</h3>
        <Mark name="answer-chart">
          <Keep>
            <AnswerChart />
          </Keep>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["receipt-printer"],
    render: () => (
      <Tile inset="pad" className={S[6]}>
        <h3 className="text-title font-semibold">Till printer</h3>
        <Mark name="receipt-printer">
          <Keep>
            <ReceiptPrinter />
          </Keep>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["instant-photo"],
    render: () => (
      <Tile inset="pad" className={S[6]}>
        <h3 className="text-title font-semibold">Listing photo</h3>
        <Mark name="instant-photo">
          <Keep>
            <InstantPhoto photos={SHOTS} />
          </Keep>
        </Mark>
      </Tile>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "chat-to-order", title: "Chat to order", to: "/components/chat-to-order", width: "max-w-[760px]", render: () => <ChatToOrder /> },
  { id: "invoice-xray", title: "Invoice x-ray scan", to: "/components/invoice-xray", width: "max-w-[720px]", render: () => <InvoiceXray /> },
  { id: "answer-chart", title: "Answer becomes chart", to: "/components/answer-chart", width: "max-w-[560px]", render: () => <AnswerChart /> },
  { id: "receipt-printer", title: "Thermal receipt printer", to: "/components/receipt-printer", width: "max-w-[360px]", render: () => <ReceiptPrinter /> },
  { id: "instant-photo", title: "Instant photo develop", to: "/components/instant-photo", width: "max-w-[360px]", render: () => <InstantPhoto photos={SHOTS} /> },
  { id: "before-after", title: "Before after wipe", to: "/components/before-after", width: "max-w-[680px]", render: () => <Wipe /> },
];
