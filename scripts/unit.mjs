import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { REPO, loadModules } from "./lib/load-lib.mjs";

const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const GOLDENS = join(REPO, "scripts/unit-goldens.json");

const NUMBERS = [0, 7, 999, 9999, 10000, 12345, 154000, 999999, 1e6, 1234567, 48.2e6, 99.96e6, 100e6, 123456789, 1e9, 1234567890, 1.5e12, -12345, -48.2e6, 0.4, 12.6];
const NOW = new Date(2026, 10, 20, 10, 30);
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h);
const SMART = [at(2026, 11, 20, 0), at(2026, 11, 20, 23), at(2026, 11, 19), at(2026, 11, 21), at(2026, 11, 18), at(2026, 11, 22), at(2025, 1, 3), at(2027, 12, 31)];
const RANGES = [
  [at(2026, 11, 17), at(2026, 11, 17)],
  [at(2026, 11, 3), at(2026, 11, 9)],
  [at(2026, 10, 28), at(2026, 11, 3)],
  [at(2025, 12, 29), at(2026, 1, 4)],
  [at(2025, 3, 1), at(2025, 3, 7)],
  [at(2025, 3, 30), at(2025, 4, 2)],
];
const key = (d) => d.toISOString();

async function outputs(root) {
  const [ad, card, chart, rangeDesktop, rangeMobile] = await loadModules(
    ["src/lib/ad.ts", "src/components/ui/card.tsx", "src/components/ui/chart.tsx", "src/components/ui/date-range-picker.tsx", "src/components/mobile/mobile-date-range.tsx"],
    { root },
  );
  const map = (xs, f, k = String) => Object.fromEntries(xs.map((x) => [k(x), f(x)]));
  return {
    formatRp: map(NUMBERS, ad.formatRp),
    compactNumber: map(NUMBERS, card.compactNumber),
    formatShort: map(NUMBERS, chart.formatShort),
    toLocaleId: map(NUMBERS, (n) => n.toLocaleString("id-ID")),
    formatSmartDate: map(SMART, (d) => ad.formatSmartDate(d, NOW), key),
    formatRangeDesktop: map(RANGES, ([from, to]) => rangeDesktop.formatRange({ from, to }), (r) => r.map(key).join("/")),
    formatRangeMobile: map(RANGES, ([from, to]) => rangeMobile.formatRange({ from, to }, NOW), (r) => r.map(key).join("/")),
  };
}

if (args.includes("--write-goldens")) {
  const root = resolve(opt("--root") ?? REPO);
  writeFileSync(GOLDENS, `${JSON.stringify(await outputs(root), null, 1)}\n`);
  console.log(`wrote ${GOLDENS} from ${root}`);
  process.exit(0);
}

const golden = JSON.parse(readFileSync(GOLDENS, "utf8"));
const now = await outputs(REPO);
const [ad, config, kit, registry] = await loadModules(["src/lib/ad.ts", "src/lib/config.ts", "src/lib/kit.ts", "src/lib/registry.ts"]);

for (const name of Object.keys(golden)) test(`${name} matches its goldens`, () => assert.deepEqual(now[name], golden[name]));

test("formatCompact reproduces compactNumber and formatShort", { skip: !ad.formatCompact && "lib/ad.ts has no formatCompact" }, () => {
  assert.deepEqual(Object.fromEntries(NUMBERS.map((n) => [n, ad.formatCompact(n, { space: "nbsp", digits: "auto" })])), golden.compactNumber);
  assert.deepEqual(Object.fromEntries(NUMBERS.map((n) => [n, ad.formatCompact(n, { space: " ", digits: 1 })])), golden.formatShort);
});
test("formatNumber matches id-ID grouping", { skip: !ad.formatNumber && "lib/ad.ts has no formatNumber" }, () => {
  assert.deepEqual(Object.fromEntries(NUMBERS.map((n) => [n, ad.formatNumber(n)])), golden.toLocaleId);
});

test("config survives the URL round-trip", () => {
  const { DEFAULTS, parseConfig, serializeConfig } = config;
  assert.equal(serializeConfig(DEFAULTS), "");
  const variants = [
    { radius: 0, corner: "square" },
    { radius: 24, corner: "round", padding: 8, height: 44, font: 15 },
    { smoothing: 2.5, accent: "#d9622b", tone: "warm", shadow: 0, theme: "light" },
    { tone: "cool", shadow: 100, font: 12, height: 32, padding: 24 },
  ];
  for (const v of variants) {
    const c = { ...DEFAULTS, ...v };
    assert.deepEqual(parseConfig(serializeConfig(c)), c, serializeConfig(c));
  }
  assert.equal(serializeConfig({ ...DEFAULTS, radius: 16, accent: "#D9622B" }), "r=16&a=d9622b");
  assert.deepEqual(parseConfig("r=99&k=9&a=nothex&g=x&t=q"), { ...DEFAULTS, radius: 24, smoothing: 3 });
});

