// Decides what `scripts/verify --changed [base]` must run. Prints one tab-separated line: scope, smoke sections, reason.
//   full      run everything: shared code, config, tooling, a deleted file, or anything this script can't place
//   sections  every static check and the build, then only the smoke sections that reach a changed file
//   docs      only documentation changed: the static checks, no build or browser
// When in doubt it widens to full. It never narrows on a guess.
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { SECTIONS } from "./lib/smoke-map.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const finish = (scope, sections, reason) => {
  // "-" for no sections: bash `read` collapses empty tab-separated fields.
  console.log([scope, sections.join(",") || "-", reason].join("\t"));
  process.exit(0);
};
const full = (reason) => finish("full", [], reason);
const git = (...args) => execFileSync("git", ["-C", REPO, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

const base = process.argv[2] ?? "origin/main";
let files;
try {
  const from = git("merge-base", base, "HEAD").trim();
  // Committed since the base, staged, unstaged and untracked: everything that differs from the base.
  const lines = [...git("diff", "--name-only", "--no-renames", from).split("\n"), ...git("ls-files", "--others", "--exclude-standard").split("\n")];
  files = [...new Set(lines.filter(Boolean))];
} catch {
  full(`cannot diff against ${base}`);
}

// A Markdown file under src/, api/ or public/ can ship with the site, so only the rest count as documentation.
const isDoc = (f) => !/^(src|api|public)\//.test(f) && (/\.md$/.test(f) || f.startsWith("docs/") || f === "LICENSE");
// Everything imports these, or they configure the whole build.
const SHARED = [/^src\/lib\//, /^src\/styles\//, /^src\/index\.css$/, /^src\/main\.tsx$/, /^src\/site\/(routes|layout|config|config-panel)\.tsx$/];
const code = files.filter((f) => !isDoc(f));
if (!code.length) finish("docs", [], files.length ? `${files.length} documentation file(s)` : "no changes");
for (const f of code) {
  if (!existsSync(join(REPO, f))) full(`${f} was deleted`);
  if (!/^src\/.*\.tsx?$/.test(f)) full(`${f} is config, tooling or an asset`);
  const shared = SHARED.find((r) => r.test(f));
  if (shared) full(`${f} is shared code`);
}

// The import graph, following static imports, dynamic imports and import.meta.glob (the gallery reads components that way).
const resolveImport = (spec, from) => {
  const clean = spec.split("?")[0];
  if (/\.(css|svg|png|webp|jpe?g|json)$/.test(clean)) return null; // Assets outside src code widen to full on their own.
  const path = clean.startsWith("@/") ? join(REPO, "src", clean.slice(2)) : resolve(dirname(from), clean);
  // The API's import graph spells TypeScript files with .js, as its serverless functions need.
  const stem = path.replace(/\.(m?js|tsx?)$/, "");
  const hit = [path, `${stem}.ts`, `${stem}.tsx`, join(path, "index.ts"), join(path, "index.tsx")].find((p) => /\.tsx?$/.test(p) && existsSync(p));
  // An import this can't follow means the graph is incomplete, so nothing can safely be skipped.
  if (!hit) full(`cannot resolve ${spec} from ${relative(REPO, from)}`);
  return hit;
};
const imports = (file) => {
  const src = readFileSync(file, "utf8");
  const out = [];
  // TypeScript's own scanner: a code sample in a string that looks like an import is not one.
  for (const { fileName } of ts.preProcessFile(src, true, true).importedFiles) {
    if (!/^(\.{1,2}|@)\//.test(fileName)) continue;
    const hit = resolveImport(fileName, file);
    if (hit) out.push(hit);
  }
  for (const [, pattern] of src.matchAll(/import\.meta\.glob\(\s*"([^"]+)"/g)) {
    for (const hit of globSync(pattern, { cwd: dirname(file) })) out.push(resolve(dirname(file), hit));
  }
  return out;
};
const closure = (entries) => {
  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    if (/\.tsx?$/.test(file)) imports(file).forEach(walk);
  };
  entries.forEach((e) => walk(join(REPO, e)));
  return new Set([...seen].map((p) => relative(REPO, p)));
};

// The site shell renders on every page, so what it imports is shared code even though no route names it.
const shell = closure(["src/site/layout.tsx"]);
for (const f of code) if (shell.has(f)) full(`${f} is part of the site shell`);

const reach = new Map();
const reaches = (entry) => {
  if (!reach.has(entry)) reach.set(entry, closure([entry]));
  return reach.get(entry);
};
const picked = new Set(Object.entries(SECTIONS).filter(([, s]) => s.always).map(([name]) => name));
for (const f of code) {
  let claimed = false;
  for (const [name, s] of Object.entries(SECTIONS)) {
    if (!s.entries?.some((e) => reaches(e).has(f))) continue;
    picked.add(name);
    claimed = true;
  }
  if (!claimed) full(`no smoke section reaches ${f}`);
}
if (picked.size === Object.keys(SECTIONS).length) full("every smoke section reaches the change");
finish("sections", [...picked], `${code.length} changed file(s), ${picked.size} of ${Object.keys(SECTIONS).length} smoke sections`);
