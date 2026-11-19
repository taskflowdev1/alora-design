// Refine v1 review shots: the new and extended components, their states, the encyclopedia and 15 older components,
// before (BEFORE_DIST) | after (AFTER_DIST) side by side, as R1, R2… in OUT (default output/refine-v1).
// Desktop 1440x900 and phone 390x844, dark and light. ONLY=<regex> matches the file name. Numbers are fixed by the
// list below, so a filtered run keeps them.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const OUT = process.env.OUT || "output/refine-v1";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
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
const VERSIONS = [];
if (process.env.BEFORE_DIST) VERSIONS.push({ key: "before", base: await serve(process.env.BEFORE_DIST, 5185), label: `Before (${process.env.REF || "before"})` });
VERSIONS.push({ key: "after", base: await serve(process.env.AFTER_DIST || "dist", 5186), label: "After" });

const log = { errors: [], missing: [], shots: [] };
const browser = await chromium.launch();
const VP = {
  desk: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const q = (path, theme) => (theme === "light" ? `${path}${path.includes("?") ? "&" : "?"}t=l` : path);
async function open(v, path, theme, vp) {
  const ctx = await browser.newContext(VP[vp]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.errors.push(`${v.key} ${path}: ${e.message}`));
  await page.goto(`${v.base}${q(path, theme)}`, { waitUntil: "networkidle" });
  if (vp === "desk") await page.mouse.move(1430, 890);
  await sleep(400);
  return page;
}
/** The element (padded), or the viewport when target is "viewport". Popovers in <body> are included with `extra`. */
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
  const width = Math.min(vw - x, x1 - x0 + pad * 2);
  if (y1 - y0 + pad * 2 > vh) {
    // Taller than the screen: from the top of the page (so the sticky header sits at the top, not across the element),
    // a full-page clip in page coordinates.
    await page.evaluate(() => scrollTo(0, 0));
    await sleep(300);
    const nb = await l.boundingBox();
    await page.screenshot({ path: file, fullPage: true, clip: { x, y: Math.max(0, nb.y - pad), width, height: nb.height + pad * 2 } });
    return true;
  }
  const y = Math.max(0, y0 - pad);
  await page.screenshot({ path: file, clip: { x, y, width, height: Math.min(vh - y, y1 - y0 + pad * 2) } });
  return true;
}
/** Scrolls the element to the middle of the viewport first (same position in both versions). */
async function center(page, sel) {
  const l = page.locator(sel).first();
  if (await l.count()) await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(300);
}
const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
async function compose(name, title, theme, cols) {
  const dark = theme === "dark";
  const width = 1800;
  const n = cols.length;
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    h1{font-size:15px;font-weight:600;margin:0 0 16px}
    .row{display:flex;gap:24px;align-items:flex-start}
    figure{margin:0;display:grid;gap:8px;min-width:0;flex:1}
    figcaption{font-weight:500}
    img{max-width:100%;max-height:1400px;height:auto;display:block;outline:1px solid ${dark ? "#333" : "#ccc"}}
    .none{height:80px;display:grid;place-items:center;opacity:.6;background:${dark ? "#1a1a1a" : "#e9e9e9"}}
  </style><h1>${title} · ${theme}</h1><div class=row>${cols
    .map((c) => `<figure><figcaption>${c.label}</figcaption>${c.file && existsSync(c.file) ? `<img src="${dataUri(c.file)}">` : `<div class=none>missing</div>`}</figure>`)
    .join("")}</div>`;
  const ctx = await browser.newContext({ viewport: { width: n === 1 ? 1000 : width, height: 120 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await ctx.close();
}

const stage = "[data-stage]";
const pop = "[data-radix-popper-content-wrapper]";
const pw = 'input[autocomplete="new-password"]';
/** One shot: path, viewport, what to do, what to capture. */
const S = (slug, title, path, vp, act, target = stage, opts = {}) => ({ slug, title, path, vp, act, target, opts });
const atStage = async (p) => center(p, stage);
const hoverChart = (frac) => async (p) => {
  await center(p, stage);
  const b = await p.locator(`${stage} svg[role=img]`).first().boundingBox();
  if (b) await p.mouse.move(b.x + b.width * frac, b.y + b.height * 0.4);
  await sleep(400);
};
const typePw = (text, blur) => async (p) => {
  await center(p, stage);
  await p.locator(pw).click();
  if (text) await p.locator(pw).pressSequentially(text, { delay: 20 });
  if (blur) await p.locator(pw).blur();
  await sleep(450);
};
const clickText = async (p, re) => {
  const b = p.getByRole("button", { name: re }).first();
  if (await b.count()) await b.click();
};
const streamAt = (ms) => async (p) => {
  await center(p, stage);
  await clickText(p, /again|write|regenerate/i);
  await sleep(ms);
};

const OPEN = { select: "open", menu: "open", tooltip: "hovered", toast: "shown" };
const LIST = [
  S("citation", "Citation: source 1 open", "/components/citation", "desk", async (p) => {
    await center(p, stage);
    await p.locator('button[aria-label="Source 1"]').first().click();
    await sleep(500);
  }, stage, { extra: [pop] }),
  S("citation", "Citation: source 1 open, phone", "/components/citation", "phone", async (p) => {
    await center(p, stage);
    await p.locator('button[aria-label="Source 1"]').first().tap();
    await sleep(500);
  }, "viewport"),
  S("streaming-rest", "Streaming text: at rest (page load)", "/components/streaming-text", "desk", atStage),
  S("streaming-start", "Streaming text: 150 ms after Write it again (space held)", "/components/streaming-text", "desk", streamAt(150)),
  S("streaming-mid", "Streaming text: 1.2 s in, mid-answer", "/components/streaming-text", "desk", streamAt(1200)),
  S("streaming-start", "Streaming text, 3 lines ahead (answer not known): 150 ms after Write it again", "/components/streaming-text?space=3", "desk", streamAt(150)),
  S("streaming-rest", "Streaming text: at rest, phone", "/components/streaming-text", "phone", atStage, "viewport"),
  S("brush-point", "Linked highlight: pointing at Saturday on the chart", "/components/brush", "desk", hoverChart(0.86)),
  S("brush-row", "Linked highlight: pointing at a table row", "/components/brush", "desk", async (p) => {
    await center(p, stage);
    await p.locator(`${stage} tbody tr`).nth(1).hover();
    await sleep(400);
  }),
  S("brush-point", "Linked highlight: tap on the chart, phone", "/components/brush", "phone", async (p) => {
    await center(p, `${stage} svg[role=img]`);
    const b = await p.locator(`${stage} svg[role=img]`).first().boundingBox();
    if (b) await p.touchscreen.tap(b.x + b.width * 0.5, b.y + b.height * 0.4);
    await sleep(400);
  }, "viewport"),
  S("password-empty", "Password: focused, empty (suggestion offered)", "/components/password-input", "desk", typePw("", false)),
  S("password-typing", "Password: typing “kopi12”, still in the field (no error yet)", "/components/password-input", "desk", typePw("kopi12", false)),
  S("password-left", "Password: “kopi12”, then left the field", "/components/password-input", "desk", typePw("kopi12", true)),
  S("password-common", "Password: typing “password1”, still in the field", "/components/password-input", "desk", typePw("password1", false)),
  S("password-strong", "Password: “Kopi-Tanah-27”, left the field (strong)", "/components/password-input", "desk", typePw("Kopi-Tanah-27", true)),
  S("password-submit", "Password: “kopi12”, then Create account", "/components/password-input", "desk", async (p) => {
    await typePw("kopi12", false)(p);
    await clickText(p, /create account/i);
    await sleep(450);
  }),
  S("password-left", "Password: “kopi12”, then left the field, phone", "/components/password-input", "phone", typePw("kopi12", true), "viewport"),
  S("stepform-1", "Step form: step 1", "/components/step-form", "desk", atStage),
  S("stepform-error", "Step form: Next with no supplier", "/components/step-form", "desk", async (p) => {
    await center(p, stage);
    await clickText(p, /^next$/i);
    await sleep(400);
  }),
  S("stepform-2", "Step form: step 2 (Items)", "/components/step-form", "desk", async (p) => {
    await center(p, stage);
    await p.locator("#po-supplier").fill("Keramik Plered");
    await clickText(p, /^next$/i);
    await sleep(600);
  }),
  S("stepform-2", "Step form: step 2, phone", "/components/step-form", "phone", async (p) => {
    await center(p, stage);
    await p.locator("#po-supplier").fill("Keramik Plered");
    await clickText(p, /^next$/i);
    await sleep(600);
  }, "viewport"),
  S("dial", "Number dial", "/components/number-dial", "desk", atStage),
  S("dial", "Number dial, phone", "/components/number-dial", "phone", atStage, "viewport"),
  S("theme-switch", "Theme switch", "/components/theme-switch", "desk", atStage),
  S("prompts", "Prompt suggestions: first row hovered", "/components/prompt-suggestions", "desk", async (p) => {
    await center(p, stage);
    await p.locator(`${stage} li button`).first().hover();
    await sleep(400);
  }),
  S("proposed", "Proposed change: asking", "/components/proposed-change", "desk", atStage),
  S("proposed-applied", "Proposed change: applied", "/components/proposed-change", "desk", async (p) => {
    await center(p, stage);
    await clickText(p, /^apply$/i);
    await sleep(1300);
  }),
  S("reactions", "Reactions", "/components/reactions", "desk", atStage),
  S("trace", "Trace", "/components/trace", "desk", atStage),
  S("carousel", "Carousel", "/components/carousel", "desk", atStage),
  S("drawer", "Drawer open, phone", "/components/drawer", "phone", async (p) => {
    await center(p, stage);
    await clickText(p, /choose courier/i);
    await sleep(700);
  }, "viewport"),
  S("line-chart", "Line chart: crosshair tooltip", "/components/line-chart", "desk", hoverChart(0.7)),
  S("bento-inputs", "Components page: Inputs group", "/components", "desk", (p) => center(p, "[data-group=Inputs]"), "[data-group=Inputs]", { pad: 8 }),
  S("bento-charts", "Components page: Charts group", "/components", "desk", (p) => center(p, "[data-group=Charts]"), "[data-group=Charts]", { pad: 8 }),
  S("bento-chat", "Components page: Chat group", "/components", "desk", (p) => center(p, "[data-group=Chat]"), "[data-group=Chat]", { pad: 8 }),
  S("encyclopedia", "Encyclopedia, top", "/encyclopedia", "desk", async () => {}, "viewport"),
  S("encyclopedia", "Encyclopedia, top, phone", "/encyclopedia", "phone", async () => {}, "viewport"),
  S("encyclopedia-rule", "Encyclopedia: “Busy buttons keep their width” with its demo open", "/encyclopedia?rule=state.loading-button", "desk", async (p) => {
    await sleep(500);
    await center(p, '[data-rule="state.loading-button"]');
  }, '[data-rule="state.loading-button"] >> xpath=ancestor::h3/..'),
  ...["button", "select", "segmented", "tabs", "switch", "tooltip", "toast", "metric-card", "table", "calendar", "input-otp", "menu", "slider", "toggle-group", "bar-chart"].map((n) =>
    S(
      `old-${n}`,
      `Older component: ${n}${OPEN[n] ? ` (${OPEN[n]})` : ""}`,
      `/components/${n}`,
      "desk",
      async (p) => {
        await center(p, stage);
        const first = p.locator(`${stage} button, ${stage} [role=combobox]`).first();
        if (OPEN[n] === "hovered") await first.hover();
        else if (OPEN[n]) await first.click();
        if (n === "bar-chart") await p.locator(`${stage} [data-bar], ${stage} button`).nth(3).hover().catch(() => {});
        await sleep(600);
      },
      n === "toast" ? "viewport" : stage,
      { extra: [pop, "[role=tooltip]"] },
    ),
  ),
];

let n = 0;
for (const s of LIST) {
  for (const theme of ["dark", "light"]) {
    n++;
    const name = `R${n}-${s.slug}-${s.vp}-${theme}`;
    if (ONLY && !ONLY.test(name)) continue;
    const cols = [];
    for (const v of VERSIONS) {
      const file = `${OUT}/parts/${name}-${v.key}.png`;
      let ok = false;
      try {
        const page = await open(v, s.path, theme, s.vp);
        await s.act(page);
        ok = await shoot(page, s.target, file, s.opts);
        await page.context().close();
      } catch (e) {
        log.errors.push(`${v.key} ${name}: ${e.message.split("\n")[0]}`);
      }
      if (!ok) log.missing.push(`${v.key} ${name}`);
      cols.push({ label: v.label, file: ok ? file : null });
    }
    await compose(name, `R${n} ${s.title} (${s.vp === "desk" ? "1440x900" : "390x844"})`, theme, cols);
    log.shots.push({ name, title: s.title, vp: s.vp, theme });
    console.log(name);
  }
}
writeFileSync(`${OUT}/log.json`, JSON.stringify({ versions: VERSIONS.map(({ key, label }) => ({ key, label })), ...log }, null, 2));
await browser.close();
servers.forEach((s) => s.kill("SIGTERM"));
console.log(`${log.shots.length} shots, ${log.missing.length} missing, ${log.errors.length} errors`);
