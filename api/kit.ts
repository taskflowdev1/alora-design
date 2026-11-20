import type { IncomingMessage, ServerResponse } from "node:http";
import { RULES } from "../src/lib/encyclopedia.js";
import { kitMarkdown } from "../src/lib/kit.js";
import { requestInfo, send } from "./_shared.js";

/** GET /api/kit?<settings> -> plain markdown an agent can read, with every must rule from the encyclopedia. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const { config } = requestInfo(req);
  send(res, 200, "text/markdown", kitMarkdown(config, RULES));
}
