// v3.3 review: the Alora logo header (before = BEFORE_BASE, the live site; after = local build) at 1440 and 390, dark
// and light; header + hero at 360/390/768/1024/1440; frames and a webm showing the customize panel and the page
// scrolling separately; the phone customize popover scrolling on its own. checks.json holds the measurements.
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = Number(process.env.SHOTS_PORT || 5194);
const AFTER = `http://127.0.0.1:${PORT}`;
const BEFORE = process.env.BEFORE_BASE || "";
const OUT = process.env.OUT || "output/review-v3.3";
mkdirSync(`${OUT}/before`, { recursive: true });
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

const checks = { errors: [], align: [], overflow: [], flap: {}, popover: {} };
const browser = await chromium.launch();
async function open(ctx, base, path) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => checks.errors.push(`${base} ${path}: ${e.message}`));
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await sleep(400);
  return page;
}
const shot = (page, file, opts = {}) => page.screenshot({ path: `${OUT}/${file}.png`, ...opts });

// 1. Header before/after, 1440 and 390, dark and light.
for (const [w, h, dsf, mobile] of [[1440, 900, 2, false], [390, 844, 2, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, isMobile: mobile, hasTouch: mobile });
  for (const theme of ["dark", "light"]) {
    for (const [side, base] of [["after", AFTER], ...(BEFORE ? [["before", BEFORE]] : [])]) {
      const page = await open(ctx, base, theme === "light" ? "/?t=l" : "/");
      const hb = await page.locator("header").first().boundingBox();
      await shot(page, `${side === "before" ? "before/" : ""}H-header-${w}-${theme}`, { clip: { x: 0, y: 0, width: w, height: Math.ceil(hb.height) } });
      if (w === 1440) await shot(page, `${side === "before" ? "before/" : ""}H-logo-crop-${theme}`, { clip: { x: hb.x, y: 0, width: 640, height: 64 } });
      if (side === "after") {
        // Optical check: logo baseline vs the nav links' text baseline.
        checks.align.push({
          w,
          theme,
          ...(await page.evaluate(() => {
            const base = (el) => {
              const s = document.createElement("span");
              s.style.cssText = "display:inline-block;width:0;height:0";
              el.appendChild(s);
              const y = s.getBoundingClientRect().top;
              s.remove();
              return Math.round(y * 10) / 10;
            };
            const logo = document.querySelector("header [data-logo]");
            const svg = logo.querySelector("svg").getBoundingClientRect();
            const nav = [...document.querySelector("header").querySelectorAll("nav a")].find((a) => a.offsetParent);
            const search = document.querySelector("header button[aria-label='Search components']").getBoundingClientRect();
            return {
              designBaseline: base(logo.querySelector("svg + span")),
              logoBaseline: Math.round((svg.top + (svg.height * 310) / 317) * 10) / 10,
              logo: { h: Math.round(svg.height * 10) / 10, w: Math.round(svg.width), linkH: Math.round(logo.getBoundingClientRect().height) },
              navBaseline: nav ? base(nav) : null,
              navTop: nav ? Math.round(nav.getBoundingClientRect().top) : null,
              searchCentre: Math.round((search.top + search.height / 2) * 10) / 10,
              logoXCentre: Math.round((svg.top + (svg.height * (84 + 310)) / 2 / 317) * 10) / 10,
            };
          })),
        });
      }
      await page.close();
    }
  }
  await ctx.close();
}

// 2. Header + hero at every width (dark), plus a no-horizontal-scroll check on the main pages.
for (const [w, h] of [[360, 780], [390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
  const mobile = w < 768;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: w < 1440 });
  let page = await open(ctx, AFTER, "/");
  await shot(page, `R-hero-${w}`);
  await page.close();
  for (const path of ["/", "/gallery", "/examples/dashboard", "/export"]) {
    page = await open(ctx, AFTER, path);
    const o = await page.evaluate(() => [document.scrollingElement.scrollWidth, document.documentElement.clientWidth]);
    checks.overflow.push({ w, path, scrollWidth: o[0], clientWidth: o[1], ok: o[0] <= o[1] });
    await page.close();
  }
  await ctx.close();
}

// 3. Flap: panel scrolled while the page stays still, then the page scrolled while the panel stays still (+ webm).
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 720 }, recordVideo: { dir: `${OUT}/video`, size: { width: 1440, height: 720 } } });
  const page = await open(ctx, AFTER, "/");
  const state = () => page.evaluate(() => ({ pageY: Math.round(scrollY), panel: Math.round(document.querySelector("[data-customize-scroll]").scrollTop) }));
  await page.mouse.move(700, 450);
  await sleep(300);
  await page.locator("[data-customize-flap]").click();
  await sleep(700);
  await shot(page, "F1-flap-open");
  checks.flap.open = await state();
  const pb = await page.locator("[data-customize-scroll]").boundingBox();
  await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2, { steps: 8 });
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 120);
    await sleep(70);
  }
  await sleep(500);
  await shot(page, "F2-panel-scrolled-page-still");
  checks.flap.panelScrolled = await state();
  await page.mouse.move(1100, 500, { steps: 12 });
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 120);
    await sleep(70);
  }
  await sleep(500);
  await shot(page, "F3-page-scrolled-panel-still");
  checks.flap.pageScrolled = await state();
  // Back over the panel, keep wheeling past its end: the page must not move.
  await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2, { steps: 12 });
  for (let i = 0; i < 20; i++) {
    await page.mouse.wheel(0, 200);
    await sleep(50);
  }
  await sleep(500);
  await shot(page, "F4-panel-at-end-page-still");
  checks.flap.panelEnd = await state();
  checks.flap.ok =
    checks.flap.panelScrolled.pageY === 0 &&
    checks.flap.panelScrolled.panel > 0 &&
    checks.flap.pageScrolled.panel === checks.flap.panelScrolled.panel &&
    checks.flap.pageScrolled.pageY > 0 &&
    checks.flap.panelEnd.pageY === checks.flap.pageScrolled.pageY;
  const video = page.video();
  await page.close();
  await ctx.close();
  renameSync(await video.path(), `${OUT}/F-flap-scroll.webm`);
  rmSync(`${OUT}/video`, { recursive: true, force: true });
}

// 4. Phone customize popover: touch scroll inside never moves the page.
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await open(ctx, AFTER, "/");
  await page.locator("header button[aria-label=Customize]").tap();
  await sleep(500);
  await shot(page, "P1-phone-customize-open");
  const b = await page.locator("[data-own-scroll]").boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const state = () => page.evaluate(() => ({ pageY: Math.round(scrollY), box: Math.round(document.querySelector("[data-own-scroll]").scrollTop) }));
  for (let i = 0; i < 3; i++) {
    await cdp.send("Input.synthesizeScrollGesture", { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height * 0.7), yDistance: -500, gestureSourceType: "touch", speed: 1500 });
    await sleep(300);
  }
  await shot(page, "P2-phone-customize-scrolled-page-still");
  checks.popover = { after: await state(), width: await page.evaluate(() => { const b = document.querySelector("[data-own-scroll]"); return [b.scrollWidth, b.clientWidth]; }) };
  checks.popover.ok = checks.popover.after.pageY === 0 && checks.popover.after.box > 0 && checks.popover.width[0] <= checks.popover.width[1];
  await page.close();
  await ctx.close();
}

await browser.close();
writeFileSync(`${OUT}/checks.json`, JSON.stringify(checks, null, 2));
console.log(JSON.stringify(checks, null, 2));
server.kill("SIGTERM");
