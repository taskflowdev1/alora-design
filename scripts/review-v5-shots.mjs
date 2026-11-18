// v5 review shots: AI tab, footer, header wordmark, on/off states, new components, plus overflow checks.
// BASE = a deployed site (before shots: the live site) or empty = a local `vite preview` of dist/ on SHOTS_PORT.
// OUT = folder (default output/review-v5); PREFIX = "before/" for before shots. ONLY=<regex> limits by letter.
//   A AI tab + landing AI band   F footer   H header wordmark close-up (2x)   T on/off states (light + dark)
//   N new components (landing full page, detail pages)   X overflow checks at 360-1440 in both themes
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = Number(process.env.SHOTS_PORT || 5194);
const LOCAL = !process.env.BASE;
const BASE = process.env.BASE || `http://127.0.0.1:${PORT}`;
const OUT = process.env.OUT || "output/review-v5";
const PREFIX = process.env.PREFIX || "";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const want = (l) => !ONLY || ONLY.test(l);
mkdirSync(`${OUT}/${PREFIX}`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let server;
if (LOCAL) {
  server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
  process.on("exit", () => server.kill("SIGTERM"));
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {}
    if (i > 80) throw new Error("preview server did not start");
    await sleep(250);
  }
}

const checks = { base: BASE, errors: [], overflow: [], footer: {}, header: {} };
const browser = await chromium.launch();
const ctxFor = (w, h = 900, dsf) => {
  const mobile = w < 768;
  return browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf ?? (mobile ? 2 : 1), isMobile: mobile, hasTouch: mobile });
};
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);
async function open(ctx, path) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => checks.errors.push(`${path}: ${e.message}`));
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await sleep(500);
  return page;
}
const file = (name) => `${OUT}/${PREFIX}${name}.png`;
const settle = (page) =>
  page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    scrollTo(0, 0);
  });
async function full(path, name, w, theme) {
  const ctx = await ctxFor(w, w < 768 ? 844 : 900);
  const page = await open(ctx, q(path, theme));
  await settle(page);
  await sleep(500);
  await page.screenshot({ path: file(name), fullPage: true }).catch((e) => checks.errors.push(`${name}: ${e.message.split("\n")[0]}`));
  await ctx.close();
}
async function el(page, locator, name, pad = 16) {
  const l = typeof locator === "string" ? page.locator(locator).first() : locator;
  await l.scrollIntoViewIfNeeded();
  await sleep(300);
  const b = await l.boundingBox();
  if (!b) return checks.errors.push(`${name}: not found`);
  const vw = page.viewportSize().width;
  const top = await page.evaluate(() => scrollY);
  await page.screenshot({ path: file(name), fullPage: true, clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y + top - pad), width: Math.min(vw, b.width + pad * 2), height: b.height + pad * 2 } });
}

// A: the AI tab, whole page, plus the landing's AI band.
if (want("A")) {
  await full("/ai", "A1-ai-1440-dark", 1440, "dark");
  await full("/ai", "A2-ai-1440-light", 1440, "light");
  await full("/ai", "A3-ai-390-dark", 390, "dark");
  for (const theme of ["dark", "light"]) {
    const ctx = await ctxFor(1440);
    const page = await open(ctx, q("/", theme));
    await el(page, "[data-landing=ai]", `A4-landing-ai-band-${theme}`);
    await ctx.close();
  }
}

// F: the bottom of the landing (closing + footer) and of an inner page.
if (want("F")) {
  for (const [w, theme, path] of [[1440, "dark", "/"], [1440, "light", "/"], [390, "dark", "/"], [1440, "dark", "/components"]]) {
    const ctx = await ctxFor(w, w < 768 ? 844 : 900);
    const page = await open(ctx, q(path, theme));
    await settle(page);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await sleep(500);
    const name = `F-footer-${path === "/" ? "landing" : "components"}-${w}-${theme}`;
    await page.screenshot({ path: file(name) });
    if (w === 1440 && theme === "dark" && path === "/")
      checks.footer = await page.evaluate(() => {
        const f = document.querySelector("footer");
        const r = f.getBoundingClientRect();
        const sizes = [...f.querySelectorAll("*")].filter((n) => n.childNodes[0]?.nodeType === 3 && n.textContent.trim()).map((n) => [n.textContent.trim().slice(0, 24), getComputedStyle(n).fontSize]);
        return { height: Math.round(r.height), bottomGap: Math.round(innerHeight - r.bottom), sizes };
      });
    await ctx.close();
  }
}

