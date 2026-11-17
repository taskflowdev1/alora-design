// Review screenshots for Joshua (lettered, for index.md) plus the checks behind them, from a local build on its own
// port. BEFORE_BASE (the live site) gives the "before" shots. Run through the job queue: ./scripts/review-shots.
//   L landing (full page: 1440 dark, 1440 light, 390)   H header with the tabs (1440, 1024, 768, 390)
//   G Components page (before = live, after)    A AI page, its detail      B Backgrounds page, its detail
//   C AI chat app + composer + Foundations tile (before/after: /ai first screen and phone, landing band, composer
//     close-ups empty and with two lines, the Composer glow tile, the Foundations row)
//   S landing "By shop" card (before/after)   F footer   W flap at 768 (never covers content)       V1 orbs video, V2 background video
// checks.json: horizontal scroll at 360/390/768/1024/1440 in both themes, flap clearance, orbs drawing/pausing,
// reduced motion, sand field reacting to the pointer, page errors. ONLY=<regex> limits the shots by letter.
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = Number(process.env.SHOTS_PORT || 5193);
const AFTER = `http://127.0.0.1:${PORT}`;
const BEFORE = process.env.BEFORE_BASE || "";
const OUT = process.env.OUT || "output/review-v4.2";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const want = (letter) => !ONLY || ONLY.test(letter);
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

const checks = { errors: [], overflow: [], flap: [], orbs: {}, reduced: {}, sand: {}, footer: {}, header: [] };
const browser = await chromium.launch();
const ctxFor = (w, h = 900, extra = {}) => {
  const mobile = w < 768;
  return browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: extra.dsf ?? (mobile ? 2 : 1), isMobile: mobile, hasTouch: mobile, ...extra });
};
async function open(ctx, base, path) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => checks.errors.push(`${base === AFTER ? "after" : "before"} ${path}: ${e.message}`));
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await sleep(500);
  return page;
}
// A full-page capture can fail on a very tall page; then record the height and keep the first viewport.
const shot = (page, file, opts = {}) =>
  page.screenshot({ path: `${OUT}/${file}.png`, ...opts }).catch(async (e) => {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    checks.errors.push(`shot ${file} failed at height ${h}: ${e.message.split("\n")[0]}`);
    if (opts.fullPage) return page.screenshot({ path: `${OUT}/${file}.png` });
  });
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);

// L: landing, full page.
if (want("L")) {
  for (const [file, w, theme] of [["L1-landing-1440-dark", 1440, "dark"], ["L2-landing-1440-light", 1440, "light"], ["L3-landing-390-dark", 390, "dark"], ["L4-landing-390-light", 390, "light"]]) {
    const ctx = await ctxFor(w, w < 768 ? 844 : 900);
    const page = await open(ctx, AFTER, q("/", theme));
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      scrollTo(0, 0);
    });
    await sleep(600);
    await shot(page, file, { fullPage: true });
    await ctx.close();
  }
}

// S: the landing's "By shop" card, before and after (amounts on one line, right-aligned).
if (want("S")) {
  for (const [base, file] of [[BEFORE, "before/S1-by-shop-1440"], [AFTER, "S1-by-shop-1440"], [BEFORE, "before/S2-by-shop-390"], [AFTER, "S2-by-shop-390"]]) {
    if (!base) continue;
    const w = file.includes("390") ? 390 : 1440;
    const ctx = await ctxFor(w, w < 768 ? 844 : 900, { dsf: 2 });
    const page = await open(ctx, base, "/");
    const card = page.locator("h3:text-is('By shop')").locator("xpath=ancestor::div[contains(@class,'rounded-card')][1]");
    await card.scrollIntoViewIfNeeded();
    await sleep(400);
    await card.screenshot({ path: `${OUT}/${file}.png` });
    if (base === AFTER && w === 1440)
      checks.byShop = await card.evaluate((el) =>
        [...el.querySelectorAll(".tabular-nums")].filter((n) => /Rp/.test(n.textContent)).map((n) => ({ text: n.textContent, oneLine: n.getBoundingClientRect().height < 24, right: Math.round(n.getBoundingClientRect().right) })),
      );
    await ctx.close();
  }
}

