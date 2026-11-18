// v5.1 review shots: selected / on states in three versions (original e449e2c, v5 6d4be3a, new), light and dark.
// WORK = folder holding dist-e449e2c, dist-6d4be3a, dist-new (scripts/review-v5.1-shots builds them).
// OUT = folder (default output/review-v5.1). ONLY=<regex> limits by letter.
//   S side by side per component   K Kemang settings card   W switch options (A, B live, C)   R shadcn reference
//   L layout: item boxes before and after a selection change (no shift)
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const WORK = process.env.WORK;
const OUT = process.env.OUT || "output/review-v5.1";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const want = (l) => !ONLY || ONLY.test(l);
mkdirSync(`${OUT}/parts`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VERSIONS = [
  { key: "e449e2c", label: "Original (e449e2c)", port: 5181 },
  { key: "6d4be3a", label: "v5 (6d4be3a)", port: 5182 },
  { key: "new", label: "New", port: 5183 },
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

const checks = { errors: [], missing: [], shift: [] };
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

// What each side-by-side shows: a gallery stage (optionally after an action) or the Kemang card.
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
  ["S06", "multi-select", null],
  ["S07", "tag-input", null],
  ["S08", "reactions", null, "/components/comment-thread"],
  ["S09", "switch", null],
  ["S10", "toggle", null],
  ["S11", "pagination", null],
];

const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
async function compose(name, title, theme, cols) {
  const dark = theme === "dark";
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    h1{font-size:15px;font-weight:600;margin:0 0 16px}
    .row{display:flex;gap:24px;align-items:flex-start}
    figure{margin:0;display:grid;gap:8px;min-width:0}
    figcaption{font-weight:500}
    img{max-width:${Math.floor(1360 / cols.length)}px;height:auto;display:block;border-radius:8px}
    .none{width:240px;height:80px;display:grid;place-items:center;opacity:.6;border-radius:8px;background:${dark ? "#1a1a1a" : "#e9e9e9"}}
  </style><h1>${title} · ${theme}</h1><div class=row>${cols
    .map((c) => `<figure><figcaption>${c.label}</figcaption>${c.file && existsSync(c.file) ? `<img src="${dataUri(c.file)}">` : `<div class=none>not in this version</div>`}</figure>`)
    .join("")}</div>`;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 120 }, deviceScaleFactor: 1 });
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

// W: switch options on the new build, as token overrides on the Kemang card and the switch stage.
const SWITCH = {
  A: { label: "A · ink track, inverted thumb (shadcn)", css: "--ad-switch-on: var(--ad-on) !important; --ad-switch-thumb: var(--ad-on-ink) !important;" },
  B: { label: "B · accent track, white thumb (Apple, Radix, M3) · live", css: "" },
  C: { label: "C · neutral: ink track in light, mid grey in dark, white thumb", css: { light: "--ad-switch-on: var(--ad-on) !important;", dark: "--ad-switch-on: #868686 !important;" } },
};
if (want("W")) {
  const v = VERSIONS[2];
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    for (const [k, o] of Object.entries(SWITCH)) {
      const css = typeof o.css === "string" ? o.css : o.css[theme];
      for (const [path, name, loc] of [["/", "kemang", kemang], ["/components/switch", "switch", (p) => p.locator("[data-stage] > *").first()]]) {
        const page = await open(ctx, v, path, theme);
        if (css) await page.addStyleTag({ content: `:root, body, #root, body * { ${css} }` });
        await sleep(300);
        await clip(page, loc(page), `${OUT}/parts/W-${name}-${theme}-${k}.png`, name === "kemang" ? 12 : 20);
        await page.close();
      }
    }
    await ctx.close();
    for (const name of ["kemang", "switch"]) {
      await compose(`W-switch-options-${name}-${theme}`, `Switch options (${name})`, theme, Object.entries(SWITCH).map(([k, o]) => ({ label: o.label, file: `${OUT}/parts/W-${name}-${theme}-${k}.png` })));
    }
  }
}

