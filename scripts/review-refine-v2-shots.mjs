// Refine v2 review shots: the most visible changes of the pass, before (BEFORE_DIST) stacked above after (AFTER_DIST),
// as R1-<slug>.png, R2-<slug>.png… in OUT (default output/refine-v2/review). Same viewport, theme and state for both.
// ONLY=<regex> matches the file name; numbers come from the list, so a filtered run keeps them.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const OUT = process.env.OUT || "output/refine-v2/review";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
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
    if (i > 80) throw new Error(`preview on ${port} did not start`);
    await sleep(250);
  }
}
process.on("exit", () => servers.forEach((s) => s.kill("SIGTERM")));
const VERSIONS = [
  { key: "before", base: await serve(process.env.BEFORE_DIST, 5331), label: `Before (${process.env.REF || "042c542"})` },
  { key: "after", base: await serve(process.env.AFTER_DIST || "dist", 5332), label: "After" },
];

const log = { errors: [], missing: [], shots: [] };
const browser = await chromium.launch();
const VP = {
  desk: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  desk1024: { viewport: { width: 1024, height: 800 }, deviceScaleFactor: 2 },
  // Component pages that show a framed phone: tall enough for the whole phone, shot on the phone's screen.
  deskTall: { viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);
async function open(v, path, theme, vp) {
  const ctx = await browser.newContext(VP[vp]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.errors.push(`${v.key} ${path}: ${e.message}`));
  await page.goto(`${v.base}${q(path, theme)}`, { waitUntil: "networkidle" });
  await sleep(500);
  return page;
}
/** The element (padded) plus any `extra` popovers, or the viewport when target is "viewport". */
async function shoot(page, target, file, { pad = 16, extra = [] } = {}) {
  if (target === "viewport") return (await page.screenshot({ path: file }), true);
  const l = page.locator(target).first();
  if (!(await l.count())) return false;
  const b = await l.boundingBox();
  if (!b) return false;
  let [x0, y0, x1, y1] = [b.x, b.y, b.x + b.width, b.y + b.height];
  for (const sel of extra) {
    const e = page.locator(sel).first();
    const eb = (await e.count()) ? await e.boundingBox() : null;
    if (eb) [x0, y0, x1, y1] = [Math.min(x0, eb.x), Math.min(y0, eb.y), Math.max(x1, eb.x + eb.width), Math.max(y1, eb.y + eb.height)];
  }
  const { width: vw, height: vh } = page.viewportSize();
  const x = Math.max(0, x0 - pad);
  const y = Math.max(0, y0 - pad);
  await page.screenshot({ path: file, clip: { x, y, width: Math.min(vw - x, x1 - x0 + pad * 2), height: Math.min(vh - y, y1 - y0 + pad * 2) } });
  return true;
}
async function center(page, sel) {
  const l = page.locator(sel).first();
  if (await l.count()) await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(300);
}
/** Keyboard focus on `sel`: focus it, Shift+Tab off and Tab back, so it holds focus by keyboard (:focus-visible). */
async function tabTo(page, sel) {
  await center(page, sel);
  await page.mouse.move(2, 600);
  await page.locator(sel).first().focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await sleep(350);
  const ok = await page.evaluate((s) => !!document.activeElement?.matches(s) && document.activeElement.matches(":focus-visible"), sel);
  if (!ok) throw new Error(`keyboard focus did not land on ${sel}`);
}
const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
/** Before above after, each at its CSS size (shots are 2x, the sheet is 2x). */
async function compose(name, title, theme, rows) {
  const dark = theme === "dark";
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;width:max-content;min-width:600px}
    h1{font-size:16px;font-weight:600;margin:0 0 16px}
    figure{margin:0 0 24px;display:grid;gap:8px}
    figcaption{font-weight:600}
    img{display:block;outline:1px solid ${dark ? "#333" : "#ccc"}}
    .none{height:80px;width:400px;display:grid;place-items:center;opacity:.6;background:${dark ? "#1a1a1a" : "#e9e9e9"}}
  </style><h1>${title}</h1>${rows
    .map((c) => `<figure><figcaption>${c.label}</figcaption>${c.file && existsSync(c.file) ? `<img src="${dataUri(c.file)}" onload="this.width=this.naturalWidth/2">` : `<div class=none>missing</div>`}</figure>`)
    .join("")}`;
  const ctx = await browser.newContext({ viewport: { width: 800, height: 200 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = r))))));
  await page.evaluate(() => [...document.images].forEach((i) => (i.width = i.naturalWidth / 2)));
  const w = await page.evaluate(() => Math.ceil(document.body.getBoundingClientRect().width + 48));
  await page.setViewportSize({ width: w, height: 200 });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await ctx.close();
}

const stage = "[data-stage]";
const pop = "[data-radix-popper-content-wrapper]";
const phone = "[data-phone-screen]";
const S = (slug, title, path, vp, theme, act, target = stage, opts = {}) => ({ slug, title, path, vp, theme, act, target, opts });
const atStage = (p) => center(p, stage);
const none = async () => {};
const clickIn = (sel, wait = 600) => async (p) => {
  await center(p, stage);
  await p.locator(sel).first().click();
  await p.mouse.move(2, 600);
  await sleep(wait);
};

const LIST = [
  // Dark floating layers (D2): page grey, darker than the card under them.
  S("menu-dark", "Menu open: darker than the page in dark (D2)", "/components/menu", "desk", "dark", clickIn("main button:has-text('Actions')"), stage, { extra: ["[role=menu]"] }),
  S("select-dark", "Select open: darker than the page in dark (D2)", "/components/select", "desk", "dark", clickIn(`${stage} [aria-haspopup=listbox]`), stage, { extra: ["[role=listbox]"] }),
  S("hover-card-dark", "Hover card: page grey in dark, wider, plain stats that don't wrap (D2, A-1, A-17)", "/components/hover-card", "desk", "dark", async (p) => {
    await center(p, stage);
    await p.locator(`${stage} a[href="#customer"]`).first().hover();
    await sleep(900);
  }, stage, { extra: [pop] }),
  S("toast-dark", "Toast: on the tooltip grey in dark, not a light slab (D2)", "/components/toast", "desk", "dark", async (p) => {
    await center(p, stage);
    await p.locator(`${stage} button`).first().click();
    await p.mouse.move(2, 300);
    await sleep(700);
  }, "viewport"),
  // Accent contrast (D3) and 16 px icons (D1).
  S("button-dark", "Buttons: accent label reaches 4.5:1 in dark; icons 16 px (D3, B-2)", "/components/button", "desk", "dark", atStage),
  S("button-light", "Buttons, light: icons 16 px, accent darkened to pass 4.5:1 (D3, B-2)", "/components/button", "desk", "light", atStage),
  S("toggle-group-dark", "Toggle group: icons 13 → 16 px, items spaced by the nest gap (B-2, B-16)", "/components/toggle-group", "desk", "dark", atStage),
  // Keyboard focus is a fill, never a ring (D5).
  S("tabs-focus-dark", "Tabs: icons 13 → 16 px; keyboard focus on the selected tab darkens its pill (B-2, D5)", "/components/tabs", "desk", "dark", (p) => tabTo(p, `${stage} [role=tab]`)),
  S("checkbox-focus-light", "Checkbox field: keyboard focus fills the whole row (D5, A-9)", "/components/checkbox", "desk", "light", (p) => tabTo(p, `${stage} [role=checkbox]`)),
  S("skip-link-dark", "First Tab: “Skip to content” appears over the logo; the Customize flap stays shut (C-1)", "/", "desk", "dark", async (p) => {
    await p.mouse.move(900, 500);
    await p.keyboard.press("Tab");
    await sleep(400);
  }, "viewport"),
  S("alert-light", "Neutral alert: the Sync action reads as a button (A-3, C-5)", "/components/alert", "desk", "light", atStage),
  S("alert-dark", "Neutral alert, dark: the Sync action reads as a button (A-3, C-5)", "/components/alert", "desk", "dark", atStage),
  // Pages.
  S("products-loading-dark", "Products loading: skeleton matches the loaded table, no real data under it (D7, C-4)", "/examples/products?loading=1", "desk", "dark", none, "viewport"),
  S("dashboard-loading-dark", "Dashboard loading: attention-row skeletons show on their fill (C-21)", "/examples/dashboard?loading=1", "desk", "dark", none, "viewport"),
  S("orders-1024-dark", "Orders at 1024: Export/Add on the filter row, Total in view, one pager (C-13, B-5, B-8)", "/examples/orders", "desk1024", "dark", none, "viewport"),
  S("cancellations-dark", "Cancellations: By reason under the table, so Status is no longer cut off at 1440", "/examples/cancellations", "desk", "dark", none, "viewport"),
  S("settings-dark", "Settings: column on the content edge like the other pages; no credit line (C-8, C-9)", "/examples/settings", "desk", "dark", none, "viewport"),
  S("team-dark", "Team: one column grid for every row, no avatar stack in the title (C-12, C-24)", "/examples/team", "desk", "dark", none, "viewport"),
  S("calendar-month-dark", "Calendar month: “+n more” is a button with the day's list (A-12)", "/components/calendar-month", "desk", "dark", atStage),
  S("time-picker-dark", "Time picker: chosen hour is a grey pill, rows aligned and snapping (B-7, B-13)", "/components/time-picker", "desk", "dark", clickIn(`${stage} button`, 700), stage, { extra: [pop] }),
  S("encyclopedia-dark", "Encyclopedia: 253 → 219 rules, count in the title", "/encyclopedia", "desk", "dark", none, "viewport"),
  // Phone.
  S("m-orders-dark", "Phone orders: time first so it never truncates; 56 px rows; scrim under the tab bar (E-6, D-28, E-7)", "/mobile/app/orders", "phone", "dark", none, "viewport"),
  S("m-order-dark", "Phone order: 44 px nav bar; accent action label passes 4.5:1; even section gaps (E-4, E-5, E-8)", "/mobile/app/order", "phone", "dark", none, "viewport"),
  S("m-products-dark", "Phone products: New product is a floating button on the list (D4, E-25)", "/mobile/app/products", "phone", "dark", none, "viewport"),
  S("m-home-dark", "Phone home: 2 × 2 stats, New sale floating button, title “Home” (E-24, E-31, E-36)", "/mobile/app/home", "phone", "dark", none, "viewport"),
  S("m-pos-dark", "Phone POS: tap a row to add, names get the width, Clear moves to a trash icon with Undo (E-10, E-11)", "/mobile/app/pos", "phone", "dark", none, "viewport"),
  S("m-receipt-dark", "Phone receipt: no Back into a paid cart; Done and New sale (E-1)", "/mobile/app/pos-receipt", "phone", "dark", none, "viewport"),
  S("m-reports-dark", "Phone reports: thousands dots, daily average headline (E-16, E-17)", "/mobile/app/reports", "phone", "dark", none, "viewport"),
  S("m-product-dark", "Phone product: small title, price and stock first, shorter photo (E-13, E-14, E-15)", "/mobile/app/product", "phone", "dark", none, "viewport"),
  S("m-modal-dark", "Phone modal: Save pinned at the bottom in thumb reach (D4, D-14)", "/mobile/mobile-modal?open=1", "deskTall", "dark", (p) => center(p, phone), phone),
  S("m-az-dark", "A–Z scrubber, finger on the drawn “S”: it now jumps to S, with the bubble at the letter (D-2)", "/mobile/mobile-index-list", "deskTall", "dark", async (p) => {
    await center(p, phone);
    // The finger on the drawn "S" in each build: before, the strip mapped it to another letter.
    const strip = p.locator('[data-phone-screen] [role=slider][aria-label="Jump to letter"]').first();
    const sb = await strip.boundingBox();
    const s = await strip.getByText("S", { exact: true }).first().boundingBox();
    await p.mouse.move(sb.x + sb.width / 2, s ? s.y + s.height / 2 : sb.y + sb.height * 0.75);
    await p.mouse.down();
    await sleep(450);
    p.__release = () => p.mouse.up();
  }, phone),
  S("m-longpress-dark", "Long-press menu: the lifted row sits exactly on its item; the release doesn't pick (D-1, D-13)", "/mobile/mobile-context-menu", "deskTall", "dark", async (p) => {
    await center(p, phone);
    const b = await p.locator("[data-phone-screen] [role=listitem]").nth(1).boundingBox();
    await p.mouse.move(b.x + b.width / 2 - 60, b.y + b.height / 2);
    await p.mouse.down();
    await sleep(650);
    await p.mouse.up();
    await sleep(500);
  }, phone),
  S("m-stock-count-dark", "Phone stock count: names on two lines, newest scan on top (E-12)", "/mobile/app/stock-count", "phone", "dark", none, "viewport"),
];

let n = 0;
for (const s of LIST) {
  n++;
  const name = `R${n}-${s.slug}`;
  if (ONLY && !ONLY.test(name)) continue;
  const rows = [];
  for (const v of VERSIONS) {
    const file = `${OUT}/parts/${name}-${v.key}.png`;
    let ok = false;
    try {
      const page = await open(v, s.path, s.theme, s.vp);
      await s.act(page);
      ok = await shoot(page, s.target, file, s.opts);
      if (page.__release) await page.__release();
      await page.context().close();
    } catch (e) {
      log.errors.push(`${v.key} ${name}: ${e.message.split("\n")[0]}`);
    }
    if (!ok) log.missing.push(`${v.key} ${name}`);
    rows.push({ label: v.label, file: ok ? file : null });
  }
  const size = VP[s.vp].viewport;
  await compose(name, `R${n} ${s.title} · ${size.width}×${size.height} · ${s.theme}`, s.theme, rows);
  log.shots.push({ name, title: s.title, vp: s.vp, theme: s.theme });
  console.log(name);
}
writeFileSync(`${OUT}/log.json`, JSON.stringify({ versions: VERSIONS.map(({ key, label }) => ({ key, label })), ...log }, null, 2));
await browser.close();
servers.forEach((s) => s.kill("SIGTERM"));
console.log(`${log.shots.length} shots, ${log.missing.length} missing, ${log.errors.length} errors`);