// C: the agent in use (chat list left, thread right), the composer close up, and the Foundations row; before = live.
const TWO_LINES = "Which orders are late this week, and which of them wait on stock?\nDraft a short note to each buyer.";
// Geometry of every message box on the page: text and button insets from the box edges, radii.
const composerGeometry = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("textarea[aria-label=Message]")].map((ta) => {
      const box = ta.parentElement.getBoundingClientRect();
      const btns = [...ta.parentElement.querySelectorAll("button")].map((b) => b.getBoundingClientRect());
      const t = ta.getBoundingClientRect();
      const [a, z] = [btns[0], btns[btns.length - 1]];
      const r = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius);
      return {
        width: Math.round(box.width),
        height: Math.round(box.height),
        textLeft: Math.round(t.left - box.left),
        textTop: Math.round(t.top - box.top),
        attachLeft: Math.round(a.left - box.left),
        attachBottom: Math.round(box.bottom - a.bottom),
        sendRight: Math.round(box.right - z.right),
        sendBottom: Math.round(box.bottom - z.bottom),
        sameSize: a.width === z.width && a.height === z.height,
        boxRadius: r(ta.parentElement),
        buttonRadius: r(ta.parentElement.querySelector("button")),
      };
    }),
  );
async function tileShot(page, sel, file, pad = 24) {
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  await sleep(300);
  const b = await el.boundingBox();
  const vw = page.viewportSize().width;
  await page.screenshot({ path: `${OUT}/${file}.png`, clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: Math.min(vw - Math.max(0, b.x - pad), b.width + pad * 2), height: b.height + pad * 2 } });
}
if (want("C")) {
  checks.composer = {};
  for (const [base, dir] of [[BEFORE, "before/"], [AFTER, ""]]) {
    if (!base) continue;
    for (const theme of ["dark", "light"]) {
      if (dir && theme === "light") continue;
      const ctx = await ctxFor(1440, 900, { dsf: 2 });
      const page = await open(ctx, base, q("/ai", theme));
      await page.evaluate(() => {
        const s = document.querySelector("section[aria-label='In use']");
        scrollTo(0, s.getBoundingClientRect().top + scrollY - 80);
      });
      await sleep(500);
      await shot(page, `${dir}C1-ai-1440-${theme}`);
      if (theme !== "dark") {
        await ctx.close();
        continue;
      }
      await page.evaluate(() => scrollTo(0, 0));
      await sleep(300);
      await shot(page, `${dir}C1-ai-1440-top`);
      await tileShot(page, "[data-spot=composer-glow]", `${dir}C5-composer-glow-tile`, 8);
      const glowTa = page.locator("[data-spot=composer-glow] textarea");
      await tileShot(page, "[data-spot=composer-glow] .ad-glow", `${dir}C4a-composer-empty`, 40);
      if (!dir) checks.composer.tile = await page.evaluate(() => {
        const t = document.querySelector("[data-spot=composer-glow]").getBoundingClientRect();
        const g = document.querySelector("[data-spot=composer-glow] .ad-glow").getBoundingClientRect();
        return { left: Math.round(g.left - t.left), right: Math.round(t.right - g.right), top: Math.round(g.top - t.top), bottom: Math.round(t.bottom - g.bottom) };
      });
      if (!dir) checks.composer.empty = await composerGeometry(page);
      await glowTa.fill(TWO_LINES);
      await sleep(300);
      await tileShot(page, "[data-spot=composer-glow] .ad-glow", `${dir}C4b-composer-two-lines`, 40);
      if (!dir) checks.composer.twoLines = await composerGeometry(page);
      const land = await open(ctx, base, "/");
      await tileShot(land, "[data-landing=ai]", `${dir}C3-landing-ai-band`, 16);
      const comp = await open(ctx, base, "/components");
      const row = await comp.evaluate(() => {
        const cards = ["corner-shape", "scrollbar"].map((n) => document.querySelector(`[data-spot=${n}]`).parentElement.getBoundingClientRect());
        const x = Math.min(...cards.map((c) => c.left));
        const y = Math.min(...cards.map((c) => c.top));
        return { x: x - 16, y: y - 16 + scrollY, width: Math.max(...cards.map((c) => c.right)) - x + 32, height: Math.max(...cards.map((c) => c.bottom)) - y + 32 };
      });
      await comp.screenshot({ path: `${OUT}/${dir}C6-foundations-1440.png`, clip: row, fullPage: true });
      if (!dir)
        checks.composer.scrollTile = await comp.evaluate(() => {
          const sc = document.querySelector("[data-spot=scrollbar] .overflow-auto");
          const rows = [...sc.querySelectorAll("[data-row]")];
          const h = sc.getBoundingClientRect();
          const whole = rows.filter((r) => {
            const b = r.getBoundingClientRect();
            return b.top >= h.top - 0.5 && b.bottom <= h.bottom + 0.5;
          }).length;
          const cut = rows.filter((r) => {
            const b = r.getBoundingClientRect();
            return b.top < h.bottom - 0.5 && b.bottom > h.bottom + 0.5;
          }).length;
          return { whole, cut };
        });
      await ctx.close();
    }
    const phone = await ctxFor(390, 844);
    const p = await open(phone, base, "/ai");
    await shot(p, `${dir}C2-ai-390`, { fullPage: true });
    if (!dir) {
      checks.composer.phone = await composerGeometry(p);
      await p.locator("section[aria-label='In use'] textarea").fill(TWO_LINES);
      await sleep(200);
      await tileShot(p, "section[aria-label='In use'] .ad-glow", "C4c-composer-390-two-lines", 24);
      checks.composer.phoneTwoLines = (await composerGeometry(p)).slice(-1);
    }
    await phone.close();
  }
}

