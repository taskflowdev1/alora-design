import type { IncomingMessage, ServerResponse } from "node:http";
import { checklistMarkdown } from "../src/lib/encyclopedia.js";
import { send } from "./_shared.js";

/** GET /ui-checklist.md (rewritten to /api/checklist) -> the UI checklist agents run every change through. */
export default function handler(_req: IncomingMessage, res: ServerResponse) {
  send(res, 200, "text/markdown", checklistMarkdown());
}
