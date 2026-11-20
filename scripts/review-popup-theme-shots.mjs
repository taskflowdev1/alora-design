// Pop-up trigger press + theme reveal, before (BEFORE_DIST) and after (AFTER_DIST), into OUT.
// D1: the open Columns menu on Orders, then the same menu while its trigger is pressed again; the shift is measured.
// T1: the theme switch demo's reveal, frames at fixed times (the animation is paused and scrubbed, so frames are exact).
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const OUT = process.env.OUT || "output/popup-theme";
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
const V = [
  { key: "before", base: await serve(process.env.BEFORE_DIST, 5196) },
  { key: "after", base: await serve(process.env.AFTER_DIST, 5197) },
];
const browser = await chromium.launch();
const log = { errors: [], d1: {}, t1: {} };
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);

for (const v of V) {
  for (const theme of ["dark", "light"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => log.errors.push(`${v.key}: ${e.message}`));
    await page.goto(`${v.base}${q("/examples/orders", theme)}`, { waitUntil: "networkidle" });
    await sleep(600);
    const btn = page.locator('#content button[aria-haspopup]:has-text("Columns")').first();
    await btn.click();
    await sleep(450);
    const wrap = () => page.evaluate(() => document.querySelector("[data-radix-popper-content-wrapper]")?.getBoundingClientRect().toJSON() ?? null);
    const b = await btn.boundingBox();
    const m0 = await wrap();
    const clip = { x: Math.min(b.x, m0.x) - 16, y: b.y - 16, width: Math.max(b.x + b.width, m0.x + m0.width) - Math.min(b.x, m0.x) + 32, height: m0.y + m0.height - b.y + 32 };
    await page.screenshot({ path: `${OUT}/parts/D1-${v.key}-${theme}-open.png`, clip });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await sleep(160);
    const m1 = await wrap();
    const scale = await btn.evaluate((el) => getComputedStyle(el).scale);
    await page.screenshot({ path: `${OUT}/parts/D1-${v.key}-${theme}-pressed.png`, clip });
    await page.mouse.up();
    log.d1[`${v.key}-${theme}`] = { scale, dx: m1 ? +(m1.x - m0.x).toFixed(2) : null, dy: m1 ? +(m1.y - m0.y).toFixed(2) : null };
    await ctx.close();
  }

  // Theme reveal on the theme switch page, from dark to light (click Light).
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${v.base}/components/theme-switch`, { waitUntil: "networkidle" });
  await sleep(700);
  const seg = page.locator('#content [aria-label="Theme"]').first();
  await seg.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(300);
  const area = await seg.evaluate((el) => el.parentElement.parentElement.getBoundingClientRect().toJSON());
  const clip = { x: area.x - 24, y: area.y - 24, width: area.width + 48, height: area.height + 48 };
  const light = seg.locator('button:has-text("Light"), [role=radio]:has-text("Light")').first();
  // Pause the reveal as soon as it starts, then scrub it.
  await page.evaluate(() => {
    const orig = Element.prototype.animate;
    window.__reveal = null;
    Element.prototype.animate = function (k, o) {
      const a = orig.call(this, k, o);
      if (o && o.pseudoElement === "::view-transition-new(root)") {
        a.pause();
        window.__reveal = a;
      }
      return a;
    };
  });
  await light.click();
  for (let i = 0; i < 40 && !(await page.evaluate(() => !!window.__reveal)); i++) await sleep(50);
  const dur = await page.evaluate(() => window.__reveal?.effect.getTiming().duration ?? null);
  log.t1[v.key] = { duration: dur };
  for (const t of [0, 40, 80, 140, 220, 320, 440, 520]) {
    if (dur != null && t > dur) continue;
    await page.evaluate((t) => (window.__reveal.currentTime = t), t);
    await sleep(80);
    await page.screenshot({ path: `${OUT}/parts/T1-${v.key}-${String(t).padStart(3, "0")}.png`, clip });
  }
  await page.evaluate(() => window.__reveal?.finish());
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/log.json`, JSON.stringify(log, null, 2));
console.log(JSON.stringify(log));
process.exit(0);
