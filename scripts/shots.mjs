// Headless review screenshots + automatic taste checks. Run through the job queue:
//   job submit --kind script --name alora-design-shots ... --cmd './scripts/shots'
// Serves the built site on its own port, writes output/review-v2/*.png, index.md and checks.json.
// Dark is the default theme; light shots add t=l. ONLY=<regex> limits the shots.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = Number(process.env.SHOTS_PORT || 5197);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = process.env.OUT || "output/review-v2";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith(".png") || f === "index.md" || f === "checks.json") rmSync(`${OUT}/${f}`);

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
const stop = () => server.kill("SIGTERM");
process.on("exit", stop);

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("preview server did not start");
}

const VIEWS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const index = [];
const checks = { borders: [], fonts: new Set(), shifts: [], skeleton: [], header: [], errors: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// v1 letters G1–G41 keep their order; niche components are N1–N28.
const CORE = [
  "corner-shape", "scrollbar", "button", "menu", "toolbar", "save-bar", "input", "search", "field", "select", "multi-select", "combobox",
  "date-picker", "period-stepper", "language-picker", "segmented", "tabs", "switch", "checkbox", "radio", "slider", "card", "metric-card",
  "table", "attention-list", "bar-chart", "status", "badge", "avatar", "thumb", "alert", "progress", "empty-state", "skeleton", "dialog",
  "sheet", "popover", "tooltip", "toast", "sidebar", "bottom-nav",
];
const NICHE = [
  "command-palette", "date-range-picker", "time-picker", "quantity-stepper", "currency-input", "diff", "fee-row", "marketplace-mark",
  "shop-picker", "split-button", "toggle-group", "context-menu", "hover-card", "column-menu", "inline-edit", "copy-chip", "kbd", "sparkline",
  "progress-ring", "steps", "timeline", "comment-thread", "dropzone", "tag-input", "avatar-group", "notification-bell", "kanban-card",
  "calendar-month",
];

/** Visible borders/outlines anywhere = a dividing line (taste Never #3). */
async function scan(page, label) {
  const res = await page.evaluate(() => {
    const out = { borders: [], fonts: [] };
    const fonts = new Set();
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || cs.visibility === "hidden") continue;
      if (el.closest("svg")) continue;
      if (el.tagName !== "CODE" && el.tagName !== "PRE") fonts.add(cs.fontFamily.split(",")[0].trim());
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        const w = parseFloat(cs[`border${side}Width`]);
        const c = cs[`border${side}Color`];
        if (w > 0 && cs[`border${side}Style`] !== "none" && !/rgba\(.*, 0\)$/.test(c) && c !== "transparent") {
          out.borders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} border-${side.toLowerCase()} ${w}px ${c}`);
          break;
        }
      }
      if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) out.borders.push(`${el.tagName.toLowerCase()} outline ${cs.outlineWidth}`);
      if (el.tagName === "HR") out.borders.push("hr");
    }
    out.fonts = [...fonts];
    return out;
  });
  res.fonts.forEach((f) => checks.fonts.add(f));
  if (res.borders.length) checks.borders.push({ label, borders: [...new Set(res.borders)].slice(0, 8) });
}

/** Hover/focus must not move anything: compare boxes of every control before and after. */
async function shiftCheck(page, label) {
  const handles = await page.$$("button:not([disabled]), [role=option], [role=menuitem], input, [role=tab], [role=radio], label");
  for (const h of handles.slice(0, 16)) {
    try {
      await h.scrollIntoViewIfNeeded({ timeout: 500 });
      const before = await h.boundingBox();
      if (!before || before.width < 4) continue;
      await h.hover({ timeout: 500 });
      await sleep(260);
      const after = await h.boundingBox();
      if (after && (Math.abs(after.width - before.width) > 0.5 || Math.abs(after.height - before.height) > 0.5 || Math.abs(after.x - before.x) > 0.5 || Math.abs(after.y - before.y) > 0.5)) {
        checks.shifts.push({ label, before, after, el: await h.evaluate((e) => e.outerHTML.slice(0, 80)) });
      }
    } catch {}
  }
  await page.mouse.move(2, 2);
}

async function shot(page, file, what, el) {
  if (ONLY && !ONLY.test(file)) return;
  await sleep(250);
  if (el) {
    const b = await page.locator(el).first().boundingBox();
    const m = 20;
    await page.screenshot({ path: `${OUT}/${file}.png`, clip: { x: Math.max(0, b.x - m), y: Math.max(0, b.y - m), width: b.width + m * 2, height: b.height + m * 2 } });
  } else {
    // A sticky header would be painted mid-page in a stitched full-page capture.
    if (what.full) await page.addStyleTag({ content: "header{position:static!important}" });
    await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: what.full ?? false });
  }
  index.push({ file: `${file}.png`, ...what });
}

const want = (file) => !ONLY || ONLY.test(file);

async function run() {
  await waitUp();
  const browser = await chromium.launch();
  const ctxs = {};
  for (const [k, v] of Object.entries(VIEWS)) ctxs[k] = await browser.newContext({ ...v, reducedMotion: "no-preference" });

  async function visit(view, path, theme = "dark") {
    const page = await ctxs[view].newPage();
    page.on("pageerror", (e) => checks.errors.push(`${path}: ${e.message}`));
    const sep = path.includes("?") ? "&" : "?";
    await page.goto(`${BASE}${path}${theme === "light" ? `${sep}t=l` : ""}`, { waitUntil: "networkidle" });
    await sleep(300);
    return page;
  }

  // Header: same box on every page.
  for (const path of ["/", "/components", "/components/button", "/examples/dashboard", "/examples/team", "/export"]) {
    const page = await visit("desktop", path);
    const box = await page.evaluate(() => {
      const h = document.querySelector("header")?.getBoundingClientRect();
      const w = document.querySelector("header a")?.getBoundingClientRect();
      return h && w ? [h.x, h.y, h.width, h.height, Math.round(w.x), Math.round(w.y)].join(",") : "none";
    });
    checks.header.push({ path, box });
    await page.close();
  }

  // Pages
  const pages = [
    ["L1", "landing", "/", true, true],
    ["G0", "components-index", "/components", false, false],
    ["E1", "dashboard", "/examples/dashboard", false, true],
    ["E2", "orders", "/examples/orders", false, false],
    ["E3", "settings", "/examples/settings", true, false],
    ["E4", "products", "/examples/products", false, false],
    ["E5", "promotions", "/examples/promotions", false, false],
    ["E6", "cancellations", "/examples/cancellations", false, false],
    ["E7", "team", "/examples/team", false, false],
    ["X1", "export", "/export", true, false],
  ];
  for (const [letter, name, path, full, light] of pages) {
    for (const view of ["desktop", "phone"]) {
      for (const theme of light ? ["dark", "light"] : ["dark"]) {
        const file = `${letter}-${name}-${view}-${theme}`;
        if (!want(file)) continue;
        const page = await visit(view, path, theme);
        if (view === "desktop" && theme === "dark") {
          await scan(page, name);
          if (["landing", "settings", "products"].includes(name)) await shiftCheck(page, name);
        }
        await shot(page, file, { letter, what: name, view, theme, full: full && view === "desktop" ? true : full && view === "phone" ? false : false });
        await page.close();
      }
    }
  }

  // One shot per component page, desktop and phone, dark.
  const comps = [...CORE.map((n, i) => [`G${i + 1}`, n]), ...NICHE.map((n, i) => [`N${i + 1}`, n])];
  for (const [letter, name] of comps) {
    for (const view of ["desktop", "phone"]) {
      const file = `${letter}-${name}-${view}-dark`;
      if (!want(file)) continue;
      const page = await visit(view, `/components/${name}`);
      if (view === "desktop") {
        await scan(page, `components/${name}`);
        if (["button", "status", "segmented", "quantity-stepper", "toggle-group", "inline-edit", "copy-chip", "split-button"].includes(name)) await shiftCheck(page, `components/${name}`);
      }
      await shot(page, file, { letter, what: name, view, theme: "dark" });
      await page.close();
    }
  }

  // Metric variants A/B/C: whole stage, dark and light.
  for (const [letter, v] of [["M-A", "tile"], ["M-B", "scale"], ["M-C", "compact"]]) {
    for (const theme of ["dark", "light"]) {
      const file = `${letter}-metric-${v}-desktop-${theme}`;
      if (!want(file)) continue;
      const page = await visit("desktop", `/components/metric-card?variant=${v}`, theme);
      await shot(page, file, { letter, what: `metric ${v}`, view: "desktop", theme }, "[data-stage] > *");
      await page.close();
    }
    const file = `${letter}-metric-${v}-phone-dark`;
    if (want(file)) {
      const page = await visit("phone", `/components/metric-card?variant=${v}`);
      await shot(page, file, { letter, what: `metric ${v}`, view: "phone", theme: "dark" });
      await page.close();
    }
  }

  // Item 4 fixes, after: the same elements v1 showed on the landing wall (before/ holds the v1 crops).
  const fixes = [
    ["F1", "low-stock", "/components/attention-list", "[data-stage] > *"],
    ["F2", "bubbles", "/components/status", "[data-stage] > *"],
    ["F3", "date-trigger", "/components/date-picker", "[data-stage] > *"],
    ["F4", "alerts", "/components/alert", "[data-stage] > *"],
    ["F5", "metrics", "/components/metric-card", "[data-stage] > *"],
  ];
  for (const [letter, name, path, el] of fixes) {
    for (const theme of ["light", "dark"]) {
      const file = `${letter}-${name}-after-${theme}`;
      if (!want(file)) continue;
      const page = await visit("desktop", path, theme);
      await shot(page, file, { letter, what: `${name} (after)`, view: "desktop", theme }, el);
      await page.close();
    }
  }

  // States
  const rightClick = async (p, sel) => {
    const b = await p.locator(sel).first().boundingBox();
    await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2, { button: "right" });
  };
  const states = [
    ["S1", "select-open", "/components/select", async (p) => p.click("[data-stage] [aria-haspopup=listbox]")],
    ["S2", "combobox-open", "/components/combobox", async (p) => { await p.click("[data-stage] [aria-haspopup=listbox]"); await p.keyboard.type("rot"); }],
    ["S3", "multi-select-open", "/components/multi-select", async (p) => p.click("[data-stage] [aria-haspopup=listbox]")],
    ["S4", "date-picker-open", "/components/date-picker", async (p) => p.click("main button:has-text('7 Nov 2026')")],
    ["S5", "language-picker-open", "/components/language-picker", async (p) => p.click("main [aria-label=Language]")],
    ["S6", "submenu-safe-triangle", "/components/menu", async (p) => {
      await p.click("main button:has-text('Actions')");
      await sleep(300);
      const sub = p.locator("[role=menuitem]:has-text('Move to')");
      const b = await sub.boundingBox();
      await p.mouse.move(b.x + 30, b.y + b.height / 2, { steps: 4 });
      await sleep(400);
      const x = b.x + 60, y = b.y + b.height + 6;
      await p.mouse.move(x, y, { steps: 4 });
      await p.evaluate(({ x, y }) => {
        let i = 0;
        window.setInterval(() => {
          i++;
          document.dispatchEvent(new PointerEvent("pointermove", { clientX: x + i * 0.3, clientY: y + i * 0.05, pointerType: "mouse", bubbles: true }));
        }, 40);
      }, { x, y });
    }],
    ["S8", "sidebar-dark-menu", "/examples/dashboard", async (p) => p.click("nav [aria-label=Account]")],
    ["S9", "side-pane", "/examples/orders", async (p) => p.click("tbody tr >> nth=2")],
    ["S10", "toast-beside-pane", "/examples/orders", async (p) => { await p.click("tbody tr >> nth=2"); await sleep(400); await p.click("button:has-text('Mark as packed')"); }],
    ["S11", "save-bar-and-toast", "/examples/settings", async (p) => {
      await p.fill("input[aria-label='Shop name']", "Rimba Home");
      await sleep(300);
      await p.click("button:has-text('Shopee')");
    }],
    ["S12", "dialog", "/components/dialog", async (p) => p.click("main button:has-text('Cancel order')")],
    ["S13", "toolbar-popover", "/components/toolbar", async (p) => { await p.click("main button:has-text('Filter')"); await sleep(200); await p.click("main button:has-text('Columns')"); }],
    ["S14", "dashboard-skeleton", "/examples/dashboard?loading=1", null],
    ["S15", "orders-skeleton", "/examples/orders?loading=1", null],
    ["S17", "tooltip-stepper", "/components/period-stepper", async (p) => p.hover("main [aria-label^='Previous']")],
    ["S18", "corners-radius-20-round", "/?r=20&c=r", async (p) => p.locator("text=Corners that agree.").scrollIntoViewIfNeeded()],
    ["S19", "corners-square", "/?c=s", async (p) => p.locator("text=Corners that agree.").scrollIntoViewIfNeeded()],
    ["S20", "examples-custom-config", "/examples/dashboard?r=6&c=r&a=0f8a8a&g=w&h=40&sh=80", null],
    ["S23", "header-search", "/components", async (p) => { await p.keyboard.press("Control+k"); await sleep(250); await p.keyboard.type("pick"); }],
    ["S24", "landing-spotlight", "/", async (p) => p.locator("text=The niche ones").scrollIntoViewIfNeeded()],
    ["S25", "landing-ai", "/", async (p) => p.locator("[data-landing=ai]").scrollIntoViewIfNeeded()],
    ["N1", "command-palette-open", "/components/command-palette", async (p) => p.click("[data-stage] button:has-text('Search')")],
    ["N2", "date-range-open", "/components/date-range-picker", async (p) => p.click("[data-stage] button")],
    ["N3", "time-picker-open", "/components/time-picker", async (p) => p.click("[data-stage] button")],
    ["N9", "shop-picker-open", "/components/shop-picker", async (p) => p.click("[data-stage] button")],
    ["N10", "split-button-open", "/components/split-button", async (p) => p.click("[data-stage] [aria-label='More actions']")],
    ["N12", "context-menu-open", "/components/context-menu", async (p) => rightClick(p, "[data-stage] tbody tr >> nth=1")],
    ["N13", "hover-card-open", "/components/hover-card", async (p) => { await p.hover("[data-stage] a"); await sleep(500); }],
    ["N14", "column-menu-open", "/components/column-menu", async (p) => p.click("[data-stage] button")],
    ["N15", "inline-edit-editing", "/components/inline-edit", async (p) => p.click("[data-stage] tbody tr >> nth=1 >> button >> nth=0")],
    ["N22", "comment-reactions-open", "/components/comment-thread", async (p) => p.click("[data-stage] [aria-label='Add reaction'] >> nth=0")],
    ["N26", "notification-bell-open", "/components/notification-bell", async (p) => p.click("[data-stage] button")],
    ["E2b", "orders-columns", "/examples/orders", async (p) => p.click("button:has-text('Columns')")],
    ["E4b", "products-add", "/examples/products", async (p) => p.click("button:has-text('Add product')")],
    ["E5b", "promotions-calendar", "/examples/promotions", async (p) => p.click("[role=radio]:has-text('Calendar')")],
    ["E5c", "promotions-new", "/examples/promotions", async (p) => p.click("button:has-text('New promotion')")],
    ["E6b", "cancellation-pane", "/examples/cancellations", async (p) => p.click("tbody tr >> nth=1")],
    ["E7b", "team-invite", "/examples/team", async (p) => p.click("button:has-text('Invite')")],
  ];
  for (const [letter, name, path, act] of states) {
    const file = `${letter}-${name}-desktop-dark`;
    if (!want(file)) continue;
    const page = await visit("desktop", path);
    try {
      if (act) await act(page);
    } catch (e) {
      checks.errors.push(`${letter} ${name}: ${e.message.split("\n")[0]}`);
    }
    await sleep(500);
    await scan(page, `state/${name}`);
    await shot(page, file, { letter, what: name, view: "desktop", theme: "dark" });
    await page.close();
  }
  // Phone states
  for (const [letter, name, path, act] of [
    ["S21", "phone-orders-pane", "/examples/orders", async (p) => p.click("tbody tr >> nth=1")],
    ["S22", "phone-select-open", "/components/select", async (p) => p.click("[data-stage] [aria-haspopup=listbox]")],
    ["S26", "phone-more-menu", "/examples/dashboard", async (p) => p.click("text=More")],
  ]) {
    const file = `${letter}-${name}-phone-dark`;
    if (!want(file)) continue;
    const page = await visit("phone", path);
    try {
      await act(page);
    } catch (e) {
      checks.errors.push(`${letter}: ${e.message.split("\n")[0]}`);
    }
    await sleep(500);
    await shot(page, file, { letter, what: name, view: "phone", theme: "dark" });
    await page.close();
  }

  // Skeleton vs loaded: every card and soft row must keep its box.
  for (const path of ["/examples/dashboard", "/examples/orders"]) {
    const boxes = async (q) => {
      const page = await visit("desktop", `${path}${q}`);
      const r = await page.evaluate(() =>
        [...document.querySelectorAll("[data-app] .rounded-card, [data-app] li, [data-app] tr")].map((e) => {
          const b = e.getBoundingClientRect();
          return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)].join(",");
        }),
      );
      await page.close();
      return r;
    };
    const a = await boxes("");
    const b = await boxes("?loading=1");
    const diff = a.filter((x, i) => x !== b[i]).length + Math.abs(a.length - b.length);
    checks.skeleton.push({ path, loaded: a.length, loading: b.length, differences: diff });
  }

  await browser.close();
  stop();

  const md = ["# Review shots (v2)", "", `${index.length} screenshots. Desktop 1440×900, phone 390×844 (2x). Dark by default; light for landing and the dashboard.`, "", "| File | Letter | What | View | Theme |", "| --- | --- | --- | --- | --- |"];
  for (const s of index) md.push(`| ${s.file} | ${s.letter} | ${s.what} | ${s.view} | ${s.theme} |`);
  writeFileSync(`${OUT}/shots.md`, md.join("\n") + "\n");
  writeFileSync(`${OUT}/checks.json`, JSON.stringify({ ...checks, fonts: [...checks.fonts] }, null, 2));
  const headers = new Set(checks.header.map((h) => h.box));
  console.log(`shots: ${index.length}`);
  console.log(`borders: ${checks.borders.length} pages with visible borders`);
  checks.borders.slice(0, 6).forEach((b) => console.log(`  ${b.label}: ${b.borders[0]}`));
  console.log(`fonts: ${[...checks.fonts].join(" | ")}`);
  console.log(`shifts: ${checks.shifts.length}`);
  checks.shifts.slice(0, 6).forEach((s) => console.log(`  ${s.label}: ${s.el}`));
  console.log(`header boxes: ${headers.size === 1 ? "identical" : JSON.stringify(checks.header)}`);
  console.log(`skeleton: ${JSON.stringify(checks.skeleton)}`);
  console.log(`errors: ${checks.errors.length}`);
  checks.errors.slice(0, 12).forEach((e) => console.log(`  ${e}`));
  if (existsSync(`${OUT}/before`)) console.log("before/ kept");
}

run().catch((e) => {
  console.error(e);
  stop();
  process.exit(1);
});
