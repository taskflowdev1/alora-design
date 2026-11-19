// Invented data for the Mobile example app (Rimba, a made-up homeware shop with three stores and three marketplace
// shops). Every name, number and message here is made up. "Now" is data.ts's NOW (Monday 16 Nov 2026, 14:20).
import { NOW, PRODUCTS } from "./data";

const at = (days: number, h: number, m = 0) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + days, h, m);

/* ------------------------------------------------------------ product photos (image content, not UI colour) */

// Earthy studio backdrops and object colours for the drawn product photos.
const BACKDROPS = ["#efe4d6", "#e6ddd0", "#e9e0cf", "#ede2d9", "#e3e7dc", "#ece3d3"]; // grey-ok: photo content
const OBJECTS = ["#b0714a", "#c79a63", "#a7824f", "#d9c9a8", "#8a5a3a", "#6f8a5c", "#c4a27a", "#9b6b43"]; // grey-ok: photo content
const SHADOW = "#000000"; // grey-ok: photo content

// Highlights on the drawn objects are white paint in the photo (image content, not a UI grey).
const HI = "#ffffff"; // grey-ok: photo content
const shapes: Record<string, (c: string) => string> = {
  GL: (c) => `<rect x="105" y="110" width="80" height="96" rx="14" fill="${c}"/><path d="M185 132h14a18 18 0 0 1 0 36h-14" fill="none" stroke="${c}" stroke-width="12"/>`,
  PR: (c) => `<ellipse cx="150" cy="170" rx="96" ry="34" fill="${c}"/><ellipse cx="150" cy="164" rx="70" ry="22" fill="${HI}" opacity=".18"/>`,
  KR: (c) => `<path d="M88 120h124l-16 92H104z" fill="${c}"/><path d="M96 150h108M100 180h100" stroke="${HI}" stroke-opacity=".25" stroke-width="6"/>`,
  LL: (c) => `<rect x="118" y="112" width="64" height="96" rx="10" fill="${c}"/><path d="M150 82c10 12 10 22 0 28c-10-6-10-16 0-28z" fill="#f2b25c"/>`,
  TT: (c) => `<ellipse cx="150" cy="190" rx="70" ry="16" fill="${c}"/><ellipse cx="150" cy="176" rx="70" ry="16" fill="${c}" opacity=".85"/><ellipse cx="150" cy="162" rx="70" ry="16" fill="${c}" opacity=".7"/>`,
  MB: (c) => `<path d="M80 140h140a70 64 0 0 1-140 0z" fill="${c}"/>`,
  TP: (c) => `<path d="M70 120q40-14 80 0t80 0v80q-40-14-80 0t-80 0z" fill="${c}"/><path d="M70 150q40-14 80 0t80 0" stroke="${HI}" stroke-opacity=".3" stroke-width="8" fill="none"/>`,
  VS: (c) => `<path d="M132 84h36v18c26 14 34 40 26 70c-6 24-22 36-44 36s-38-12-44-36c-8-30 0-56 26-70z" fill="${c}"/>`,
  SP: (c) => `<ellipse cx="112" cy="150" rx="30" ry="20" fill="${c}"/><rect x="136" y="144" width="100" height="12" rx="6" fill="${c}"/>`,
  NP: (c) => `<rect x="70" y="128" width="160" height="70" rx="18" fill="${c}"/><path d="M90 150h120M90 172h120" stroke="${HI}" stroke-opacity=".22" stroke-width="6"/>`,
};

