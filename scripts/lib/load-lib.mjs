import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

export const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");

const OPTIONS = { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX };

function resolveSource(spec, from, root) {
  const base = spec.startsWith("@/") ? join(root, "src", spec.slice(2)) : resolve(dirname(from), spec);
  const stem = base.replace(/\.(m?js|tsx?)$/, "");
  for (const p of [base, `${stem}.ts`, `${stem}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) if (/\.tsx?$/.test(p) && existsSync(p)) return p;
  throw new Error(`load-lib: cannot resolve "${spec}" from ${relative(root, from)}`);
}

export async function loadModules(paths, { root = REPO } = {}) {
  const cache = join(REPO, "node_modules/.cache");
  mkdirSync(cache, { recursive: true });
  const tmp = mkdtempSync(join(cache, "ad-lib-"));
  writeFileSync(join(tmp, "package.json"), '{"type":"module"}');
  const out = (src) => join(tmp, relative(root, src).replace(/\.tsx?$/, ".js"));
  const done = new Set();
  const emit = (src) => {
    if (done.has(src)) return;
    done.add(src);
    let js = ts.transpileModule(readFileSync(src, "utf8"), { compilerOptions: OPTIONS, fileName: src }).outputText;
    const specs = ts.preProcessFile(js, true, true).importedFiles.filter((f) => /^(\.{1,2}|@)\//.test(f.fileName));
    for (const f of specs.reverse()) {
      const dep = resolveSource(f.fileName, src, root);
      emit(dep);
      let rel = relative(dirname(out(src)), out(dep));
      if (!rel.startsWith(".")) rel = `./${rel}`;
      const at = js.indexOf(f.fileName, f.pos);
      js = js.slice(0, at) + rel + js.slice(at + f.fileName.length);
    }
    mkdirSync(dirname(out(src)), { recursive: true });
    writeFileSync(out(src), js);
  };
  try {
    const files = paths.map((p) => resolve(root, p));
    files.forEach(emit);
    return await Promise.all(files.map((f) => import(pathToFileURL(out(f)).href)));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** Merged namespace of src/lib/<name>.ts for each name. */
export async function loadLib(names, opts) {
  return Object.assign({}, ...(await loadModules(names.map((n) => `src/lib/${n}.ts`), opts)));
}
