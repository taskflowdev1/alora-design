// The grey ramp: check and inventory.
//   node scripts/greys.mjs --check                 fail on a grey outside the ramp (scripts/verify runs it)
//   node scripts/greys.mjs --inventory [--root D]  JSON: every grey a checkout renders, per theme, with counts and files
//   node scripts/greys.mjs --sheet BEFORE.json AFTER.json OUT.html   before/after swatch sheet
// The ramp lives in src/lib/config.ts (GREY_STEPS, greyRamp, GREY_ROLES). Outside the token definitions, code may use a
// grey only through a token class or var(--ad-*) with no alpha. A line (or the line before it) with "grey-ok" is image
// content or an accent choice, not a UI grey; brand marks and flags (BRAND_ART) keep their own colours.
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const HERE = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const ROOT = opt("--root") || HERE;

const SCAN = ["src", "api"];
const DEFINITIONS = new Set(["src/lib/config.ts", "src/lib/color.ts"]);
const BRAND_ART = new Set(["src/components/ui/marketplace-mark.tsx", "src/components/ui/language-picker.tsx"]);

async function loadLib(root) {
  const tmp = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "ad-greys-"));
  writeFileSync(join(tmp, "package.json"), '{"type":"module"}');
  for (const f of ["config", "color"]) {
    const src = readFileSync(join(root, `src/lib/${f}.ts`), "utf8");
    writeFileSync(join(tmp, `${f}.js`), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  }
  const config = await import(pathToFileURL(join(tmp, "config.js")).href);
  const color = await import(pathToFileURL(join(tmp, "color.js")).href);
  rmSync(tmp, { recursive: true, force: true });
  return { ...config, ...color };
}

function files(root) {
  const out = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx?|css)$/.test(n)) out.push(p);
    }
  };
  for (const s of SCAN) {
    try {
      walk(join(root, s));
    } catch {
      /* folder missing in an old checkout */
    }
  }
  return out.map((p) => ({ rel: relative(root, p), text: readFileSync(p, "utf8") }));
}

/* ------------------------------------------------------------ colour maths */

const hexRgb = (h) => {
  let x = h.replace("#", "");
  if (x.length === 3 || x.length === 4) x = [...x].map((c) => c + c).join("");
  const n = parseInt(x.slice(0, 6), 16);
  const a = x.length === 8 ? parseInt(x.slice(6), 16) / 255 : 1;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
};
const toHex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const parseColor = (v) => {
  v = String(v).trim();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return hexRgb(v);
  const m = v.match(/^rgba?\(([^)]*)\)$/i);
  if (m) {
    const [r, g, b, a = "1"] = m[1].split(/[\s,/]+/).filter(Boolean);
    return [+r, +g, +b, a.endsWith("%") ? parseFloat(a) / 100 : +a];
  }
  return null;
};
const over = ([r, g, b, a], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a), 1];

/* ------------------------------------------------------------ patterns */

const PREFIX = "(?:bg|text|fill|stroke|border|ring|outline|from|via|to|decoration|caret|accent|divide|placeholder)";
const PALETTE = new RegExp(`(?<![\\w-])${PREFIX}-(?:black|white|gray|grey|neutral|zinc|slate|stone)(?:-\\d+)?(?:/[\\d.]+)?(?![\\w-])`, "g");
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FUNC = /(?<![a-zA-Z])(?:rgba?|hsla?)\([^)]*\)/g;
const IMAGE = /\btints = |text-black\/30|SWATCHES = /;
const exempt = (lines, i) => /grey-ok/.test(lines[i]) || (i > 0 && /grey-ok/.test(lines[i - 1])) || /mask/.test(lines[i]);

/** Grey token names: whatever the checkout's tokens hold as a neutral colour (so it works on old checkouts too). */
function greyTokens(lib, t) {
  const names = new Set();
  for (const map of [t.light, t.dark]) {
    for (const [k, v] of Object.entries(map)) {
      if (!k.startsWith("--ad-") || /shadow|overlay/.test(k)) continue;
      const c = parseColor(v);
      if (!c) continue;
      if (lib.hexToOklch(toHex(c)).c < 0.004) names.add(k.slice(5));
    }
  }
  return [...names].sort((a, b) => b.length - a.length);
}