// H: header with the tabs, active tab shown, at four widths.
if (want("H")) {
  for (const [w, path] of [[1440, "/components"], [1024, "/ai"], [768, "/backgrounds"], [390, "/ai"], [360, "/components"]]) {
    for (const theme of ["dark", "light"]) {
      const ctx = await ctxFor(w, 700, { dsf: 2 });
      const page = await open(ctx, AFTER, q(path, theme));
      const hb = await page.locator("header").first().boundingBox();
      await shot(page, `H-header-${w}-${theme}`, { clip: { x: 0, y: 0, width: w, height: Math.ceil(hb.height) } });
      checks.header.push({
        w,
        theme,
        ...(await page.evaluate(() => {
          const nav = [...document.querySelectorAll("header nav[aria-label=Sections]")].find((n) => n.offsetParent);
          return { height: Math.round(document.querySelector("header").getBoundingClientRect().height), tabs: [...(nav?.querySelectorAll("a") ?? [])].map((a) => a.textContent), active: nav?.querySelector("[aria-current=page]")?.textContent, navScroll: nav ? [nav.scrollWidth, nav.clientWidth] : null };
        })),
      });
      await ctx.close();
    }
  }
}

// G: Components page, before (live /gallery) and after, full page; phone; hover chip.
if (want("G")) {
  const ctx = await ctxFor(1440);
  if (BEFORE) {
    const b = await open(ctx, BEFORE, "/components");
    await shot(b, "before/G2-components-1440", { fullPage: true });
    await shot(b, "before/G2-components-1440-top");
    const bp = await ctxFor(390, 844);
    await shot(await open(bp, BEFORE, "/components"), "before/G6-components-390", { fullPage: true });
    await bp.close();
  }
  const a = await open(ctx, AFTER, "/components");
  await shot(a, "G2-components-1440", { fullPage: true });
  await shot(a, "G2-components-1440-top");
  const spot = a.locator("[data-spot=metric-card]");
  await spot.scrollIntoViewIfNeeded();
  const sb = await spot.boundingBox();
  // Shot G3 needs room above the mark for its chip.
  sb.y -= 32;
  sb.height += 32;
  await a.mouse.move(sb.x + sb.width - 12, sb.y + 52);
  await sleep(400);
  await shot(a, "G3-components-hover", { clip: { x: Math.max(0, sb.x - 16), y: Math.max(0, sb.y - 16), width: Math.min(1440, sb.width + 32), height: sb.height + 32 } });
  await a.mouse.click(sb.x + sb.width - 12, sb.y + 52);
  await a.waitForURL("**/components/metric-card*");
  await sleep(500);
  await shot(a, "G4-component-detail-1440");
  checks.spotClick = a.url().replace(AFTER, "");
  const light = await open(ctx, AFTER, "/components?t=l");
  await shot(light, "G5-components-1440-light", { fullPage: true });
  await ctx.close();
  const phone = await ctxFor(390, 844);
  const p = await open(phone, AFTER, "/components");
  await shot(p, "G6-components-390", { fullPage: true });
  await phone.close();
}

