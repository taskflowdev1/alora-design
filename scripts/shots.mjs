// Headless screenshots + automatic taste checks. Run through the job queue:
//   job submit --kind script --name alora-design-shots ... --cmd './scripts/shots'
// Serves the built site on its own port, writes output/review/*.png, index.md and checks.json.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = Number(process.env.SHOTS_PORT || 5197);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = "output/review";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

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
const checks = { borders: [], fonts: new Set(), shifts: [], skeleton: [], errors: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ITEMS = [
  "corner-shape", "scrollbar", "button", "menu", "toolbar", "save-bar", "input", "search", "field", "select", "multi-select", "combobox",
  "date-picker", "period-stepper", "language-picker", "segmented", "tabs", "switch", "checkbox", "radio", "slider", "card", "metric-card",
  "table", "attention-list", "bar-chart", "status", "badge", "avatar", "thumb", "alert", "progress", "empty-state", "skeleton", "dialog",
  "sheet", "popover", "tooltip", "toast", "sidebar", "bottom-nav",
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
      fonts.add(cs.fontFamily.split(",")[0].trim());
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        const w = parseFloat(cs[`border${side}Width`]);
        const c = cs[`border${side}Color`];
        if (w > 0 && cs[`border${side}Style`] !== "none" && !/rgba\(.*, 0\)$/.test(c) && c !== "transparent") {
          // background-clip scrollbar thumbs and transparent borders are fine
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
  for (const h of handles.slice(0, 14)) {
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

async function shot(page, file, what) {
  if (ONLY && !ONLY.test(file)) return;
  await sleep(250);
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: what.full ?? false });
  index.push({ file: `${file}.png`, ...what });
}

async function run() {
  await waitUp();
  const browser = await chromium.launch();
  const ctxs = {};
  for (const [k, v] of Object.entries(VIEWS)) ctxs[k] = await browser.newContext({ ...v, reducedMotion: "no-preference" });

  async function visit(view, path, theme) {
    const page = await ctxs[view].newPage();
    page.on("pageerror", (e) => checks.errors.push(`${path}: ${e.message}`));
    const sep = path.includes("?") ? "&" : "?";
    await page.goto(`${BASE}${path}${theme === "dark" ? `${sep}t=d` : ""}`, { waitUntil: "networkidle" });
    await sleep(300);
    return page;
  }

  // Pages in all four variants
  const pages = [
    ["L1", "landing", "/", true],
    ["G0", "gallery-index", "/gallery", true],
    ["E1", "dashboard", "/examples/dashboard", false],
    ["E2", "orders", "/examples/orders", false],
    ["E3", "settings", "/examples/settings", true],
    ["X1", "export", "/export", true],
  ];
  for (const [letter, name, path, full] of pages) {
    for (const view of ["desktop", "phone"]) {
      for (const theme of ["light", "dark"]) {
        const page = await visit(view, path, theme);
        if (view === "desktop" && theme === "light") {
          await scan(page, name);
          if (name === "landing" || name === "settings") await shiftCheck(page, name);
        }
        await shot(page, `${letter}-${name}-${view}-${theme}`, { letter, what: name, view, theme, full });
        await page.close();
      }
    }
  }

  // One shot per component page
  for (const [i, name] of ITEMS.entries()) {
    const letter = `G${i + 1}`;
    for (const [view, theme] of [["desktop", "light"], ["desktop", "dark"], ["phone", "light"]]) {
      const page = await visit(view, `/gallery/${name}`, theme);
      if (view === "desktop" && theme === "light") {
        await scan(page, `gallery/${name}`);
        if (["button", "select", "segmented", "table", "switch", "status"].includes(name)) await shiftCheck(page, `gallery/${name}`);
      }
      await shot(page, `${letter}-${name}-${view}-${theme}`, { letter, what: name, view, theme });
      await page.close();
    }
  }

  // States
  const states = [
    ["S1", "select-open", "/gallery/select", async (p) => p.click("[data-stage] [aria-haspopup=listbox]")],
    ["S2", "combobox-open", "/gallery/combobox", async (p) => { await p.click("[data-stage] [aria-haspopup=listbox]"); await p.keyboard.type("rot"); }],
    ["S3", "multi-select-open", "/gallery/multi-select", async (p) => p.click("[data-stage] [aria-haspopup=listbox]")],
    ["S4", "date-picker-open", "/gallery/date-picker", async (p) => p.click("main button:has-text('7 Nov 2026')")],
    ["S5", "language-picker-open", "/gallery/language-picker", async (p) => p.click("main [aria-label=Language]")],
    ["S6", "submenu-safe-triangle", "/gallery/menu", async (p) => {
      await p.click("main button:has-text('Actions')");
      await sleep(300);
      const sub = p.locator("[role=menuitem]:has-text('Move to')");
      const b = await sub.boundingBox();
      await p.mouse.move(b.x + 20, b.y + b.height / 2, { steps: 4 });
      await sleep(400);
      const panel = await p.locator("[role=menu] >> nth=1").boundingBox();
      // move diagonally toward the lower part of the submenu, crossing "Share"
      await p.mouse.move(b.x + b.width + 2, b.y + b.height - 2, { steps: 3 });
      await p.mouse.move(b.x + b.width + (panel.x - b.x - b.width) * 0.4, b.y + b.height + 10, { steps: 3 });
      // Keep creeping toward the panel so the debounced triangle stays alive for the screenshot.
      await p.evaluate(({ x, y }) => {
        let i = 0;
        window.setInterval(() => {
          i++;
          document.dispatchEvent(new PointerEvent("pointermove", { clientX: x + i * 0.25, clientY: y + i * 0.1, pointerType: "mouse", bubbles: true }));
        }, 40);
      }, { x: b.x + b.width + (panel.x - b.x - b.width) * 0.4, y: b.y + b.height + 10 });
    }],
    ["S7", "submenu-keyboard", "/gallery/menu", async (p) => {
      await p.focus("main button:has-text('Actions')");
      await p.keyboard.press("Enter");
      await sleep(250);
      await p.keyboard.press("ArrowDown");
      await p.keyboard.press("ArrowDown");
      await p.keyboard.press("ArrowRight");
    }],
    ["S8", "sidebar-dark-menu", "/examples/dashboard", async (p) => p.click("nav [aria-label=Account]")],
    ["S9", "side-pane", "/examples/orders", async (p) => p.click("tbody tr >> nth=2")],
    ["S10", "toast-beside-pane", "/examples/orders", async (p) => { await p.click("tbody tr >> nth=2"); await sleep(400); await p.click("button:has-text('Mark as packed')"); }],
    ["S11", "save-bar-and-toast", "/examples/settings", async (p) => {
      await p.fill("input[aria-label='Shop name']", "Rimba Home");
      await sleep(300);
      await p.click("button:has-text('Shopee')");
    }],
    ["S12", "dialog", "/gallery/dialog", async (p) => p.click("main button:has-text('Cancel order')")],
    ["S13", "toolbar-popover", "/gallery/toolbar", async (p) => { await p.click("main button:has-text('Filter')"); await sleep(200); await p.click("main button:has-text('Columns')"); }],
    ["S14", "dashboard-skeleton", "/examples/dashboard?loading=1", null],
    ["S15", "orders-skeleton", "/examples/orders?loading=1", null],
    ["S16", "leave-unsaved", "/examples/settings", async (p) => {
      await p.fill("input[aria-label='Shop name']", "Rimba Home");
      await sleep(200);
      await p.click("nav a:has-text('Dashboard')");
    }],
    ["S17", "tooltip-stepper", "/gallery/period-stepper", async (p) => p.hover("main [aria-label^='Previous']")],
    ["S18", "landing-radius-20-round", "/?r=20&c=r", null],
    ["S19", "landing-square", "/?c=s", null],
    ["S20", "examples-custom-config", "/examples/dashboard?r=6&c=r&a=0f8a8a&g=w&h=40&sh=80", null],
  ];
  for (const [letter, name, path, act] of states) {
    for (const theme of ["light", "dark"]) {
      if (theme === "dark" && ["S16", "S17", "S18", "S19"].includes(letter)) continue;
      const page = await visit("desktop", path, theme);
      try {
        if (act) await act(page);
      } catch (e) {
        checks.errors.push(`${letter} ${name}: ${e.message.split("\n")[0]}`);
      }
      await sleep(500);
      if (theme === "light") await scan(page, `state/${name}`);
      await shot(page, `${letter}-${name}-desktop-${theme}`, { letter, what: name, view: "desktop", theme });
      await page.close();
    }
  }
  // Phone states
  for (const [letter, name, path, act] of [
    ["S21", "phone-orders-pane", "/examples/orders", async (p) => p.click("tbody tr >> nth=1")],
    ["S22", "phone-select-open", "/gallery/select", async (p) => p.click("[data-stage] [aria-haspopup=listbox]")],
  ]) {
    const page = await visit("phone", path, "light");
    try {
      await act(page);
    } catch (e) {
      checks.errors.push(`${letter}: ${e.message.split("\n")[0]}`);
    }
    await sleep(500);
    await shot(page, `${letter}-${name}-phone-light`, { letter, what: name, view: "phone", theme: "light" });
    await page.close();
  }

  // Skeleton vs loaded: every card and soft row must keep its box.
  for (const path of ["/examples/dashboard", "/examples/orders"]) {
    const boxes = async (q) => {
      const page = await visit("desktop", `${path}${q}`, "light");
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

  const md = ["# Review shots", "", `${index.length} screenshots. Desktop 1440×900, phone 390×844 (2x). Light and dark.`, "", "| File | Letter | What | View | Theme |", "| --- | --- | --- | --- | --- |"];
  for (const s of index) md.push(`| ${s.file} | ${s.letter} | ${s.what} | ${s.view} | ${s.theme} |`);
  writeFileSync(`${OUT}/index.md`, md.join("\n") + "\n");
  writeFileSync(`${OUT}/checks.json`, JSON.stringify({ ...checks, fonts: [...checks.fonts] }, null, 2));
  console.log(`shots: ${index.length}`);
  console.log(`borders: ${checks.borders.length} pages with visible borders`);
  console.log(`fonts: ${[...checks.fonts].join(" | ")}`);
  console.log(`shifts: ${checks.shifts.length}`);
  console.log(`skeleton: ${JSON.stringify(checks.skeleton)}`);
  console.log(`errors: ${checks.errors.length}`);
  checks.errors.slice(0, 10).forEach((e) => console.log(`  ${e}`));
}

run().catch((e) => {
  console.error(e);
  stop();
  process.exit(1);
});
