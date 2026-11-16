import type { IncomingMessage, ServerResponse } from "node:http";
import { tokensCss, tokensJson } from "../src/lib/config.js";
import { tailwindCss } from "../src/lib/kit.js";
import { assets, requestInfo, send } from "./_shared.js";

/** /tokens.css, /tokens.json and /tailwind.css, all with ?<settings>. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const { config, params } = requestInfo(req);
  const format = params.get("format");
  if (format === "json") return send(res, 200, "application/json", JSON.stringify(tokensJson(config), null, 2), "tokens.json");
  if (format === "tailwind") return send(res, 200, "text/css", tailwindCss(config, assets()), "alora-design.css");
  send(res, 200, "text/css", tokensCss(config), "tokens.css");
}
