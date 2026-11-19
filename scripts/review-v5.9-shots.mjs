// v5.9 review shots: the order-desk tile (was the word-processor tile) and Scale metric cards for short counts.
// BEFORE = base URL of the old version (default the live site); DIST = the new build (default dist). OUT = folder
// (default output/review-v5.9). ONLY=<regex> limits by letter.
//   A the Navigation tile, live vs order desk   B /components Charts: the two short-count metric cards
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const BEFORE = process.env.BEFORE || "https://design.alorawork.com";
const DIST = process.env.DIST || "dist";
const OUT = process.env.OUT || "output/review-v5.9";
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

const tag = (page) =>
  page.evaluate(() => {
    const m = [...document.querySelectorAll("[data-spot=menubar]")].find((e) => e.closest("[data-landing=more]"));
    m?.closest("[class*='rounded-card']")?.setAttribute("data-shot", "nav");
  });
const shootNav = async (v, theme, file, menu) => {
  const page = await open(v, "/", theme);
  await tag(page);
  await page.locator("[data-shot=nav]").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(300);
  const b = await page.locator("[data-shot=nav]").boundingBox();
  if (menu) {
    await page.locator("[data-shot=nav] [role=menubar] button", { hasText: menu }).first().click();
    await sleep(500);
  }
  await page.screenshot({ path: file, clip: { x: b.x - 24, y: b.y - 24, width: b.width + 48, height: b.height + (menu ? 140 : 48) } });
  await page.context().close();
  return true;
};
for (const theme of THEMES) {
  if (want("A")) await pair("A", "A-nav", "Navigation tile: word processor (live) | order desk", theme, (v, file) => shootNav(v, theme, file));
  if (want("B"))
    await pair("B", "B-metrics", "Components page: Orders and Cancelled metric cards (A Tile live | B Scale)", theme, async (v, file) => {
      const page = await open(v, "/components", theme, 1440, 2);
      const m = page.locator("[data-spot=metric-card]").first();
      await m.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await sleep(400);
      const b = await m.boundingBox();
      await page.screenshot({ path: file, clip: { x: b.x - 24, y: b.y - 24, width: b.width + 48, height: b.height + 48 } });
      await page.context().close();
      return true;
    });
}

writeFileSync(`${OUT}/log.json`, JSON.stringify({ versions: VERSIONS.map(({ key, label }) => ({ key, label })), shots, ...log }, null, 2));
await browser.close();
server.kill("SIGTERM");
console.log(`${shots.length} shots, ${log.missing.length} missing, ${log.errors.length} page errors`);
