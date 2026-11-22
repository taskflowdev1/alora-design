// The assistant demo's content: Rimba's chats, and the scripted replies a sent message streams. Site-only.
import type { MessageSource } from "@/components/ai/message-sources";
import type { ProposalChange, ProposalStatus } from "@/components/ai/proposal-card";

interface AgentProposal {
  title: string;
  changes: ProposalChange[];
  status: ProposalStatus;
}

export interface AgentReport {
  name: string;
  meta: string;
  title: string;
  rows: [string, string][];
  total: [string, string];
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  files?: string[];
  sources?: MessageSource[];
  proposal?: AgentProposal;
  report?: AgentReport;
  /** Stopped part-way: how many words stayed. */
  reveal?: number;
  stopped?: boolean;
  /** Sent while a reply was still running. */
  waiting?: boolean;
  /** Made in this session, so it animates in. */
  fresh?: boolean;
}

export interface AgentChat {
  id: string;
  title: string;
  when: string;
  group: string;
  pinned?: boolean;
  archived?: boolean;
  messages: AgentMessage[];
}

export interface AgentScript {
  steps: string[];
  text: string;
  sources?: MessageSource[];
  proposal?: Omit<AgentProposal, "status">;
  report?: AgentReport;
}

const SRC = {
  late: {
    id: "late",
    title: "7 late orders",
    kind: "order",
    fields: [
      { label: "Kemang", value: "5 orders" },
      { label: "Senopati", value: "1 order" },
      { label: "Darmo", value: "1 order" },
      { label: "Oldest", value: "RMB-24761, 3 days" },
      { label: "Value", value: "Rp 2.914.000" },
    ],
  },
  gelas: {
    id: "gelas",
    title: "Gelas kopi tanah liat",
    kind: "product",
    fields: [
      { label: "SKU", value: "RMB-GL-014" },
      { label: "Price", value: "Rp 89.000" },
      { label: "Kemang", value: "2 left" },
      { label: "Dago", value: "9 left" },
      { label: "Senopati", value: "4 left" },
    ],
  },
  courier: {
    id: "courier",
    title: "Courier bookings",
    kind: "report",
    fields: [
      { label: "Pickup", value: "Today, 16:00" },
      { label: "Courier", value: "SiCepat" },
      { label: "Orders", value: "RMB-24768, RMB-24772" },
    ],
  },
  shopee: {
    id: "shopee",
    title: "Shopee payout",
    kind: "payout",
    fields: [
      { label: "Amount", value: "Rp 12.400.000" },
      { label: "Landed", value: "Today, 09:12" },
      { label: "Orders", value: "86" },
      { label: "Fees", value: "Rp 558.000" },
    ],
  },
  tiktok: {
    id: "tiktok",
    title: "TikTok Shop payout",
    kind: "payout",
    fields: [
      { label: "Amount", value: "Rp 4.180.000" },
      { label: "Due", value: "Tomorrow" },
      { label: "Orders", value: "31" },
    ],
  },
  today: {
    id: "today",
    title: "Today’s sales",
    kind: "report",
    fields: [
      { label: "Sales", value: "Rp 48.200.000" },
      { label: "Orders", value: "312" },
      { label: "Basket", value: "Rp 154.600" },
      { label: "To ship", value: "18" },
      { label: "Cancelled", value: "4" },
    ],
  },
  kemang: {
    id: "kemang",
    title: "Rimba Kemang",
    kind: "shop",
    fields: [
      { label: "Sales today", value: "Rp 12.400.000" },
      { label: "Orders", value: "58" },
      { label: "Manager", value: "Dewi Anggraini" },
    ],
  },
  taplak: {
    id: "taplak",
    title: "Taplak meja tenun ikat",
    kind: "product",
    fields: [
      { label: "SKU", value: "RMB-TP-040" },
      { label: "Price", value: "Rp 329.000" },
      { label: "Stock", value: "6 left" },
    ],
  },
} satisfies Record<string, MessageSource>;

const PAYOUT_REPORT: AgentReport = {
  name: "Payout Rimba Dago, November.pdf",
  meta: "2 pages · 84 KB",
  title: "Payout Rimba Dago, November",
  rows: [
    ["Shopee, 16 Nov", "Rp 12.400.000"],
    ["Shopee, 9 Nov", "Rp 9.860.000"],
    ["TikTok Shop, 10 Nov", "Rp 3.920.000"],
    ["Tokopedia, 6 Nov", "Rp 1.740.000"],
  ],
  total: ["Landed so far", "Rp 27.920.000"],
};

let seq = 0;
const u = (text: string, files?: string[]): AgentMessage => ({ id: `seed-${++seq}`, role: "user", text, files });
const a = (text: string, extra?: Partial<AgentMessage>): AgentMessage => ({ id: `seed-${++seq}`, role: "assistant", text, ...extra });

export const RUNNING_CHAT = "count";

