// Mobile v1 review shots. AFTER_DIST = this tree, BEFORE_DIST = the commit before the Desktop | Mobile split.
// M letters (output/mobile-v1): every mobile component and the example app flow, phone-sized, dark | light side by side.
// N letters: the site nav split, before | after. ONLY=<regex on the letter> to run some. checks.json: measured facts.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const OUT = process.env.OUT || "output/mobile-v1";
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
const AFTER = { key: "after", base: await serve(process.env.AFTER_DIST, 5195), label: "After" };
const BEFORE = process.env.BEFORE_DIST ? { key: "before", base: await serve(process.env.BEFORE_DIST, 5194), label: `Before (${process.env.BEFORE_REF})` } : null;

const log = { errors: [], shots: [] };
const browser = await chromium.launch();
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);

async function open(v, path, theme, { width = 1440, height = 1100, scale = 2, settle = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, hasTouch: false });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.errors.push(`${v.key} ${path}: ${e.message}`));
  await page.goto(`${v.base}${q(path, theme)}`, { waitUntil: settle < 500 ? "domcontentloaded" : "networkidle" });
  await page.mouse.move(2, 2);
  await sleep(settle);
  return { page, ctx };
}
const frame = (page, i = 0) => page.locator("[data-phone-frame]").nth(i);
const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;

/** Composite: title, then columns (each a labelled image). */
async function compose(name, title, cols, { dark = true, w = 390 } = {}) {
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0}.wrap{display:inline-block;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
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
  log.shots.push(name);
  console.log(`wrote ${OUT}/${name}.png`);
}

/** One phone state in both themes: path, then `act` on the page, then the frame is shot. */
async function phone(letter, slug, title, path, act, { states } = {}) {
  if (!want(letter)) return;
  const cols = [];
  for (const theme of ["dark", "light"]) {
    for (const st of states ?? [{ key: "", label: "" }]) {
      const file = `${OUT}/parts/${letter}-${slug}${st.key ? `-${st.key}` : ""}-${theme}.png`;
      try {
        const { page, ctx } = await open(AFTER, typeof path === "function" ? path(st) : path, theme, { settle: st.settle ?? 900 });
        if (act) await act(page, st);
        await frame(page).screenshot({ path: file });
        await ctx.close();
      } catch (e) {
        log.errors.push(`${letter} ${theme} ${st.key}: ${e.message.split("\n")[0]}`);
      }
      cols.push({ label: `${st.label ? `${st.label} · ` : ""}${theme}`, file });
    }
  }
  await compose(`${letter}-${slug}`, `${letter} · ${title}`, cols);
}
const at = async (page, sel) => {
  const b = await page.locator(sel).first().boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
};
async function drag(page, from, dx, dy, { steps = 12, hold = false, delay = 12 } = {}) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    await sleep(delay);
  }
  if (!hold) await page.mouse.up();
}

