// Invented demo data: the brand "Rimba", its shops, products and orders are made up.
// "Now" is pinned to Monday 16 Nov 2026, 14:20 so screenshots stay stable.

import { MONTHS, dayDiff } from "@/lib/ad";
import type { CalendarEvent } from "@/components/ui/calendar-month";
import type { Notice } from "@/components/ui/notification-bell";

export const NOW = new Date(2026, 10, 16, 14, 20);

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SHOPS = ["Kemang", "Senopati", "Dago", "Darmo", "Shopee", "TikTok Shop"];

export const PRODUCTS = [
  { sku: "RMB-GL-014", name: "Gelas kopi tanah liat", price: 89000, stock: 2 },
  { sku: "RMB-PR-022", name: "Piring rotan bundar", price: 145000, stock: 3 },
  { sku: "RMB-KR-031", name: "Keranjang pandan besar", price: 239000, stock: 1 },
  { sku: "RMB-LL-008", name: "Lilin aromaterapi sereh", price: 119000, stock: 14 },
  { sku: "RMB-TT-017", name: "Tatakan gelas jati, set of 4", price: 99000, stock: 0 },
  { sku: "RMB-MB-005", name: "Mangkuk batok kelapa", price: 65000, stock: 22 },
  { sku: "RMB-TP-040", name: "Taplak meja tenun ikat", price: 329000, stock: 6 },
  { sku: "RMB-VS-012", name: "Vas keramik glasir hijau", price: 210000, stock: 9 },
  { sku: "RMB-SP-003", name: "Sendok kayu sawo", price: 45000, stock: 31 },
  { sku: "RMB-NP-026", name: "Nampan anyaman bambu", price: 175000, stock: 4 },
];

const PAYMENTS = ["QRIS", "Bank transfer", "COD", "Debit", "ShopeePay", "Cash"];
export type OrderStatus = "Paid" | "Packed" | "Shipped" | "Unpaid" | "Cancelled";

export interface Order {
  id: string;
  at: Date;
  shop: string;
  customer: string;
  items: string;
  qty: number;
  payment: string;
  status: OrderStatus;
  total: number;
  fee: number;
}

const FIRST = ["Rina", "Budi", "Sari", "Dimas", "Ayu", "Fajar", "Maya", "Hendra", "Putri", "Agus", "Lestari", "Yoga", "Nadia", "Rudi"];

export const ORDERS: Order[] = (() => {
  const r = rng(1611);
  const out: Order[] = [];
  let t = NOW.getTime() - 3 * 60 * 1000;
  for (let i = 0; i < 1240; i++) {
    const p = PRODUCTS[Math.floor(r() * PRODUCTS.length)];
    const qty = 1 + Math.floor(r() * r() * 4);
    const extra = r() < 0.3 ? 1 + Math.floor(r() * 2) : 0;
    const roll = r();
    const status: OrderStatus = i < 6 ? (roll < 0.5 ? "Unpaid" : "Paid") : roll < 0.04 ? "Cancelled" : roll < 0.12 ? "Unpaid" : roll < 0.3 ? "Packed" : roll < 0.55 ? "Paid" : "Shipped";
    const total = p.price * qty + extra * 65000;
    out.push({
      id: `RMB-${(24817 - i).toString()}`,
      at: new Date(t),
      shop: SHOPS[Math.floor(r() * SHOPS.length)],
      customer: `${FIRST[Math.floor(r() * FIRST.length)]} ${String.fromCharCode(65 + Math.floor(r() * 26))}.`,
      items: extra ? `${p.name} +${extra}` : p.name,
      qty: qty + extra,
      payment: PAYMENTS[Math.floor(r() * PAYMENTS.length)],
      status,
      total,
      fee: Math.round(total * 0.045),
    });
    t -= Math.floor(2 + r() * 9) * 60 * 1000;
  }
  return out;
})();

/** Paid orders waiting to be packed, newest first. Callers take the slice they show. */
export const PAID_ORDERS = ORDERS.filter((o) => o.status === "Paid");

/** "14:05" today, "Yesterday, 18:40", otherwise "7 Nov, 09:12". */
export function smartTime(d: Date) {
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const diff = dayDiff(NOW, d);
  if (diff === 0) return `Today, ${hm}`;
  if (diff === 1) return `Yesterday, ${hm}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hm}`;
}