const isNeutral = (lib, rgb) => lib.hexToOklch(toHex(rgb)).c < 0.03;

/* ------------------------------------------------------------ check */

async function check() {
  const lib = await loadLib(ROOT);
  const fail = [];
  // 1. The ramp: at most 8 steps per theme, steps at least 2.5% lightness apart, every grey token on a step, for
  //    every tone and both themes.
  if (!lib.greyRamp) fail.push("src/lib/config.ts: no greyRamp (the grey ramp is missing)");
  for (const tone of lib.greyRamp ? ["neutral", "cool", "warm"] : []) {
    for (const theme of ["light", "dark"]) {
      const ramp = lib.greyRamp(tone, theme === "dark");
      const steps = Object.values(ramp);
      if (new Set(steps).size > 8) fail.push(`${tone}/${theme}: ${new Set(steps).size} ramp steps (max 8)`);
      // Near-duplicates: neighbours closer than 2.5% lightness. Page and surface are the one deliberate close pair (an
      // off-white page under white cards; a near-black page under a card a step up).
      const ls = Object.entries(ramp).map(([k, h]) => [k, lib.hexToOklch(h).l]).sort((a, b) => a[1] - b[1]);
      ls.forEach(([k, l], i) => {
        if (!i) return;
        const [pk, pl] = ls[i - 1];
        if (l - pl < 0.025 && !(new Set([k, pk]).has("page") && new Set([k, pk]).has("surface")))
          fail.push(`${tone}/${theme}: ramp steps ${pk} ${pl.toFixed(3)} and ${k} ${l.toFixed(3)} are near-duplicates`);
      });
      const t = lib.tokens({ ...lib.DEFAULTS, tone, theme });
      const neutralNames = greyTokens(lib, lib.tokens({ ...lib.DEFAULTS, theme }));
      const map = t[theme];
      const island = new Set(Object.values(lib.greyRamp(tone, true)));
      const allowed = new Set([...steps, "#ffffff"]);
      for (const k of neutralNames) {
        const v = map[`--ad-${k}`];
        if (!v) continue;
        const ok = k.startsWith("side") ? island.has(v) : allowed.has(v);
        if (!ok) fail.push(`${tone}/${theme}: --ad-${k} = ${v} is not a ramp step`);
      }
    }
  }
  // 2. Code: no raw neutrals, no palette greys, no alpha or color-mix on a grey token outside the token definitions.
  const t = lib.tokens(lib.DEFAULTS);
  const names = greyTokens(lib, t);
  const alpha = new RegExp(`(?<![\\w-])${PREFIX}-(?:${names.join("|")})/[\\d.]+(?![\\w-])`, "g");
  const mix = new RegExp(`color-mix\\([^;]*var\\(--ad-(?:${names.join("|")})\\)`);
  for (const f of files(ROOT)) {
    if (DEFINITIONS.has(f.rel) || BRAND_ART.has(f.rel)) continue;
    const lines = f.text.split("\n");
    lines.forEach((line, i) => {
      if (exempt(lines, i)) return;
      const at = `${f.rel}:${i + 1}`;
      for (const m of line.matchAll(PALETTE)) fail.push(`${at}: palette grey "${m[0]}" (use a ramp token)`);
      for (const m of line.matchAll(alpha)) fail.push(`${at}: "${m[0]}" makes an off-ramp grey (use a ramp step)`);
      if (mix.test(line)) fail.push(`${at}: color-mix on a grey token makes an off-ramp grey`);
      for (const m of [...line.matchAll(HEX), ...line.matchAll(FUNC)]) {
        const c = parseColor(m[0]);
        if (c && isNeutral(lib, c)) fail.push(`${at}: raw grey ${m[0]} (use a ramp token)`);
      }
    });
  }
  if (fail.length) {
    console.error(`GREYS FAIL (${fail.length})\n` + fail.map((x) => `  ${x}`).join("\n"));
    process.exit(1);
  }
  console.log("greys ok: one ramp per theme, every grey on it");
}

