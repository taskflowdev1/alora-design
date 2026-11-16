// Invented demo data: the brand "Rimba", its shops, products and orders are made up.
// "Now" is pinned to Monday 16 Nov 2026, 14:20 so screenshots stay stable.

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

export const PAYMENTS = ["QRIS", "Bank transfer", "COD", "Debit", "ShopeePay", "Cash"];
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

/** "14:05" today, "Yesterday, 18:40", otherwise "7 Nov, 09:12". */
export function smartTime(d: Date) {
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const day = (x: Date) => Math.floor(new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime() / 864e5);
  const diff = day(NOW) - day(d);
  if (diff === 0) return `Today, ${hm}`;
  if (diff === 1) return `Yesterday, ${hm}`;
  return `${d.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]}, ${hm}`;
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