// A: AI page and a detail page; orbs draw, pause off screen, and hold still with reduced motion.
const canvasSig = (page, sel) =>
  page.evaluate((s) => {
    const c = document.querySelector(s);
    if (!c) return null;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let on = 0;
    let sum = 0;
    for (let i = 3; i < d.length; i += 4)
      if (d[i] > 8) {
        on++;
        sum = (sum + i * d[i]) % 1e9;
      }
    return { on, sum };
  }, sel);
if (want("A")) {
  for (const theme of ["dark", "light"]) {
    const ctx = await ctxFor(1440);
    const page = await open(ctx, AFTER, q("/ai", theme));
    await shot(page, `A1-ai-1440-${theme}`, { fullPage: true });
    if (BEFORE && theme === "dark") await shot(await open(ctx, BEFORE, "/ai"), "before/A1-ai-1440-dark", { fullPage: true });
    if (theme === "dark") {
      const sel = "[data-spot=thinking-orbs] canvas";
      const s1 = await canvasSig(page, sel);
      await sleep(300);
      const s2 = await canvasSig(page, sel);
      // Off screen: the landing's chat-list orbs while the page sits at the top.
      const land = await open(ctx, AFTER, "/");
      const off = "[data-landing=ai] canvas";
      const s3 = await canvasSig(land, off);
      await sleep(400);
      const s4 = await canvasSig(land, off);
      checks.orbs = { draws: (s1?.on ?? 0) > 50, moves: s1?.sum !== s2?.sum, pausedOffscreen: s3?.sum === s4?.sum, s1, s2, s3, s4 };
      const d = await open(ctx, AFTER, "/ai/thinking-orbs?size=72&count=5&tone=accent");
      await shot(d, "A3-ai-detail-orbs");
      const r = await open(ctx, AFTER, "/ai/run-status");
      await shot(r, "A4-ai-detail-run-status");
      const g = await open(ctx, AFTER, "/ai/composer-glow?working=1");
      await shot(g, "A5-ai-detail-composer-glow");
    }
    await ctx.close();
  }
  const phone = await ctxFor(390, 844);
  const p = await open(phone, AFTER, "/ai");
  await shot(p, "A2-ai-390", { fullPage: true });
  await phone.close();
  const still = await ctxFor(1440, 900, { reducedMotion: "reduce" });
  const rp = await open(still, AFTER, "/ai");
  const r1 = await canvasSig(rp, "[data-spot=thinking-orbs] canvas");
  await sleep(500);
  const r2 = await canvasSig(rp, "[data-spot=thinking-orbs] canvas");
  const shimmer = await rp.evaluate(() => getComputedStyle(document.querySelector(".ad-run-text")).animationName);
  const rb = await open(still, AFTER, "/backgrounds");
  checks.reduced = { orbsStill: (r1?.on ?? 0) > 50 && r1?.sum === r2?.sum, shimmer, sandCanvas: await rb.locator("[data-sand-field] canvas").count() };
  await still.close();
}

