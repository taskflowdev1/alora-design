// v5.2 review shots: the grey ramp. Three versions (original e449e2c, v5.1 549ea4c, new), light and dark.
// WORK = folder holding dist-e449e2c, dist-549ea4c, dist-new (scripts/review-v5.2-shots builds them).
// OUT = folder (default output/review-v5.2). ONLY=<regex> limits by letter.
//   K Kemang card   S side by side per component   P full landing (v5.1 | new)   G grey swatch sheet
//   C rendered greys: every opaque neutral the landing and /components paint, per version and theme
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const WORK = process.env.WORK;
const OUT = process.env.OUT || "output/review-v5.2";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const want = (l) => !ONLY || ONLY.test(l);
mkdirSync(`${OUT}/parts`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VERSIONS = [
  { key: "e449e2c", label: "Original (e449e2c)", port: 5184 },
  { key: "549ea4c", label: "v5.1 (549ea4c)", port: 5185 },
  { key: "new", label: "New", port: 5186 },
];
const servers = [];
for (const v of VERSIONS) {
  const s = spawn("npx", ["vite", "preview", "--outDir", `${WORK}/dist-${v.key}`, "--port", String(v.port), "--strictPort", "--host", "127.0.0.1"], { stdio: "ignore" });
  servers.push(s);
  v.base = `http://127.0.0.1:${v.port}`;
}
process.on("exit", () => servers.forEach((s) => s.kill("SIGTERM")));
for (const v of VERSIONS) {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(v.base)).ok) break;
    } catch {}
    if (i > 80) throw new Error(`preview ${v.key} did not start`);
    await sleep(250);
  }
}

const checks = { errors: [], missing: [], rendered: {}, colours: {} };
const browser = await chromium.launch();
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);
async function open(ctx, v, path, theme) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => checks.errors.push(`${v.key} ${path}: ${e.message}`));
  await page.goto(`${v.base}${q(path, theme)}`, { waitUntil: "networkidle" });
  await sleep(500);
  return page;
}
async function clip(page, locator, file, pad = 12) {
  const l = typeof locator === "string" ? page.locator(locator).first() : locator;
  if (!(await l.count())) return false;
  await l.scrollIntoViewIfNeeded();
  await sleep(300);
  const b = await l.boundingBox();
  if (!b) return false;
  const vw = page.viewportSize().width;
  const top = await page.evaluate(() => scrollY);
  await page.screenshot({ path: file, fullPage: true, clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y + top - pad), width: Math.min(vw, b.width + pad * 2), height: b.height + pad * 2 } });
  return true;
}
const kemang = (page) => page.locator("h3:text-is('Kemang')").locator("xpath=ancestor::div[contains(@class,'rounded-card')][1]");

const ITEMS = [
  ["K00", "kemang", async (p) => kemang(p), "/"],
  ["S01", "segmented", null],
  ["S02", "toggle-group", null],
  ["S03", "tabs", null],
  ["S04", "chips", null, "/components/status"],
  ["S05", "shop-picker-open", async (p) => {
    await p.locator("[data-stage] button[aria-label=Shops]").first().click().catch(() => {});
    await sleep(400);
    return p.locator("[data-radix-popper-content-wrapper]").first();
  }, "/components/shop-picker"],
  ["S07", "tag-input", null],
  ["S09", "switch", null],
];

const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
async function compose(name, title, theme, cols, width = 1440) {
  const dark = theme === "dark";
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    h1{font-size:15px;font-weight:600;margin:0 0 16px}
    .row{display:flex;gap:24px;align-items:flex-start}
    figure{margin:0;display:grid;gap:8px;min-width:0}
    figcaption{font-weight:500}
    img{max-width:${Math.floor((width - 80) / cols.length)}px;height:auto;display:block;border-radius:8px}
    .none{width:240px;height:80px;display:grid;place-items:center;opacity:.6;border-radius:8px;background:${dark ? "#1a1a1a" : "#e9e9e9"}}
  </style><h1>${title} · ${theme}</h1><div class=row>${cols
    .map((c) => `<figure><figcaption>${c.label}</figcaption>${c.file && existsSync(c.file) ? `<img src="${dataUri(c.file)}">` : `<div class=none>not in this version</div>`}</figure>`)
    .join("")}</div>`;
  const ctx = await browser.newContext({ viewport: { width, height: 120 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await ctx.close();
}

if (want("S") || want("K")) {
  for (const theme of ["light", "dark"]) {
    for (const v of VERSIONS) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
      for (const [letter, name, act, path] of ITEMS) {
        if (!want(letter[0])) continue;
        const page = await open(ctx, v, path || `/components/${name}`, theme);
        const target = act ? await act(page) : page.locator("[data-stage] > *").first();
        const ok = await clip(page, target, `${OUT}/parts/${letter}-${name}-${theme}-${v.key}.png`, act ? 12 : 20);
        if (!ok) checks.missing.push(`${v.key} ${name} ${theme}`);
        await page.close();
      }
      await ctx.close();
    }
    for (const [letter, name] of ITEMS) {
      if (!want(letter[0])) continue;
      await compose(`${letter}-${name}-${theme}`, name, theme, VERSIONS.map((v) => ({ label: v.label, file: `${OUT}/parts/${letter}-${name}-${theme}-${v.key}.png` })));
    }
  }
}

// P: the whole landing, v5.1 next to new, to show nothing else moved.
if (want("P")) {
  for (const theme of ["light", "dark"]) {
    for (const v of VERSIONS.slice(1)) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      const page = await open(ctx, v, "/", theme);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        scrollTo(0, 0);
      });
      await sleep(600);
      await page.screenshot({ path: `${OUT}/parts/P-landing-${theme}-${v.key}.png`, fullPage: true });
      await ctx.close();
    }
    await compose(`P-landing-${theme}`, "Landing", theme, VERSIONS.slice(1).map((v) => ({ label: v.label, file: `${OUT}/parts/P-landing-${theme}-${v.key}.png` })), 2200);
  }
}

// G: the grey swatch sheet (scripts/greys.mjs --sheet wrote greys.html).
if (want("G") && existsSync(`${OUT}/greys.html`)) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`file://${process.cwd()}/${OUT}/greys.html`);
  for (const theme of ["light", "dark"]) await page.locator(`section.${theme}`).screenshot({ path: `${OUT}/G-greys-${theme}.png` });
  await ctx.close();
}