export const HOURLY = [
  { label: "08", value: 1.2 },
  { label: "09", value: 2.4 },
  { label: "10", value: 3.9 },
  { label: "11", value: 4.6 },
  { label: "12", value: 6.8 },
  { label: "13", value: 5.1 },
  { label: "14", value: 4.2 },
  { label: "15", value: 3.6 },
  { label: "16", value: 4.9 },
  { label: "17", value: 6.1 },
  { label: "18", value: 7.4 },
  { label: "19", value: 5.8 },
  { label: "20", value: 3.3 },
].map((h) => ({ ...h, display: `Rp ${h.value.toLocaleString("id-ID")} jt` }));

export const DAILY = Array.from({ length: 30 }, (_, i) => {
  const r = rng(90 + i);
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 29 + i);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const v = Math.round((28 + r() * 18 + (weekend ? 14 : 0)) * 10) / 10;
  return { label: String(d.getDate()), value: v, display: `Rp ${v.toLocaleString("id-ID")} jt` };
});

export const TEAM = [
  { name: "Rizky Hartono", role: "Owner", email: "rizky@rimba.example" },
  { name: "Dewi Anggraini", role: "Admin", email: "dewi@rimba.example" },
  { name: "Bayu Saputra", role: "Cashier", email: "bayu@rimba.example" },
  { name: "Intan Permata", role: "Stock", email: "intan@rimba.example" },
];

/** Shops with their marketplace, for the shop picker, fee rows and the examples. */
export const MARKET_SHOPS: { id: string; name: string; market: "shopee" | "tiktok" | "tokopedia" | "offline" }[] = [
  { id: "kemang", name: "Kemang", market: "offline" },
  { id: "senopati", name: "Senopati", market: "offline" },
  { id: "dago", name: "Dago", market: "offline" },
  { id: "shopee-official", name: "Rimba Official", market: "shopee" },
  { id: "shopee-outlet", name: "Rimba Outlet", market: "shopee" },
  { id: "tiktok", name: "Rimba Live", market: "tiktok" },
  { id: "tokopedia", name: "Rimba Tokopedia", market: "tokopedia" },
];

export const SPARK = [12, 14, 13, 17, 16, 19, 18, 22, 21, 24, 23, 27];

const day = (n: number, h = 9, m = 0) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + n, h, m);
/** Midnight `n` days from NOW (negative for the past). */
export const dayFrom = (n: number) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + n);

export interface Promotion {
  id: string;
  name: string;
  from: Date;
  to: Date;
  discount: string;
  budget: number;
  used: number;
  markets: ("shopee" | "tiktok" | "offline")[];
  status: "Live" | "Scheduled" | "Ended";
}

export const PROMOTIONS: Promotion[] = [
  { id: "p1", name: "Payday sale", from: day(-3), to: day(2), discount: "15% off", budget: 6000000, used: 4320000, markets: ["shopee", "tiktok"], status: "Live" },
  { id: "p2", name: "Rotan week", from: day(-1), to: day(5), discount: "Rp\u00a025.000 off", budget: 2500000, used: 640000, markets: ["offline", "shopee"], status: "Live" },
  { id: "p3", name: "12.12 sale", from: day(26), to: day(26), discount: "20% off", budget: 12000000, used: 0, markets: ["shopee", "tiktok", "offline"], status: "Scheduled" },
  { id: "p4", name: "Free shipping, Jabodetabek", from: day(4), to: day(11), discount: "Free shipping", budget: 3000000, used: 0, markets: ["tiktok"], status: "Scheduled" },
  { id: "p5", name: "11.11 sale", from: day(-5), to: day(-5), discount: "11% off", budget: 8000000, used: 7880000, markets: ["shopee", "tiktok"], status: "Ended" },
  { id: "p6", name: "Lilin bundle", from: day(-20), to: day(-10), discount: "Buy 2 get 1", budget: 1500000, used: 1120000, markets: ["offline"], status: "Ended" },
];

export const CANCEL_REASONS = ["Out of stock", "Buyer changed mind", "Not paid in time", "Wrong address", "Courier failed"];

