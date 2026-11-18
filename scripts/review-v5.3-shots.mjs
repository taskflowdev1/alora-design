// v5.3 review shots: borderless pills, a centred switch thumb, six greys per theme.
// WORK = folder holding dist-e449e2c, dist-770273e, dist-new (scripts/review-v5.3-shots builds them).
// OUT = folder (default output/review-v5.3). ONLY=<regex> limits by letter.
//   S side by side per component (original | v5.2 | new)   W switch close-ups at 3x with measured insets (v5.2 | new)
//   G grey swatch sheet   F 6- vs 5-step preview (landing top + Kemang)   P landing top + full landing (v5.2 | new)
//   C rendered greys: every opaque neutral the landing, /components and orders paint, per version and theme
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright-core";

const WORK = process.env.WORK;
const OUT = process.env.OUT || "output/review-v5.3";
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const want = (l) => !ONLY || ONLY.test(l);
mkdirSync(`${OUT}/parts`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VERSIONS = [
  { key: "e449e2c", label: "Original (e449e2c)", port: 5184 },
  { key: "770273e", label: "v5.2 (770273e)", port: 5185 },
  { key: "new", label: "New", port: 5186 },
];
const [, V52, NEW] = VERSIONS;
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

const checks = { errors: [], missing: [], switch: {}, rendered: {}, colours: {} };
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

const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString("base64")}`;
async function compose(name, title, theme, cols, width = 1440) {
  const dark = theme === "dark";
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;padding:24px;background:${dark ? "#0d0d0d" : "#f4f4f4"};color:${dark ? "#eee" : "#181818"};font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    h1{font-size:15px;font-weight:600;margin:0 0 16px}
    .row{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap}
    figure{margin:0;display:grid;gap:8px;min-width:0}
    figcaption{font-weight:500;white-space:pre-line;line-height:1.5}
    img{max-width:${Math.floor((width - 48 - 24 * (Math.min(cols.length, 4) - 1)) / Math.min(cols.length, 4))}px;height:auto;display:block;border-radius:8px}
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

/* ---------------------------------------------------------------- S: pills, three versions */

const ITEMS = [
  ["S01", "segmented", null],
  ["S02", "toggle-group", null],
  ["S07", "tag-input", null],
];
if (want("S")) {
  for (const theme of ["light", "dark"]) {
    for (const v of VERSIONS) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
      for (const [, name] of ITEMS) {
        const page = await open(ctx, v, `/components/${name}`, theme);
        const ok = await clip(page, page.locator("[data-stage] > *").first(), `${OUT}/parts/S-${name}-${theme}-${v.key}.png`, 20);
        if (!ok) checks.missing.push(`${v.key} ${name} ${theme}`);
        await page.close();
      }
      await ctx.close();
    }
    for (const [letter, name] of ITEMS) {
      await compose(`${letter}-${name}-${theme}`, name, theme, VERSIONS.map((v) => ({ label: v.label, file: `${OUT}/parts/S-${name}-${theme}-${v.key}.png` })));
    }
  }
  // The computed pill shadow on the new build: no spread ring, no inset.
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await open(ctx, NEW, "/components/toggle-group", theme);
    checks.colours[`pill-shadow-${theme}`] = await page.locator("[data-stage] [data-state=on]").first().evaluate((e) => getComputedStyle(e).boxShadow).catch(() => null);
    await ctx.close();
  }
}

/* ---------------------------------------------------------------- W: switch insets */

// Measures the painted thumb inside the painted track from the screenshot pixels, in device px and CSS px.
async function paintedInsets(page, file, scale) {
  return page.evaluate(
    async ({ src, scale }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const px = (x, y) => {
        const i = (y * c.width + x) * 4;
        return [d[i], d[i + 1], d[i + 2]];
      };
      const lum = ([r, gg, b]) => 0.2126 * r + 0.7152 * gg + 0.0722 * b;
      const bg = lum(px(0, 0));
      const cy = Math.floor(c.height / 2);
      // Track colour: sample the end of the track away from the thumb, on the centre row.
      const row = [...Array(c.width).keys()].map((x) => lum(px(x, cy)));
      const inTrack = row.map((v) => Math.abs(v - bg) > 8);
      const xs = inTrack.flatMap((t, x) => (t ? [x] : []));
      const [x0, x1] = [xs[0], xs[xs.length - 1]];
      // The thumb is white (255); find which end of the track it is not at.
      const leftEnd = row[x0 + Math.round((x1 - x0) * 0.12)];
      const rightEnd = row[x0 + Math.round((x1 - x0) * 0.88)];
      const track = Math.abs(leftEnd - 255) > Math.abs(rightEnd - 255) ? leftEnd : rightEnd;
      const mid = (a, b) => (a + b) / 2;
      // Track bounds: half way between the background and the track colour (anti-aliased edges count by coverage).
      const tCut = mid(bg, track);
      const isTrack = (v) => (track > bg ? v >= tCut : v <= tCut);
      // Thumb bounds: half way between the track colour and white, inside the track.
      const hCut = mid(track, 255);
      const isThumb = (v) => v >= hCut;
      // Ordered scans along a line, from outside in: background, then track, then thumb. (In light the thumb and the
      // background are both white, so a bounding box would merge them; a scan never does.)
      const scan = (pts) => {
        const i = pts.findIndex(([x, y]) => isTrack(lum(px(x, y))));
        const j = pts.findIndex(([x, y], k) => k > i && isThumb(lum(px(x, y))));
        return { track: i, thumb: j, inset: j - i };
      };
      const W = c.width, H = c.height;
      const rowPts = [...Array(W).keys()].map((x) => [x, cy]);
      const left = scan(rowPts);
      const right = scan([...rowPts].reverse());
      // The thumb's centre column: the larger of the two horizontal insets is the far side; the thumb sits at the other.
      const onLeft = left.inset <= right.inset;
      const tx = onLeft ? left.thumb : W - 1 - right.thumb;
      const thumbW = (() => {
        const startX = tx;
        let x = startX;
        const step = onLeft ? 1 : -1;
        while (x >= 0 && x < W && isThumb(lum(px(x, cy)))) x += step;
        return Math.abs(x - startX);
      })();
      const colX = Math.round(onLeft ? tx + thumbW / 2 : tx - thumbW / 2);
      const colPts = [...Array(H).keys()].map((y) => [colX, y]);
      const top = scan(colPts);
      const bottom = scan([...colPts].reverse());
      const dev = { top: top.inset, bottom: bottom.inset, left: left.inset, right: right.inset, thumb: thumbW, thumbAt: onLeft ? "left" : "right" };
      const css = Object.fromEntries(Object.entries(dev).map(([k, v]) => [k, typeof v === "number" ? +(v / scale).toFixed(2) : v]));
      return { device: dev, css };
    },
    { src: dataUri(file), scale },
  );
}

if (want("W")) {
  for (const theme of ["light", "dark"]) {
    const cols = [];
    for (const v of [V52, NEW]) {
      for (const size of ["default", "lg"]) {
        for (const scale of [1, 2, 3]) {
          const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: scale });
          const page = await open(ctx, v, `/components/switch?size=${size}`, theme);
          const sws = page.locator("[data-stage] button[role=switch]");
          // Move the mouse away so no hover tint shows.
          await page.mouse.move(5, 5);
          for (let i = 0; i < (await sws.count()); i++) {
            const sw = sws.nth(i);
            const state = (await sw.getAttribute("data-state")) === "checked" ? "on" : "off";
            const file = `${OUT}/parts/W-${theme}-${v.key}-${size}-${state}-${scale}x.png`;
            // Shoot the box plus 3 px of the row around it, so the track edge has background on every side.
            const b = await sw.boundingBox();
            await page.screenshot({ path: file, clip: { x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 } });
            const dom = await sw.evaluate((e) => {
              const r = e.getBoundingClientRect();
              const t = e.firstElementChild.getBoundingClientRect();
              return { w: r.width, h: r.height, d: t.width, top: t.top - r.top, bottom: r.bottom - t.bottom, left: t.left - r.left, right: r.right - t.right };
            });
            const painted = await paintedInsets(page, file, scale);
            const k = `${v.key} ${theme} ${size} ${state} ${scale}x`;
            checks.switch[k] = { dom, painted: painted.css, device: painted.device };
            if (scale === 3) {
              const p = painted.device;
              const side = state === "on" ? `right ${p.right}` : `left ${p.left}`;
              cols.push({ label: `${v.label} · ${size} · ${state}\npainted at 3x (device px): top ${p.top} · bottom ${p.bottom} · ${side}\nlayout (CSS px): ${[dom.top, dom.bottom, state === "on" ? dom.right : dom.left].map((n) => +n.toFixed(3)).join(" / ")}`, file });
            }
          }
          await ctx.close();
        }
      }
    }
    await compose(`W-switch-${theme}`, "Switch thumb insets (top / bottom / side)", theme, cols, 1700);
  }
}

/* ---------------------------------------------------------------- G: grey sheet */

if (want("G") && existsSync(`${OUT}/greys.html`)) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`file://${process.cwd()}/${OUT}/greys.html`);
  for (const theme of ["light", "dark"]) await page.locator(`section.${theme}`).screenshot({ path: `${OUT}/G-greys-${theme}.png` });
  await ctx.close();
}