/* ------------------------------------------------------------ inventory */

async function inventory() {
  const lib = await loadLib(ROOT);
  const t = lib.tokens(lib.DEFAULTS);
  const names = greyTokens(lib, t);
  const cls = new RegExp(`(?<![\\w-])(?:[a-z-]+:)*${PREFIX}-(${names.join("|")})(?:/([\\d.]+))?(?![\\w-])`, "g");
  const cssVar = new RegExp(`var\\(--ad-(${names.join("|")})\\)`, "g");
  const n = names.join("|");
  const mixRe = new RegExp(`color-mix\\(in \\w+,\\s*var\\(--ad-(${n})\\)\\s*(\\d+)%,\\s*transparent\\)|color-mix\\(in_\\w+,var\\(--ad-(${n})\\)_(\\d+)%,transparent\\)`, "g");
  const out = {};
  for (const theme of ["light", "dark"]) {
    const map = t[theme];
    const base = parseColor(map["--ad-surface"]);
    const greys = new Map();
    const add = (rgb, source, file) => {
      const hex = toHex(rgb);
      const g = greys.get(hex) || { hex, l: +lib.hexToOklch(hex).l.toFixed(3), count: 0, sources: {} };
      g.count++;
      (g.sources[source] ||= new Set()).add(file);
      greys.set(hex, g);
    };
    for (const f of files(ROOT)) {
      if (DEFINITIONS.has(f.rel)) continue;
      const lines = f.text.split("\n");
      lines.forEach((line, i) => {
        for (const m of line.matchAll(cls)) {
          const v = parseColor(map[`--ad-${m[1]}`]);
          if (!v) continue;
          const a = m[2] ? Math.min(1, +m[2] / 100) : 1;
          add(a < 1 ? over([v[0], v[1], v[2], a * v[3]], base) : v[3] < 1 ? over(v, base) : v, m[2] ? `${m[1]}/${m[2]}` : m[1], f.rel);
        }
        for (const m of line.matchAll(cssVar)) {
          const v = parseColor(map[`--ad-${m[1]}`]);
          if (v) add(v[3] < 1 ? over(v, base) : v, m[1], f.rel);
        }
        for (const m of line.matchAll(mixRe)) {
          const name = m[1] || m[3];
          const pct = +(m[2] || m[4]);
          const v = parseColor(map[`--ad-${name}`]);
          if (v) add(over([v[0], v[1], v[2], pct / 100], base), `color-mix(${name} ${pct}%)`, f.rel);
        }
        // Image content and accent choices (photo stand-ins, accent swatches) are left out in every checkout, marked
        // with grey-ok or not, so before and after count the same things.
        if (BRAND_ART.has(f.rel) || exempt(lines, i) || IMAGE.test(line)) return;
        for (const m of line.matchAll(PALETTE)) {
          const [, word, a] = m[0].match(/-(black|white|[a-z]+-\d+)(?:\/([\d.]+))?$/) || [];
          const rgb = word === "white" ? [255, 255, 255, 1] : word === "black" ? [0, 0, 0, 1] : null;
          if (rgb) add(a ? over([rgb[0], rgb[1], rgb[2], +a / 100], base) : rgb, m[0], f.rel);
        }
        for (const m of [...line.matchAll(HEX), ...line.matchAll(FUNC)]) {
          const c = parseColor(m[0]);
          if (c && isNeutral(lib, c)) add(c[3] < 1 ? over(c, base) : c, `raw ${m[0]}`, f.rel);
        }
      });
    }
    out[theme] = [...greys.values()]
      .sort((a, b) => b.l - a.l)
      .map((g) => ({ ...g, sources: Object.fromEntries(Object.entries(g.sources).map(([k, s]) => [k, [...s].sort()])) }));
  }
  out.ramp = lib.greyRamp ? { light: lib.greyRamp("neutral", false), dark: lib.greyRamp("neutral", true) } : null;
  out.shadows = Object.fromEntries(["light", "dark"].map((th) => [th, Object.fromEntries(Object.entries(t[th]).filter(([k]) => /shadow|overlay/.test(k)))]));
  console.log(JSON.stringify(out, null, 2));
}

