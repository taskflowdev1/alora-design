// Landing bento review: full page + first two viewports (desktop, dark and light), phone full page,
// one crop per bento card (B1…), skeleton crops, the E1 dashboard (dark) and the gallery index, plus checks:
// phone horizontal overflow, borders, hover shifts, page errors, gallery thumbnail fill.
// Run through the job queue: ./scripts/landing-shots. OUT defaults to output/review-v3.
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = Number(process.env.SHOTS_PORT || 5198);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = process.env.OUT || "output/review-v3";
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith(".png") || f === "checks.json") rmSync(`${OUT}/${f}`);

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
process.on("exit", () => server.kill("SIGTERM"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; ; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {}
  if (i > 80) throw new Error("preview server did not start");
  await sleep(250);
}

const CARDS = ["Orders", "Sales", "Command palette", "Sidebar", "Packing board", "Fees", "Calendar", "Notes", "Shipment", "Shop settings", "New promotion", "Team", "Returns", "Products", "Low stock", "Phone view", "Stock sync", "Photos and tags", "By shop"];
const checks = { errors: [], phoneOverflow: [], borders: [], shifts: [], thumbs: [], cards: [] };
const files = [];

const browser = await chromium.launch();
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

async function open(ctx, path) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => checks.errors.push(`${path}: ${e.message}`));
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await sleep(500);
  return page;
}
async function save(page, file, opts = {}) {
  await page.screenshot({ path: `${OUT}/${file}.png`, ...opts });
  files.push(`${file}.png`);
}
const cardBoxes = (page) =>
  page.evaluate(() => {
    const out = [];
    for (const band of document.querySelectorAll("[data-bento]"))
      for (const el of band.children) for (const c of el.hasAttribute("data-stack") ? el.children : [el]) {
        const r = c.getBoundingClientRect();
        out.push({ x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height });
      }
    return out;
  });

for (const theme of ["dark", "light"]) {
  const q = theme === "light" ? "?t=l" : "";
  const page = await open(desk, `/${q}`);
  await save(page, `L1-landing-desktop-${theme}-vp1`);
  await page.evaluate(() => scrollTo(0, innerHeight));
  await sleep(400);
  await save(page, `L1-landing-desktop-${theme}-vp2`);
  await page.evaluate(() => scrollTo(0, 0));
  await page.addStyleTag({ content: "header{position:static!important}" });
  await sleep(200);
  await save(page, `L1-landing-desktop-${theme}-full`, { fullPage: true });
  if (theme === "dark") {
    const boxes = await cardBoxes(page);
    checks.cards = boxes.map((b, i) => ({ letter: `B${i + 1}`, name: CARDS[i], w: Math.round(b.width), h: Math.round(b.height) }));
    for (const [i, b] of boxes.entries()) {
      const m = 16;
      await save(page, `B${i + 1}-${CARDS[i].toLowerCase().replace(/\s+/g, "-")}-dark`, {
        fullPage: true,
        clip: { x: Math.max(0, b.x - m), y: Math.max(0, b.y - m), width: b.width + m * 2, height: b.height + m * 2 },
      });
    }
    // Borders / outlines (taste: no lines).
    checks.borders = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("main *")) {
        const cs = getComputedStyle(el);
        if (el.closest("svg") || cs.visibility === "hidden") continue;
        for (const s of ["Top", "Right", "Bottom", "Left"]) {
          const w = parseFloat(cs[`border${s}Width`]);
          const c = cs[`border${s}Color`];
          if (w > 0 && cs[`border${s}Style`] !== "none" && !/rgba\(.*, 0\)$/.test(c) && c !== "transparent") {
            out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} ${s} ${w}px ${c}`);
            break;
          }
        }
        if (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) out.push(`${el.tagName.toLowerCase()} outline`);
      }
      return [...new Set(out)].slice(0, 20);
    });
    // Hover must not move anything (cards and controls).
    const handles = await page.$$("main [data-bento] button:not([disabled]), main [data-bento] [role=tab], main [data-bento] label, main [data-bento] tr");
    for (const h of handles.filter((_, i) => i % 3 === 0).slice(0, 60)) {
      try {
        await h.scrollIntoViewIfNeeded({ timeout: 500 });
        // Box in page space, undoing every scroll (page and inner lists), so only real hover movement counts.
        const box = () =>
          h.evaluate((e) => {
            const r = e.getBoundingClientRect();
            let x = r.x + scrollX, y = r.y + scrollY;
            for (let p = e.parentElement; p && p !== document.documentElement; p = p.parentElement) {
              x += p.scrollLeft;
              y += p.scrollTop;
            }
            return { x, y, width: r.width, height: r.height };
          });
        const before = await box();
        if (!before || before.width < 4) continue;
        await h.hover({ timeout: 500 });
        await sleep(240);
        const after = await box();
        if (after && (Math.abs(after.width - before.width) > 0.5 || Math.abs(after.height - before.height) > 0.5 || Math.abs(after.x - before.x) > 0.5 || Math.abs(after.y - before.y) > 0.5))
          checks.shifts.push({ el: await h.evaluate((e) => e.outerHTML.slice(0, 90)), before, after });
      } catch {}
    }
  }
  await page.close();
}

// Skeletons held with ?loading=1: orders and sales.
{
  const page = await open(desk, "/?loading=1");
  await page.addStyleTag({ content: "header{position:static!important}" });
  const boxes = await cardBoxes(page);
  for (const [i, n] of [[0, "orders"], [1, "sales"], [18, "by-shop"]]) {
    const b = boxes[i];
    await save(page, `B${i + 1}s-${n}-loading-dark`, { fullPage: true, clip: { x: b.x - 16, y: b.y - 16, width: b.width + 32, height: b.height + 32 } });
  }
  await page.close();
}

// Open states: a row's side pane, the context menu, the split button menu.
{
  const page = await open(desk, "/");
  const row = page.locator("[data-bento='1'] tbody tr").first();
  await row.click({ button: "right" });
  await sleep(350);
  await save(page, "B1b-orders-context-menu-dark");
  await page.close();
}
{
  const page = await open(desk, "/");
  await page.locator("[data-bento='1'] tbody tr").first().click();
  await sleep(500);
  await save(page, "B1c-orders-side-pane-dark");
  await page.close();
}

// Phone: full page, both themes; no horizontal page scroll.
for (const theme of ["dark", "light"]) {
  const page = await open(phone, theme === "light" ? "/?t=l" : "/");
  const o = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const wide = [...document.querySelectorAll("main *")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.right > w + 1 && !e.closest("[class*=overflow]");
      })
      .slice(0, 5)
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 50)}`);
    return { scrollWidth: document.scrollingElement.scrollWidth, width: w, wide };
  });
  checks.phoneOverflow.push({ theme, ...o });
  await page.addStyleTag({ content: "header{position:static!important}" });
  await sleep(200);
  await save(page, `L2-landing-phone-${theme}-full`, { fullPage: true });
  await page.close();
}

