// Sliding pill proof. BEFORE_DIST / AFTER_DIST = the proof page (scripts/sliding-proof) built from BEFORE_REF and from
// this tree. Writes into OUT (output/sliding-v1):
//   before.html, after.html  each build inlined into one file
//   sliding.html             both side by side, playable (open it in a browser and click)
//   S1…  stills, before | after: S1 statement hover on PDF (dark, light), S2–S6 filmstrips after a click (statement,
//        stock, view, pages, sidebar), S7 first paint, S8 right to left, S9 reduced motion, S10 keyboard, S11 narrow
//   checks.json  measured: the pill lands on the choice, passes through between, starts in place, snaps when it should
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const OUT = process.env.OUT || "output/sliding-v1";
mkdirSync(`${OUT}/parts`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One self-contained HTML per build: scripts and styles inlined. */
function inline(dist) {
  let html = readFileSync(`${dist}/index.html`, "utf8");
  const assets = readdirSync(`${dist}/assets`);
  html = html.replace(/<script type="module" crossorigin src="\.\/assets\/([^"]+)"><\/script>/g, (_, f) => `<script type="module">${readFileSync(`${dist}/assets/${f}`, "utf8").replace(/<\/script/gi, "<\\/script")}</script>`);
  html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/assets\/([^"]+)">/g, (_, f) => `<style>${readFileSync(`${dist}/assets/${f}`, "utf8")}</style>`);
  if (/assets\//.test(html)) throw new Error(`unresolved asset in ${dist}: ${assets.join(", ")}`);
  // Tell a parent frame how tall the page is, so the side-by-side page needs no inner scroll.
  return html.replace("</body>", `<script>const post=()=>parent!==window&&parent.postMessage({h:document.documentElement.scrollHeight},"*");addEventListener("load",post);new ResizeObserver(post).observe(document.documentElement);</script></body>`);
}
const VERSIONS = [
  { key: "before", label: `Before (${process.env.BEFORE_REF || "previous"})`, html: inline(process.env.BEFORE_DIST) },
  { key: "after", label: "After", html: inline(process.env.AFTER_DIST) },
];
for (const v of VERSIONS) writeFileSync(`${OUT}/${v.key}.html`, v.html);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
writeFileSync(
  `${OUT}/sliding.html`,
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sliding pickers</title>
<style>:root{color-scheme:dark}body{margin:0;background:#0d0d0d;color:#eee;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,560px),1fr));gap:16px;padding:16px}
h1{font-size:15px;font-weight:600;margin:16px 16px 0}h2{font-size:14px;font-weight:600;margin:0 0 8px}
iframe{width:100%;height:1600px;border:0;border-radius:16px;background:#111}</style>
<h1>Sliding pickers: click any option, left is before, right is after</h1>
<div class="cols">${VERSIONS.map((v) => `<section><h2>${v.label}</h2><iframe id="f-${v.key}" title="${v.label}" srcdoc="${esc(v.html)}"></iframe></section>`).join("")}</div>
<script>addEventListener("message",(e)=>{const f=[...document.querySelectorAll("iframe")].find((x)=>x.contentWindow===e.source);if(f&&e.data&&e.data.h)f.style.height=e.data.h+"px"});</script></html>`,
);

const log = { errors: [], checks: [] };
const check = (ok, name, detail) => (log.checks.push({ ok: !!ok, name, detail }), console.log(`${ok ? "ok  " : "FAIL"} ${name} ${JSON.stringify(detail)}`));
const browser = await chromium.launch();
const file = (v) => `file://${process.cwd()}/${OUT}/${v.key}.html`;

async function open(v, { width = 900, height = 1700, clock = false, reduced = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.errors.push(`${v.key}: ${e.message}`));
  // Record every transform the pills get from the first frame on (first-paint check).
  await page.addInitScript(() => {
    window.__pillLog = [];
    new MutationObserver((rs) => rs.forEach((r) => r.target.matches?.("[data-sliding-pill]") && window.__pillLog.push(r.target.style.transform))).observe(document, { subtree: true, attributes: true, attributeFilter: ["style"] });
  });
  if (clock) await page.clock.install();
  await page.goto(file(v), { waitUntil: "load" });
  if (clock) await page.clock.runFor(500);
  else await sleep(500);
  await page.mouse.move(1, 1);
  return { page, ctx };
}
const row = (page, theme, name) => page.locator(`[data-theme-section="${theme}"] [data-row="${name}"]`);
const side = (page, theme) => page.locator(`[data-theme-section="${theme}"] nav`).last();
const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;

/** Composite: a title, then a grid (rows × before/after columns) of labelled crops. */
async function compose(name, title, rows, { dark = true } = {}) {
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0}.wrap{display:inline-block;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    h1{font-size:15px;font-weight:600;margin:0 0 16px}table{border-spacing:16px 10px;margin:-10px -16px}th,td{text-align:left;vertical-align:middle;font-weight:500;white-space:nowrap}
    img{display:block;max-width:560px;height:auto}.none{opacity:.6}
  </style><div class=wrap><h1>${title}</h1><table><tr><th></th>${VERSIONS.map((v) => `<th>${v.label}</th>`).join("")}</tr>${rows
    .map((r) => `<tr><td>${r.label}</td>${VERSIONS.map((v) => (r[v.key] && existsSync(r[v.key]) ? `<td><img src="${dataUri(r[v.key])}" style="width:${r.w ?? 360}px"></td>` : `<td class=none>${r.note?.[v.key] ?? "—"}</td>`)).join("")}</tr>`)
    .join("")}</table></div>`;
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 200 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.setContent(html, { waitUntil: "load" });
  await p.locator(".wrap").screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  console.log(`wrote ${OUT}/${name}.png`);
}
async function shot(locator, path, pad = 10) {
  const b = await locator.boundingBox();
  await locator.page().screenshot({ path, clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + pad * 2, height: b.height + pad * 2 } });
  return path;
}
/** Pill box vs the chosen option, both relative to the pill's parent. */
const pillState = (loc, sel) =>
  loc.evaluate((root, sel) => {
    const pill = root.querySelector("[data-sliding-pill]");
    const on = root.querySelector(sel);
    if (!pill || !on) return null;
    const host = pill.parentElement.getBoundingClientRect();
    const p = pill.getBoundingClientRect();
    const o = on.getBoundingClientRect();
    return { px: +(p.left - host.left).toFixed(1), pw: +p.width.toFixed(1), ox: +(o.left - host.left).toFixed(1), ow: +o.width.toFixed(1), py: +(p.top - host.top).toFixed(1), oy: +(o.top - host.top).toFixed(1) };
  }, sel);

// S1: hover on the last option of the statement format picker (the clipped fill in Joshua's screenshot).
for (const theme of ["dark", "light"]) {
  const rows = [{ label: "Hover on PDF", w: 300 }];
  for (const v of VERSIONS) {
    const { page, ctx } = await open(v);
    const r = row(page, theme, "Statement");
    await r.getByRole(v.key === "before" ? "button" : "radio", { name: "PDF" }).hover();
    await sleep(300);
    rows[0][v.key] = await shot(r.locator(":scope > div > *").first(), `${OUT}/parts/S1-${theme}-${v.key}.png`, 14);
    if (v.key === "after") {
      const inside = await r.evaluate((el) => {
        const track = el.querySelector('[role="radiogroup"]').getBoundingClientRect();
        const b = el.querySelector('[role="radio"]:last-of-type').getBoundingClientRect();
        return { inside: b.right <= track.right - 1 && b.left >= track.left && b.top >= track.top && b.bottom <= track.bottom, track: Math.round(track.right), last: Math.round(b.right) };
      });
      check(inside.inside, `S1 ${theme}: PDF option and its hover sit inside the track`, inside);
    }
    await ctx.close();
  }
  await compose(`S1-statement-hover-${theme}`, `S1 · Statement format, pointer on PDF · ${theme}`, rows, { dark: theme === "dark" });
}

// S2–S6: filmstrips. After: a fake clock steps the spring frame by frame. Before: real time (it jumps, or eases in CSS).
const STRIPS = [
  { id: "S2", name: "statement", title: "Statement format, XLSX → PDF", pick: (r, v) => r.getByRole(v.key === "before" ? "button" : "radio", { name: "PDF" }), loc: (p, t) => row(p, t, "Statement"), sel: '[aria-checked="true"]' },
  { id: "S3", name: "stock", title: "Stock filter, All → Out of stock", pick: (r) => r.getByRole("button", { name: "Out of stock" }), loc: (p, t) => row(p, t, "Stock"), sel: '[aria-pressed="true"]' },
  { id: "S4", name: "view", title: "View (single toggle group, new), List → Board", pick: (r) => r.getByRole("radio", { name: "Board" }), loc: (p, t) => row(p, t, "View"), sel: '[data-state="on"]', afterOnly: true },
  { id: "S5", name: "pages", title: "Pagination, 3 → 4", pick: (r) => r.getByRole("button", { name: "4", exact: true }), loc: (p, t) => row(p, t, "Pages"), sel: '[aria-current="page"]' },
  { id: "S6", name: "sidebar", title: "Sidebar, Orders → Team", pick: (r) => r.getByRole("button", { name: "Team" }), loc: (p, t) => side(p, t), sel: '[aria-current="page"]' },
];
const FRAMES = [0, 30, 60, 100, 150, 400];
for (const s of STRIPS) {
  const theme = "dark";
  const rows = FRAMES.map((t) => ({ label: t === 0 ? "pressed" : `+${t} ms`, w: s.name === "sidebar" ? 220 : s.name === "pages" ? 420 : 340 }));
  for (const v of VERSIONS) {
    if (s.afterOnly && v.key === "before") continue;
    const clock = v.key === "after";
    const { page, ctx } = await open(v, { clock });
    const loc = s.loc(page, theme);
    const target = s.pick(loc, v);
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    rows[0][v.key] = await shot(loc, `${OUT}/parts/${s.id}-${v.key}-0.png`);
    await page.mouse.up();
    const xs = [];
    for (let i = 1; i < FRAMES.length; i++) {
      const dt = FRAMES[i] - FRAMES[i - 1];
      if (clock) await page.clock.runFor(dt);
      else await sleep(dt);
      await page.mouse.move(1, 1);
      rows[i][v.key] = await shot(loc, `${OUT}/parts/${s.id}-${v.key}-${FRAMES[i]}.png`);
      if (clock) xs.push(await pillState(loc, s.sel));
    }
    if (clock) {
      const end = xs[xs.length - 1];
      const mid = xs.find((x) => Math.abs(x.px - end.ox) > 1 || Math.abs(x.py - end.oy) > 1);
      check(end && Math.abs(end.px - end.ox) < 0.6 && Math.abs(end.pw - end.ow) < 0.6 && Math.abs(end.py - end.oy) < 0.6, `${s.id} ${s.name}: the pill lands on the new choice`, end);
      check(!!mid, `${s.id} ${s.name}: the pill passes through in-between positions`, xs.map((x) => (s.name === "sidebar" ? x.py : x.px)));
    }
    await ctx.close();
  }
  await compose(`${s.id}-${s.name}`, `${s.id} · ${s.title} · dark`, rows, {});
}

// S7: first paint. Every pill's first transform is already its final place (no slide in from x = 0).
{
  const rows = [{ label: "First frame", w: 520 }];
  for (const v of VERSIONS) {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 1700 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      // Per pill, every distinct transform it is given while the page loads.
      window.__pillSeen = new Map();
      new MutationObserver((rs) =>
        rs.forEach((r) => {
          if (!r.target.matches?.("[data-sliding-pill]")) return;
          const seen = window.__pillSeen.get(r.target) ?? [];
          if (seen[seen.length - 1] !== r.target.style.transform) seen.push(r.target.style.transform);
          window.__pillSeen.set(r.target, seen);
        }),
      ).observe(document, { subtree: true, attributes: true, attributeFilter: ["style"] });
    });
    await page.goto(file(v), { waitUntil: "commit" });
    await page.waitForSelector('[data-theme-section="dark"] [data-row="Range"] [role="radio"]');
    rows[0][v.key] = await shot(page.locator('[data-theme-section="dark"] .grid.gap-4 > div').first(), `${OUT}/parts/S7-${v.key}.png`, 0);
    if (v.key === "after") {
      await sleep(600);
      // A slide would leave a trail of in-between transforms; placing gives one (two if a font load re-places it).
      const res = await page.evaluate(() => [...window.__pillSeen.values()].map((s) => s.length));
      check(res.length > 0 && res.every((n) => n <= 2), "S7 first paint: every pill is placed, none slides in from x = 0", { positionsPerPill: res });
      const all = await page.evaluate(() =>
        [...document.querySelectorAll("[data-sliding-pill]")].map((p) => {
          const host = p.parentElement;
          const on = host.querySelector('[aria-checked="true"],[aria-pressed="true"],[data-state="on"],[role="tab"][data-state="active"],[aria-current="page"]');
          if (!on) return { ok: true };
          const a = p.getBoundingClientRect();
          const b = on.getBoundingClientRect();
          return { ok: Math.abs(a.left - b.left) < 0.6 && Math.abs(a.width - b.width) < 0.6, d: +(a.left - b.left).toFixed(1) };
        }),
      );
      check(all.every((x) => x.ok), "S7 every pill sits on its chosen option at rest", all.map((x) => x.d ?? 0));
    }
    await ctx.close();
  }
  await compose("S7-first-paint", "S7 · First frame after load (dark)", rows, {});
}

// S8: right to left. S9: reduced motion. S10: keyboard. S11: narrow (chips wrap, pill follows the layout).
{
  const rows = [{ label: "RTL, after picking اليوم", w: 300 }];
  for (const v of VERSIONS) {
    const { page, ctx } = await open(v);
    const r = row(page, "dark", "Right to left");
    await r.getByRole("radio", { name: "اليوم" }).click();
    await sleep(600);
    rows[0][v.key] = await shot(r.locator('[role="radiogroup"]'), `${OUT}/parts/S8-${v.key}.png`, 12);
    if (v.key === "after") {
      const st = await pillState(r, '[aria-checked="true"]');
      check(st && Math.abs(st.px - st.ox) < 0.6, "S8 right to left: the pill sits under the chosen option", st);
    }
    await ctx.close();
  }
  await compose("S8-right-to-left", "S8 · Right to left · dark", rows, {});
}
{
  const rows = [{ label: "+30 ms, reduced motion", w: 340 }];
  for (const v of VERSIONS) {
    const { page, ctx } = await open(v, { reduced: true });
    const r = row(page, "dark", "Stock");
    await r.getByRole("button", { name: "Out of stock" }).click();
    await sleep(30);
    rows[0][v.key] = await shot(r, `${OUT}/parts/S9-${v.key}.png`);
    if (v.key === "after") {
      const st = await pillState(r, '[aria-pressed="true"]');
      check(st && Math.abs(st.px - st.ox) < 0.6, "S9 reduced motion: the pill is already in place", st);
    }
    await ctx.close();
  }
  await compose("S9-reduced-motion", "S9 · Reduced motion: no slide · dark", rows, {});
}
{
  const rows = [{ label: "+30 ms after → key", w: 300 }];
  for (const v of VERSIONS) {
    const { page, ctx } = await open(v);
    const r = row(page, "dark", "Range");
    await r.getByRole("radio", { name: "Week" }).focus();
    await page.keyboard.press("ArrowRight");
    await sleep(30);
    rows[0][v.key] = await shot(r.locator('[role="radiogroup"]'), `${OUT}/parts/S10-${v.key}.png`, 12);
    if (v.key === "after") {
      const st = await pillState(r, '[aria-checked="true"]');
      check(st && Math.abs(st.px - st.ox) < 0.6, "S10 keyboard: the pill lands at once", st);
    }
    await ctx.close();
  }
  await compose("S10-keyboard", "S10 · Arrow key on the range picker: instant, like every keyboard change · dark", rows, {});
}
{
  const rows = [{ label: "Narrowed to 360 px", w: 300 }];
  for (const v of VERSIONS) {
    const { page, ctx } = await open(v);
    const r = row(page, "dark", "Stock");
    await r.getByRole("button", { name: "Out of stock" }).click();
    await sleep(500);
    await page.setViewportSize({ width: 360, height: 1700 });
    await sleep(400);
    rows[0][v.key] = await shot(r, `${OUT}/parts/S11-${v.key}.png`);
    if (v.key === "after") {
      const st = await pillState(r, '[aria-pressed="true"]');
      check(st && Math.abs(st.px - st.ox) < 0.6 && Math.abs(st.py - st.oy) < 0.6, "S11 resize: the pill follows its option without sliding", st);
    }
    await ctx.close();
  }
  await compose("S11-narrow", "S11 · Stock filter after the window narrows · dark", rows, {});
}

writeFileSync(`${OUT}/checks.json`, JSON.stringify(log, null, 2));
await browser.close();
const failed = log.checks.filter((c) => !c.ok);
console.log(`${log.checks.length - failed.length}/${log.checks.length} checks pass, ${log.errors.length} page errors`);
if (log.errors.length) console.log(log.errors.join("\n"));
process.exit(failed.length || log.errors.length ? 1 : 0);