/* ------------------------------------------------------------ sheet */

function sheet(beforeFile, afterFile, outFile) {
  const before = JSON.parse(readFileSync(beforeFile, "utf8"));
  const after = JSON.parse(readFileSync(afterFile, "utf8"));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const short = (f) => f.replace(/^src\/(components\/ui|components|site|styles)\//, "").replace(/\.(tsx|ts|css)$/, "");
  const row = (g) => {
    const srcs = Object.entries(g.sources)
      .map(([k, fs]) => `<b>${esc(k)}</b> ${esc(fs.length > 6 ? fs.slice(0, 6).map(short).join(", ") + ` +${fs.length - 6}` : fs.map(short).join(", "))}`)
      .join("<br>");
    return `<tr><td><span class=sw style="background:${g.hex}"></span></td><td class=mono>${g.hex}</td><td class=mono>${g.l.toFixed(3)}</td><td class=n>${g.count}</td><td class=src>${srcs}</td></tr>`;
  };
  const table = (list) => `<table><tr><th></th><th>Grey</th><th>L</th><th>Uses</th><th>Where (class or token: files)</th></tr>${list.map(row).join("")}</table>`;
  const ramp = (r, theme) =>
    `<div class=ramp>${Object.entries(r)
      .map(([k, v]) => `<div><span class=big style="background:${v}"></span><b>${k}</b><span class=mono>${v}</span></div>`)
      .join("")}${theme === "dark" ? `<div><span class=big style="background:#ffffff"></span><b>white</b><span class=mono>thumb only</span></div>` : ""}</div>`;
  const theme = (th) => {
    const dark = th === "dark";
    return `<section class=${th} style="background:${dark ? "#0c0c0c" : "#fafafa"};color:${dark ? "#eee" : "#181818"}">
      <h1>${th}: ${before[th].length} greys before → ${after[th].length} after</h1>
      <h2>Final ramp (${th})</h2>${ramp(after.ramp[th], th)}
      <div class=cols><div><h2>Before (v5.1, 549ea4c): ${before[th].length}</h2>${table(before[th])}</div>
      <div><h2>After: ${after[th].length}</h2>${table(after[th])}</div></div></section>`;
  };
  const html = `<!doctype html><meta charset=utf-8><title>Grey ramp</title><style>
    body{margin:0;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    section{padding:28px}h1{font-size:20px;margin:0 0 16px}h2{font-size:14px;margin:20px 0 10px}
    .cols{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start}
    table{border-collapse:collapse;width:100%}th{text-align:left;font-weight:500;opacity:.6;padding:4px 8px}
    td{padding:5px 8px;vertical-align:top}.n{text-align:right}.mono{font-family:ui-monospace,Menlo,monospace;font-size:12px}
    .src{font-size:11.5px;line-height:1.5;opacity:.85}
    .sw{display:block;width:36px;height:22px;border-radius:6px;box-shadow:0 0 0 1px rgba(128,128,128,.35)}
    .ramp{display:flex;gap:12px;flex-wrap:wrap}.ramp div{display:grid;gap:4px;width:104px}
    .big{display:block;height:56px;border-radius:10px;box-shadow:0 0 0 1px rgba(128,128,128,.35)}
  </style>${theme("light")}${theme("dark")}`;
  writeFileSync(outFile, html);
}

if (args.includes("--check")) await check();
else if (args.includes("--inventory")) await inventory();
else if (args.includes("--sheet")) sheet(opt("--sheet"), args[args.indexOf("--sheet") + 2], args[args.indexOf("--sheet") + 3]);
else {
  console.error("usage: --check | --inventory [--root DIR] | --sheet BEFORE.json AFTER.json OUT.html");
  process.exit(2);
}
