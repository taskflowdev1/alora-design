// Inline edit v1 + blue accent review shots. BEFORE_DIST = build of the commit before the change, AFTER_DIST = this tree.
// Inline edit (products table, both themes, before | after): I1 resting, I2 hover, I3 editing price (caret), I4 refused
// value, I5 after save, I6 Tab to the next cell (after only), I7 editing fill vs a 1 px ring (option, not shipped).
// Accent (pink before | blue after): B1 home, B2 button page, B3 settings form, B4 dashboard charts, B5 line chart
// series, B6 encyclopedia + demo, B7 text selection, B8 sand field. OUT_I / OUT_B = folders. ONLY=<regex> by letter.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const OUT_I = process.env.OUT_I || "output/inline-edit-v1";
const OUT_B = process.env.OUT_B || "output/accent-blue";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const want = (l) => !ONLY || ONLY.test(l);
for (const o of [OUT_I, OUT_B]) mkdirSync(`${o}/parts`, { recursive: true });
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
const VERSIONS = [
  { key: "before", base: await serve(process.env.BEFORE_DIST, 5194), label: `Before (${process.env.BEFORE_REF || "previous commit"})` },
  { key: "after", base: await serve(process.env.AFTER_DIST, 5195), label: "After" },
];
const AFTER = VERSIONS[1];