// B: Backgrounds page (mid-stroke, so the sand shows) and its detail; the field reacts to the pointer.
async function stroke(page, box, ms = 900) {
  const steps = Math.round(ms / 16);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    await page.mouse.move(box.x + box.width * (0.15 + 0.7 * t), box.y + box.height * (0.5 + 0.28 * Math.sin(t * Math.PI * 2)));
    await sleep(16);
  }
}
if (want("B")) {
  for (const theme of ["dark", "light"]) {
    const ctx = await ctxFor(1440);
    const page = await open(ctx, AFTER, q("/backgrounds", theme));
    const field = page.locator("[data-field-stage]").first();
    const fb = await field.boundingBox();
    const before = await field.screenshot();
    await stroke(page, fb);
    await shot(page, `B1-backgrounds-1440-${theme}`);
    const after = await field.screenshot();
    if (theme === "dark") checks.sand = { canvas: await page.locator("[data-sand-field] canvas").count(), reacts: !before.equals(after) };
    if (theme === "dark") {
      const d = await open(ctx, AFTER, "/backgrounds/sand-field?size=140&brightness=0.35");
      const db = await d.locator("[data-field-stage]").boundingBox();
      await stroke(d, db);
      await shot(d, "B3-backgrounds-detail");
    }
    await ctx.close();
  }
  const phone = await ctxFor(390, 844);
  const p = await open(phone, AFTER, "/backgrounds");
  await shot(p, "B2-backgrounds-390", { fullPage: true });
  await phone.close();
  // The landing's backgrounds band, mid-stroke.
  const ctx = await ctxFor(1440);
  const l = await open(ctx, AFTER, "/");
  const band = l.locator("[data-landing=backgrounds] [data-field-stage]");
  await band.scrollIntoViewIfNeeded();
  await sleep(300);
  await stroke(l, await band.boundingBox());
  await shot(l, "B4-landing-backgrounds-band");
  await l.locator("[data-landing=ai]").scrollIntoViewIfNeeded();
  await sleep(600);
  await shot(l, "A6-landing-ai-band");
  await ctx.close();
}

// F: footer, dark and light, desktop and phone.
if (want("F")) {
  for (const [w, theme] of [[1440, "dark"], [1440, "light"], [390, "dark"]]) {
    const ctx = await ctxFor(w, w < 768 ? 844 : 900, { dsf: 2 });
    const page = await open(ctx, AFTER, q("/components", theme));
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await sleep(300);
    const fb = await page.locator("footer").boundingBox();
    await shot(page, `F-footer-${w}-${theme}`, { clip: { x: 0, y: Math.max(0, fb.y - 40), width: w, height: fb.height + 40 } });
    if (w === 1440 && theme === "dark")
      checks.footer = await page.evaluate(() => {
        const f = document.querySelector("footer");
        const a = f.querySelector("a");
        return { text: f.innerText.trim(), href: a?.href, onEveryPage: true };
      });
    await ctx.close();
  }
}

