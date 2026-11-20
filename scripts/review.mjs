// Before/after review sheets: for each shot in a list, the same page, viewport, theme and state in two builds,
// stacked (before above after) into OUT/<P><n>-<slug>.png, with the parts in OUT/parts and a log.json.
// Run through scripts/review, which builds both versions. Here:
//   BEFORE_DIST, AFTER_DIST   the two builds        REF   label for the before build
//   OUT                       output folder         ONLY  regex on the sheet name; numbering follows the full list
//   REVIEW_PORT               first of two preview ports (default 5331)
// The shot list is a module (keep it out of git, next to its output): `export default (h) => [h.S(...), ...]`,
// optionally `export const prefix = "R"`. `h` holds S, the selectors (stage, pop, phone) and the actions below.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const LIST_FILE = process.argv[2];
if (!LIST_FILE) throw new Error("usage: node scripts/review.mjs <shots.mjs>  (see the header)");
const OUT = process.env.OUT || "output/review";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const PORT = Number(process.env.REVIEW_PORT) || 5331;
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
    if (i > 80) throw new Error(`preview on ${port} did not start`);
    await sleep(250);
  }
}
process.on("exit", () => servers.forEach((s) => s.kill("SIGTERM")));
const VERSIONS = [
  { key: "before", base: await serve(process.env.BEFORE_DIST, PORT), label: `Before (${process.env.REF || "before"})` },
  { key: "after", base: await serve(process.env.AFTER_DIST, PORT + 1), label: "After" },
];

const log = { errors: [], missing: [], shots: [] };
const browser = await chromium.launch();
const VP = {
  desk: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  desk1024: { viewport: { width: 1024, height: 800 }, deviceScaleFactor: 2 },
  // Component pages that show a framed phone: tall enough for the whole phone, shot on the phone's screen.
  deskTall: { viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);
async function open(v, path, theme, vp) {
  const ctx = await browser.newContext(VP[vp]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.errors.push(`${v.key} ${path}: ${e.message}`));
  await page.goto(`${v.base}${q(path, theme)}`, { waitUntil: "networkidle" });
  await sleep(500);
  return page;
}
/** The element (padded) plus any `extra` popovers, or the viewport when target is "viewport". */
async function shoot(page, target, file, { pad = 16, extra = [] } = {}) {
  if (target === "viewport") return (await page.screenshot({ path: file }), true);
  const l = page.locator(target).first();
  if (!(await l.count())) return false;
  const b = await l.boundingBox();
  if (!b) return false;
  let [x0, y0, x1, y1] = [b.x, b.y, b.x + b.width, b.y + b.height];
  for (const sel of extra) {
    const e = page.locator(sel).first();
    const eb = (await e.count()) ? await e.boundingBox() : null;
    if (eb) [x0, y0, x1, y1] = [Math.min(x0, eb.x), Math.min(y0, eb.y), Math.max(x1, eb.x + eb.width), Math.max(y1, eb.y + eb.height)];
  }
  const { width: vw, height: vh } = page.viewportSize();
  const x = Math.max(0, x0 - pad);
  const y = Math.max(0, y0 - pad);
  await page.screenshot({ path: file, clip: { x, y, width: Math.min(vw - x, x1 - x0 + pad * 2), height: Math.min(vh - y, y1 - y0 + pad * 2) } });
  return true;
}
async function center(page, sel) {
  const l = page.locator(sel).first();
  if (await l.count()) await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(300);
}
/** Keyboard focus on `sel`: focus it, Shift+Tab off and Tab back, so it holds focus by keyboard (:focus-visible). */
async function tabTo(page, sel) {
  await center(page, sel);
  await page.mouse.move(2, 600);
  await page.locator(sel).first().focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await sleep(350);
  const ok = await page.evaluate((s) => !!document.activeElement?.matches(s) && document.activeElement.matches(":focus-visible"), sel);
  if (!ok) throw new Error(`keyboard focus did not land on ${sel}`);
}
const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
/** Before above after, each at its CSS size (shots are 2x, the sheet is 2x). */
async function compose(name, title, theme, rows) {
  const dark = theme === "dark";
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;width:max-content;min-width:600px}
    h1{font-size:16px;font-weight:600;margin:0 0 16px}
    figure{margin:0 0 24px;display:grid;gap:8px}
    figcaption{font-weight:600}
    img{display:block;outline:1px solid ${dark ? "#333" : "#ccc"}}
    .none{height:80px;width:400px;display:grid;place-items:center;opacity:.6;background:${dark ? "#1a1a1a" : "#e9e9e9"}}
  </style><h1>${title}</h1>${rows
    .map((c) => `<figure><figcaption>${c.label}</figcaption>${c.file && existsSync(c.file) ? `<img src="${dataUri(c.file)}" onload="this.width=this.naturalWidth/2">` : `<div class=none>missing</div>`}</figure>`)
    .join("")}`;
  const ctx = await browser.newContext({ viewport: { width: 800, height: 200 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = r))))));
  await page.evaluate(() => [...document.images].forEach((i) => (i.width = i.naturalWidth / 2)));
  const w = await page.evaluate(() => Math.ceil(document.body.getBoundingClientRect().width + 48));
  await page.setViewportSize({ width: w, height: 200 });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await ctx.close();
}

const stage = "[data-stage]";
const helpers = {
  stage,
  pop: "[data-radix-popper-content-wrapper]",
  phone: "[data-phone-screen]",
  sleep,
  center,
  tabTo,
  /** One shot: target is a selector (shot padded, plus opts.extra pop-ups) or "viewport". vp: desk, desk1024, deskTall, phone. */
  S: (slug, title, path, vp, theme, act, target = stage, opts = {}) => ({ slug, title, path, vp, theme, act, target, opts }),
  none: async () => {},
  atStage: (p) => center(p, stage),
  clickIn: (sel, wait = 600) => async (p) => {
    await center(p, stage);
    await p.locator(sel).first().click();
    await p.mouse.move(2, 600);
    await sleep(wait);
  },
};
const mod = await import(pathToFileURL(resolve(LIST_FILE)).href);
const LIST = mod.default(helpers);
const PREFIX = mod.prefix ?? "R";

let n = 0;
for (const s of LIST) {
  n++;
  const name = `${PREFIX}${n}-${s.slug}`;
  if (ONLY && !ONLY.test(name)) continue;
  const rows = [];
  for (const v of VERSIONS) {
    const file = `${OUT}/parts/${name}-${v.key}.png`;
    let ok = false;
    try {
      const page = await open(v, s.path, s.theme, s.vp);
      await s.act(page);
      ok = await shoot(page, s.target, file, s.opts);
      // An action can leave a press held for the shot (a finger down on a scrubber) and release it here.
      if (page.__release) await page.__release();
      await page.context().close();
    } catch (e) {
      log.errors.push(`${v.key} ${name}: ${e.message.split("\n")[0]}`);
    }
    if (!ok) log.missing.push(`${v.key} ${name}`);
    rows.push({ label: v.label, file: ok ? file : null });
  }
  const size = VP[s.vp].viewport;
  await compose(name, `${PREFIX}${n} ${s.title} · ${size.width}×${size.height} · ${s.theme}`, s.theme, rows);
  log.shots.push({ name, title: s.title, vp: s.vp, theme: s.theme });
  console.log(name);
}
writeFileSync(`${OUT}/log.json`, JSON.stringify({ versions: VERSIONS.map(({ key, label }) => ({ key, label })), ...log }, null, 2));
await browser.close();
servers.forEach((s) => s.kill("SIGTERM"));
console.log(`${log.shots.length} shots, ${log.missing.length} missing, ${log.errors.length} errors`);