const log = { errors: [], missing: [], notes: [] };
const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);
async function open(v, path, theme, { width = 1440, height = 900, scale = 2 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.errors.push(`${v.key} ${path}: ${e.message}`));
  await page.goto(`${v.base}${q(path, theme)}`, { waitUntil: "networkidle" });
  await page.mouse.move(2, 600);
  await sleep(700);
  return page;
}
const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
async function compose(out, name, title, theme, cols, width = 1600) {
  const dark = theme === "dark";
  // Wide, short table crops stack (readable at full width); page shots sit side by side.
  const n = out === OUT_I ? 1 : Math.min(cols.length, 2);
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0}.wrap{display:inline-block;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    h1{font-size:15px;font-weight:600;margin:0 0 16px}
    .row{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap}
    figure{margin:0;display:grid;gap:8px;min-width:0}
    figcaption{font-weight:500;line-height:1.5}
    img{width:${Math.floor((width - 48 - 24 * (n - 1)) / n)}px;height:auto;display:block;outline:1px solid ${dark ? "#333" : "#ccc"}}
    .none{width:240px;height:80px;display:grid;place-items:center;opacity:.6;background:${dark ? "#1a1a1a" : "#e9e9e9"}}
  </style><div class=wrap><h1>${title} · ${theme}</h1><div class=row>${cols
    .map((c) => `<figure><figcaption>${c.label}</figcaption>${c.file && existsSync(c.file) ? `<img src="${dataUri(c.file)}">` : `<div class=none>missing</div>`}</figure>`)
    .join("")}</div></div>`;
  const ctx = await browser.newContext({ viewport: { width, height: 120 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.locator(".wrap").screenshot({ path: `${out}/${name}.png` });
  await ctx.close();
}
const shots = { [OUT_I]: [], [OUT_B]: [] };
async function pair(out, letter, name, title, theme, shoot, versions = VERSIONS) {
  const cols = [];
  for (const v of versions) {
    const file = `${out}/parts/${name}-${theme}-${v.key}.png`;
    let ok = false;
    try {
      ok = await shoot(v, file);
    } catch (e) {
      log.errors.push(`${v.key} ${name} ${theme}: ${e.message.split("\n")[0]}`);
    }
    if (!ok) log.missing.push(`${v.key} ${name} ${theme}`);
    cols.push({ label: v.label, file: ok ? file : null });
  }
  await compose(out, `${name}-${theme}`, `${letter} ${title}`, theme, cols);
  shots[out].push(`${name}-${theme}.png`);
  console.log(`${name}-${theme}`);
}
const THEMES = ["dark", "light"];

/* ------------------------------------------------------------ inline edit */

// The products table: header + first four rows, Product to Status (the columns that matter), with room above for the
// error tooltip. Caret kept as drawn (shots are taken right after a key press, so it is in its visible phase).
async function tableShot(page, file) {
  const b = await page.evaluate(() => {
    const t = document.querySelector("table");
    const rows = [...t.querySelectorAll("tbody tr")].slice(0, 4);
    const head = t.querySelector("thead");
    const status = head.querySelectorAll("th")[4] ?? head;
    const box = t.getBoundingClientRect();
    const top = head.getBoundingClientRect().top;
    return { x: box.left, y: top, right: status.getBoundingClientRect().right, height: rows.at(-1).getBoundingClientRect().bottom - top };
  });
  await page.screenshot({ path: file, caret: "initial", clip: { x: Math.max(0, b.x - 12), y: Math.max(0, b.y - 40), width: b.right + 24 - b.x, height: b.height + 46 } });
  return true;
}
const priceCell = (page, n = 1) => page.locator("tbody tr").nth(n).locator("td").nth(2).locator("button, [data-inline-edit]").first();
async function products(v, theme) {
  const page = await open(v, "/examples/products", theme);
  await page.evaluate(() => document.querySelector("table").scrollIntoView({ block: "center" }));
  await sleep(300);
  return page;
}
async function clickPrice(page) {
  const cell = priceCell(page);
  const b = await cell.boundingBox();
  // On the last digits, the way a person aims at a number.
  await page.mouse.click(b.x + b.width - 14, b.y + b.height / 2);
  await sleep(250);
}
const input = (page) => page.locator("tbody tr").nth(1).locator("input").first();
async function retype(page, text) {
  await input(page).press("ControlOrMeta+a");
  await input(page).pressSequentially(text, { delay: 30 });
}
const done = async (page, file) => {
  const ok = await tableShot(page, file);
  await page.context().close();
  return ok;
};

for (const theme of THEMES) {
  if (want("I1")) await pair(OUT_I, "I1", "I1-resting", "Resting", theme, async (v, f) => done(await products(v, theme), f));
  if (want("I2"))
    await pair(OUT_I, "I2", "I2-hover", "Hover on the price (row 2): pencil, row fill, thumbnail", theme, async (v, f) => {
      const p = await products(v, theme);
      await priceCell(p).hover();
      await sleep(400);
      return done(p, f);
    });
  if (want("I3"))
    await pair(OUT_I, "I3", "I3-editing", "Clicked the price: editing, caret where clicked", theme, async (v, f) => {
      const p = await products(v, theme);
      await clickPrice(p);
      // Leave the selection as the click made it (before: all selected; after: caret). A no-op key resets the blink.
      await p.keyboard.press("Shift");
      return done(p, f);
    });
  if (want("I4"))
    await pair(OUT_I, "I4", "I4-refused", "Typed 12a, pressed Enter: refused with its message", theme, async (v, f) => {
      const p = await products(v, theme);
      await clickPrice(p);
      await retype(p, "12a");
      await input(p).press("Enter");
      await sleep(500);
      return done(p, f);
    });
  if (want("I5"))
    await pair(OUT_I, "I5", "I5-saved", "Typed 105000, pressed Enter (shot 250 ms after)", theme, async (v, f) => {
      const p = await products(v, theme);
      await clickPrice(p);
      await retype(p, "105000");
      await input(p).press("Enter");
      await sleep(250);
      await p.mouse.move(2, 600);
      return done(p, f);
    });
  if (want("I6"))
    await pair(
      OUT_I,
      "I6",
      "I6-tab",
      "Typed 105000 in the price, pressed Tab: saved, stock now editing",
      theme,
      async (v, f) => {
        const p = await products(v, theme);
        await clickPrice(p);
        await retype(p, "105000");
        await p.keyboard.press("Tab");
        await sleep(250);
        await p.keyboard.press("Shift");
        return done(p, f);
      },
      [AFTER],
    );
  if (want("I7"))
    await pair(
      OUT_I,
      "I7",
      "I7-ring-option",
      "Editing state: soft fill (shipped, house rule) vs a 1 px ink ring on the surface (option, not shipped)",
      theme,
      async (v, f) => {
        const p = await products(AFTER, theme);
        if (v.key === "ring")
          await p.addStyleTag({ content: "[data-inline-edit][data-editing]{background:var(--ad-surface)!important;box-shadow:inset 0 0 0 1px var(--ad-ink-muted)}" });
        await clickPrice(p);
        await p.keyboard.press("Shift");
        return done(p, f);
      },
      [
        { key: "fill", label: "Shipped: field focus fill" },
        { key: "ring", label: "Option: 1 px ring on the surface" },
      ],
    );
}

/* ------------------------------------------------------------ accent */

const BV = [
  { ...VERSIONS[0], label: "Before: pink #dc467d" },
  { ...VERSIONS[1], label: "After: blue #3c6fe0" },
];
async function viewShot(page, file, selector) {
  if (selector) {
    const l = page.locator(selector).first();
    await l.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.evaluate(() => scrollBy(0, -80));
    await sleep(500);
  }
  await page.screenshot({ path: file });
  await page.context().close();
  return true;
}
const view = { width: 1440, height: 900, scale: 1 };
for (const theme of THEMES) {
  if (want("B1")) await pair(OUT_B, "B1", "B1-home", "Home", theme, async (v, f) => viewShot(await open(v, "/", theme, view), f), BV);
  if (want("B2")) await pair(OUT_B, "B2", "B2-button", "Components: Button", theme, async (v, f) => viewShot(await open(v, "/components/button", theme, view), f), BV);
  if (want("B3")) await pair(OUT_B, "B3", "B3-settings", "Example: Settings (forms)", theme, async (v, f) => viewShot(await open(v, "/examples/settings", theme, view), f), BV);
  if (want("B4")) await pair(OUT_B, "B4", "B4-dashboard", "Example: Dashboard (charts)", theme, async (v, f) => viewShot(await open(v, "/examples/dashboard", theme, view), f), BV);
  if (want("B5")) await pair(OUT_B, "B5", "B5-line-chart", "Components: Line chart (series)", theme, async (v, f) => viewShot(await open(v, "/components/line-chart", theme, view), f), BV);
  if (want("B6"))
    await pair(OUT_B, "B6", "B6-encyclopedia", "Encyclopedia, a rule open with its demo", theme, async (v, f) => {
      const p = await open(v, "/encyclopedia?q=press", theme, view);
      await p.locator('[data-rule="motion.press-scale"]').click();
      await sleep(500);
      return viewShot(p, f);
    }, BV);
  if (want("B7"))
    await pair(OUT_B, "B7", "B7-selection", "Text selection (::selection): a rule's text selected", theme, async (v, f) => {
      const p = await open(v, "/encyclopedia?q=press", theme, view);
      await p.locator('[data-rule="motion.press-scale"]').click();
      await sleep(500);
      await p.evaluate(() => {
        const body = document.querySelector('[data-rule="motion.press-scale"]').closest("h3").parentElement;
        const ps = [...body.querySelectorAll("p")];
        const r = document.createRange();
        r.setStart(ps[0] ?? body, 0);
        r.setEnd(ps.at(-1) ?? body, (ps.at(-1) ?? body).childNodes.length);
        getSelection().removeAllRanges();
        getSelection().addRange(r);
      });
      await sleep(200);
      return viewShot(p, f);
    }, BV);
  if (want("B8"))
    await pair(OUT_B, "B8", "B8-sand-field", "Backgrounds: Sand field", theme, async (v, f) => {
      const p = await open(v, "/backgrounds/sand-field", theme, view);
      await p.mouse.move(700, 400, { steps: 8 });
      await sleep(900);
      return viewShot(p, f);
    }, BV);
}

for (const out of [OUT_I, OUT_B]) writeFileSync(`${out}/log.json`, JSON.stringify({ versions: VERSIONS.map(({ key, label }) => ({ key, label })), shots: shots[out], ...log }, null, 2));
await browser.close();
servers.forEach((s) => s.kill("SIGTERM"));
console.log(`${shots[OUT_I].length + shots[OUT_B].length} shots, ${log.missing.length} missing, ${log.errors.length} page errors`);
if (log.missing.length || log.errors.length) console.log(JSON.stringify(log, null, 2));