// C: every opaque neutral colour the pages paint (backgrounds, text, SVG fill and stroke), per version and theme.
if (want("C")) {
  for (const theme of ["light", "dark"]) {
    for (const v of VERSIONS.slice(1)) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const seen = {};
      for (const path of ["/", "/components", "/examples/orders"]) {
        const page = await open(ctx, v, path, theme);
        const found = await page.evaluate(() => {
          const out = {};
          const add = (c, where) => {
            const m = c && c.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/);
            if (!m || (m[4] !== undefined && +m[4] < 1)) return;
            const [r, g, b] = [+m[1], +m[2], +m[3]];
            if (Math.max(r, g, b) - Math.min(r, g, b) > 6) return;
            const hex = "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
            (out[hex] ||= new Set()).add(where);
          };
          for (const el of document.querySelectorAll("body *")) {
            const s = getComputedStyle(el);
            if (s.display === "none" || s.visibility === "hidden") continue;
            const tag = el.tagName.toLowerCase();
            const name = el.closest("[data-spot]")?.getAttribute("data-spot") || el.closest("[data-mark]")?.getAttribute("data-mark") || tag;
            add(s.backgroundColor, `bg:${name}`);
            if (el.textContent?.trim() && el.children.length === 0) add(s.color, `text:${name}`);
            if (el instanceof SVGElement) {
              add(s.fill, `fill:${name}`);
              add(s.stroke, `stroke:${name}`);
            }
          }
          return Object.fromEntries(Object.entries(out).map(([k, s]) => [k, [...s].slice(0, 8)]));
        });
        for (const [hex, where] of Object.entries(found)) (seen[hex] ||= new Set()).add(...where.map((w) => `${path} ${w}`));
        await page.close();
      }
      await ctx.close();
      checks.rendered[`${v.key}-${theme}`] = { count: Object.keys(seen).length, greys: Object.fromEntries(Object.entries(seen).sort().map(([k, s]) => [k, [...s].slice(0, 6)])) };
    }
  }
  // Computed colours of the pieces Joshua picked, on the new build.
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await open(ctx, VERSIONS[2], "/components/segmented", theme);
    const track = await page.locator("[data-stage] [role=radiogroup]").first().evaluate((e) => getComputedStyle(e).backgroundColor).catch(() => null);
    await page.close();
    const tg = await open(ctx, VERSIONS[2], "/components/toggle-group", theme);
    const tgTrack = await tg.locator("[data-stage] [role=group]").first().evaluate((e) => getComputedStyle(e).backgroundColor).catch(() => null);
    await tg.close();
    const sw = await open(ctx, VERSIONS[2], "/components/switch", theme);
    const sws = await sw.locator("[data-stage] button[role=switch]").evaluateAll((els) => els.map((e) => ({ state: e.dataset.state, track: getComputedStyle(e).backgroundColor, thumb: getComputedStyle(e.firstElementChild).backgroundColor })));
    await sw.close();
    await ctx.close();
    checks.colours[theme] = { segmentedTrack: track, toggleGroupTrack: tgTrack, switches: sws };
  }
}

await browser.close();
writeFileSync(`${OUT}/checks.json`, JSON.stringify(checks, null, 2));
console.log(JSON.stringify({ errors: checks.errors, missing: checks.missing, rendered: Object.fromEntries(Object.entries(checks.rendered).map(([k, v]) => [k, v.count])), colours: checks.colours }, null, 2));
servers.forEach((s) => s.kill("SIGTERM"));
process.exit(0);