export interface Cancellation {
  id: string;
  at: Date;
  shop: string;
  market: "shopee" | "tiktok" | "offline";
  customer: string;
  items: string;
  reason: string;
  refund: number;
  /** Fee the platform kept that it should have returned (negative = we lost money). */
  feeDiff: number;
  status: "Refunded" | "Waiting refund" | "Disputed";
}

export const CANCELLATIONS: Cancellation[] = (() => {
  const r = rng(424);
  const markets: Cancellation["market"][] = ["shopee", "tiktok", "offline"];
  const shopOf = { shopee: "Rimba Official", tiktok: "Rimba Live", offline: "Kemang" } as const;
  return Array.from({ length: 38 }, (_, i) => {
    const p = PRODUCTS[Math.floor(r() * PRODUCTS.length)];
    const market = markets[Math.floor(r() * 3)];
    const refund = p.price * (1 + Math.floor(r() * 2));
    const roll = r();
    return {
      id: `RMB-${24790 - i * 7}`,
      at: new Date(NOW.getTime() - (i * 5 + Math.floor(r() * 4)) * 60 * 60 * 1000),
      shop: shopOf[market],
      market,
      customer: `${FIRST[Math.floor(r() * FIRST.length)]} ${String.fromCharCode(65 + Math.floor(r() * 26))}.`,
      items: p.name,
      reason: CANCEL_REASONS[Math.min(4, Math.floor(r() * r() * 5.5))],
      refund,
      feeDiff: market !== "offline" && roll < 0.22 ? -Math.round(refund * 0.045) : 0,
      status: roll < 0.12 ? "Disputed" : roll < 0.35 ? "Waiting refund" : "Refunded",
    };
  });
})();

export const TEAM_ACTIVITY = [
  { id: "a1", time: "Today, 14:05", who: "Intan Permata", what: "packed 12 orders at Kemang" },
  { id: "a2", time: "Today, 13:40", who: "Dewi Anggraini", what: "changed the courier for Dago to SiCepat" },
  { id: "a3", time: "Today, 11:12", who: "Bayu Saputra", what: "closed the Senopati till, Rp\u00a04.820.000" },
  { id: "a4", time: "Today, 09:30", who: "Rizky Hartono", what: "started the Rotan week promotion" },
  { id: "a5", time: "Yesterday, 18:02", who: "Dewi Anggraini", what: "invited Wulan Sari as Cashier" },
  { id: "a6", time: "Yesterday, 16:45", who: "Intan Permata", what: "counted stock at Dago, 2 differences" },
];

export const TEAM_DETAIL = [
  { ...TEAM[0], shops: "All shops", active: "Online" },
  { ...TEAM[1], shops: "All shops", active: "Online" },
  { ...TEAM[2], shops: "Senopati", active: "Today, 11:12" },
  { ...TEAM[3], shops: "Kemang, Dago", active: "Today, 14:05" },
  { name: "Wulan Sari", role: "Cashier", email: "wulan@rimba.example", shops: "Kemang", active: "Invited" },
];

/** The notification bell's list. */
export const NOTICES: Notice[] = [
  { id: "1", title: "2 shops haven’t synced since 09:40", time: "Today, 10:10", unread: true },
  { id: "2", title: "Payout of Rp 12.840.000 sent", time: "Today, 08:02", unread: true },
  { id: "3", title: "Keranjang pandan besar is out of stock", time: "Yesterday, 19:45" },
];

/**
 * A month of shop events for the calendars. Titles stay short so a month cell shows them whole; the one promotion going
 * live is the only accent. Callers drop the ones they don't show.
 */
export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "a", date: dayFrom(-12), title: "Payday", tone: "accent" },
  { id: "b", date: dayFrom(-9), title: "Stock count" },
  { id: "c", date: dayFrom(-2), title: "Restock" },
  { id: "d", date: NOW, title: "Payout" },
  { id: "e", date: NOW, title: "Sync" },
  { id: "f", date: NOW, title: "Courier" },
  { id: "g", date: dayFrom(4), title: "12.12 prep" },
  { id: "h", date: dayFrom(9), title: "Tax filing" },
];
