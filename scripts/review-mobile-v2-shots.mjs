// Mobile v2 review shots into output/mobile-v2 (AFTER_DIST = this tree's build). Every image is phone-sized (the
// 390 × 844 docs phone frame at 2×), dark and light side by side.
//   C letters: every new mobile component (its docs page), with its key states.
//   P letters: every sample screen of the example app (the /mobile/screens order), states included.
//   F letters: the key steps of each flow in the example app.
//   G letters: the site pages (the Mobile overview and the screens gallery), dark | light.
// ONLY=<regex on the letter> to run some, e.g. ONLY="C1|P3|F2". checks.json lists what failed.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const OUT = process.env.OUT || "output/mobile-v2";
const ONLY = process.env.ONLY ? new RegExp(`^(${process.env.ONLY.replace(/,/g, "|")})$`) : null;
const want = (l) => !ONLY || ONLY.test(l);
mkdirSync(`${OUT}/parts`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const servers = [];
async function serve(dist, port) {
  const s = spawn("npx", ["vite", "preview", "--outDir", dist, "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
  servers.push(s);
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(base)).ok) return base;
    } catch {}
    if (i > 80) throw new Error(`preview ${dist} did not start`);
    await sleep(250);
  }
}
process.on("exit", () => servers.forEach((s) => s.kill("SIGTERM")));
const BASE = await serve(process.env.AFTER_DIST, 5195);

const log = { errors: [], shots: [] };
const browser = await chromium.launch();
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);

async function open(path, theme, { width = 1440, height = 1100, settle = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.errors.push(`${path}: ${e.message}`));
  await page.goto(`${BASE}${q(path, theme)}`, { waitUntil: "networkidle" });
  await page.mouse.move(2, 2);
  await sleep(settle);
  return { page, ctx };
}
const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;

