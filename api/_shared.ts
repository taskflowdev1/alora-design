import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { parseConfig, type Config } from "../src/lib/config.js";
import type { Assets } from "../src/lib/kit.js";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

let cache: Assets | null = null;
export function assets(): Assets {
  if (cache) return cache;
  const sources: Record<string, string> = { "ad.ts": read("src/lib/ad.ts"), "ad-hooks.ts": read("src/lib/ad-hooks.ts") };
  // ui files are keyed by name ("button.tsx"); the collections by folder ("ai/thinking-orbs.tsx"), as sourceKey() expects.
  for (const dir of ["ui", "ai", "backgrounds", "mobile"])
    for (const f of readdirSync(join(root, "src/components", dir))) if (f.endsWith(".tsx")) sources[dir === "ui" ? f : `${dir}/${f}`] = read(`src/components/${dir}/${f}`);
  cache = { themeCss: read("src/styles/theme.css"), baseCss: read("src/styles/base.css"), sources };
  return cache;
}

export function requestInfo(req: IncomingMessage): { config: Config; params: URLSearchParams } {
  const url = new URL(req.url ?? "/", "http://local");
  return { config: parseConfig(url.searchParams), params: url.searchParams };
}

export function send(res: ServerResponse, status: number, type: string, body: string, filename?: string) {
  res.statusCode = status;
  res.setHeader("Content-Type", `${type}; charset=utf-8`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  if (filename) res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.end(body);
}
