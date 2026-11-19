// v6.0 review shots: the one-time code refined: centred, checking wave, wrong-code shake, locked, success.
// BEFORE = base URL of the old version (default the live site); DIST = the new build (default dist). OUT = folder
// (default output/review-v6.0). ONLY=<regex> limits by letter.
//   A loaded   B typing   C checking   D wrong   E locked (3 wrong)   F correct   G phone 390   H component page states   V video
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const BEFORE = process.env.BEFORE || "https://design.alorawork.com";
const DIST = process.env.DIST || "dist";
const OUT = process.env.OUT || "output/review-v6.0";
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
// The element, padded, from the full page (positions are in page coordinates).
async function clip(page, selector, file, pad = 16) {
  const l = page.locator(selector).first();
  if (!(await l.count())) return false;
  await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(400);
  const b = await l.boundingBox();
  if (!b) return false;
  const { width: vw, height: vh } = page.viewportSize();
  const x = Math.max(0, b.x - pad);
  const width = Math.min(vw - x, b.width + pad * 2);
  // In the viewport when it fits, so inner and page scrollbars are drawn as a person sees them; a full-page shot
  // grows the viewport and drops them.
  if (b.height + pad * 2 <= vh) {
    const y = Math.max(0, b.y - pad);
    await page.screenshot({ path: file, clip: { x, y, width, height: Math.min(vh - y, b.height + pad * 2) } });
  } else {
    // From the top, so the sticky header sits where it belongs and not across the element.
    await page.evaluate(() => scrollTo(0, 0));
    await sleep(200);
    const top = 0;
    const box = await l.boundingBox();
    b.y = box.y;
    await page.screenshot({ path: file, fullPage: true, clip: { x, y: Math.max(0, b.y + top - pad), width, height: b.height + pad * 2 } });
  }
  return true;
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
    const h = [...document.querySelectorAll("h3")].find((e) => e.textContent === "Open the Kemang till");
    h?.closest("[class*='rounded-card']")?.setAttribute("data-shot", "till");
  });
const AFTER = VERSIONS.find((v) => v.key === "after");
async function only(letter, name, title, theme, shoot) {
  const file = `${OUT}/parts/${name}-${theme}-after.png`;
  const ok = await shoot(AFTER, file);
  if (!ok) log.missing.push(`after ${name} ${theme}`);
  await compose(`${name}-${theme}`, `${letter} ${title}`, theme, [{ label: AFTER.label, file: ok ? file : null }]);
  shots.push(`${name}-${theme}.png`);
  console.log(`${name}-${theme}`);
}
const at = async (v, theme, act, width = 1440) => {
  const page = await open(v, "/", theme, width);
  await tag(page);
  await page.locator("[data-shot=till]").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(300);
  await act?.(page);
  return page;
};
const snap = async (page, file) => {
  const ok = await clip(page, "[data-shot=till]", file, 24);
  await page.context().close();
  return ok;
};
const code = (p) => p.locator("[data-shot=till] input[autocomplete=one-time-code]");
const type = async (p, digits) => {
  await code(p).click();
  await code(p).pressSequentially(digits, { delay: 40 });
};
const wa = (p) => p.getByRole("button", { name: /Fill the code from WhatsApp/ });

for (const theme of THEMES) {
  if (want("A")) await pair("A", "A-loaded", "As loaded", theme, async (v, file) => snap(await at(v, theme), file));
  if (want("B")) await only("B", "B-typing", "Typing (two digits in, caret in the third box)", theme, async (v, file) => snap(await at(v, theme, (p) => type(p, "48")), file));
  if (want("C")) await only("C", "C-checking", "Checking (wave across the boxes)", theme, async (v, file) => snap(await at(v, theme, async (p) => (await wa(p).click(), await sleep(60))), file));
  if (want("D"))
    await pair("D", "D-wrong", "Wrong code (111111)", theme, async (v, file) => snap(await at(v, theme, async (p) => (await type(p, "111111"), await sleep(1000))), file));
  if (want("E"))
    await only("E", "E-locked", "Three wrong codes: locked until a new code", theme, async (v, file) =>
      snap(
        await at(v, theme, async (p) => {
          for (let i = 0; i < 3; i++) {
            await type(p, "111111");
            await sleep(2000);
          }
        }),
        file,
      ),
    );
  if (want("F")) await pair("F", "F-correct", "Correct code (tapped the WhatsApp message)", theme, async (v, file) => snap(await at(v, theme, async (p) => (await wa(p).click(), await sleep(1300))), file));
  if (want("G"))
    await only("G", "G-phone", "Phone 390, correct code", theme, async (v, file) => snap(await at(v, theme, async (p) => (await wa(p).click(), await sleep(1300)), 390), file));
  if (want("H"))
    for (const st of ["live", "checking", "wrong", "open"])
      await only("H", `H-page-${st}`, `/components/input-otp, State ${st}`, theme, async (v, file) => {
        const page = await open(v, `/components/input-otp?state=${st}`, theme, 1440, 2);
        await sleep(st === "open" ? 700 : 300);
        const ok = await clip(page, "[data-stage]", file, 0);
        await page.context().close();
        return ok;
      });
}

// A short video: a wrong code, then the right one from the WhatsApp message.
if (want("V")) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: `${OUT}/video`, size: { width: 1440, height: 900 } } });
  const page = await ctx.newPage();
  await page.goto(`${AFTER.base}/`, { waitUntil: "networkidle" });
  await tag(page);
  await page.locator("[data-shot=till]").evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(800);
  await type(page, "111111");
  await sleep(2200);
  await type(page, "4821");
  await sleep(600);
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await sleep(400);
  await wa(page).click();
  await sleep(2200);
  const b = await page.locator("[data-shot=till]").boundingBox();
  writeFileSync(`${OUT}/video/box.json`, JSON.stringify(b));
  await ctx.close();
  console.log("video");
}

writeFileSync(`${OUT}/log.json`, JSON.stringify({ versions: VERSIONS.map(({ key, label }) => ({ key, label })), shots, ...log }, null, 2));
await browser.close();
server.kill("SIGTERM");
console.log(`${shots.length} shots, ${log.missing.length} missing, ${log.errors.length} page errors`);