/* ---------------------------------------------------------------- F: 6 vs 5 steps */

// 5a: page takes the surface step (cards lift by their shadow only). 5b: page takes the fill step (cards sit on fill).
const VARIANTS = [
  { key: "6", label: "6 steps (ships)", page: null },
  { key: "5a", label: "5 steps: page = surface", page: "--ad-surface" },
  { key: "5b", label: "5 steps: page = fill", page: "--ad-fill" },
];
async function applyVariant(page, token) {
  if (!token) return;
  await page.evaluate((token) => {
    for (const el of [document.documentElement, ...document.querySelectorAll("[style*='--ad-page']")]) {
      const v = getComputedStyle(el).getPropertyValue(token).trim();
      if (v) el.style.setProperty("--ad-page", v);
    }
  }, token);
  await sleep(300);
}
if (want("F")) {
  for (const theme of ["light", "dark"]) {
    for (const vr of VARIANTS) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      const page = await open(ctx, NEW, "/", theme);
      await applyVariant(page, vr.page);
      await page.screenshot({ path: `${OUT}/parts/F-top-${theme}-${vr.key}.png` });
      await ctx.close();
      const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
      const p2 = await open(ctx2, NEW, "/", theme);
      await applyVariant(p2, vr.page);
      // Kemang with its neighbours, so card-on-page separation shows.
      await clip(p2, kemang(p2), `${OUT}/parts/F-kemang-${theme}-${vr.key}.png`, 40);
      await ctx2.close();
    }
    await compose(`F-steps-top-${theme}`, "6 vs 5 grey steps: landing top", theme, VARIANTS.map((vr) => ({ label: vr.label, file: `${OUT}/parts/F-top-${theme}-${vr.key}.png` })), 2200);
    await compose(`F-steps-kemang-${theme}`, "6 vs 5 grey steps: Kemang", theme, VARIANTS.map((vr) => ({ label: vr.label, file: `${OUT}/parts/F-kemang-${theme}-${vr.key}.png` })), 2200);
  }
}