// H: header wordmark close-up at 2x, and the whole header at 1440, dark and light.
if (want("H")) {
  for (const theme of ["dark", "light"]) {
    const ctx = await ctxFor(1440, 900, 2);
    const page = await open(ctx, q("/components", theme));
    const hb = await page.locator("header").first().boundingBox();
    const nav = await page.locator("header nav[aria-label=Sections]").first().boundingBox();
    const logo = await page.locator("[data-logo]").first().boundingBox();
    await page.screenshot({ path: file(`H1-wordmark-2x-${theme}`), clip: { x: logo.x - 16, y: 0, width: nav.x + 300 - (logo.x - 16), height: hb.height } });
    await page.screenshot({ path: file(`H2-header-1440-${theme}`), clip: { x: 0, y: 0, width: 1440, height: hb.height } });
    if (theme === "dark")
      checks.header = await page.evaluate(() => {
        const logo = document.querySelector("[data-logo]").getBoundingClientRect();
        const tab = document.querySelector("header nav[aria-label=Sections] a").getBoundingClientRect();
        return { logo: [Math.round(logo.x), Math.round(logo.y), Math.round(logo.width), Math.round(logo.height)], logoCentre: logo.y + logo.height / 2, tabCentre: tab.y + tab.height / 2 };
      });
    await ctx.close();
    const phone = await ctxFor(390, 844, 3);
    const pp = await open(phone, q("/", theme));
    const pb = await pp.locator("[data-logo]").first().boundingBox();
    await pp.screenshot({ path: file(`H3-wordmark-390-3x-${theme}`), clip: { x: 0, y: 0, width: 390, height: pb.y + pb.height + 14 } });
    await phone.close();
  }
}

// T: on/off states. The Kemang card on the landing, then each component's gallery stage, in both themes.
const STATES = ["switch", "toggle-group", "segmented", "checkbox", "radio", "status", "multi-select", "tabs", "date-picker", "time-picker", "bottom-nav", "sidebar", "bar-chart", "pagination", "toggle"];
if (want("T")) {
  for (const theme of ["dark", "light"]) {
    const ctx = await ctxFor(1440, 900, 2);
    const page = await open(ctx, q("/", theme));
    await el(page, page.locator("h3:text-is('Kemang')").locator("xpath=ancestor::div[contains(@class,'rounded-card')][1]"), `T00-kemang-${theme}`, 12);
    // shop picker, open
    const sp = await open(ctx, q("/components/shop-picker", theme));
    await sp.locator("[data-stage] button[aria-label=Shops]").first().click().catch(() => {});
    await sleep(400);
    const pop = sp.locator("[data-radix-popper-content-wrapper]").first();
    if (await pop.count()) await el(sp, pop, `T01-shop-picker-open-${theme}`, 12);
    for (const [i, name] of STATES.entries()) {
      const p = await open(ctx, q(`/components/${name}`, theme));
      const stage = p.locator("[data-stage]").first();
      if (!(await stage.count())) continue;
      await el(p, stage, `T${String(i + 2).padStart(2, "0")}-${name}-${theme}`, 0);
      await p.close();
    }
    await ctx.close();
  }
}

// N: the new components: the landing whole (dark, light, phone) and three detail pages.
if (want("N")) {
  await full("/", "N1-landing-1440-dark", 1440, "dark");
  await full("/", "N2-landing-1440-light", 1440, "light");
  await full("/", "N3-landing-390-dark", 390, "dark");
  for (const [name, theme] of [["line-chart", "dark"], ["line-chart", "light"], ["data-table", "dark"], ["accordion", "light"], ["pie-chart", "dark"]]) {
    const ctx = await ctxFor(1440, 1000);
    const page = await open(ctx, q(`/components/${name}`, theme));
    await page.screenshot({ path: file(`N-detail-${name}-${theme}`), fullPage: true });
    await ctx.close();
  }
}

// X: no horizontal scroll anywhere that changed.
if (want("X")) {
  for (const w of [360, 390, 768, 1024, 1440]) {
    for (const theme of ["dark", "light"]) {
      const ctx = await ctxFor(w, 900, 1);
      for (const path of ["/", "/ai", "/components", "/components/line-chart", "/components/data-table", "/components/carousel", "/components/resizable", "/components/menubar"]) {
        const page = await open(ctx, q(path, theme));
        const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        if (sw > cw) checks.overflow.push({ path, w, theme, sw, cw });
        await page.close();
      }
      await ctx.close();
    }
  }
}

await browser.close();
writeFileSync(`${OUT}/${PREFIX}checks.json`, JSON.stringify(checks, null, 2));
console.log(JSON.stringify({ errors: checks.errors.slice(0, 10), overflow: checks.overflow, footer: checks.footer, header: checks.header }, null, 2));
server?.kill("SIGTERM");
process.exit(0);