/** The chat that is still working when the page opens. */
export const RUNNING_SCRIPT: AgentScript = {
  steps: ["Reading stock at 4 shops…", "Comparing with the last count…", "Checking open orders…"],
  text: "The count before 12.12 is ready. **3 products** differ from the system, all small.\n\n| Product | Shop | System | Counted |\n|---|---|---|---|\n| Sendok kayu sawo | Darmo | 31 | 29 |\n| Lilin aromaterapi sereh | Senopati | 14 | 15 |\n| Nampan anyaman bambu | Kemang | 4 | 3 |\n\nEverything else matches.",
  sources: [SRC.gelas, SRC.kemang],
};

export const SEED_CHATS: AgentChat[] = [
  {
    id: RUNNING_CHAT,
    title: "Stock count before 12.12",
    when: "Now",
    group: "Today",
    messages: [u("Run the stock count for all four shops before 12.12")],
  },
  {
    id: "payout",
    title: "Payout for Rimba Dago",
    when: "14:05",
    group: "Today",
    pinned: true,
    messages: [
      u("Did the Dago payout land?"),
      a("Yes. **Rp 12.400.000** from Shopee landed at 09:12 [1]. TikTok Shop’s **Rp 4.180.000** is due tomorrow [2].", { sources: [SRC.shopee, SRC.tiktok] }),
      u("Make a PDF of November for the accountant"),
      a("Here it is, with every payout that has landed in November so far.", { report: PAYOUT_REPORT }),
    ],
  },
  {
    id: "late",
    title: "Late orders this week",
    when: "14:12",
    group: "Today",
    messages: [
      u("Which orders are late this week?"),
      a(
        "**7 orders** are past their ship-by date, and **5 of them are at Kemang** [1].\n\n| Order | Shop | Item | Late by |\n|---|---|---|---|\n| RMB-24761 | Kemang | Gelas kopi tanah liat | 3 days |\n| RMB-24764 | Kemang | Gelas kopi tanah liat | 2 days |\n| RMB-24768 | Kemang | Piring rotan bundar | 2 days |\n| RMB-24770 | Senopati | Vas keramik glasir hijau | 1 day |\n| RMB-24772 | Kemang | Keranjang pandan besar | 1 day |",
        { sources: [SRC.late, SRC.kemang] },
      ),
      u("Why are the Kemang ones stuck?"),
      a("Three are waiting on **Gelas kopi tanah liat**. Kemang has 2 left and those orders need 6 [1]. Dago has 9, so a transfer clears them today.\n\nThe other two already have a courier booked for 16:00 [2].", {
        sources: [SRC.gelas, SRC.courier],
        proposal: {
          title: "Move 6 Gelas kopi tanah liat from Dago to Kemang",
          status: "pending",
          changes: [
            { label: "Kemang stock", before: "2", after: "8" },
            { label: "Dago stock", before: "9", after: "3" },
            { label: "Orders freed", before: "0", after: "3" },
          ],
        },
      }),
    ],
  },
  {
    id: "mugs",
    title: "Restock list, clay mugs",
    when: "11:40",
    group: "Today",
    messages: [
      u("What should I reorder for the clay mugs?"),
      a("At this week’s pace Gelas kopi tanah liat runs out in **4 days** [1]. I’d order 48, which covers the 12.12 peak.", {
        sources: [SRC.gelas],
        proposal: {
          title: "Draft a purchase order for 48 Gelas kopi tanah liat",
          status: "applied",
          changes: [
            { label: "Quantity", after: "48" },
            { label: "Total", after: "Rp 2.736.000" },
          ],
        },
      }),
    ],
  },
  {
    id: "promo",
    title: "Promo results, 11.11",
    when: "Wed",
    group: "Last 7 days",
    messages: [
      u("How did 11.11 go?"),
      a("Best day this year: **Rp 91.400.000**, up 38% on last 11.11.\n\n| Shop | Sales | Orders |\n|---|---|---|\n| Kemang | Rp 31.200.000 | 142 |\n| Senopati | Rp 24.800.000 | 118 |\n| Dago | Rp 19.700.000 | 96 |\n| Darmo | Rp 15.700.000 | 74 |\n\nTaplak meja tenun ikat sold out by 15:00 [1].", { sources: [SRC.taplak] }),
    ],
  },
  {
    id: "returns",
    title: "Returns over Rp 500.000",
    when: "Sun",
    group: "Last 7 days",
    messages: [u("Any returns over Rp 500.000 this week?"), a("Two, both at Senopati: a cracked vas set for **Rp 630.000** and a taplak in the wrong size for **Rp 658.000**. Both refunds are queued.")],
  },
  {
    id: "courier",
    title: "Courier costs, October",
    when: "Sat",
    group: "Last 7 days",
    messages: [u("What did couriers cost us in October?"), a("**Rp 6.240.000** across 1.180 parcels, about Rp 5.300 each. SiCepat carried 62% of them.")],
  },
  {
    id: "best",
    title: "Best sellers at Senopati",
    when: "Fri",
    group: "Last 7 days",
    messages: [
      u("Best sellers at Senopati this month?"),
      a("1. **Taplak meja tenun ikat**, 41 sold\n2. **Vas keramik glasir hijau**, 33 sold\n3. **Lilin aromaterapi sereh**, 29 sold\n\nThe taplak has 6 left [1].", { sources: [SRC.taplak] }),
    ],
  },
  {
    id: "unpaid",
    title: "Unpaid orders over 3 days",
    when: "Thu",
    group: "Last 7 days",
    messages: [u("Which orders have been unpaid for over 3 days?"), a("**4 orders**, Rp 893.000 in total, three of them at Dago. Shopee cancels them automatically tomorrow at 12:00.")],
  },
  {
    id: "price",
    title: "Price check, rattan baskets",
    when: "5 Nov",
    group: "Earlier",
    messages: [u("Are our rattan baskets priced right?"), a("Keranjang pandan besar at **Rp 239.000** sits 6% above the three closest listings on Shopee. It still outsells them, so I’d leave it.")],
  },
  {
    id: "darmo",
    title: "New shop setup, Darmo",
    when: "2 Nov",
    group: "Earlier",
    messages: [u("What’s left to set up for Darmo?"), a("Two things: connect its Tokopedia account and add Bayu as cashier. Stock and prices are already in.")],
  },
  {
    id: "weekly",
    title: "Weekly sales summary",
    when: "1 Nov",
    group: "Earlier",
    messages: [u("Summarize last week"), a("**Rp 214.600.000** from 1.402 orders, up 9%. Kemang led, and Sunday was the strongest day.")],
  },
  {
    id: "fees",
    title: "Shopee fees, Q3",
    when: "28 Oct",
    group: "Earlier",
    messages: [u("How much did Shopee take in Q3?"), a("**Rp 18.420.000**, or 4,5% of sales. That’s up from 4,1% in Q2 because of the new service fee.")],
  },
  {
    id: "old-count",
    title: "Stock count, October",
    when: "12 Oct",
    group: "Earlier",
    archived: true,
    messages: [u("Did October’s count match?"), a("Yes, apart from two Sendok kayu sawo at Darmo.")],
  },
  {
    id: "old-rates",
    title: "Courier rates 2025",
    when: "3 Sep",
    group: "Earlier",
    archived: true,
    messages: [u("Compare courier rates"), a("SiCepat stays cheapest under 2 kg. JNE wins above it.")],
  },
];

