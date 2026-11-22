// The showpieces: self-contained, playable components (one per landing moment). Each batch file owns its components'
// demos, Components-page tiles and landing moments, so batches never touch the same lines.
import * as A from "./a";
import * as B from "./b";
import * as C from "./c";
import * as D from "./d";
import * as E from "./e";
import * as F from "./f";
import * as G from "./g";
import * as H from "./h";
import * as I from "./i";
import * as J from "./j";

// H, I, J: real ERP controls (inputs, workflow, documents) with the OTP flow as the model.
const BATCHES = [A, B, C, D, E, F, G, H, I, J];
export const SHOWPIECE_DEMOS = Object.assign({}, ...BATCHES.map((b) => b.DEMOS)) as typeof A.DEMOS;
export const SHOWPIECE_TILES = BATCHES.flatMap((b) => b.TILES);
export const SHOWPIECE_MOMENTS = BATCHES.flatMap((b) => b.MOMENTS);