/** A drawn studio photo of a product (an SVG data URL), different per sku and angle. */
export function productPhoto(sku: string, angle = 0) {
  const i = PRODUCTS.findIndex((p) => p.sku === sku);
  const type = sku.split("-")[1] ?? "GL";
  const bg = BACKDROPS[(Math.max(0, i) + angle) % BACKDROPS.length];
  const c = OBJECTS[(Math.max(0, i) * 3 + angle) % OBJECTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="${bg}"/><rect y="200" width="300" height="100" fill="${SHADOW}" opacity=".05"/><ellipse cx="150" cy="${angle % 2 ? 214 : 212}" rx="92" ry="12" fill="${SHADOW}" opacity=".12"/><g transform="translate(${(angle % 3) * 8 - 8} 0)">${(shapes[type] ?? shapes.GL)(c)}</g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** The phone's camera roll for the photo picker: a few angles of every product. */
export const CAMERA_ROLL = PRODUCTS.flatMap((p, i) => [0, 1].map((a) => ({ id: `${p.sku}-${a}`, src: productPhoto(p.sku, a + i), alt: `${p.name}, photo ${a + 1}` }))).slice(0, 17);

/* ------------------------------------------------------------ customers */

const NAMES = [
  "Agus Salim", "Ani Wijaya", "Ayu Lestari", "Bagus Wicaksono", "Bambang Pratama", "Budi Santoso", "Cahya Ningrum", "Citra Maharani", "Dedi Kurniawan", "Dian Puspita",
  "Eka Saputra", "Fajar Nugroho", "Fitri Handayani", "Galih Saputro", "Gita Permata", "Hadi Susanto", "Hana Rahmawati", "Indra Gunawan", "Intan Purnama", "Johan Setiawan",
  "Kartika Sari", "Kevin Tanoto", "Lina Marlina", "Maya Anggraini", "Mega Lestari", "Nadia Putri", "Nanda Saputra", "Oki Firmansyah", "Putra Ramadhan", "Rina Kusuma",
  "Rizal Akbar", "Sari Wulandari", "Siska Amalia", "Tari Oktaviani", "Umar Fauzi", "Vina Amelia", "Wahyu Prasetyo", "Wulan Sari", "Yani Suryani", "Zahra Aulia",
];
const CITIES = ["Jakarta Selatan", "Bandung", "Surabaya", "Depok", "Tangerang", "Bekasi", "Bogor", "Yogyakarta"];

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  orders: number;
  spent: number;
  last: Date;
}

export const CUSTOMERS: Customer[] = NAMES.map((name, i) => ({
  id: `c${i + 1}`,
  name,
  phone: `+62 81${(i * 7919 + 2311).toString().padStart(4, "0").slice(0, 2)} ${(4000 + i * 137).toString().slice(0, 4)} ${(1000 + i * 271).toString().slice(0, 4)}`,
  city: CITIES[i % CITIES.length],
  orders: 1 + ((i * 7) % 23),
  spent: (1 + ((i * 7) % 23)) * (120000 + ((i * 53) % 9) * 21000),
  last: at(-((i * 5) % 40), 9 + (i % 10), (i * 13) % 60),
}));

/* ------------------------------------------------------------ marketplace chats */

export interface ChatLine {
  id: string;
  mine?: boolean;
  text: string;
  time?: string;
  order?: string;
}

export interface Chat {
  id: string;
  name: string;
  market: "shopee" | "tiktok" | "tokopedia";
  shop: string;
  time: string;
  unread: number;
  lines: ChatLine[];
}

export const CHATS: Chat[] = [
  {
    id: "ch1",
    name: "Nadia Putri",
    market: "shopee",
    shop: "Rimba Official",
    time: "14:12",
    unread: 2,
    lines: [
      { id: "1", text: "Hi, I ordered the clay coffee cup yesterday.", time: "Today, 13:58", order: "RMB-24811" },
      { id: "2", mine: true, text: "Hi Nadia, thanks for ordering. It's packed and goes out with JNE this afternoon." },
      { id: "3", text: "Great. Can you wrap it as a gift?" },
      { id: "4", text: "It's for my mum on Saturday." },
    ],
  },
  { id: "ch2", name: "Budi Santoso", market: "tiktok", shop: "Rimba Live", time: "13:40", unread: 1, lines: [{ id: "1", text: "Is the large pandan basket back in stock?", time: "Today, 13:40" }] },
  {
    id: "ch3",
    name: "Sari Wulandari",
    market: "tokopedia",
    shop: "Rimba Tokopedia",
    time: "11:05",
    unread: 0,
    lines: [
      { id: "1", text: "The tray arrived with a crack on one side.", time: "Today, 10:52" },
      { id: "2", mine: true, text: "Sorry about that, Sari. Could you send a photo? We'll send a new one today." },
      { id: "3", text: "Sent the photo in the return request." },
    ],
  },
  { id: "ch4", name: "Fajar Nugroho", market: "shopee", shop: "Rimba Outlet", time: "Yesterday", unread: 0, lines: [{ id: "1", text: "Thanks, the candles smell lovely.", time: "Yesterday, 19:20" }] },
  { id: "ch5", name: "Maya Anggraini", market: "tiktok", shop: "Rimba Live", time: "Yesterday", unread: 0, lines: [{ id: "1", text: "Do you ship to Makassar?", time: "Yesterday, 16:02" }] },
  { id: "ch6", name: "Hendra Gunawan", market: "shopee", shop: "Rimba Official", time: "Sat", unread: 0, lines: [{ id: "1", text: "Can I change the colour of the vase?", time: "14 Nov, 10:15" }] },
];

/* ------------------------------------------------------------ notifications */

export interface Notif {
  id: string;
  kind: "order" | "stock" | "payout" | "review" | "team" | "return";
  title: string;
  time: string;
}

export const NOTIFS: Notif[] = [
  { id: "n1", kind: "order", title: "12 new orders to pack at Kemang", time: "14:10" },
  { id: "n2", kind: "stock", title: "Keranjang pandan besar: 1 left", time: "13:52" },
  { id: "n3", kind: "payout", title: "Shopee paid out Rp 8.420.000", time: "12:00" },
  { id: "n4", kind: "return", title: "Sari W. asked to return a tray", time: "10:53" },
  { id: "n5", kind: "team", title: "Bayu closed the Senopati till", time: "11:12" },
  { id: "n6", kind: "review", title: "New 5-star review on Rimba Live", time: "Yesterday" },
  { id: "n7", kind: "stock", title: "Tatakan gelas jati is out of stock", time: "Yesterday" },
];

/* ------------------------------------------------------------ approvals */

export interface Approval {
  id: string;
  kind: "expense" | "leave";
  who: string;
  title: string;
  amount?: number;
  dates?: string;
  time: string;
}

export const APPROVALS: Approval[] = [
  { id: "ap1", kind: "expense", who: "Intan Permata", title: "Bubble wrap, 5 rolls", amount: 375000, time: "Today, 13:20" },
  { id: "ap2", kind: "leave", who: "Bayu Saputra", title: "Leave, 2 days", dates: "23 – 24 Nov", time: "Today, 10:02" },
  { id: "ap3", kind: "expense", who: "Dewi Anggraini", title: "GoSend to Dago store", amount: 48000, time: "Today, 09:41" },
  { id: "ap4", kind: "expense", who: "Wulan Sari", title: "Till float top-up", amount: 500000, time: "Yesterday, 17:30" },
  { id: "ap5", kind: "leave", who: "Intan Permata", title: "Half day", dates: "27 Nov", time: "Yesterday, 12:15" },
];

/* ------------------------------------------------------------ team schedule (week of 16 Nov) */

export interface Shift {
  id: string;
  day: number;
  who: string;
  shop: string;
  from: string;
  to: string;
}

const PEOPLE = ["Bayu Saputra", "Intan Permata", "Wulan Sari", "Dewi Anggraini"];
const STORES = ["Kemang", "Senopati", "Dago"];
export const SHIFTS: Shift[] = Array.from({ length: 7 }, (_, d) =>
  PEOPLE.filter((_, p) => (d + p) % 4 !== 3).map((who, p) => ({
    id: `s${d}-${p}`,
    day: d,
    who,
    shop: STORES[(d + p) % 3],
    from: (d + p) % 2 ? "13:00" : "08:00",
    to: (d + p) % 2 ? "21:00" : "16:00",
  })),
).flat();

/** Monday 16 Nov 2026 + n days. */
export const weekDay = (n: number) => at(n, 0);