const TODAY_TEXT =
  "So far today: **Rp 48.200.000** from **312 orders** [1].\n\n| Shop | Sales |\n|---|---|\n| Kemang | Rp 12.400.000 |\n| Senopati | Rp 9.800.000 |\n| Dago | Rp 7.100.000 |\n\n18 orders still need to ship and 4 were cancelled.";

/** The reply a sent message gets, by what it asks about. */
export function scriptFor(text: string): AgentScript {
  const t = text.toLowerCase();
  if (/restock|reorder|stock|stok|mug|gelas/.test(t))
    return {
      steps: ["Reading stock at 4 shops…", "Checking this week’s sales…"],
      text: "Dago is low on **Gelas kopi tanah liat** and Kemang needs it most [1]. Senopati has 4 it won’t sell this week, so moving 3 covers Dago until the next delivery.",
      sources: [SRC.gelas],
      proposal: {
        title: "Move 3 Gelas kopi tanah liat from Senopati to Dago",
        changes: [
          { label: "Dago stock", before: "9", after: "12" },
          { label: "Senopati stock", before: "4", after: "1" },
        ],
      },
    };
  if (/late|overdue|ship|kirim/.test(t))
    return {
      steps: ["Reading this week’s orders…", "Checking courier bookings…"],
      text: "**7 orders** are past their ship-by date, 5 of them at Kemang [1]. Two already have a courier booked for 16:00 [2], so 5 still need you.",
      sources: [SRC.late, SRC.courier],
    };
  if (/payout|transfer|paid|bayar|pdf|report/.test(t))
    return {
      steps: ["Reading payouts…", "Making the PDF…"],
      text: "**Rp 12.400.000** from Shopee landed at 09:12 [1], and TikTok Shop’s **Rp 4.180.000** is due tomorrow [2]. Here’s November so far.",
      sources: [SRC.shopee, SRC.tiktok],
      report: PAYOUT_REPORT,
    };
  if (/sale|summar|today|revenue|omzet|penjualan/.test(t)) return { steps: ["Reading today’s orders…", "Adding up 4 shops…"], text: TODAY_TEXT, sources: [SRC.today, SRC.kemang] };
  return {
    steps: ["Reading the shop’s data…", "Thinking…"],
    text: `Here’s where Rimba stands right now. ${TODAY_TEXT}`,
    sources: [SRC.today],
  };
}

/** Roughly how many words the reveal walks, so a stream ends when its last word lands. */
export const wordCount = (text: string) =>
  text
    .replace(/\|[\s:|-]*-[\s:|-]*\|/g, " ")
    .replace(/\|/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