// R: the shadcn/ui equivalents, drawn from their source classes and the v4 neutral theme values.
if (want("R")) {
  const T = {
    light: { bg: "#ffffff", fg: "#0a0a0a", muted: "#f5f5f5", mutedFg: "#737373", input: "#e5e5e5", primary: "#171717", primaryFg: "#fafafa", accent: "#f5f5f5", sel: "#ffffff", selBorder: "transparent", tabFg: "rgba(10,10,10,.6)", swOff: "#e5e5e5", thumbOff: "#ffffff", thumbOn: "#ffffff" },
    dark: { bg: "#0a0a0a", fg: "#fafafa", muted: "#262626", mutedFg: "#a1a1a1", input: "rgba(255,255,255,.15)", primary: "#e5e5e5", primaryFg: "#171717", accent: "#262626", sel: "rgba(255,255,255,.045)", selBorder: "rgba(255,255,255,.15)", tabFg: "#a1a1a1", swOff: "rgba(255,255,255,.12)", thumbOff: "#fafafa", thumbOn: "#171717" },
  };
  for (const theme of ["light", "dark"]) {
    const t = T[theme];
    const html = `<!doctype html><meta charset=utf-8><style>
      body{margin:0;padding:24px;background:${t.bg};color:${t.fg};font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
      h2{font-size:13px;font-weight:500;color:${t.mutedFg};margin:20px 0 8px}
      .list{display:inline-flex;height:36px;padding:3px;border-radius:10px;background:${t.muted};box-sizing:border-box}
      .tab{display:inline-flex;align-items:center;padding:4px 8px;border-radius:8px;border:1px solid transparent;font-weight:500;color:${t.tabFg}}
      .tab.on{background:${t.sel};color:${t.fg};border-color:${t.selBorder};${theme === "light" ? "box-shadow:0 1px 3px 0 rgb(0 0 0/.1),0 1px 2px -1px rgb(0 0 0/.1);" : ""}}
      .tg{display:inline-flex;gap:0}
      .tgi{height:36px;padding:0 10px;display:inline-flex;align-items:center;border-radius:8px;font-weight:500;color:${t.fg}}
      .tgi.on{background:${t.accent}}
      .tgo .tgi{border:1px solid ${t.input};margin-left:-1px;border-radius:0;box-shadow:0 1px 2px 0 rgb(0 0 0/.05)}
      .tgo .tgi:first-child{border-radius:8px 0 0 8px}.tgo .tgi:last-child{border-radius:0 8px 8px 0}
      .sw{display:inline-flex;align-items:center;width:32px;height:18.4px;border-radius:99px;border:1px solid transparent;background:${t.swOff};box-sizing:border-box;vertical-align:middle}
      .sw i{display:block;width:16px;height:16px;border-radius:99px;background:${t.thumbOff}}
      .sw.on{background:${t.primary}}.sw.on i{background:${t.thumbOn};transform:translateX(14px)}
      .badge{display:inline-flex;align-items:center;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:500;margin-right:6px}
      .b1{background:${t.primary};color:${t.primaryFg}}.b2{background:${t.muted};color:${t.fg}}.b3{border:1px solid ${t.input}}
      .row{display:flex;gap:16px;align-items:center}
    </style>
    <h2>Tabs (default)</h2><div class=list><span class="tab on">Today</span><span class=tab>Week</span><span class=tab>Month</span></div>
    <h2>Toggle group (default · outline), Bold and Italic on</h2><div class=row><div class=tg><span class="tgi on">Bold</span><span class="tgi on">Italic</span><span class=tgi>Underline</span></div>
    <div class="tg tgo"><span class="tgi on">Bold</span><span class="tgi on">Italic</span><span class=tgi>Underline</span></div></div>
    <h2>Switch (off · on)</h2><div class=row><span class=sw><i></i></span><span class="sw on"><i></i></span></div>
    <h2>Badge (default · secondary · outline)</h2><div><span class="badge b1">Paid</span><span class="badge b2">To pack</span><span class="badge b3">Shipped</span></div>`;
    const ctx = await browser.newContext({ viewport: { width: 520, height: 300 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.screenshot({ path: `${OUT}/R-shadcn-${theme}.png`, fullPage: true });
    await ctx.close();
  }
}

// L: every item keeps its box when the selection moves (borders-don't-move rule), on the new build.
if (want("L")) {
  const v = VERSIONS[2];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const cases = [
    ["segmented", "[data-stage] [role=radiogroup] [role=radio]"],
    ["toggle-group", "[data-stage] button[data-state]"],
    ["tabs", "[data-stage] [role=tablist] [role=tab]"],
    ["status", "[data-stage] button:not([aria-label])"],
    ["toggle", "[data-stage] button[aria-pressed]"],
  ];
  for (const [name, sel] of cases) {
    const page = await open(ctx, v, `/components/${name}`, "dark");
    const boxes = () => page.$$eval(sel, (els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x * 10) / 10, Math.round(r.width * 10) / 10]; }));
    const before = await boxes();
    if (before.length < 2) {
      checks.shift.push({ name, note: `only ${before.length} items found` });
      continue;
    }
    // Click the last item, then the first, and compare every box with the start.
    const items = page.locator(sel);
    await items.nth(before.length - 1).click();
    await sleep(350);
    const mid = await boxes();
    await items.nth(0).click();
    await sleep(350);
    const after = await boxes();
    const same = (a) => JSON.stringify(a) === JSON.stringify(before);
    checks.shift.push({ name, items: before.length, stable: same(mid) && same(after), ...(same(mid) && same(after) ? {} : { before, mid, after }) });
    await page.close();
  }
  await ctx.close();
}

await browser.close();
writeFileSync(`${OUT}/checks.json`, JSON.stringify(checks, null, 2));
console.log(JSON.stringify(checks, null, 2));
servers.forEach((s) => s.kill("SIGTERM"));
process.exit(0);
