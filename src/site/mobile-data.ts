import { NOW, PRODUCTS, productPhotos } from "./data";

const at = (days: number, h: number, m = 0) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + days, h, m);

/** The phone's camera roll for the photo picker: a few angles of every product. */
export const CAMERA_ROLL = PRODUCTS.flatMap((p) => productPhotos(p.sku).slice(0, 2).map((src, a) => ({ id: `${p.sku}-${a}`, src, alt: `${p.name}, photo ${a + 1}` }))).slice(0, 17);

const NAMES = [
  "Agus Salim", "Ani Wijaya", "Ayu Lestari", "Bagus Wicaksono", "Bambang Pratama", "Budi Santoso", "Cahya Ningrum", "Citra Maharani", "Dedi Kurniawan", "Dian Puspita",
  "Eka Saputra", "Fajar Nugroho", "Fitri Handayani", "Galih Saputro", "Gita Permata", "Hadi Susanto", "Hana Rahmawati", "Indra Gunawan", "Intan Purnama", "Johan Setiawan",
  "Kartika Sari", "Kevin Tanoto", "Lina Marlina", "Maya Anggraini", "Mega Lestari", "Nadia Putri", "Nanda Saputra", "Oki Firmansyah", "Putra Ramadhan", "Rina Kusuma",
  "Rizal Akbar", "Sari Wulandari", "Siska Amalia", "Tari Oktaviani", "Umar Fauzi", "Vina Amelia", "Wahyu Prasetyo", "Wulan Sari", "Yani Suryani", "Zahra Aulia",
];
const CITIES = ["Jakarta Selatan", "Bandung", "Surabaya", "Depok", "Tangerang", "Bekasi", "Bogor", "Yogyakarta"];

interface Customer {
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

interface ChatLine {
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
      { id: "2", mine: true, text: "Hi Nadia, thanks for ordering. It’s packed and goes out with JNE this afternoon." },
      { id: "3", text: "Great. Can you wrap it as a gift?" },
      { id: "4", text: "It’s for my mum on Saturday." },
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
      { id: "2", mine: true, text: "Sorry about that, Sari. Could you send a photo? We’ll send a new one today." },
      { id: "3", text: "Sent the photo in the return request." },
    ],
  },
  { id: "ch4", name: "Fajar Nugroho", market: "shopee", shop: "Rimba Outlet", time: "Yesterday", unread: 0, lines: [{ id: "1", text: "Thanks, the candles smell lovely.", time: "Yesterday, 19:20" }] },
  { id: "ch5", name: "Maya Anggraini", market: "tiktok", shop: "Rimba Live", time: "Yesterday", unread: 0, lines: [{ id: "1", text: "Do you ship to Makassar?", time: "Yesterday, 16:02" }] },
  { id: "ch6", name: "Hendra Gunawan", market: "shopee", shop: "Rimba Official", time: "Sat", unread: 0, lines: [{ id: "1", text: "Can I change the colour of the vase?", time: "14 Nov, 10:15" }] },
];

export interface Notif {
  id: string;
  kind: "order" | "stock" | "payout" | "review" | "team" | "return";
  title: string;
  time: string;
  /** Not seen yet: a dot on the row, counted on the bell. */
  unread?: boolean;
}

/** Newest first. */
export const NOTIFS: Notif[] = [
  { id: "n1", kind: "order", title: "12 new orders to pack at Kemang", time: "14:10", unread: true },
  { id: "n2", kind: "stock", title: "Keranjang pandan besar: 1 left", time: "13:52", unread: true },
  { id: "n3", kind: "payout", title: "Shopee paid out Rp 8.420.000", time: "12:00", unread: true },
  { id: "n5", kind: "team", title: "Bayu closed the Senopati till", time: "11:12" },
  { id: "n4", kind: "return", title: "Sari W. asked to return a tray", time: "10:53" },
  { id: "n6", kind: "review", title: "New 5-star review on Rimba Live", time: "Yesterday" },
  { id: "n7", kind: "stock", title: "Tatakan gelas jati is out of stock", time: "Yesterday" },
];

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

interface Shift {
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
