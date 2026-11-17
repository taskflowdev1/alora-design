// v3.2 review: hero, Sales card and the customize flap, before (BEFORE_BASE, the live site) and after (local build),
// dark and light, plus checks (push geometry, hover/drag/Esc behaviour, Sales card size per range, phone overflow)
// and a short video of the flap. Run through the job queue: ./scripts/flap-shots. OUT defaults to output/review-v3.2.
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = Number(process.env.SHOTS_PORT || 5199);
const AFTER = `http://127.0.0.1:${PORT}`;
const BEFORE = process.env.BEFORE_BASE || "";
const OUT = process.env.OUT || "output/review-v3.2";
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (/\.(png|webm)$/.test(f) || f === "checks.json") rmSync(`${OUT}/${f}`);

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
process.on("exit", () => server.kill("SIGTERM"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; ; i++) {
  try {
    if ((await fetch(AFTER)).ok) break;
  } catch {}
  if (i > 80) throw new Error("preview server did not start");
  await sleep(250);
}

const checks = { errors: [], push: [], behaviour: [], sales: [], phone: [], header: [] };
const files = [];
const browser = await chromium.launch();
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

async function open(ctx, base, path) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => checks.errors.push(`${base} ${path}: ${e.message}`));
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await sleep(500);
  return page;
}
async function save(page, file, opts = {}) {
  await page.screenshot({ path: `${OUT}/${file}.png`, ...opts });
  files.push(`${file}.png`);
}
const salesBox = (page) =>
  page.evaluate(() => {
    const el = document.querySelector("[data-bento='1'] [data-stack] > *");
    const r = el.getBoundingClientRect();
    return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
  });
const clip = (b, m = 16) => ({ x: Math.max(0, b.x - m), y: Math.max(0, b.y - m), width: b.width + m * 2, height: b.height + m * 2 });

const sides = [["after", AFTER], ...(BEFORE ? [["before", BEFORE]] : [])];

for (const [side, base] of sides)
  for (const theme of ["dark", "light"]) {
    const q = theme === "light" ? "?t=l" : "";
    const tag = `${side}-${theme}`;
    // Hero, first screen.
    let page = await open(desk, base, `/${q}`);
    await save(page, `H1-hero-1440-${tag}`);
    // Sales card: day, then month (after its skeleton beat), with the box size each time.
    const sizes = {};
    let b = await salesBox(page);
    sizes.day = [b.width, b.height];
    await save(page, `S1-sales-day-${tag}`, { fullPage: true, clip: clip(b) });
    for (const r of ["Week", "Month"]) {
      await page.locator("[data-bento='1'] [data-stack] [role=radio], [data-bento='1'] [data-stack] button").filter({ hasText: new RegExp(`^${r}$`) }).first().click();
      await sleep(120);
      const mid = await salesBox(page);
      sizes[`${r.toLowerCase()}-loading`] = [mid.width, mid.height];
      if (r === "Month") await save(page, `S2-sales-month-loading-${tag}`, { fullPage: true, clip: clip(b) });
      await sleep(700);
      b = await salesBox(page);
      sizes[r.toLowerCase()] = [b.width, b.height];
    }
    await save(page, `S2-sales-month-${tag}`, { fullPage: true, clip: clip(b) });
    checks.sales.push({ side, theme, sizes, same: new Set(Object.values(sizes).map((s) => s.join("x"))).size === 1 });
    await page.close();

    // Flap closed + open on landing, gallery, examples.
    for (const [key, path] of [["landing", "/"], ["gallery", "/gallery"], ["examples", "/examples/dashboard"]]) {
      page = await open(desk, base, `${path}${q}`);
      checks.header.push({ side, theme, key, box: await page.evaluate(() => JSON.stringify(document.querySelector("header > div")?.getBoundingClientRect())) });
      await save(page, `F1-closed-${key}-${tag}`);
      const flap = page.locator("[data-customize-flap]");
      if (await flap.count()) {
        await page.mouse.move(400, 450);
        await flap.hover();
        await sleep(900);
        if (side === "after" && theme === "dark") {
          const g = await page.evaluate(() => {
            const p = document.querySelector("[data-customize-panel]").getBoundingClientRect();
            const h = document.querySelector("header > div").getBoundingClientRect();
            return { panelRight: Math.round(p.right), contentLeft: Math.round(h.left), contentRight: Math.round(h.right), vw: innerWidth, scrollW: document.scrollingElement.scrollWidth };
          });
          checks.push.push({ key, ...g, flushRight: g.contentRight === g.vw && g.contentLeft === g.panelRight && g.scrollW === g.vw });
        }
      } else {
        await page.getByRole("button", { name: "Customize" }).first().click();
        await sleep(500);
      }
      await save(page, `F2-open-${key}-${tag}`);
      await page.close();
    }

    // Phone first screen (and the header popover kept for phones).
    page = await open(phone, base, `/${q}`);
    const o = await page.evaluate(() => ({ scrollWidth: document.scrollingElement.scrollWidth, width: document.documentElement.clientWidth, flap: !!document.querySelector("[data-customize-flap]") }));
    checks.phone.push({ side, theme, ...o });
    await save(page, `H2-hero-390-${tag}`);
    await page.close();
  }