// ---------------------------------------------------------------- M: the components
await phone("M1", "tab-bar", "Tab bar: labels, then icons only", (s) => `/mobile/mobile-tab-bar${s.key === "icons" ? "?iconOnly=1" : ""}`, async (p) => {
  await p.locator("[data-mobile-tab-bar] button").nth(2).click();
  await sleep(500);
}, { states: [{ key: "labels", label: "Labels" }, { key: "icons", label: "Icons only" }] });
await phone("M2", "nav-bar", "Large-title nav bar: at the top, then scrolled (title moves into the bar)", "/mobile/mobile-nav-bar", async (p, s) => {
  if (s.key === "scrolled") await p.locator("[data-phone-screen] [data-mobile-screen]").evaluate((el) => (el.scrollTop = 180));
  await sleep(300);
}, { states: [{ key: "top", label: "Top" }, { key: "scrolled", label: "Scrolled" }] });
await phone("M3", "action-bar", "Action bar: above the home indicator, then above the keyboard", (s) => `/mobile/mobile-action-bar${s.key === "keyboard" ? "?keyboard=1" : ""}`, null, {
  states: [{ key: "rest", label: "Rest" }, { key: "keyboard", label: "Keyboard open" }],
});
await phone("M4", "list", "Grouped list, inset", "/mobile/mobile-list", null);
await phone("M5", "swipe", "Swipe actions: row swiped left, then right", "/mobile/mobile-swipe-row", async (p, s) => {
  const row = await at(p, "[data-phone-screen] [role=listitem]");
  await drag(p, { x: row.b.x + row.b.width * 0.7, y: row.y }, s.key === "left" ? -150 : 90, 0);
  await sleep(600);
}, { states: [{ key: "left", label: "Swiped left" }, { key: "right", label: "Swiped right" }] });
await phone("M6", "pull-refresh", "Pull to refresh: pulling (dots fill), then refreshing (dots wave)", "/mobile/mobile-pull-refresh", async (p, s) => {
  const row = await at(p, "[data-phone-screen] [role=listitem]");
  await drag(p, row, 0, s.key === "pull" ? 70 : 200, { hold: s.key === "pull", steps: 16 });
  await sleep(s.key === "pull" ? 100 : 350);
}, { states: [{ key: "pull", label: "Pulling" }, { key: "refresh", label: "Refreshing" }] });
await phone("M7", "skeleton", "Skeleton list, then loaded (same boxes)", (s) => `/mobile/mobile-list-skeleton${s.key === "loaded" ? "?loading=0" : ""}`, null, {
  states: [{ key: "loading", label: "Loading" }, { key: "loaded", label: "Loaded" }],
});
await phone("M8", "empty", "Empty state", "/mobile/mobile-empty-state", null);
await phone("M9", "sheet", "Bottom sheet: half detent, then dragged to full", "/mobile/mobile-sheet", async (p, s) => {
  await p.locator("[data-phone-screen] [role=listitem] button").first().click();
  await sleep(700);
  if (s.key === "full") {
    const h = await at(p, "[data-phone-screen] [role=dialog] .cursor-grab");
    await drag(p, h, 0, -320, { steps: 14 });
    await sleep(700);
  }
}, { states: [{ key: "half", label: "Half" }, { key: "full", label: "Full" }] });
await phone("M10", "action-sheet", "Action sheet", "/mobile/mobile-action-sheet", async (p) => {
  await p.getByRole("button", { name: "More actions" }).click();
  await sleep(700);
});
await phone("M11", "date-picker", "Wheel picker: date, then time", (s) => `/mobile/mobile-date-picker${s.key === "time" ? "?mode=time" : ""}`, async (p) => {
  await p.locator("[data-phone-screen] [role=listitem] button").first().click();
  await sleep(800);
}, { states: [{ key: "date", label: "Date" }, { key: "time", label: "Time" }] });
await phone("M12", "segmented", "Segmented control, touch size", "/mobile/mobile-segmented", async (p) => {
  await p.getByRole("radio", { name: "To ship" }).click();
  await sleep(500);
});
await phone("M13", "search", "Search bar: at rest, then typing (Cancel slid in)", "/mobile/mobile-search-bar", async (p, s) => {
  if (s.key === "typing") {
    await p.locator("[data-phone-screen] input[type=search]").click();
    await p.keyboard.type("gelas");
    await sleep(500);
  }
}, { states: [{ key: "rest", label: "Rest" }, { key: "typing", label: "Typing" }] });
await phone("M14", "stepper", "Stepper, touch size", "/mobile/mobile-stepper", null);
await phone("M15", "snackbar", "Snackbar above the tab bar, with Undo", "/mobile/mobile-snackbar", async (p) => {
  await p.getByRole("button", { name: /Mark .* packed/ }).first().click();
  await sleep(600);
});

