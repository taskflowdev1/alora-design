// Writes the generated parts of README.md (settings table, component table), docs/components.md (every component's
// props) and docs/ui-checklist.md (the agent checklist) from the source: src/lib/config.ts, src/lib/registry.ts,
// src/lib/encyclopedia.ts and the component files, read with the TypeScript compiler. `--check` writes nothing and fails when the files are out of date (scripts/verify runs it).
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

// The pure lib modules, transpiled to a temp folder so their data (DEFAULTS, LIMITS, ITEMS) can be imported.
const tmp = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "ad-docs-"));
for (const f of ["config", "color", "registry", "encyclopedia"]) writeFileSync(join(tmp, `${f}.js`), ts.transpileModule(read(`src/lib/${f}.ts`), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
const { DEFAULTS, LIMITS, GREY_STEPS, GREY_ROLES, greyRamp } = await import(pathToFileURL(join(tmp, "config.js")).href);
const { ITEMS, GROUPS, SITE, itemPath } = await import(pathToFileURL(join(tmp, "registry.js")).href);
const { checklistMarkdown } = await import(pathToFileURL(join(tmp, "encyclopedia.js")).href);
rmSync(tmp, { recursive: true, force: true });

const parsed = ts.parseJsonConfigFileContent(JSON.parse(read("tsconfig.json")), ts.sys, ROOT);
const program = ts.createProgram({ rootNames: parsed.fileNames.filter((f) => f.includes("/src/")), options: parsed.options });
const checker = program.getTypeChecker();
const source = (p) => program.getSourceFile(join(ROOT, p));
const doc = (sym) => ts.displayPartsToString(sym.getDocumentationComment(checker)).replace(/\s+/g, " ").trim();
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const typeText = (t) => checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType).replace(/ \| undefined$/, "").replace(/'/g, '"');

/* ------------------------------------------------------------ settings */

const configSrc = read("src/lib/config.ts");
const urlKey = Object.fromEntries([...configSrc.matchAll(/c\.(\w+)(?:\.\w+\(\))? !== d\.\w+\) out\.push\(\["(\w+)"/g)].map((m) => [m[1], m[2]]));
const shortKeys = (name) => Object.fromEntries([...(configSrc.match(new RegExp(`const ${name}[^=]*= \\{([^}]*)\\}`))?.[1] ?? "").matchAll(/(\w+): "(\w+)"/g)].map((m) => [m[2], m[1]]));
const SHORT = { corner: shortKeys("CORNER_KEYS"), tone: shortKeys("TONE_KEYS"), theme: { dark: "d", light: "l" } };
const configType = (() => {
  const sf = source("src/lib/config.ts");
  let decl;
  ts.forEachChild(sf, (n) => ts.isInterfaceDeclaration(n) && n.name.text === "Config" && (decl = n));
  return checker.getTypeAtLocation(decl);
})();
const LABEL = { radius: "Radius", corner: "Corner shape", smoothing: "Smoothing", padding: "Padding", height: "Height", accent: "Accent", tone: "Greys", shadow: "Shadow", font: "Text size", theme: "Theme" };
const UNIT = { radius: " px", padding: " px", height: " px", font: " px", shadow: "%" };

function settingsTable() {
  const rows = ["| Setting | URL key | Default | Range or values | Notes |", "| --- | --- | --- | --- | --- |"];
  for (const prop of configType.getProperties()) {
    const k = prop.name;
    const t = checker.getTypeOfSymbol(prop);
    let range;
    if (LIMITS[k]) range = `${LIMITS[k][0]}–${LIMITS[k][1]}${UNIT[k] ?? ""}`;
    else if (t.isUnion()) range = t.types.map((u) => `\`${u.value}\`${SHORT[k]?.[u.value] ? ` (${SHORT[k][u.value]})` : ""}`).join(", ");
    else if (k === "accent") range = "any hex, `a=` without `#`";
    else range = typeText(t);
    const def = `\`${DEFAULTS[k]}${typeof DEFAULTS[k] === "number" ? (UNIT[k] ?? "") : ""}\``;
    rows.push(`| ${LABEL[k] ?? k} | \`${urlKey[k] ?? "?"}\` | ${def} | ${range} | ${cell(doc(prop) || "")} |`);
  }
  return rows.join("\n");
}

/* ------------------------------------------------------------ components */

/** Exported components of a file: capitalised functions with at most one (props) parameter. */
function componentsOf(file) {
  const sf = source(file);
  if (!sf) throw new Error(`gen-docs: ${file} is not in the TypeScript program`);
  const out = [];
  for (const sym of checker.getExportsOfModule(checker.getSymbolAtLocation(sf))) {
    const decl = sym.declarations?.[0];
    if (!decl || !ts.isFunctionDeclaration(decl) || !/^[A-Z]/.test(sym.name) || decl.parameters.length > 1) continue;
    const param = decl.parameters[0];
    const defaults = {};
    if (param && ts.isObjectBindingPattern(param.name))
      for (const el of param.name.elements) if (el.initializer) defaults[(el.propertyName ?? el.name).getText(sf)] = el.initializer.getText(sf).replace(/\s+/g, " ");
    const props = [];
    let native = false;
    if (param) {
      const t = checker.getTypeAtLocation(param);
      for (const p of t.getProperties()) {
        const d = p.declarations?.[0];
        if (!d || d.getSourceFile().fileName.includes("node_modules")) {
          native = true;
          continue;
        }
        props.push({ name: p.name, type: typeText(checker.getTypeOfSymbolAtLocation(p, param)), optional: !!(p.flags & ts.SymbolFlags.Optional), def: defaults[p.name], doc: doc(p) });
      }
    }
    out.push({ name: sym.name, doc: doc(sym), props, native });
  }
  return out;
}

const dirOf = (i) => i.dir ?? "ui";
const files = (i) => i.files.map((f) => `src/components/${dirOf(i)}/${f}`);
const install = (i) => `npx shadcn@latest add "${SITE}/r/${i.name}.json"`;
const anchor = (i) => i.name;
// metric-card shares card.tsx: list each component once, under the item whose name matches it best.
const seen = new Set();
const parts = Object.fromEntries(
  ITEMS.filter((i) => i.files.length).map((i) => {
    const all = files(i).flatMap(componentsOf);
    const kebab = (s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    const mine = all.filter((c) => !seen.has(c.name) && (ITEMS.every((o) => o === i || !o.files.length || !files(o).some((f) => files(i).includes(f)) || kebab(c.name) !== o.name)));
    mine.forEach((c) => seen.add(c.name));
    return [i.name, mine];
  }),
);

const sections = [
  ...GROUPS.map((g) => ({ title: g === "Niche" ? "Niche ERP parts" : g, items: ITEMS.filter((i) => i.group === g) })),
  { title: "AI", items: ITEMS.filter((i) => i.group === "AI") },
  { title: "Backgrounds", items: ITEMS.filter((i) => i.group === "Backgrounds") },
];

function propSummary(i) {
  if (!i.files.length) return "Set by the theme (see Settings)";
  const list = (parts[i.name] ?? []).flatMap((c) => c.props.map((p) => `\`${p.name}${p.def !== undefined ? `=${p.def}` : ""}\``));
  const uniq = [...new Set(list)];
  return uniq.length ? uniq.join(", ") : "none";
}

function componentTable() {
  const out = [];
  for (const s of sections) {
    out.push(`### ${s.title}`, "", "| Component | Install name | Exports | Props (`=default`) |", "| --- | --- | --- | --- |");
    for (const i of s.items)
      out.push(`| [${i.title}](${SITE}${itemPath(i)}) | ${i.files.length ? `\`${i.name}\`` : "in `theme`"} | ${(parts[i.name] ?? []).map((c) => `\`${c.name}\``).join(", ") || "—"} | ${cell(propSummary(i))} |`);
    out.push("");
  }
  return out.join("\n").trim();
}

function componentsDoc() {
  const out = [
    "# Components",
    "",
    "Generated by `node scripts/gen-docs.mjs` from the component sources and `src/lib/registry.ts`; do not edit by hand.",
    "Every component also takes the global settings through the theme (see the README). Install any of them with",
    `\`npx shadcn@latest add "${SITE}/r/<name>.json?<settings>"\`.`,
    "",
  ];
  for (const s of sections) {
    out.push(`## ${s.title}`, "");
    for (const i of s.items) {
      out.push(`### ${i.title}`, "", `<a id="${anchor(i)}"></a>Page: ${SITE}${itemPath(i)}`, "");
      if (!i.files.length) {
        out.push("A foundation, set by the theme: no component to install.", "");
        continue;
      }
      out.push("```sh", install(i), "```", "", `Files: ${files(i).map((f) => `\`${f}\``).join(", ")}${i.registryDeps?.length ? `. Installs too: ${i.registryDeps.map((d) => `\`${d}\``).join(", ")}` : ""}.`, "");
      if (i.params?.length) {
        out.push("Sliders on its page:", "", "| Control | Prop | Default | Range or values |", "| --- | --- | --- | --- |");
        for (const p of i.params) out.push(`| ${p.label} | \`${p.key}\` | \`${p.default}\` | ${p.type === "range" ? `${p.min}–${p.max}${p.unit ? ` ${p.unit}` : ""}` : p.type === "select" ? p.options.map((o) => `\`${o}\``).join(", ") : p.type} |`);
        out.push("");
      }
      for (const c of parts[i.name] ?? []) {
        out.push(`\`${c.name}\`${c.doc ? `: ${c.doc}` : ""}`, "");
        if (c.props.length) {
          out.push("| Prop | Type | Default | Notes |", "| --- | --- | --- | --- |");
          for (const p of c.props) out.push(`| \`${p.name}\`${p.optional ? "" : " (required)"} | \`${cell(p.type)}\` | ${p.def !== undefined ? `\`${cell(p.def)}\`` : ""} | ${cell(p.doc)} |`);
          out.push("");
        }
        if (c.native) out.push("Also takes the native props of the element it renders.", "");
      }
    }
  }
  return out.join("\n").trimEnd() + "\n";
}

/* ------------------------------------------------------------ write or check */

const splice = (text, tag, body) => {
  const re = new RegExp(`(<!-- ${tag}:start -->)[\\s\\S]*?(<!-- ${tag}:end -->)`);
  if (!re.test(text)) throw new Error(`README.md is missing the <!-- ${tag}:start --> / <!-- ${tag}:end --> markers`);
  return text.replace(re, `$1\n${body}\n$2`);
};
/* ------------------------------------------------------------ grey ramp */

// The grey ramp (config.ts): every step per theme at the default (neutral) greys, then the role tokens and their step.
function greysTable() {
  const light = greyRamp("neutral", false);
  const dark = greyRamp("neutral", true);
  const rows = ["| Step | Light | Dark |", "| --- | --- | --- |", ...GREY_STEPS.map((s) => `| \`${s}\` | \`${light[s]}\` | \`${dark[s]}\` |`)];
  const roles = ["| Role token | Light | Dark | Use |", "| --- | --- | --- | --- |", ...Object.entries(GREY_ROLES).map(([k, r]) => `| \`${k}\` | ${r.light} | ${r.dark} | ${cell(r.use)} |`)];
  return [...rows, "", ...roles].join("\n");
}

const readme = read("README.md");
const nextReadme = splice(splice(splice(readme, "settings", settingsTable()), "greys", greysTable()), "components", componentTable());
const nextDoc = componentsDoc();
const nextChecklist = checklistMarkdown();
const readOr = (p) => {
  try {
    return read(p);
  } catch {
    return "";
  }
};
if (CHECK) {
  const stale = [
    readme !== nextReadme && "README.md",
    readOr("docs/components.md") !== nextDoc && "docs/components.md",
    readOr("docs/ui-checklist.md") !== nextChecklist && "docs/ui-checklist.md",
  ].filter(Boolean);
  if (stale.length) {
    console.error(`DOCS DRIFT: ${stale.join(", ")} out of date; run node scripts/gen-docs.mjs and commit.`);
    process.exit(1);
  }
  console.log("docs up to date");
} else {
  mkdirSync(join(ROOT, "docs"), { recursive: true });
  writeFileSync(join(ROOT, "README.md"), nextReadme);
  writeFileSync(join(ROOT, "docs/components.md"), nextDoc);
  writeFileSync(join(ROOT, "docs/ui-checklist.md"), nextChecklist);
  console.log(`wrote README.md, docs/components.md and docs/ui-checklist.md (${Object.values(parts).flat().length} components)`);
}