/** Composite: title, then columns (each a labelled image). */
async function compose(name, title, cols, { w = 390 } = {}) {
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0}.wrap{display:inline-block;padding:24px;background:#0d0d0d;color:#eee;font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    h1{font-size:16px;font-weight:600;margin:0 0 16px}.row{display:flex;gap:24px;align-items:flex-start}
    figure{margin:0;display:grid;gap:8px}figcaption{font-weight:500}img{display:block;width:${w}px;height:auto}
    .none{width:${w}px;height:200px;display:grid;place-items:center;opacity:.6}
  </style><div class=wrap><h1>${title}</h1><div class=row>${cols
    .map((c) => `<figure><figcaption>${c.label}</figcaption>${c.file && existsSync(c.file) ? `<img src="${dataUri(c.file)}">` : `<div class=none>${c.note ?? "missing"}</div>`}</figure>`)
    .join("")}</div></div>`;
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 200 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.setContent(html, { waitUntil: "load" });
  await p.locator(".wrap").screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  log.shots.push({ name, title });
  console.log(`wrote ${OUT}/${name}.png`);
}

const frame = (page) => page.locator("[data-phone-frame]").first();
/**
 * One letter: for each state, the page in both themes, then `act`, then the phone frame is shot. Columns go state by
 * state, dark then light.
 */
async function phone(letter, slug, title, path, act, { states } = {}) {
  if (!want(letter)) return;
  const cols = [];
  for (const st of states ?? [{ key: "", label: "" }]) {
    for (const theme of ["dark", "light"]) {
      const file = `${OUT}/parts/${letter}-${slug}${st.key ? `-${st.key}` : ""}-${theme}.png`;
      try {
        const { page, ctx } = await open(typeof path === "function" ? path(st) : path, theme, { settle: st.settle ?? 900 });
        if (act) await act(page, st);
        await frame(page).screenshot({ path: file });
        await page.mouse.up().catch(() => {});
        await ctx.close();
      } catch (e) {
        log.errors.push(`${letter} ${theme} ${st.key}: ${e.message.split("\n")[0]}`);
      }
      cols.push({ label: `${st.label ? `${st.label} · ` : ""}${theme}`, file });
    }
  }
  await compose(`${letter}-${slug}`, `${letter} · ${title}`, cols);
}
const at = async (page, sel, i = 0) => {
  const b = await page.locator(sel).nth(i).boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
};
async function drag(page, from, dx, dy, { steps = 12, hold = false, delay = 14 } = {}) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    await sleep(delay);
  }
  if (!hold) await page.mouse.up();
}
const P = "[data-phone-screen]";
const btn = (page, name) => page.locator(`${P} button`, { hasText: name }).first();

// ---------------------------------------------------------------- C: components
const S = (key, label, extra = {}) => ({ key, label, ...extra });
await phone("C1", "filter-chips", "Filter chips: one row, the pill slides to Low stock", "/mobile/mobile-filter-chips", async (p) => (await btn(p, "Low stock").click(), sleep(600)));
await phone("C2", "top-tabs", "Top tabs: To pack, then Shipped (pill and page slide)", "/mobile/mobile-top-tabs", async (p, s) => {
  if (s.key === "shipped") {
    await p.getByRole("tab", { name: /Shipped/ }).click();
    await sleep(900);
  }
}, { states: [S("pack", "To pack"), S("shipped", "Shipped")] });
await phone("C3", "choice-rows", "Switch, check and radio rows", "/mobile/mobile-choice-rows", null);
await phone("C4", "person-row", "Avatar rows: unread count, marketplace mark", "/mobile/mobile-person-row", null);
await phone("C5", "index-list", "A–Z index: at rest, then a finger on the strip (letter magnified)", "/mobile/mobile-index-list", async (p, s) => {
  if (s.key !== "scrub") return;
  const st = await at(p, `${P} [role=slider][aria-label="Jump to letter"]`);
  await p.mouse.move(st.x, st.b.y + st.b.height * 0.2);
  await p.mouse.down();
  await p.mouse.move(st.x, st.b.y + st.b.height * 0.55, { steps: 8 });
  await sleep(300);
}, { states: [S("rest", "Rest"), S("scrub", "Scrubbing")] });
await phone("C6", "picker-sheet", "Picker sheet: short list, then a long one with search", (s) => `/mobile/mobile-picker-sheet?open=1${s.key === "long" ? "&long=1" : ""}`, null, { states: [S("short", "Short"), S("long", "Long, with search")] });
await phone("C7", "multi-select", "Multi-select sheet: picked shops as chips on top", "/mobile/mobile-multi-select?open=1", async (p) => (await btn(p, "Dago").click(), sleep(400)));
await phone("C8", "date-range", "Date range sheet: 7 days preset, then 3 – 9 Nov tapped", "/mobile/mobile-date-range?open=1", async (p, s) => {
  if (s.key !== "pick") return;
  await p.getByRole("gridcell", { name: "3 November", exact: true }).click();
  await p.getByRole("gridcell", { name: "9 November", exact: true }).click();
  await sleep(400);
}, { states: [S("preset", "Preset"), S("pick", "Picked")] });
await phone("C9", "context-menu", "Long-press menu: grows from the pressed point", "/mobile/mobile-context-menu", async (p) => {
  const r = await at(p, `${P} [role=listitem]`, 2);
  await p.mouse.move(r.x - 60, r.y);
  await p.mouse.down();
  await sleep(650);
  await p.mouse.up();
  await sleep(400);
});
await phone("C10", "modal", "Full-screen modal: edited (Save on), then Cancel asks", "/mobile/mobile-modal?open=1", async (p, s) => {
  await p.locator(`${P} [role=dialog] input`).first().fill("Gelas kopi tanah liat, biru");
  await sleep(300);
  if (s.key === "discard") {
    await btn(p, "Cancel").click();
    await sleep(500);
  }
}, { states: [S("edit", "Edited"), S("discard", "Cancel")] });
await phone("C11", "alert", "Alert dialog", "/mobile/mobile-alert?open=1", null);
await phone("C12", "text-field", "Text field: filled, inline error, keyboard open", (s) => `/mobile/mobile-text-field${s.key === "error" ? "?error=1" : s.key === "keyboard" ? "?keyboard=1" : ""}`, null, {
  states: [S("rest", "Filled"), S("error", "Error"), S("keyboard", "Keyboard")],
});
await phone("C13", "keypad", "Amount keypad (Rp), quick amounts", "/mobile/mobile-keypad", null);
await phone("C14", "slider", "Slider: the value floats above the finger while dragging", "/mobile/mobile-slider", async (p) => {
  const s = await at(p, `${P} [role=slider]`, 1);
  await drag(p, { x: s.b.x + s.b.width * 0.32, y: s.y }, s.b.width * 0.2, 0, { hold: true });
  await sleep(200);
});
await phone("C15", "photo-picker", "Photo picker: three picked, numbered in order", "/mobile/mobile-photo-picker?open=1", async (p) => {
  for (const i of [3, 1, 6]) {
    await p.locator(`${P} [role=dialog] [role=checkbox]`).nth(i).click();
    await sleep(150);
  }
  await sleep(300);
});
await phone("C16", "scanner", "Barcode scanner: looking, then two reads and the typed code open", "/mobile/mobile-scanner", async (p, s) => {
  if (s.key !== "read") return;
  for (let i = 0; i < 2; i++) {
    await p.getByRole("button", { name: "Read the code in the frame" }).click();
    await sleep(800);
  }
  await btn(p, "Type the code").click();
  await sleep(400);
}, { states: [S("look", "Looking"), S("read", "Read twice")] });
await phone("C17", "signature", "Signature pad: signed", "/mobile/mobile-signature", async (p) => {
  const c = await at(p, `${P} canvas`);
  const pts = Array.from({ length: 40 }, (_, i) => [c.b.x + 40 + i * 6.5, c.y + Math.sin(i / 3) * 26 - (i > 30 ? (i - 30) * 4 : 0)]);
  await p.mouse.move(...pts[0]);
  await p.mouse.down();
  for (const pt of pts) await p.mouse.move(...pt, { steps: 2 });
  await p.mouse.up();
  await sleep(300);
});
await phone("C18", "otp", "One-time code, touch size: typing, wrong, correct", (s) => `/mobile/mobile-otp${s.key === "idle" ? "" : `?status=${s.key}`}`, async (p, s) => {
  if (s.key === "idle") {
    await p.locator(`${P} input`).first().fill("246");
    await sleep(300);
  }
  if (s.key === "success") await sleep(1600);
}, { states: [S("idle", "Typing"), S("invalid", "Wrong"), S("success", "Correct")] });
await phone("C19", "stat-tiles", "Stat tiles: loaded, then loading (same boxes)", (s) => `/mobile/mobile-stat-tiles${s.key === "loading" ? "?loading=1" : ""}`, null, { states: [S("loaded", "Loaded"), S("loading", "Loading")] });
await phone("C20", "kpi-carousel", "KPI carousel: first card, then the second (dot tapped)", "/mobile/mobile-kpi-carousel", async (p, s) => {
  if (s.key === "two") {
    await p.getByRole("button", { name: "Card 2" }).click();
    await sleep(700);
  }
}, { states: [S("one", "Card 1"), S("two", "Card 2")] });
await phone("C21", "scrub-chart", "Scrub charts: a finger on the bars, then on the line", (s) => `/mobile/mobile-scrub-chart?kind=${s.key}`, async (p) => {
  const c = await at(p, `${P} [role=slider]`);
  await drag(p, { x: c.b.x + 10, y: c.y }, c.b.width * 0.55, 0, { hold: true, steps: 10 });
  await sleep(200);
}, { states: [S("bars", "Bars"), S("line", "Line")] });
await phone("C22", "timeline", "Order timeline", "/mobile/mobile-timeline", null);
await phone("C23", "steps", "Progress steps, touch size", "/mobile/mobile-steps", null);
await phone("C24", "receipt", "Receipt", "/mobile/mobile-receipt", null);
await phone("C25", "badge", "Badge counts: on an icon, a row, the tab bar (dot, 99+)", "/mobile/mobile-badge", null);
await phone("C26", "banner", "Offline banner", "/mobile/mobile-banner", null);
await phone("C27", "upload-row", "Upload progress: done, uploading, failed (retry)", "/mobile/mobile-upload-row", null, { states: [S("run", "", { settle: 500 })] });
await phone("C28", "onboarding", "Onboarding pager: page 1, then page 2", "/mobile/mobile-onboarding", async (p, s) => {
  if (s.key === "two") {
    await btn(p, "Next").click();
    await sleep(800);
  }
}, { states: [S("one", "Page 1"), S("two", "Page 2")] });
await phone("C29", "chat", "Chat and composer: thread, then typing with the keyboard open", (s) => `/mobile/mobile-chat${s.key === "kb" ? "?keyboard=1" : ""}`, async (p, s) => {
  if (s.key === "kb") {
    await p.locator(`${P} textarea`).fill("Yes, we'll gift wrap it and add a card");
    await sleep(400);
  }
}, { states: [S("thread", "Thread"), S("kb", "Keyboard open")] });

// ---------------------------------------------------------------- P: every sample screen
const SCREENS = [
  ["home", "Home"],
  ["home?state=offline", "Home, offline"],
  ["notifications", "Notifications"],
  ["notifications?state=empty", "Notifications, all cleared"],
  ["search", "Search"],
  ["search?state=empty", "Search, no results"],
  ["reports", "Reports"],
  ["reports?state=error", "Reports, failed to load"],
  ["orders", "Orders"],
  ["order", "Order"],
  ["delivery", "Proof of delivery"],
  ["products", "Products"],
  ["product", "Product"],
  ["product-edit", "Edit product"],
  ["stock-count", "Stock count"],
  ["inbox", "Inbox"],
  ["chat", "Chat"],
  ["assistant", "Assistant"],
  ["more", "More"],
  ["customers", "Customers"],
  ["customer", "Customer"],
  ["pos", "New sale"],
  ["pos-pay", "Payment"],
  ["pos-receipt", "Receipt"],
  ["approvals", "Approvals"],
  ["approvals?state=empty", "Approvals, all done"],
  ["schedule", "Schedule"],
  ["settings", "Settings"],
  ["account", "Account"],
  ["login", "Sign in"],
  ["otp", "Code"],
  ["onboarding", "Welcome"],
];
for (const [i, [path, title]] of SCREENS.entries()) {
  await phone(`P${i + 1}`, path.replace(/\?state=/, "-"), `${title} (/mobile/app/${path})`, `/mobile/app/${path}`, async () => sleep(path.startsWith("assistant") ? 3600 : 700));
}

// ---------------------------------------------------------------- F: flows, key steps
const APP = "/mobile/app";
/** A flow: states are steps; `act` replays the steps up to the given one. */
async function flow(letter, slug, title, path, steps) {
  await phone(letter, slug, title, path, async (p, s) => {
    for (const st of steps) {
      await st.run(p);
      if (st.key === s.key) break;
    }
  }, { states: steps.map((st) => S(st.key, st.label)) });
}
await flow("F1", "orders", "Orders: list → order slides in → courier sheet → Mark packed (snackbar, Undo)", `${APP}/orders`, [
  { key: "list", label: "List", run: async () => sleep(400) },
  { key: "detail", label: "Order", run: async (p) => (await p.locator(`${P} [data-app-screen=orders] [role=listitem] button`).first().click(), sleep(700)) },
  { key: "courier", label: "Courier", run: async (p) => (await p.getByRole("button", { name: /^Courier/ }).first().click(), sleep(800)) },
  { key: "packed", label: "Packed", run: async (p) => (await p.keyboard.press("Escape"), await sleep(600), await btn(p, "Mark packed").click(), sleep(900)) },
]);
await flow("F2", "product", "Products: product → Edit (full-screen modal) → price keypad → saved", `${APP}/products`, [
  { key: "product", label: "Product", run: async (p) => (await sleep(400), await p.locator(`${P} [data-app-screen=products] [role=listitem] button`).first().click(), sleep(800)) },
  { key: "edit", label: "Edit", run: async (p) => (await btn(p, "Edit product").click(), sleep(800)) },
  { key: "price", label: "Price", run: async (p) => (await p.getByRole("button", { name: /^Price/ }).click(), await sleep(700), await btn(p, "000").click(), await btn(p, "Delete").click().catch(() => {}), sleep(300)) },
  { key: "saved", label: "Saved", run: async (p) => (await btn(p, "Done").click(), await sleep(500), await btn(p, "Save").click(), sleep(1400)) },
]);
await flow("F3", "stock-count", "Stock count: scan three times → finish asks first", `${APP}/stock-count`, [
  { key: "scan", label: "Scanned", run: async (p) => { for (let i = 0; i < 3; i++) {
    await p.getByRole("button", { name: "Read the code in the frame" }).click();
    await sleep(800);
  } } },
  { key: "finish", label: "Finish", run: async (p) => (await btn(p, "Finish count").click(), sleep(600)) },
]);
await flow("F4", "customers", "Customers: A–Z scrub → a customer's profile and orders", `${APP}/customers`, [
  { key: "scrub", label: "Scrub to M", run: async (p) => {
    const st = await at(p, `${P} [role=slider][aria-label="Jump to letter"]`);
    await p.mouse.move(st.x, st.b.y + 10);
    await p.mouse.down();
    await p.mouse.move(st.x, st.b.y + st.b.height * 0.5, { steps: 8 });
    await sleep(300);
  } },
  { key: "profile", label: "Profile", run: async (p) => (await p.mouse.up(), await sleep(300), await p.locator(`${P} [data-app-screen=customers] [role=listitem] button`).nth(2).click(), sleep(800)) },
]);
await flow("F5", "chat", "Inbox: chat → a quick reply sent → the buyer answers", `${APP}/inbox`, [
  { key: "inbox", label: "Inbox", run: async () => sleep(300) },
  { key: "chat", label: "Chat", run: async (p) => (await btn(p, "Nadia Putri").click(), sleep(900)) },
  { key: "reply", label: "Answer", run: async (p) => (await btn(p, "Yes, we'll gift wrap it").click(), sleep(2800)) },
]);
await flow("F6", "assistant", "Assistant: the answer streams in → sources and a proposed order → created", `${APP}/assistant`, [
  { key: "stream", label: "Streaming", run: async () => sleep(700) },
  { key: "answer", label: "Answer", run: async () => sleep(3400) },
  { key: "applied", label: "Applied", run: async (p) => (await p.locator(`${P} [data-mobile-screen]`).last().evaluate((el) => (el.scrollTop = el.scrollHeight)), await btn(p, "Create order").click(), sleep(1500)) },
]);
await flow("F7", "notifications", "Notifications: swipe to clear → all cleared", `${APP}/notifications`, [
  { key: "swipe", label: "Swiped", run: async (p) => { const r = await at(p, `${P} [role=listitem]`); await drag(p, { x: r.b.x + r.b.width * 0.7, y: r.y }, -120, 0); await sleep(600); } },
  { key: "cleared", label: "All cleared", run: async (p) => (await btn(p, "Clear all").click(), sleep(800)) },
]);
await flow("F8", "reports", "Reports: date range sheet → 7 days → finger on the chart", `${APP}/reports`, [
  { key: "sheet", label: "Dates", run: async (p) => (await p.getByRole("button", { name: /^Dates/ }).click(), sleep(800)) },
  { key: "week", label: "7 days", run: async (p) => (await p.locator(`${P} [role=dialog] button`, { hasText: "7 days" }).click(), await sleep(300), await p.locator(`${P} [role=dialog] button`, { hasText: /^Show/ }).click(), sleep(800)) },
  { key: "scrub", label: "Scrubbing", run: async (p) => { const c = await at(p, `${P} [role=slider]`); await drag(p, { x: c.b.x + 10, y: c.y }, c.b.width * 0.6, 0, { hold: true }); await sleep(200); } },
]);
await flow("F9", "pos", "New sale: cart → cash on the keypad → receipt", `${APP}/pos`, [
  { key: "cart", label: "Cart", run: async () => sleep(300) },
  { key: "pay", label: "Cash", run: async (p) => (await btn(p, "Charge").click(), await sleep(700), await p.locator(`${P} button`, { hasText: /^500\.000$/ }).click(), sleep(300)) },
  { key: "receipt", label: "Receipt", run: async (p) => (await btn(p, "Take cash").click(), sleep(900)) },
]);
await flow("F10", "delivery", "Proof of delivery: pick photos → uploading → signed", `${APP}/delivery`, [
  { key: "photos", label: "Photos", run: async (p) => { await btn(p, "Add").click(); await sleep(800); for (const i of [2, 5]) await p.locator(`${P} [role=dialog] [role=checkbox]`).nth(i).click(); await sleep(300); } },
  { key: "upload", label: "Uploading", run: async (p) => (await btn(p, "Add 2 photos").click(), sleep(900)) },
  { key: "signed", label: "Signed", run: async (p) => {
    await sleep(2500);
    await p.locator(`${P} [data-mobile-screen]`).last().evaluate((el) => (el.scrollTop = el.scrollHeight));
    await sleep(300);
    const c2 = await at(p, `${P} canvas`);
    const pts = Array.from({ length: 36 }, (_, i) => [c2.b.x + 50 + i * 7, c2.y + Math.sin(i / 2.6) * 24]);
    await p.mouse.move(...pts[0]);
    await p.mouse.down();
    for (const pt of pts) await p.mouse.move(...pt, { steps: 2 });
    await p.mouse.up();
    await sleep(400);
  } },
]);
await flow("F11", "approvals", "Approvals: swipe right to approve → approved, with Undo", `${APP}/approvals`, [
  { key: "swipe", label: "Swiped", run: async (p) => { const r = await at(p, `${P} article`); await drag(p, { x: r.b.x + 40, y: r.b.y + 20 }, 90, 0); await sleep(600); } },
  { key: "done", label: "Approved", run: async (p) => (await p.locator(`${P} article button`, { hasText: "Approve" }).first().click(), sleep(700)) },
]);
await flow("F12", "sign-in", "Sign in: number too short → code from the message → signed in", `${APP}/login`, [
  { key: "error", label: "Error", run: async (p) => (await p.locator(`${P} input`).fill("812 44"), await btn(p, "Send code").click(), sleep(500)) },
  { key: "code", label: "Code", run: async (p) => (await p.locator(`${P} input`).first().fill("812 4410 2231"), await btn(p, "Send code").click(), sleep(1700)) },
  { key: "success", label: "Correct", run: async (p) => (await btn(p, "Your Rimba code is").click(), sleep(1900)) },
  { key: "home", label: "Home", run: async () => sleep(1400) },
]);
await flow("F13", "onboarding", "Welcome: swipe through to Get started", `${APP}/onboarding`, [
  { key: "one", label: "Page 1", run: async () => sleep(200) },
  { key: "two", label: "Page 2 (swiped)", run: async (p) => (await p.locator(`${P} [aria-roledescription=carousel]`).evaluate((el) => el.scrollTo({ left: el.clientWidth, behavior: "instant" })), sleep(600)) },
  { key: "last", label: "Last", run: async (p) => (await p.locator(`${P} [aria-roledescription=carousel]`).evaluate((el) => el.scrollTo({ left: el.clientWidth * 3, behavior: "instant" })), sleep(600)) },
]);
await flow("F14", "long-press", "Orders: long-press a row → its menu (same actions as the swipe)", `${APP}/orders`, [
  { key: "menu", label: "Long press", run: async (p) => {
    await sleep(500);
    const r = await at(p, `${P} [data-app-screen=orders] [role=listitem]`, 1);
    await p.mouse.move(r.x - 40, r.y);
    await p.mouse.down();
    await sleep(650);
    await p.mouse.up();
    await sleep(400);
  } },
]);

// ---------------------------------------------------------------- G: site pages
async function page(letter, slug, title, path, { width = 1440, height = 1000, full = false } = {}) {
  if (!want(letter)) return;
  const cols = [];
  for (const theme of ["dark", "light"]) {
    const file = `${OUT}/parts/${letter}-${slug}-${theme}.png`;
    try {
      const { page: pg, ctx } = await open(path, theme, { width, height, settle: 1600 });
      await pg.screenshot({ path: file, fullPage: full });
      await ctx.close();
    } catch (e) {
      log.errors.push(`${letter} ${theme}: ${e.message.split("\n")[0]}`);
    }
    cols.push({ label: theme, file });
  }
  await compose(`${letter}-${slug}`, `${letter} · ${title}`, cols, { w: width === 390 ? 390 : 900 });
}
await page("G1", "screens-gallery", "/mobile/screens: a live phone per screen, each opens it full screen", "/mobile/screens");
await page("G2", "overview", "/mobile: the overview with the new tiles and the All screens link", "/mobile");
await page("G3", "screens-390", "/mobile/screens at 390 px", "/mobile/screens", { width: 390, height: 844 });
await page("G4", "app-390", "/mobile/app/home on a phone (full screen)", "/mobile/app/home", { width: 390, height: 844 });

writeFileSync(`${OUT}/checks.json`, JSON.stringify(log, null, 2));
console.log(`${log.shots.length} composites, ${log.errors.length} errors`);
log.errors.forEach((e) => console.log(`ERR ${e}`));
await browser.close();
process.exit(0);
