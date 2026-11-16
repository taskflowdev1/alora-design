import type { IncomingMessage, ServerResponse } from "node:http";
import { componentItem, libItem, registryIndex, themeItem } from "../src/lib/kit.js";
import { REGISTRY_ITEMS } from "../src/lib/registry.js";
import { assets, requestInfo, send } from "./_shared.js";

/** GET /r/<name>.json?<settings> (rewritten to /api/r?name=<name>) -> shadcn registry item. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const { config, params } = requestInfo(req);
  const name = (params.get("name") ?? "").replace(/\.json$/, "");
  const a = assets();
  let body: unknown;
  if (name === "theme") body = themeItem(config, a);
  else if (name === "ad") body = libItem(a);
  else if (name === "registry" || name === "index") body = registryIndex(config);
  else {
    const item = REGISTRY_ITEMS.find((i) => i.name === name);
    if (!item) return send(res, 404, "application/json", JSON.stringify({ error: `No component called "${name}"` }));
    body = componentItem(item, config, a);
  }
  send(res, 200, "application/json", JSON.stringify(body, null, 2));
}