// E1 dashboard dark (sidebar on the page), and light for comparison.
for (const theme of ["dark", "light"]) {
  const page = await open(desk, `/examples/dashboard${theme === "light" ? "?t=l" : ""}`);
  await save(page, `E1-dashboard-desktop-${theme}`);
  await page.close();
}

// Gallery index: every thumbnail fills its tile.
for (const [ctx, view] of [[desk, "desktop"], [phone, "phone"]]) {
  const page = await open(ctx, "/gallery");
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    scrollTo(0, 0);
  });
  await sleep(600);
  if (view === "desktop")
    checks.thumbs = await page.evaluate(() =>
      [...document.querySelectorAll("[data-fit]")].map((box) => {
        const b = box.getBoundingClientRect();
        let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        for (const el of box.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height || el.children.length) continue;
          x1 = Math.min(x1, r.left); y1 = Math.min(y1, r.top); x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom);
        }
        const fill = x2 > x1 ? Math.round((((Math.min(x2, b.right) - Math.max(x1, b.left)) * (Math.min(y2, b.bottom) - Math.max(y1, b.top))) / (b.width * b.height)) * 100) : 0;
        return { name: box.parentElement?.textContent?.trim().slice(-30), scale: Number(box.getAttribute("data-fit")), fill };
      }),
    );
  await page.addStyleTag({ content: "header{position:static!important}" });
  await save(page, `G0-gallery-index-${view}-dark`, { fullPage: true });
  await page.close();
}

await browser.close();
writeFileSync(`${OUT}/checks.json`, JSON.stringify(checks, null, 2));
console.log(`shots: ${files.length}`);
console.log(`errors: ${checks.errors.length}, borders: ${checks.borders.length}, shifts: ${checks.shifts.length}`);
console.log(`phone overflow: ${JSON.stringify(checks.phoneOverflow)}`);
const low = checks.thumbs.filter((t) => t.fill < 12 || t.scale < 0.5);
console.log(`thumbs: ${checks.thumbs.length}, low fill/scale: ${JSON.stringify(low)}`);
server.kill("SIGTERM");
process.exit(0);