// ---------------------------------------------------------------- M: the example app flow
const APP = "/mobile/app";
await phone("M16", "app-list", "Example app: Orders (loading, then loaded)", APP, async (p, s) => {
  if (s.key === "loading") return;
  await sleep(600);
}, { states: [{ key: "loading", label: "First 0.7 s", settle: 250 }, { key: "loaded", label: "Loaded" }] });
await phone("M17", "app-detail", "Example app: tap an order → detail slides in", APP, async (p) => {
  await sleep(600);
  await p.locator("[data-phone-screen] [role=listitem] button").first().click();
  await sleep(700);
});
await phone("M18", "app-actions", "Example app: … → action sheet", APP, async (p) => {
  await sleep(600);
  await p.locator("[data-phone-screen] [role=listitem] button").first().click();
  await sleep(600);
  await p.getByRole("button", { name: "More actions" }).click();
  await sleep(700);
});
await phone("M19", "app-courier", "Example app: Change courier → bottom sheet", APP, async (p) => {
  await sleep(600);
  await p.locator("[data-phone-screen] [role=listitem] button").first().click();
  await sleep(600);
  await p.getByRole("button", { name: /Courier/ }).first().click();
  await sleep(800);
});
await phone("M20", "app-packed", "Example app: Mark packed → back to the list, snackbar with Undo", APP, async (p) => {
  await sleep(600);
  await p.locator("[data-phone-screen] [role=listitem] button").first().click();
  await sleep(600);
  await p.getByRole("button", { name: "Mark packed" }).click();
  await sleep(900);
});

// ---------------------------------------------------------------- N: the nav split
async function pair(letter, slug, title, path, { width = 1440, height = 900, clip, act, theme = "dark" } = {}) {
  if (!want(letter)) return;
  const cols = [];
  for (const v of [BEFORE, AFTER].filter(Boolean)) {
    const p2 = typeof path === "function" ? path(v) : path;
    const file = `${OUT}/parts/${letter}-${slug}-${v.key}.png`;
    if (!p2) {
      cols.push({ label: v.label, note: "Did not exist" });
      continue;
    }
    try {
      const { page, ctx } = await open(v, p2, theme, { width, height, scale: width > 600 ? 1.5 : 2 });
      if (act) await act(page, v);
      await page.screenshot({ path: file, clip: clip ?? { x: 0, y: 0, width, height } });
      await ctx.close();
    } catch (e) {
      log.errors.push(`${letter} ${v.key}: ${e.message.split("\n")[0]}`);
    }
    cols.push({ label: v.label, file });
  }
  await compose(`${letter}-${slug}`, `${letter} · ${title}`, cols, { w: width > 600 ? 1040 : width });
}
await pair("N1", "components-top", "Components page: the Desktop | Mobile switch next to the title", "/components", { clip: { x: 0, y: 0, width: 1440, height: 420 } });
await pair("N2", "detail-sidebar", "A component page: the switch on top of the sidebar", "/components/segmented");
await pair("N3", "mobile-overview", "Components → Mobile: the example app and composed phone screens", (v) => (v.key === "before" ? null : "/mobile"), { height: 1300 });
await pair("N4", "mobile-detail", "A mobile component page: Mobile groups in the sidebar, the demo in a 390 × 844 phone", (v) => (v.key === "before" ? null : "/mobile/mobile-sheet"), { height: 1100 });
await pair("N5", "phone-width", "At 390 px: the switch above the component picker", (v) => (v.key === "before" ? "/components/segmented" : "/components/segmented"), { width: 390, height: 844 });
await pair("N6", "phone-mobile", "At 390 px: a mobile page, the phone scaled to fit", (v) => (v.key === "before" ? null : "/mobile/mobile-tab-bar"), { width: 390, height: 844 });

writeFileSync(`${OUT}/checks.json`, JSON.stringify(log, null, 2));
await browser.close();
console.log(`${log.shots.length} composites, ${log.errors.length} errors`);
if (log.errors.length) console.log(log.errors.join("\n"));
process.exit(log.errors.length ? 1 : 0);