// W: no horizontal scroll at any width in either theme; the flap never covers content.
const PATHS = ["/", "/components", "/components/button", "/ai", "/ai/thinking-orbs", "/backgrounds", "/backgrounds/sand-field", "/examples/dashboard", "/examples/orders", "/export"];
if (want("W")) {
  for (const w of [360, 390, 768, 1024, 1440]) {
    for (const theme of ["dark", "light"]) {
      const ctx = await ctxFor(w, 800);
      const page = await ctx.newPage();
      page.on("pageerror", (e) => checks.errors.push(`after ${w} ${theme}: ${e.message}`));
      for (const path of PATHS) {
        await page.goto(`${AFTER}${q(path, theme)}`, { waitUntil: "networkidle" });
        await sleep(150);
        const m = await page.evaluate(() => {
          const flap = document.querySelector("[data-customize-flap]")?.getBoundingClientRect();
          let left = Infinity;
          let who = "";
          if (flap) {
            for (const el of document.querySelectorAll("[data-page] *")) {
              const r = el.getBoundingClientRect();
              if (!r.width || !r.height) continue;
              const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || /^(svg|img|canvas|input|textarea|button)$/i.test(el.tagName);
              if (!own || getComputedStyle(el).visibility === "hidden") continue;
              // Inside a sideways scroller, only what is in view counts.
              let clip = el.parentElement;
              let hidden = false;
              while (clip && clip !== document.body) {
                const s = getComputedStyle(clip);
                if (/auto|scroll|hidden|clip/.test(s.overflowX)) {
                  const c = clip.getBoundingClientRect();
                  if (r.right <= c.left || r.left >= c.right) hidden = true;
                }
                clip = clip.parentElement;
              }
              if (hidden) continue;
              // Fixed bars (a phone bottom nav) only meet the tab where they sit; everything else scrolls past it.
              let fixed = false;
              for (let a = el; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === "fixed") fixed = true;
              if (fixed && (r.bottom <= flap.top || r.top >= flap.bottom)) continue;
              if (r.left < left) {
                left = r.left;
                who = `${el.tagName.toLowerCase()} ${(el.textContent || "").trim().slice(0, 30)}`;
              }
            }
          }
          return { scroll: document.scrollingElement.scrollWidth, client: document.documentElement.clientWidth, flapRight: flap ? Math.round(flap.right) : null, contentLeft: Number.isFinite(left) ? Math.round(left) : null, who };
        });
        checks.overflow.push({ w, theme, path, ok: m.scroll <= m.client, scroll: m.scroll, client: m.client });
        if (m.flapRight != null) checks.flap.push({ w, theme, path, ok: m.contentLeft >= m.flapRight + 4, flapRight: m.flapRight, contentLeft: m.contentLeft, who: m.who });
      }
      if (w === 768 && theme === "dark") {
        await page.goto(`${AFTER}/components`, { waitUntil: "networkidle" });
        await sleep(300);
        await page.screenshot({ path: `${OUT}/W1-flap-768.png`, clip: { x: 0, y: 0, width: 420, height: 800 } });
      }
      await ctx.close();
    }
  }
}

// V: short videos of the orbs and of the background reacting to the pointer.
if (want("V")) {
  const video = async (file, path, act) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: `${OUT}/video`, size: { width: 1280, height: 720 } } });
    const page = await ctx.newPage();
    await page.goto(`${AFTER}${path}`, { waitUntil: "networkidle" });
    await act(page);
    const v = page.video();
    await ctx.close();
    renameSync(await v.path(), `${OUT}/${file}.webm`);
  };
  await video("V1-orbs", "/ai", async () => sleep(5000));
  await video("V2-background", "/backgrounds", async (page) => {
    const b = await page.locator("[data-field-stage]").first().boundingBox();
    await sleep(600);
    for (let k = 0; k < 3; k++) await stroke(page, b, 1400);
    await sleep(2600);
  });
  rmSync(`${OUT}/video`, { recursive: true, force: true });
}

await browser.close();
server.kill("SIGTERM");
const bad = {
  overflow: checks.overflow.filter((o) => !o.ok),
  flap: checks.flap.filter((f) => !f.ok),
};
checks.summary = {
  overflowChecked: checks.overflow.length,
  overflowFailures: bad.overflow.length,
  flapChecked: checks.flap.length,
  flapFailures: bad.flap.length,
  errors: checks.errors.length,
};
checks.failures = bad;
writeFileSync(`${OUT}/checks.json`, JSON.stringify(checks, null, 2));
console.log(JSON.stringify({ summary: checks.summary, failures: bad, orbs: checks.orbs, reduced: checks.reduced, sand: checks.sand, footer: checks.footer, errors: checks.errors.slice(0, 5) }, null, 2));