// Behaviour (after, dark): hover opens, slider drag outside keeps it, leave closes, click pins, Esc closes.
{
  const page = await open(desk, AFTER, "/");
  const state = () => page.evaluate(() => document.querySelector("[data-customize-panel]")?.getAttribute("data-state"));
  const flap = page.locator("[data-customize-flap]");
  const log = (name, ok, extra) => checks.behaviour.push({ name, ok, ...(extra ? { extra } : {}) });
  await page.mouse.move(700, 450);
  await flap.hover();
  await sleep(500);
  log("hover opens", (await state()) === "open");
  const thumb = page.locator("[data-customize-panel] [role=slider]").first();
  const tb = await thumb.boundingBox();
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
  await page.mouse.down();
  await page.mouse.move(tb.x + 140, tb.y + 4, { steps: 6 });
  await page.mouse.move(tb.x + 600, tb.y + 30, { steps: 6 });
  await sleep(600);
  log("stays open while a slider is dragged outside", (await state()) === "open");
  await page.mouse.up();
  await sleep(700);
  log("closes after release outside", (await state()) === "closed");
  await page.mouse.move(700, 450);
  await flap.hover();
  await sleep(450);
  await page.mouse.move(200, 300, { steps: 4 });
  await sleep(500);
  log("stays open while over the panel", (await state()) === "open");
  await page.mouse.move(900, 300, { steps: 4 });
  await sleep(150);
  const grace = await state();
  await sleep(500);
  log("closes on leave after a grace delay", grace === "open" && (await state()) === "closed", { atGrace: grace });
  // Keyboard: focus the flap, it opens; Esc closes.
  await page.mouse.move(900, 600);
  await page.evaluate(() => document.querySelector("header a").focus());
  await page.keyboard.press("Shift+Tab");
  await sleep(450);
  log("Shift+Tab from the header lands on the flap", await page.evaluate(() => document.activeElement?.hasAttribute("data-customize-flap")));
  log("keyboard focus opens", (await state()) === "open");
  await page.keyboard.press("Escape");
  await sleep(450);
  log("Esc closes", (await state()) === "closed");
  // Touch-like: click pins until X.
  await flap.dispatchEvent("click");
  await sleep(450);
  await page.mouse.move(1000, 500, { steps: 3 });
  await sleep(500);
  log("click pins (leave does not close)", (await state()) === "open");
  await page.locator("[data-customize-panel] button[aria-label=Close]").click();
  await sleep(450);
  log("X closes", (await state()) === "closed");
  // Mid-slide frame, to see the motion.
  await page.mouse.move(700, 450);
  await flap.hover();
  await sleep(80 + 140);
  await save(page, "F3-mid-slide-landing-after-dark");
  await page.close();
}

// Video: hover in, change radius and accent, leave.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } });
  const page = await ctx.newPage();
  await page.goto(`${AFTER}/`, { waitUntil: "networkidle" });
  await sleep(700);
  await page.mouse.move(700, 450);
  await sleep(300);
  await page.mouse.move(10, 450, { steps: 12 });
  await sleep(900);
  const thumb = page.locator("[data-customize-panel] [role=slider]").first();
  const tb = await thumb.boundingBox();
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2, { steps: 8 });
  await page.mouse.down();
  await page.mouse.move(tb.x + 90, tb.y + tb.height / 2, { steps: 20 });
  await page.mouse.up();
  await sleep(500);
  const sw = page.locator("[data-customize-panel] button[aria-label='#3c6fe0']");
  const sb = await sw.boundingBox();
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2, { steps: 10 });
  await page.mouse.down();
  await page.mouse.up();
  await sleep(800);
  await page.mouse.move(1000, 450, { steps: 14 });
  await sleep(1400);
  const v = page.video();
  await ctx.close();
  renameSync(await v.path(), `${OUT}/V1-flap-after-dark.webm`);
  files.push("V1-flap-after-dark.webm");
}

await browser.close();
writeFileSync(`${OUT}/checks.json`, JSON.stringify(checks, null, 2));
console.log(`files: ${files.length}`);
console.log(`errors: ${JSON.stringify(checks.errors)}`);
console.log(`push: ${JSON.stringify(checks.push)}`);
console.log(`behaviour: ${JSON.stringify(checks.behaviour)}`);
console.log(`sales: ${JSON.stringify(checks.sales)}`);
console.log(`phone: ${JSON.stringify(checks.phone)}`);
server.kill("SIGTERM");
process.exit(0);