test("theme item keeps its shape", () => {
  const read = (p) => readFileSync(join(REPO, p), "utf8");
  const item = kit.themeItem(config.DEFAULTS, { themeCss: read("src/styles/theme.css"), baseCss: read("src/styles/base.css") });
  assert.deepEqual(Object.keys(item), ["$schema", "name", "type", "title", "description", "cssVars", "css"]);
  assert.deepEqual(Object.keys(item.cssVars), ["theme", "light", "dark"]);
  assert.ok(item.cssVars.light["ad-radius-control"], "light vars carry the radii");
  assert.ok(item.css["@layer base"][".light"], "dark default puts the light theme on .light");
  assert.ok(item.css["@supports (corner-shape: squircle)"], "squircle radii ship");
});

test("registry deps match the imports", () => {
  const owner = {};
  for (const i of registry.ITEMS) for (const f of i.files) if (!i.alias) owner[`${i.dir ?? "ui"}/${f}`] ??= i.name;
  const problems = [];
  for (const i of registry.ITEMS) {
    const npm = new Set();
    const reg = new Set();
    for (const f of i.files) {
      const dir = i.dir ?? "ui";
      const p = join(REPO, `src/components/${dir}/${f}`);
      if (!existsSync(p)) {
        problems.push(`${i.name}: missing file ${dir}/${f}`);
        continue;
      }
      for (const [, s] of readFileSync(p, "utf8").matchAll(/(?:from|import)\s+"([^"]+)"/g)) {
        if (["react", "react-dom", "react-feather", "@/lib/ad", "@/lib/ad-hooks"].includes(s)) continue;
        const local = s.startsWith("./") ? `${dir}/${s.slice(2)}` : s.startsWith("../") ? s.slice(3) : s.startsWith("@/components/") ? s.slice(13) : null;
        if (local) {
          const o = owner[`${local}.tsx`];
          if (!o) problems.push(`${i.name}: imports ${s}, which no item ships`);
          else if (o !== i.name) reg.add(o);
        } else if (s.startsWith("@/")) problems.push(`${i.name}: imports ${s}, which installs don't get`);
        else npm.add(s.split("/").slice(0, s.startsWith("@") ? 2 : 1).join("/"));
      }
    }
    const deps = new Set(i.deps ?? []);
    const regDeps = new Set(i.registryDeps ?? []);
    for (const n of npm) if (!deps.has(n)) problems.push(`${i.name}: imports ${n} but doesn't declare it`);
    for (const n of deps) if (!npm.has(n)) problems.push(`${i.name}: declares ${n} but doesn't import it`);
    for (const n of reg) if (!regDeps.has(n)) problems.push(`${i.name}: imports ${n} but registryDeps lacks it`);
    for (const n of regDeps) if (!reg.has(n)) problems.push(`${i.name}: registryDeps has ${n} but nothing imports it (a companion?)`);
  }
  assert.deepEqual(problems, []);
});

test("api imports relative files with .js, all the way down", async () => {
  const { readdirSync } = await import("node:fs");
  const { dirname, relative } = await import("node:path");
  const seen = new Set();
  const bad = [];
  const walk = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/^(import|export)(?!\s+type\b)[^;\n]*?\sfrom\s+"(\.{1,2}\/[^"]+)"/gm)) {
      const spec = m[2];
      if (spec.endsWith(".json")) continue;
      if (!spec.endsWith(".js")) bad.push(`${relative(REPO, file)}: ${spec}`);
      const ts = resolve(dirname(file), spec.replace(/\.js$/, ""));
      for (const cand of [`${ts}.ts`, `${ts}.tsx`, join(ts, "index.ts")]) if (existsSync(cand)) walk(cand);
    }
  };
  for (const f of readdirSync(join(REPO, "api")).filter((f) => f.endsWith(".ts"))) walk(join(REPO, "api", f));
  assert.ok(seen.size > 5, `walked ${seen.size} files`);
  assert.deepEqual(bad, []);
});
