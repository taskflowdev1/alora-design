// v5.4 review shots: control gaps, nothing under a scrollbar, the typography card gone. Classic (always visible)
// scrollbars, as on a Mac with "show scroll bars: always", so every bar is in the picture.
// BEFORE = base URL of the old version (default the live site); DIST = the new build (default dist). OUT = folder
// (default output/review-v5.4). ONLY=<regex> limits by letter.
//   A Orders toolbar tile (flap closed and open)   B carousel card   C Chat band, mid-scroll
//   D landing right edge at 1440 and 1720 (flap closed and open)   E Display band (typography card gone)
//   F Sales card row at a narrow page (flap open)   G /components Display group
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const BEFORE = process.env.BEFORE || "https://design.alorawork.com";
const DIST = process.env.DIST || "dist";
const OUT = process.env.OUT || "output/review-v5.4";
const PORT = Number(process.env.PORT || 5194);
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const want = (l) => !ONLY || ONLY.test(l);
mkdirSync(`${OUT}/parts`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn("npx", ["vite", "preview", "--outDir", DIST, "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
process.on("exit", () => server.kill("SIGTERM"));
const NEW = `http://127.0.0.1:${PORT}`;
for (let i = 0; ; i++) {
  try {
    if ((await fetch(NEW)).ok) break;
  } catch {}
  if (i > 80) throw new Error("preview did not start");
  await sleep(250);
}
const build = async (base) => (await (await fetch(base)).text()).match(/<meta name="build" content="([^"]+)"/)?.[1] ?? "?";
const VERSIONS = [
  { key: "before", base: BEFORE, label: `Before (live ${await build(BEFORE)})` },
  { key: "after", base: NEW, label: "After (new)" },
];

const log = { errors: [], missing: [] };
const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);
async function open(v, path, theme, width = 1440, scale = 2) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.errors.push(`${v.key} ${path}: ${e.message}`));
  await page.goto(`${v.base}${q(path, theme)}`, { waitUntil: "networkidle" });
  await page.mouse.move(width / 2, 450);
  await sleep(500);
  return page;
}
// Open: hover the tab and leave the pointer there (over the open panel), so it stays open.
async function flap(page, on) {
  if (!on) return;
  await page.locator("[data-customize-flap]").hover();
  await sleep(900);
}
// The element, padded, from the full page (positions are in page coordinates).
async function clip(page, selector, file, pad = 16) {
  const l = page.locator(selector).first();
  if (!(await l.count())) return false;
  await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(400);
  const b = await l.boundingBox();
  if (!b) return false;
  const { width: vw, height: vh } = page.viewportSize();
  const x = Math.max(0, b.x - pad);
  const width = Math.min(vw - x, b.width + pad * 2);
  // In the viewport when it fits, so inner and page scrollbars are drawn as a person sees them; a full-page shot
  // grows the viewport and drops them.
  if (b.height + pad * 2 <= vh) {
    const y = Math.max(0, b.y - pad);
    await page.screenshot({ path: file, clip: { x, y, width, height: Math.min(vh - y, b.height + pad * 2) } });
  } else {
    // From the top, so the sticky header sits where it belongs and not across the element.
    await page.evaluate(() => scrollTo(0, 0));
    await sleep(200);
    const top = 0;
    const box = await l.boundingBox();
    b.y = box.y;
    await page.screenshot({ path: file, fullPage: true, clip: { x, y: Math.max(0, b.y + top - pad), width, height: b.height + pad * 2 } });
  }
  return true;
}
const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
async function compose(name, title, theme, cols, width = 1600) {
  const dark = theme === "dark";
  const n = Math.min(cols.length, 2);
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    h1{font-size:15px;font-weight:600;margin:0 0 16px}
    .row{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap}
    figure{margin:0;display:grid;gap:8px;min-width:0}
    figcaption{font-weight:500;line-height:1.5}
    img{max-width:${Math.floor((width - 48 - 24 * (n - 1)) / n)}px;height:auto;display:block;outline:1px solid ${dark ? "#333" : "#ccc"}}
    .none{width:240px;height:80px;display:grid;place-items:center;opacity:.6;background:${dark ? "#1a1a1a" : "#e9e9e9"}}
  </style><h1>${title} · ${theme}</h1><div class=row>${cols
    .map((c) => `<figure><figcaption>${c.label}</figcaption>${c.file && existsSync(c.file) ? `<img src="${dataUri(c.file)}">` : `<div class=none>missing</div>`}</figure>`)
    .join("")}</div>`;
  const ctx = await browser.newContext({ viewport: { width, height: 120 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await ctx.close();
}
const shots = [];
async function pair(letter, name, title, theme, shoot) {
  const cols = [];
  for (const v of VERSIONS) {
    const file = `${OUT}/parts/${name}-${theme}-${v.key}.png`;
    const ok = await shoot(v, file);
    if (!ok) log.missing.push(`${v.key} ${name} ${theme}`);
    cols.push({ label: v.label, file: ok ? file : null });
  }
  await compose(`${name}-${theme}`, `${letter} ${title}`, theme, cols);
  shots.push(`${name}-${theme}.png`);
  console.log(`${name}-${theme}`);
}
const THEMES = ["dark", "light"];

// Tag an element so a selector can find it: the card around the Orders title, the carousel, the Sales card.
const tag = (page) =>
  page.evaluate(() => {
    const card = (el) => el?.closest("[class*='rounded-card'], [class*='rounded-sheet']");
    const orders = [...document.querySelectorAll("section[aria-label='Components in use'] h3")].find((h) => h.textContent === "Orders");
    card(orders)?.setAttribute("data-shot", "orders");
    card(document.querySelector("[aria-roledescription=carousel]"))?.setAttribute("data-shot", "carousel");
    const sales = document.querySelector("section[aria-label='Components in use'] [aria-label=Range]");
    card(sales)?.setAttribute("data-shot", "sales");
  });

if (want("A"))
  for (const theme of THEMES)
    for (const on of [false, true])
      await pair("A", `A-toolbar-${on ? "flap-open" : "flap-closed"}`, `Orders toolbar tile, 1440, flap ${on ? "open" : "closed"}`, theme, async (v, file) => {
        const page = await open(v, "/", theme);
        await flap(page, on);
        await tag(page);
        const ok = await clip(page, "[data-shot=orders]", file);
        await page.context().close();
        return ok;
      });

if (want("B"))
  for (const theme of THEMES)
    await pair("B", "B-carousel", "Carousel card (Gelas kopi tanah liat), 1440", theme, async (v, file) => {
      const page = await open(v, "/", theme);
      await tag(page);
      const ok = await clip(page, "[data-shot=carousel]", file);
      await page.context().close();
      return ok;
    });

if (want("C"))
  for (const theme of THEMES)
    await pair("C", "C-chat", "Chat card, message list scrolled to the middle (the bar in its own lane), 1440", theme, async (v, file) => {
      const page = await open(v, "/", theme);
      await page.evaluate(() => {
        const box = document.querySelector("[data-band=Chat] [data-spot=message-scroller] .overflow-y-auto");
        if (box) box.scrollTop = (box.scrollHeight - box.clientHeight) / 2;
      });
      await sleep(300);
      await page.evaluate(() => document.querySelector("[data-band=Chat] [data-spot=message-scroller]")?.closest("[class*='rounded-card']")?.setAttribute("data-shot", "chat"));
      const ok = await clip(page, "[data-shot=chat]", file);
      await page.context().close();
      return ok;
    });

// The viewport's right part, scrollbar included, at a few points down the landing.
if (want("D"))
  for (const theme of THEMES)
    for (const w of [1440, 1720])
      for (const on of [false, true])
        for (const band of ["Display", "Chat"])
          await pair("D", `D-edge-${w}-${on ? "open" : "closed"}-${band}`, `Landing right edge at ${w}, flap ${on ? "open" : "closed"}, ${band} band in view`, theme, async (v, file) => {
            const page = await open(v, "/", theme, w, 1);
            await flap(page, on);
            const l = page.locator(`[data-band=${band}]`);
            if (!(await l.count())) return false;
            await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
            await sleep(500);
            await page.screenshot({ path: file, clip: { x: w - 640, y: 0, width: 640, height: 900 } });
            await page.context().close();
            return true;
          });

if (want("E"))
  for (const theme of THEMES)
    await pair("E", "E-display", "More display band (typography card removed; carousel and suppliers share the row), 1440", theme, async (v, file) => {
      const page = await open(v, "/", theme, 1440, 1);
      const ok = await clip(page, "[data-band=Display]", file);
      await page.context().close();
      return ok;
    });

if (want("F"))
  for (const theme of THEMES)
    await pair("F", "F-sales", "Sales card, 1440 with the flap open (page 1086 px wide): the row wraps instead of running out", theme, async (v, file) => {
      const page = await open(v, "/", theme);
      await flap(page, true);
      await tag(page);
      const ok = await clip(page, "[data-shot=sales]", file, 24);
      await page.context().close();
      return ok;
    });

if (want("G"))
  for (const theme of THEMES)
    await pair("G", "G-components-display", "/components Display group, 1440", theme, async (v, file) => {
      const page = await open(v, "/components", theme, 1440, 1);
      const ok = await clip(page, "[data-group=Display]", file);
      await page.context().close();
      return ok;
    });

writeFileSync(`${OUT}/log.json`, JSON.stringify({ versions: VERSIONS.map(({ key, label }) => ({ key, label })), shots, ...log }, null, 2));
await browser.close();
server.kill("SIGTERM");
console.log(`${shots.length} shots, ${log.missing.length} missing, ${log.errors.length} page errors`);