/* ---------------------------------------------------------------- P: landing */

if (want("P")) {
  for (const theme of ["light", "dark"]) {
    for (const v of [V52, NEW]) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
      const page = await open(ctx, v, "/", theme);
      await page.screenshot({ path: `${OUT}/parts/P-top-${theme}-${v.key}.png` });
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
    await compose(`P-top-${theme}`, "Landing top", theme, [V52, NEW].map((v) => ({ label: v.label, file: `${OUT}/parts/P-top-${theme}-${v.key}.png` })), 2200);
    await compose(`P-landing-${theme}`, "Landing", theme, [V52, NEW].map((v) => ({ label: v.label, file: `${OUT}/parts/P-landing-${theme}-${v.key}.png` })), 2200);
  }
}

/* ---------------------------------------------------------------- C: rendered greys */

if (want("C")) {
  for (const theme of ["light", "dark"]) {
    for (const v of [V52, NEW]) {
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
}

await browser.close();
writeFileSync(`${OUT}/checks.json`, JSON.stringify(checks, null, 2));
const sw = Object.fromEntries(Object.entries(checks.switch).map(([k, v]) => [k, `painted ${v.painted.top}/${v.painted.bottom}/${k.includes(" on ") ? v.painted.right : v.painted.left}`]));
console.log(JSON.stringify({ errors: checks.errors, missing: checks.missing, rendered: Object.fromEntries(Object.entries(checks.rendered).map(([k, v]) => [k, v.count])), pill: checks.colours, switch: sw }, null, 2));
servers.forEach((s) => s.kill("SIGTERM"));
process.exit(0);
